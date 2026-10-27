import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { cn, useInViewPause, useMediaQuery, useMediaReady } from "../foundation";
import { Chapter, ChapterHeading, type ChapterRhythm, type ChapterTone } from "./Chapter";

/* Story chapter: the client's story beside (around, above) lanes of its
   pictures that drift slowly and travel with the scroll. Lanes are vertical
   columns from 1024, sideways rows below. */

export type ChapterStoryMedia =
  | { kind: "image"; src: string; srcSet?: string; sizes?: string; ratio: string }
  /** `poster` = the first frame (webp); the clip loops forward, seamless. */
  | { kind: "video"; src: string; poster: string; ratio: string };

export type ChapterStoryContent = {
  /** Overused 900 uppercase; one `<em>` = the accent word; a `<ChapterMark>` may replace a word. */
  title: ReactNode;
  /** Client mark above the title (decorative, currentColor). Replaces the heading marker. */
  emblem?: ReactNode;
  /** Paragraphs. */
  story: ReactNode[];
  /** A signed sentence under the story (founder, chef…). Dropped on phones. */
  quote?: { text: ReactNode; name: string; role?: string };
  /** Atmosphere, dealt round-robin into the lanes (≥ 9 recommended, ≥ 3 videos at most playing one at a time). */
  media: ChapterStoryMedia[];
};

/** Where the text sits against the media. */
export type ChapterStoryLayout = "start" | "center" | "end" | "above";
/** ample: fewer, larger lanes · dense: one more lane per side, smaller pictures. */
export type ChapterStoryDensity = "ample" | "dense";

export type ChapterStoryProps = {
  content: ChapterStoryContent;
  layout?: ChapterStoryLayout;
  density?: ChapterStoryDensity;
  id?: string;
  tone?: ChapterTone;
  rhythm?: ChapterRhythm;
  accent?: string;
  headingVariant?: "standard" | "feature";
  level?: 2 | 3;
  className?: string;
};

type Axis = "x" | "y";
type Slot = "side" | "before" | "after";
type Group = { slot: Slot; lanes: number[] };

/* Desktop (≥ 1024) lanes per layout and density; phones and tablets get rows. */
function plan(layout: ChapterStoryLayout, density: ChapterStoryDensity, columns: boolean): { axis: Axis; groups: Group[] } {
  const dense = density === "dense";
  if (!columns) {
    if (layout === "above") return { axis: "x", groups: [{ slot: "after", lanes: dense ? [0, 1] : [0] }] };
    if (layout === "center" && dense) return { axis: "x", groups: [{ slot: "before", lanes: [0] }, { slot: "after", lanes: [1] }] };
    return { axis: "x", groups: [{ slot: "before", lanes: dense ? [0, 1] : [0] }] };
  }
  if (layout === "above") return { axis: "x", groups: [{ slot: "after", lanes: dense ? [0, 1] : [0] }] };
  if (layout === "center")
    return dense
      ? { axis: "y", groups: [{ slot: "before", lanes: [0, 1] }, { slot: "after", lanes: [2, 3] }] }
      : { axis: "y", groups: [{ slot: "before", lanes: [0] }, { slot: "after", lanes: [1] }] };
  return { axis: "y", groups: [{ slot: "side", lanes: dense ? [0, 1, 2] : [0, 1] }] };
}

/* Per lane: scroll multiplier, drift direction, starting phase (px). */
type LaneMotion = { speed: number; dir: 1 | -1; phase: number };
const MOTION: LaneMotion[] = [
  { speed: 1, dir: -1, phase: 0 },
  { speed: 0.65, dir: 1, phase: 160 },
  { speed: 1.3, dir: -1, phase: 70 },
  { speed: 0.85, dir: 1, phase: 230 },
];
const DRIFT_PX_PER_MS = 0.014;
/* Track travel (px, × the lane multiplier) over the chapter's full pass through the viewport. */
const SCROLL_TRAVEL_PX = 520;
const MAX_PLAYING = 1;
const VIDEO_SYNC_MS = 250;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/* Round-robin deal; each lane then borrows from the lane across (half the
   count away) before the others, so a short lane extends with pictures its
   neighbours do not show, and only repeats itself once the pool runs out. */
const deal = (media: ChapterStoryMedia[], count: number) => {
  const own = Array.from({ length: count }, (_, lane) => media.filter((_, i) => i % count === lane));
  const across = Math.floor(count / 2);
  return own.map((items, lane) => {
    const others = Array.from({ length: count }, (_, k) => own[(lane + across + k) % count]).filter((l) => l !== items);
    return { own: items.length, pool: [...items, ...others.flat()] };
  });
};

