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

// NOTE: light/dark values are intentionally swapped from the original theme
// definitions, per request — what used to render as the light square color
// now renders on the dark squares, and vice versa.
export const BOARD_THEMES: BoardTheme[] = [
  { id: "forest", label: "Forest green", light: "#6e9552", dark: "#ebecd0", coord: "#2f5a25" },
  { id: "ocean", label: "Ocean blue", light: "#5f7f97", dark: "#e8edf1", coord: "#1f3d52" },
  { id: "walnut", label: "Walnut wood", light: "#b58863", dark: "#f0d9b5", coord: "#5a3a1c" },
  { id: "slate", label: "Slate (dark)", light: "#282b30", dark: "#4b4f57", coord: "#d29922" },
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
