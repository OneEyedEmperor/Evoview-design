import type { ReactNode } from "react";

/* One glyph per library entry for the title strip's player, drawn on a
   48 grid: white strokes, a dim second tier, one accent mark that follows
   the picked accent (--showcase-accent). Each glyph names the package's
   signature, not its screenshot. */

const INK = "rgb(255 255 255 / 0.92)";
const DIM = "rgb(255 255 255 / 0.32)";
const ACCENT = "var(--showcase-accent, #818cf8)";
const WELL = "#141418";

const GLYPH: Record<string, ReactNode> = {
  // Section shell hard-cut into a paper tone, display heading on top.
  chapter: (
    <>
      <rect x="6" y="8" width="36" height="32" rx="4" />
      <path d="M6 27h36v9a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill={INK} stroke="none" />
      <path d="M11 14h4" stroke={ACCENT} />
      <path d="M11 19h20M11 23h12" />
    </>
  ),
  // One card in focus between two stepped-back ones, over its scrub line.
  "card-track": (
    <>
      <rect x="4" y="12" width="9" height="17" rx="2.5" stroke={DIM} />
      <rect x="35" y="12" width="9" height="17" rx="2.5" stroke={DIM} />
      <rect x="16" y="8" width="16" height="25" rx="3" />
      <path d="M19.5 28h9" stroke={DIM} />
      <path d="M6 40h36" stroke={DIM} />
      <path d="M17 40h14" stroke={ACCENT} />
    </>
  ),
  // Timed steps: two done, the live one opening its dossier, one ahead.
  "process-sequence": (
    <>
      <rect x="21" y="6" width="18" height="11" rx="2.5" />
      <path d="M25 11.5h10" stroke={DIM} />
      <path d="M30 17v8.5" />
      <path d="M11.5 30h7M22.5 30h3.5M34 30h4" stroke={DIM} />
      <circle cx="8" cy="30" r="3.5" fill={INK} stroke="none" />
      <circle cx="19" cy="30" r="3.5" fill={INK} stroke="none" />
      <circle cx="30" cy="30" r="4.5" stroke={ACCENT} />
      <circle cx="30" cy="30" r="2" fill={ACCENT} stroke="none" />
      <circle cx="41.5" cy="30" r="3.5" stroke={DIM} />
      <path d="M6 40h36" stroke={DIM} />
      <path d="M6 40h22" />
    </>
  ),
  // The 7/5 ↔ 5/7 proof collage.
  "story-blocks": (
    <>
      <rect x="6" y="8" width="20" height="15" rx="2.5" fill={INK} stroke="none" />
      <rect x="29" y="8" width="13" height="15" rx="2.5" stroke={DIM} />
      <rect x="6" y="26" width="13" height="14" rx="2.5" stroke={DIM} />
      <rect x="22" y="26" width="20" height="14" rx="2.5" fill={ACCENT} stroke="none" />
    </>
  ),
  // The month grid with the guest's day chosen.
  reservation: (
    <>
      <rect x="7" y="10" width="34" height="30" rx="4" />
      <path d="M15 6.5v7M33 6.5v7" />
      <path d="M7 18h34" stroke={DIM} />
      {[24, 29.5, 35].map((y) =>
        [13, 18.5, 24, 29.5, 35].map((x) =>
          x === 29.5 && y === 29.5 ? null : <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" fill={DIM} stroke="none" />,
        ),
      )}
      <circle cx="29.5" cy="29.5" r="3.6" fill={ACCENT} stroke="none" />
    </>
  ),
  // A folder with its sheet drawn out, bookmarked.
  dossier: (
    <>
      <path d="M6 20v-8a3 3 0 0 1 3-3h8.5l3 3H39a3 3 0 0 1 3 3v5" stroke={DIM} />
      <rect x="11" y="13" width="26" height="16" rx="2" fill={WELL} />
      <path d="M15 18h12" stroke={DIM} />
      <path d="M31 13v6l2-1.5 2 1.5v-6" fill={ACCENT} stroke={ACCENT} strokeWidth="1" />
      <rect x="5" y="22" width="38" height="18" rx="3" fill={WELL} />
    </>
  ),
  // One stage split by the before/after handle.
  "selector-stage": (
    <>
      <path d="M9 9h15v30H9a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z" fill="rgb(255 255 255 / 0.1)" stroke="none" />
      <rect x="5" y="9" width="38" height="30" rx="4" />
      <circle cx="35" cy="16.5" r="2.6" fill={ACCENT} stroke="none" />
      <path d="M24 34l5.5-5.5 4 3.5 4.5-4.5 5 5" stroke={DIM} />
      <path d="M24 9v30" />
      <circle cx="24" cy="24" r="5.5" fill={INK} stroke="none" />
      <path d="M22.4 22l-2 2 2 2M25.6 22l2 2-2 2" stroke={WELL} strokeWidth="1.2" />
    </>
  ),
  // The control family: a lit switch, a chip, a scrubbed range.
  controls: (
    <>
      <rect x="6" y="9" width="22" height="13" rx="6.5" fill={ACCENT} stroke="none" />
      <circle cx="21.5" cy="15.5" r="4.5" fill={INK} stroke="none" />
      <rect x="32" y="9" width="10" height="13" rx="6.5" stroke={DIM} />
      <path d="M6 33h36" stroke={DIM} />
      <path d="M6 33h20" />
      <circle cx="26" cy="33" r="4" fill={INK} stroke="none" />
    </>
  ),
  // The finder capsule with its live pill, a cover tray dropped from it.
  navbar: (
    <>
      <rect x="4" y="8" width="40" height="12" rx="6" />
      <circle cx="10.5" cy="14" r="2.2" fill={ACCENT} stroke="none" />
      <path d="M16 14h5M33.5 14h5" stroke={DIM} />
      <path d="M25 14h5" />
      <rect x="18.5" y="24" width="18" height="16" rx="3" stroke={DIM} />
      <rect x="21.5" y="27" width="12" height="5" rx="1.5" fill={INK} stroke="none" />
      <path d="M22.5 36h10" stroke={DIM} />
    </>
  ),
};

export function EntryIcon({ id, className }: { id: string; className?: string }) {
  const glyph = GLYPH[id];
  if (!glyph) return null;
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke={INK}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
}
