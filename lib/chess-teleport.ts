import { Chess, type Square, type Color } from "chess.js";

export interface TeleportResult {
  fen: string;
  promoted: boolean;
  wasKing: boolean;
}

export interface TeleportOptions {
  vacated: Square | null;
  sources: Square[];
}

export type GameStatus =
  | { status: "active"; check: boolean }
  | { status: "checkmate"; winner: Color }
  | { status: "resigned"; winner: Color }
  | { status: "stalemate" }
  | { status: "draw" };

function getVacatedSquare(lastMoveFrom: string | null): Square | null {
  return (lastMoveFrom as Square) || null;
}

export function getOwnPieceSquares(fen: string): Square[] {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const squares: Square[] = [];
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.color === turn) squares.push(cell.square);
    }
  }
  return squares;
}

function stripCastlingRights(rights: string, from: string, color: Color): string {
  if (rights === "-") return rights;
  let result = rights;
  const home =
    color === "w"
      ? { king: "e1", kingsideRook: "h1", queensideRook: "a1", K: "K", Q: "Q" }
      : { king: "e8", kingsideRook: "h8", queensideRook: "a8", K: "k", Q: "q" };

  if (from === home.king) {
    result = result.replace(home.K, "").replace(home.Q, "");
  } else if (from === home.kingsideRook) {
    result = result.replace(home.K, "");
  } else if (from === home.queensideRook) {
    result = result.replace(home.Q, "");
  }
  return result.length === 0 ? "-" : result;
}

/**
 * Teleport rule: as an alternative to a normal move, relocate any own piece
 * to the square vacated by the opponent's last moved piece. Illegal if it
 * would leave/put the mover's own king in check. A pawn landing on the last
 * rank auto-promotes to Queen. Destination must be empty (it always is,
 * being the square the opponent's piece just left).
 */
export function applyTeleportMove(fen: string, from: Square, to: Square): TeleportResult | null {
  const chess = new Chess(fen);
  const piece = chess.get(from);
  if (!piece) return null;
  if (piece.color !== chess.turn()) return null;
  if (chess.get(to)) return null;

  chess.remove(from);
  const promoted = piece.type === "p" && (to[1] === "8" || to[1] === "1");
  const placedType = promoted ? "q" : piece.type;
  chess.put({ type: placedType, color: piece.color }, to);

  const parts = chess.fen().split(" ");
  const mover = piece.color;
  parts[1] = mover === "w" ? "b" : "w";
  parts[2] = stripCastlingRights(parts[2], from, mover);
  parts[3] = "-";
  parts[4] = String(Number(parts[4]) + 1);
  if (mover === "b") parts[5] = String(Number(parts[5]) + 1);

  const newFen = parts.join(" ");

  const checkParts = newFen.split(" ");
  checkParts[1] = mover;
  const checkPosition = new Chess(checkParts.join(" "));
  if (checkPosition.inCheck()) return null;

  return { fen: newFen, promoted, wasKing: piece.type === "k" };
}

export function getLegalTeleportSources(fen: string, lastMoveFrom: string | null): TeleportOptions {
  const vacated = getVacatedSquare(lastMoveFrom);
  if (!vacated) return { vacated: null, sources: [] };
  const chess = new Chess(fen);
  if (chess.get(vacated)) return { vacated: null, sources: [] };
  const sources: Square[] = [];
  for (const square of getOwnPieceSquares(fen)) {
    if (applyTeleportMove(fen, square, vacated)) sources.push(square);
  }
  return { vacated, sources };
}

/**
 * Variant-aware end-of-game detection: chess.js only reasons about standard
 * moves, so a position it calls checkmate/stalemate might have an escape
 * via teleport (relocating a piece to block/capture-adjacent or moving the
 * king itself to the vacated square).
 */
export function getGameStatus(fen: string, lastMoveFrom: string | null): GameStatus {
  const chess = new Chess(fen);
  const standardCheckmate = chess.isCheckmate();
  const standardStalemate = chess.isStalemate();

  if (!standardCheckmate && !standardStalemate) {
    if (chess.isDraw()) return { status: "draw" };
    return { status: "active", check: chess.inCheck() };
  }

  const { sources } = getLegalTeleportSources(fen, lastMoveFrom);
  if (sources.length > 0) {
    return { status: "active", check: chess.inCheck() };
  }

  if (standardCheckmate) {
    const winner: Color = chess.turn() === "w" ? "b" : "w";
    return { status: "checkmate", winner };
  }
  return { status: "stalemate" };
}
