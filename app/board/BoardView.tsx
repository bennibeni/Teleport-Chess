"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { BOARD_THEMES, PIECE_SETS, findBoardTheme, findPieceSet } from "../../lib/chessTheme";
import { Piece } from "../../components/Piece";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export default function BoardView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fenFromUrl = searchParams.get("fen") ?? START_FEN;
  const flip = searchParams.get("flip") === "1";
  const boardTheme = findBoardTheme(searchParams.get("theme") ?? BOARD_THEMES[0].id);
  const pieceSet = findPieceSet(searchParams.get("pieces") ?? PIECE_SETS[0].id);

  const [fenInput, setFenInput] = useState(fenFromUrl);

  const { board, fenError } = useMemo(() => {
    try {
      const chess = new Chess(fenInput);
      return { board: chess.board(), fenError: null as string | null };
    } catch {
      return { board: null, fenError: "That FEN isn't valid — showing the last valid position." };
    }
  }, [fenInput]);

  const { board: fallbackBoard } = useMemo(() => {
    const chess = new Chess(fenFromUrl.length ? fenFromUrl : START_FEN);
    return { board: chess.board() };
  }, [fenFromUrl]);

  const displayBoard = board ?? fallbackBoard;
  const displayRanks = flip ? [...RANKS].reverse() : RANKS;
  const displayFiles = flip ? [...FILES].reverse() : FILES;

  function applyFen() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("fen", fenInput);
    router.replace(`/board?${params.toString()}`);
  }

  return (
    <main className="shell game-shell">
      <p className="eyebrow">bennibenis-projects</p>
      <h1>Position viewer</h1>

      <div className="board-col">
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
              const cell = displayBoard[8 - rank][FILES.indexOf(file)];
              const isLight = (FILES.indexOf(file) + rank) % 2 === 1;
              const showRank = file === displayFiles[0];
              const showFile = rank === displayRanks[0];
              return (
                <div key={`${file}${rank}`} className={`square ${isLight ? "light" : "dark"}`}>
                  {showRank && <span className="coord coord-rank">{rank}</span>}
                  {showFile && <span className="coord coord-file">{file}</span>}
                  {cell && <Piece color={cell.color} type={cell.type} shape={pieceSet.shape} />}
                </div>
              );
            }),
          )}
        </div>

        <div className="appearance-row" style={{ width: "min(92vw, 480px)" }}>
          <div className="appearance-field">
            <label htmlFor="fen-input">FEN</label>
            <input
              id="fen-input"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFen()}
              spellCheck={false}
            />
          </div>
          {fenError && <p className="error">{fenError}</p>}
          <button onClick={applyFen}>Show this position</button>
        </div>
      </div>

      <nav className="links">
        <a href="/">New game</a>
      </nav>
    </main>
  );
}
