import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { DeckIcon } from "./NavIcons";
import type { NavDeckEntry, NavbarConfig } from "./types";
import { ensureTray, preloadTrays } from "./useNavTrays";
import { ReticleMark, TrayContent, useNavActions } from "./finderShared";

/* Desktop navigation — the finder.

   At rest the capsule holds the wordmark and one pill: a viewfinder reticle
   whose centre dot carries the accent of the section under the bar, and the
   menu word. Hovering it unfolds the capsule to the right into the deck
   pills. Hovering a pill slides a tray under it with that destination's
   entries. Clicking a pill goes to the section; clicking a tray entry runs
   the entry's own action.

   Geometry: the capsule is absolutely positioned inside an anchor that keeps
   the *resting* width, so the unfold grows away from the wordmark instead of
   re-centring. The finder and the deck each sit in a single-column grid whose
   track interpolates between 0fr and 1fr: the only pure-CSS way to animate
   between two intrinsic widths without measuring. */

const OPEN_DELAY = 70;
const CLOSE_DELAY = 150;
const TRAY_DELAY = 90;

type TimerName = "open" | "close" | "tray";

function useFinderState() {
  const [open, setOpen] = useState(false);
  const [tray, setTray] = useState<string | null>(null);
  const openRef = useRef(false);
  const trayRef = useRef<string | null>(null);
  const timers = useRef<Partial<Record<TimerName, number>>>({});

  const clear = useCallback((...names: TimerName[]) => {
    for (const name of names) {
      const id = timers.current[name];
      if (id) window.clearTimeout(id);
      timers.current[name] = undefined;
    }
  }, []);

  const commitOpen = useCallback((value: boolean) => {
    openRef.current = value;
    setOpen(value);
  }, []);

  const commitTray = useCallback((value: string | null) => {
    trayRef.current = value;
    setTray(value);
  }, []);

  const close = useCallback(() => {
    clear("open", "close", "tray");
    commitOpen(false);
    commitTray(null);
  }, [clear, commitOpen, commitTray]);

  const openNow = useCallback(() => {
    clear("open", "close");
    commitOpen(true);
  }, [clear, commitOpen]);

  // After a click closes the menu, the collapsing capsule slides the trigger
  // under a still pointer: hover may only reopen once the pointer has left.
  const hoverLockedRef = useRef(false);
  const closeFromAction = useCallback(() => {
    hoverLockedRef.current = true;
    close();
  }, [close]);
  const releaseHover = useCallback(() => { hoverLockedRef.current = false; }, []);

  const hoverOpen = useCallback(() => {
    clear("open", "close");
    if (openRef.current || hoverLockedRef.current) return;
    timers.current.open = window.setTimeout(() => commitOpen(true), OPEN_DELAY);
  }, [clear, commitOpen]);

  const scheduleClose = useCallback(() => {
    clear("open", "close", "tray");
    timers.current.close = window.setTimeout(close, CLOSE_DELAY);
  }, [clear, close]);

  const cancelClose = useCallback(() => clear("close"), [clear]);

  const showTray = useCallback((key: string, immediate = false) => {
    clear("close", "tray");
    if (!openRef.current) commitOpen(true);
    // Switching between two open trays is instant; the first one waits out a
    // pointer merely crossing the deck.
    if (immediate || trayRef.current !== null) commitTray(key);
    else timers.current.tray = window.setTimeout(() => commitTray(key), TRAY_DELAY);
  }, [clear, commitOpen, commitTray]);

  const hideTray = useCallback(() => {
    clear("tray");
    commitTray(null);
  }, [clear, commitTray]);

  useEffect(() => () => clear("open", "close", "tray"), [clear]);

  // An in-place toggle (keepOpen) can reflow the page, and the browser then
  // clamps or anchors the scroll position: that scroll is not the reader's.
  const scrollHoldUntil = useRef(0);
  const holdScrollClose = useCallback(() => {
    scrollHoldUntil.current = performance.now() + 500;
  }, []);

  // A scroll or a viewport change dismisses the menu rather than letting it
  // drift over the page.
  useEffect(() => {
    const onScroll = () => {
      if (performance.now() > scrollHoldUntil.current) close();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", close);
    };
  }, [close]);

  return { open, tray, openNow, hoverOpen, close, closeFromAction, releaseHover, scheduleClose, cancelClose, showTray, hideTray, holdScrollClose };
}

