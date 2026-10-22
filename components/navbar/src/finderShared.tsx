import { useCallback, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { NavDeckEntry, NavTray, NavTrayItem, NavbarConfig, NavbarLabels } from "./types";
import { getTrayItems, trayLayout, useTrayVersion } from "./useNavTrays";

/* Pieces shared by the desktop finder and its mobile counterpart: the
   reticle mark, the tray rows and the action handlers. */

export function ReticleMark() {
  return (
    <span aria-hidden="true" className="nav-reticle">
      <svg className="nav-reticle-lids" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path className="nav-reticle-lid nav-reticle-lid--top" d="M5 12Q12 4.6 19 12" />
        <path className="nav-reticle-lid nav-reticle-lid--bottom" d="M5 12Q12 19.4 19 12" />
      </svg>
      <svg className="nav-reticle-frame" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <g className="nav-reticle-corners">
          <path d="M8.5 4H4v4.5M15.5 4H20v4.5M4 15.5V20h4.5M20 15.5V20h-4.5" />
        </g>
        <g className="nav-reticle-eye">
          <circle className="nav-reticle-dot" cx="12" cy="12" r="2.1" fill="var(--nav-section-accent, currentColor)" stroke="none" />
        </g>
      </svg>
    </span>
  );
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
  onClick: (event: MouseEvent<HTMLElement>) => void;
  className: string;
  style: CSSProperties;
  children: ReactNode;
};

/** A tray entry with an `href` is a real link (routable, middle-clickable);
    one without is a button. */
function ItemControl({ href, onClick, className, style, children }: ItemProps) {
  return href ? (
    <a href={href} data-tray-item onClick={onClick} className={className} style={style}>{children}</a>
  ) : (
    <button type="button" data-tray-item onClick={onClick} className={className} style={style}>{children}</button>
  );
}

function SubPill({ index, row, accent, onClick }: { index: number; row: NavTrayItem; accent: string; onClick: (event: MouseEvent<HTMLElement>) => void }) {
  return (
    <ItemControl
      href={row.href}
      onClick={onClick}
      className="nav-sub-pill nav-simple-menu-item nav-control-focus relative flex min-h-[3em] w-full items-center rounded-[var(--nav-radius-md)] py-[0.5em] pl-[1.75em] pr-[1.5em] text-left"
      style={{ "--nav-orb-accent": accent, "--nav-entry-index": index } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="nav-simple-menu-orb absolute left-0 top-1/2 flex h-[1.75em] w-[1.75em] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
      >
        <span className="nav-simple-menu-number nav-font-body text-[0.625em] font-bold tabular-nums">{String(index + 1).padStart(2, "0")}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="nav-row-title block truncate nav-font-body text-[0.78em] font-semibold leading-[1.3]">{row.title}</span>
        {row.meta && <span className="nav-row-meta nav-label-technical mt-1 block truncate">{row.meta}</span>}
      </span>
      <span aria-hidden="true" className="nav-sub-pill-arrow absolute right-[0.75em] top-1/2 -translate-y-1/2"><ArrowIcon /></span>
    </ItemControl>
  );
}

const markLoaded = (image: HTMLImageElement) => { image.dataset.loaded = ""; };

/* Desktop card: the cover edge to edge, monochrome at rest, the title
   centred over it; the entry's accent grades the artwork and draws the
   bottom edge on hover/focus. */
function TrayCard({ index, row, accent, showMeta, onClick }: { index: number; row: NavTrayItem; accent: string; showMeta: boolean; onClick: (event: MouseEvent<HTMLElement>) => void }) {
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
      onClick={onClick}
      className="nav-tray-card nav-control-focus"
      style={{ "--nav-orb-accent": accent, "--nav-entry-index": index } as CSSProperties}
    >
      {media}
      <span aria-hidden="true" className="nav-tray-card-grade" />
      <span aria-hidden="true" className="nav-tray-card-scrim" />
      <span aria-hidden="true" className="nav-tray-card-number">{index + 1}</span>
      <span className="nav-tray-card-text">
        <span className="nav-tray-card-title">{row.title}</span>
        {showMeta && row.meta && <span className="nav-tray-card-meta nav-label-technical">{row.meta}</span>}
      </span>
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

export type NavActions = ReturnType<typeof useNavActions>;

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
}: {
  entry: NavDeckEntry | null;
  tray: NavTray | undefined;
  actions: NavActions;
  labels: NavbarLabels;
  columns?: 1 | 2;
  sectionLink?: boolean;
  /** Honour the tray's desktop `layout` (cards); mobile always uses rows. */
  desktop?: boolean;
}) {
  useTrayVersion();
  if (!entry || !tray) return null;

  let body: ReactNode;
  let count = "";
  if (tray.kind === "cta") {
    count = tray.label;
    body = (
      <div className="nav-tray-contact">
        <p className="nav-row-title-quiet max-w-[23em] nav-font-body text-[0.78em] leading-[1.5]">{tray.copy}</p>
        <button
          type="button"
          data-tray-item
          onClick={() => actions.cta(entry, tray.label, tray.onSelect)}
          className="nav-tray-cta nav-control-focus mt-[0.75em] flex min-h-[3em] w-full items-center justify-between gap-[1.5em] rounded-[var(--nav-radius-md)] px-[1em] text-left nav-font-body text-[0.78em] font-semibold"
        >
          <span>{tray.label}</span>
          <span className="nav-tray-cta-arrow flex h-[2.25em] w-[2.25em] shrink-0 items-center justify-center rounded-full">
            <ArrowIcon />
          </span>
        </button>
        {tray.note && <span className="nav-row-meta nav-label-technical mt-3 block">{tray.note}</span>}
      </div>
    );
  } else {
    const items = getTrayItems(tray);
    const cards = desktop && trayLayout(tray, items) === "cards";
    if (!items) {
      body = <TraySkeleton columns={cards ? 1 : columns} cards={cards} label={labels.loading} />;
    } else {
      count = `${String(items.length).padStart(2, "0")} ${tray.unit}`;
      body = cards ? (
        <div className="grid grid-cols-1 gap-[0.5em]">
          {items.map((row, index) => (
            <TrayCard
              key={row.id}
              index={index}
              row={row}
              accent={row.accent ?? entry.accent}
              showMeta={Boolean(tray.cardMeta)}
              onClick={(event) => actions.item(entry, row, event)}
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
              accent={row.accent ?? entry.accent}
              onClick={(event) => actions.item(entry, row, event)}
            />
          ))}
        </div>
      );
    }
  }

  return (
    <>
      <div className="mb-[0.75em] flex items-baseline justify-between gap-[1em] pr-[0.25em]">
        <span className="nav-row-title nav-label-technical">{entry.label}</span>
        {sectionLink && entry.href && tray.kind !== "cta" ? (
          <a
            href={entry.href}
            data-tray-item
            onClick={(event) => actions.section(entry, event)}
            className="nav-tray-link nav-control-focus nav-label-technical inline-flex items-center gap-[0.5em] rounded-[var(--nav-radius-sm)]"
          >
            {labels.sectionLink} <ArrowIcon />
          </a>
        ) : (
          <span className="nav-row-meta nav-label-technical">{count}</span>
        )}
      </div>
      {body}
    </>
  );
}
