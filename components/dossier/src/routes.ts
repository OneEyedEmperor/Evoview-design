import type { ModalRoutes, ViewHead } from "../foundation";
import { fullCopy } from "./copy";
import { isVideo } from "./hooks";
import type { DossierConfig, DossierEntry, DossierItem, DossierMedia, DossierOpening } from "./types";

/**
 * A dossier view: an item's overview `{ item }`, one of its entries `{ item, entry }`, or the opening screen
 * `{ opening }`. In a config with an opening, item and entry views carry `opening` too (its id), so the opening is
 * their ancestor; `parse` and the dossier add it. Ids are URL slugs.
 */
export type DossierView = { item: string; entry?: string; opening?: string } | { opening: string; item?: undefined; entry?: undefined };

const DESCRIPTION_MAX = 160;
const SLUG = /^[a-z0-9][a-z0-9-]*$/i;

const fold = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

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

/** The dossier header's h1 for an entry: its short label (the title when there is none). */
export const entryHeading = (entry: DossierEntry) => entry.label ?? entry.title;

/** An item's picture on the opening screen: its cover, else its first entry's media. */
export const itemCover = (item: DossierItem): DossierMedia | undefined => item.cover ?? item.entries[0]?.media;

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
    const heading = entryHeading(entry);
    const name = fold(entry.title).includes(fold(heading)) ? entry.title : `${heading} · ${entry.title}`;
    return {
      title: `${name} — ${item.label}`,
      description: clip(entry.description ?? `${entry.title}${entry.kicker ? ` — ${entry.kicker}` : ""}. ${item.label}.`),
      breadcrumb: [...above, item.label, entry.title],
      image: headImage(entry.media, entry.title),
    };
  },
};
