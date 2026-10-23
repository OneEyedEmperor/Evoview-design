import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Index, cn, useInViewPause, useMediaQuery } from "../foundation";
import { MediaCard } from "./MediaCard";
import type { CardTrackCopy, CardTrackDefinition, CardTrackItem } from "./types";

/** scrub: sticky, vertical scroll drives the track · snap: native horizontal scroll · static: everything fits. */
export type CardTrackMode = "scrub" | "snap" | "static";

export type CardTrackProps = {
  track: CardTrackDefinition;
  copy: CardTrackCopy;
  /** Chapter heading, rendered inside the sticky stage above the progress hairline. */
  heading?: ReactNode;
  /** Paints the chapter. Omit to inherit the host's tone. */
  tone?: "dark" | "light" | "paper";
  /** Block padding of the stage (foundation chapter rhythm). Default "standard". */
  rhythm?: "standard" | "compact" | "cinematic";
  /** Card activation (open a dossier, navigate…). Without it cards are not buttons. */
  onOpen?: (item: CardTrackItem, index: number) => void;
  /** Scrub length (wrapper height). Default `calc(100vh + n × 35vh)` — 240vh for four cards. */
  length?: string;
  id?: string;
  className?: string;
};

const PHONE_QUERY = "(max-width: 767px)";
const FINE_QUERY = "(hover: hover) and (pointer: fine)";
/* Lerp toward the scroll target: .25 per 60 Hz frame (measured on the source),
   applied per elapsed time so slow or fast frames land on the same mapping. */
