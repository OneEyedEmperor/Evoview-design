import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MediaSource } from "../foundation";
import { toSource } from "./hooks";
import type { DossierEntry, DossierFeed, DossierFeedStatus, DossierItem, DossierMedia } from "./types";

/* A live feed of entries (articles, posts) in pages: a generic source (any fetcher), its cache and load states. The
   item's board shows it in batches, one page per batch, appended as the visitor reaches the end (FeedBoard.tsx). Pure parts
   (`dossierFeed`, `feedOf`, `feedPageOf`) are server-safe; `useDossierFeed` holds the live state on a client. */

export const FEED_PAGE_SIZE = 9;
/** Batches one board view appends before the visitor moves on to the next page's URL (DOM growth bound, README "Feed"). */
export const FEED_BATCH_CAP = 8;

export type DossierFeedPageData<T> = {
  /** The page's records, newest first. */
  items: T[];
  /** Cursor of the next page; null: this is the last page. */
  next: string | null;
};

/** Where the feed comes from: any fetcher. Records are the source's own (serialisable for a snapshot); `toEntry` maps them. */
export type DossierFeedSource<T extends object> = {
  /** Page `page` (1-based). `cursor` is the previous page's `next` when known, null when the page is requested directly
      (a page URL): a cursor-only API walks from page 1 itself. Reject on failure; resolve `{ items: [] }` past the end. */
  fetchPage: (page: number, cursor: string | null, signal: AbortSignal) => Promise<DossierFeedPageData<T>>;
  /** One record by entry id, for a deep link to an entry not in a loaded page; null: no such entry. Omitted: such links settle on the overview. */
  fetchEntry?: (id: string, signal: AbortSignal) => Promise<T | null>;
  /** The record as a dossier entry; its `id` is the entry's URL slug and must be stable. Memoise the source (a new
      `toEntry` rebuilds every entry), rebuild it on a locale change. */
  toEntry: (record: T) => DossierEntry;
};

/** Pages a server already holds (build-time data), rendered without a fetch and the same at hydration. */
export type DossierFeedSnapshot<T> = {
  pages: ({ page: number } & DossierFeedPageData<T>)[];
  /** Entries fetched one by one (deep links). */
  entries?: T[];
};

export type DossierFeedOptions<T> = {
  initial?: DossierFeedSnapshot<T>;
  /** Entries per page: the batch the board appends. Default 9 (3 × 3). */
  pageSize?: number;
  /** Batches one board view appends in place; past it the board links the next page's URL. Default 8. */
  batchCap?: number;
  /** Check page 1 for new entries this often while the feed's first page is on screen (pause model); they wait behind
      an "N new" control. Omitted: no live updates. */
  refreshMs?: number;
  /** What the cache belongs to (e.g. the locale): it empties when `key` changes, and the source may then be rebuilt
      on every render (the latest is always used). Omitted: the cache belongs to the source's functions. */
  key?: string | number;
};

type Page<T> = DossierFeedPageData<T>;
type State<T> = {
  pages: Record<number, Page<T>>;
  pageStatus: Record<number, "loading" | "error" | "missing">;
  singles: Record<string, T>;
  singleStatus: Record<string, "loading" | "error" | "missing">;
  fresh: Page<T> | null;
};

const seed = <T,>(snapshot?: DossierFeedSnapshot<T>, toEntry?: (r: T) => DossierEntry): State<T> => {
  const pages: Record<number, Page<T>> = {};
  for (const p of snapshot?.pages ?? []) pages[p.page] = { items: p.items, next: p.next };
  const singles: Record<string, T> = {};
  if (toEntry) for (const r of snapshot?.entries ?? []) singles[toEntry(r).id] = r;
  return { pages, pageStatus: {}, singles, singleStatus: {}, fresh: null };
};

type Actions = Pick<DossierFeed, "loadPage" | "loadEntry" | "showFresh"> & { checkFresh?: () => void };
const NO_ACTIONS: Actions = { loadPage: () => undefined, loadEntry: () => undefined, showFresh: () => undefined };

const cache = new WeakMap<(record: never) => DossierEntry, WeakMap<object, DossierEntry>>();
function mapper<T extends object>(toEntry: (record: T) => DossierEntry) {
  let memo = cache.get(toEntry as (record: never) => DossierEntry);
  if (!memo) cache.set(toEntry as (record: never) => DossierEntry, (memo = new WeakMap()));
  const known = memo;
  return (record: T) => {
    let entry = known.get(record);
    if (!entry) known.set(record, (entry = toEntry(record)));
    return entry;
  };
}

