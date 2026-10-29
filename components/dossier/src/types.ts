import type { ReactNode } from "react";
import type { MediaSource } from "../foundation";

export type Locale = "fr" | "en";

/** panorama: the wide desktop shell (header strip, chapter strip, asymmetric mosaic), the phone / tablet chrome below 1024.
    sheet: the phone / tablet composition at every width (glass capsule, glass dock, symmetric board), a narrow portrait shell from 1024. */
export const DOSSIER_COMPOSITIONS = ["panorama", "sheet"] as const;
export type DossierComposition = (typeof DOSSIER_COMPOSITIONS)[number];

/** graded: tile media desaturated and dimmed at rest, releasing colour on hover / focus / touch-cycle focus.
    true-colour: the photo as shot in every state; the frame (border, edge, numeral, shine, scale) carries the state. */
export const DOSSIER_TILE_MEDIA = ["graded", "true-colour"] as const;
export type DossierTileMedia = (typeof DOSSIER_TILE_MEDIA)[number];

/** entrance: a page loaded on a view URL plays the same media-gated entrance as an in-page open.
    at-rest: that first view is the settled view from the first paint (server HTML included) and hydrates in place:
    no hold, no entrance; its images load like any page's (preload them in the head, `dossierViewMedia`).
    In-page opens and every later view keep the entrance. */
export const DOSSIER_DIRECT_LOADS = ["entrance", "at-rest"] as const;
export type DossierDirectLoad = (typeof DOSSIER_DIRECT_LOADS)[number];

export type DossierMedia = {
  src: string;
  /** "video" plays muted, looped, inline. Guessed from the extension when omitted. */
  type?: "image" | "video";
  poster?: string;
  srcSet?: string;
  sizes?: string;
  /** object-position, e.g. "50% 40%". */
  position?: string;
  /** "contain" for UI captures and diagrams. Default "cover". */
  fit?: "cover" | "contain";
  /** Describes the media where it stands for the view (`dossierRoutes.head` image). The board tile itself stays decorative. Default: the entry title. */
  alt?: string;
};

export type DossierEntryContext = {
  item: DossierItem;
  entry: DossierEntry;
  /** 0-based position of the entry in its item. */
  index: number;
  total: number;
  /** Closes the whole dossier (use for the one exit CTA). */
  close: () => void;
  toOverview: () => void;
};

export type DossierEntry = {
  id: string;
  /** Tile title and spoken name. */
  title: string;
  /** Short tab / dock label. Default: title. */
  label?: string;
  /** Optional readout above the tile title ("7 services · 78 €"). */
  kicker?: string;
  /** Tile media; also decoded before the detail opens. */
  media: DossierMedia;
  /** Further detail media, decoded before the detail is revealed. */
  sources?: MediaSource[];
  /** One or two sentences from the detail's own copy: the view's meta description (`dossierRoutes.head`, cut to 160 characters). Default: title, kicker and item. */
  description?: string;
  /** The detail: a stack of `DossierChapter`s (or any chapter blocks). */
  content: (ctx: DossierEntryContext) => ReactNode;
};

export type DossierItem = {
  id: string;
  /** Pager / dock / kicker label. */
  label: string;
  /** Per-item accent: sets --primary on the dossier while this item is shown. Omit to follow the host. */
  accent?: string;
  /** Ink on the accent; computed from `accent` when omitted. */
  accentInk?: string;
  /** The board. Four make the panorama's asymmetric mosaic (2×2 in the sheet); any other count, from zero, is laid out on
      the symmetric grid (two columns from 600, one below; an odd count's first tile spans the row). */
  entries: DossierEntry[];
  /** The overview's meta description (`dossierRoutes.head`, cut to 160 characters). Default: the label and the entry titles. */
  description?: string;
  /** Live content still loading: the item's views wait behind the loader, and `parse` accepts its entry keys (a deep link
      waits for them). Set false once the data is in, whatever it holds. */
  pending?: boolean;
  /** Board shown when the item has no entries (and is not pending). Default: `copy.empty`. */
  empty?: { title: string; body?: string };
  /** Opening screen tile: media (default: the first entry's) and a one-line readout over the label. */
  cover?: DossierMedia;
  kicker?: string;
};

/** An optional level above the items: a symmetric choice between them, with its own view and URL. */
export type DossierOpening = {
  /** URL slug of the opening view (`[a-z0-9-]`, distinct from every item id). */
  id: string;
  /** The view's h1 and head title. */
  title: string;
  /** Short name: phone readout, the way back ("‹ Menu"), breadcrumb. Default: title. */
  label?: string;
  /** Meta description. Default: the title and the item labels. */
  description?: string;
};

export type DossierCopy = {
  close: string;
  closeDossier: string;
  overview: string;
  overviewOf: (item: string) => string;
  itemsNav: string;
  entriesNav: string;
  /** Spoken item location, e.g. "Univers 2 sur 3 : Le bar". */
  itemLocation: (index: number, total: number, label: string) => string;
  entryLocation: (index: number, total: number, label: string) => string;
  previousItem: (label: string) => string;
  nextItem: (label: string) => string;
  nextEntry: (label: string) => string;
  openEntry: (index: number, total: number, title: string) => string;
  boardHeading: (item: string) => string;
  backTo: (item: string) => string;
  /** Header title on the overview, e.g. "Dossier 01 · La table". */
  overviewTitle: (index: number, label: string) => string;
  /** Completion toast. */
  toastNext: string;
  toastEnd: string;
  toastBack: string;
  dock: { home: string; previous: string; next: string; item: string };
  loader: {
    overviewKicker: (index: number) => string;
    detailKicker: (index: number) => string;
    title: string;
    status: string;
    spoken: (loaded: number, total: number) => string;
    failed: string;
    retry: string;
    /** Status while an item's live content loads (`item.pending`). Default per locale. */
    pending?: string;
  };
  /* Optional (1.8.0): defaults per `config.locale` when omitted. */
  /** Spoken name of an opening tile, e.g. "Ouvrir 1 sur 2 : La carte". */
  openItem?: (index: number, total: number, label: string) => string;
  /** The opening board's (visually hidden) heading. */
  chooseItem?: string;
  /** The way back to the opening screen, e.g. "Retour : Menu". */
  up?: (label: string) => string;
  /** Board of an item without entries; `item.empty` overrides it. */
  empty?: { title: string; body?: string };
};

export type DossierConfig = {
  locale: Locale;
  /** Variation (RULES §13), from `DOSSIER_COMPOSITIONS`. Default "panorama". */
  composition?: DossierComposition;
  /** Variation (RULES §13), from `DOSSIER_TILE_MEDIA`: board and opening tiles. Default "graded". */
  tileMedia?: DossierTileMedia;
  /** Variation (RULES §13), from `DOSSIER_DIRECT_LOADS`: the first view of a page loaded on a view URL. Default "entrance". */
  directLoad?: DossierDirectLoad;
  /** Client identity in the header strip. */
  brand: { name: string; logo?: ReactNode };
  /** Header kicker on the overview ("Maison Ardoise · Expériences"). */
  kicker: string;
  /** Optional opening screen: the dossier's top level, choosing between the items. */
  opening?: DossierOpening;
  items: DossierItem[];
  /** The one linked Evoview mark, in the header strip. On by default. */
  attribution: { enabled: boolean; href: string; label: string };
  copy: DossierCopy;
};
