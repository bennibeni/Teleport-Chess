// Central place to add/tweak board color themes and piece appearance.
// To add a new board theme or piece set, just add an entry to the arrays below —
// nothing else in the app needs to change.

export interface BoardTheme {
  id: string;
  label: string;
  light: string; // light square color
  dark: string; // dark square color
  coord: string; // rank/file label color
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: "forest", label: "Forest green", light: "#ebecd0", dark: "#6e9552", coord: "#2f5a25" },
  { id: "ocean", label: "Ocean blue", light: "#e8edf1", dark: "#5f7f97", coord: "#1f3d52" },
  { id: "walnut", label: "Walnut wood", light: "#f0d9b5", dark: "#b58863", coord: "#5a3a1c" },
  { id: "slate", label: "Slate (dark)", light: "#4b4f57", dark: "#282b30", coord: "#d29922" },
];

export type PieceShape = "glyph" | "letters" | "badge" | "icon";

export interface PieceSet {
  id: string;
  label: string;
  shape: PieceShape;
  fillW: string; // white piece fill color
  fillB: string; // black piece fill color
  stroke: string; // outline color used by glyph/letters/badge/icon border
}

export const PIECE_SETS: PieceSet[] = [
  { id: "classic-ivory", label: "Classic — ivory / charcoal", shape: "glyph", fillW: "#f5f5f0", fillB: "#3f3f3f", stroke: "#1a1a1a" },
  { id: "classic-gold", label: "Classic — gold / navy", shape: "glyph", fillW: "#f2c14e", fillB: "#274b7a", stroke: "#141414" },
  { id: "letters", label: "Letters", shape: "letters", fillW: "#f5f5f0", fillB: "#3f3f3f", stroke: "#1a1a1a" },
  { id: "badges", label: "Badges", shape: "badge", fillW: "#f5f5f0", fillB: "#3f3f3f", stroke: "#1a1a1a" },
  { id: "icons", label: "Icons — flat outlined", shape: "icon", fillW: "#f5f5f0", fillB: "#4a4a4a", stroke: "#1a1a1a" },
];

// Unicode glyph piece set (used when a PieceSet's shape is "glyph")
export const GLYPHS: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

// Letter abbreviations (used by "letters" and "badge" shapes)
export const LETTERS: Record<string, string> = {
  p: "P", n: "N", b: "B", r: "R", q: "Q", k: "K",
};

export function findBoardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}

export function findPieceSet(id: string): PieceSet {
  return PIECE_SETS.find((p) => p.id === id) ?? PIECE_SETS[0];
}
