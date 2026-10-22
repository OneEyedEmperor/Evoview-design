import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn, pad, sequenceFillStyle, type SequenceClock } from "../foundation";
import type { CompletionMark, ProcessStep, StepMedia, StepState } from "./types";

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
export const isVideo = (m: StepMedia) => (m.type ? m.type === "video" : VIDEO_RE.test(m.src));

type ClockLike = Pick<SequenceClock, "duration" | "elapsed" | "running" | "done">;

type StepCardProps = {
  step: ProcessStep;
  index: number;
  total: number;
  state: StepState;
  /** Charge of the ribbon progress + media drift while active. */
  clock: ClockLike;
  /** Key of the active run (restarts the fill animation). */
  runKey: string;
  mark: CompletionMark;
  statusLabels: { idle: string; active: string; complete: string };
  /** Spoken "Étape 2 sur 4". */
  stepOf: string;
  /** Loader text while the active media decodes (null = ready). */
  loading?: string | null;
  /** Makes the card a button. */
  onOpen?: () => void;
  openHint?: string;
  /** Hidden duplicate used only to reserve height (phone monitor). */
  ghost?: boolean;
  /** Queue position of the completion shine (consecutive cards 600ms apart). */
  shineDelay?: number;
};

export function StepCard({ step, index, total, state, clock, runKey, mark, statusLabels, stepOf, loading, onOpen, openHint, ghost, shineDelay = 0 }: StepCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const video = isVideo(step.media);
  const live = state === "active" && clock.running && !ghost;
  const status = statusLabels[state];

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
  const interactive = !!onOpen && !ghost;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.();
    }
  };
  // Fine-pointer tilt; never changes the phase or the clock.
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ps-ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty("--ps-rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
    el.style.setProperty("--ps-px", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--ps-py", `${(y * 100).toFixed(1)}%`);
  };
  const onPointerLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--ps-ry", "0deg");
    el.style.setProperty("--ps-rx", "0deg");
  };

  const name = `${pad(index + 1)} ${step.title} · ${status}`;

  return (
    <div
      ref={cardRef}
      className={cn("ps-card", interactive && "ps-card--interactive")}
      data-state={state}
      role={interactive ? "button" : "group"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${name} — ${openHint}` : name}
      aria-current={state === "active" ? "step" : undefined}
      aria-hidden={ghost || undefined}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerLeave={interactive ? onPointerLeave : undefined}
    >
      <div className="ps-card__inner">
        <div className="ps-card__media">
          <div className="ps-card__picture">
            {video ? (
              <video
                ref={videoRef}
                className="ps-card__img"
                src={step.media.src}
                poster={step.media.poster}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                style={state === "active" ? fill : undefined}
              />
            ) : (
              <img key={state === "active" ? runKey : "still"} className="ps-card__img" src={step.media.src} alt={step.media.alt ?? ""} decoding="async" draggable={false} style={state === "active" ? fill : undefined} />
            )}
          </div>
          <span className="ps-card__veil" aria-hidden="true" />
          <span className="ps-card__glow" aria-hidden="true" />
          <span className="ev-t-readout ps-card__corner" aria-hidden="true">
            {pad(index + 1)} / {pad(total)}
          </span>
          <span className="ps-card__pending" aria-hidden="true">
            <span className="ev-t-readout-lg">{pad(index + 1)}</span>
            <span className="ev-t-readout">{statusLabels.idle}</span>
          </span>
          {state === "active" && loading && (
            <span className="ev-t-readout ps-card__loader" role="status">
              {loading}
            </span>
          )}
          {state === "complete" && !ghost && (
            <>
              <Mark kind={mark} step={step} index={index} />
              <span className="ps-card__shine" aria-hidden="true" style={{ "--ps-shine-delay": `${350 + shineDelay}ms` } as CSSProperties} />
            </>
          )}
        </div>
        <div className="ps-card__collapse">
          <div className="ps-card__clip">
            <div className="ps-card__band">
              <span className="ps-card__ribbon" aria-hidden="true" />
              <div className="ps-card__head">
                <h3 className="ev-t-card ps-card__title">
                  <span className="ps-card__type">{step.title}</span>
                </h3>
                <span className="ev-t-readout ps-card__status" aria-hidden={state !== "active" || undefined}>
                  {statusLabels.active}
                  <span className="ps-card__dots ev-ambient" />
                </span>
              </div>
              <span className="ps-card__progress" aria-hidden="true">
                <span key={runKey} className="ps-card__fill" style={fill} />
              </span>
              <p className="ps-card__desc">
                <span className="ps-card__text">{step.summary}</span>
                <span className="ps-card__dash" aria-hidden="true">
                  —
                </span>
              </p>
              <span className="ev-sr">{stepOf}</span>
            </div>
          </div>
        </div>
      </div>
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
    <span className="ps-mark" data-kind={kind === "icon" && !step.mark ? "check" : kind} aria-hidden="true">
      <svg className="ps-mark__ring" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" pathLength={1} />
      </svg>
      {inner}
    </span>
  );
}
