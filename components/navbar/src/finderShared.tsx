import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject, type TransitionEvent } from "react";
import { OrbFill } from "../foundation/OrbFill";
import { SurfaceFill } from "../foundation/SurfaceFill";
import { DeckIcon } from "./NavIcons";
import type { NavDeckEntry, NavTray, NavTrayItem, NavbarConfig, NavbarLabels } from "./types";
import { ensureTray, getTrayItems, trayLayout, useTrayVersion } from "./useNavTrays";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/* Pieces shared by the desktop finder and its mobile counterpart: the
   reticle mark, the tray rows and the action handlers. */

type Loop = { keyframes: Keyframe[]; duration: number };
/** Opacity 1 → `low` → 1, each half eased in and out. */
const pulse = (low: number, duration: number): Loop => ({
  keyframes: [{ opacity: 1, easing: "ease-in-out" }, { opacity: low, easing: "ease-in-out" }, { opacity: 1 }],
  duration,
});
const REC_BLINK = pulse(0.15, 1000);
const RETICLE_BLINK = pulse(0.15, 1600);
const EYE_PULSE = pulse(0.72, 3200);
const CSS_ANIMATION_EVENTS = ["animationstart", "animationend", "animationcancel"] as const;

/** The bar's resting loops run as Web Animations, not CSS animations: React
    listens for `animationiteration`, so a CSS loop wakes the main thread at
    every iteration, where a script animation stays on the compositor.
    The loop holds where it is while `running` is false or the mark has no
    box (the other finder is `display: none`, and unlike a CSS animation a
    script one keeps running there): a mark that isn't painted has no
    compositor layer, so its loop would tick on the main thread. A CSS
    animation starting on the element itself (the hud's hover blink) replaces
    the loop, which restarts from its lit frame when that one stops. */
function useLoop(ref: RefObject<Element | null>, loop: Loop | null, running: boolean) {
  const reduced = usePrefersReducedMotion();
  const runningRef = useRef(running);
  const applyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !loop || reduced || typeof element.animate !== "function") return;
    const animation = element.animate(loop.keyframes, { duration: loop.duration, iterations: Infinity });
    let replaced = false;
    let boxed = false;
    const apply = () => {
      if (replaced) animation.cancel();
      else if (runningRef.current && boxed) animation.play();
      else animation.pause();
    };
    const onCss = (event: Event) => {
      if (event.target !== element) return;
      replaced = event.type === "animationstart";
      apply();
    };
    const box = new ResizeObserver(([entry]) => {
      boxed = entry.contentRect.width > 0 || entry.contentRect.height > 0;
      apply();
    });
    CSS_ANIMATION_EVENTS.forEach((type) => element.addEventListener(type, onCss));
    box.observe(element);
    applyRef.current = apply;
    apply();
    return () => {
      CSS_ANIMATION_EVENTS.forEach((type) => element.removeEventListener(type, onCss));
      box.disconnect();
      applyRef.current = null;
      animation.cancel();
    };
  }, [ref, loop, reduced]);

  useEffect(() => {
    runningRef.current = running;
    applyRef.current?.();
  }, [running]);
}

/** `covered`: the open desktop deck hides the finder pill. */
export function ReticleMark({ hud = false, covered = false }: { hud?: boolean; covered?: boolean }) {
  const lidsRef = useRef<SVGSVGElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  useLoop(lidsRef, hud ? null : EYE_PULSE, !covered);
  useLoop(dotRef, hud ? RETICLE_BLINK : null, !covered);
  return (
    <span aria-hidden="true" className="nav-reticle">
      <svg ref={lidsRef} className="nav-reticle-lids" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path className="nav-reticle-lid nav-reticle-lid--top" d="M5 12Q12 4.6 19 12" />
        <path className="nav-reticle-lid nav-reticle-lid--bottom" d="M5 12Q12 19.4 19 12" />
      </svg>
      <svg className="nav-reticle-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <g className="nav-reticle-corners">
          <path d="M8.5 4H4v4.5M15.5 4H20v4.5M4 15.5V20h4.5M20 15.5V20h-4.5" />
        </g>
        <g className="nav-reticle-eye">
          <circle ref={dotRef} className="nav-reticle-dot" cx="12" cy="12" r="2.1" fill="var(--nav-section-accent, currentColor)" stroke="none" />
        </g>
      </svg>
    </span>
  );
}

/** The blinking REC dot (live deck pill, current-page pill). */
function RecDot({ running, color }: { running: boolean; color?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLoop(ref, REC_BLINK, running);
  return <span ref={ref} aria-hidden="true" className="nav-page-pill-dot" style={color ? ({ "--nav-rec-dot": color } as CSSProperties) : undefined} />;
}

export function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
    </svg>
  );
}

