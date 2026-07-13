"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { applyTeleportMove } from "../../../lib/chess-teleport";
import { BOARD_THEMES, PIECE_SETS, findBoardTheme, findPieceSet } from "../../../lib/chessTheme";
import { Piece } from "../../../components/Piece";

interface PublicGameState {
  id: string;
  fen: string;
  lastMoveFrom: string | null;
  lastMoveTo: string | null;
  lastMoveWasTeleport: boolean;
  status:
    | { status: "active"; check: boolean }
    | { status: "checkmate"; winner: "w" | "b" }
    | { status: "resigned"; winner: "w" | "b" }
    | { status: "stalemate" }
    | { status: "draw" };
  history: string[];
  players: { w: string | null; b: string | null };
  createdAt: number;
  updatedAt: number;
}

type Role = "w" | "b" | "spectator";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const gameId = params.id;

  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<PublicGameState | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);
  const [copied, setCopied] = useState(false);
  const [boardThemeId, setBoardThemeId] = useState(BOARD_THEMES[0].id);
  const [pieceSetId, setPieceSetId] = useState(PIECE_SETS[0].id);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Load the person's last-used appearance (applies across every game, not just this one).
  useEffect(() => {
    const savedTheme = localStorage.getItem("chess-appearance-theme");
    const savedPieces = localStorage.getItem("chess-appearance-pieces");
    if (savedTheme) setBoardThemeId(savedTheme);
    if (savedPieces) setPieceSetId(savedPieces);
  }, []);

  function updateBoardTheme(id: string) {
    setBoardThemeId(id);
    localStorage.setItem("chess-appearance-theme", id);
  }

  function updatePieceSet(id: string) {
    setPieceSetId(id);
    localStorage.setItem("chess-appearance-pieces", id);
  }

  // Join (or resume) this game once on mount.
  useEffect(() => {
    if (!gameId) return;
    const stored = localStorage.getItem(`chess-${gameId}`);
    const storedParsed = stored ? (JSON.parse(stored) as { token: string; color: "w" | "b" }) : null;

    fetch(`/api/game/${gameId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: storedParsed?.token ?? null }),
    })
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setState(data.state);
        setRole(data.color);
        setToken(data.token ?? storedParsed?.token ?? null);
        if (data.token) {
          localStorage.setItem(`chess-${gameId}`, JSON.stringify({ token: data.token, color: data.color }));
        }
      })
      .catch(() => setError("Could not connect to the game."));
  }, [gameId]);

  // Poll for updates.
  useEffect(() => {
    if (!gameId || notFound) return;
    const interval = setInterval(() => {
      fetch(`/api/game/${gameId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.state) setState(data.state);
        })
        .catch(() => {});
    }, 1500);
    return () => clearInterval(interval);
  }, [gameId, notFound]);

  const submitMove = useCallback(
    async (move: { kind: "normal"; from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" } | { kind: "teleport"; from: Square }) => {
      if (!token) return;
      setError(null);
      try {
        const res = await fetch(`/api/game/${gameId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, move }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Move rejected.");
          return;
        }
        setState(data.state);
      } catch {
        setError("Network error while submitting the move.");
      } finally {
        setSelected(null);
        setPromotionPending(null);
      }
    },
    [gameId, token],
  );

  const handleResign = useCallback(async () => {
    if (!token) return;
    if (!window.confirm("Resign this game? This can't be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/game/${gameId}/resign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not resign.");
        return;
      }
      setState(data.state);
    } catch {
      setError("Network error while resigning.");
    }
  }, [gameId, token]);

  if (notFound) {
    return (
      <main className="shell">
        <h1>Game not found</h1>
        <p className="lede">This game link is invalid or the game has expired.</p>
        <nav className="links">
          <a href="/">&larr; Start a new game</a>
        </nav>
      </main>
    );
  }

  if (!state || !role) {
    return (
      <main className="shell">
        <h1>Teleport Chess</h1>
        <p className="lede">Loading…</p>
      </main>
    );
  }

  const chess = new Chess(state.fen);
  const turn = chess.turn();
  const isMyTurn = (role === "w" || role === "b") && role === turn && state.status.status === "active";
  const board = chess.board();

  const legalDestinations: Square[] = selected
    ? chess.moves({ square: selected, verbose: true }).map((m) => m.to as Square)
    : [];

  const vacated = state.lastMoveFrom as Square | null;
  const teleportAvailable =
    isMyTurn && selected !== null && vacated !== null && applyTeleportMove(state.fen, selected, vacated) !== null;

  const opponentColor = role === "w" ? "b" : role === "b" ? "w" : null;
  const showInvite = opponentColor !== null && state.players[opponentColor] === null;
  const canResign = (role === "w" || role === "b") && state.status.status === "active";

  const flip = role === "b";
  const displayRanks = flip ? [...RANKS].reverse() : RANKS;
  const displayFiles = flip ? [...FILES].reverse() : FILES;
  const topColor: "w" | "b" = flip ? "w" : "b";
  const bottomColor: "w" | "b" = flip ? "b" : "w";

  function handleSquareClick(square: Square) {
    if (!isMyTurn) return;
    const piece = chess.get(square);

    if (selected && legalDestinations.includes(square)) {
      const movingPiece = chess.get(selected);
      const isPromotion = movingPiece?.type === "p" && (square[1] === "8" || square[1] === "1");
      const from = selected;
      if (isPromotion) {
        setPromotionPending({ from, to: square });
      } else {
        setTimeout(() => submitMove({ kind: "normal", from, to: square }), 150);
      }
      return;
    }

    if (piece && piece.color === role) {
      setSelected(square === selected ? null : square);
      return;
    }

    setSelected(null);
  }

  function statusLine(): { text: string; className: string } {
    if (state!.status.status === "checkmate") {
      const winnerLabel = state!.status.winner === "w" ? "White" : "Black";
      return { text: `Checkmate — ${winnerLabel} wins.`, className: "over" };
    }
    if (state!.status.status === "resigned") {
      const winnerLabel = state!.status.winner === "w" ? "White" : "Black";
      return { text: `${winnerLabel} wins — opponent resigned.`, className: "over" };
    }
    if (state!.status.status === "stalemate") return { text: "Stalemate — draw.", className: "over" };
    if (state!.status.status === "draw") return { text: "Draw.", className: "over" };

    const turnLabel = turn === "w" ? "White" : "Black";
    const check = state!.status.status === "active" && state!.status.check ? " — check!" : "";
    if (role === "spectator") return { text: `${turnLabel} to move${check} (spectating)`, className: "theirs" };
    if (isMyTurn) return { text: `Your move${check}`, className: check ? "check" : "mine" };
    return { text: `Waiting for opponent${check}`, className: "theirs" };
  }

  const line = statusLine();
  const boardTheme = findBoardTheme(boardThemeId);
  const pieceSet = findPieceSet(pieceSetId);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function renderPlayerBar(color: "w" | "b") {
    const isTurn = state!.status.status === "active" && turn === color;
    const name = state!.players[color] ?? "Waiting…";
    return (
      <div className={`player-bar${isTurn ? " active" : ""}`}>
        <div className={`avatar ${color}`}>{color === "w" ? "W" : "B"}</div>
        <div className="player-meta">
          <span className="player-name">{name}</span>
          <span className="player-role">{color === "w" ? "White" : "Black"}</span>
        </div>
        <span className={`turn-dot ${isTurn ? "on" : "off"}`} title={isTurn ? "To move" : undefined} />
      </div>
    );
  }

  return (
    <main className="shell game-shell">
      <p className="eyebrow">bennibenis-projects</p>
      <h1>Teleport Chess</h1>
      {error && <p className="error">{error}</p>}

      <div className="game-layout">
        <div className="board-col">
          {showInvite && (
            <div className="share-box">
              <input readOnly value={typeof window !== "undefined" ? window.location.href : ""} />
              <button className="secondary" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</button>
            </div>
          )}

          {renderPlayerBar(topColor)}

          <div
            className="board"
            style={{
              "--board-light": boardTheme.light,
              "--board-dark": boardTheme.dark,
              "--coord-color": boardTheme.coord,
              "--piece-fill-w": pieceSet.fillW,
              "--piece-fill-b": pieceSet.fillB,
              "--piece-stroke": pieceSet.stroke,
            } as React.CSSProperties}
          >
            {displayRanks.map((rank) =>
              displayFiles.map((file) => {
                const square = `${file}${rank}` as Square;
                const cell = board[8 - rank][FILES.indexOf(file)];
                const isLight = (FILES.indexOf(file) + rank) % 2 === 1;
                const showRank = file === displayFiles[0];
                const showFile = rank === displayRanks[0];
                const classes = [
                  "square",
                  isLight ? "light" : "dark",
                  isMyTurn ? "selectable" : "",
                  selected === square ? "selected" : "",
                  legalDestinations.includes(square) ? "legal-move" : "",
                  vacated === square ? "vacated" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={square} className={classes} onClick={() => handleSquareClick(square)}>
                    {showRank && <span className="coord coord-rank">{rank}</span>}
                    {showFile && <span className="coord coord-file">{file}</span>}
                    {cell && <Piece color={cell.color} type={cell.type} shape={pieceSet.shape} />}
                  </div>
                );
              }),
            )}
          </div>

          {renderPlayerBar(bottomColor)}

          {promotionPending && (
            <div
              className="promo-picker"
              style={{
                "--piece-fill-w": pieceSet.fillW,
                "--piece-fill-b": pieceSet.fillB,
                "--piece-stroke": pieceSet.stroke,
              } as React.CSSProperties}
            >
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() =>
                    submitMove({ kind: "normal", from: promotionPending.from, to: promotionPending.to, promotion: p })
                  }
                >
                  {role && <Piece color={role === "spectator" ? "w" : role} type={p} shape={pieceSet.shape} />}
                </button>
              ))}
            </div>
          )}

          <div className="board-actions">
            <button
              className="ghost"
              disabled={!teleportAvailable}
              onClick={() => selected && submitMove({ kind: "teleport", from: selected })}
            >
              {vacated ? `Teleport to ${vacated}` : "Teleport unavailable"}
            </button>
          </div>
        </div>

        <div className="sidebar">
          <div className="panel">
            <div className={`panel-head ${line.className}`}>{line.text}</div>
            <div className={state.history.length > 0 ? "panel-body panel-history" : "panel-body empty"}>
              {state.history.length > 0
                ? state.history.map((entry, i) => (
                    <span key={i}>
                      {i % 2 === 0 ? `${i / 2 + 1}. ` : ""}
                      {entry}{" "}
                    </span>
                  ))
                : "No moves yet"}
            </div>
          </div>

          <div className="panel">
            <button className="resign-button" disabled={!canResign} onClick={handleResign}>
              ⚑ Resign
            </button>
          </div>

          <div className="panel">
            <div className="panel-head">Appearance</div>
            <div className="panel-body appearance-row">
              <div className="appearance-field">
                <label htmlFor="board-theme">Board</label>
                <select id="board-theme" value={boardThemeId} onChange={(e) => updateBoardTheme(e.target.value)}>
                  {BOARD_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="appearance-field">
                <label htmlFor="piece-set">Pieces</label>
                <select id="piece-set" value={pieceSetId} onChange={(e) => updatePieceSet(e.target.value)}>
                  {PIECE_SETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head rule-panel-head">✦ Teleport rule</div>
            <div className="panel-body rule-panel-body">
              Instead of a normal move, you may relocate any one of your pieces to the square your
              opponent&apos;s last-moved piece just vacated (highlighted on the board). This can&apos;t leave or
              put your own king in check. A pawn teleported to the last rank automatically promotes to a Queen.
            </div>
          </div>
        </div>
      </div>

      <nav className="links">
        <a href="/">New game</a>
        <a href="https://links-page-bennibeni.vercel.app/" target="_blank" rel="noreferrer">All projects</a>
      </nav>
    </main>
  );
}
