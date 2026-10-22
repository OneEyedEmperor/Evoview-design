export type Locale = "fr" | "en";

export type CardTrackVariant = "ribbon" | "portrait";

export type CardTrackMedia = {
  /** Poster image: the card's stable state. Size it for ~2× the card width (≈1100px). */
  src: string;
  /** Empty by default: the card title names the slide. */
  alt?: string;
  /** Optional muted loop. Ribbon: hover preview on fine pointers. Portrait: plays on the active card. */
  video?: string;
  playbackRate?: number;
  fit?: "cover" | "contain";
  /** CSS object-position, e.g. "50% 30%". */
  position?: string;
};

export type CardTrackItem = {
  id: string;
  title: string;
  /** Ribbon: copy under the title, clamped to 3 lines. */
  body?: string;
  /** Portrait: one line under the title (service — place — year). */
  meta?: string;
  /** Ribbon: square tab overlapping the ribbon's top edge (status, novelty). */
  tab?: string;
  media: CardTrackMedia;
};

export type CardTrackDefinition = {
  /** Accessible name of the carousel. */
  label: string;
  variant: CardTrackVariant;
  /** Ribbon colour (ribbon variant). Default "light". */
  ribbon?: "light" | "dark";
  /** `01 / 04` readout at the end of the progress hairline. */
  showIndex?: boolean;
  items: CardTrackItem[];
};

export type CardTrackCopy = {
  /** aria-roledescription of the track and of each card. */
  carousel: string;
  slide: string;
  instructions: string;
  /** Card label and live status, e.g. "Projet 2 sur 4 : Loft Rive". */
  position: (current: number, total: number, title: string) => string;
  /** Spoken name of the card's open action. */
  open: (title: string) => string;
  /** Glass affordance label: fine pointer vs touch. */
  affordance: { pointer: string; touch: string };
  loading: string;
  failed: string;
  retry: string;
};

export type CardTrackConfig = {
  locale: Locale;
  copy: CardTrackCopy;
  tracks: Record<string, CardTrackDefinition>;
};
