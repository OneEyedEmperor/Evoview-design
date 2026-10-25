import type { ModalRoutes, ViewHead } from "../foundation";
import { isVideo } from "./hooks";
import type { DossierConfig, DossierEntry, DossierItem } from "./types";

/** A dossier view: an item's overview (level 1) or one of its entries (level 2). Ids are URL slugs. */
export type DossierView = { item: string; entry?: string };

const DESCRIPTION_MAX = 160;

const fold = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** ≤ 160 characters, cut on a word. */
function clip(text: string, max = DESCRIPTION_MAX): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,;:.·—–-]+$/, "")}…`;
}

/** The view's item and entry in a config (entry null for an overview); null when the ids name nothing. */
export function resolveView(config: DossierConfig, view: DossierView): { item: DossierItem; itemIndex: number; entry: DossierEntry | null; entryIndex: number } | null {
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

function headImage(entry: DossierEntry | undefined): ViewHead["image"] {
  if (!entry) return undefined;
  const src = isVideo(entry.media) ? entry.media.poster : entry.media.src;
  return src ? { src, alt: entry.media.alt ?? entry.title } : undefined;
}

/**
 * Views of a dossier (docs/CRAWLABLE-MODALS.md §1–2): `item` (overview) and
 * `item/entry`. Pure functions of the config, safe on the server.
 */
export const dossierRoutes: ModalRoutes<DossierConfig, DossierView> = {
  views: (config) => config.items.flatMap((item) => [{ item: item.id }, ...item.entries.map((entry) => ({ item: item.id, entry: entry.id }))]),
  parent: (view) => (view.entry === undefined ? null : { item: view.item }),
  key: (view) => (view.entry === undefined ? view.item : `${view.item}/${view.entry}`),
  parse: (config, key) => {
    const [item, entry, ...rest] = key.replace(/^\/+|\/+$/g, "").split("/");
    if (!item || rest.length) return null;
    const view: DossierView = entry === undefined ? { item } : { item, entry };
    return resolveView(config, view) ? view : null;
  },
  head: (config, view) => {
    const found = resolveView(config, view);
    if (!found) throw new Error(`dossier: no view ${JSON.stringify(view)}`);
    const { item, itemIndex, entry } = found;
    if (!entry) {
      return {
        title: config.copy.overviewTitle(itemIndex + 1, item.label),
        description: clip(item.description ?? `${item.label} — ${item.entries.map((e) => e.title).join(", ")}.`),
        breadcrumb: [item.label],
        image: headImage(item.entries[0]),
      };
    }
    const heading = entryHeading(entry);
    const name = fold(entry.title).includes(fold(heading)) ? entry.title : `${heading} · ${entry.title}`;
    return {
      title: `${name} — ${item.label}`,
      description: clip(entry.description ?? `${entry.title}${entry.kicker ? ` — ${entry.kicker}` : ""}. ${item.label}.`),
      breadcrumb: [item.label, entry.title],
      image: headImage(entry),
    };
  },
};