function build<T extends object>(state: State<T>, toEntry: (record: T) => DossierEntry, options: DossierFeedOptions<T>, actions: Actions): DossierFeed {
  const map = mapper(toEntry);
  const seen = new Set<string>();
  const entries: DossierEntry[] = [];
  const pages: DossierFeed["pages"] = [];
  for (const page of Object.keys(state.pages).map(Number).sort((a, b) => a - b)) {
    const ids: string[] = [];
    for (const record of state.pages[page].items) {
      const entry = map(record);
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      ids.push(entry.id);
      entries.push(entry);
    }
    pages.push({ page, ids, next: state.pages[page].next });
  }
  for (const record of Object.values(state.singles)) {
    const entry = map(record);
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      entries.push(entry);
    }
  }
  const freshIds = state.fresh ? state.fresh.items.map((r) => map(r).id).filter((id) => !seen.has(id)) : [];
  return {
    pageSize: options.pageSize ?? FEED_PAGE_SIZE,
    batchCap: Math.max(1, options.batchCap ?? FEED_BATCH_CAP),
    refreshMs: options.refreshMs,
    pages,
    entries,
    pageStatus: (page) => {
      if (state.pages[page]) return "ready";
      const status = state.pageStatus[page];
      if (status) return status;
      if (page < 1 || !Number.isInteger(page)) return "missing";
      return pastEnd(state.pages, page) ? "missing" : "idle";
    },
    entryStatus: (id) => (seen.has(id) ? "ready" : (state.singleStatus[id] ?? "idle")),
    fresh: freshIds.length,
    ...actions,
  };
}

/** A feed from data only (build-time configs, prerender, tests): its pages and entries, no fetching. */
export function dossierFeed<T extends object>(snapshot: DossierFeedSnapshot<T>, toEntry: (record: T) => DossierEntry, options: Omit<DossierFeedOptions<T>, "initial"> = {}): DossierFeed {
  return build(seed(snapshot, toEntry), toEntry, options, NO_ACTIONS);
}

/**
 * The live feed: pages fetched on demand from `source`, the board's batches, single entries for deep links, live
 * updates waiting behind a control. Seed it with the server's `initial` snapshot so hydration matches. Put the result on
 * the item: `{ id, label, board: "feed", feed, entries: feed.entries }`.
 * The cache belongs to `options.key` when given (e.g. the locale), else to the source's functions (`fetchPage`,
 * `fetchEntry`, `toEntry`): when that changes (another locale's API) it empties and what is in flight is aborted;
 * `initial` seeds the first one only. The latest `source` is always the one called, so with a `key` it may be an
 * inline literal; without one, keep its functions stable (module functions, `useMemo` / `useCallback`). Functions
 * rebuilt on every render without a `key` are detected: the cache then stays put (a console warning names the fix).
 */
