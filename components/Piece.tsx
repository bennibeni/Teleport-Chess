import { GLYPHS, LETTERS, type PieceShape } from "../lib/chessTheme";
import { PieceIcon } from "./PieceIcons";

export function Piece({
  color,
  type,
  shape,
}: {
  color: "w" | "b";
  type: string;
  shape: PieceShape;
}) {
  const colorClass = color === "w" ? "piece-w" : "piece-b";

  if (shape === "letters") {
    return <span className={`piece piece-letters ${colorClass}`}>{LETTERS[type]}</span>;
  }

  if (shape === "badge") {
    return (
      <span className={`piece-badge ${colorClass}`}>
        <span className="piece-badge-letter">{LETTERS[type]}</span>
      </span>
    );
  }

  if (shape === "icon") {
    const fill = `var(--piece-fill-${color}, ${color === "w" ? "#f5f5f0" : "#4a4a4a"})`;
    const stroke = "var(--piece-stroke, #1a1a1a)";
    return (
      <span className="piece-icon-wrap">
        <PieceIcon type={type} fill={fill} stroke={stroke} />
      </span>
    );
  }

  return <span className={`piece ${colorClass}`}>{GLYPHS[`${color}${type}`]}</span>;
}
