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
  pad,
  preloadMedia,
  RouteLink,
  SurfaceFill,
  TextFill,
  useHydrated,
  useMediaQuery,
  useMediaReady,
  useRouteHistory,
  usePressJelly,
  useSuspendBackground,
  type RouteViewProps,
} from "../foundation";
import { GlassClose, PagerOrb } from "../controls";
import { SelectionBoard } from "./Board";
import { ChapterRevealContext, type ChapterReveal } from "./Chapters";
import { DossierLoader } from "./Loader";
import { DESKTOP_QUERY, isVideo, toSource } from "./hooks";
import { dossierRoutes, entryHeading, resolveView, type DossierView } from "./routes";
import type { DossierConfig, DossierEntryContext } from "./types";

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
  /** Item shown on open (default: first). */
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

/** A view of this config: unknown ids fall back to the first item / the item's overview. */
function canonicalView(config: DossierConfig, itemId?: string, entryId?: string): DossierView | null {
  const item = config.items.find((i) => i.id === itemId) ?? config.items[0];
  if (!item) return null;
  const entry = entryId === undefined ? undefined : item.entries.find((e) => e.id === entryId);
  return entry ? { item: item.id, entry: entry.id } : { item: item.id };
}

/** The portal modal: isolate, demonstrate, explain. Renders in place (fixed layer) so the host accent is inherited. */
export function Dossier(props: DossierProps) {
  const { config, preload = true, className, history } = props;
  const controlled = props.view !== undefined;
  usePressJelly();

  /* Legacy API: an internal view, seeded from initialItemId / initialEntryId on every open. */
  const legacyOpen = !controlled && !!props.open;
  const [legacy, setLegacy] = useState(() => ({ open: legacyOpen, view: legacyOpen ? canonicalView(config, props.initialItemId, props.initialEntryId) : null }));
  if (!controlled && legacy.open !== legacyOpen) setLegacy({ open: legacyOpen, view: legacyOpen ? canonicalView(config, props.initialItemId, props.initialEntryId) : null });

  // Legacy: the host's `open` stays the authority (a Back / Forward report never opens it on its own).
  const requested = controlled ? props.view : legacyOpen ? legacy.view : null;
  const view = requested ? canonicalView(config, requested.item, requested.entry) : null;
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

  // Every open gets a fresh layer: reopening during the exit animation must not resume the closing one.
  // The layer keeps the last view, so the content stays on screen through the exit.
  const [layer, setLayer] = useState<{ key: number; closing: boolean; view: DossierView } | null>(() => (view ? { key: 1, closing: false, view } : null));
  if (view && (!layer || layer.closing)) setLayer({ key: (layer?.key ?? 0) + 1, closing: false, view });
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
      closing={layer.closing}
      onExited={() => setLayer((l) => (l && l.key === key && l.closing ? null : l))}
    />
  );
}

const FOCUSABLE = 'a[href], button, input, textarea, select, [tabindex], video[controls]';
/** Host chrome that must stay usable over the modal (a dev/showcase tool, never client UI): not made inert, not in the Tab trap. */
const KEEP_INTERACTIVE = "data-ev-keep-interactive";

type View = { item: number; entry: number | null };

type DossierLayerProps = {
  config: DossierConfig;
  view: DossierView;
  hrefFor?: (view: DossierView | null) => string;
  onNavigate: (view: DossierView | null) => void;
  className?: string;
  closing: boolean;
  onExited: () => void;
};