export function useDossierFeed<T extends object>(source: DossierFeedSource<T>, options: DossierFeedOptions<T> = {}): DossierFeed {
  const identity: readonly unknown[] = options.key !== undefined ? ["key", options.key] : [source.fetchPage, source.fetchEntry, source.toEntry];
  const [state, setState] = useState<State<T>>(() => seed(options.initial, source.toEntry));
  const [owner, setOwner] = useState<Owner<T>>(() => ({ id: identity, generation: 0, before: null, pinned: false, toEntry: source.toEntry }));
  const inflight = useRef(new Map<string, AbortController>());
  let current = state;
  let own = owner;
  /* Another owner: its records, not the previous one's. Reset during render, before anything reads the old cache.
     `before` holds the previous cache until the reset commits: an identity that changes again within the same render
     pass is rebuilt on every render, so the cache is restored and pinned instead of resetting forever. */
  const changed = !owner.pinned && !sameIdentity(owner.id, identity);
  if (changed && owner.before) {
    own = { ...owner, id: identity, generation: owner.generation - 1, before: null, pinned: true };
    current = owner.before;
    setOwner(own);
    setState(current);
    if (!warned) {
      warned = true;
      console.warn("useDossierFeed: the source's functions change on every render, so its cache is kept as is. Pass options.key (e.g. the locale) or keep fetchPage / fetchEntry / toEntry stable.");
    }
  } else if (changed) {
    own = { id: identity, generation: owner.generation + 1, before: state, pinned: false, toEntry: source.toEntry };
    current = seed<T>();
    setOwner(own);
    setState(current);
  } else if (owner.before) {
    own = { ...owner, before: null };
    setOwner(own);
  }
  const live = useRef({ state: current, source });
  live.current = { state: current, source };

  useEffect(() => {
    const running = inflight.current;
    return () => {
      for (const controller of running.values()) controller.abort();
      running.clear();
    };
  }, [own.generation]);

  const run = useCallback(<R,>(key: string, task: (signal: AbortSignal) => Promise<R>, done: (result: R) => void, failed: () => void) => {
    if (inflight.current.has(key)) return;
    const controller = new AbortController();
    inflight.current.set(key, controller);
    // Only this request's own entry: an aborted earlier one settling late must not remove its successor's.
    const settle = () => {
      if (inflight.current.get(key) === controller) inflight.current.delete(key);
    };
    task(controller.signal).then(
      (result) => {
        settle();
        if (!controller.signal.aborted) done(result);
      },
      () => {
        settle();
        if (!controller.signal.aborted) failed();
      },
    );
  }, []);

  /* A failed load is asked for again only on an explicit retry (`retry` true): renders and effects that call the
     loader for a page or entry in error never re-fetch it on their own. */
  const loadPage = useCallback(
    (page: number, retry = false) => {
      const { state: s, source: src } = live.current;
      const status = s.pageStatus[page];
      if (!Number.isInteger(page) || page < 1 || s.pages[page] || status === "loading" || status === "missing" || (status === "error" && !retry)) return;
      const before = s.pages[page - 1];
      if (pastEnd(s.pages, page)) return;
      setState((x) => ({ ...x, pageStatus: { ...x.pageStatus, [page]: "loading" } }));
      run(
        `p${page}`,
        (signal) => src.fetchPage(page, before?.next ?? null, signal),
        (data) =>
          setState((x) => {
            const pageStatus = { ...x.pageStatus };
            delete pageStatus[page];
            if (!data.items.length && page > 1) return { ...x, pageStatus: { ...pageStatus, [page]: "missing" } };
            return { ...x, pages: { ...x.pages, [page]: { items: data.items, next: data.next } }, pageStatus };
          }),
        () => setState((x) => ({ ...x, pageStatus: { ...x.pageStatus, [page]: "error" } })),
      );
    },
    [run],
  );

  const loadEntry = useCallback(
    (id: string, retry = false) => {
      const { state: s, source: src } = live.current;
      const status = s.singleStatus[id];
      if (s.singles[id] || status === "loading" || status === "missing" || (status === "error" && !retry)) return;
      if (!src.fetchEntry) {
        setState((x) => ({ ...x, singleStatus: { ...x.singleStatus, [id]: "missing" } }));
        return;
      }
      const fetchEntry = src.fetchEntry;
      setState((x) => ({ ...x, singleStatus: { ...x.singleStatus, [id]: "loading" } }));
      run(
        `e${id}`,
        (signal) => fetchEntry(id, signal),
        (record) =>
          setState((x) => {
            const singleStatus = { ...x.singleStatus };
            if (!record) return { ...x, singleStatus: { ...singleStatus, [id]: "missing" } };
            delete singleStatus[id];
            return { ...x, singles: { ...x.singles, [id]: record }, singleStatus };
          }),
        () => setState((x) => ({ ...x, singleStatus: { ...x.singleStatus, [id]: "error" } })),
      );
    },
    [run],
  );

  const checkFresh = useCallback(() => {
    const { source: src } = live.current;
    run(
      "fresh",
      (signal) => src.fetchPage(1, null, signal),
      (data) => setState((x) => ({ ...x, fresh: data })),
      () => undefined,
    );
  }, [run]);

  /* The visitor asked for the new entries: page 1 as just fetched becomes the feed's start; older pages are dropped
     (their boundaries moved), single entries stay. */
  const showFresh = useCallback(() => {
    for (const [key, controller] of inflight.current) {
      if (key.startsWith("p")) {
        controller.abort();
        inflight.current.delete(key);
      }
    }
    setState((x) => (x.fresh ? { ...x, pages: { 1: x.fresh }, pageStatus: {}, fresh: null } : x));
  }, []);

  const { pageSize, batchCap, refreshMs } = options;
  // The owner's `toEntry` (taken when the cache was last reset): an inline one doesn't remap every entry on each render.
  const toEntry = own.toEntry;
  return useMemo(
    () => build(current, toEntry, { pageSize, batchCap, refreshMs }, { loadPage, loadEntry, showFresh, checkFresh: refreshMs ? checkFresh : undefined }),
    [current, toEntry, pageSize, batchCap, refreshMs, loadPage, loadEntry, showFresh, checkFresh],
  );
}

type Owner<T> = { id: readonly unknown[]; generation: number; before: State<T> | null; pinned: boolean; toEntry: (record: T) => DossierEntry };
let warned = false;
const sameIdentity = (a: readonly unknown[], b: readonly unknown[]) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

/** `page` lies past a known end: a cached page before it has no next (the last page), so it names nothing. */
function pastEnd(pages: Record<number, { next: string | null }>, page: number): boolean {
  for (const n of Object.keys(pages).map(Number)) if (n < page && pages[n].next === null) return true;
  return false;
}

/* ─── Package side: what the dossier reads from a feed item ─── */

