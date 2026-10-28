import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { GhostAction, SegmentedControl } from "../controls";
import { ArrowRight, cn, preloadMedia, useHydrated, useInViewPause, useMediaQuery } from "../foundation";
import { MediaCard } from "./MediaCard";
import { nearestToCentre } from "./strip";
import type { CardDeckCategory, CardDeckCopy, CardDeckDefinition, CardDeckRows, CardHeadingLevel, CardTrackItem, CardTrackVariant } from "./types";

export type CardDeckProps = {
  deck: CardDeckDefinition;
  copy: CardDeckCopy;
  /** Card anatomy: `portrait` (image is the argument) or `ribbon` (each card needs a sentence). */
  variant?: CardTrackVariant;
  /** Ribbon colour (ribbon variant). Default "light". */
  ribbon?: "light" | "dark";
  /** Desktop grid rows of three: 2 (six cards, the deck deal) or 1 (three cards). Default 2. */
  rows?: CardDeckRows;
  /** Paints the chapter. Omit to inherit the host's tone. */
  tone?: "dark" | "light" | "paper";
  /** Block padding (foundation chapter rhythm). Default "standard". */
  rhythm?: "standard" | "compact" | "cinematic";
  /** Chapter heading, above the category switch. */
  heading?: ReactNode;
  /** Card title level. Default 3 (the chapter heading is the h2). */
  cardHeadingLevel?: CardHeadingLevel;
  /** Card activation (the host's detail view). Without it cards are not buttons. */
  onOpen?: (item: CardTrackItem, category: CardDeckCategory) => void;
  /** Plain click on the `more` link; leave the default to follow its href. */
  onMore?: (event: MouseEvent<HTMLAnchorElement>) => void;
  id?: string;
  className?: string;
};

/* ── Deck choreography (desktop ≥ 1024, Web Animations so any click can
   reverse a card from the frame it is on instead of restarting):
   deal  → centre column first, side cards slide out from under the opposite
           row's centre card (one row: from under the centre card)
   out   → deal reversed, the top centre card stays
   flip  → top centre turns edge-on, the content swaps to the new category
   in    → it turns back as the new category's card while the deal replays
   Timings, eases and offsets are the Tchin Tchin originals (founder-approved,
   zero dead time between phases); change them in small steps only. */

type Phase = "deal" | "out" | "flip";
type Kind = "deal" | "undeal" | "flipOut" | "flipIn" | "rise";
type Spec = { keyframes: Keyframe[]; duration: number; easing: string; delay: number; tag?: "initial" | "captured" };
type Track = { anim: Animation; spec: Spec; kind: Kind; reversed: boolean; outward: boolean };
type Offset = { x: string; y: string; scale: number };
type Geometry = { from: Offset[]; inFrom: Offset[]; initialDelay: number[]; inDelay: number[]; undealDelay: number[] };

const COLUMNS = 3;
const TOP_CENTRE = 1;
const BOTTOM_CENTRE = 4;
const MAX_RETRACT_MS = 600;
const OUTWARD: Record<Kind, boolean> = { deal: false, flipIn: false, rise: false, undeal: true, flipOut: true };
const DEAL_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const UNDEAL_EASE = "cubic-bezier(0.7, 0, 0.84, 0)";
const REST = "translate(0px, 0px) scale(1)";
/* Centre cards drop / rise this far (source: 3.5rem under a 1.15 zoom ≈ 64px at 1440). */
const CENTRE_DROP = "4.6em";
/* Phone / tablet strip: a staggered rise, the source's CSS deal. */
const RISE = { duration: 950, stagger: 140, y: "3em" };

const DESK_QUERY = "(min-width: 1024px)";
const FINE_QUERY = "(hover: hover) and (pointer: fine)";

const offsetTransform = ({ x, y, scale }: Offset) => `translate(${x}, ${y}) scale(${scale})`;

