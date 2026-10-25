import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn, followRouteLink, pad, sequenceFillStyle, useHydrated, type SequenceClock } from "../foundation";
import { isVideo } from "./media";
import type { CompletionMark, ProcessStep, StepState } from "./types";

export { isVideo };

type ClockLike = Pick<SequenceClock, "duration" | "elapsed" | "running" | "done">;

type StepCardProps = {
  step: ProcessStep;
  index: number;
  state: StepState;
  /** Charge of the ribbon progress + media drift while active. */
  clock: ClockLike;
  /** Key of the active run (restarts the fill animation). */
  runKey: string;
  mark: CompletionMark;
  /** Spoken state ("En cours", …); the card shows state through its frame only. */
  statusLabel: string;
  /** Spoken "Étape 2 sur 4". */
  stepOf: string;
  /** Loader text while the active media decodes (null = ready). */
  loading?: string | null;
  /** Makes the card a button (a link with `href`); receives the card element. */
  onOpen?: (card: HTMLElement) => void;
  /** URL of the step's dossier view: the card renders as `<a href>`, a plain click runs `onOpen`. */
  href?: string;
  openHint?: string;
  /** Hidden duplicate used only to reserve height (phone monitor). */
  ghost?: boolean;
};

export function StepCard({ step, index, state, clock, runKey, mark, statusLabel, stepOf, loading, onOpen, href, openHint, ghost }: StepCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hydrated = useHydrated();
  const video = isVideo(step.media);
  const live = state === "active" && clock.running && !ghost;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (live) v.play().catch(() => undefined);
    else v.pause();
  }, [live]);

  // Idle cards rewind well after the wrap, out of the choreography frames.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || state !== "idle") return;
    const t = window.setTimeout(() => {
      v.currentTime = 0;
    }, 1200);
    return () => window.clearTimeout(t);
  }, [state]);

  const fill = state === "active" ? sequenceFillStyle(clock) : undefined;
  const open = ghost ? undefined : onOpen;
  const interactive = !!open;
  const name = `${pad(index + 1)} ${step.title} · ${statusLabel}`;

  const shared = {
    className: cn("ps-card", interactive && "ps-card--interactive"),
    "data-state": state,
    "aria-label": interactive ? `${name} — ${openHint}` : name,
    "aria-current": state === "active" ? ("step" as const) : undefined,
    "aria-hidden": ghost || undefined,
  };

  const inner = (
    <div className="ps-card__inner">
        <div className="ps-card__media">
          <div className="ps-card__picture">
            {video ? (
              <video
                ref={videoRef}
                className="ps-card__img"
                src={hydrated ? step.media.src : undefined}
                poster={step.media.poster}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                style={fill}
              />
            ) : (
              <img key={state === "active" ? runKey : "still"} className="ps-card__img" src={step.media.src} alt={step.media.alt ?? ""} decoding="async" draggable={false} style={fill} />
            )}
          </div>
          <span className="ps-card__veil" aria-hidden="true" />
          <span className="ev-t-readout-lg ps-card__pending" aria-hidden="true">
            {pad(index + 1)}
          </span>
          {state === "active" && loading && (
            <span className="ev-t-readout ps-card__loader" role="status">
              {loading}
            </span>
          )}
          {state === "complete" && !ghost && <Mark kind={mark} step={step} index={index} />}
        </div>
        <div className="ps-card__collapse">
          <div className="ps-card__clip">
            <div className="ps-card__band">
              <span className="ps-card__ribbon" aria-hidden="true" />
              <h3 className="ev-t-card ps-card__title">
                <span className="ps-card__type">{step.title}</span>
              </h3>
              <span className="ps-card__progress" aria-hidden="true">
                <span key={runKey} className="ps-card__fill" style={fill} />
              </span>
              <p className="ps-card__desc">{step.summary}</p>
              <span className="ev-sr">{stepOf}</span>
            </div>
          </div>
        </div>
    </div>
  );

  if (open && href !== undefined) {
    // Enter follows the link natively (modified Enter / click: new tab); Space keeps the button parity.
    const onLinkKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
      if (e.key !== " ") return;
      e.preventDefault();
      open(e.currentTarget);
    };
    return (
      <a {...shared} href={href} onClick={(e) => followRouteLink(e, () => open(e.currentTarget))} onKeyDown={onLinkKeyDown}>
        {inner}
      </a>
    );
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open?.(e.currentTarget);
    }
  };
  return (
    <div
      {...shared}
      role={interactive ? "button" : "group"}
      tabIndex={interactive ? 0 : undefined}
      onClick={open ? (e) => open(e.currentTarget) : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
    >
      {inner}
    </div>
  );
}

function Mark({ kind, step, index }: { kind: CompletionMark; step: ProcessStep; index: number }) {
  let inner: ReactNode;
  if (kind === "icon" && step.mark) inner = <span className="ps-mark__icon">{step.mark}</span>;
  else if (kind === "numeral") inner = <span className="ps-mark__numeral">{pad(index + 1)}</span>;
  else
    inner = (
      <svg className="ps-mark__check" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 12.5 10.2 16.5 18 8" pathLength={1} />
      </svg>
    );
  return (
    <span className="ps-mark" aria-hidden="true">
      <svg className="ps-mark__ring" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" pathLength={1} />
      </svg>
      {inner}
    </span>
  );
}