type ItemProps = {
  href?: string;
  current?: boolean;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onPreview?: () => void;
  onPreviewEnd?: () => void;
  className: string;
  style: CSSProperties;
  children: ReactNode;
};

/** A tray entry with an `href` is a real link (routable, middle-clickable);
    one without is a button. */
function ItemControl({ href, current, onClick, onPreview, onPreviewEnd, className, style, children }: ItemProps) {
  const state = {
    "data-current": current || undefined,
    "aria-current": current ? ("page" as const) : undefined,
    onPointerEnter: onPreview,
    onFocus: onPreview,
    onPointerLeave: onPreviewEnd,
    onBlur: onPreviewEnd,
  };
  return href ? (
    <a href={href} data-tray-item {...state} onClick={onClick} className={className} style={style}>{children}</a>
  ) : (
    <button type="button" data-tray-item {...state} onClick={onClick} className={className} style={style}>{children}</button>
  );
}

type EntryProps = {
  index: number;
  row: NavTrayItem;
  accent: string;
  /** Pill text when this entry is the current page. */
  currentLabel?: string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onPreview?: () => void;
  onPreviewEnd?: () => void;
};

function CurrentBadge({ label }: { label: string }) {
  return <span className="nav-current-badge nav-label-technical">{label}</span>;
}

