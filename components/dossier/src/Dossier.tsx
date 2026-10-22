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
} from "react";
import { ArrowLeft, ArrowRight, EvoviewMark, cn, inkFor, pad, useMediaReady, useSuspendBackground } from "../foundation";
import { GlassClose, PagerOrb } from "../controls";
import { SelectionBoard } from "./Board";
import { DossierLoader } from "./Loader";
import { DESKTOP_QUERY, toSource, useMediaQuery } from "./hooks";
import type { DossierConfig, DossierEntryContext } from "./types";

export type DossierProps = {
  config: DossierConfig;
  open: boolean;
  /** Called for every close (button, Escape at overview, backdrop at overview, history Back). Set `open` false. */
  onClose: () => void;
  /** Item shown on open (default: first). */
  initialItemId?: string;
  /** Opens directly on one entry (deep link). */
  initialEntryId?: string;
  className?: string;
};

/** The portal modal: isolate, demonstrate, explain. Renders in place (fixed layer) so the host accent is inherited. */
export function Dossier(props: DossierProps) {
  const [present, setPresent] = useState(props.open);
  if (props.open && !present) setPresent(true);
  if (!present) return null;
  return <DossierLayer {...props} closing={!props.open} onExited={() => setPresent(false)} />;
}

const FOCUSABLE = 'a[href], button, input, textarea, select, [tabindex], video[controls]';
/** Host chrome that must stay usable over the modal (a dev/showcase tool, never client UI): not made inert, not in the Tab trap. */
const KEEP_INTERACTIVE = "data-ev-keep-interactive";

