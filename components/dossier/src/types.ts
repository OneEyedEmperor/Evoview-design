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

/** selection: the board of the item's entries (mosaic for four, the symmetric grid otherwise).
    feed: a live feed in batches (one page each, 3 × 3 by default), 3 columns in the panorama, 2 from 600, 1 below,
    appended as the visitor reaches the end; each page also has its own URL. */
export const DOSSIER_ITEM_BOARDS = ["selection", "feed"] as const;
export type DossierItemBoard = (typeof DOSSIER_ITEM_BOARDS)[number];
/** How a feed board cards its stories (`item.feedCards`).
    tiles: one continuous grid of picture tiles, the title on the picture (1.14).
    editions: each batch is an edition on its own tonal sheet (two steps, alternating), opened by its first story as the
    lead at double scale with its dek, the lead changing side from one edition to the next; every story shows its section
    and day after the headline, headlines and deks complete at every width, ratios as minimums. */
export const DOSSIER_FEED_CARDS = ["tiles", "editions"] as const;
export type DossierFeedCards = (typeof DOSSIER_FEED_CARDS)[number];

/** A feed story's weight on an editions board (`entry.importance`): standard, major (grade half released, shallower scrim,
    a type step), top (picture released, accent bloom and frame, a second type step). */
export const DOSSIER_IMPORTANCE = ["standard", "major", "top"] as const;
export type DossierImportance = (typeof DOSSIER_IMPORTANCE)[number];

export type DossierFeedStatus = "idle" | "loading" | "ready" | "error" | "missing";

/** A feed item's pages and load states (`useDossierFeed`, or `dossierFeed` for data known up front). */
export type DossierFeed = {
  /** Entries per page (the batch). */
  pageSize: number;
  /** Batches one board view appends in place before linking the next page's URL. */
  batchCap: number;
  refreshMs?: number;
  /** Loaded pages in order: the ids each adds (an entry already on an earlier page is left out) and the next cursor (null: last page). */
  pages: { page: number; ids: string[]; next: string | null }[];
  /** Every loaded entry: the pages in order, then entries fetched one by one. The item's `entries`. */
  entries: DossierEntry[];
  pageStatus: (page: number) => DossierFeedStatus;
  entryStatus: (id: string) => DossierFeedStatus;
  /** Fetch a page; one in error is fetched again only with `retry` true (an explicit retry, never a render). */
  loadPage: (page: number, retry?: boolean) => void;
  loadEntry: (id: string, retry?: boolean) => void;
  /** New entries found on page 1 (live updates), waiting for the visitor. */
  fresh: number;
  checkFresh?: () => void;
  showFresh: () => void;
};

export type DossierFeedCopy = {
  /** Link to the previous (newer) page, on a page view. */
  newer: string;
  /** Link to the next (older) page: loads it in place, or opens its URL past the batch cap. */
  older: string;
  loading: string;
  /** Spoken once a batch is in. */
  loaded: (count: number) => string;
  /** A next batch that failed (in the board). */
  failed: string;
  /** What a view waits on failed to load: its page on a cold open or a page URL, or a deep-linked entry (the loader). */
  unavailable: string;
  retry: string;
  /** Below the last page. */
  end: string;
  /** The live-updates control. */
  fresh: (count: number) => string;
  freshAria: (count: number) => string;
  /** A page's name ("Page 2"): header title, head title, breadcrumb. */
  page: (page: number) => string;
  /** Spoken position without a total (the feed's length is open). */
  location: (index: number, label: string) => string;
  open: (index: number, title: string) => string;
};

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
  /** With `heading: "content"`: the id of the view's h1, which the content renders (`<ChapterHead level="title" as="h1" id={headingId} …>`). */
  headingId: string;
};

export type DossierEntry = {
  id: string;
  /** Tile title and spoken name. */
  title: string;
  /** Short tab / dock label, and the phone header's readout. Default: title. */
  label?: string;
  /**
   * Where the view's h1 (`title`) is. "header" (default): the dossier header (desktop shows `title`, phones `label`).
   * "content": the detail shows its title itself and renders it as the h1 with `ctx.headingId`; the header keeps
   * `label` as a readout.
   */
  heading?: "header" | "content";
  /** Optional readout above the tile title ("7 services · 78 €"). */
  kicker?: string;
  /** Feed editions: the entry's section ("News"), on the tile after the title (never above it). */
  section?: string;
  /** Feed editions: publication day, `iso` (YYYY-MM-DD, the tile's `<time datetime>`) and its display `label` ("30 Oct"),
      formatted by the client (no Intl: the server and every browser render the same string). */
  published?: { iso: string; label: string };
  /** Feed editions: how much the story weighs, from `DOSSIER_IMPORTANCE` (default "standard"), set by the client. A surface
      shift only (grade, scrim, bloom, frame, type step): it never reorders the feed nor makes a story the lead. */
  importance?: DossierImportance;
  /** Tile media; also what the detail waits on (at the tile's `sizes`) when it lists no `sources`. */
  media: DossierMedia;
  /** The detail's own media as rendered (`{ src, srcSet?, sizes? }`): when given, the detail waits on these instead of `media`. */
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
  /** Variation (RULES §13), from `DOSSIER_ITEM_BOARDS`. Default "selection", "feed" when `feed` is set. */
  board?: DossierItemBoard;
  /** The live source of a feed board; set `entries` to `feed.entries`. */
  feed?: DossierFeed;
  /** Variation (RULES §13), from `DOSSIER_FEED_CARDS`: how a feed board's stories are carded. Default "tiles". */
  feedCards?: DossierFeedCards;
  /** This item's views in its own words, over `config.copy` (`dock`, `loader`, `feed` key by key): e.g. a feed among
      desks reads "‹ Latest", not "‹ Desk". Omitted: the config's copy. */
  copy?: DossierItemCopy;
};

/** An item's copy override: any key of `DossierCopy`, nested groups partial. */
export type DossierItemCopy = Partial<Omit<DossierCopy, "dock" | "loader">> & {
  dock?: Partial<DossierCopy["dock"]>;
  loader?: Partial<DossierCopy["loader"]>;
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
  /** Feed boards (1.14.0). Defaults per `config.locale`, key by key. */
  feed?: Partial<DossierFeedCopy>;
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
  /** Header kicker above the title on the opening screen and overviews, ≥ 600. Leave it out (the templates do): omitted
      or empty, no kicker, the title alone centred in the bar (RULES §1, no kicker tags). */
  kicker?: string;
  /** Optional opening screen: the dossier's top level, choosing between the items. */
  opening?: DossierOpening;
  items: DossierItem[];
  /** The one linked Evoview mark, in the header strip. On by default. `href: null` pauses the link (destination not live yet); the mark stays. */
  attribution: { enabled: boolean; href: string | null; label: string };
  copy: DossierCopy;
};
