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

export type StoryIntroProps = {
  /** The story title (one per story). */
  title: Lines;
  lead: ReactNode;
  body?: ReactNode;
  media: StoryMedia;
  /** Inside the media, on a dark scrim: optional readout kicker (place, moment), one caption line, accent status dot. */
  caption?: { kicker?: ReactNode; title: ReactNode };
  /** Copy bottom-aligned against the title (default) or top-aligned. */
  align?: "end" | "start";
};

export type IndexedRow = {
  label: ReactNode;
  detail: ReactNode;
  /** A real value instead of the automatic 01, 02… (a time, a day, a dose). */
  index?: ReactNode;
};

export type IndexedRowsProps = {
  heading: Lines;
  body?: ReactNode;
  /** An ordered sequence; separated by space and scale, never by rules. */
  rows: readonly IndexedRow[];
  /** One proof beside the sequence: it takes the larger side (first on phones); the heading
   *  tops it and the rows end on its baseline. Without media the rows sit beside the heading. */
  media?: StoryMedia & { ratio?: number; ratioPhone?: number };
  /** Tonal segmentation of the list (never rules): "tiles" = one surface per item with a
   *  small gap (steps) · "rows" = joined alternating rows in one rounded surface (schedules,
   *  timetables). Default: tiles beside media, rows without. */
  surface?: "tiles" | "rows";
};

export type ProofItem = {
  media: StoryMedia;
  /** Width / height chosen from the artefact (1.5, 1.33, 1, .8 …). Below 1 the item pairs up on phones. */
  ratio: number;
  /** Phone ratio; defaults to `ratio`. */
  ratioPhone?: number;
  /** Desktop columns out of 12; default alternates 7/5 then 5/7. */
  span?: number;
  /** One sentence-case line under the media: what the image proves. */
  caption?: ReactNode;
};

export type ProofGridProps = {
  heading?: Lines;
  body?: ReactNode;
  /** "start": heading split above the collage · "end": the images lead and the heading
   *  split follows them (show, then explain). Default "start". */
  headingAt?: "start" | "end";
  items: readonly ProofItem[];
};

export type PayoffCta = {
  label: ReactNode;
  /** Only when the click does something the label doesn't say (leaves the dossier,
   *  opens another site). Shown under the plate as its description. */
  consequence?: ReactNode;
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
  lead?: ReactNode;
  /** Up to three true results (duration, price, capacity); equal columns. */
  results?: readonly PayoffResult[];
  /** Exactly one CTA per story. */
  cta: PayoffCta;
  /** Accent bloom behind the action. Default true. */
  bloom?: boolean;
};

export type StoryChapter =
  | ({ kind: "intro" } & StoryIntroProps)
  | ({ kind: "rows" } & IndexedRowsProps)
  | ({ kind: "proof" } & ProofGridProps)
  | ({ kind: "payoff" } & PayoffBandProps);
