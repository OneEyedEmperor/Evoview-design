import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  EvoviewMark,
  cn,
  followRouteLink,
  HeldCopy,
  inkFor,
  lockScroll,
  mediaGate,
  pad,
  preloadMedia,
  restoreFocus,
  RouteLink,
  SurfaceFill,
  TextFill,
  useHydrated,
  useMediaQuery,
  useMediaReady,
  useRouteHistory,
  usePressJelly,
  useSuspendBackground,
  type MediaSource,
  type RouteViewProps,
} from "../foundation";
import { GhostAction, GlassClose, PagerOrb } from "../controls";
import { SelectionBoard, type SelectionBoardLayout, type SelectionTile } from "./Board";
import { ChapterMediaContext, ChapterRevealContext, type ChapterReveal } from "./Chapters";
import { feedCopy, fullCopy, itemCopy } from "./copy";
import { feedAwaits, feedFailed, feedHasMore, feedOf, feedPageEntries, feedPageOf, feedPosition, feedRequest, feedSources, feedWindow, isFeedItem, pageNumber } from "./feed";
import { FeedBoard, type FeedMemory } from "./FeedBoard";
import { DossierLoader } from "./Loader";
import { DESKTOP_QUERY } from "./hooks";
import { boardSizesFor, detailSources, dossierRoutes, entryHeading, itemCover, itemView, openingLabel, openingSources, overviewSources, topView, type DossierView } from "./routes";
import type { DossierConfig, DossierEntry, DossierEntryContext, DossierItem } from "./types";

type DossierBaseProps = {
  config: DossierConfig;
  /** Warm every item's board media while the page is idle, so an open or a switch rarely waits. Default true. */
  preload?: boolean;
  className?: string;
};

/** Routable (docs/CRAWLABLE-MODALS.md): the host owns `view` (null = closed); every control, Escape, backdrop and Back / Forward call `onNavigate`. */
export type DossierRouteProps = RouteViewProps<DossierView> & { open?: never; onClose?: never; initialItemId?: never; initialEntryId?: never };

/** Deprecated 1.x API (removed in 2.0): uncontrolled view, no URLs. Mapped onto `view` internally. */
export type DossierLegacyProps = {
  view?: undefined;
  open: boolean;
  /** Called for every close (button, Escape at overview, backdrop at overview, history Back). Set `open` false. */
  onClose: () => void;
  /** Item shown on open (default: the top level, the opening screen when there is one). */
  initialItemId?: string;
  /** Opens directly on one entry. */
  initialEntryId?: string;
  onNavigate?: never;
  hrefFor?: never;
  history?: boolean;
};

export type DossierProps = DossierBaseProps & (DossierRouteProps | DossierLegacyProps);

/** Exit animation is 340 ms; past this the layer is removed even if no animationend arrives (hidden tab, animations off). */
const EXIT_FALLBACK_MS = 700;

/**
 * The view this config can show for a requested one. Unknown ids fall back one level (an entry to its item's
 * overview, an item to the top level); a pending item keeps an unknown entry (its live content may hold it).
 */
function canonicalView(config: DossierConfig, requested: DossierView): DossierView | null {
  if (requested.item === undefined) return config.opening && requested.opening === config.opening.id ? { opening: config.opening.id } : topView(config);
  const item = config.items.find((i) => i.id === requested.item);
  if (!item) return topView(config);
  if (isFeedItem(item)) return feedCanonicalView(config, item, requested);
  if (requested.entry === undefined) return itemView(config, item.id);
  if (item.pending || item.entries.some((e) => e.id === requested.entry)) return itemView(config, item.id, requested.entry);
  return itemView(config, item.id);
}

/** The view's body waits on a pending item's live content (its overview, or an entry not brought yet). */
function awaitsLiveContent(config: DossierConfig, view: DossierView): boolean {
  if (view.item === undefined) return false;
  const item = config.items.find((i) => i.id === view.item);
  if (item && isFeedItem(item)) return feedAwaits(item, view.page, view.entry);
  return !!item?.pending && !item.entries.some((e) => e.id === view.entry);
}

/** A feed keeps a page or an entry it may still bring (a deep link); one it cannot bring settles a level up. */
function feedCanonicalView(config: DossierConfig, item: DossierItem, requested: DossierView & { item: string }): DossierView {
  const feed = feedOf(item);
  const page = pageNumber(requested.page);
  if (requested.entry !== undefined) {
    if (feed.entryStatus(requested.entry) !== "missing") return itemView(config, item.id, requested.entry, page);
    return itemView(config, item.id, undefined, feed.pageStatus(page) === "missing" ? 1 : page);
  }
  return itemView(config, item.id, undefined, feed.pageStatus(page) === "missing" ? 1 : page);
}

const pathOf = (href: string) => {
  let path = new URL(href, window.location.href).pathname;
  try {
    path = decodeURI(path);
  } catch {
    /* keep as is */
  }
  return path.replace(/\/+$/, "") || "/";
};

/**
 * The view is the one the document was served on: this render is the server's or hydrates its HTML (`hydrated`
 * false), or, in a client-rendered page, the document was loaded at the view's URL (the navigation entry, not the
 * current location, which a router or an in-page launcher may already have moved). Any other mount, a first mount
 * on an in-page launcher included, is an in-page open.
 */
function servedOn(href: string | undefined, hydrated: boolean): boolean {
  if (!hydrated) return true;
  if (href === undefined || typeof window === "undefined") return false;
  const loaded = (performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined)?.name;
  return loaded !== undefined && pathOf(loaded) === pathOf(href);
}

function legacySeed(config: DossierConfig, itemId?: string, entryId?: string): DossierView | null {
  if (itemId === undefined && entryId === undefined) return topView(config);
  const item = itemId ?? config.items[0]?.id;
  return item === undefined ? null : canonicalView(config, entryId === undefined ? { item } : { item, entry: entryId });
}