function geometry(rows: CardDeckRows, colGap: number, rowGap: number): Geometry {
  const side = `calc(100% + ${colGap}px)`;
  const nside = `calc(-100% - ${colGap}px)`;
  if (rows === 1) {
    const from: Offset[] = [
      { x: side, y: "0px", scale: 0.92 },
      { x: "0px", y: `-${CENTRE_DROP}`, scale: 0.97 },
      { x: nside, y: "0px", scale: 0.92 },
    ];
    return { from, inFrom: from, initialDelay: [580, 0, 580], inDelay: [650, 0, 650], undealDelay: [0, 0, 0] };
  }
  const row = `calc(100% + ${rowGap}px)`;
  const nrow = `calc(-100% - ${rowGap}px)`;
  const from: Offset[] = [
    { x: side, y: row, scale: 0.92 },
    { x: "0px", y: `-${CENTRE_DROP}`, scale: 0.97 },
    { x: nside, y: row, scale: 0.92 },
    { x: side, y: nrow, scale: 0.92 },
    { x: "0px", y: CENTRE_DROP, scale: 0.97 },
    { x: nside, y: nrow, scale: 0.92 },
  ];
  // Re-deal and undeal tuck the bottom centre under the top centre card.
  const inFrom = from.map((o, i) => (i === BOTTOM_CENTRE ? { x: "0px", y: nrow, scale: 0.92 } : o));
  return {
    from,
    inFrom,
    initialDelay: [580, 0, 580, 400, 180, 400],
    inDelay: [650, 0, 650, 510, 430, 510],
    undealDelay: [0, 0, 0, 110, 270, 110],
  };
}

const dealSpec = (from: Offset, duration: number, delay: number): Spec => ({
  keyframes: [{ opacity: 0, transform: offsetTransform(from) }, { opacity: 1, offset: 0.35 }, { opacity: 1, transform: REST }],
  duration,
  easing: DEAL_EASE,
  delay,
});
const initialSpec = (g: Geometry, i: number): Spec => ({
  ...dealSpec(g.from[i] ?? g.from[0], i % COLUMNS === 1 ? 950 : 1200, g.initialDelay[i] ?? 0),
  tag: "initial",
});
const inSpec = (g: Geometry, i: number) => dealSpec(g.inFrom[i] ?? g.inFrom[0], 950, g.inDelay[i] ?? 0);
const undealSpec = (g: Geometry, i: number): Spec => ({
  keyframes: [{ opacity: 1, transform: REST }, { opacity: 1, offset: 0.65 }, { opacity: 0, transform: offsetTransform(g.inFrom[i] ?? g.inFrom[0]) }],
  duration: i === BOTTOM_CENTRE ? 550 : 600,
  easing: UNDEAL_EASE,
  delay: g.undealDelay[i] ?? 0,
});
const riseSpec = (i: number): Spec => ({
  keyframes: [{ opacity: 0, transform: `translate(0px, ${RISE.y}) scale(0.97)` }, { opacity: 1, offset: 0.35 }, { opacity: 1, transform: REST }],
  duration: RISE.duration,
  easing: DEAL_EASE,
  delay: i * RISE.stagger,
});
const FLIP_OUT: Spec = {
  keyframes: [
    { opacity: 1, transform: "perspective(1600px) rotateY(0deg) scale(1)" },
    { opacity: 1, transform: "perspective(1600px) rotateY(90deg) scale(0.97)" },
  ],
  duration: 300,
  easing: "cubic-bezier(0.55, 0, 1, 0.45)",
  delay: 0,
};
const FLIP_IN: Spec = {
  keyframes: [
    { opacity: 1, transform: "perspective(1600px) rotateY(-90deg) scale(0.97)" },
    { opacity: 1, transform: "perspective(1600px) rotateY(0deg) scale(1)" },
  ],
  duration: 450,
  easing: "cubic-bezier(0, 0.55, 0.45, 1)",
  delay: 0,
};

const currentFrame = (el: HTMLElement): Keyframe => {
  const cs = getComputedStyle(el);
  return { opacity: Number(cs.opacity), transform: cs.transform === "none" ? REST : cs.transform };
};

