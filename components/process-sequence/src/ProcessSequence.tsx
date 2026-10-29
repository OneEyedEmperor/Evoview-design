import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { SegmentedProgress } from "../controls";
import { Check, cn, pad, restoreFocus, TextFill, useInViewPause, useMediaQuery, useMediaReady, useRouteHistory, useSequenceClock, type RouteViewProps } from "../foundation";
import { isVideo } from "./media";
import { processSequenceRoutes } from "./routes";
import { StepCard } from "./StepCard";
import { STEP_DOSSIER_EXIT_MS, StepDossier } from "./StepDossier";
import type { ProcessSequenceConfig, ProcessSequenceView, ProcessStep, StepState } from "./types";

/**
 * Crawlable views (docs/CRAWLABLE-MODALS.md): pass `view` / `onNavigate` /
 * `hrefFor` to control the step dossier from the URL. With `view` undefined
 * the board keeps the dossier state itself (with `hrefFor`, still with URLs).
 */
export type ProcessSequenceProps = Partial<RouteViewProps<ProcessSequenceView>> & {
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

export function ProcessSequence({
  config,
  tone = "dark",
  autoplay = true,
  onOpen,
  dossier = true,
  chapter = true,
  id,
  className,
  view,
  onNavigate,
  hrefFor,
  history = true,
}: ProcessSequenceProps) {
  const { steps, copy } = config;
  const n = steps.length;
  const headingId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLOListElement>(null);
  const wide = useMediaQuery(mq, true);

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

  // Dossier: the host's `view` when controlled, else our own.
  const builtIn = dossier && !onOpen;
  const [ownView, setOwnView] = useState<ProcessSequenceView | null>(null);
  const controlled = view !== undefined;
  const current = builtIn ? (controlled ? view : ownView) : null;
  const navigate = useCallback(
    (next: ProcessSequenceView | null) => {
      if (!controlled) setOwnView(next);
      onNavigate?.(next);
    },
    [controlled, onNavigate],
  );
  useRouteHistory({ view: current, routes: processSequenceRoutes, hrefFor, onNavigate: navigate, history });

  const openAt = current ? steps.findIndex((s) => s.id === current.step && !!s.detail) : -1;
  const openIndex = openAt >= 0 ? openAt : null;
  // Kept through the exit, on the step it closed on.
  const [mountedIndex, setMountedIndex] = useState(openIndex);
  if (openIndex !== null && openIndex !== mountedIndex) setMountedIndex(openIndex);

  const launcher = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (openIndex !== null || mountedIndex === null) return;
    const t = window.setTimeout(() => {
      setMountedIndex(null);
      const el = launcher.current;
      launcher.current = null;
      if (el) window.requestAnimationFrame(() => restoreFocus(el));
    }, STEP_DOSSIER_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [openIndex, mountedIndex]);

  const openable = (s: ProcessStep) => !!onOpen || (dossier && !!s.detail);
  const viewHref = (s: ProcessStep) => (builtIn && s.detail && hrefFor ? hrefFor({ step: s.id }) : undefined);
  const open = (i: number, card: HTMLElement) => {
    if (onOpen) return onOpen(steps[i], i);
    launcher.current = card;
    navigate({ step: steps[i].id });
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
      onOpen={openable(s) ? (el) => open(i, el) : undefined}
      href={ghost ? undefined : viewHref(s)}
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
            <h2 id={headingId} className="ev-t-section ps-head__h">
              {copy.title}
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

      {mountedIndex !== null && (
        <StepDossier
          steps={steps}
          index={openIndex ?? mountedIndex}
          onIndexChange={(i) => navigate({ step: steps[i].id })}
          onClose={() => navigate(null)}
          onUp={() => navigate(current ? processSequenceRoutes.parent(current) : null)}
          closing={openIndex === null}
          canOpen={(i) => !!steps[i].detail}
          hrefFor={hrefFor ? (i) => hrefFor({ step: steps[i].id }) : undefined}
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
