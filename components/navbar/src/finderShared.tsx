import { useCallback, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { NavDeckEntry, NavTray, NavbarConfig, NavbarLabels } from "./types";
import { getTrayItems, useTrayVersion } from "./useNavTrays";

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

function SubPill({ index, title, meta, accent, onClick }: { index: number; title: string; meta?: string; accent: string; onClick: () => void }) {
  return (
    <button
      type="button"
      data-tray-item
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
        <span className="nav-row-title block truncate nav-font-body text-[0.78em] font-semibold leading-[1.3]">{title}</span>
        {meta && <span className="nav-row-meta nav-label-technical mt-1 block truncate">{meta}</span>}
      </span>
      <span aria-hidden="true" className="nav-sub-pill-arrow absolute right-[0.75em] top-1/2 -translate-y-1/2"><ArrowIcon /></span>
    </button>
  );
}

function TraySkeleton({ columns, label }: { columns: 1 | 2; label: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={`grid gap-[0.625em] ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="nav-sub-pill-skeleton min-h-[3em] rounded-[var(--nav-radius-md)]" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export type NavActions = ReturnType<typeof useNavActions>;

/** Action handlers. Every destination closes the menu first, then dispatches. */
export function useNavActions(config: NavbarConfig, close: () => void, location: "navbar" | "mobile_menu") {
  const { track, onSection } = config;

  const item = useCallback((entry: NavDeckEntry, id: string, title: string, onSelect: () => void) => {
    close();
    track?.("nav_modal_open", { location, deck: entry.key, item: id, label: title });
    onSelect();
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
}: {
  entry: NavDeckEntry | null;
  tray: NavTray | undefined;
  actions: NavActions;
  labels: NavbarLabels;
  columns?: 1 | 2;
  sectionLink?: boolean;
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
    if (!items) {
      body = <TraySkeleton columns={columns} label={labels.loading} />;
    } else {
      count = `${String(items.length).padStart(2, "0")} ${tray.unit}`;
      body = (
        <div className={`grid gap-[0.625em] ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {items.map((row, index) => (
            <SubPill
              key={row.id}
              index={index}
              title={row.title}
              meta={row.meta}
              accent={row.accent ?? entry.accent}
              onClick={() => actions.item(entry, row.id, row.title, row.onSelect)}
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
