import type { ReactNode } from "react";
import type { MediaSource } from "../foundation";

export type Locale = "fr" | "en";

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
  /** Exactly four for the selection board. */
  entries: DossierEntry[];
  /** The overview's meta description (`dossierRoutes.head`, cut to 160 characters). Default: the label and the entry titles. */
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
  };
};

export type DossierConfig = {
  locale: Locale;
  /** Client identity in the header strip. */
  brand: { name: string; logo?: ReactNode };
  /** Header kicker on the overview ("Maison Ardoise · Expériences"). */
  kicker: string;
  items: DossierItem[];
  /** The one linked Evoview mark, in the header strip. On by default. */
  attribution: { enabled: boolean; href: string; label: string };
  copy: DossierCopy;
};