export function ChapterStory({
  content,
  layout = "start",
  density = "dense",
  id,
  tone = "dark",
  rhythm = "standard",
  accent,
  headingVariant = "feature",
  level = 2,
  className,
}: ChapterStoryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const columns = useMediaQuery("(min-width: 1024px)", true);
  const { axis, groups } = plan(layout, density, columns);
  const laneCount = groups.reduce((n, g) => n + g.lanes.length, 0);
  const lanes = useMemo(() => deal(content.media, laneCount), [content.media, laneCount]);

  const { active: revealed } = useInViewPause(rootRef, { once: true, threshold: 0.15 });
  /* Media is fetched only once the chapter comes within 400px. */
  const { active: near } = useInViewPause(rootRef, { once: true, rootMargin: "400px 0px", ignoreSuspension: true });
  const stills = useMemo(() => content.media.map((m) => (m.kind === "image" ? m.src : m.poster)), [content.media]);
  const gate = useMediaReady(near, stills);
  const shown = revealed && (gate.ready || gate.failed);

  const clips = useMemo(() => content.media.flatMap((m) => (m.kind === "video" ? [m.src] : [])), [content.media]);
  const clipUrls = useSharedClipUrls(clips, near);

  const centered = layout === "center";
  const copy = (
    <div className="ev-chapter-story__copy">
      {content.emblem && (
        <span className="ev-chapter-story__emblem ev-chapter-story__reveal" style={delay(0)} aria-hidden="true">
          {content.emblem}
        </span>
      )}
      <div className="ev-chapter-story__reveal" style={delay(80)}>
        <ChapterHeading
          level={level}
          marker={!content.emblem}
          layout={centered ? "centered" : "split"}
          variant={headingVariant}
          title={content.title}
        />
      </div>
      <div className="ev-chapter-story__text">
        <div className="ev-chapter-story__story ev-chapter-story__reveal" style={delay(160)}>
          {content.story.map((p, i) => (
            <p key={i} className="ev-t-body">
              {p}
            </p>
          ))}
        </div>
        {content.quote && (
          <figure className="ev-chapter-story__quote ev-chapter-story__reveal" style={delay(240)}>
            <blockquote>
              <p>{content.quote.text}</p>
            </blockquote>
            <figcaption>
              <span className="ev-t-label ev-chapter-story__name">{content.quote.name}</span>
              {content.quote.role && <span className="ev-t-compact ev-chapter-story__role">{content.quote.role}</span>}
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );

  return (
    <Chapter
      id={id}
      tone={tone}
      rhythm={rhythm}
      rail="none"
      accent={accent}
      className={cn("ev-chapter-story", className)}
      data-layout={layout}
      data-density={density}
      data-axis={axis}
    >
      <div ref={rootRef} className="ev-chapter-story__frame" data-revealed={revealed ? "" : undefined}>
        {copy}
        <Mosaic
          key={`${axis}-${layout}-${density}`}
          axis={axis}
          groups={groups}
          lanes={lanes}
          near={near}
          shown={shown}
          clipUrls={clipUrls}
          frameRef={rootRef}
        />
      </div>
    </Chapter>
  );
}

const delay = (ms: number) => ({ "--ev-chapter-story-delay": `${ms}ms` }) as CSSProperties;

function Mosaic({
  axis,
  groups,
  lanes,
  near,
  shown,
  clipUrls,
  frameRef,
}: {
  axis: Axis;
  groups: Group[];
  lanes: LanePool[];
  near: boolean;
  shown: boolean;
  clipUrls: Record<string, string>;
  frameRef: RefObject<HTMLDivElement | null>;
}) {
  const laneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { active } = useInViewPause(frameRef, { rootMargin: "-1px 0px" });
  const controller = useRef<ReturnType<typeof createDrift> | null>(null);
  const count = lanes.length;

  useEffect(() => {
    const frame = frameRef.current;
    const lanesEls = laneRefs.current.slice(0, count);
    const tracks = trackRefs.current.slice(0, count);
    if (!frame || lanesEls.some((el) => !el) || tracks.some((el) => !el)) return;
    const instance = createDrift(frame, lanesEls as HTMLElement[], tracks as HTMLElement[], axis);
    controller.current = instance;
    return () => {
      instance.destroy();
      controller.current = null;
    };
  }, [axis, count, frameRef]);

  useEffect(() => {
    controller.current?.setActive(active && shown);
  }, [active, shown]);

  // A new src resets the element to paused: re-pick the playing clip.
  useEffect(() => controller.current?.sync(), [clipUrls]);

  return (
    <>
      {groups.map((group) => (
        <div
          key={group.slot}
          className="ev-chapter-story__media"
          data-slot={group.slot}
          data-shown={shown ? "" : undefined}
          style={delay(group.slot === "after" ? 200 : 120)}
          aria-hidden="true"
        >
          {group.lanes.map((lane) => (
            <Lane
              key={lane}
              axis={axis}
              lane={lanes[lane] ?? EMPTY_LANE}
              near={near}
              clipUrls={clipUrls}
              laneRef={(el) => {
                laneRefs.current[lane] = el;
              }}
              trackRef={(el) => {
                trackRefs.current[lane] = el;
              }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

type LanePool = { own: number; pool: ChapterStoryMedia[] };
const EMPTY_LANE: LanePool = { own: 0, pool: [] };

/* One lane: a track of two identical copies (so 0 → −50% loops seamlessly).
   A copy holds the lane's own pictures, extended from its pool until it
   outruns the lane window. */
function Lane({
  axis,
  lane: { own, pool },
  near,
  clipUrls,
  laneRef,
  trackRef,
}: {
  axis: Axis;
  lane: LanePool;
  near: boolean;
  clipUrls: Record<string, string>;
  laneRef: (el: HTMLDivElement | null) => void;
  trackRef: (el: HTMLDivElement | null) => void;
}) {
  const lane = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const [length, setLength] = useState(Math.max(1, own));
  const lengthRef = useRef(length);
  lengthRef.current = length;

  useLayoutEffect(() => {
    const laneEl = lane.current;
    const trackEl = track.current;
    if (!laneEl || !trackEl || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const size = axis === "y" ? laneEl.clientHeight : laneEl.clientWidth;
      const copy = (axis === "y" ? trackEl.offsetHeight : trackEl.offsetWidth) / 2;
      if (!size || !copy) return;
      // Grow only: the mean tile estimates how many more outrun the window (+5 %).
      if (copy >= size * 1.05) return;
      const mean = copy / lengthRef.current;
      setLength(Math.max(lengthRef.current + 1, Math.ceil((size * 1.05) / mean)));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(laneEl);
    ro.observe(trackEl);
    fit();
    return () => ro.disconnect();
  }, [axis]);

  const copy = pool.length ? Array.from({ length }, (_, i) => pool[i % pool.length]) : [];

  return (
    <div
      className="ev-chapter-story__lane"
      ref={(el) => {
        lane.current = el;
        laneRef(el);
      }}
    >
      <div
        className="ev-chapter-story__track"
        ref={(el) => {
          track.current = el;
          trackRef(el);
        }}
      >
        {[...copy, ...copy].map((item, i) => (
          <Tile key={i} item={item} near={near} clipUrl={item.kind === "video" ? clipUrls[item.src] : undefined} />
        ))}
      </div>
    </div>
  );
}

function Tile({ item, near, clipUrl }: { item: ChapterStoryMedia; near: boolean; clipUrl?: string }) {
  return (
    <figure className="ev-chapter-story__tile" style={{ aspectRatio: item.ratio }} data-kind={item.kind}>
      {item.kind === "video" ? (
        // No autoPlay: the drift controller plays the one clip most in view.
        <video
          src={clipUrl}
          poster={near ? item.poster : undefined}
          loop
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
        />
      ) : (
        <img
          src={near ? item.src : undefined}
          srcSet={near ? item.srcSet : undefined}
          sizes={item.sizes}
          alt=""
          decoding="async"
          draggable={false}
        />
      )}
    </figure>
  );
}

/* ── Drift: one Web Animation per lane on the compositor; the scroll only
   nudges `currentTime`, nothing reads layout per frame. The playing clip is
   derived from the known track offset, not from observers. ─────────────── */

type Clip = { el: HTMLVideoElement; start: number; size: number };
type LaneState = { lane: HTMLElement; track: HTMLElement; motion: LaneMotion; half: number; size: number; anim: Animation | null; clips: Clip[] };

function createDrift(frame: HTMLElement, lanes: HTMLElement[], tracks: HTMLElement[], axis: Axis) {
  const states: LaneState[] = tracks.map((track, i) => ({ lane: lanes[i], track, motion: MOTION[i % MOTION.length], half: 0, size: 0, anim: null, clips: [] }));
  const vertical = axis === "y";
  let active = false;
  let windowH = window.innerHeight;
  let frameH = frame.offsetHeight;
  let lastScrollY = window.scrollY;
  let raf = 0;
  let timer = 0;

  const offsetOf = (s: LaneState) => {
    if (!s.anim || !s.half) return 0;
    const p = mod(Number(s.anim.currentTime ?? 0) * DRIFT_PX_PER_MS, s.half);
    return s.motion.dir < 0 ? -p : p - s.half;
  };

  const sync = () => {
    const playing = active && !document.hidden;
    const candidates: { el: HTMLVideoElement; visible: number }[] = [];
    if (playing) {
      for (const s of states) {
        const at0 = offsetOf(s);
        for (const { el, start, size } of s.clips) {
          const at = start + at0;
          const visible = Math.max(0, Math.min(at + size, s.size) - Math.max(at, 0));
          if (visible > 0 && el.hasAttribute("src")) candidates.push({ el, visible });
        }
      }
    }
    const selected = new Set(candidates.sort((a, b) => b.visible - a.visible).slice(0, MAX_PLAYING).map((c) => c.el));
    // Pause every outgoing clip before starting its replacement: never above the cap.
    for (const s of states) for (const { el } of s.clips) if (!selected.has(el) && !el.paused) el.pause();
    for (const el of selected) if (el.paused) void el.play().catch(() => undefined);
  };

  const measure = (s: LaneState) => {
    const half = (vertical ? s.track.offsetHeight : s.track.offsetWidth) / 2;
    s.size = vertical ? s.lane.clientHeight : s.lane.clientWidth;
    s.clips = Array.from(s.track.querySelectorAll("video"), (el) => {
      const tile = el.parentElement as HTMLElement;
      return { el, start: vertical ? tile.offsetTop : tile.offsetLeft, size: vertical ? tile.offsetHeight : tile.offsetWidth };
    });
    if (!half) {
      s.half = 0;
      return;
    }
    const duration = half / DRIFT_PX_PER_MS;
    if (!s.anim) {
      const [from, to] = s.motion.dir < 0 ? ["0%", "-50%"] : ["-50%", "0%"];
      const at = (v: string) => (vertical ? `translate3d(0, ${v}, 0)` : `translate3d(${v}, 0, 0)`);
      s.anim = s.track.animate([{ transform: at(from) }, { transform: at(to) }], { duration, iterations: Infinity, easing: "linear" });
      s.anim.currentTime = s.motion.phase / DRIFT_PX_PER_MS;
      if (!active) s.anim.pause();
    } else if (half !== s.half && s.half) {
      const old = s.half / DRIFT_PX_PER_MS;
      const fraction = mod(Number(s.anim.currentTime ?? 0), old) / old;
      s.anim.effect?.updateTiming({ duration });
      s.anim.currentTime = fraction * duration;
    }
    s.half = half;
  };

  const applyScroll = () => {
    raf = 0;
    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    if (delta) {
      const travel = (delta * SCROLL_TRAVEL_PX) / (windowH + frameH);
      for (const s of states) {
        if (!s.anim || !s.half) continue;
        const duration = s.half / DRIFT_PX_PER_MS;
        s.anim.currentTime = mod(Number(s.anim.currentTime ?? 0) + (travel * s.motion.speed) / DRIFT_PX_PER_MS, duration);
      }
    }
    sync();
  };

  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(applyScroll);
  };
  const onResize = () => {
    windowH = window.innerHeight;
  };

  const ro = new ResizeObserver(() => {
    frameH = frame.offsetHeight;
    states.forEach(measure);
    sync();
  });
  ro.observe(frame);
  states.forEach((s) => {
    ro.observe(s.lane);
    ro.observe(s.track);
  });
  window.addEventListener("resize", onResize, { passive: true });

  return {
    sync,
    setActive(next: boolean) {
      if (next === active) return;
      active = next;
      if (active) {
        lastScrollY = window.scrollY;
        windowH = window.innerHeight;
        states.forEach((s) => s.anim?.play());
        window.addEventListener("scroll", onScroll, { passive: true });
        timer = window.setInterval(sync, VIDEO_SYNC_MS);
      } else {
        states.forEach((s) => s.anim?.pause());
        window.removeEventListener("scroll", onScroll);
        window.clearInterval(timer);
        cancelAnimationFrame(raf);
        raf = 0;
      }
      sync();
    },
    destroy() {
      this.setActive(false);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      states.forEach((s) => {
        s.anim?.cancel();
        s.clips.forEach(({ el }) => el.pause());
      });
    },
  };
}

/* Every clip renders at least twice (seamless track); separate <video>
   elements on one URL each issue their own range requests. Fetch once per
   session and share an object URL (falls back to the URL itself). */
const clipCache = new Map<string, Promise<string>>();

function useSharedClipUrls(srcs: string[], enabled: boolean): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = srcs.join("|");
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    for (const src of srcs) {
      let p = clipCache.get(src);
      if (!p) {
        p = fetch(src)
          .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(`${res.status} ${src}`))))
          .then((blob) => URL.createObjectURL(blob))
          .catch(() => src);
        clipCache.set(src, p);
      }
      void p.then((url) => {
        if (live) setUrls((prev) => (prev[src] === url ? prev : { ...prev, [src]: url }));
      });
    }
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return urls;
}
