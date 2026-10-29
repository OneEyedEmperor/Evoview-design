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
import { fullCopy } from "./copy";
import { DossierLoader } from "./Loader";
import { DESKTOP_QUERY, isVideo, toSource } from "./hooks";
import { dossierRoutes, entryHeading, itemCover, itemView, openingLabel, topView, type DossierView } from "./routes";
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
  if (requested.entry === undefined) return itemView(config, item.id);
  if (item.pending || item.entries.some((e) => e.id === requested.entry)) return itemView(config, item.id, requested.entry);
  return itemView(config, item.id);
}

/** The view's body waits on a pending item's live content (its overview, or an entry not brought yet). */
function awaitsLiveContent(config: DossierConfig, view: DossierView): boolean {
  if (view.item === undefined) return false;
  const item = config.items.find((i) => i.id === view.item);
  return !!item?.pending && !item.entries.some((e) => e.id === view.entry);
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
type Scene = { kind: Kind; item: DossierItem | null; itemIndex: number; entry: DossierEntry | null; entryIndex: number; sig: string };

function describe(items: DossierItem[], kind: Kind, itemId: string | null, entryId: string | null): Scene | null {
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

function sourcesOf(scene: Scene, items: DossierItem[]): MediaSource[] {
  if (scene.kind === "opening") return items.map((i) => itemCover(i)).filter((m) => m !== undefined).map(toSource);
  if (scene.kind === "overview") return (scene.item?.entries ?? []).map((e) => toSource(e.media));
  return scene.entry ? [toSource(scene.entry.media), ...(scene.entry.sources ?? [])] : [];
}

/** The board an overview draws: the mosaic for four entries, the symmetric grid for other counts, a panel for none. */
const boardLayout = (count: number): SelectionBoardLayout | "empty" => (count === 4 ? "mosaic" : count === 0 ? "empty" : "grid");

type Shown = { kind: Kind; item: string | null; entry: string | null; sig: string; items: DossierItem[] };

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

const sceneKey = (s: { kind: Kind; item: string | null; entry: string | null }) => `${s.kind}:${s.item}:${s.entry}`;

function DossierLayer({ config, view, hrefFor, onNavigate, className, rest, closing, onExited }: DossierLayerProps) {
  const { items, opening } = config;
  const copy = fullCopy(config.copy, config.locale);
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
  const entries = item?.entries ?? [];
  const entryIndex = item && view.entry !== undefined ? entries.findIndex((e) => e.id === view.entry) : -1;
  const entry = entryIndex >= 0 ? entries[entryIndex] : null;
  const kind: Kind = atOpening || !item ? "opening" : entry ? "detail" : "overview";
  const target = describe(items, kind, item?.id ?? null, entry?.id ?? null) as Scene;
  // A pending item's overview, or an entry its live content has not brought yet, waits behind the loader.
  const awaiting = !!item?.pending && !entry;
  const itemCount = items.length;
  const prevItem = itemIndex >= 0 ? items[(itemIndex - 1 + itemCount) % itemCount] : null;
  const nextItem = itemIndex >= 0 ? items[(itemIndex + 1) % itemCount] : null;
  const href = (v: DossierView | null) => hrefFor?.(v);
  const wide = useMediaQuery(DESKTOP_QUERY, true) && composition === "panorama";

  /* At rest (a direct load): the first view counts as shown from the first render, server included, so the body is
     live, settled and unheld at once and hydration keeps the server DOM. Its own elements carry `data-rest` (no
     entrance); the next view the visitor opens takes the usual gate and entrance. */
  const [shown, setShown] = useState<Shown | null>(() =>
    rest ? { kind: target.kind, item: target.item?.id ?? null, entry: target.entry?.id ?? null, sig: target.sig, items } : null,
  );
  const [restKey] = useState(() => (rest ? sceneKey({ kind: target.kind, item: target.item?.id ?? null, entry: target.entry?.id ?? null }) : null));
  const restView = restKey !== null && shown !== null && sceneKey(shown) === restKey;
  const restTarget = restKey !== null && sceneKey({ kind, item: item?.id ?? null, entry: entry?.id ?? null }) === restKey;
  const [cut, setCut] = useState(0);

  /* ── Media gate on the target. The layer exists only while open, so the gate stays open through
     the exit animation and the content does not vanish while the shell leaves. */
  const sources = useMemo(() => sourcesOf(target, items), [target.sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const gate = useMediaReady(true, sources);
  const ready = gate.ready && !awaiting;
  const settled = shown !== null && shown.kind === target.kind && shown.item === (target.item?.id ?? null) && shown.entry === (target.entry?.id ?? null) && shown.sig === target.sig;
  if (ready && !settled) {
    if (shown?.item && target.item && shown.item !== target.item.id) setCut((n) => n + 1);
    setShown({ kind: target.kind, item: target.item?.id ?? null, entry: target.entry?.id ?? null, sig: target.sig, items });
  }
  /* What the body carries: the shown view (from the live config while its content is unchanged, else as it was
     when shown, until the target is ready), or before anything is shown the target held. */
  const liveShown = shown ? describe(items, shown.kind, shown.item, shown.entry) : null;
  const body: Scene = shown ? ((liveShown && liveShown.sig === shown.sig ? liveShown : describe(shown.items, shown.kind, shown.item, shown.entry)) ?? target) : target;
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

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  /* ── Navigation: the modal never sets its own view. Every control asks the host (`onNavigate`); browser
     history follows the view (foundation `useRouteHistory`, in `Dossier`). Each target is also a link (`href`). */
  const navigateRef = useRef(onNavigate);
  navigateRef.current = onNavigate;
  const go = useCallback((next: DossierView | null) => navigateRef.current(next), []);

  const openingView: DossierView | null = opening ? { opening: opening.id } : null;
  const overviewView: DossierView | null = item ? itemView(config, item.id) : null;
  const entryView = (i: number): DossierView => itemView(config, (item as DossierItem).id, entries[i].id);
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
    else if (entry) setLive(copy.entryLocation(entryIndex + 1, entries.length, entry.title));
    else if (previous.kind === "detail" && item) setLive(copy.backTo(item.label));
    else if (item) setLive(copy.itemLocation(itemIndex + 1, itemCount, item.label));
  }, [kind, entryIndex, itemIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Shown view changes: the new view starts at the top (before paint, before chapters measure). */
  const shownKey = shown ? `${shown.kind}:${shown.item}:${shown.entry}` : "";
  useLayoutEffect(() => {
    lastScrollRef.current = 0;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [shownKey]);

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
    bodyItem && bodyEntry ? { item: bodyItem, entry: bodyEntry, index: body.entryIndex, total: bodyItem.entries.length, close: closeAll, toOverview: () => go(itemView(config, bodyItem.id)) } : null;
  const bodyBoard = body.kind === "opening" ? "choice" : body.kind === "overview" ? boardLayout(bodyItem?.entries.length ?? 0) : undefined;
  const boardSizes = composition === "sheet" ? "(max-width: 599px) 100vw, (max-width: 1023px) 50vw, 360px" : undefined;

  const nextEntryLabel = !entry || !nextItem ? "" : entryIndex < entries.length - 1 ? (entries[entryIndex + 1].label ?? entries[entryIndex + 1].title) : itemCount > 1 ? nextItem.label : copy.overview;
  const nextAria = !entry || !item || !nextItem ? "" : entryIndex < entries.length - 1 ? copy.nextEntry(nextEntryLabel) : itemCount > 1 ? copy.nextItem(nextItem.label) : copy.overviewOf(item.label);
  // An overview under an opening screen: the strip names the way up and the items (the pager would repeat them).
  const itemsStrip = kind === "overview" && !!opening;
  const dockShown = kind === "detail" || (kind === "overview" && (itemCount > 1 || !!opening));
  const hideChrome = kind === "detail" && chromeHidden && !wide;
  const upLabel = opening ? openingLabel(opening) : "";

  /* No kicker on a detail (RULES §1); on the opening and overviews only the config's, and no element at all without
     text: an empty one keeps the meta column's gap and pushes the title off-centre. */
  const headerKicker = kind === "detail" ? undefined : config.kicker?.trim();
  // A detail's item, no longer shown above its title, stays spoken: in the dialog's name and right after the h1.
  const itemNameId = `${uid}-item`;
  const headerTitle =
    kind === "detail" && entry ? (
      <h1 id={titleId} className="evd-header__title">{entryHeading(entry)}</h1>
    ) : (
      <>
        <h1 id={titleId} className="evd-header__title evd-header__title-full">{kind === "opening" ? opening?.title : copy.overviewTitle(itemIndex + 1, item?.label ?? "")}</h1>
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
        <div ref={dialogRef} className="evd-dialog" role="dialog" aria-modal="true" aria-labelledby={kind === "detail" && item ? `${titleId} ${itemNameId}` : titleId} tabIndex={-1} data-ev-modal="">
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
            <nav ref={stripRef} className="evd-strip" aria-label={copy.entriesNav} style={{ ["--evd-tabs" as string]: entries.length }}>
              <RouteLink className="evd-strip__overview" href={href(overviewView)} onFollow={toOverview} aria-label={copy.overviewOf(item.label)}>
                <TextFill hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}><ArrowLeft /></TextFill>
                <TextFill hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}>{copy.overview}</TextFill>
              </RouteLink>
              <div className="evd-strip__tabs">
                {entries.map((e, i) => (
                  <StripTab
                    key={e.id}
                    href={href(entryView(i))}
                    state={i === entryIndex ? "active" : i < entryIndex ? "past" : undefined}
                    label={copy.entryLocation(i + 1, entries.length, e.title)}
                    index={i}
                    onFollow={() => i !== entryIndex && openEntry(i)}
                  >
                    {e.label ?? e.title}
                  </StripTab>
                ))}
              </div>
              {complete && detailReady && (
                <div
                  className="evd-toast"
                  role="status"
                  data-anchor={entryIndex < entries.length - 1 ? "next" : "end"}
                  style={entryIndex < entries.length - 1 ? { left: `calc(var(--evd-strip-overview) + (100% - var(--evd-strip-overview)) * ${(entryIndex + 1) / entries.length} + 16px)` } : undefined}
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
                      {bodyItem.entries.length > 0 ? (
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
                      aria-labelledby={detailHeadingId}
                      inert={hydrated && !detailReady}
                      aria-hidden={waiting || undefined}
                      data-waiting={waiting || undefined}
                      data-rest={restView || undefined}
                    >
                      <h2 id={detailHeadingId} className="ev-sr">{bodyEntry.title}</h2>
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
                failed={!awaiting && gate.failed}
                failedText={copy.loader.failed}
                retryLabel={copy.loader.retry}
                onRetry={gate.retry}
              />
            )}
          </div>

          {dockShown && item && (
            <nav className="evd-dock" data-hidden={hideChrome || undefined} aria-label={entry ? copy.entriesNav : copy.itemsNav} onFocusCapture={() => setChromeHidden(false)}>
              <div className="evd-dock__glass">
                {entry ? (
                  <DockButton side="start" label={copy.dock.home} aria={copy.overviewOf(item.label)} icon={<HomeIcon />} href={href(overviewView)} onClick={toOverview} />
                ) : opening ? (
                  <DockButton side="start" label={upLabel} aria={copy.up(upLabel)} icon={<ArrowLeft />} href={href(openingView)} onClick={toOpening} />
                ) : (
                  prevItem && <DockButton side="start" label={copy.dock.previous} aria={copy.previousItem(prevItem.label)} icon={<ArrowLeft />} href={href(itemOverview(prevItem))} onClick={() => switchItem(-1)} />
                )}
                <div
                  className="evd-dock__location"
                  role="status"
                  aria-label={entry ? copy.entryLocation(entryIndex + 1, entries.length, entry.title) : copy.itemLocation(itemIndex + 1, itemCount, item.label)}
                >
                  <span className="evd-dock__kicker" aria-hidden="true">{entry ? item.label : copy.dock.item}</span>
                  <span key={entry ? `e${entryIndex}` : `i${itemIndex}`} className="evd-dock__count" aria-hidden="true" data-rest={restTarget || undefined}>
                    {pad((entry ? entryIndex : itemIndex) + 1)}
                    <span>/</span>
                    {pad(entry ? entries.length : itemCount)}
                  </span>
                  <span className="evd-bars evd-bars--dock" aria-hidden="true">
                    {(entry ? entries : items).map((x, i) => (
                      <span key={x.id} data-current={i === (entry ? entryIndex : itemIndex) || undefined} />
                    ))}
                  </span>
                </div>
                {(entry || itemCount > 1) && nextItem && (
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
function StripTab({ href, state, label, index, onFollow, children }: { href?: string; state?: "active" | "past"; label: string; index: number; onFollow: () => void; children: ReactNode }) {
  return (
    <RouteLink className="evd-strip__tab" href={href} data-state={state} aria-current={state === "active" ? "page" : undefined} aria-label={label} onFollow={onFollow}>
      <span className="evd-strip__num">{pad(index + 1)}</span>
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
    const image = (m: DossierEntry["media"] | undefined) => (m && !isVideo(m) ? [m.src] : []);
    const covers = config.opening ? config.items.flatMap((item) => image(itemCover(item))) : [];
    const rows = config.items.map((item) => item.entries.flatMap((e) => image(e.media)));
    const ordered: string[] = [...covers];
    for (let i = 0; rows.some((r) => i < r.length); i++) for (const r of rows) if (i < r.length) ordered.push(r[i]);
    return Array.from(new Set(ordered));
  }, [config]);
  const signature = list.join("|");
  useEffect(() => {
    if (!signature) return;
    const sources = signature.split("|").map((src) => ({ src, type: "image" as const }));
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
