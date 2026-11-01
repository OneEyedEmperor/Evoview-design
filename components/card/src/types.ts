export type Locale = "fr" | "en";

export const CARD_TRACK_VARIANTS = ["portrait", "ribbon"] as const;
export type CardTrackVariant = (typeof CARD_TRACK_VARIANTS)[number];

/** CardDeck desktop rows of three: 2 (six cards, the deck deal) or 1 (three cards). */
export const CARD_DECK_ROWS = [2, 1] as const;
export type CardDeckRows = (typeof CARD_DECK_ROWS)[number];

/** Card title level: one below the section heading the composition sits under. */
export type CardHeadingLevel = 2 | 3 | 4;

export type CardTrackMedia = {
  /** Poster image: the card's stable state. A still: ~2× the card width. With `video`: the loop's first frame at the loop's size and ratio. */
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
  /** The card's destination: the open target becomes a real link (crawlable view, page). A plain click still runs `onOpen` when given. */
  href?: string;
  /** Opens `href` in a new tab (external page). */
  external?: boolean;
};

export type CardTrackDefinition = {
  /** Accessible name of the carousel. */
  label: string;
  variant: CardTrackVariant;
  /** Ribbon colour (ribbon variant). Default "light". */
  ribbon?: "light" | "dark";
  /** @deprecated Ignored (RULES §1: no counting readouts; the hairline is the position). Kept so older configs compile. */
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
  /** Appended to an external card's accessible name, e.g. "(nouvel onglet)". */
  newTab?: string;
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

/* ── CardSequence (card-sequence block) ─────────────────────────────── */

/** board: a few clips beside facts, then an offer and one action (home teaser).
    gallery: every clip in one row (the page's own section). */
export const CARD_SEQUENCE_LAYOUTS = ["gallery", "board"] as const;
export type CardSequenceLayout = (typeof CARD_SEQUENCE_LAYOUTS)[number];

export type CardSequenceClip = {
  id: string;
  title: string;
  /** One line under the title (place, use, moment). No kicker above the title. */
  meta?: string;
  /** Poster image: the stable state, the loop's first frame at the loop's own size and ratio. */
  poster: string;
  /** Muted loop, played only while the card holds the focus. */
  video?: string;
  /** CSS object-position, e.g. "50% 30%". */
  position?: string;
  /** The client's destination for this card (page, profile). Never an Evoview referral. */
  href?: string;
  /** Opens `href` in a new tab (external profile). */
  external?: boolean;
};

export type CardSequenceFact = { title: string; body: string };

export type CardSequenceOffer = {
  /** The scene's one accent display word, e.g. "240 €". */
  value: string;
  unit?: string;
  note?: string;
  action?: { label: string; href: string };
};

export type CardSequenceDefinition = {
  title: string;
  /** A word of `title` set in the accent. */
  accent?: string;
  lead?: string;
  clips: CardSequenceClip[];
  /** Board only: tiles beside the clips (three read best; phones keep two). */
  facts?: CardSequenceFact[];
  /** Board only: the row after the clips. */
  offer?: CardSequenceOffer;
  /** Dwell per card, ms. Default 2000 (approved). */
  dwellMs?: number;
  /** Card aspect ratio from the footage, CSS `w / h`. Default "9 / 16". */
  ratio?: string;
  /** Decorative Evoview watermark on each card (aria-hidden, .12). Default true. */
  watermark?: boolean;
};

export type CardSequenceCopy = {
  /** Appended to an external card's accessible name. */
  newTab: string;
  loading: string;
  failed: string;
  retry: string;
};

export type CardSequenceConfig = {
  locale: Locale;
  copy: CardSequenceCopy;
  sequences: Record<string, CardSequenceDefinition>;
};
/* ── end CardSequence ───────────────────────────────────────────────── */

/* ── CardDeck ─────────────────────────────────────────────────────────── */

export type CardDeckCategory = {
  id: string;
  /** Switch label: one or two short words (four fit a phone). */
  label: string;
  /** The deck deals the first 3 (one row) or 6 (two rows), on the desktop grid and the phone strip alike. */
  items: CardTrackItem[];
};

export type CardDeckDefinition = {
  /** Accessible name of the card panel. */
  label: string;
  /** Accessible name of the category switch. */
  switchLabel: string;
  /** The first category opens the deck: a curated selection (one column per category) or the main one. */
  categories: CardDeckCategory[];
  /** The whole catalogue (menu, portfolio) beyond the dealt cards. */
  more?: { label: string; href: string };
};

export type CardDeckCopy = CardTrackCopy & {
  /** Live status after a switch, e.g. "Mobilier : 6 projets". */
  showing: (category: string, count: number) => string;
};

export type CardDeckConfig = {
  locale: Locale;
  copy: CardDeckCopy;
  deck: CardDeckDefinition;
};
/* ── /CardDeck ────────────────────────────────────────────────────────── */