export default function NavFinder({ config, activeKey, accent }: { config: NavbarConfig; activeKey: string | undefined; accent: string }) {
  const { open, tray, openNow, hoverOpen, close, closeFromAction, releaseHover, scheduleClose, cancelClose, showTray, hideTray, holdScrollClose } = useFinderState();
  const anchorRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerCellRef = useRef<HTMLDivElement>(null);
  const deckCellRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const trayAnchorRef = useRef<HTMLDivElement>(null);
  const focusDeckRef = useRef(false);
  const focusTrayRef = useRef(false);
  // Escape hands focus back to a pill without that focus reopening its tray.
  const silentPillFocusRef = useRef(false);
  const baseId = useId();
  const deckId = `${baseId}-deck`;
  const trayId = `${baseId}-tray`;

  const { deck, trays, labels } = config;
  const preload = useCallback(() => preloadTrays(config), [config]);
  const actions = useNavActions(config, closeFromAction, "navbar");

  // Hovering a pill without a tray closes whichever tray is open.
  const revealTray = useCallback((entry: NavDeckEntry, immediate = false) => {
    if (!trays[entry.key]) { hideTray(); return; }
    void ensureTray(trays[entry.key]).catch(() => undefined);
    showTray(entry.key, immediate);
  }, [hideTray, showTray, trays]);

  // The anchor holds the resting width so the unfold grows away from the
  // wordmark. Measured only while closed; a transition never feeds back.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const anchor = anchorRef.current;
    if (!nav || !anchor) return;
    let latestOpen = false;
    const sync = () => {
      if (latestOpen) return;
      const width = nav.getBoundingClientRect().width;
      if (width > 0) anchor.style.width = `${width}px`;
    };
    const observer = new ResizeObserver(sync);
    observer.observe(nav);
    sync();
    const syncOpen = () => { latestOpen = nav.dataset.open === "true"; };
    const attributes = new MutationObserver(syncOpen);
    attributes.observe(nav, { attributes: true, attributeFilter: ["data-open"] });
    return () => {
      observer.disconnect();
      attributes.disconnect();
    };
  }, []);

  // Tray x is derived from where the pill will be once the unfold has
  // settled, so a tray opened mid-transition still lands under its pill.
  const positionTray = useCallback(() => {
    const nav = navRef.current;
    const anchor = trayAnchorRef.current;
    const triggerCell = triggerCellRef.current;
    const deckCell = deckCellRef.current;
    const deckEl = deckRef.current;
    if (!tray || !nav || !anchor || !triggerCell || !deckCell || !deckEl) return;
    const pill = deckEl.querySelector<HTMLElement>(`[data-deck-pill="${tray}"]`);
    const panel = anchor.firstElementChild as HTMLElement | null;
    if (!pill || !panel) return;

    const navRect = nav.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const triggerWidth = triggerCell.getBoundingClientRect().width;
    const deckGrowth = deckEl.getBoundingClientRect().width - deckCell.getBoundingClientRect().width;
    const finalNavWidth = navRect.width - triggerWidth + deckGrowth;
    const pillLeft = pillRect.left - navRect.left - triggerWidth;
    const trayWidth = panel.getBoundingClientRect().width;
    const x = Math.max(0, Math.min(pillLeft, finalNavWidth - trayWidth));

    anchor.style.setProperty("--nav-tray-x", `${x}px`);
    anchor.style.setProperty("--nav-tray-origin", `${pillLeft + pillRect.width / 2 - x}px`);
  }, [tray]);

  useLayoutEffect(() => { positionTray(); }, [positionTray]);

  // Keyboard opens hand focus to the first pill: the finder cell collapses
  // behind the deck and must not keep a hidden focus.
  useEffect(() => {
    if (!open || !focusDeckRef.current) return;
    focusDeckRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      deckRef.current?.querySelector<HTMLElement>("[data-deck-pill]")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!tray || !focusTrayRef.current) return;
    focusTrayRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      trayAnchorRef.current?.querySelector<HTMLElement>("[data-tray-item]")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tray]);

  const focusPill = useCallback((key: string | null) => {
    const selector = key ? `[data-deck-pill="${key}"]` : "[data-deck-pill]";
    deckRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  }, []);

  const handleTriggerClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    preload();
    const pointerType = (event.nativeEvent as PointerEvent).pointerType;
    if (pointerType === "mouse" && !open) { openNow(); return; }
    if (open) { close(); return; }
    focusDeckRef.current = pointerType !== "touch";
    openNow();
  }, [close, open, openNow, preload]);

  const handlePillClick = useCallback((entry: NavDeckEntry, event: MouseEvent<HTMLElement>) => {
    const pointerType = (event.nativeEvent as PointerEvent).pointerType;
    // Touch has no hover: the first tap reveals the tray, the second navigates.
    if (pointerType === "touch" && trays[entry.key] && tray !== entry.key) {
      event.preventDefault();
      revealTray(entry, true);
      return;
    }
    if (entry.keepOpen) holdScrollClose();
    actions.section(entry, event);
  }, [actions, holdScrollClose, revealTray, tray, trays]);

  const handleBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (!anchorRef.current?.contains(event.relatedTarget as Node | null)) close();
  }, [close]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const pill = target.closest<HTMLElement>("[data-deck-pill]");
    const trayItem = target.closest<HTMLElement>("[data-tray-item]");

    if (event.key === "Escape") {
      if (!open) return;
      event.stopPropagation();
      if (trayItem) {
        const key = tray;
        hideTray();
        silentPillFocusRef.current = true;
        focusPill(key);
        silentPillFocusRef.current = false;
        return;
      }
      close();
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }

    const cycle = (items: HTMLElement[], current: HTMLElement, delta: number) => {
      const index = items.indexOf(current);
      if (index === -1 || items.length === 0) return;
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + delta + items.length) % items.length;
      items[next]?.focus({ preventScroll: true });
    };

    if (pill) {
      const key = pill.dataset.deckPill as string;
      const entry = deck.find((candidate) => candidate.key === key);
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        cycle(Array.from(deckRef.current?.querySelectorAll<HTMLElement>("[data-deck-pill]") ?? []), pill, event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "ArrowDown" && entry && trays[key]) {
        event.preventDefault();
        focusTrayRef.current = true;
        revealTray(entry, true);
        if (tray === key) {
          trayAnchorRef.current?.querySelector<HTMLElement>("[data-tray-item]")?.focus({ preventScroll: true });
          focusTrayRef.current = false;
        }
      }
      return;
    }

    if (trayItem) {
      const items = Array.from(trayAnchorRef.current?.querySelectorAll<HTMLElement>("[data-tray-item]") ?? []);
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        cycle(items, trayItem, event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const index = items.indexOf(trayItem);
        const columns = 2;
        const next = index + (event.key === "ArrowDown" ? columns : -columns);
        if (next >= 0 && next < items.length) items[next]?.focus({ preventScroll: true });
        else if (event.key === "ArrowUp") focusPill(tray);
      }
    }
  }, [close, deck, focusPill, hideTray, open, revealTray, tray, trays]);

  const trayEntry = tray ? deck.find((entry) => entry.key === tray) ?? null : null;

  return (
    <div
      ref={anchorRef}
      className="nav-finder-anchor relative h-[3.5em]"
      onPointerLeave={() => { releaseHover(); scheduleClose(); }}
      onPointerEnter={cancelClose}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <nav
        ref={navRef}
        aria-label={labels.navAria}
        data-open={open}
        className="nav-finder nav-capsule absolute left-0 top-0 flex h-[3.5em] w-max items-center gap-[1em] rounded-[var(--nav-radius-round)] pl-[1.25em] pr-[0.5em]"
        style={{ "--nav-section-accent": accent } as CSSProperties}
      >
        <a
          href={config.homeHref}
          className="nav-control-focus flex h-[2.75em] shrink-0 items-center rounded-full px-[0.25em]"
          aria-label={labels.homeAria}
        >
          <span className="nav-logo nav-logo--desktop">{config.logo}</span>
        </a>

        <div className="nav-finder-morph flex items-center">
          <div ref={triggerCellRef} className="nav-finder-cell nav-finder-cell--trigger">
            <div className="nav-finder-cell-inner">
              <button
                ref={triggerRef}
                type="button"
                aria-expanded={open}
                aria-controls={deckId}
                aria-label={open ? labels.closeAria : labels.openAria}
                className="nav-finder-trigger nav-control-focus"
                onPointerEnter={(event) => { if (event.pointerType !== "touch") { preload(); hoverOpen(); } }}
                onFocus={preload}
                onClick={handleTriggerClick}
                tabIndex={open ? -1 : 0}
              >
                <ReticleMark />
                <span className="nav-finder-word">{labels.menu}</span>
              </button>
            </div>
          </div>

          <div ref={deckCellRef} className="nav-finder-cell nav-finder-cell--deck">
            <div className="nav-finder-cell-inner">
              <div id={deckId} ref={deckRef} className="nav-deck" inert={!open} aria-hidden={!open}>
                {deck.map((entry, index) => {
                  const hasTray = Boolean(trays[entry.key]);
                  const shared = {
                    "data-deck-pill": entry.key,
                    "data-icon": typeof entry.icon === "string" ? entry.icon : "custom",
                    "data-current": activeKey === entry.key || undefined,
                    "aria-expanded": hasTray ? tray === entry.key : undefined,
                    "aria-controls": hasTray ? trayId : undefined,
                    "aria-label": entry.content ? entry.label : undefined,
                    className: `nav-deck-pill nav-control-focus${entry.cta ? " nav-deck-pill--cta" : ""}`,
                    style: { "--nav-orb-accent": entry.accent, "--nav-entry-index": index } as CSSProperties,
                    onPointerEnter: (event: ReactPointerEvent) => { if (event.pointerType !== "touch") revealTray(entry); },
                    onFocus: () => {
                      if (silentPillFocusRef.current) return;
                      revealTray(entry, true);
                    },
                  };
                  const content = entry.content ?? (
                    <>
                      <DeckIcon icon={entry.icon} />
                      <span className="nav-deck-label">{entry.label}</span>
                    </>
                  );
                  return entry.href ? (
                    <a key={entry.key} href={entry.href} {...shared} onClick={(event) => handlePillClick(entry, event)}>
                      {content}
                    </a>
                  ) : (
                    <button key={entry.key} type="button" {...shared} onClick={(event) => handlePillClick(entry, event)}>
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div
        ref={trayAnchorRef}
        className="nav-tray-anchor absolute left-0 top-full z-10 w-max pt-[0.5em]"
        data-open={tray !== null}
        inert={tray === null}
      >
        <div
          id={trayId}
          role="group"
          aria-label={trayEntry ? trayEntry.label : undefined}
          aria-hidden={tray === null}
          className="nav-tray nav-glass-panel rounded-[var(--nav-radius-lg)] p-[0.75em]"
        >
          <div key={tray ?? "none"} className="nav-tray-swap nav-simple-menu-rail">
            <TrayContent entry={trayEntry} tray={trayEntry ? trays[trayEntry.key] : undefined} actions={actions} labels={labels} />
          </div>
        </div>
      </div>
    </div>
  );
}