const LERP = 0.25;
const FRAME_MS = 1000 / 60;
/* A keyboard move scrolls smoothly; presses during that scroll chain from its target. */
const PENDING_MS = 1200;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function CardTrack({ track, copy, heading, tone, rhythm = "standard", onOpen, length, id, className }: CardTrackProps) {
  const { items, variant, ribbon = "light", showIndex = false } = track;
  const n = items.length;
  const phone = useMediaQuery(PHONE_QUERY);
  const fine = useMediaQuery(FINE_QUERY);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const resyncRef = useRef<() => void>(() => undefined);
  const pendingRef = useRef<{ index: number; at: number } | null>(null);
  const onOpenRef = useRef(onOpen);
  useLayoutEffect(() => {
    onOpenRef.current = onOpen;
  });

  const [mode, setMode] = useState<CardTrackMode>(() =>
    typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches ? "snap" : "scrub",
  );
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [focusIdx, setFocusIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [near, setNear] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const instructionsId = useId();
  const hasHeading = !!heading;

  const pause = useInViewPause(viewportRef);
  const { suspended } = pause;

  const setActiveIdx = useCallback((i: number) => {
    if (pendingRef.current?.index === i) pendingRef.current = null;
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActive(i);
  }, []);

  // Stable per-card handlers: an active change re-renders only the cards it touches.
  const handlers = useMemo(
    () =>
      items.map((item, i) => ({
        open: () => onOpenRef.current?.(item, i),
        hover: (h: boolean) => setHoverIdx((prev) => (h ? i : prev === i ? null : prev)),
        focus: () => setFocusIdx(i),
        ref: (el: HTMLButtonElement | null) => {
          buttonRefs.current[i] = el;
        },
      })),
    [items],
  );

  // Media loads once the track approaches; the reveal plays once.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      setRevealed(true);
      return;
    }
    const nearIo = new IntersectionObserver(([e]) => e?.isIntersecting && (setNear(true), nearIo.disconnect()), { rootMargin: "1200px 0px" });
    const revealIo = new IntersectionObserver(([e]) => e?.isIntersecting && (setRevealed(true), revealIo.disconnect()), { rootMargin: "0px 0px -20px 0px", threshold: 0.15 });
    nearIo.observe(el);
    revealIo.observe(el);
    return () => {
      nearIo.disconnect();
      revealIo.disconnect();
    };
  }, []);

  // Mechanism only. Scrub geometry is read live (scrubGeometry) so it can never go stale.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const inner = trackRef.current;
    if (!root || !stage || !viewport || !inner) return;
    let raf: number | null = null;

    const measure = () => {
      raf = null;
      const overflow = inner.offsetWidth - viewport.clientWidth;
      // Content span + the scrub stage's minimum padding (7.5em) must fit the viewport.
      const first = stage.firstElementChild?.getBoundingClientRect().top ?? 0;
      const last = stage.lastElementChild?.getBoundingClientRect().bottom ?? 0;
      const em = Number.parseFloat(getComputedStyle(stage).fontSize) || 16;
      const tooTall = last - first + 7.5 * em > window.innerHeight;
      setMode(phone || n < 2 ? (n < 2 ? "static" : "snap") : overflow <= 4 ? "static" : tooTall ? "snap" : "scrub");
      resyncRef.current();
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(measure);
    };

    measure();
    const ro = new ResizeObserver(schedule);
    // The stage children too: in scrub the stage is pinned at 100vh, so a heading
    // that reflows (locale, fonts) only shows up on its own box.
    [root, stage, viewport, inner, ...Array.from(stage.children)].forEach((el) => ro.observe(el));
    window.addEventListener("resize", schedule);
    document.fonts?.addEventListener?.("loadingdone", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      document.fonts?.removeEventListener?.("loadingdone", schedule);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [phone, n, hasHeading]);

  // Desktop scrub: page scroll → lerped translate, progress fill and focus.
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const inner = trackRef.current;
    if (mode !== "scrub" || !root || !stage || !viewport || !inner) {
      if (inner) inner.style.transform = "";
      resyncRef.current = () => undefined;
      return;
    }
    if (suspended) return;

    const read = () => {
      const { range, maxX } = scrubGeometry(root, stage, viewport, inner);
      return { maxX, goal: range > 0 ? clamp(-root.getBoundingClientRect().top / range, 0, 1) : 0 };
    };
    const apply = (p: number, maxX: number) => {
      inner.style.transform = `translate3d(${(-p * maxX).toFixed(2)}px, 0, 0)`;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      setActiveIdx(Math.round(p * (n - 1)));
    };

    const start = read();
    let current = start.goal;
    let raf = 0;
    let last = 0;
    apply(current, start.maxX);

    const tick = (now: number) => {
      const { goal, maxX } = read();
      const k = 1 - Math.pow(1 - LERP, (last ? now - last : FRAME_MS) / FRAME_MS);
      last = now;
      current += (goal - current) * k;
      if (Math.abs(goal - current) * Math.max(1, maxX) < 0.3) {
        current = goal;
        raf = 0;
      } else {
        raf = requestAnimationFrame(tick);
      }
      apply(current, maxX);
    };
    const onScroll = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    resyncRef.current = onScroll;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      resyncRef.current = () => undefined;
    };
  }, [mode, suspended, n, setActiveIdx]);

  // Snap (phone, short viewports): native horizontal scroll → progress and focus.
  useEffect(() => {
    const viewport = viewportRef.current;
    const inner = trackRef.current;
    if (mode !== "snap" || !viewport || !inner || suspended) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = viewport.scrollWidth - viewport.clientWidth;
      const p = max > 0 ? clamp(viewport.scrollLeft / max, 0, 1) : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      const vr = viewport.getBoundingClientRect();
      const center = vr.left + viewport.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(inner.children).forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      // At the ends the edge cards win even if not centred (short last scroll).
      if (max > 0 && viewport.scrollLeft >= max - 2) best = n - 1;
      if (viewport.scrollLeft <= 2) best = 0;
      setActiveIdx(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode, suspended, n, setActiveIdx]);

  useEffect(() => {
    if (mode === "static" && fillRef.current) fillRef.current.style.transform = "";
  }, [mode]);

  useEffect(() => {
    if (!fine || suspended) setHoverIdx(null);
  }, [fine, suspended]);

  const select = useCallback(
    (i: number) => {
      const next = clamp(i, 0, n - 1);
      const root = rootRef.current;
      const stage = stageRef.current;
      const viewport = viewportRef.current;
      const inner = trackRef.current;
      if (mode !== "static") pendingRef.current = { index: next, at: performance.now() };
      if (mode === "scrub" && root && stage && viewport && inner) {
        const { range } = scrubGeometry(root, stage, viewport, inner);
        const top = window.scrollY + root.getBoundingClientRect().top + (n > 1 ? (range * next) / (n - 1) : 0);
        window.scrollTo({ top, behavior: "smooth" });
      } else if (mode === "snap" && viewport && inner) {
        const card = inner.children[next] as HTMLElement | undefined;
        if (card) {
          const vr = viewport.getBoundingClientRect();
          const cr = card.getBoundingClientRect();
          const delta = phone
            ? cr.left + cr.width / 2 - (vr.left + viewport.clientWidth / 2)
            : cr.left - vr.left - (Number.parseFloat(getComputedStyle(inner).paddingLeft) || 0);
          viewport.scrollTo({ left: viewport.scrollLeft + delta, behavior: "smooth" });
        }
      }
      setFocusIdx(next);
      buttonRefs.current[next]?.focus({ preventScroll: true });
    },
    [mode, n, phone],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (n < 2) return;
    const pending = pendingRef.current;
    const from =
      mode === "static" ? focusIdx : pending && performance.now() - pending.at < PENDING_MS ? pending.index : activeRef.current;
    const to = e.key === "ArrowRight" ? from + 1 : e.key === "ArrowLeft" ? from - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to === null) return;
    e.preventDefault();
    select(to);
  };

  if (n === 0) return null;

  const tabStop = mode === "static" ? focusIdx : active;
  const canPlay = near && pause.active;
  const length_ = length ?? `calc(100vh + ${n} * 35vh)`;

  return (
    <div
      ref={rootRef}
      id={id}
      className={cn("ev-root ev-card-track", tone && `ev-tone-${tone}`, className)}
      data-mode={mode}
      data-variant={variant}
      data-revealed={revealed || undefined}
      style={{ "--ctr-length": length_, "--ctr-count": n } as CSSProperties}
    >
      <div ref={stageRef} className={cn("ctr-stage", rhythm === "standard" ? "ev-chapter" : `ev-chapter ev-chapter--${rhythm}`)}>
        {heading && <div className="ctr-head">{heading}</div>}

        <div className="ctr-progress ev-rail ev-rail--wide" aria-hidden="true">
          <span className="ctr-progress__rail">
            <span ref={fillRef} className="ctr-progress__fill" />
          </span>
          {showIndex && <Index current={active + 1} total={n} size="lg" className="ctr-progress__index" />}
        </div>
        <div className="ctr-dots" aria-hidden="true">
          {items.map((item, i) => (
            <span key={item.id} className="ctr-dot" data-current={i === active || undefined} />
          ))}
        </div>

        <div
          className="ctr-region"
          role="region"
          aria-roledescription={copy.carousel}
          aria-label={track.label}
          aria-describedby={instructionsId}
          tabIndex={onOpen ? undefined : 0}
          onKeyDown={onKeyDown}
        >
          <p id={instructionsId} className="ev-sr">
            {copy.instructions}
          </p>
          <p className="ev-sr" aria-live="polite">
            {mode !== "static" ? copy.position(active + 1, n, items[active]?.title ?? "") : ""}
          </p>
          <div ref={viewportRef} className="ctr-viewport">
            <div ref={trackRef} className="ctr-track">
              {items.map((item, i) => {
                const current = mode !== "static" && i === active;
                const hovered = hoverIdx === i;
                const play =
                  canPlay && !!item.media.video && (variant === "portrait" ? (mode === "static" ? hovered : current) : fine && hovered);
                return (
                  <MediaCard
                    key={item.id}
                    item={item}
                    index={i}
                    total={n}
                    variant={variant}
                    ribbon={ribbon}
                    copy={copy}
                    current={current}
                    released={current || hovered}
                    near={near}
                    play={play}
                    tabbable={i === tabStop}
                    onOpen={onOpen ? handlers[i]?.open : undefined}
                    onHover={fine ? handlers[i]?.hover : undefined}
                    onFocusCard={handlers[i]?.focus}
                    buttonRef={handlers[i]?.ref}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Scrub geometry, read when used: the sticky span (wrapper − stage) and the track's overflow. */
function scrubGeometry(root: HTMLElement, stage: HTMLElement, viewport: HTMLElement, inner: HTMLElement) {
  return {
    range: Math.max(0, root.offsetHeight - stage.offsetHeight),
    maxX: Math.max(0, inner.offsetWidth - viewport.clientWidth),
  };
}

export type { CardTrackCopy };
