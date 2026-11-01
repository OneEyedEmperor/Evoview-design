import type { MediaSource, ModalRoutes, ViewHead } from "../foundation";
import { tileSizes } from "./Board";
import { fullCopy } from "./copy";
import { isVideo, toSource } from "./hooks";
import type { DossierComposition, DossierConfig, DossierEntry, DossierItem, DossierMedia, DossierOpening } from "./types";

/**
 * A dossier view: an item's overview `{ item }`, one of its entries `{ item, entry }`, or the opening screen
 * `{ opening }`. In a config with an opening, item and entry views carry `opening` too (its id), so the opening is
 * their ancestor; `parse` and the dossier add it. Ids are URL slugs.
 */
export type DossierView = { item: string; entry?: string; opening?: string } | { opening: string; item?: undefined; entry?: undefined };

const DESCRIPTION_MAX = 160;
const SLUG = /^[a-z0-9][a-z0-9-]*$/i;
const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

/** ≤ 160 characters, cut on a word. */
function clip(text: string, max = DESCRIPTION_MAX): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,;:.·—–-]+$/, "")}…`;
}

export const openingLabel = (opening: DossierOpening) => opening.label ?? opening.title;

/** An item's (or entry's) view in this config: tagged with the opening when there is one. */
export function itemView(config: DossierConfig, item: string, entry?: string): DossierView {
  const view: DossierView = entry === undefined ? { item } : { item, entry };
  if (config.opening) view.opening = config.opening.id;
  return view;
}

/** The dossier's top level: the opening screen, else the first item's overview; null for a config without items. */
export function topView(config: DossierConfig): DossierView | null {
  if (config.opening) return { opening: config.opening.id };
  const first = config.items[0];
  return first ? itemView(config, first.id) : null;
}

type Resolved =
  | { item: null; itemIndex: -1; entry: null; entryIndex: -1 }
  | { item: DossierItem; itemIndex: number; entry: DossierEntry | null; entryIndex: number };

/** The view's item and entry in a config (item null: the opening screen; entry null: an overview); null when the ids name nothing. */
export function resolveView(config: DossierConfig, view: DossierView): Resolved | null {
  if (view.item === undefined) return config.opening && view.opening === config.opening.id ? { item: null, itemIndex: -1, entry: null, entryIndex: -1 } : null;
  const itemIndex = config.items.findIndex((i) => i.id === view.item);
  const item = config.items[itemIndex];
  if (!item) return null;
  if (view.entry === undefined) return { item, itemIndex, entry: null, entryIndex: -1 };
  const entryIndex = item.entries.findIndex((e) => e.id === view.entry);
  const entry = item.entries[entryIndex];
  return entry ? { item, itemIndex, entry, entryIndex } : null;
}

/** An entry's short name (header readout, tabs): its label, else its title. The view's h1 is always its title. */
export const entryHeading = (entry: DossierEntry) => entry.label ?? entry.title;

/** An item's picture on the opening screen: its cover, else its first entry's media. */
export const itemCover = (item: DossierItem): DossierMedia | undefined => item.cover ?? item.entries[0]?.media;

/** The board's own `sizes`: the sheet's fixed column; the panorama takes each layout's default. */
export const boardSizesFor = (composition: DossierComposition) => (composition === "sheet" ? "(max-width: 599px) 100vw, (max-width: 1023px) 50vw, 360px" : undefined);

const boardShape = (count: number) => (count === 4 ? "mosaic" : "grid");

/* Board media as the tiles render them (`tileSizes`): the gate and the preloads fetch the tile's own candidate. */
export const openingSources = (items: DossierItem[], boardSizes: string | undefined) =>
  items.map((i) => itemCover(i)).filter((m) => m !== undefined).map((m) => toSource(m, tileSizes(m, "choice", items.length, boardSizes)));
export const overviewSources = (entries: DossierEntry[], boardSizes: string | undefined) =>
  entries.map((e) => toSource(e.media, tileSizes(e.media, boardShape(entries.length), entries.length, boardSizes)));
/* A detail waits on what it shows: its `sources` when it lists them, else its media as the tile renders it (never at
   100vw: a detail that shows the media at another size lists it in `sources`, as rendered). */
export const detailSources = (entry: DossierEntry, entries: DossierEntry[], boardSizes: string | undefined): MediaSource[] =>
  entry.sources?.length ? entry.sources : [toSource(entry.media, tileSizes(entry.media, boardShape(entries.length), entries.length, boardSizes))];

function headImage(media: DossierMedia | undefined, alt: string): ViewHead["image"] {
  if (!media) return undefined;
  const src = isVideo(media) ? media.poster : media.src;
  return src ? { src, alt: media.alt ?? alt } : undefined;
}

function itemImage(item: DossierItem): ViewHead["image"] {
  if (item.cover) return headImage(item.cover, item.label);
  const first = item.entries[0];
  return first ? headImage(first.media, first.title) : undefined;
}

/**
 * Images a view shows first (what its media gate waits on; a video as its poster), in order: what a page loaded on the
 * view's URL preloads in its head (the first ones `fetchpriority="high"`) with `directLoad: "at-rest"`. Pure, server-safe.
 */
export function dossierViewMedia(config: DossierConfig, view: DossierView): string[] {
  const found = resolveView(config, view);
  if (!found) return [];
  const still = (m: DossierMedia | undefined) => (!m ? undefined : isVideo(m) ? m.poster : m.src);
  const source = (s: MediaSource) => (!s ? undefined : typeof s === "string" ? s : s.type === "video" ? undefined : s.src);
  const list = !found.item
    ? config.items.map((item) => still(itemCover(item)))
    : !found.entry
      ? found.item.entries.map((e) => still(e.media))
      : found.entry.sources?.length
        ? found.entry.sources.map(source).filter((src) => src && !VIDEO_FILE.test(src))
        : [still(found.entry.media)];
  return Array.from(new Set(list.filter((s): s is string => !!s)));
}

export type DossierViewImage = { src: string; srcSet?: string; sizes?: string };

/**
 * `dossierViewMedia` with each image's `srcSet` and the `sizes` its tile / figure renders at: preload with
 * `<link rel="preload" as="image" href={src} imagesrcset={srcSet} imagesizes={sizes}>`, so the head fetches the
 * candidate the page shows (a bare `href` beside a `srcSet` downloads the image twice). Pure, server-safe.
 */
export function dossierViewImages(config: DossierConfig, view: DossierView): DossierViewImage[] {
  const found = resolveView(config, view);
  if (!found) return [];
  const boardSizes = boardSizesFor(config.composition ?? "panorama");
  const image = (s: MediaSource): DossierViewImage[] => {
    if (!s) return [];
    if (typeof s === "string") return VIDEO_FILE.test(s) ? [] : [{ src: s }];
    if (s.type === "video" || (!s.type && VIDEO_FILE.test(s.src))) return [];
    return [s.srcSet ? { src: s.src, srcSet: s.srcSet, sizes: s.sizes } : { src: s.src }];
  };
  const shown = (m: DossierMedia | undefined, sizes?: string): DossierViewImage[] =>
    !m ? [] : isVideo(m) ? (m.poster ? [{ src: m.poster }] : []) : image(toSource(m, sizes ?? m.sizes));
  const list = !found.item
    ? config.items.flatMap((item) => {
        const m = itemCover(item);
        return m ? shown(m, tileSizes(m, "choice", config.items.length, boardSizes)) : [];
      })
    : !found.entry
      ? found.item.entries.flatMap((e, _, all) => shown(e.media, tileSizes(e.media, boardShape(all.length), all.length, boardSizes)))
      : found.entry.sources?.length
        ? found.entry.sources.flatMap(image)
        : shown(found.entry.media, tileSizes(found.entry.media, boardShape(found.item.entries.length), found.item.entries.length, boardSizes));
  const seen = new Set<string>();
  return list.filter((i) => {
    const key = `${i.src}|${i.srcSet ?? ""}|${i.sizes ?? ""}`;
    return !seen.has(key) && !!seen.add(key);
  });
}

/**
 * Views of a dossier (docs/CRAWLABLE-MODALS.md §1–2): the opening screen when the config has one, then per item its
 * overview (`item`) and entries (`item/entry`). Pure functions of the config, safe on the server.
 */
export const dossierRoutes: ModalRoutes<DossierConfig, DossierView> = {
  views: (config) => [
    ...(config.opening ? [{ opening: config.opening.id }] : []),
    ...config.items.flatMap((item) => [itemView(config, item.id), ...item.entries.map((entry) => itemView(config, item.id, entry.id))]),
  ],
  parent: (view) => {
    if (view.item === undefined) return null;
    if (view.entry !== undefined) return view.opening === undefined ? { item: view.item } : { item: view.item, opening: view.opening };
    return view.opening === undefined ? null : { opening: view.opening };
  },
  key: (view) => (view.item === undefined ? view.opening : view.entry === undefined ? view.item : `${view.item}/${view.entry}`),
  parse: (config, key) => {
    const [first, entry, ...rest] = key.replace(/^\/+|\/+$/g, "").split("/");
    if (!first || rest.length) return null;
    if (entry === undefined && config.opening?.id === first) return { opening: first };
    const item = config.items.find((i) => i.id === first);
    if (!item) return null;
    if (entry === undefined) return itemView(config, item.id);
    // A pending item's entries are not known yet: its entry keys wait for them (the dossier settles once they arrive).
    return item.entries.some((e) => e.id === entry) || (item.pending && SLUG.test(entry)) ? itemView(config, item.id, entry) : null;
  },
  head: (config, view) => {
    const found = resolveView(config, view);
    if (!found) throw new Error(`dossier: no view ${JSON.stringify(view)}`);
    const above = config.opening ? [openingLabel(config.opening)] : [];
    if (!found.item) {
      const opening = config.opening as DossierOpening;
      const first = config.items[0];
      return {
        title: opening.title,
        description: clip(opening.description ?? `${opening.title} — ${config.items.map((i) => i.label).join(", ")}.`),
        breadcrumb: above,
        image: first ? itemImage(first) : undefined,
      };
    }
    const { item, itemIndex, entry } = found;
    if (!entry) {
      const empty = item.empty ?? fullCopy(config.copy, config.locale).empty;
      const summary = item.entries.length ? item.entries.map((e) => e.title).join(", ") : empty.title.replace(/[.\s]+$/, "");
      return {
        title: config.copy.overviewTitle(itemIndex + 1, item.label),
        description: clip(item.description ?? `${item.label} — ${summary}.`),
        breadcrumb: [...above, item.label],
        image: itemImage(item),
      };
    }
    return {
      title: `${entry.title} — ${item.label}`,
      description: clip(entry.description ?? `${entry.title}${entry.kicker ? ` — ${entry.kicker}` : ""}. ${item.label}.`),
      breadcrumb: [...above, item.label, entry.title],
      image: headImage(entry.media, entry.title),
    };
  },
};
