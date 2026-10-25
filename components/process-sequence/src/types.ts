import type { ReactNode } from "react";

export type Locale = "fr" | "en";

export type StepMedia = {
  src: string;
  /** Video poster (shown while idle / complete). */
  poster?: string;
  /** Guessed from the extension when omitted. */
  type?: "image" | "video";
  /** Empty = decorative. */
  alt?: string;
};

/** What the dossier shows for a step (optional: a step without it is not openable). */
export type StepDetail = {
  /** Heading lines (one display level, uppercase). */
  heading: string[];
  intro: string;
  /** Numbered label items, ≤ 5 words / 42 characters each. Longer copy belongs in `intro`. */
  items: string[];
  objective?: string;
};

export type ProcessStep = {
  /** URL-safe slug (`a-z`, `0-9`, `-`): the step's view key (`<base>/<id>/`). */
  id: string;
  /** Card title (≈ 20 characters; it types in). */
  title: string;
  /** Segment caption above the instrument; defaults to `title`. */
  caption?: string;
  /** Card description, one or two sentences. */
  summary: string;
  media: StepMedia;
  /** Overrides `durations[i]`. */
  durationMs?: number;
  /** Overrides the config's completion mark for this step (client icon). */
  mark?: ReactNode;
  detail?: StepDetail;
};

/** Centred mark drawn on a completed card: a check, the step numeral or the client's icon (`step.mark`). Never an eye. */
export type CompletionMark = "check" | "numeral" | "icon";

export type ProcessSequenceCopy = {
  /** Small readout above the heading (optional). */
  kicker?: string;
  title: ReactNode;
  /** Accessible name of the segmented instrument and of the phone index. */
  instrumentLabel: string;
  status: { idle: string; active: string; complete: string };
  /** Spoken step position, e.g. "Étape 2 sur 4". */
  stepOf: (current: number, total: number) => string;
  /** Appended to a card's accessible name when it opens the dossier. */
  openHint: string;
  dossier: {
    label: string;
    close: string;
    previous: string;
    next: string;
    progress: string;
    objective: string;
    loading: string;
    failed: string;
    retry: string;
  };
  /** Accessible name of the Evoview mark (names Evoview and the new tab). */
  attributionLabel: string;
};

export type ProcessSequenceCta = { label: string; href?: string; onClick?: () => void };

export type ProcessSequenceConfig = {
  locale: Locale;
  /** 3–6 steps, read in Z order on two columns. */
  steps: ProcessStep[];
  /** Per-step dwell in ms. Default 4000 / 4000 / 4000 / 6000 (last step longest). */
  durations?: number[];
  completionMark?: CompletionMark;
  copy: ProcessSequenceCopy;
  /** Replaces "next" on the dossier's last step: the client's main action. */
  cta?: ProcessSequenceCta;
  /** Approved Evoview mark in the dossier's stage strip. On by default. */
  attribution?: { enabled: boolean; href?: string };
};

export type StepState = "idle" | "active" | "complete";

/** An open step dossier (docs/CRAWLABLE-MODALS.md §1): a step id, level 1. Only steps with `detail` are views. */
export type ProcessSequenceView = { step: string };
