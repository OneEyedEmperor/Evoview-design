import type { ReactNode } from "react";

export type Locale = "fr" | "en";
export type Tone = "dark" | "light" | "paper";

/** A photograph on the stage. `position` / `scale` let one image serve several options (crop per option). */
export type StageMedia = {
  src: string;
  /** Describes what the visitor sees in this state. */
  alt: string;
  /** CSS object-position, e.g. "64% 44%". */
  position?: string;
  /** Zoom, e.g. 1.3. */
  scale?: number;
};

/** What a stage shows: a photograph, or any rendered node (specimen, drawing, mock). */
export type StageVisual = { media?: StageMedia; render?: ReactNode };

export type SelectorOption = StageVisual & {
  id: string;
  /** Row / chip label (short, one or two words). */
  label: string;
  /** Caption label inside the stage. Defaults to `label`. */
  caption?: string;
  /** One interpreting sentence, announced politely on change. */
  detail: ReactNode;
};

type ChapterCopy = {
  /** Display heading, one entry per line (two short lines). Wrap one word in <em> for the accent. */
  heading: ReactNode[];
  /** ≤ 2 sentences. */
  body?: ReactNode;
  /** Accessible name of the choice group (the question). */
  label: string;
  /** "Exemple fictif" line for demonstrations (illustrative ≠ result). */
  note?: ReactNode;
};

export type SelectorStageContent = ChapterCopy & { options: SelectorOption[] };

export type CompareState = StageVisual & {
  id: string;
  /** Segment label: "Avant", "Après", "Existant"… */
  label: string;
  caption?: string;
  detail?: ReactNode;
};

export type CompareContent = ChapterCopy & { states: [CompareState, CompareState] };

export type AtlasItem = { id: string; label: string; note?: string; media: StageMedia };

export type AtlasContent = ChapterCopy & { items: AtlasItem[] };

export type SelectorStageCopy = {
  /** Stage caption kicker: "Vue · 01". */
  view: string;
  /** Atlas caption kicker: "Cadre · 01". */
  frame: string;
  loading: string;
  failed: string;
  retry: string;
  /** Autoplay toggle (visible text). */
  autoplayPause: string;
  autoplayResume: string;
  /** Screen-reader link between the two alternatives of a pair: "A compared with B". */
  versus: string;
};
