// Original flat, bold-outlined SVG chess piece icons — hand-built shapes (not
// a copy of any existing icon set), in a viewBox that lines up across all six.

import type { ReactElement } from "react";

interface PieceIconProps {
  type: string; // "p" | "n" | "b" | "r" | "q" | "k"
  fill: string;
  stroke: string;
}

const BASE = <rect x="11" y="36" width="23" height="4" rx="1" />;
const HIGHLIGHT_PROPS = { fill: "#ffffff", opacity: 0.3 } as const;

function Pawn() {
  return (
    <>
      <circle cx="22.5" cy="15" r="6.5" />
      <path d="M17.5 21 C15 25 15 29.5 17 33 L28 33 C30 29.5 30 25 27.5 21 Z" />
      <rect x="13" y="32.5" width="19" height="3.5" rx="1" />
      {BASE}
      <ellipse cx="20" cy="12.5" rx="2.2" ry="1.4" transform="rotate(-25 20 12.5)" {...HIGHLIGHT_PROPS} />
    </>
  );
}

function Rook() {
  return (
    <>
      <rect x="12" y="14" width="4" height="6" />
      <rect x="20.5" y="14" width="4" height="6" />
      <rect x="29" y="14" width="4" height="6" />
      <rect x="12" y="19.5" width="21" height="4" />
      <path d="M15 23.5 L30 23.5 L31 33 L14 33 Z" />
      {BASE}
      <ellipse cx="16.5" cy="17" rx="1.6" ry="2.2" {...HIGHLIGHT_PROPS} />
    </>
  );
}

function Bishop() {
  return (
    <>
      <circle cx="22.5" cy="9" r="2.3" />
      <path d="M22.5 13 C18 13 16.5 18.5 18.5 23.5 C15.5 26 14.5 30 16.5 33 L28.5 33 C30.5 30 29.5 26 26.5 23.5 C28.5 18.5 27 13 22.5 13 Z" />
      <path d="M18.7 19 L26.3 19" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {BASE}
      <ellipse cx="19.5" cy="17" rx="1.8" ry="2.6" transform="rotate(-15 19.5 17)" {...HIGHLIGHT_PROPS} />
    </>
  );
}

function Knight() {
  return (
    <>
      <path
        d="M30 34 L16 34 C15 34 14 33 14 31.5 C14 27.5 17 26.5 18 23.5
           C16 21.5 16 18.5 18 15.5 C20.5 11.5 25 9.5 29 10.5
           C31 8.5 34.5 9.5 33.5 12.5 C36.5 13.5 37.5 17.5 35 20.5
           L31 20.5 L30 24.5 L33.5 26.5 L33.5 31.5 C33.5 33 32.5 34 30 34 Z"
      />
      <circle cx="30" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      {BASE}
      <ellipse cx="21" cy="16" rx="2.4" ry="1.6" transform="rotate(-30 21 16)" {...HIGHLIGHT_PROPS} />
    </>
  );
}

function Queen() {
  return (
    <>
      <circle cx="13" cy="14" r="2.1" />
      <circle cx="19" cy="11.5" r="2.1" />
      <circle cx="22.5" cy="10.5" r="2.1" />
      <circle cx="26" cy="11.5" r="2.1" />
      <circle cx="32" cy="14" r="2.1" />
      <path d="M13.5 15.5 L31.5 15.5 L29.5 22 L15.5 22 Z" />
      <path d="M17 22 L28 22 L30 33 L15 33 Z" />
      {BASE}
      <ellipse cx="19" cy="18" rx="2.4" ry="1.6" {...HIGHLIGHT_PROPS} />
    </>
  );
}

function King() {
  return (
    <>
      <rect x="21" y="6" width="3" height="7" />
      <rect x="18.5" y="8.5" width="8" height="3" />
      <circle cx="22.5" cy="17" r="2.8" />
      <path d="M15.5 19.5 L29.5 19.5 L28 22 L17 22 Z" />
      <path d="M17 22 L28 22 L30 33 L15 33 Z" />
      {BASE}
      <ellipse cx="19" cy="26" rx="2.6" ry="1.8" {...HIGHLIGHT_PROPS} />
    </>
  );
}

const RENDERERS: Record<string, () => ReactElement> = {
  p: Pawn,
  r: Rook,
  b: Bishop,
  n: Knight,
  q: Queen,
  k: King,
};

export function PieceIcon({ type, fill, stroke }: PieceIconProps) {
  const Renderer = RENDERERS[type];
  if (!Renderer) return null;
  return (
    <svg viewBox="0 0 45 45" width="100%" height="100%" style={{ color: stroke }}>
      <g fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round">
        <Renderer />
      </g>
    </svg>
  );
}