/** `titleOnly` (mobile): no `meta` line, a larger title. */
function SubPill({ index, row, accent, currentLabel, onClick, onPreview, onPreviewEnd, titleOnly = false }: EntryProps & { titleOnly?: boolean }) {
  return (
    <ItemControl
      href={row.href}
      current={currentLabel !== undefined}
      onClick={onClick}
      onPreview={onPreview}
      onPreviewEnd={onPreviewEnd}
      className="nav-sub-pill nav-simple-menu-item nav-control-focus relative flex min-h-[3em] w-full items-center rounded-[var(--nav-radius-md)] py-[0.5em] pl-[1.75em] pr-[1.5em] text-left"
      style={{ "--nav-orb-accent": accent, "--nav-entry-index": index } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="nav-simple-menu-orb absolute left-0 top-1/2 flex h-[1.75em] w-[1.75em] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
      >
        <OrbFill hoverWithin=".nav-simple-menu-item" withPress>
          <span className="nav-simple-menu-number nav-font-body text-[0.625em] font-bold tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        </OrbFill>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`nav-row-title block truncate nav-font-body font-semibold leading-[1.3] ${titleOnly ? "text-[0.95em]" : "text-[0.78em]"}`}>{row.title}</span>
        {!titleOnly && row.meta && <span className="nav-row-meta nav-label-technical mt-1 block truncate">{row.meta}</span>}
      </span>
      {currentLabel !== undefined ? (
        <span className="ml-[0.75em] shrink-0"><CurrentBadge label={currentLabel} /></span>
      ) : (
        <span aria-hidden="true" className="nav-sub-pill-arrow absolute right-[0.75em] top-1/2 -translate-y-1/2"><ArrowIcon /></span>
      )}
    </ItemControl>
  );
}

const markLoaded = (image: HTMLImageElement) => { image.dataset.loaded = ""; };

/* Desktop card: the cover edge to edge, blurred and monochrome at rest, the title
   centred over it; the entry's accent grades the artwork and draws the
   bottom edge on hover/focus. */
function TrayCard({ index, row, accent, currentLabel, onClick, onPreview, onPreviewEnd }: EntryProps) {
  let media: ReactNode = null;
  if (typeof row.cover === "string") {
    media = (
      <img
        src={row.cover}
        alt=""
        width={900}
        height={216}
        decoding="async"
        draggable={false}
        // A cover decoded before hydration fires no load event.
        ref={(image) => { if (image?.complete && image.naturalWidth > 0) markLoaded(image); }}
        onLoad={(event) => markLoaded(event.currentTarget)}
        className="nav-tray-card-media"
      />
    );
  } else if (row.cover) {
    media = <span aria-hidden="true" data-loaded="" className="nav-tray-card-media nav-tray-card-media--node">{row.cover}</span>;
  }
  return (
    <ItemControl
      href={row.href}
      current={currentLabel !== undefined}
      onClick={onClick}
      onPreview={onPreview}
      onPreviewEnd={onPreviewEnd}
      className="nav-tray-card nav-control-focus"
      style={{ "--nav-orb-accent": accent, "--nav-entry-index": index } as CSSProperties}
    >
      {media}
      <span aria-hidden="true" className="nav-tray-card-grade" />
      <span aria-hidden="true" className="nav-tray-card-scrim" />
      <span className="nav-tray-card-title">{row.title}</span>
      {currentLabel !== undefined && <span className="nav-tray-card-badge"><CurrentBadge label={currentLabel} /></span>}
      <span aria-hidden="true" className="nav-tray-card-edge" />
    </ItemControl>
  );
}

function TraySkeleton({ columns, cards, label }: { columns: 1 | 2; cards: boolean; label: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={`grid ${cards ? "gap-[0.5em]" : "gap-[0.625em]"} ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={`nav-sub-pill-skeleton rounded-[var(--nav-radius-md)] ${cards ? "nav-tray-card-skeleton" : "min-h-[3em]"}`} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

const normalizePath = (href: string) => href.replace(/\/+$/, "") || "/";

export type CurrentPage = { entry: NavDeckEntry; title: string };

/** Whether the live pill carries the REC marks (blinking dot, page pill):
    always on multi-page sites, on one-page sites only with `sectionPill`. */
export const marksLive = (config: NavbarConfig, current: "page" | "location") => current === "page" || Boolean(config.sectionPill);

/** Multi-page sites: the live deck entry and the page's name, from the tray
    entry whose `href` is the current route, else the deck label; none on the
    home route, which the wordmark already marks. One-page sites with
    `sectionPill`: the entry of the section in view and its deck label. */
export function useCurrentPage(config: NavbarConfig, activeKey: string | undefined, current: "page" | "location"): CurrentPage | null {
  useTrayVersion();
  // The location fallback is read after mount so server and client agree.
  const [clientPath, setClientPath] = useState<string>();
  useEffect(() => { setClientPath(normalizePath(window.location.pathname)); }, [config]);
  const path = config.currentPath ?? clientPath;
  const entry = marksLive(config, current) && activeKey !== undefined ? config.deck.find((candidate) => candidate.key === activeKey) : undefined;
  const tray = entry ? config.trays[entry.key] : undefined;

  useEffect(() => { void ensureTray(tray).catch(() => undefined); }, [tray]);

  if (!entry) return null;
  if (current === "location") return { entry, title: entry.label };
  if (path === undefined || path === normalizePath(config.homeHref)) return null;
  const item = getTrayItems(tray)?.find((row) => row.href !== undefined && normalizePath(row.href) === path);
  return { entry, title: item?.title ?? entry.label };
}

/** The live pill names the page itself (a page inside the section shows its
    own title); its link still goes to the section, so the accessible name
    carries both. */
export function deckLabel(entry: NavDeckEntry, page: CurrentPage | null): { text: string; aria?: string } {
  if (!page || page.entry.key !== entry.key || page.title === entry.label) return { text: entry.label };
  return { text: page.title, aria: `${page.title} (${entry.label})` };
}

/** A deck pill's label; a change of text glides the pill's width and brings
    the new words in, except in a `folded` deck, which nobody sees. */
export function DeckLabel({ text, folded = false }: { text: string; folded?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useWidthGlide(ref, text, folded);
  return (
    <span ref={ref} className="nav-deck-label" onTransitionEnd={releaseWidth}>
      <LabelText key={text} text={text} folded={folded} />
    </span>
  );
}

/** Words swapped in while the deck is folded finish their rise-in at once:
    the end state of one that ran unseen, without ticking it. */
function LabelText({ text, folded }: { text: string; folded: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [foldedAtMount] = useState(folded);
  useLayoutEffect(() => {
    if (foldedAtMount) ref.current?.getAnimations().forEach((animation) => animation.finish());
  }, [foldedAtMount]);
  return <span ref={ref} className="nav-deck-label-text">{text}</span>;
}

/** Deck pill mark: an entry with a `dot` colour shows its dot instead of the
    icon. Where `marksLive`, the live pill's dot blinks (a live entry without
    `dot` gets the default blinking dot) while the deck is `open`; the others
    hold still. */
export function DeckMark({ entry, live, open }: { entry: NavDeckEntry; live: boolean; open: boolean }) {
  if (!live && !entry.dot) return <DeckIcon icon={entry.icon} />;
  return (
    <span aria-hidden="true" className="nav-deck-icon nav-deck-rec">
      {live ? (
        <RecDot running={open} color={entry.dot} />
      ) : (
        <span className="nav-page-pill-dot" style={entry.dot ? ({ "--nav-rec-dot": entry.dot } as CSSProperties) : undefined} />
      )}
    </span>
  );
}

/** Width FLIP for an element whose content changes with `key`: from its last
    measured width to the new natural one (the element transitions `width`;
    pair with `releaseWidth` on transitionend). `still`: no glide and no
    measuring; the next change after it clears only seeds the width. */
export function useWidthGlide(ref: RefObject<HTMLElement | null>, key: string, still = false) {
  const widthRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (still) {
      element.style.width = "";
      widthRef.current = null;
      return;
    }
    const previous = widthRef.current;
    element.style.width = "";
    const next = element.offsetWidth;
    widthRef.current = next;
    if (previous === null || previous === next) return;
    element.style.width = `${previous}px`;
    void element.offsetWidth;
    element.style.width = `${next}px`;
  }, [ref, key, still]);
}

/** Longest deck fold (pill translate + its stagger), with margin. */
const FOLD_MS = 700;

/** True once the deck has finished folding away; false from the moment it
    opens. A folded deck is invisible, so it skips its transitions and label
    motion (re-toning, width glides, rise-ins) instead of running them unseen. */
export function useFolded(open: boolean) {
  const [settled, setSettled] = useState(!open);
  useEffect(() => {
    if (open) {
      setSettled(false);
      return;
    }
    const id = window.setTimeout(() => setSettled(true), FOLD_MS);
    return () => window.clearTimeout(id);
  }, [open]);
  return !open && settled;
}

/** Back to natural width once a glide settles, so later reflows (fonts) apply. */
export const releaseWidth = (event: TransitionEvent<HTMLElement>) => {
  if (event.propertyName === "width" && event.target === event.currentTarget) event.currentTarget.style.width = "";
};

/** The current-page pill in its slot. The slot unfolds from zero width when
    a page appears and folds away (keeping its last contents) when none
    applies; a change of page glides the pill's width and brings the new dot
    and name in. `hidden` folds it regardless (mobile, menu open); `covered`
    holds its dot while the open desktop deck hides the pill. */
export function CurrentPageSlot({ page, labels, hidden = false, covered = false }: { page: CurrentPage | null; labels: NavbarLabels; hidden?: boolean; covered?: boolean }) {
  const [shown, setShown] = useState(page);
  useEffect(() => { if (page) setShown(page); }, [page]);
  const present = page !== null && !hidden;
  const pillRef = useRef<HTMLSpanElement>(null);
  const key = shown ? `${shown.entry.key}:${shown.title}` : "";
  useWidthGlide(pillRef, key);

  return (
    <span className="nav-page-slot" data-present={present || undefined} aria-hidden={!present}>
      <span className="nav-page-slot-clip">
        {shown && (
          <span
            ref={pillRef}
            className="nav-page-pill"
            onTransitionEnd={releaseWidth}
          >
            <span key={key} className="nav-page-pill-body">
              <RecDot running={present && !covered} color={shown.entry.dot} />
              <span className="sr-only">{labels.currentItem ?? "Active page"}: </span>
              <span className="nav-page-pill-label">{shown.title}</span>
            </span>
          </span>
        )}
      </span>
    </span>
  );
}

export type NavActions =ReturnType<typeof useNavActions>;

/** Action handlers. Every destination closes the menu first, then dispatches. */
export function useNavActions(config: NavbarConfig, close: () => void, location: "navbar" | "mobile_menu") {
  const { track, onSection } = config;

  const item = useCallback((entry: NavDeckEntry, row: NavTrayItem, event: MouseEvent<HTMLElement>) => {
    close();
    track?.(row.href ? "nav_click" : "nav_modal_open", { location, deck: entry.key, item: row.id, label: row.title, target: row.href ?? null });
    row.onSelect?.(event);
  }, [close, location, track]);

  const cta = useCallback((entry: NavDeckEntry, label: string, onSelect: () => void) => {
    close();
    track?.("cta_click", { location: "header", deck: entry.key, label });
    onSelect();
  }, [close, track]);

  /* Section navigation: anchors scroll natively unless `onSection` prevents
     the default (a CTA pill opening a modal, say). */
  const section = useCallback((entry: NavDeckEntry, event: MouseEvent<HTMLElement>) => {
    track?.("nav_click", { location, label: entry.label, target: entry.href ?? null });
    onSection?.(entry, event);
    if (!entry.keepOpen) close();
  }, [close, location, onSection, track]);

  return useMemo(() => ({ item, cta, section }), [item, cta, section]);
}

export function TrayContent({
  entry,
  tray,
  actions,
  labels,
  columns = 2,
  sectionLink = false,
  desktop = false,
  currentPath,
  onPreview,
  onPreviewEnd,
}: {
  entry: NavDeckEntry | null;
  tray: NavTray | undefined;
  actions: NavActions;
  labels: NavbarLabels;
  columns?: 1 | 2;
  sectionLink?: boolean;
  /** Honour the tray's desktop `layout` (cards); mobile always uses rows. */
  desktop?: boolean;
  currentPath?: string;
  /** An entry is hovered or focused (desktop: its pill previews the title). */
  onPreview?: (row: NavTrayItem) => void;
  /** The pointer or focus leaves an entry. Leaving one entry for the next
      fires in the same dispatch as the next entry's preview, so React
      batches the two and the pill never flashes its own name between. */
  onPreviewEnd?: () => void;
}) {
  useTrayVersion();
  if (!entry || !tray) return null;

  const path = currentPath ?? (typeof window === "undefined" ? undefined : normalizePath(window.location.pathname));
  const currentLabel = (row: NavTrayItem) =>
    path !== undefined && row.href !== undefined && normalizePath(row.href) === path
      ? labels.currentItem ?? "Active page"
      : undefined;

  let body: ReactNode;
  if (tray.kind === "cta") {
    body = (
      <div className="nav-tray-contact">
        <p className="nav-row-title-quiet max-w-[23em] nav-font-body text-[0.78em] leading-[1.5]">{tray.copy}</p>
        <button
          type="button"
          data-tray-item
          data-ev-jelly=""
          onClick={() => actions.cta(entry, tray.label, tray.onSelect)}
          className="nav-tray-cta nav-control-focus relative mt-[0.75em] flex min-h-[3em] w-full items-center justify-between gap-[1.5em] rounded-[var(--nav-radius-md)] px-[1em] text-left nav-font-body text-[0.78em] font-semibold"
        >
          <span>{tray.label}</span>
          <span className="nav-tray-cta-arrow flex h-[2.25em] w-[2.25em] shrink-0 items-center justify-center rounded-full">
            <ArrowIcon />
          </span>
          {/* Hover pours the hover plate colour over the CTA (RULES §1). */}
          <SurfaceFill hoverWithin=".nav-tray-cta">
            <span>{tray.label}</span>
            <span className="nav-tray-cta-arrow flex h-[2.25em] w-[2.25em] shrink-0 items-center justify-center rounded-full">
              <ArrowIcon />
            </span>
          </SurfaceFill>
        </button>
        {tray.note && <span className="nav-row-meta nav-label-technical mt-3 block">{tray.note}</span>}
      </div>
    );
  } else {
    const items = getTrayItems(tray);
    const cards = desktop && trayLayout(tray, items) === "cards";
    // A section with a dot colour grades its whole tray in it.
    const accentOf = (row: NavTrayItem) => entry.dot ?? row.accent ?? entry.accent;
    if (!items) {
      body = <TraySkeleton columns={cards ? 1 : columns} cards={cards} label={labels.loading} />;
    } else {
      body = cards ? (
        <div className="grid grid-cols-1 gap-[0.5em]">
          {items.map((row, index) => (
            <TrayCard
              key={row.id}
              index={index}
              row={row}
              accent={accentOf(row)}
              currentLabel={currentLabel(row)}
              onClick={(event) => actions.item(entry, row, event)}
              onPreview={onPreview ? () => onPreview(row) : undefined}
              onPreviewEnd={onPreviewEnd}
            />
          ))}
        </div>
      ) : (
        <div className={`grid gap-[0.625em] ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {items.map((row, index) => (
            <SubPill
              key={row.id}
              index={index}
              row={row}
              accent={accentOf(row)}
              currentLabel={currentLabel(row)}
              titleOnly={!desktop}
              onClick={(event) => actions.item(entry, row, event)}
              onPreview={onPreview ? () => onPreview(row) : undefined}
              onPreviewEnd={onPreviewEnd}
            />
          ))}
        </div>
      );
    }
  }

  // The tray names its section: the open pill may be showing a page title
  // instead. Touch also gets the link to the section page, which it cannot
  // reach by a second hover.
  return (
    <>
      <div className="nav-tray-head">
        <span className="nav-tray-title">{entry.label}</span>
        {sectionLink && entry.href && tray.kind !== "cta" && (
          <a
            href={entry.href}
            data-tray-item
            onClick={(event) => actions.section(entry, event)}
            className="nav-tray-link nav-control-focus nav-label-technical inline-flex items-center gap-[0.5em] rounded-[var(--nav-radius-sm)]"
          >
            {labels.sectionLink} <ArrowIcon />
          </a>
        )}
      </div>
      {body}
    </>
  );
}