function DossierLayer({ config, view, hrefFor, onNavigate, className, closing, onExited }: DossierLayerProps) {
  const { items, copy } = config;
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
  const found = resolveView(config, view);
  const itemIndex = found?.itemIndex ?? 0;
  const entryIndex = found?.entry ? found.entryIndex : null;
  const [shown, setShown] = useState<View | null>(null);
  const [cut, setCut] = useState(0);

  const item = items[itemIndex] ?? items[0];
  const entries = item.entries;
  const entry = entryIndex === null ? null : (entries[entryIndex] ?? null);
  const itemCount = items.length;
  const prevItem = items[(itemIndex - 1 + itemCount) % itemCount];
  const nextItem = items[(itemIndex + 1) % itemCount];
  const href = (v: DossierView | null) => hrefFor?.(v);

  /* ── Media gate on the target. The layer exists only while open, so the gate stays open through
     the exit animation and the content does not vanish while the shell leaves. */
  const sources = useMemo(
    () => (entry ? [toSource(entry.media), ...(entry.sources ?? [])] : entries.map((e) => toSource(e.media))),
    [entry, entries],
  );
  const gate = useMediaReady(true, sources);
  const settled = shown !== null && shown.item === itemIndex && shown.entry === entryIndex;
  if (gate.ready && !settled) {
    if (shown && shown.item !== itemIndex) setCut((n) => n + 1);
    setShown({ item: itemIndex, entry: entryIndex });
  }
  const shownItem = shown ? (items[shown.item] ?? items[0]) : null;
  const shownEntry = shownItem && shown && shown.entry !== null ? (shownItem.entries[shown.entry] ?? null) : null;
  const overviewReady = settled && !entry;
  const detailReady = settled && !!entry;
  const pending = shown !== null && !settled;
  /* What the body carries: the shown view, else the target held (copy mounted, media and motion waiting). */
  const bodyLive = shown !== null;
  const bodyItem = shownItem ?? item;
  const bodyEntry = shown ? shownEntry : entry;
  const bodyEntryIndex = shown ? shown.entry : entryIndex;
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
  const prevTargetRef = useRef({ itemIndex, entryIndex });
  const lastScrollRef = useRef(0);

  const desktop = useMediaQuery(DESKTOP_QUERY, true);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [complete, setComplete] = useState(false);
  const [live, setLive] = useState("");

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
      if (launcher) queueMicrotask(() => launcher.isConnected && launcher.focus({ preventScroll: true }));
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

  const overviewView: DossierView = { item: item.id };
  const entryView = (i: number): DossierView => ({ item: item.id, entry: entries[i].id });
  const prevItemView: DossierView = { item: prevItem.id };
  const nextItemView: DossierView = { item: nextItem.id };
  // The toast and the dock's next: next entry, else the next item's overview, else back to this overview.
  const nextView: DossierView | null =
    entryIndex === null ? null : entryIndex < entries.length - 1 ? entryView(entryIndex + 1) : itemCount > 1 ? nextItemView : overviewView;

  const viewRef = useRef(view);
  viewRef.current = view;
  const closeAll = useCallback(() => go(null), [go]);
  const toOverview = () => go(overviewView);
  const openEntry = (index: number) => go(entryView(index));
  const switchItem = (delta: number) => go({ item: items[(itemIndex + delta + itemCount) % itemCount].id });
  const goNextEntry = () => {
    if (nextView) go(nextView);
  };
  // Escape and backdrop: one level up (entry → overview → closed).
  const dismissOneLevel = useCallback(() => go(dossierRoutes.parent(viewRef.current)), [go]);

  /* ── Target changes: chrome, completion, live region, the tile to refocus on the way back. */
  useEffect(() => {
    const previous = prevTargetRef.current;
    prevTargetRef.current = { itemIndex, entryIndex };
    // Back to the overview of the same item (Sommaire, Escape, browser Back): refocus the tile we came from.
    if (entryIndex === null && previous.entryIndex !== null) returnTileRef.current = previous.itemIndex === itemIndex ? previous.entryIndex : null;
    else if (entryIndex !== null || previous.itemIndex !== itemIndex) returnTileRef.current = null;
    setChromeHidden(false);
    setComplete(false);
    if (entryIndex !== null) setLive(copy.entryLocation(entryIndex + 1, entries.length, entries[entryIndex]?.title ?? ""));
    else if (previous.entryIndex !== null) setLive(copy.backTo(item.label));
    else setLive(copy.itemLocation(itemIndex + 1, itemCount, item.label));
  }, [entryIndex, itemIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Shown view changes: the new view starts at the top (before paint, before chapters measure). */
  const shownKey = shown ? `${shown.item}:${shown.entry}` : "";
  useLayoutEffect(() => {
    lastScrollRef.current = 0;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [shownKey]);

  const reveal = useChapterReveal(bodyRef);

  const enteredFromOverview = useRef(false);
  useEffect(() => {
    if (entryIndex === null) enteredFromOverview.current = true;
  }, [entryIndex]);
  useEffect(() => {
    if (!detailReady) return;
    if (enteredFromOverview.current) {
      enteredFromOverview.current = false;
      detailRef.current?.focus({ preventScroll: true });
    }
  }, [detailReady, entryIndex]);

  useEffect(() => {
    if (!overviewReady) return;
    const index = returnTileRef.current;
    returnTileRef.current = null;
    if (index === null) return;
    const frame = requestAnimationFrame(() => {
      const tile = tileRefs.current[index];
      if (tile && !tile.matches(":disabled, [aria-disabled='true']")) tile.focus({ preventScroll: true });
      else boardHeadingRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [overviewReady]);

  /* ── Desktop strip: the active tab's underline is the reading progress; ≥ 90 % offers the next tab. */
  useEffect(() => {
    const body = bodyRef.current;
    const strip = stripRef.current;
    strip?.style.setProperty("--evd-progress", "0");
    if (!body || !strip || !detailReady || !desktop) return;
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
  }, [detailReady, desktop, entryIndex]);

  /* ── Phone / tablet: capsule and dock leave on scroll-down, return on scroll-up, near the top or on focus. */
  const onBodyScroll = useCallback(() => {
    const body = bodyRef.current;
    if (!body || desktop || viewRef.current.entry === undefined) return;
    if (document.activeElement?.closest(".evd-header, .evd-dock")) return;
    const top = body.scrollTop;
    const last = lastScrollRef.current;
    lastScrollRef.current = top;
    if (top <= 24) return setChromeHidden(false);
    if (Math.abs(top - last) < 6) return;
    setChromeHidden(top > last);
  }, [desktop]);

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
  }, [entryIndex, itemIndex, complete, shownKey, closing]);

  const accentStyle = item.accent
    ? ({ "--primary": item.accent, "--primary-foreground": item.accentInk ?? inkFor(item.accent) } as CSSProperties)
    : undefined;

  const bodyCtx: DossierEntryContext | null =
    bodyEntry && bodyEntryIndex !== null ? { item: bodyItem, entry: bodyEntry, index: bodyEntryIndex, total: bodyItem.entries.length, close: closeAll, toOverview } : null;

  const nextEntryLabel = entryIndex === null ? "" : entryIndex < entries.length - 1 ? (entries[entryIndex + 1].label ?? entries[entryIndex + 1].title) : itemCount > 1 ? nextItem.label : copy.overview;
  const nextAria = entryIndex === null ? "" : entryIndex < entries.length - 1 ? copy.nextEntry(nextEntryLabel) : itemCount > 1 ? copy.nextItem(nextItem.label) : copy.overviewOf(item.label);
  const dockShown = !!entry || itemCount > 1;
  const hideChrome = !!entry && chromeHidden && !desktop;

  return (
    <div
      ref={rootRef}
      className={cn("ev-root ev-tone-dark ev-dossier", className)}
      data-phase={closing ? "closing" : "open"}
      data-view={bodyEntry ? "detail" : "overview"}
      data-dock={dockShown || undefined}
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
        <div ref={dialogRef} className="evd-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-ev-modal="">
          <span className="ev-sr" aria-live="polite" aria-atomic="true">{live}</span>

          <header className="evd-header" data-hidden={hideChrome || undefined} onFocusCapture={() => setChromeHidden(false)}>
            <div className="evd-header__bar">
              <div className="evd-header__identity">
                <span className="evd-header__brand">{config.brand.logo ?? <span className="ev-t-readout-lg">{config.brand.name}</span>}</span>
                <div className="evd-header__meta">
                  <span className="evd-header__kicker">{entry ? item.label : config.kicker}</span>
                  {/* The view's one h1 (its title; docs/CRAWLABLE-MODALS.md §4). Phones show the short readout instead, the h1 stays spoken. */}
                  {entry ? (
                    <h1 id={titleId} className="evd-header__title">{entryHeading(entry)}</h1>
                  ) : (
                    <>
                      <h1 id={titleId} className="evd-header__title evd-header__title-full">{copy.overviewTitle(itemIndex + 1, item.label)}</h1>
                      <span className="evd-header__title evd-header__title-short" aria-hidden="true">{item.label}</span>
                    </>
                  )}
                </div>
              </div>

              {itemCount > 1 && (
                <nav className="evd-pager" aria-label={copy.itemsNav}>
                  <PagerLink direction="prev" label={copy.previousItem(prevItem.label)} href={href(prevItemView)} onFollow={() => switchItem(-1)} />
                  <div className="evd-pager__location" role="status" aria-label={copy.itemLocation(itemIndex + 1, itemCount, item.label)}>
                    <span className="evd-pager__label" aria-hidden="true">{item.label}</span>
                    <span className="evd-bars" aria-hidden="true" style={{ ["--evd-bars" as string]: itemCount }}>
                      {items.map((it, i) => (
                        <span key={it.id} data-current={i === itemIndex || undefined} />
                      ))}
                    </span>
                  </div>
                  <PagerLink direction="next" label={copy.nextItem(nextItem.label)} href={href(nextItemView)} onFollow={() => switchItem(1)} />
                </nav>
              )}

              <div className="evd-header__end">
                {config.attribution.enabled && <EvoviewMark className="evd-mark" href={config.attribution.href} label={config.attribution.label} />}
                <GlassClose ref={closeRef} className="evd-close" showLabel label={copy.close} aria-label={copy.closeDossier} onClick={closeAll} />
              </div>
            </div>
          </header>

          {entry && entryIndex !== null && (
            <nav ref={stripRef} className="evd-strip" aria-label={copy.entriesNav} style={{ ["--evd-tabs" as string]: entries.length }}>
              <RouteLink className="evd-strip__overview" href={href(overviewView)} onFollow={toOverview} aria-label={copy.overviewOf(item.label)}>
                <TextFill hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}><ArrowLeft /></TextFill>
                <TextFill hoverWithin=".evd-strip__overview" hoverInk="#fff" withFocus={false}>{copy.overview}</TextFill>
              </RouteLink>
              <div className="evd-strip__tabs">
                {entries.map((e, i) => (
                  <RouteLink
                    key={e.id}
                    className="evd-strip__tab"
                    href={href(entryView(i))}
                    data-state={i === entryIndex ? "active" : i < entryIndex ? "past" : undefined}
                    aria-current={i === entryIndex ? "page" : undefined}
                    aria-label={copy.entryLocation(i + 1, entries.length, e.title)}
                    onFollow={() => i !== entryIndex && openEntry(i)}
                  >
                    <span className="evd-strip__num">{pad(i + 1)}</span>
                    <span className="evd-strip__label">
                      <TextFill
                        truncate
                        ink={i === entryIndex ? "#fff" : i < entryIndex ? "rgb(255 255 255 / 0.72)" : undefined}
                        hoverWithin={i === entryIndex ? undefined : ".evd-strip__tab"}
                        hoverInk="#fff"
                        withFocus={false}
                      >
                        {e.label ?? e.title}
                      </TextFill>
                    </span>
                    <span className="evd-strip__progress" aria-hidden="true" />
                  </RouteLink>
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

          <div className="evd-viewport">
            <div
              ref={bodyRef}
              className="evd-body"
              data-locked={(hydrated && (!shown || (!shownEntry && pending))) || undefined}
              data-pending={pending || undefined}
              onScroll={onBodyScroll}
            >
              <div className="evd-atmosphere" aria-hidden="true" />
              <ChapterRevealContext.Provider value={reveal}>
                {/* Copy mounted from the first render (server HTML included); held until the view's media is
                    decoded, then remounted live so its entrance starts when the view used to mount. */}
                <HeldCopy live={bodyLive}>
                  {!bodyEntry && (
                    <section
                      key={bodyItem.id}
                      className="evd-overview"
                      aria-labelledby={boardHeadingId}
                      inert={hydrated && !overviewReady}
                      aria-hidden={waiting || undefined}
                      data-waiting={waiting || undefined}
                    >
                      <h2 id={boardHeadingId} ref={boardHeadingRef} tabIndex={-1} className="ev-sr">
                        {copy.boardHeading(bodyItem.label)}
                      </h2>
                      <SelectionBoard
                        entries={bodyItem.entries}
                        label={copy.boardHeading(bodyItem.label)}
                        revealed
                        onSelect={(i) => go({ item: bodyItem.id, entry: bodyItem.entries[i].id })}
                        hrefFor={hrefFor ? (i) => href({ item: bodyItem.id, entry: bodyItem.entries[i].id }) : undefined}
                        openLabel={copy.openEntry}
                        registerTile={(i, el) => {
                          tileRefs.current[i] = el;
                        }}
                      />
                    </section>
                  )}
                  {bodyEntry && bodyCtx && (
                    <div
                      key={`${bodyItem.id}:${bodyEntry.id}`}
                      ref={detailRef}
                      className="evd-detail"
                      tabIndex={-1}
                      aria-labelledby={detailHeadingId}
                      inert={hydrated && !detailReady}
                      aria-hidden={waiting || undefined}
                      data-waiting={waiting || undefined}
                    >
                      <h2 id={detailHeadingId} className="ev-sr">{bodyEntry.title}</h2>
                      {bodyEntry.content(bodyCtx)}
                    </div>
                  )}
                </HeldCopy>
              </ChapterRevealContext.Provider>
            </div>
            {cut > 0 && <div key={cut} className="evd-cut" aria-hidden="true" />}
            {hydrated && (gate.slow || gate.failed) && !gate.ready && (
              <DossierLoader
                kicker={entry ? copy.loader.detailKicker((entryIndex ?? 0) + 1) : copy.loader.overviewKicker(itemIndex + 1)}
                title={copy.loader.title}
                status={copy.loader.status}
                loaded={gate.loaded}
                total={gate.total}
                spoken={copy.loader.spoken(gate.loaded, gate.total)}
                failed={gate.failed}
                failedText={copy.loader.failed}
                retryLabel={copy.loader.retry}
                onRetry={gate.retry}
              />
            )}
          </div>

          {dockShown && (
            <nav className="evd-dock" data-hidden={hideChrome || undefined} aria-label={entry ? copy.entriesNav : copy.itemsNav} onFocusCapture={() => setChromeHidden(false)}>
              <div className="evd-dock__glass">
                <DockButton
                  side="start"
                  label={entry ? copy.dock.home : copy.dock.previous}
                  aria={entry ? copy.overviewOf(item.label) : copy.previousItem(prevItem.label)}
                  icon={entry ? <HomeIcon /> : <ArrowLeft />}
                  href={href(entry ? overviewView : prevItemView)}
                  onClick={entry ? toOverview : () => switchItem(-1)}
                />
                <div
                  className="evd-dock__location"
                  role="status"
                  aria-label={entry && entryIndex !== null ? copy.entryLocation(entryIndex + 1, entries.length, entry.title) : copy.itemLocation(itemIndex + 1, itemCount, item.label)}
                >
                  <span className="evd-dock__kicker" aria-hidden="true">{entry ? item.label : copy.dock.item}</span>
                  <span key={entry ? `e${entryIndex}` : `i${itemIndex}`} className="evd-dock__count" aria-hidden="true">
                    {pad((entry ? (entryIndex ?? 0) : itemIndex) + 1)}
                    <span>/</span>
                    {pad(entry ? entries.length : itemCount)}
                  </span>
                  <span className="evd-bars evd-bars--dock" aria-hidden="true">
                    {(entry ? entries : items).map((x, i) => (
                      <span key={x.id} data-current={i === (entry ? entryIndex : itemIndex) || undefined} />
                    ))}
                  </span>
                </div>
                <DockButton
                  side="end"
                  label={copy.dock.next}
                  aria={entry ? nextAria : copy.nextItem(nextItem.label)}
                  icon={<ArrowRight />}
                  href={href(entry ? nextView : nextItemView)}
                  onClick={entry ? goNextEntry : () => switchItem(1)}
                />
              </div>
            </nav>
          )}
        </div>
      </div>
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
   Images only (videos are left to the gate); first tile of each item first. */
function useIdlePreload(config: DossierConfig | null) {
  const list = useMemo(() => {
    if (!config) return [];
    const rows = config.items.map((item) => item.entries.map((e) => e.media).filter((m) => !isVideo(m)).map((m) => m.src));
    const ordered: string[] = [];
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
