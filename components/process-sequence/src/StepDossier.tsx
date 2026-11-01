import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { GhostAction, GlassClose, PagerOrb, PrimaryPlate, SegmentedProgress } from "../controls";
import {
  ArrowLeft,
  cn,
  EvoviewMark,
  followRouteLink,
  HeldCopy,
  Index,
  pad,
  useHeldSrc,
  useHydrated,
  useMediaQuery,
  useMediaReady,
  usePressJelly,
  useScrollLock,
  useSuspendBackground,
} from "../foundation";
import { isVideo } from "./media";
import { headingLines } from "./routes";
import type { ProcessSequenceConfig, ProcessSequenceCopy, ProcessStep, StepMedia } from "./types";

export type StepDossierProps = {
  steps: ProcessStep[];
  /** Requested step (0-based). Its copy mounts after the out-motion; its media gate holds the entrance. */
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  copy: ProcessSequenceCopy;
  /** Replaces "next" on the last step. */
  cta?: ProcessSequenceConfig["cta"];
  attribution?: ProcessSequenceConfig["attribution"];
  /** Sheet tone; the stage stays dark. */
  tone?: "dark" | "light";
  /** URL of a step's view: previous / next / step cells render as `<a href>` (plain click → `onIndexChange`, modified click → the URL). */
  hrefFor?: (index: number) => string | undefined;
  /** Steps the dossier can show; previous / next skip the others. Default: every step. */
  canOpen?: (index: number) => boolean;
  /** Escape and backdrop: one level up. Default: close. */
  onUp?: () => void;
  /** Host-controlled exit: close requests call `onClose` at once; the host keeps the dossier mounted with `closing` for `STEP_DOSSIER_EXIT_MS`. Omitted: the dossier plays its exit, then calls `onClose`. */
  closing?: boolean;
};

export const STEP_DOSSIER_EXIT_MS = 320;
const OUT_MS = 180;
const mq = "(min-width: 768px)";
const FOCUSABLE = 'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])';

type KeyLike = Pick<KeyboardEvent, "key" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey" | "preventDefault" | "stopPropagation">;

/**
 * Split modal for one step: stage 5/12 (media, numeral, approved Evoview mark)
 * and sheet 7/12 (heading, progress, intro, numbered items, objective,
 * prev / next). Phone: full sheet with sticky header and footer. The step's
 * copy is mounted from the first render (server HTML included) and held until
 * its media is decoded, then its entrance plays. ←/→ / Esc, focus contained,
 * page suspended and scroll-locked while open.
 */
