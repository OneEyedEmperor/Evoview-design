import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { SegmentedProgress } from "../controls";
import { Check, cn, pad, SectionMarker, TextFill, useInViewPause, useMediaReady, useSequenceClock } from "../foundation";
import { StepCard, isVideo } from "./StepCard";
import { StepDossier } from "./StepDossier";
import type { ProcessSequenceConfig, ProcessStep, StepState } from "./types";

export type ProcessSequenceProps = {
  config: ProcessSequenceConfig;
  /** Chapter environment. The active ribbon always inverts it (paper on dark, ink on light). */
  tone?: "dark" | "light";
  /** Timed playback. Off = a still board driven only by clicks. */
  autoplay?: boolean;
  /** Custom open handler; replaces the built-in dossier. */
  onOpen?: (step: ProcessStep, index: number) => void;
  /** Built-in `StepDossier` for steps that carry `detail`. Default true. */
  dossier?: boolean;
  /** Chapter padding (cinematic rhythm). Off when the host section already pads. */
  chapter?: boolean;
  id?: string;
  className?: string;
};

const DRAIN_MS = 420;
const DEFAULT_DWELL = 4000;
const DEFAULT_LAST = 6000;

const mq = "(min-width: 768px)";
const subscribeWide = (cb: () => void) => {
  const m = window.matchMedia(mq);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const getWide = () => window.matchMedia(mq).matches;

export function ProcessSequence({ config, tone = "dark", autoplay = true, onOpen, dossier = true, chapter = true, id, className }: ProcessSequenceProps) {
  const { steps, copy } = config;
  const n = steps.length;
  const headingId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLOListElement>(null);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);

  const durationOf = useCallback(
    (i: number) => {
      const d = config.durations;
      return steps[i]?.durationMs ?? (d && d.length === n ? d[i] : i === n - 1 ? DEFAULT_LAST : DEFAULT_DWELL);
    },
    [config.durations, steps, n],
  );

  // Phase 0…n-1 = active step; n = the neutral drain at the cycle boundary.
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const draining = phase >= n;
  const activeIndex = Math.min(phase, n - 1);

  const revealed = useReveal(rootRef);
  const pause = useInViewPause(rootRef, { threshold: 0.12, enabled: revealed && autoplay });
  const activeStep = steps[activeIndex];
  const media = useMediaReady(revealed, [isVideo(activeStep.media) ? { src: activeStep.media.src, type: "video" } : activeStep.media.src]);

  const advance = useCallback(() => {
    if (phase >= n) {
      setCycle((c) => c + 1);
      setPhase(0);
    } else setPhase(phase + 1);
  }, [phase, n]);

  const clock = useSequenceClock(`${cycle}:${phase}`, pause.active && (draining || media.ready), draining ? DRAIN_MS : durationOf(phase), advance);
  const frozen = { duration: durationOf(n - 1), elapsed: durationOf(n - 1), running: false, done: true };
  const cardClock = draining ? frozen : clock;
  const runKey = `${cycle}:${activeIndex}`;

  const jump = (i: number) => {
    if (i === phase) return;
    setCycle((c) => c + 1);
    setPhase(i);
  };

  const stateOf = (i: number): StepState => (draining ? (i === n - 1 ? "active" : "complete") : i < phase ? "complete" : i === phase ? "active" : "idle");
  const completedBefore = (i: number) => i < Math.min(phase, n);

  // Dossier
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const launcher = useRef<HTMLElement | null>(null);
  const openable = (s: ProcessStep) => !!onOpen || (dossier && !!s.detail);
  const open = (i: number) => {
    if (onOpen) return onOpen(steps[i], i);
    launcher.current = document.activeElement as HTMLElement | null;
    setOpenIndex(i);
  };
  const close = () => {
    setOpenIndex(null);
    window.requestAnimationFrame(() => launcher.current?.focus({ preventScroll: true }));
  };

  useZStack(gridRef, n, wide);

  const card = (s: ProcessStep, i: number, ghost = false) => (
    <StepCard
      step={s}
      index={i}
      state={ghost ? "idle" : stateOf(i)}
      clock={cardClock}
      runKey={runKey}
      mark={config.completionMark ?? "check"}
      statusLabel={copy.status[stateOf(i)]}
      stepOf={copy.stepOf(i + 1, n)}
      loading={i === activeIndex && media.slow ? (media.failed ? copy.dossier.failed : copy.dossier.loading) : null}
      onOpen={openable(s) ? () => open(i) : undefined}
      openHint={copy.openHint}
      ghost={ghost}
    />
  );

  const captions = steps.map((s) => s.caption ?? s.title);

  return (
    <section
      ref={rootRef}
      id={id}
      className={cn("ev-root ev-process", tone === "light" ? "ev-tone-light" : "ev-tone-dark", chapter && "ev-chapter ev-chapter--cinematic", className)}
      aria-labelledby={headingId}
      data-revealed={revealed || undefined}
      data-ev-paused={!pause.active || undefined}
      style={{ "--ps-n": n } as CSSProperties}
    >
      <span className="ps-field" aria-hidden="true" />
      <div className="ev-rail ev-rail--wide ps-rail">
        <header className="ps-head">
          <div className="ps-head__title">
            {copy.kicker && <span className="ev-t-readout ps-head__kicker">{copy.kicker}</span>}
            <h2 id={headingId} className="ev-t-section ps-head__h">
              <SectionMarker live={pause.active} />
              <span>{copy.title}</span>
            </h2>
          </div>
          {wide && (
            <div className="ps-instrument" data-draining={draining || undefined}>
              <ol className="ps-captions" aria-hidden="true">
                {captions.map((c, i) => (
                  <li key={i} className="ev-t-readout" data-on={completedBefore(i) || undefined}>
                    <span>{c}</span>
                  </li>
                ))}
              </ol>
              <SegmentedProgress
                count={n}
                current={phase}
                label={copy.instrumentLabel}
                labels={steps.map((s, i) => `${pad(i + 1)} ${s.title}`)}
                size="lg"
                clock={draining ? undefined : clock}
                fill={draining ? 1 : undefined}
                onSelect={jump}
              />
            </div>
          )}
        </header>

        {wide ? (
          <ol ref={gridRef} className="ps-grid">
            {steps.map((s, i) => (
              <li key={s.id} className="ps-slot" data-col={i % 2}>
                <div className="ps-reveal" style={{ "--ps-i": i } as CSSProperties}>
                  {card(s, i)}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="ps-phone">
            <ol className="ps-index" aria-label={copy.instrumentLabel}>
              {steps.map((s, i) => {
                const st = stateOf(i);
                return (
                  <li key={s.id}>
                    <button type="button" className="ps-index__btn" data-state={st} aria-current={st === "active" ? "step" : undefined} onClick={() => jump(i)}>
                      <span className="ps-index__num">
                        {/* The index's state ink rises in (RULES §1). */}
                        <TextFill ink={st === "active" ? "var(--ps-ribbon-fill)" : st === "complete" ? "var(--process-signal)" : undefined}>{pad(i + 1)}</TextFill>
                      </span>
                      <span className="ps-index__title">{s.title}</span>
                      {st === "complete" && <Check className="ps-index__check" />}
                      <span className="ev-sr">{copy.status[st]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="ps-monitor ps-reveal" style={{ "--ps-i": 1 } as CSSProperties} aria-live="off">
              {steps.map((s, i) => (
                <div key={s.id} className="ps-monitor__slot" data-shown={i === activeIndex || undefined}>
                  {i === activeIndex ? card(s, i) : card(s, i, true)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {openIndex !== null && (
        <StepDossier
          steps={steps}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={close}
          copy={copy}
          cta={config.cta}
          attribution={config.attribution}
          tone={tone}
        />
      )}
    </section>
  );
}

/** One-shot reveal when the section meaningfully enters the viewport. */
function useReveal(ref: RefObject<Element | null>) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;
    if (typeof IntersectionObserver === "undefined") return setRevealed(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setRevealed(true), { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, revealed]);
  return revealed;
}

/**
 * Two independent column stacks in Z order (DOM order stays 1, 2, 3, 4 for
 * keyboard and screen readers). Slots are positioned from their measured
 * heights; the grid reserves the tallest state (every card expanded) so the
 * chapter never resizes during the cycle.
 */
function useZStack(ref: RefObject<HTMLElement | null>, count: number, enabled: boolean) {
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid || !enabled || typeof ResizeObserver === "undefined") return;
    const slots = Array.from(grid.children) as HTMLElement[];
    const layout = () => {
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
      const live = [0, 0];
      const full = [0, 0];
      slots.forEach((slot, i) => {
        const c = i % 2;
        const h = slot.offsetHeight;
        const collapse = slot.querySelector<HTMLElement>(".ps-card__collapse");
        const band = slot.querySelector<HTMLElement>(".ps-card__band");
        const expanded = collapse && band ? h - collapse.offsetHeight + band.offsetHeight : h;
        slot.style.transform = `translate3d(0, ${live[c]}px, 0)`;
        live[c] += h + gap;
        full[c] += expanded + gap;
      });
      grid.style.height = `${Math.max(0, Math.max(full[0], full[1]) - gap)}px`;
    };
    const ro = new ResizeObserver(layout);
    ro.observe(grid);
    slots.forEach((slot) => {
      ro.observe(slot);
      const band = slot.querySelector(".ps-card__band");
      if (band) ro.observe(band);
    });
    layout();
    return () => ro.disconnect();
  }, [ref, count, enabled]);
}
