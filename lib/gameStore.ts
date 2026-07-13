import { Chess, type Color, type Square } from "chess.js";
import { randomUUID } from "node:crypto";
import { redisGetGame, redisSaveGame } from "./redis";
import { applyTeleportMove, getGameStatus, type GameStatus } from "./chess-teleport";

export interface GameState {
  id: string;
  fen: string;
  lastMoveFrom: string | null;
  lastMoveTo: string | null;
  lastMoveWasTeleport: boolean;
  status: GameStatus;
  history: string[];
  players: { w: string | null; b: string | null }; // display names / labels
  tokens: { w: string | null; b: string | null }; // server-side auth, never sent to clients directly
  createdAt: number;
  updatedAt: number;
}

export type PublicGameState = Omit<GameState, "tokens">;

export type MoveInput =
  | { kind: "normal"; from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" }
  | { kind: "teleport"; from: Square };

export type Role = "w" | "b" | "spectator";

function toPublic(game: GameState): PublicGameState {
  const { tokens: _tokens, ...publicState } = game;
  return publicState;
}

function newGameState(id: string): GameState {
  const chess = new Chess();
  const now = Date.now();
  return {
    id,
    fen: chess.fen(),
    lastMoveFrom: null,
    lastMoveTo: null,
    lastMoveWasTeleport: false,
    status: { status: "active", check: false },
    history: [],
    players: { w: null, b: null },
    tokens: { w: null, b: null },
    createdAt: now,
    updatedAt: now,
  };
}

export async function createGame(color: Color = "w"): Promise<{ id: string; token: string; color: Color }> {
  const id = randomUUID();
  const game = newGameState(id);
  const token = randomUUID();
  game.tokens[color] = token;
  game.players[color] = "Player 1";
  await redisSaveGame(id, game);
  return { id, token, color };
}

export async function getPublicGame(id: string): Promise<PublicGameState | null> {
  const game = await redisGetGame<GameState>(id);
  if (!game) return null;
  return toPublic(game);
}

/**
 * Determine the caller's role for a game, joining as black if the seat is
 * free and no token was supplied. If a token is supplied and matches a seat,
 * that seat is returned. Otherwise the caller is a read-only spectator.
 */
export async function joinGame(
  id: string,
  existingToken: string | null,
): Promise<{ state: PublicGameState; token: string | null; color: Role } | null> {
  const game = await redisGetGame<GameState>(id);
  if (!game) return null;

  if (existingToken) {
    if (game.tokens.w === existingToken) return { state: toPublic(game), token: existingToken, color: "w" };
    if (game.tokens.b === existingToken) return { state: toPublic(game), token: existingToken, color: "b" };
  }

  const openSeat: Color | null = !game.tokens.w ? "w" : !game.tokens.b ? "b" : null;

  if (openSeat) {
    const token = randomUUID();
    game.tokens[openSeat] = token;
    game.players[openSeat] = "Player 2";
    game.updatedAt = Date.now();
    await redisSaveGame(id, game);
    return { state: toPublic(game), token, color: openSeat };
  }

  return { state: toPublic(game), token: null, color: "spectator" };
}

export async function resignGame(
  id: string,
  token: string,
): Promise<{ ok: true; state: PublicGameState } | { ok: false; error: string }> {
  const game = await redisGetGame<GameState>(id);
  if (!game) return { ok: false, error: "Game not found." };

  const callerColor: Color | null = game.tokens.w === token ? "w" : game.tokens.b === token ? "b" : null;
  if (!callerColor) return { ok: false, error: "You are not a player in this game." };
  if (game.status.status !== "active") return { ok: false, error: "The game has already ended." };

  const winner: Color = callerColor === "w" ? "b" : "w";
  game.status = { status: "resigned", winner };
  game.updatedAt = Date.now();
  await redisSaveGame(id, game);
  return { ok: true, state: toPublic(game) };
}

export async function applyMove(
  id: string,
  token: string,
  move: MoveInput,
): Promise<{ ok: true; state: PublicGameState } | { ok: false; error: string }> {
  const game = await redisGetGame<GameState>(id);
  if (!game) return { ok: false, error: "Game not found." };

  const chess = new Chess(game.fen);
  const turn = chess.turn();
  const callerColor: Color | null = game.tokens.w === token ? "w" : game.tokens.b === token ? "b" : null;

  if (!callerColor) return { ok: false, error: "You are not a player in this game." };
  if (callerColor !== turn) return { ok: false, error: "It is not your turn." };
  if (game.status.status !== "active") return { ok: false, error: "The game has already ended." };

  let newFen: string;
  let sanLike: string;
  let from: string;
  let to: string;
  let wasTeleport: boolean;

  if (move.kind === "teleport") {
    const vacated = game.lastMoveFrom;
    if (!vacated) return { ok: false, error: "No teleport square is available yet." };
    const result = applyTeleportMove(game.fen, move.from, vacated as Square);
    if (!result) return { ok: false, error: "That teleport is not legal (it would leave your king in check, or the piece/square is invalid)." };
    newFen = result.fen;
    from = move.from;
    to = vacated;
    wasTeleport = true;
    sanLike = `${move.from}-${vacated} (teleport${result.promoted ? "=Q" : ""})`;
  } else {
    try {
      const result = chess.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
      if (!result) return { ok: false, error: "Illegal move." };
      newFen = chess.fen();
      from = move.from;
      to = move.to;
      wasTeleport = false;
      sanLike = result.san;
    } catch {
      return { ok: false, error: "Illegal move." };
    }
  }

  const status = getGameStatus(newFen, from);

  game.fen = newFen;
  game.lastMoveFrom = from;
  game.lastMoveTo = to;
  game.lastMoveWasTeleport = wasTeleport;
  game.status = status;
  game.history = [...game.history, sanLike];
  game.updatedAt = Date.now();

  await redisSaveGame(id, game);
  return { ok: true, state: toPublic(game) };
}