/** The portal modal: isolate, demonstrate, explain. Renders in place (fixed layer) so the host accent is inherited. */
export function Dossier(props: DossierProps) {
  const { config, preload = true, className, history } = props;
  const controlled = props.view !== undefined;
  usePressJelly();

  /* Legacy API: an internal view, seeded from initialItemId / initialEntryId on every open. */
  const legacyOpen = !controlled && !!props.open;
  const [legacy, setLegacy] = useState(() => ({ open: legacyOpen, view: legacyOpen ? legacySeed(config, props.initialItemId, props.initialEntryId) : null }));
  if (!controlled && legacy.open !== legacyOpen) setLegacy({ open: legacyOpen, view: legacyOpen ? legacySeed(config, props.initialItemId, props.initialEntryId) : null });

  // Legacy: the host's `open` stays the authority (a Back / Forward report never opens it on its own).
  const requested = controlled ? props.view : legacyOpen ? legacy.view : null;
  const view = requested ? canonicalView(config, requested) : null;
  const hrefFor = controlled ? props.hrefFor : undefined;

  const latest = useRef(props);
  latest.current = props;
  const navigate = useCallback((next: DossierView | null) => {
    const p = latest.current;
    if (p.view !== undefined) {
      p.onNavigate(next);
      return;
    }
    setLegacy((l) => ({ ...l, view: next }));
    if (next === null) p.onClose?.();
  }, []);

  useRouteHistory({ view, routes: dossierRoutes, hrefFor, onNavigate: navigate, history });

  /* Live content: a requested view the config no longer (or never) held settles on its canonical view; the host
     hears it, so its state and the URL agree with what is on screen. */
  const requestedKey = requested ? dossierRoutes.key(requested) : null;
  const canonicalKey = view ? dossierRoutes.key(view) : null;
  useEffect(() => {
    if (controlled && requestedKey !== null && requestedKey !== canonicalKey) navigate(view);
  }, [controlled, requestedKey, canonicalKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every open gets a fresh layer: reopening during the exit animation must not resume the closing one.
  // The layer keeps the last view, so the content stays on screen through the exit.
  // Only the layer of a direct load (the dossier mounts on the view the document was served on) may show its first
  // view at rest; a view still waiting on live content enters as usual, and every other open is an in-page open.
  const hydrated = useHydrated();
  const [layer, setLayer] = useState<{ key: number; closing: boolean; view: DossierView; rest: boolean } | null>(() =>
    view
      ? { key: 1, closing: false, view, rest: config.directLoad === "at-rest" && !awaitsLiveContent(config, view) && servedOn(hrefFor?.(view), hydrated) }
      : null,
  );
  if (view && (!layer || layer.closing)) setLayer({ key: (layer?.key ?? 0) + 1, closing: false, view, rest: false });
  else if (view && layer && dossierRoutes.key(view) !== dossierRoutes.key(layer.view)) setLayer({ ...layer, view });
  else if (!view && layer && !layer.closing) setLayer({ ...layer, closing: true });
  useIdlePreload(preload ? config : null);
  if (!layer) return null;
  const key = layer.key;
  return (
    <DossierLayer
      key={key}
      config={config}
      view={view ?? layer.view}
      hrefFor={hrefFor}
      onNavigate={navigate}
      className={className}
      rest={layer.rest}
      closing={layer.closing}
      onExited={() => setLayer((l) => (l && l.key === key && l.closing ? null : l))}
    />
  );
}

const FOCUSABLE = 'a[href], button, input, textarea, select, [tabindex], video[controls]';
/** Host chrome that must stay usable over the modal (a dev/showcase tool, never client UI): not made inert, not in the Tab trap. */
const KEEP_INTERACTIVE = "data-ev-keep-interactive";

type Kind = "opening" | "overview" | "detail";

/** A view resolved in a list of items: what the body draws and what its media gate waits for. */
type Scene = { kind: Kind; item: DossierItem | null; itemIndex: number; entry: DossierEntry | null; entryIndex: number; sig: string; page?: number };

function describe(items: DossierItem[], kind: Kind, itemId: string | null, entryId: string | null, page?: number): Scene | null {
  // A feed overview is its first batch: appended batches never change what the view waits on.
  if (kind === "overview") {
    const at = items.findIndex((i) => i.id === itemId);
    const feedItem = items[at];
    if (isFeedItem(feedItem)) {
      const p = pageNumber(page);
      return { kind, item: feedItem, itemIndex: at, entry: null, entryIndex: -1, page: p, sig: `v|${feedItem.id}|p${p}|${feedPageEntries(feedItem, p).map((e) => `${e.id}:${e.media.src}`).join(",")}` };
    }
  }
  if (kind === "opening") return { kind, item: null, itemIndex: -1, entry: null, entryIndex: -1, sig: `o|${items.map((i) => `${i.id}:${itemCover(i)?.src ?? ""}`).join(",")}` };
  const itemIndex = items.findIndex((i) => i.id === itemId);
  const item = items[itemIndex];
  if (!item) return null;
  if (kind === "overview") return { kind, item, itemIndex, entry: null, entryIndex: -1, sig: `v|${item.id}|${item.entries.map((e) => `${e.id}:${e.media.src}`).join(",")}` };
  const entryIndex = item.entries.findIndex((e) => e.id === entryId);
  const entry = item.entries[entryIndex];
  if (!entry) return null;
  return { kind, item, itemIndex, entry, entryIndex, sig: `d|${item.id}|${entry.id}|${[entry.media.src, ...(entry.sources ?? []).map(sourceSrc)].join(",")}` };
}

const sourceSrc = (s: MediaSource) => (typeof s === "string" ? s : s ? s.src : "");

function sourcesOf(scene: Scene, items: DossierItem[], boardSizes: string | undefined): MediaSource[] {
  if (scene.kind === "opening") return openingSources(items, boardSizes);
  if (scene.kind === "overview" && scene.item && isFeedItem(scene.item)) return feedSources(scene.item, pageNumber(scene.page));
  if (scene.kind === "overview") return overviewSources(scene.item?.entries ?? [], boardSizes);
  return scene.entry && scene.item ? detailSources(scene.entry, scene.item.entries, boardSizes, isFeedItem(scene.item)) : [];
}

/** The board an overview draws: the mosaic for four entries, the symmetric grid for other counts, a panel for none. */
const boardLayout = (count: number): SelectionBoardLayout | "empty" => (count === 4 ? "mosaic" : count === 0 ? "empty" : "grid");

type Shown = { kind: Kind; item: string | null; entry: string | null; sig: string; items: DossierItem[]; page?: number };

type DossierLayerProps = {
  config: DossierConfig;
  view: DossierView;
  hrefFor?: (view: DossierView | null) => string;
  onNavigate: (view: DossierView | null) => void;
  className?: string;
  /** The first view is shown at rest (config `directLoad: "at-rest"`, a direct load). */
  rest: boolean;
  closing: boolean;
  onExited: () => void;
};

const sceneKey = (s: { kind: Kind; item: string | null; entry: string | null; page?: number }) => `${s.kind}:${s.item}:${s.entry}${s.page && s.page > 1 ? `:${s.page}` : ""}`;

function DossierLayer({ config, view, hrefFor, onNavigate, className, rest, closing, onExited }: DossierLayerProps) {
  const { items, opening } = config;
  const composition = config.composition ?? "panorama";
  const tileMedia = config.tileMedia ?? "graded";
  const uid = useId();
  const titleId = `${uid}-title`;
  const boardHeadingId = `${uid}-board`;
  const detailHeadingId = `${uid}-detail`;
  const hydrated = useHydrated();

  /* Two views: `target` (the `view` prop) is where the visitor asked to go (header, strip, dock and the URL
     follow it at once); `shown` is what the body renders. The body keeps the previous view until the
     target's media is decoded, so a switch never cuts to an empty body; the loader covers it if the wait
     is long. Before the first view is shown, the body holds the target's copy (server HTML, crawlers):
     mounted but hidden once hydrated, it goes live — and enters — when the media is ready. */
  const atOpening = view.item === undefined;
  const itemIndex = atOpening ? -1 : Math.max(0, items.findIndex((i) => i.id === view.item));
  const item: DossierItem | null = atOpening ? null : (items[itemIndex] ?? null);
  // The view's item speaks in its own words (`item.copy`) over the config's.
  const copy = fullCopy(itemCopy(config.copy, item), config.locale);
  const entries = item?.entries ?? [];
  const entryIndex = item && view.entry !== undefined ? entries.findIndex((e) => e.id === view.entry) : -1;
  const entry = entryIndex >= 0 ? entries[entryIndex] : null;
  const kind: Kind = atOpening || !item ? "opening" : entry ? "detail" : "overview";
  // A feed's page view (and the entries opened from it) carries its page; page 1 is the overview.
  const feedItem = item && isFeedItem(item) ? item : null;
  const isFeed = feedItem !== null;
  const viewPage = isFeed && view.item !== undefined ? view.page : undefined;
  const target = describe(items, kind, item?.id ?? null, entry?.id ?? null, viewPage) as Scene;
  // A pending item's overview, or an entry its live content has not brought yet, waits behind the loader.
  const awaiting = feedItem ? feedAwaits(feedItem, viewPage, view.entry) : !!item?.pending && !entry;
  const itemCount = items.length;
  const prevItem = itemIndex >= 0 ? items[(itemIndex - 1 + itemCount) % itemCount] : null;
  const nextItem = itemIndex >= 0 ? items[(itemIndex + 1) % itemCount] : null;
  const href = (v: DossierView | null) => hrefFor?.(v);
  const wide = useMediaQuery(DESKTOP_QUERY, true) && composition === "panorama";

  /* At rest (a direct load): the first view counts as shown from the first render, server included, so the body is
     live, settled and unheld at once and hydration keeps the server DOM. Its own elements carry `data-rest` (no
     entrance); the next view the visitor opens takes the usual gate and entrance. */
  const [shown, setShown] = useState<Shown | null>(() =>
    rest ? { kind: target.kind, item: target.item?.id ?? null, entry: target.entry?.id ?? null, sig: target.sig, items, page: target.page } : null,
  );
  const [restKey] = useState(() => (rest ? sceneKey({ kind: target.kind, item: target.item?.id ?? null, entry: target.entry?.id ?? null, page: target.page }) : null));
  const restView = restKey !== null && shown !== null && sceneKey(shown) === restKey;
  const restTarget = restKey !== null && sceneKey({ kind, item: item?.id ?? null, entry: entry?.id ?? null, page: target.page }) === restKey;
  const [cut, setCut] = useState(0);

  /* ── Media gate on the target. The layer exists only while open, so the gate stays open through
     the exit animation and the content does not vanish while the shell leaves. */
  const boardSizes = boardSizesFor(composition);
  // A feed entry still being fetched (a deep link): the target stands in as the overview, but nothing is decoded for it.
  const awaitingEntry = isFeed && view.entry !== undefined && !entry;
  const sources = useMemo(() => (awaitingEntry ? [] : sourcesOf(target, items, boardSizes)), [target.sig, boardSizes, awaitingEntry]); // eslint-disable-line react-hooks/exhaustive-deps
  const gate = useMediaReady(true, sources);
  const ready = gate.ready && !awaiting;
  const settled = shown !== null && shown.kind === target.kind && shown.item === (target.item?.id ?? null) && shown.entry === (target.entry?.id ?? null) && shown.sig === target.sig;
  if (ready && !settled) {
    if (shown?.item && target.item && shown.item !== target.item.id) setCut((n) => n + 1);
    setShown({ kind: target.kind, item: target.item?.id ?? null, entry: target.entry?.id ?? null, sig: target.sig, items, page: target.page });
  }
  /* What the body carries: the shown view (from the live config while its content is unchanged, else as it was
     when shown, until the target is ready), or before anything is shown the target held. */
  const liveShown = shown ? describe(items, shown.kind, shown.item, shown.entry, shown.page) : null;
  const body: Scene = shown ? ((liveShown && liveShown.sig === shown.sig ? liveShown : describe(shown.items, shown.kind, shown.item, shown.entry, shown.page)) ?? target) : target;
  const bodyItems = shown && !(liveShown && liveShown.sig === shown.sig) ? shown.items : items;
  const openingReady = settled && kind === "opening";
  const overviewReady = settled && kind === "overview";
  const detailReady = settled && kind === "detail";
  const pending = shown !== null && !settled;
  const bodyLive = shown !== null;
  // The held stand-in is not shown once hydrated (the body looks as it always did: empty until the view enters).
  const waiting = hydrated && !bodyLive;

  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const boardHeadingRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const returnTileRef = useRef<number | null>(null);
  const prevTargetRef = useRef({ kind, itemIndex, entryIndex });
  const lastScrollRef = useRef(0);

  const [chromeHidden, setChromeHidden] = useState(false);
  const [complete, setComplete] = useState(false);
  const [live, setLive] = useState("");
  const [awaitSlow, setAwaitSlow] = useState(false);

  useEffect(() => {
    if (!awaiting) {
      setAwaitSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setAwaitSlow(true), mediaGate.graceMs);
    return () => window.clearTimeout(timer);
  }, [awaiting]);

  /* ── Feed: ask for what the view waits on (its page, a deep-linked entry); from the last loaded entry, the next
     page, so the dock's next has somewhere to go. Each board view remembers its batches and scroll while open. */
  const feedFailure = !!feedItem && feedFailed(feedItem, viewPage, view.entry);
  useEffect(() => {
    if (!feedItem) return;
    feedRequest(feedItem, viewPage, view.entry);
    const feed = feedOf(feedItem);
    const lastPage = feed.pages[feed.pages.length - 1];
    // Only an entry of the last loaded page (one fetched on its own belongs to none, and would pull every page).
    // Idle only: this effect runs on every render, so a page in error must wait for an explicit retry (no fetch loop).
    if (entry && lastPage && lastPage.next !== null && lastPage.ids[lastPage.ids.length - 1] === entry.id && feed.pageStatus(lastPage.page + 1) === "idle") feed.loadPage(lastPage.page + 1);
  });
  const feedMemory = useRef(new Map<string, FeedMemory>());
  const memoryFor = (key: string) => {
    let memory = feedMemory.current.get(key);
    if (!memory) feedMemory.current.set(key, (memory = {}));
    return memory;
  };

  /* ── Page behind: suspended (pause model), inert, scroll-locked while open. Released as soon as the
     exit starts (focus back on the launcher, page clickable), not when the animation ends. */
  useSuspendBackground(!closing);
  useLayoutEffect(() => {
    if (closing) return;
    const root = rootRef.current;
    const launcher = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const touched: [HTMLElement, boolean][] = [];
    let node: Element | null = root;
    while (node && node.parentElement && node !== document.body) {
      for (const sibling of Array.from(node.parentElement.children)) {
        if (sibling !== node && sibling instanceof HTMLElement && sibling.tagName !== "SCRIPT" && !sibling.hasAttribute(KEEP_INTERACTIVE)) {
          touched.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      node = node.parentElement;
    }
    const unlock = lockScroll();
    return () => {
      for (const [el, inert] of touched) el.inert = inert;
      unlock();
      // After the commit: React restores the focus it saw before the commit (the close button) once mutations are done.
      if (launcher) queueMicrotask(() => restoreFocus(launcher));
    };
  }, [closing]);

  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => onExitedRef.current(), EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  /* Focus moves in on open. A page loaded on a view URL has had no input yet: programmatic focus there would match
     `:focus-visible` and keep Close ringed for the whole read, so the dialog itself (no outline) takes it; the first
     Tab reaches the controls with their ring. */
  useEffect(() => {
    const coldLoad = typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === false;
    (coldLoad ? dialogRef.current : closeRef.current)?.focus({ preventScroll: true });
  }, []);

  /* ── Navigation: the modal never sets its own view. Every control asks the host (`onNavigate`); browser
     history follows the view (foundation `useRouteHistory`, in `Dossier`). Each target is also a link (`href`). */
  const navigateRef = useRef(onNavigate);
  navigateRef.current = onNavigate;
  const go = useCallback((next: DossierView | null) => navigateRef.current(next), []);

  const openingView: DossierView | null = opening ? { opening: opening.id } : null;
  const overviewView: DossierView | null = item ? itemView(config, item.id, undefined, viewPage) : null;
  const entryView = (i: number): DossierView => itemView(config, (item as DossierItem).id, entries[i].id, viewPage);
  // A feed's length is open: positions are spoken without a total.
  const fcopy = feedCopy(itemCopy(config.copy, item), config.locale);
  // A feed entry is placed by its page (page 3 continues at 19), never by its index among the loaded ones; one fetched on its own has no place.
  const entryLocation = (i: number, n: number, label: string, id?: string) => {
    if (!feedItem) return copy.entryLocation(i, n, label);
    const at = feedPosition(feedItem, id ?? label);
    return at === null ? label : fcopy.location(at, label);
  };
  const itemOverview = (it: DossierItem): DossierView => itemView(config, it.id);
  // The toast and the dock's next: next entry, else the next item's overview, else back to this overview.
  const nextView: DossierView | null =
    !entry || !nextItem ? null : entryIndex < entries.length - 1 ? entryView(entryIndex + 1) : itemCount > 1 ? itemOverview(nextItem) : overviewView;

  const viewRef = useRef(view);
  viewRef.current = view;
  const closeAll = useCallback(() => go(null), [go]);
  const toOverview = () => overviewView && go(overviewView);
  const toOpening = () => openingView && go(openingView);
  const openEntry = (index: number) => go(entryView(index));
  const switchItem = (delta: number) => go(itemOverview(items[(itemIndex + delta + itemCount) % itemCount]));
  const goNextEntry = () => {
    if (nextView) go(nextView);
  };
  // Escape and backdrop: one level up (entry → overview → opening → closed).
  const dismissOneLevel = useCallback(() => go(dossierRoutes.parent(viewRef.current)), [go]);

  /* ── Target changes: chrome, completion, live region, the tile to refocus on the way back. */
  const enteredFrom = useRef<Kind | null>(null);
  useEffect(() => {
    const previous = prevTargetRef.current;
    prevTargetRef.current = { kind, itemIndex, entryIndex };
    // Back up a level (Sommaire, Escape, browser Back): refocus the tile we came from.
    if (kind === "overview" && previous.kind === "detail") returnTileRef.current = previous.itemIndex === itemIndex ? previous.entryIndex : null;
    else if (kind === "opening" && previous.kind !== "opening") returnTileRef.current = previous.itemIndex;
    else if (kind !== previous.kind || previous.itemIndex !== itemIndex) returnTileRef.current = null;
    if (previous.kind !== kind) enteredFrom.current = previous.kind;
    setChromeHidden(false);
    setComplete(false);
    if (kind === "opening") setLive(opening?.title ?? "");
    else if (entry) setLive(entryLocation(entryIndex + 1, entries.length, entry.title, entry.id));
    else if (previous.kind === "detail" && item) setLive(copy.backTo(item.label));
    else if (item) setLive(`${copy.itemLocation(itemIndex + 1, itemCount, item.label)}${viewPage ? ` · ${fcopy.page(viewPage)}` : ""}`);
  }, [kind, entryIndex, itemIndex, viewPage]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Shown view changes: the new view starts at the top (before paint, before chapters measure); a feed board the
     visitor comes back to, where they left it. */
  const shownKey = shown ? sceneKey(shown) : "";
  useLayoutEffect(() => {
    lastScrollRef.current = 0;
    if (bodyRef.current) bodyRef.current.scrollTop = (shown?.kind === "overview" && feedMemory.current.get(shownKey)?.scroll) || 0;
  }, [shownKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const reveal = useChapterReveal(bodyRef);

  // Going down a level moves focus into the new view: the detail itself, or an item's board from the opening screen.
  useEffect(() => {
    if (!detailReady || enteredFrom.current !== "overview") return;
    enteredFrom.current = null;
    detailRef.current?.focus({ preventScroll: true });
  }, [detailReady, entryIndex]);
  useEffect(() => {
    if (!overviewReady || enteredFrom.current !== "opening") return;
    enteredFrom.current = null;
    boardHeadingRef.current?.focus({ preventScroll: true });
  }, [overviewReady, itemIndex]);

  useEffect(() => {
    if (!overviewReady && !openingReady) return;
    const index = returnTileRef.current;
    returnTileRef.current = null;
    if (index === null) return;
    const frame = requestAnimationFrame(() => {
      const tile = tileRefs.current[index];
      if (tile && !tile.matches(":disabled, [aria-disabled='true']")) tile.focus({ preventScroll: true });
      else boardHeadingRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [overviewReady, openingReady]);

  /* ── Desktop strip: the active tab's underline is the reading progress; ≥ 90 % offers the next tab. */
  useEffect(() => {
    const body = bodyRef.current;
    const strip = stripRef.current;
    strip?.style.setProperty("--evd-progress", "0");
    if (!body || !strip || !detailReady || !wide) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = body.scrollHeight - body.clientHeight;
      const atEnd = distance <= 2 || distance - body.scrollTop <= 2;
      const progress = atEnd ? 1 : Math.min(1, Math.max(0, body.scrollTop / distance));
      strip.style.setProperty("--evd-progress", String(progress));
      setComplete(progress >= 0.9);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(body);
    if (detailRef.current) observer.observe(detailRef.current);
    body.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      body.removeEventListener("scroll", schedule);
    };
  }, [detailReady, wide, entryIndex]);

  /* ── Capsule and dock (phone / tablet, the sheet): leave on scroll-down, return on scroll-up, near the top or on focus. */
  const onBodyScroll = useCallback(() => {
    const body = bodyRef.current;
    if (!body || wide || viewRef.current.entry === undefined) return;
    if (document.activeElement?.closest(".evd-header, .evd-dock")) return;
    const top = body.scrollTop;
    const last = lastScrollRef.current;
    lastScrollRef.current = top;
    if (top <= 24) return setChromeHidden(false);
    if (Math.abs(top - last) < 6) return;
    setChromeHidden(top > last);
  }, [wide]);

  /* ── Keyboard (document-level, so a view swap that drops focus never strands it):
     Escape = one level; Tab stays in the dialog. */
  const onKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (closing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        dismissOneLevel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.tabIndex >= 0 && !el.matches(":disabled") && !el.closest("[inert], [aria-hidden='true']") && el.getClientRects().length > 0 && getComputedStyle(el).visibility === "visible",
      );
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === first || !focusable.includes(active as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !focusable.includes(active as HTMLElement))) {
        event.preventDefault();
        first.focus();
      }
    },
    [closing, dismissOneLevel],
  );
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // A swapped view (detail ↔ overview, toast, strip) may remove the focused control: keep focus in the dialog.
  useEffect(() => {
    if (closing) return;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body || !dialogRef.current?.contains(active)) dialogRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [kind, entryIndex, itemIndex, complete, shownKey, closing]);

  const accentStyle = item?.accent
    ? ({ "--primary": item.accent, "--primary-foreground": item.accentInk ?? inkFor(item.accent) } as CSSProperties)
    : undefined;

  const bodyItem = body.item;
  const bodyEntry = body.entry;
  const bodyCtx: DossierEntryContext | null =
    bodyItem && bodyEntry ? { item: bodyItem, entry: bodyEntry, index: body.entryIndex, total: bodyItem.entries.length, close: closeAll, toOverview: () => go(itemView(config, bodyItem.id, undefined, viewPage)), headingId: detailHeadingId } : null;
  const bodyFeed = body.kind === "overview" && !!bodyItem && isFeedItem(bodyItem) && bodyItem.entries.length > 0;
  const bodyBoard = body.kind === "opening" ? "choice" : bodyFeed ? "feed" : body.kind === "overview" ? boardLayout(bodyItem?.entries.length ?? 0) : undefined;

  const nextEntryLabel = !entry || !nextItem ? "" : entryIndex < entries.length - 1 ? (entries[entryIndex + 1].label ?? entries[entryIndex + 1].title) : itemCount > 1 ? nextItem.label : copy.overview;
  const nextAria = !entry || !item || !nextItem ? "" : entryIndex < entries.length - 1 ? copy.nextEntry(nextEntryLabel) : itemCount > 1 ? copy.nextItem(nextItem.label) : copy.overviewOf(item.label);
  // An overview under an opening screen: the strip names the way up and the items (the pager would repeat them).
  const itemsStrip = kind === "overview" && !!opening;
  // A feed's page view is a level below its first page: the dock leads back up to it.
  const feedPageView = kind === "overview" && viewPage !== undefined && viewPage >= 2;
  const dockShown = kind === "detail" || feedPageView || (kind === "overview" && (itemCount > 1 || !!opening));
  const hideChrome = kind === "detail" && chromeHidden && !wide;
  const upLabel = opening ? openingLabel(opening) : "";

  /* No kicker on a detail (RULES §1); on the opening and overviews only the config's, and no element at all without
     text: an empty one keeps the meta column's gap and pushes the title off-centre. */
  const headerKicker = kind === "detail" ? undefined : config.kicker?.trim();
  // A detail's item, no longer shown above its title, stays spoken: in the dialog's name and right after the h1.
  const itemNameId = `${uid}-item`;
  const shortLabel = entry?.label && entry.label !== entry.title ? entry.label : null;
  // Strip tabs and dock bars: every entry, or for a feed a window around the open one.
  const tabs = isFeed ? feedWindow(entryIndex, entries.length) : entries.map((_, i) => i);
  const headerTitle =
    kind === "detail" && entry ? (
      entry.heading === "content" ? (
        // The content renders the view's h1 (`ctx.headingId`); the bar keeps the short name as a readout.
        <span className="evd-header__title" aria-hidden="true">{entryHeading(entry)}</span>
      ) : shortLabel ? (
        <>
          <h1 id={titleId} className="evd-header__title evd-header__title-full">{entry.title}</h1>
          <span className="evd-header__title evd-header__title-short" aria-hidden="true">{shortLabel}</span>
        </>
      ) : (
        <h1 id={titleId} className="evd-header__title">{entry.title}</h1>
      )
    ) : (
      <>
        <h1 id={titleId} className="evd-header__title evd-header__title-full">{kind === "opening" ? opening?.title : copy.overviewTitle(itemIndex + 1, item?.label ?? "")}{feedPageView && ` · ${fcopy.page(viewPage)}`}</h1>
        <span className="evd-header__title evd-header__title-short" aria-hidden="true">{kind === "opening" ? upLabel : item?.label}</span>
      </>
    );

  return (
    <div
      ref={rootRef}
      className={cn("ev-root ev-tone-dark ev-dossier", className)}
      data-phase={closing ? "closing" : "open"}
      data-composition={composition}
      data-view={body.kind}
      data-board={bodyBoard}
      data-dock={dockShown || undefined}
      data-rest={rest || undefined}
      data-rest-lock={(rest && !hydrated) || undefined}
      data-ev-route-layer=""
      style={accentStyle}
    >
      <div className="evd-backdrop" aria-hidden="true" onClick={dismissOneLevel} />
      <div
        className="evd-shell"
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) onExited();
        }}
      >
        <div ref={dialogRef} className="evd-dialog" role="dialog" aria-modal="true" aria-labelledby={kind === "detail" && item ? `${entry?.heading === "content" ? detailHeadingId : titleId} ${itemNameId}` : titleId} tabIndex={-1} data-ev-modal="">
          <span className="ev-sr" aria-live="polite" aria-atomic="true">{live}</span>

          <header className="evd-header" data-hidden={hideChrome || undefined} onFocusCapture={() => setChromeHidden(false)}>
            <div className="evd-header__bar">
              <div className="evd-header__identity">
                <span className="evd-header__brand">{config.brand.logo ?? <span className="ev-t-readout-lg">{config.brand.name}</span>}</span>
                <div className="evd-header__meta">
                  {headerKicker && <span className="evd-header__kicker">{headerKicker}</span>}
                  {/* The view's one h1 (its title; docs/CRAWLABLE-MODALS.md §4). Phones show the short readout instead, the h1 stays spoken. */}
                  {headerTitle}
                  {kind === "detail" && item && (
                    <span id={itemNameId} className="ev-sr">
                      {item.label}
                    </span>
                  )}
                </div>
              </div>

              {itemCount > 1 && item && prevItem && nextItem && !itemsStrip && (
                <nav className="evd-pager" aria-label={copy.itemsNav}>
                  <PagerLink direction="prev" label={copy.previousItem(prevItem.label)} href={href(itemOverview(prevItem))} onFollow={() => switchItem(-1)} />
                  <div className="evd-pager__location" role="status" aria-label={copy.itemLocation(itemIndex + 1, itemCount, item.label)}>
                    <span className="evd-pager__label" aria-hidden="true">{item.label}</span>
                    <span className="evd-bars" aria-hidden="true" style={{ ["--evd-bars" as string]: itemCount }}>
                      {items.map((it, i) => (
                        <span key={it.id} data-current={i === itemIndex || undefined} />
                      ))}
                    </span>
                  </div>
                  <PagerLink direction="next" label={copy.nextItem(nextItem.label)} href={href(itemOverview(nextItem))} onFollow={() => switchItem(1)} />
                </nav>
              )}

              <div className="evd-header__end">
                {config.attribution.enabled && <EvoviewMark className="evd-mark" href={config.attribution.href} label={config.attribution.label} />}
                <GlassClose ref={closeRef} className="evd-close" showLabel label={copy.close} aria-label={copy.closeDossier} onClick={closeAll} />
              </div>
            </div>
          </header>

          {entry && item && overviewView && (
            <nav ref={stripRef} className="evd-strip" aria-label={copy.entriesNav} style={{ ["--evd-tabs" as string]: tabs.length }}>
              <RouteLink className="evd-strip__overview" href={href(overviewView)} onFollow={toOverview} aria-label={copy.overviewOf(item.label)}>
                <TextFill hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}><ArrowLeft /></TextFill>
                <TextFill hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}>{copy.overview}</TextFill>
              </RouteLink>
              <div className="evd-strip__tabs">
                {tabs.map((i) => entries[i]).map((e, t) => {
                  const i = tabs[t];
                  return (
                  <StripTab
                    key={e.id}
                    href={href(entryView(i))}
                    state={i === entryIndex ? "active" : i < entryIndex ? "past" : undefined}
                    label={entryLocation(i + 1, entries.length, e.title, e.id)}
                    index={i}
                    numbered={!isFeed}
                    onFollow={() => i !== entryIndex && openEntry(i)}
                  >
                    {e.label ?? e.title}
                  </StripTab>
                  );
                })}
              </div>
              {complete && detailReady && (
                <div
                  className="evd-toast"
                  role="status"
                  data-anchor={entryIndex < entries.length - 1 ? "next" : "end"}
                  style={entryIndex < entries.length - 1 ? { left: `calc(var(--evd-strip-overview) + (100% - var(--evd-strip-overview)) * ${(tabs.indexOf(entryIndex) + 1) / tabs.length} + 16px)` } : undefined}
                >
                  <RouteLink className="evd-toast__action" data-ev-jelly="" href={href(nextView)} onFollow={goNextEntry} aria-label={nextAria}>
                    <span>
                      <small>{entryIndex < entries.length - 1 ? copy.toastNext : itemCount > 1 ? copy.toastEnd : copy.toastBack}</small>
                      <strong>{nextEntryLabel}</strong>
                    </span>
                    <ArrowRight />
                    <SurfaceFill hoverWithin=".evd-toast__action">
                      <span>
                        <small>{entryIndex < entries.length - 1 ? copy.toastNext : itemCount > 1 ? copy.toastEnd : copy.toastBack}</small>
                        <strong>{nextEntryLabel}</strong>
                      </span>
                      <ArrowRight />
                    </SurfaceFill>
                  </RouteLink>
                </div>
              )}
            </nav>
          )}

          {itemsStrip && openingView && (
            <nav ref={stripRef} className="evd-strip" data-level="items" aria-label={copy.itemsNav} style={{ ["--evd-tabs" as string]: itemCount }}>
              <RouteLink className="evd-strip__overview" href={href(openingView)} onFollow={toOpening} aria-label={copy.up(upLabel)}>
                <TextFill hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}><ArrowLeft /></TextFill>
                <TextFill truncate hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}>{upLabel}</TextFill>
              </RouteLink>
              <div className="evd-strip__tabs">
                {items.map((it, i) => (
                  <StripTab
                    key={it.id}
                    href={href(itemOverview(it))}
                    state={i === itemIndex ? "active" : undefined}
                    label={copy.itemLocation(i + 1, itemCount, it.label)}
                    index={i}
                    onFollow={() => i !== itemIndex && go(itemOverview(it))}
                  >
                    {it.label}
                  </StripTab>
                ))}
              </div>
            </nav>
          )}

          <div className="evd-viewport">
            <div
              ref={bodyRef}
              className="evd-body"
              data-locked={(hydrated && (!shown || (body.kind !== "detail" && pending))) || undefined}
              data-pending={pending || undefined}
              onScroll={onBodyScroll}
            >
              <div className="evd-atmosphere" aria-hidden="true" />
              <ChapterRevealContext.Provider value={restView ? null : reveal}><ChapterMediaContext.Provider value={tileMedia}>
                {/* Copy mounted from the first render (server HTML included); held until the view's media is
                    decoded, then remounted live so its entrance starts when the view used to mount. */}
                <HeldCopy live={bodyLive} rest={restView}>
                  {body.kind === "opening" && opening && (
                    <section
                      key="opening"
                      className="evd-overview evd-overview--opening"
                      aria-labelledby={boardHeadingId}
                      inert={hydrated && !openingReady}
                      aria-hidden={waiting || undefined}
                      data-waiting={waiting || undefined}
                      data-rest={restView || undefined}
                    >
                      <h2 id={boardHeadingId} ref={boardHeadingRef} tabIndex={-1} className="ev-sr">
                        {copy.chooseItem}
                      </h2>
                      <SelectionBoard
                        entries={bodyItems.map((it): SelectionTile => ({ id: it.id, title: it.label, kicker: it.kicker, media: itemCover(it) }))}
                        label={opening.title}
                        layout="choice"
                        numbered={false}
                        sizes={boardSizes}
                        tileMedia={tileMedia}
                        revealed
                        onSelect={(i) => go(itemView(config, bodyItems[i].id))}
                        hrefFor={hrefFor ? (i) => href(itemView(config, bodyItems[i].id)) : undefined}
                        openLabel={copy.openItem}
                        registerTile={(i, el) => {
                          tileRefs.current[i] = el;
                        }}
                      />
                    </section>
                  )}
                  {body.kind === "overview" && bodyItem && (
                    <section
                      key={bodyItem.id}
                      className="evd-overview"
                      aria-labelledby={boardHeadingId}
                      inert={hydrated && !overviewReady}
                      aria-hidden={waiting || undefined}
                      data-waiting={waiting || undefined}
                      data-rest={restView || undefined}
                    >
                      <h2 id={boardHeadingId} ref={boardHeadingRef} tabIndex={-1} className="ev-sr">
                        {copy.boardHeading(bodyItem.label)}
                      </h2>
                      {bodyFeed ? (
                        <FeedBoard
                          key={`feed-${pageNumber(body.page)}`}
                          item={bodyItem}
                          start={pageNumber(body.page)}
                          memory={memoryFor(sceneKey({ kind: "overview", item: bodyItem.id, entry: null, page: body.page }))}
                          scrollRoot={bodyRef}
                          label={copy.boardHeading(bodyItem.label)}
                          copy={fcopy}
                          tileMedia={tileMedia}
                          entryHref={(id) => (hrefFor ? href(itemView(config, bodyItem.id, id, body.page)) : undefined)}
                          pageHref={(p) => (hrefFor ? href(itemView(config, bodyItem.id, undefined, p)) : undefined)}
                          onEntry={(id) => go(itemView(config, bodyItem.id, id, body.page))}
                          onPage={(p) => go(itemView(config, bodyItem.id, undefined, p))}
                          registerTile={(i, el) => {
                            tileRefs.current[i] = el;
                          }}
                        />
                      ) : bodyItem.entries.length > 0 ? (
                        <SelectionBoard
                          entries={bodyItem.entries}
                          label={copy.boardHeading(bodyItem.label)}
                          sizes={boardSizes}
                          tileMedia={tileMedia}
                          revealed
                          onSelect={(i) => go(itemView(config, bodyItem.id, bodyItem.entries[i].id))}
                          hrefFor={hrefFor ? (i) => href(itemView(config, bodyItem.id, bodyItem.entries[i].id)) : undefined}
                          openLabel={copy.openEntry}
                          registerTile={(i, el) => {
                            tileRefs.current[i] = el;
                          }}
                        />
                      ) : bodyItem.pending ? null : (
                        <EmptyBoard
                          {...(bodyItem.empty ?? copy.empty)}
                          next={itemCount > 1 && nextItem && nextItem.id !== bodyItem.id ? { label: nextItem.label, aria: copy.nextItem(nextItem.label), href: href(itemOverview(nextItem)), onFollow: () => switchItem(1) } : null}
                        />
                      )}
                    </section>
                  )}
                  {body.kind === "detail" && bodyItem && bodyEntry && bodyCtx && (
                    <div
                      key={`${bodyItem.id}:${bodyEntry.id}`}
                      ref={detailRef}
                      className="evd-detail"
                      tabIndex={-1}
                      aria-labelledby={bodyEntry.heading === "content" ? detailHeadingId : titleId}
                      inert={hydrated && !detailReady}
                      aria-hidden={waiting || undefined}
                      data-waiting={waiting || undefined}
                      data-rest={restView || undefined}
                    >
                      {bodyEntry.content(bodyCtx)}
                    </div>
                  )}
                </HeldCopy>
              </ChapterMediaContext.Provider></ChapterRevealContext.Provider>
            </div>
            {cut > 0 && <div key={cut} className="evd-cut" aria-hidden="true" />}
            {hydrated && !ready && !settled && (awaiting ? awaitSlow : gate.slow || gate.failed) && (
              <DossierLoader
                kicker={kind === "detail" ? copy.loader.detailKicker(entryIndex + 1) : kind === "opening" ? upLabel : copy.loader.overviewKicker(itemIndex + 1)}
                title={copy.loader.title}
                status={awaiting ? copy.pendingStatus : copy.loader.status}
                loaded={awaiting ? 0 : gate.loaded}
                total={awaiting ? 1 : gate.total}
                spoken={awaiting ? copy.pendingStatus : copy.loader.spoken(gate.loaded, gate.total)}
                failed={(!awaiting && gate.failed) || feedFailure}
                failedText={feedFailure ? fcopy.unavailable : copy.loader.failed}
                retryLabel={copy.loader.retry}
                onRetry={feedFailure && item ? () => feedRequest(item, viewPage, view.entry, true) : gate.retry}
              />
            )}
          </div>

          {dockShown && item && (
            <nav className="evd-dock" data-hidden={hideChrome || undefined} aria-label={entry ? copy.entriesNav : copy.itemsNav} onFocusCapture={() => setChromeHidden(false)}>
              <div className="evd-dock__glass">
                {entry ? (
                  <DockButton side="start" label={copy.dock.home} aria={copy.overviewOf(item.label)} icon={<HomeIcon />} href={href(overviewView)} onClick={toOverview} />
                ) : feedPageView ? (
                  <DockButton side="start" label={copy.dock.home} aria={copy.overviewOf(item.label)} icon={<HomeIcon />} href={href(itemView(config, item.id))} onClick={() => go(itemView(config, item.id))} />
                ) : opening ? (
                  <DockButton side="start" label={upLabel} aria={copy.up(upLabel)} icon={<ArrowLeft />} href={href(openingView)} onClick={toOpening} />
                ) : (
                  prevItem && <DockButton side="start" label={copy.dock.previous} aria={copy.previousItem(prevItem.label)} icon={<ArrowLeft />} href={href(itemOverview(prevItem))} onClick={() => switchItem(-1)} />
                )}
                <div
                  className="evd-dock__location"
                  role="status"
                  aria-label={entry ? entryLocation(entryIndex + 1, entries.length, entry.title, entry.id) : feedPageView ? `${item.label} · ${fcopy.page(viewPage)}` : copy.itemLocation(itemIndex + 1, itemCount, item.label)}
                >
                  <span className="evd-dock__kicker" aria-hidden="true">{entry || feedPageView ? item.label : copy.dock.item}</span>
                  {feedPageView ? (
                    <span key={`p${viewPage}`} className="evd-dock__count" aria-hidden="true">
                      {fcopy.page(viewPage)}
                    </span>
                  ) : entry && feedItem && !feedPageOf(feedItem, entry.id) ? null : (
                    <span key={entry ? `e${entryIndex}` : `i${itemIndex}`} className="evd-dock__count" aria-hidden="true" data-rest={restTarget || undefined}>
                      {pad((entry ? entryIndex : itemIndex) + 1)}
                      <span>/</span>
                      {pad(entry ? entries.length : itemCount)}
                      {entry && isFeed && feedHasMore(item) && "+"}
                    </span>
                  )}
                  <span className="evd-bars evd-bars--dock" aria-hidden="true">
                    {(entry ? tabs.map((i) => entries[i]) : items).map((x, i) => (
                      <span key={x.id} data-current={(entry ? x.id === entry.id : i === itemIndex) || undefined} />
                    ))}
                  </span>
                </div>
                {feedPageView && feedOf(item).pageStatus(viewPage + 1) !== "missing" && (
                  <DockButton
                    side="end"
                    label={copy.dock.next}
                    aria={fcopy.older}
                    icon={<ArrowRight />}
                    href={href(itemView(config, item.id, undefined, viewPage + 1))}
                    onClick={() => go(itemView(config, item.id, undefined, viewPage + 1))}
                  />
                )}
                {!feedPageView && (entry || itemCount > 1) && nextItem && (
                  <DockButton
                    side="end"
                    label={copy.dock.next}
                    aria={entry ? nextAria : copy.nextItem(nextItem.label)}
                    icon={<ArrowRight />}
                    href={href(entry ? nextView : itemOverview(nextItem))}
                    onClick={entry ? goNextEntry : () => switchItem(1)}
                  />
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

/** A strip cell: an entry of the item (detail) or an item under the opening screen (overview). */
function StripTab({ href, state, label, index, numbered = true, onFollow, children }: { href?: string; state?: "active" | "past"; label: string; index: number; numbered?: boolean; onFollow: () => void; children: ReactNode }) {
  return (
    <RouteLink className="evd-strip__tab" href={href} data-state={state} aria-current={state === "active" ? "page" : undefined} aria-label={label} onFollow={onFollow}>
      {numbered && <span className="evd-strip__num">{pad(index + 1)}</span>}
      <span className="evd-strip__label">
        <TextFill
          truncate
          ink={state === "active" ? "#fff" : state === "past" ? "rgb(255 255 255 / 0.72)" : undefined}
          hoverWithin={state === "active" ? undefined : ".evd-strip__tab"}
          hoverInk="#fff"
          withFocus={false}
        >
          {children}
        </TextFill>
      </span>
      <span className="evd-strip__progress" aria-hidden="true" />
    </RouteLink>
  );
}

/** The board of an item without entries (a live list on an empty day): the config's sentence, and the way on. */
function EmptyBoard({ title, body, next }: { title: string; body?: string; next: { label: string; aria: string; href?: string; onFollow: () => void } | null }) {
  return (
    <div className="evd-empty">
      <p className="ev-t-card evd-empty__title">{title}</p>
      {body && <p className="ev-t-body evd-empty__body">{body}</p>}
      {next &&
        (next.href === undefined ? (
          <GhostAction className="evd-empty__action" icon={<ArrowRight />} iconPosition="end" aria-label={next.aria} onClick={next.onFollow}>
            {next.label}
          </GhostAction>
        ) : (
          <GhostAction className="evd-empty__action" icon={<ArrowRight />} iconPosition="end" aria-label={next.aria} href={next.href} onClick={(event) => followRouteLink(event, next.onFollow)}>
            {next.label}
          </GhostAction>
        ))}
    </div>
  );
}

/* Chapter reveal driven by the body's own scroll position, not by an IntersectionObserver against
   the viewport: a chapter reveals once its top passes 90 % of the body's height (capped at 96px from
   the bottom). Every pending chapter above that line reveals too, so a jump (scrollbar drag, End,
   the toast) never leaves skipped chapters invisible. Checks run on scroll, resize and registration. */
function useChapterReveal(bodyRef: RefObject<HTMLDivElement | null>): ChapterReveal {
  const pending = useRef(new Map<HTMLElement, () => void>());
  const frame = useRef(0);
  const check = useCallback(() => {
    frame.current = 0;
    const body = bodyRef.current;
    if (!body || !pending.current.size) return;
    const rect = body.getBoundingClientRect();
    const line = rect.bottom - Math.min(rect.height * 0.1, 96);
    for (const [el, reveal] of Array.from(pending.current)) {
      if (!el.isConnected) pending.current.delete(el);
      else if (el.getBoundingClientRect().top < line) {
        pending.current.delete(el);
        reveal();
      }
    }
  }, [bodyRef]);
  const schedule = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(check);
  }, [check]);
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const observer = new ResizeObserver(schedule);
    observer.observe(body);
    body.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer.disconnect();
      body.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [bodyRef, schedule]);
  return useCallback<ChapterReveal>(
    (el, reveal) => {
      pending.current.set(el, reveal);
      schedule();
      return () => {
        pending.current.delete(el);
      };
    },
    [schedule],
  );
}

/* Decode every item's board media once the page is idle (foundation `preloadMedia`, the gate's own
   memory): opening or switching to a preloaded universe is ready on the gate's first render.
   Images only (videos are left to the gate); the opening screen's covers first, then the first tile of
   each item, and so on. */
function useIdlePreload(config: DossierConfig | null) {
  const list = useMemo(() => {
    if (!config) return [];
    const boardSizes = boardSizesFor(config.composition ?? "panorama");
    const images = (sources: MediaSource[]) => sources.filter((s): s is { src: string; type: "image"; srcSet?: string; sizes?: string } => !!s && typeof s === "object" && s.type === "image");
    const covers = config.opening ? images(openingSources(config.items, boardSizes)) : [];
    // A feed warms its first page only: the rest is fetched, and decoded, batch by batch.
    const rows = config.items.map((item) => images(isFeedItem(item) ? feedSources(item, 1) : overviewSources(item.entries, boardSizes)));
    const ordered = [...covers];
    for (let i = 0; rows.some((r) => i < r.length); i++) for (const r of rows) if (i < r.length) ordered.push(r[i]);
    return ordered;
  }, [config]);
  const signature = JSON.stringify(list);
  useEffect(() => {
    if (signature === "[]") return;
    const sources = JSON.parse(signature) as MediaSource[];
    const run = () => void preloadMedia(sources);
    const hasIdle = typeof window.requestIdleCallback === "function";
    const handle = hasIdle ? window.requestIdleCallback(run, { timeout: 2500 }) : window.setTimeout(run, 1200);
    return () => {
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [signature]);
}

/** Header pager orb: a link to the item's view when it has a URL, a button otherwise. */
function PagerLink({ direction, label, href, onFollow }: { direction: "prev" | "next"; label: string; href?: string; onFollow: () => void }) {
  if (href === undefined) return <PagerOrb direction={direction} label={label} onClick={onFollow} />;
  return <PagerOrb direction={direction} label={label} href={href} onClick={(event) => followRouteLink(event, onFollow)} />;
}

function DockButton({ side, label, aria, icon, href, onClick }: { side: "start" | "end"; label: string; aria: string; icon: ReactNode; href?: string; onClick: () => void }) {
  const [tap, setTap] = useState(0);
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--evd-touch-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--evd-touch-y", `${e.clientY - rect.top}px`);
  };
  return (
    <RouteLink
      className="evd-dock__item"
      data-ev-jelly=""
      href={href}
      data-side={side}
      data-tap={tap % 2 === 1 ? "a" : tap > 0 ? "b" : undefined}
      aria-label={aria}
      onPointerDown={onPointerDown}
      onFollow={() => {
        setTap((n) => n + 1);
        onClick();
      }}
    >
      <span className="evd-dock__icon">
        <TextFill hoverWithin=".evd-dock__item" hoverInk="#fff" withHover={false} withFocus={false} withPress>{icon}</TextFill>
      </span>
      <span className="evd-dock__label">
        <TextFill truncate hoverWithin=".evd-dock__item" hoverInk="#fff" withHover={false} withFocus={false} withPress>{label}</TextFill>
      </span>
    </RouteLink>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable={false}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </svg>
  );
}