function DossierLayer({ config, onClose, initialItemId, initialEntryId, className, closing, onExited }: DossierProps & { closing: boolean; onExited: () => void }) {
  const { items, copy } = config;
  const uid = useId();
  const titleId = `${uid}-title`;
  const boardHeadingId = `${uid}-board`;

  const [itemIndex, setItemIndex] = useState(() => Math.max(0, items.findIndex((i) => i.id === initialItemId)));
  const [entryIndex, setEntryIndex] = useState<number | null>(() => {
    const start = items[Math.max(0, items.findIndex((i) => i.id === initialItemId))];
    const i = start ? start.entries.findIndex((e) => e.id === initialEntryId) : -1;
    return i >= 0 ? i : null;
  });
  const item = items[itemIndex] ?? items[0];
  const entries = item.entries;
  const entry = entryIndex === null ? null : (entries[entryIndex] ?? null);
  const itemCount = items.length;
  const prevItem = items[(itemIndex - 1 + itemCount) % itemCount];
  const nextItem = items[(itemIndex + 1) % itemCount];

  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const boardHeadingRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const returnTileRef = useRef<number | null>(null);
  const prevEntryRef = useRef<number | null>(entryIndex);
  const lastScrollRef = useRef(0);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [complete, setComplete] = useState(false);
  const [live, setLive] = useState("");
  const [cut, setCut] = useState(0);

  /* ── Page behind: suspended (pause model), inert, scroll-locked; focus restored to the launcher. */
  useSuspendBackground(true);
  useLayoutEffect(() => {
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
    const html = document.documentElement;
    const scrollbar = window.innerWidth - html.clientWidth;
    const previous = { overflow: html.style.overflow, padding: document.body.style.paddingRight };
    html.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      for (const [el, inert] of touched) el.inert = inert;
      html.style.overflow = previous.overflow;
      document.body.style.paddingRight = previous.padding;
      if (launcher?.isConnected) launcher.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  /* ── History: overview = one entry, detail = a second. Back follows Escape's one-level model. */
  const [owner] = useState(() => `evd-${Math.random().toString(36).slice(2)}`);
  const depthRef = useRef(0);
  const entryIndexRef = useRef(entryIndex);
  entryIndexRef.current = entryIndex;

  useEffect(() => {
    const state = window.history.state;
    if (state?.evDossier === owner) {
      depthRef.current = Number(state.evDepth) || 0;
    } else {
      window.history.pushState({ ...state, evDossier: owner, evDepth: 1 }, "");
      depthRef.current = 1;
      if (entryIndexRef.current !== null) {
        window.history.pushState({ ...window.history.state, evDossier: owner, evDepth: 2 }, "");
        depthRef.current = 2;
      }
    }
    const onPop = (event: PopStateEvent) => {
      const s = event.state;
      const depth = s?.evDossier === owner ? Number(s.evDepth) || 0 : 0;
      depthRef.current = depth;
      if (depth <= 0) onCloseRef.current();
      else if (depth === 1) setEntryIndex(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [owner]);

  // Closed from outside (open=false) while our history layers are still there.
  useEffect(() => {
    if (!closing || depthRef.current <= 0) return;
    const depth = depthRef.current;
    depthRef.current = 0;
    window.history.go(-depth);
  }, [closing]);

  const closeAll = useCallback(() => {
    const depth = depthRef.current;
    depthRef.current = 0;
    if (depth > 0) window.history.go(-depth);
    onCloseRef.current();
  }, []);

  const toOverview = useCallback(() => {
    if (entryIndexRef.current !== null) returnTileRef.current = entryIndexRef.current;
    if (depthRef.current >= 2) {
      depthRef.current = 1;
      window.history.back();
    }
    setEntryIndex(null);
  }, []);

  const openEntry = useCallback(
    (index: number) => {
      setEntryIndex(index);
      if (depthRef.current === 1) {
        window.history.pushState({ ...window.history.state, evDossier: owner, evDepth: 2 }, "");
        depthRef.current = 2;
      }
    },
    [owner],
  );

  const switchItem = useCallback(
    (delta: number) => {
      if (depthRef.current >= 2) {
        depthRef.current = 1;
        window.history.back();
      }
      returnTileRef.current = null;
      setEntryIndex(null);
      setItemIndex((i) => (i + delta + itemCount) % itemCount);
      setCut((n) => n + 1);
    },
    [itemCount],
  );

  const goNextEntry = useCallback(() => {
    const i = entryIndexRef.current;
    if (i === null) return;
    if (i < entries.length - 1) openEntry(i + 1);
    else if (itemCount > 1) switchItem(1);
    else toOverview();
  }, [entries.length, itemCount, openEntry, switchItem, toOverview]);

  const dismissOneLevel = useCallback(() => {
    if (entryIndexRef.current !== null) toOverview();
    else closeAll();
  }, [closeAll, toOverview]);

  /* ── Media gate: a view is revealed only once its media is decoded. */
  const sources = useMemo(
    () => (entry ? [toSource(entry.media), ...(entry.sources ?? [])] : entries.map((e) => toSource(e.media))),
    [entry, entries],
  );
  const gate = useMediaReady(!closing, sources);
  const overviewReady = !entry && gate.ready;
  const detailReady = !!entry && gate.ready;

  /* ── View changes: scroll, chrome, live region, focus. */
  useEffect(() => {
    const previous = prevEntryRef.current;
    prevEntryRef.current = entryIndex;
    setChromeHidden(false);
    setComplete(false);
    lastScrollRef.current = 0;
    bodyRef.current?.scrollTo({ top: 0 });
    if (entryIndex !== null) setLive(copy.entryLocation(entryIndex + 1, entries.length, entries[entryIndex]?.title ?? ""));
    else if (previous !== null) setLive(copy.backTo(item.label));
    else setLive(copy.itemLocation(itemIndex + 1, itemCount, item.label));
  }, [entryIndex, itemIndex]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (tile && !tile.disabled) tile.focus({ preventScroll: true });
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
    for (const child of Array.from(body.children)) observer.observe(child);
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
    if (!body || desktop || entryIndexRef.current === null) return;
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
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body || !dialogRef.current?.contains(active)) dialogRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [entryIndex, itemIndex, complete]);

  const accentStyle = item.accent
    ? ({ "--primary": item.accent, "--primary-foreground": item.accentInk ?? inkFor(item.accent) } as CSSProperties)
    : undefined;

  const ctx: DossierEntryContext | null = entry
    ? { item, entry, index: entryIndex ?? 0, total: entries.length, close: closeAll, toOverview }
    : null;

  const nextEntryLabel = entryIndex === null ? "" : entryIndex < entries.length - 1 ? (entries[entryIndex + 1].label ?? entries[entryIndex + 1].title) : itemCount > 1 ? nextItem.label : copy.overview;
  const nextAria = entryIndex === null ? "" : entryIndex < entries.length - 1 ? copy.nextEntry(nextEntryLabel) : itemCount > 1 ? copy.nextItem(nextItem.label) : copy.overviewOf(item.label);
  const dockShown = !!entry || itemCount > 1;
  const hideChrome = !!entry && chromeHidden && !desktop;

  return (
    <div
      ref={rootRef}
      className={cn("ev-root ev-tone-dark ev-dossier", className)}
      data-phase={closing ? "closing" : "open"}
      data-view={entry ? "detail" : "overview"}
      data-dock={dockShown || undefined}
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
                <span className="evd-header__divider" aria-hidden="true" />
                <span className="evd-header__meta">
                  <span className="evd-header__kicker">{entry ? item.label : config.kicker}</span>
                  <span id={titleId} className="evd-header__title">
                    {entry ? (
                      (entry.label ?? entry.title)
                    ) : (
                      <>
                        <span className="evd-header__title-full">{copy.overviewTitle(itemIndex + 1, item.label)}</span>
                        <span className="evd-header__title-short" aria-hidden="true">{item.label}</span>
                      </>
                    )}
                  </span>
                </span>
              </div>

              {itemCount > 1 && (
                <nav className="evd-pager" aria-label={copy.itemsNav}>
                  <PagerOrb direction="prev" label={copy.previousItem(prevItem.label)} onClick={() => switchItem(-1)} />
                  <div className="evd-pager__location" role="status" aria-label={copy.itemLocation(itemIndex + 1, itemCount, item.label)}>
                    <span className="evd-pager__label" aria-hidden="true">{item.label}</span>
                    <span className="evd-bars" aria-hidden="true" style={{ ["--evd-bars" as string]: itemCount }}>
                      {items.map((it, i) => (
                        <span key={it.id} data-current={i === itemIndex || undefined} />
                      ))}
                    </span>
                  </div>
                  <PagerOrb direction="next" label={copy.nextItem(nextItem.label)} onClick={() => switchItem(1)} />
                </nav>
              )}

              <div className="evd-header__end">
                {config.attribution.enabled && (
                  <>
                    <EvoviewMark className="evd-mark" href={config.attribution.href} label={config.attribution.label} />
                    <span className="evd-header__divider evd-header__divider--end" aria-hidden="true" />
                  </>
                )}
                <GlassClose ref={closeRef} className="evd-close" showLabel label={copy.close} aria-label={copy.closeDossier} onClick={closeAll} />
              </div>
            </div>
          </header>

          {entry && entryIndex !== null && (
            <nav ref={stripRef} className="evd-strip" aria-label={copy.entriesNav} style={{ ["--evd-tabs" as string]: entries.length }}>
              <button type="button" className="evd-strip__overview" onClick={toOverview} aria-label={copy.overviewOf(item.label)}>
                <ArrowLeft />
                <span>{copy.overview}</span>
              </button>
              <div className="evd-strip__tabs">
                {entries.map((e, i) => (
                  <button
                    key={e.id}
                    type="button"
                    className="evd-strip__tab"
                    data-state={i === entryIndex ? "active" : i < entryIndex ? "past" : undefined}
                    aria-current={i === entryIndex ? "page" : undefined}
                    aria-label={copy.entryLocation(i + 1, entries.length, e.title)}
                    onClick={() => i !== entryIndex && openEntry(i)}
                  >
                    <span className="evd-strip__num">{pad(i + 1)}</span>
                    <span className="evd-strip__label">{e.label ?? e.title}</span>
                    <span className="evd-strip__progress" aria-hidden="true" />
                  </button>
                ))}
              </div>
              {complete && detailReady && (
                <div
                  className="evd-toast"
                  role="status"
                  style={{ right: `calc((100% - var(--evd-strip-overview)) * ${(entries.length - 1 - entryIndex) / entries.length} + 16px)` }}
                >
                  <button type="button" onClick={goNextEntry} aria-label={nextAria}>
                    <span>
                      <small>{entryIndex < entries.length - 1 ? copy.toastNext : itemCount > 1 ? copy.toastEnd : copy.toastBack}</small>
                      <strong>{nextEntryLabel}</strong>
                    </span>
                    <ArrowRight />
                  </button>
                </div>
              )}
            </nav>
          )}

          <div className="evd-viewport">
            <div ref={bodyRef} className="evd-body" data-locked={(!entry && !overviewReady) || undefined} onScroll={onBodyScroll}>
              <div className="evd-atmosphere" aria-hidden="true" />
              {!entry ? (
                <section key={item.id} className="evd-overview" aria-labelledby={boardHeadingId} inert={!overviewReady}>
                  <h2 id={boardHeadingId} ref={boardHeadingRef} tabIndex={-1} className="ev-sr">
                    {copy.boardHeading(item.label)}
                  </h2>
                  <SelectionBoard
                    entries={entries}
                    label={copy.boardHeading(item.label)}
                    revealed={overviewReady}
                    onSelect={openEntry}
                    openLabel={copy.openEntry}
                    registerTile={(i, el) => {
                      tileRefs.current[i] = el;
                    }}
                  />
                </section>
              ) : (
                detailReady &&
                ctx && (
                  <div key={entry.id} ref={detailRef} className="evd-detail" tabIndex={-1} aria-label={entry.title}>
                    {entry.content(ctx)}
                  </div>
                )
              )}
            </div>
            {cut > 0 && <div key={cut} className="evd-cut" aria-hidden="true" />}
            {(gate.slow || gate.failed) && !gate.ready && (
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
                <DockButton side="end" label={copy.dock.next} aria={entry ? nextAria : copy.nextItem(nextItem.label)} icon={<ArrowRight />} onClick={entry ? goNextEntry : () => switchItem(1)} />
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function DockButton({ side, label, aria, icon, onClick }: { side: "start" | "end"; label: string; aria: string; icon: ReactNode; onClick: () => void }) {
  const [tap, setTap] = useState(0);
  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--evd-touch-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--evd-touch-y", `${e.clientY - rect.top}px`);
  };
  return (
    <button
      type="button"
      className="evd-dock__item"
      data-side={side}
      data-tap={tap % 2 === 1 ? "a" : tap > 0 ? "b" : undefined}
      aria-label={aria}
      onPointerDown={onPointerDown}
      onClick={() => {
        setTap((n) => n + 1);
        onClick();
      }}
    >
      <span className="evd-dock__icon">{icon}</span>
      <span className="evd-dock__label">{label}</span>
    </button>
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