export function StepDossier({ steps, index, onIndexChange, onClose, copy, cta, attribution, tone = "dark", hrefFor, canOpen, onUp, closing: closingProp }: StepDossierProps) {
  const n = steps.length;
  const titleId = useId();
  usePressJelly();
  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wide = useMediaQuery(mq, true);
  const hydrated = useHydrated();
  useSuspendBackground(true);
  useScrollLock(true);

  const target = steps[index];
  const media = useMediaReady(true, [isVideo(target.media) ? { src: target.media.src, type: "video" } : target.media.src]);

  // shown = the step on screen; it follows a new index after the out-motion.
  const [shown, setShown] = useState(index);
  const [leaving, setLeaving] = useState(false);
  const [exiting, setExiting] = useState(false);
  const closing = closingProp ?? exiting;

  useEffect(() => {
    if (shown === index) {
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const t = window.setTimeout(() => {
      setShown(index);
      setLeaving(false);
    }, OUT_MS);
    return () => window.clearTimeout(t);
  }, [index, shown]);

  // The outgoing copy stays live through its out-motion; the incoming copy waits for its media.
  const live = shown !== index || media.ready;

  // Close button focus once the sheet is up, retried over its first frames; never steals focus
  // already in the dialog. A step swap that drops focus with the outgoing controls lands here too.
  // A page loaded on a step URL has had no input yet: programmatic focus would match `:focus-visible`
  // and keep Close ringed for the whole read, so the dialog itself (no outline) takes it; the first
  // Tab reaches the controls with their ring. Chrome ignores `focus({ focusVisible: false })`.
  useEffect(() => {
    if (closing) return;
    let frame = 0;
    let attempts = 0;
    const focusClose = () => {
      const coldLoad = typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === false;
      const target = coldLoad ? shellRef.current : closeRef.current;
      if (!target || shellRef.current?.contains(document.activeElement)) return;
      target.focus({ preventScroll: true });
      if (document.activeElement !== target && ++attempts < 20) frame = window.requestAnimationFrame(focusClose);
    };
    frame = window.requestAnimationFrame(focusClose);
    return () => window.cancelAnimationFrame(frame);
  }, [closing, shown, live]);

  const requestClose = useCallback(() => {
    if (closing) return;
    if (closingProp !== undefined) return onClose();
    setExiting(true);
    window.setTimeout(onClose, STEP_DOSSIER_EXIT_MS);
  }, [closing, closingProp, onClose]);

  const requestUp = () => {
    if (closing) return;
    if (onUp) onUp();
    else requestClose();
  };

  const openable = (i: number) => i >= 0 && i < n && (canOpen ? canOpen(i) : true);
  const neighbour = (from: number, dir: -1 | 1) => {
    for (let i = from + dir; i >= 0 && i < n; i += dir) if (openable(i)) return i;
    return undefined;
  };
  const go = (i: number | undefined) => {
    if (closing || i === undefined || i === index || !openable(i)) return;
    onIndexChange(i);
  };
  const linkOf = (i: number | undefined) => (i === undefined ? undefined : hrefFor?.(i));

  const trapTab = (e: KeyLike) => {
    const shell = shellRef.current;
    if (!shell) return;
    const list = Array.from(shell.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && el.offsetParent !== null && !el.closest("[inert]"));
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (!shell.contains(active) || active === shell) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onKey = (e: KeyLike) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      requestUp();
    } else if (e.key === "Tab") {
      trapTab(e);
    } else if (e.altKey || e.ctrlKey || e.metaKey) {
      // Alt+← is the browser's Back: history moves the view.
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(neighbour(index, 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(neighbour(index, -1));
    }
  };

  // Keys pressed while focus sits outside the dialog (dropped on body after Back / Forward).
  const keyRef = useRef(onKey);
  useEffect(() => {
    keyRef.current = onKey;
  });
  useEffect(() => {
    const onDocumentKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || rootRef.current?.contains(e.target as Node)) return;
      keyRef.current(e);
    };
    document.addEventListener("keydown", onDocumentKey);
    return () => document.removeEventListener("keydown", onDocumentKey);
  }, []);

  const step = steps[shown];
  const detail = step.detail;
  const prev = neighbour(shown, -1);
  const next = neighbour(shown, 1);
  const isLast = next === undefined;
  const prevHref = linkOf(prev);
  const nextHref = linkOf(next);
  const showLoader = hydrated && !live && (media.slow || media.failed);
  const markOn = attribution?.enabled !== false;
  const heldInert = hydrated && !live;

  const stage = (
    <div className="psd__stage" key={`stage-${shown}`}>
      <div className="psd__picture">
        {isVideo(step.media) ? <StageVideo media={step.media} /> : <img className="psd__img" src={step.media.src} alt={step.media.alt ?? ""} decoding="async" draggable={false} />}
      </div>
      <span className="psd__grade" aria-hidden="true" />
      {markOn && (
        <div className="psd__strip">
          <EvoviewMark label={copy.attributionLabel} href={attribution?.href} />
        </div>
      )}
      <div className="psd__stamp" aria-hidden="true">
        <span className="psd__numeral">{pad(shown + 1)}</span>
        <span className="ev-t-readout psd__label">{step.caption ?? step.title}</span>
      </div>
    </div>
  );

  const cellLabels = steps.map((s, i) => `${i + 1} ${s.title}`);
  const progress = (
    <div className="psd__progress psd-in" style={{ "--d": wide ? "150ms" : "220ms" } as CSSProperties}>
      <SegmentedProgress count={n} current={shown} label={copy.dossier.progress} labels={cellLabels} onSelect={go} canSelect={(i) => i !== shown && openable(i)} hrefFor={hrefFor} fill={1} className="psd__cells" />
      {wide ? <Index current={shown + 1} total={n} srLabel={copy.stepOf(shown + 1, n)} /> : <span className="ev-sr">{copy.stepOf(shown + 1, n)}</span>}
    </div>
  );

  let nextControl;
  if (isLast && cta) {
    const ctaHref = cta.href;
    const onCta = (e: MouseEvent<HTMLElement>) => {
      cta.onClick?.();
      if (ctaHref === undefined) return requestClose();
      // A same-page anchor closes the dossier first (its history entries go), then jumps.
      if (ctaHref.startsWith("#"))
        followRouteLink(e, () => {
          requestClose();
          window.setTimeout(() => window.location.assign(ctaHref), STEP_DOSSIER_EXIT_MS + 40);
        });
    };
    nextControl =
      ctaHref !== undefined ? (
        <PrimaryPlate href={ctaHref} block={!wide} onClick={onCta}>
          {cta.label}
        </PrimaryPlate>
      ) : (
        <PrimaryPlate block={!wide} onClick={onCta}>
          {cta.label}
        </PrimaryPlate>
      );
  } else if (nextHref !== undefined) {
    nextControl = (
      <PrimaryPlate href={nextHref} block={!wide} onClick={(e) => followRouteLink(e, () => go(next))}>
        {copy.dossier.next}
      </PrimaryPlate>
    );
  } else {
    nextControl = (
      <PrimaryPlate block={!wide} onClick={() => go(next)} disabled={isLast}>
        {copy.dossier.next}
      </PrimaryPlate>
    );
  }

  let prevControl;
  if (prevHref !== undefined) {
    prevControl = wide ? (
      <GhostAction icon={<ArrowLeft />} href={prevHref} onClick={(e) => followRouteLink(e, () => go(prev))}>
        {copy.dossier.previous}
      </GhostAction>
    ) : (
      <PagerOrb direction="prev" label={copy.dossier.previous} href={prevHref} onClick={(e) => followRouteLink(e, () => go(prev))} />
    );
  } else {
    prevControl = wide ? (
      <GhostAction icon={<ArrowLeft />} onClick={() => go(prev)} disabled={prev === undefined}>
        {copy.dossier.previous}
      </GhostAction>
    ) : (
      <PagerOrb direction="prev" label={copy.dossier.previous} onClick={() => go(prev)} disabled={prev === undefined} />
    );
  }

  return (
    <div ref={rootRef} className={cn("ev-root psd", closing && "psd--closing")} data-ev-modal="" data-ev-route-layer="" onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => onKey(e)}>
      <div className="psd__backdrop" onClick={requestUp} aria-hidden="true" />
      <div
        ref={shellRef}
        className={cn("psd__shell", tone === "light" ? "ev-tone-paper" : "ev-tone-dark")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-ready={shown === index && live ? "" : undefined}
        data-leaving={leaving || undefined}
      >
        {wide && (
          <div className="psd__stage-wrap" inert={heldInert}>
            <HeldCopy live={live}>{stage}</HeldCopy>
          </div>
        )}

        <div className="psd__sheet">
          <div className="psd__top">
            {!wide && (
              <HeldCopy live={live}>
                <div className="psd__where psd-in" style={{ "--d": "80ms" } as CSSProperties} key={`where-${shown}`}>
                  <span className="psd__where-num">{pad(shown + 1)}</span>
                  <span className="psd__where-title">{step.title}</span>
                </div>
              </HeldCopy>
            )}
            <GlassClose ref={closeRef} label={copy.dossier.close} onClick={requestClose} className="psd__close" />
          </div>

          <div className="psd__scroll" inert={heldInert}>
            <HeldCopy live={live}>
              <div className="psd__content" key={`content-${shown}`}>
                {!wide && <div className="psd__well psd-in" style={{ "--d": "140ms" } as CSSProperties}>{stage}</div>}
                {!wide && progress}
                <h1 id={titleId} className="ev-t-heading psd__heading psd-in psd-in--wipe" style={{ "--d": wide ? "100ms" : "280ms" } as CSSProperties}>
                  {headingLines(step).map((line, i) => (
                    // The space keeps the lines apart in text extraction; at the start of a block line it is not rendered.
                    <span key={line}>
                      {i > 0 && " "}
                      {line}
                    </span>
                  ))}
                </h1>
                {wide && progress}
                <p className="ev-t-body psd__intro psd-in" style={{ "--d": wide ? "200ms" : "360ms" } as CSSProperties}>
                  {detail?.intro ?? step.summary}
                </p>
                {detail && detail.items.length > 0 && (
                  <ol className="psd__items">
                    {detail.items.map((item, i) => (
                      <li key={item} className="psd-in psd-in--side" style={{ "--d": `${(wide ? 260 : 440) + i * (wide ? 40 : 60)}ms` } as CSSProperties}>
                        <span className="psd__chip">{i + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {detail?.objective && (
                  <div className="psd__objective psd-in" style={{ "--d": `${(wide ? 300 : 460) + detail.items.length * (wide ? 40 : 60)}ms` } as CSSProperties}>
                    <h2 className="ev-t-card psd__objective-h">{copy.dossier.objective}</h2>
                    <p className="ev-t-body">{detail.objective}</p>
                  </div>
                )}
              </div>
            </HeldCopy>
          </div>

          <HeldCopy live={live}>
            <div className="psd__foot psd-in" style={{ "--d": wide ? "300ms" : "700ms" } as CSSProperties} key={`foot-${shown}`} inert={heldInert}>
              {prevControl}
              {nextControl}
            </div>
          </HeldCopy>
        </div>

        {showLoader && (
          <div className="psd__loader" role="status" aria-live="polite">
            <span className="psd__spinner" aria-hidden="true" data-failed={media.failed || undefined} />
            <span className="ev-t-readout">{media.failed ? copy.dossier.failed : copy.dossier.loading}</span>
            {media.failed && (
              <button type="button" className="ev-t-readout psd__retry" data-ev-jelly="" onClick={media.retry}>
                {copy.dossier.retry}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Stage video: no source until the held copy goes live (server HTML carries the poster only). */
function StageVideo({ media }: { media: StepMedia }) {
  const src = useHeldSrc(media.src);
  return <video className="psd__img" src={src} poster={media.poster} muted loop playsInline autoPlay aria-hidden="true" />;
}
