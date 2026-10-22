import type { MouseEventHandler, ReactNode } from "react";

/** One string per display line; lines break by meaning, never by width. */
export type Lines = ReactNode | readonly ReactNode[];

export type StoryMedia = {
  src: string;
  /** Describe the artefact, not "image of". */
  alt: string;
  /** object-position from 640px up, e.g. "50% 40%". */
  position?: string;
  /** object-position below 640px (the 4:5 / relaxed phone crops). Defaults to `position`. */
  positionPhone?: string;
  /** "contain" for UI captures and packshots that must not be cropped. */
  fit?: "cover" | "contain";
};

/** Override the automatic base / alt alternation of a chapter. */
export type Band = "base" | "alt";

export type StoryIntroProps = {
  /** The story title (one per story). */
  title: Lines;
  lead: ReactNode;
  body?: ReactNode;
  media: StoryMedia;
  /** Caption inside the media: readout kicker + caption title + accent status dot. */
  caption: { kicker: ReactNode; title: ReactNode };
  /** Copy bottom-aligned against the title (default) or top-aligned. */
  align?: "end" | "start";
  band?: Band;
};

export type IndexedRow = { label: ReactNode; detail: ReactNode };

export type IndexedRowsProps = {
  heading: Lines;
  body?: ReactNode;
  rows: readonly IndexedRow[];
  /** "split": heading .72 | rows 1.28 · "full": heading/body split above full-width rows. */
  layout?: "split" | "full";
  band?: Band;
};

export type ProofItem = {
  media: StoryMedia;
  /** Width / height chosen from the artefact (1.83, 1.5, 1.33, 1, .8 …). */
  ratio: number;
  /** Phone ratio; default relaxes `ratio` toward 1 (clamped to .88–1.25). */
  ratioPhone?: number;
  /** Caption `NN / LABEL`. */
  label: ReactNode;
  /** Right-hand caption qualifier (framing, material, place). */
  qualifier?: ReactNode;
};

export type ProofGridProps = {
  heading?: Lines;
  body?: ReactNode;
  /** Laid out in pairs, 7/5 then 5/7 on 12 columns. */
  items: readonly ProofItem[];
  /** 2–3 short lines under a short accent rule. */
  note?: Lines;
  band?: Band;
};

export type Pillar = { label: ReactNode; heading: Lines; copy: ReactNode };

export type RuledPillarsProps = {
  heading?: Lines;
  body?: ReactNode;
  /** Exactly three facts. */
  pillars: readonly [Pillar, Pillar, Pillar];
  band?: Band;
};

export type PayoffCta = {
  label: ReactNode;
  /** What the click does, e.g. "Ouvre la réservation". Shown under the plate. */
  consequence: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

export type PayoffResult = { title: ReactNode; detail: ReactNode };

export type PayoffBandProps = {
  /** 2–3 short statement lines. */
  lines: readonly ReactNode[];
  /** 0-based line taking the accent (optional, at most one). */
  accentLine?: number;
  lead: ReactNode;
  /** Up to three results; equal columns (true peers). */
  results?: readonly PayoffResult[];
  /** Exactly one CTA per story. */
  cta: PayoffCta;
  /** Accent bloom top-right. Default true. */
  bloom?: boolean;
  band?: Band;
};

export type StoryChapter =
  | ({ kind: "intro" } & StoryIntroProps)
  | ({ kind: "rows" } & IndexedRowsProps)
  | ({ kind: "proof" } & ProofGridProps)
  | ({ kind: "pillars" } & RuledPillarsProps)
  | ({ kind: "payoff" } & PayoffBandProps);
