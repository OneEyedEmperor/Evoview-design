import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { GhostAction, GlassClose, PagerOrb, PrimaryPlate, SegmentedProgress } from "../controls";
import { ArrowLeft, cn, EvoviewMark, Index, pad, useMediaReady, useSuspendBackground } from "../foundation";
import { isVideo } from "./StepCard";
import type { ProcessSequenceConfig, ProcessSequenceCopy, ProcessStep } from "./types";

export type StepDossierProps = {
  steps: ProcessStep[];
  /** Requested step (0-based). The view follows once its media is ready. */
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  copy: ProcessSequenceCopy;
  /** Replaces "next" on the last step. */
  cta?: ProcessSequenceConfig["cta"];
  attribution?: ProcessSequenceConfig["attribution"];
  /** Sheet tone; the stage stays dark. */
  tone?: "dark" | "light";
};

const OUT_MS = 180;
const EXIT_MS = 320;
const mq = "(min-width: 768px)";
const subscribeWide = (cb: () => void) => {
  const m = window.matchMedia(mq);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const getWide = () => window.matchMedia(mq).matches;

/**
 * Split modal for one step: stage 5/12 (media, numeral, approved Evoview mark)
 * and sheet 7/12 (heading, progress, intro, numbered items, objective,
 * prev / next). Phone: full sheet with sticky header and footer. Media-gated,
 * ←/→ / Esc, focus contained and restored by the host, page suspended while open.
 */
export function StepDossier({ steps, index, onIndexChange, onClose, copy, cta, attribution, tone = "dark" }: StepDossierProps) {
  const n = steps.length;
  const titleId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);
  useSuspendBackground(true);

  const target = steps[index];
  const media = useMediaReady(true, [isVideo(target.media) ? { src: target.media.src, type: "video" } : target.media.src]);

  // shown = the step on screen; it changes after the out-motion and once the next media is ready.
  const [shown, setShown] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (shown === index) return;
    if (shown === null) {
      if (media.ready) setShown(index);
      return;
    }
    setLeaving(true);
    const t = window.setTimeout(() => setLeaving(false), OUT_MS);
    return () => window.clearTimeout(t);
  }, [index, shown, media.ready]);

  useEffect(() => {
    if (shown !== null && shown !== index && !leaving && media.ready) setShown(index);
  }, [shown, index, leaving, media.ready]);

  // Scroll lock + initial focus.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    shellRef.current?.querySelector<HTMLElement>(".psd__close")?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, EXIT_MS);
  }, [closing, onClose]);

  const go = (i: number) => {
    if (i >= 0 && i < n && i !== index) onIndexChange(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      requestClose();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "Tab") {
      const nodes = shellRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])');
      if (!nodes || nodes.length === 0) return;
      const list = Array.from(nodes).filter((el) => el.offsetParent !== null);
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const step = shown === null ? null : steps[shown];
  const detail = step?.detail;
  const isLast = shown === n - 1;
  const showLoader = media.slow && (shown === null || shown !== index);
  const markOn = attribution?.enabled !== false;

  const stage = step && (
    <div className="psd__stage" key={`stage-${shown}`}>
      <div className="psd__picture">
        {isVideo(step.media) ? (
          <video className="psd__img" src={step.media.src} poster={step.media.poster} muted loop playsInline autoPlay aria-hidden="true" />
        ) : (
          <img className="psd__img" src={step.media.src} alt={step.media.alt ?? ""} decoding="async" draggable={false} />
        )}
      </div>
      <span className="psd__grade" aria-hidden="true" />
      {markOn && (
        <div className="psd__strip">
          <EvoviewMark label={copy.attributionLabel} href={attribution?.href} />
        </div>
      )}
      <div className="psd__stamp" aria-hidden="true">
        <span className="psd__numeral">{pad((shown ?? 0) + 1)}</span>
        <span className="ev-t-readout psd__label">{step.caption ?? step.title}</span>
      </div>
    </div>
  );

  const progress = step && (
    <div className="psd__progress psd-in" style={{ "--d": wide ? "150ms" : "220ms" } as CSSProperties}>
      <SegmentedProgress count={n} current={shown ?? 0} label={copy.dossier.progress} labels={steps.map((s, i) => `${pad(i + 1)} ${s.title}`)} onSelect={go} fill={1} className="psd__cells" />
      <Index current={(shown ?? 0) + 1} total={n} srLabel={copy.stepOf((shown ?? 0) + 1, n)} />
    </div>
  );

  const next = isLast && cta ? (
    cta.href ? (
      <PrimaryPlate href={cta.href} block={!wide} onClick={() => { cta.onClick?.(); requestClose(); }}>
        {cta.label}
      </PrimaryPlate>
    ) : (
      <PrimaryPlate block={!wide} onClick={() => { cta.onClick?.(); requestClose(); }}>
        {cta.label}
      </PrimaryPlate>
    )
  ) : (
    <PrimaryPlate block={!wide} onClick={() => go((shown ?? 0) + 1)} disabled={isLast}>
      {copy.dossier.next}
    </PrimaryPlate>
  );

  return (
    <div className={cn("ev-root psd", closing && "psd--closing")} data-ev-modal="" onKeyDown={onKeyDown}>
      <div className="psd__backdrop" onClick={requestClose} aria-hidden="true" />
      <div
        ref={shellRef}
        className={cn("psd__shell", tone === "light" ? "ev-tone-paper" : "ev-tone-dark")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={step ? titleId : undefined}
        aria-label={step ? undefined : copy.dossier.label}
        data-ready={step ? "" : undefined}
        data-leaving={leaving || undefined}
      >
        {wide && <div className="psd__stage-wrap">{stage}</div>}

        <div className="psd__sheet">
          <div className="psd__top">
            {!wide && step && (
              <div className="psd__where psd-in" style={{ "--d": "80ms" } as CSSProperties} key={`where-${shown}`}>
                <span className="psd__where-num">{pad((shown ?? 0) + 1)}</span>
                <span className="psd__where-text">
                  <span className="ev-t-readout">{copy.stepOf((shown ?? 0) + 1, n)}</span>
                  <span className="psd__where-title">{step.title}</span>
                </span>
              </div>
            )}
            <GlassClose label={copy.dossier.close} onClick={requestClose} className="psd__close" />
          </div>

          <div className="psd__scroll">
            {step && (
              <div className="psd__content" key={`content-${shown}`}>
                {!wide && <div className="psd__well psd-in" style={{ "--d": "140ms" } as CSSProperties}>{stage}</div>}
                {wide && <span className="ev-t-readout psd__kicker psd-in" style={{ "--d": "100ms" } as CSSProperties}>{copy.stepOf((shown ?? 0) + 1, n)}</span>}
                {!wide && progress}
                <h2 id={titleId} className="ev-t-heading psd__heading psd-in psd-in--wipe" style={{ "--d": wide ? "100ms" : "280ms" } as CSSProperties}>
                  {(detail?.heading ?? [step.title]).map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h2>
                {wide && progress}
                <p className="ev-t-body psd__intro psd-in" style={{ "--d": wide ? "200ms" : "360ms" } as CSSProperties}>
                  {detail?.intro ?? step.summary}
                </p>
                {detail && detail.items.length > 0 && (
                  <ol className="psd__items">
                    {detail.items.map((item, i) => (
                      <li key={item} className="psd-in psd-in--side" style={{ "--d": `${(wide ? 260 : 440) + i * (wide ? 40 : 60)}ms` } as CSSProperties}>
                        <span className="psd__chip">{pad(i + 1)}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {detail?.objective && (
                  <div className="psd__objective psd-in" style={{ "--d": `${(wide ? 300 : 460) + detail.items.length * (wide ? 40 : 60)}ms` } as CSSProperties}>
                    <span className="ev-t-readout">{copy.dossier.objective}</span>
                    <p className="ev-t-body">{detail.objective}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {step && (
            <div className="psd__foot psd-in" style={{ "--d": wide ? "300ms" : "700ms" } as CSSProperties} key={`foot-${shown}`}>
              {wide ? (
                <GhostAction icon={<ArrowLeft />} onClick={() => go((shown ?? 0) - 1)} disabled={shown === 0}>
                  {copy.dossier.previous}
                </GhostAction>
              ) : (
                <PagerOrb direction="prev" label={copy.dossier.previous} onClick={() => go((shown ?? 0) - 1)} disabled={shown === 0} />
              )}
              {next}
            </div>
          )}
        </div>

        {(showLoader || media.failed) && (
          <div className="psd__loader" role="status" aria-live="polite">
            <span className="psd__spinner" aria-hidden="true" data-failed={media.failed || undefined} />
            <span className="ev-t-readout">{media.failed ? copy.dossier.failed : copy.dossier.loading}</span>
            {media.failed && (
              <button type="button" className="ev-t-readout psd__retry" onClick={media.retry}>
                {copy.dossier.retry}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