/** The item shows its entries on the feed board (`board: "feed"`, or a `feed` without `board`). */
export const isFeedItem = (item: DossierItem | null | undefined): boolean => !!item && (item.board === "feed" || (item.board === undefined && !!item.feed));

/** The item's feed; a feed board without a source shows its entries as one page. */
export function feedOf(item: DossierItem): DossierFeed {
  if (item.feed) return item.feed;
  const ids = item.entries.map((e) => e.id);
  return {
    pageSize: Math.max(ids.length, 1),
    batchCap: 1,
    pages: [{ page: 1, ids, next: null }],
    entries: item.entries,
    pageStatus: (page) => (page === 1 ? "ready" : "missing"),
    entryStatus: (id) => (ids.includes(id) ? "ready" : "missing"),
    fresh: 0,
    ...NO_ACTIONS,
  };
}

/** A page view's number: 1 for the overview (`{ item }`), else `view.page`. */
export const pageNumber = (page: number | undefined) => (page !== undefined && page >= 2 ? page : 1);

/** The cached page holding an entry (0 when it came on its own, a deep link). */
export function feedPageOf(item: DossierItem, entryId: string): number {
  return feedOf(item).pages.find((p) => p.ids.includes(entryId))?.page ?? 0;
}

/** An entry's place in the feed, from its page: page p's k-th entry is (p − 1) × pageSize + k (page 3 starts at 19
    with nine a page), so positions continue across pages and page views. Null for an entry fetched on its own. */
export function feedPosition(item: DossierItem, entryId: string): number | null {
  const feed = feedOf(item);
  const page = feed.pages.find((p) => p.ids.includes(entryId));
  return page ? (page.page - 1) * feed.pageSize + page.ids.indexOf(entryId) + 1 : null;
}

/** The page's entries, in order (none when the page is not loaded). */
export function feedPageEntries(item: DossierItem, page: number): DossierEntry[] {
  const feed = feedOf(item);
  const ids = feed.pages.find((p) => p.page === page)?.ids ?? [];
  return ids.map((id) => item.entries.find((e) => e.id === id)).filter((e): e is DossierEntry => !!e);
}

/** What a feed overview's media gate waits for: its first batch only, so appending never re-gates the board. */
export const feedSources = (item: DossierItem, page: number): MediaSource[] => feedPageEntries(item, page).map((e) => feedTileSource(e.media));

/** The `sizes` a feed tile's `<img>` renders with (its own, else the feed grid's: 1 / 2 / 3 columns). */
export const feedTileSizes = (media: DossierMedia) => media.sizes ?? FEED_TILE_SIZES;
const FEED_TILE_SIZES = "(max-width: 599px) 100vw, (max-width: 1023px) 50vw, 30vw";

/** A feed tile's media as the gate and preloads fetch it: the candidate the tile shows (srcset-aware gate). */
export const feedTileSource = (media: DossierMedia): MediaSource => toSource(media, feedTileSizes(media));

/** More pages exist after the cached ones (the total is open: "n of many"). */
export function feedHasMore(item: DossierItem): boolean {
  const feed = feedOf(item);
  const last = feed.pages[feed.pages.length - 1];
  return !last || last.next !== null;
}

/** The view's body waits on the feed: its page not loaded, or an entry not brought yet. */
export function feedAwaits(item: DossierItem, page: number | undefined, entry: string | undefined): boolean {
  const feed = feedOf(item);
  if (entry !== undefined) return feed.entryStatus(entry) !== "ready" && feed.entryStatus(entry) !== "missing";
  const status = feed.pageStatus(pageNumber(page));
  return status !== "ready" && status !== "missing";
}

/** The feed failed to bring what the view waits on (retry offered). */
export function feedFailed(item: DossierItem, page: number | undefined, entry: string | undefined): boolean {
  const feed = feedOf(item);
  return (entry !== undefined ? feed.entryStatus(entry) : feed.pageStatus(pageNumber(page))) === "error";
}

/** Ask the feed for what the view waits on (idempotent; failed loads wait for `retry`). */
export function feedRequest(item: DossierItem, page: number | undefined, entry: string | undefined, retry = false) {
  const feed = feedOf(item);
  const status: DossierFeedStatus = entry !== undefined ? feed.entryStatus(entry) : feed.pageStatus(pageNumber(page));
  if (status === "idle" || (retry && status === "error")) {
    if (entry !== undefined) feed.loadEntry(entry, retry);
    else feed.loadPage(pageNumber(page), retry);
  }
}

/** Up to `size` consecutive entry indices around `index` (strip tabs, dock bars): one before, the rest after. */
export function feedWindow(index: number, total: number, size = 4): number[] {
  const n = Math.min(size, total);
  const start = Math.max(0, Math.min(index - 1, total - n));
  return Array.from({ length: n }, (_, i) => start + i);
}