export function CardDeck({
  deck,
  copy,
  variant = "portrait",
  ribbon = "light",
  rows = 2,
  tone,
  rhythm = "standard",
  heading,
  cardHeadingLevel = 3,
  onOpen,
  onMore,
  id,
  className,
}: CardDeckProps) {
  const categories = deck.categories;
  const first = categories[0]?.id ?? "";
  const desk = useMediaQuery(DESK_QUERY);
  const fine = useMediaQuery(FINE_QUERY);
  const hydrated = useHydrated();

  const gridRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(first);
  const [shown, setShown] = useState(first);
  const [announce, setAnnounce] = useState("");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);

  const shownRef = useRef(first);
  const target = useRef(first);
  const phase = useRef<Phase>("deal");
  const tracks = useRef<(Track | undefined)[]>([]);
  const gen = useRef(0);
  const entering = useRef(false);
  const deskRef = useRef(desk);
  deskRef.current = desk;

  const dealt = useInViewPause(gridRef, { once: true, threshold: 0.15 }).active;
  const near = useInViewPause(gridRef, { once: true, rootMargin: "1200px 0px" }).active;
  const live = useInViewPause(gridRef);
  const dealtRef = useRef(dealt);
  dealtRef.current = dealt;

  // One hand on every device: 3 or 6 cards; the rest of the catalogue is behind `more`.
  const slots = rows * COLUMNS;
  const category = categories.find((c) => c.id === shown) ?? categories[0];
  const items = useMemo(() => (category ? category.items.slice(0, slots) : []), [category, slots]);
  const panelId = useId();
  const instructionsId = useId();

  const cards = () => Array.from(gridRef.current?.children ?? []).slice(0, rows * COLUMNS) as HTMLElement[];
  const geo = (): Geometry => {
    const grid = gridRef.current;
    const cs = grid ? getComputedStyle(grid) : null;
    return geometry(rows, Number.parseFloat(cs?.columnGap ?? "0") || 0, Number.parseFloat(cs?.rowGap ?? "0") || 0);
  };
  const choreographed = () => dealtRef.current && deskRef.current;

  const play = (i: number, el: HTMLElement, kind: Kind, spec: Spec, reversed = false) => {
    tracks.current[i]?.anim.cancel();
    const anim = el.animate(spec.keyframes, {
      duration: spec.duration,
      easing: spec.easing,
      delay: spec.delay,
      direction: reversed ? "reverse" : "normal",
      fill: "both",
    });
    tracks.current[i] = { anim, spec, kind, reversed, outward: OUTWARD[kind] !== reversed };
    return anim;
  };

  // Replays the card's current animation the other way from the exact frame it is on.
  const mirror = (i: number, el: HTMLElement, maxMs?: number) => {
    const { anim, spec, kind, reversed } = tracks.current[i]!;
    const elapsed = Math.min(spec.duration, Math.max(0, Number(anim.currentTime ?? 0) - spec.delay));
    const next = play(i, el, kind, { ...spec, delay: 0 }, !reversed);
    next.currentTime = spec.duration - elapsed;
    if (maxMs && elapsed > maxMs) next.playbackRate = elapsed / maxMs;
    return next;
  };

  const settle = (anims: (Animation | null)[], token: number, then: () => void) => {
    Promise.all(anims.filter((a): a is Animation => !!a).map((a) => a.finished)).then(
      () => token === gen.current && then(),
      () => undefined,
    );
  };

  const reset = () => {
    ++gen.current;
    tracks.current.forEach((t) => t?.anim.cancel());
    tracks.current = [];
    phase.current = "deal";
  };

  const show = (next: string, sync = false) => {
    entering.current = true;
    shownRef.current = next;
    // Mid-sequence the new hand must mount in the task that ends the flip-out,
    // so the flip-in starts on the next frame (a scheduled render left two
    // still frames edge-on: a dead gap).
    if (sync) flushSync(() => setShown(next));
    else setShown(next);
  };

  const restore = () => {
    phase.current = "deal";
    ++gen.current;
    cards().forEach((el, i) => {
      const track = tracks.current[i];
      if (!track?.outward) return;
      // A captured retract starts mid-deal, so mirroring it would strand the card there.
      if (track.spec.tag === "captured") {
        play(i, el, "deal", { keyframes: [currentFrame(el), { opacity: 1, transform: REST }], duration: 600, easing: DEAL_EASE, delay: 0 });
      } else {
        mirror(i, el);
      }
    });
  };

  const swap = () => {
    if (target.current === shownRef.current) return restore();
    phase.current = "deal";
    show(target.current, true);
  };

  const flip = (token: number) => {
    phase.current = "flip";
    const el = cards()[TOP_CENTRE];
    settle([el ? play(TOP_CENTRE, el, "flipOut", FLIP_OUT) : null], token, swap);
  };

  const retract = () => {
    phase.current = "out";
    const token = ++gen.current;
    const g = geo();
    let edgeOn = false;
    const anims = cards().map((el, i) => {
      const track = tracks.current[i];
      const running = !!track && track.anim.playState !== "finished";
      if (i === TOP_CENTRE) {
        if (running && track.kind === "flipIn") {
          edgeOn = true;
          return mirror(i, el);
        }
        return running ? track.anim : null;
      }
      // Mirroring its initial rise would sink it; send it from where it is to behind the top card.
      if (rows === 2 && i === BOTTOM_CENTRE && running && track.spec.tag === "initial") {
        const from = currentFrame(el);
        return play(i, el, "undeal", {
          keyframes: [from, { opacity: from.opacity, offset: 0.65 }, { opacity: 0, transform: offsetTransform(g.inFrom[BOTTOM_CENTRE]) }],
          duration: 550,
          easing: UNDEAL_EASE,
          delay: 0,
          tag: "captured",
        });
      }
      if (running && !track.outward) return mirror(i, el, MAX_RETRACT_MS);
      return play(i, el, "undeal", undealSpec(g, i));
    });
    settle(anims, token, () => (edgeOn ? swap() : flip(token)));
  };

  // Opening deal (desktop) or staggered rise (strip), once the deck is on screen.
  useLayoutEffect(() => {
    if (!dealt) return;
    const g = geo();
    cards().forEach((el, i) => (desk ? play(i, el, "deal", initialSpec(g, i)) : play(i, el, "rise", riseSpec(i))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealt]);

  // A new category mounted: flip in + re-deal (desktop) or rise (strip).
  useLayoutEffect(() => {
    if (!entering.current) return;
    entering.current = false;
    if (!dealtRef.current) return;
    const g = geo();
    cards().forEach((el, i) => {
      if (!desk) play(i, el, "rise", riseSpec(i));
      else if (i === TOP_CENTRE) play(i, el, "flipIn", FLIP_IN);
      else play(i, el, "deal", inSpec(g, i));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  // A layout change (anatomy, rows) re-deals the cards in their new places.
  const layoutKey = `${variant}:${rows}`;
  const lastLayout = useRef(layoutKey);
  useLayoutEffect(() => {
    if (lastLayout.current === layoutKey) return;
    lastLayout.current = layoutKey;
    if (!dealtRef.current) return;
    reset();
    if (target.current !== shownRef.current) return show(target.current);
    const g = geo();
    cards().forEach((el, i) => (desk ? play(i, el, "deal", initialSpec(g, i)) : play(i, el, "rise", riseSpec(i))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  // Crossing the desktop breakpoint mid-sequence: settle at rest on the target.
  useEffect(() => {
    if (phase.current === "deal" && target.current === shownRef.current) return;
    reset();
    if (target.current !== shownRef.current) {
      shownRef.current = target.current;
      setShown(target.current);
    }
  }, [desk]);

  useEffect(() => () => void ++gen.current, []);

  // The flip swaps content mid-sequence: decode every category's posters first, so no card turns over blank.
  useEffect(() => {
    if (!near) return;
    const sources = categories.flatMap((c) => c.items.slice(0, rows * COLUMNS).map((item) => item.media.src));
    const run = () => void preloadMedia(sources);
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: 2000 });
    else setTimeout(run, 600);
  }, [near, categories, rows]);

  useEffect(() => {
    if (!fine || !live.active) setHoverId(null);
  }, [fine, live.active]);

  const switchCategory = (next: string) => {
    setSelected(next);
    target.current = next;
    const label = categories.find((c) => c.id === next);
    if (label) setAnnounce(copy.showing(label.label, Math.min(label.items.length, slots)));

    if (!choreographed()) {
      reset();
      if (next !== shownRef.current) {
        show(next);
        stripRef.current?.scrollTo({ left: 0 });
      }
      return;
    }
    if (phase.current === "deal") {
      if (next !== shownRef.current) retract();
    } else if (next === shownRef.current) {
      restore();
    }
    // Otherwise a mid-transition click just retargets the category the flip lands on.
  };

  // Strip (< 1024): native snap, dots follow the centred card.
  useEffect(() => {
    const strip = stripRef.current;
    if (desk || !strip) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      setCurrent(nearestToCentre(strip, cards()));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    strip.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      strip.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desk, items]);

  const hover = useCallback((itemId: string, on: boolean) => setHoverId((prev) => (on ? itemId : prev === itemId ? null : prev)), []);

  if (!category) return null;
  const options = categories.map((c) => ({ value: c.id, label: c.label }));

  return (
    <div
      id={id}
      className={cn("ev-root ev-card-deck", tone && `ev-tone-${tone}`, rhythm === "standard" ? "ev-chapter" : `ev-chapter ev-chapter--${rhythm}`, className)}
      data-variant={variant}
      data-rows={rows}
      data-armed={hydrated || undefined}
      data-dealt={dealt || undefined}
    >
      {heading && <div className="cdk-head">{heading}</div>}

      <div className="cdk-switch">
        <SegmentedControl options={options} value={selected} onChange={switchCategory} label={deck.switchLabel} block />
      </div>

      <div
        id={panelId}
        className="cdk-panel"
        role="region"
        aria-label={`${deck.label} — ${category.label}`}
        aria-roledescription={desk ? undefined : copy.carousel}
        aria-describedby={desk ? undefined : instructionsId}
      >
        <p id={instructionsId} className="ev-sr">
          {copy.instructions}
        </p>
        <p className="ev-sr" aria-live="polite">
          {announce}
        </p>
        <div ref={stripRef} className="cdk-viewport">
          <div ref={gridRef} className="cdk-grid">
            {items.map((item, i) => (
              <MediaCard
                key={`${shown}:${item.id}`}
                item={item}
                index={i}
                total={items.length}
                variant={variant}
                ribbon={ribbon}
                copy={copy}
                headingLevel={cardHeadingLevel}
                released={hoverId === item.id}
                near={near}
                play={fine && live.active && hoverId === item.id && !!item.media.video}
                onOpen={onOpen ? () => onOpen(item, category) : undefined}
                onHover={fine ? (on) => hover(item.id, on) : undefined}
                className="cdk-card"
                style={{ "--cdk-z": i === TOP_CENTRE ? 2 : rows === 2 && i === BOTTOM_CENTRE ? 1 : 0 } as CSSProperties}
              />
            ))}
          </div>
        </div>
        <div className="cdk-dots" aria-hidden="true">
          {items.map((item, i) => (
            <span key={`${shown}:${item.id}`} className="ctc-dot" data-current={i === current || undefined} />
          ))}
        </div>
      </div>

      {deck.more && (
        <div className="cdk-more">
          <GhostAction href={deck.more.href} icon={<ArrowRight />} iconPosition="end" onClick={onMore}>
            {deck.more.label}
          </GhostAction>
        </div>
      )}
    </div>
  );
}
