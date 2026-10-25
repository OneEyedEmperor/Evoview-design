import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { NavDeckEntry, NavbarConfig } from "./types";
import { ensureTray, preloadTrays } from "./useNavTrays";
import { CurrentPageSlot, DeckLabel, DeckMark, deckLabel, marksLive, ReticleMark, TrayContent, useCurrentPage, useNavActions } from "./finderShared";

/* Mobile finder. Same capsule and vocabulary as the desktop finder, unfolding
   downward instead of sideways: a tap on the finder pill grows the capsule
   into a 2×2 deck of pills; a tap on a pill unfolds its tray inside the
   capsule (second tap, or the tray's link, goes to the section). The page
   behind is dimmed and scroll-locked while open.

   The body is a 0fr ⇄ 1fr row like the desktop columns. The tray inside it
   animates an explicit, measured height instead, so switching between two
   trays of different lengths glides rather than jumps; its last contents stay
   mounted until the fold has finished so the row never collapses empty. */

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Must match the `min-width` at which navbar.css swaps the two finders. */
export const DESKTOP_QUERY = "(min-width: 768px)";

export default function NavFinderMobile({ config, activeKey, current, accent }: { config: NavbarConfig; activeKey: string | undefined; current: "page" | "location"; accent: string }) {
  const [open, setOpen] = useState(false);
  const [tray, setTray] = useState<string | null>(null);
  // The tray last shown: outlives `tray` through the collapse.
  const [shownTray, setShownTray] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const trayInnerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLSpanElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const baseId = useId();
  const bodyId = `${baseId}-body`;
  const trayId = `${baseId}-tray`;

  const { deck, trays, labels } = config;

  const close = useCallback(() => {
    setOpen(false);
    setTray(null);
  }, []);
  const actions = useNavActions(config, close, "mobile_menu");
  const page = useCurrentPage(config, activeKey, current);

  useEffect(() => {
    if (open) preloadTrays(config);
  }, [config, open]);

  useEffect(() => {
    if (tray) setShownTray(tray);
  }, [tray]);

  // Reduced motion runs the fold at 0ms, which fires no transitionend: drop
  // the lingering contents on a timer once the whole menu is closed.
  useEffect(() => {
    if (open || !shownTray) return;
    const id = window.setTimeout(() => setShownTray(null), 600);
    return () => window.clearTimeout(id);
  }, [open, shownTray]);

  // The tray's height is explicit so it can transition between contents.
  useLayoutEffect(() => {
    const outer = trayRef.current;
    const inner = trayInnerRef.current;
    if (!outer || !inner) return;
    const sync = () => outer.style.setProperty("--nav-tray-h", `${inner.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(sync);
    observer.observe(inner);
    sync();
    return () => observer.disconnect();
  }, []);

  // MENU ⇄ CLOSE width morph needs both words' widths as explicit lengths.
  useLayoutEffect(() => {
    const words = wordsRef.current;
    if (!words) return;
    const [openWord, closeWord] = words.querySelectorAll<HTMLElement>(".nav-finder-word");
    if (!openWord || !closeWord) return;
    const sync = () => {
      words.style.setProperty("--nav-word-w-open", `${openWord.getBoundingClientRect().width}px`);
      words.style.setProperty("--nav-word-w-close", `${closeWord.getBoundingClientRect().width}px`);
    };
    const observer = new ResizeObserver(sync);
    observer.observe(openWord);
    observer.observe(closeWord);
    sync();
    return () => observer.disconnect();
  }, []);

  // The tray scales in from under the tapped pill, as on desktop.
  useLayoutEffect(() => {
    const outer = trayRef.current;
    const pill = tray ? navRef.current?.querySelector<HTMLElement>(`[data-deck-pill="${tray}"]`) : null;
    if (!outer || !pill) return;
    const pillRect = pill.getBoundingClientRect();
    const trayRect = outer.getBoundingClientRect();
    outer.style.setProperty("--nav-tray-origin", `${pillRect.left + pillRect.width / 2 - trayRect.left}px`);
  }, [tray]);

  // Crossing into the desktop finder closes the mobile one.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => { if (query.matches) close(); };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [close, open]);

  // Scroll lock, focus trap, Escape, focus restore: the dialog contract.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const scrollY = window.scrollY;
    const previousBodyStyle = document.body.getAttribute("style");
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${scrollY}px`,
      left: "0",
      right: "0",
      width: "100%",
      overflow: "hidden",
    });

    const frame = window.requestAnimationFrame(() => {
      navRef.current?.querySelector<HTMLElement>("[data-deck-pill]")?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(navRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        .filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousBodyStyle === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", previousBodyStyle);
      // "auto" would defer to a page-level `scroll-behavior: smooth`.
      window.scrollTo({ top: scrollY, behavior: "instant" });
      restoreFocusRef.current?.focus({ preventScroll: true });
      restoreFocusRef.current = null;
    };
  }, [close, open]);

  const toggle = () => {
    preloadTrays(config);
    if (open) close();
    else setOpen(true);
  };

  const handlePill = (entry: NavDeckEntry, event: MouseEvent<HTMLElement>) => {
    const entryTray = trays[entry.key];
    if (entryTray && tray !== entry.key) {
      event.preventDefault();
      void ensureTray(entryTray).catch(() => undefined);
      setTray(entry.key);
      return;
    }
    actions.section(entry, event);
  };

  const handleTrayTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target === trayRef.current && event.propertyName === "height" && tray === null) setShownTray(null);
  };

  const trayEntry = deck.find((entry) => entry.key === (tray ?? shownTray)) ?? null;

  return (
    <div className="nav-finder-m-root relative w-full">
      <nav
        ref={navRef}
        aria-label={labels.navAria}
        data-open={open}
        className="nav-finder nav-finder--mobile nav-capsule relative z-10 flex w-full flex-col"
        style={{ "--nav-section-accent": accent } as CSSProperties}
      >
        <div className="flex h-[3em] shrink-0 items-center pl-[1em] pr-[0.5em]">
          <a
            href={config.homeHref}
            onClick={close}
            className="nav-control-focus flex h-[2.75em] flex-1 items-center rounded-full px-[0.25em]"
            aria-label={labels.homeAria}
          >
            <span className="nav-logo nav-logo--mobile">{config.logo}</span>
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={open ? labels.closeAria : labels.openAria}
            className="nav-finder-trigger nav-control-focus"
            onClick={toggle}
          >
            <ReticleMark />
            <span ref={wordsRef} className="nav-finder-words" aria-hidden="true">
              <span className="nav-finder-word-cell nav-finder-word-cell--open">
                <span className="nav-finder-word">{labels.menu}</span>
              </span>
              <span className="nav-finder-word-cell nav-finder-word-cell--close">
                <span className="nav-finder-word">{labels.close}</span>
              </span>
            </span>
          </button>
          <CurrentPageSlot page={page} labels={labels} hidden={open} />
        </div>

        <div id={bodyId} className="nav-finder-m-body" inert={!open} aria-hidden={!open}>
          <div className="nav-finder-m-body-inner">
            <div className="nav-finder-m-body-pad">
              <div className="nav-deck nav-deck--mobile">
                {deck.map((entry, index) => {
                  const hasTray = Boolean(trays[entry.key]);
                  const isCurrent = activeKey === entry.key;
                  const shared = {
                    "data-deck-pill": entry.key,
                    "data-icon": typeof entry.icon === "string" ? entry.icon : "custom",
                    "data-current": isCurrent || undefined,
                    "aria-current": isCurrent ? current : undefined,
                    "aria-expanded": hasTray ? tray === entry.key : undefined,
                    "aria-controls": hasTray ? trayId : undefined,
                    "aria-label": entry.content ? entry.label : deckLabel(entry, page).aria,
                    className: `nav-deck-pill nav-control-focus${entry.cta ? " nav-deck-pill--cta" : ""}`,
                    style: { "--nav-orb-accent": entry.accent, "--nav-entry-index": index } as CSSProperties,
                  };
                  const content = (
                    <>
                      {entry.content ?? (
                        <>
                          <DeckMark entry={entry} live={marksLive(config, current) && isCurrent} />
                          <DeckLabel text={deckLabel(entry, page).text} />
                        </>
                      )}
                      {isCurrent && <span aria-hidden="true" className="nav-deck-current" />}
                    </>
                  );
                  return entry.href ? (
                    <a key={entry.key} href={entry.href} {...shared} onClick={(event) => handlePill(entry, event)}>
                      {content}
                    </a>
                  ) : (
                    <button key={entry.key} type="button" {...shared} onClick={(event) => handlePill(entry, event)}>
                      {content}
                    </button>
                  );
                })}
              </div>

              <div
                ref={trayRef}
                className="nav-finder-m-tray"
                data-open={tray !== null}
                inert={tray === null}
                aria-hidden={tray === null}
                onTransitionEnd={handleTrayTransitionEnd}
              >
                <div ref={trayInnerRef} className="nav-finder-m-tray-inner">
                  <div id={trayId} key={tray ?? shownTray ?? "none"} className="nav-tray-swap nav-simple-menu-rail nav-simple-menu-rail--mobile">
                    <TrayContent
                      entry={trayEntry}
                      tray={trayEntry ? trays[trayEntry.key] : undefined}
                      actions={actions}
                      labels={labels}
                      columns={1}
                      sectionLink
                      currentPath={config.currentPath}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <button
        type="button"
        aria-label={labels.closeAria}
        tabIndex={-1}
        onPointerDown={close}
        data-open={open}
        className="nav-mobile-backdrop fixed inset-0 z-0 cursor-default"
        style={{ pointerEvents: open ? "auto" : "none" }}
      />
    </div>
  );
}
