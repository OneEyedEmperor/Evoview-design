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
import { cn, useInViewPause, useMediaQuery } from "../foundation";
import { MediaCard } from "./MediaCard";
import { nearestToCentre } from "./strip";
import type { CardHeadingLevel, CardTrackCopy, CardTrackDefinition, CardTrackItem } from "./types";

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
  /** Card title level. Default 3 (the chapter heading is the h2). */
  cardHeadingLevel?: CardHeadingLevel;
  /** Scrub length (wrapper height). Default the pinned stage's height + n × 35vh of scrub. */
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

/* Scrub geometry, read on mount and on every resize, never per frame:
   `top` is the root's page offset, `pin` the stage's resolved sticky top. */
type Geometry = { range: number; maxX: number; pin: number; top: number };

export function CardTrack({ track, copy, heading, tone, rhythm = "standard", onOpen, cardHeadingLevel = 3, length, id, className }: CardTrackProps) {
  const { items, variant, ribbon = "light" } = track;
  const n = items.length;
  const phone = useMediaQuery(PHONE_QUERY);
  const fine = useMediaQuery(FINE_QUERY);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const geoRef = useRef<Geometry>({ range: 0, maxX: 0, pin: 0, top: 0 });
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
  const instructionsId = useId();
  const hasHeading = !!heading;

  // Media loads once the track approaches; the reveal plays once.
  const near = useInViewPause(viewportRef, { once: true, rootMargin: "1200px 0px" }).active;
  const revealed = useInViewPause(viewportRef, { once: true, rootMargin: "0px 0px -20px 0px", threshold: 0.15 }).active;
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

  // Mechanism and geometry, on mount and every size change (the track, its
  // stage, or anything above it that moves the root down the page).
  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const inner = trackRef.current;
    if (!root || !stage || !viewport || !inner) return;
    let raf: number | null = null;

    const measure = () => {
      raf = null;
      // Rendered children only: a display:none child reports top 0 and would inflate the span.
      const measureSpan = () => {
        const boxes = Array.from(stage.children, (c) => c.getBoundingClientRect()).filter((r) => r.height > 0);
        return (boxes[boxes.length - 1]?.bottom ?? 0) - (boxes[0]?.top ?? 0);
      };
      // What pins with the cards (heading, rail): the portrait card height yields to it
      // (card-track.css). Set first so the span below is read with the resolved height.
      root.style.setProperty("--ctr-chrome", `${Math.round(measureSpan() - inner.offsetHeight)}px`);
      const span = measureSpan();
      const overflow = inner.offsetWidth - viewport.clientWidth;
      // Content span + the scrub stage's minimum padding (7.5em) must fit the viewport.
      const cs = getComputedStyle(stage);
      const em = Number.parseFloat(cs.fontSize) || 16;
      const tooTall = span + 7.5 * em > window.innerHeight;
      stage.style.setProperty("--ctr-span", `${Math.round(span)}px`);
      stage.style.setProperty("--ctr-pad-top", cs.paddingTop);
      root.style.setProperty("--ctr-stage", `${stage.offsetHeight}px`);
      setMode(phone || n < 2 ? (n < 2 ? "static" : "snap") : overflow <= 4 ? "static" : tooTall ? "snap" : "scrub");
      const pin = Number.parseFloat(getComputedStyle(stage).top);
      geoRef.current = {
        range: Math.max(0, root.offsetHeight - stage.offsetHeight),
        maxX: Math.max(0, inner.offsetWidth - viewport.clientWidth),
        pin: Number.isFinite(pin) ? pin : 0,
        top: root.getBoundingClientRect().top + window.scrollY,
      };
      resyncRef.current();
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(measure);
    };

    measure();
    const ro = new ResizeObserver(schedule);
    // The stage children too (a heading that reflows on locale or fonts), and
    // the body: content above the track moves the root without resizing it.
    [document.body, root, stage, viewport, inner, ...Array.from(stage.children)].forEach((el) => ro.observe(el));
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
      const { range, maxX, pin, top } = geoRef.current;
      return { maxX, goal: range > 0 ? clamp((window.scrollY + pin - top) / range, 0, 1) : 0 };
    };
    let shown = "";
    const apply = (p: number, maxX: number) => {
      const x = (-p * maxX).toFixed(2);
      if (x === shown) return;
      shown = x;
      inner.style.transform = `translate3d(${x}px, 0, 0)`;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
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
    resyncRef.current = () => {
      shown = "";
      onScroll();
    };
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
      const best = nearestToCentre(viewport, inner.children);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
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
      const viewport = viewportRef.current;
      const inner = trackRef.current;
      if (mode !== "static") pendingRef.current = { index: next, at: performance.now() };
      if (mode === "scrub") {
        const { range, pin, top } = geoRef.current;
        window.scrollTo({ top: top - pin + (n > 1 ? (range * next) / (n - 1) : 0), behavior: "smooth" });
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
  const length_ = length ?? `calc(var(--ctr-stage, 100vh) + ${n} * 35vh)`;

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
                    headingLevel={cardHeadingLevel}
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

        {/* Progress sits under the card row it measures: above it, under a
            heading, a full-width rail would read as a heading underline. */}
        <div className="ctr-progress ev-rail ev-rail--wide" aria-hidden="true">
          <span className="ctr-progress__rail">
            <span ref={fillRef} className="ctr-progress__fill" />
          </span>
        </div>
        <div className="ctr-dots" aria-hidden="true">
          {items.map((item, i) => (
            <span key={item.id} className="ctc-dot" data-current={i === active || undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}

export type { CardTrackCopy };
