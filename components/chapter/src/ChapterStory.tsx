import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { cn, preloadMedia, useInViewPause, useMediaQuery, useMediaReady } from "../foundation";
import { Chapter, ChapterHeading, type ChapterHeadingVariant, type ChapterRhythm, type ChapterTone } from "./Chapter";

/* Story chapter: the client's story beside (around, above) lanes of its
   pictures that drift slowly and travel with the scroll. Lanes are vertical
   columns from 1024, sideways rows below. */

/* `srcSet` / `posterSrcSet` ("url 400w, url 800w"): one file per picture is
   picked from its tile size, so the reveal gate decodes exactly the file the
   tile shows. `src` / `poster` alone = one size for every width. */
export type ChapterStoryMedia =
  | { kind: "image"; src: string; srcSet?: string; ratio: string }
  /** `poster` = the clip's first frame (webp); the clip loops forward, seamless. */
  | { kind: "video"; src: string; poster: string; posterSrcSet?: string; ratio: string };

export type ChapterStoryContent = {
  /** Overused 900 uppercase; one `<em>` = the accent word; a `<ChapterMark>` may replace a word. */
  title: ReactNode;
  /** Client mark above the title (decorative, currentColor). */
  emblem?: ReactNode;
  /** Paragraphs. */
  story: ReactNode[];
  /** A signed sentence under the story (founder, chef…). Dropped on phones. */
  quote?: { text: ReactNode; name: string; role?: string };
  /** Atmosphere, dealt round-robin into the lanes (≥ 9 recommended, ≥ 3 videos at most playing one at a time). */
  media: ChapterStoryMedia[];
};

/** Where the text sits against the media. */
export const CHAPTER_STORY_LAYOUTS = ["start", "center", "end", "above"] as const;
export type ChapterStoryLayout = (typeof CHAPTER_STORY_LAYOUTS)[number];
/** ample: fewer, larger lanes · dense: one more lane per side, smaller pictures. */
export const CHAPTER_STORY_DENSITIES = ["ample", "dense"] as const;
export type ChapterStoryDensity = (typeof CHAPTER_STORY_DENSITIES)[number];

export type ChapterStoryProps = {
  content: ChapterStoryContent;
  layout?: ChapterStoryLayout;
  density?: ChapterStoryDensity;
  id?: string;
  tone?: ChapterTone;
  rhythm?: ChapterRhythm;
  accent?: string;
  headingVariant?: ChapterHeadingVariant;
  level?: 2 | 3;
  className?: string;
  /** Frozen lanes: clips show their poster, nothing drifts or plays. For pages that stack many demos. */
  still?: boolean;
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
/* Files are picked for the tile × device pixel ratio, capped: a third
   pixel per point is not worth its bytes. */
const MAX_DPR = 2;

const mod = (n: number, m: number) => ((n % m) + m) % m;

type Candidate = { url: string; w: number };
const candidates = (src: string, srcSet?: string): Candidate[] => {
  const list = (srcSet ?? "")
    .split(",")
    .map((part) => part.trim().split(/\s+/))
    .map(([url, d]) => ({ url, w: parseFloat(d ?? "") }))
    .filter((c) => c.url && c.w > 0)
    .sort((a, b) => a.w - b.w);
  return list.length ? list : [{ url: src, w: Infinity }];
};
const aspect = (ratio: string) => {
  const [w, h = 1] = ratio.split("/").map((n) => parseFloat(n));
  return w > 0 && h > 0 ? w / h : 1;
};
/* The smallest file at least `need` px wide, else the largest. */
const pick = (m: ChapterStoryMedia, need: number): Candidate => {
  const list = m.kind === "image" ? candidates(m.src, m.srcSet) : candidates(m.poster, m.posterSrcSet);
  return list.find((c) => c.w >= need) ?? list[list.length - 1];
};

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
  still = false,
}: ChapterStoryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const columns = useMediaQuery("(min-width: 1024px)", true);
  const { axis, groups } = plan(layout, density, columns);
  const laneCount = groups.reduce((n, g) => n + g.lanes.length, 0);
  const media = useMemo(
    () =>
      still
        ? content.media.map((m): ChapterStoryMedia => (m.kind === "video" ? { kind: "image", src: m.poster, srcSet: m.posterSrcSet, ratio: m.ratio } : m))
        : content.media,
    [content.media, still],
  );
  const lanes = useMemo(() => deal(media, laneCount), [media, laneCount]);

  const { active: revealed } = useInViewPause(rootRef, { once: true, threshold: 0.15 });
  /* Stills and posters are fetched only once the chapter comes within 400px. */
  const { active: near } = useInViewPause(rootRef, { once: true, rootMargin: "400px 0px", ignoreSuspension: true });

  /* Widest column / tallest row seen so far (device px), from the lanes. */
  const [box, setBox] = useState({ x: 0, y: 0 });
  const onBox = useCallback((dim: Axis, px: number) => setBox((b) => (px > b[dim] ? { ...b, [dim]: px } : b)), []);
  const [latched, setLatched] = useState(false);
  const picks = usePicks(media, axis, box[axis], latched);
  const stills = useMemo(() => (picks ? media.map((m) => picks.get(m)) : []), [media, picks]);
  const gate = useMediaReady(near && !!picks, stills);
  const ready = revealed && (gate.ready || gate.failed);
  useEffect(() => {
    if (ready) setLatched(true);
  }, [ready]);
  const shown = latched || ready;

  /* A clip is fetched the first time it is the one to play. */
  const [wanted, setWanted] = useState<string[]>([]);
  const onWant = useCallback((src: string) => setWanted((w) => (w.includes(src) ? w : [...w, src])), []);
  const clipUrls = useSharedClipUrls(wanted);

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
          stills={near ? picks : null}
          shown={shown}
          clipUrls={clipUrls}
          frameRef={rootRef}
          still={still}
          onBox={onBox}
          onWant={onWant}
        />
      </div>
    </Chapter>
  );
}

const delay = (ms: number) => ({ "--ev-chapter-story-delay": `${ms}ms` }) as CSSProperties;

/* One file per picture for the current tile size: never a step down, and a
   step up (a resize, dense → ample) is decoded before it replaces a shown
   file, so the lanes never blank. */
function usePicks(media: ChapterStoryMedia[], axis: Axis, need: number, shown: boolean): Map<ChapterStoryMedia, string> | null {
  // By content, not identity: a config rebuilt on every render keeps its picks.
  const sig = media.map((m) => (m.kind === "image" ? `${m.src} ${m.srcSet ?? ""}` : `${m.poster} ${m.posterSrcSet ?? ""}`)).join("|");
  const [held, setHeld] = useState<{ sig: string; picks: Candidate[] } | null>(null);
  const base = held?.sig === sig ? held.picks : null;
  const next = useMemo(() => {
    if (!need) return null;
    const target = media.map((m) => pick(m, axis === "y" ? need : need * aspect(m.ratio)));
    const merged = target.map((c, i) => (base && base[i].w >= c.w ? base[i] : c));
    return base && merged.every((c, i) => c === base[i]) ? null : merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, axis, need, base]);

  useEffect(() => {
    if (!next) return;
    if (!base || !shown) {
      setHeld({ sig, picks: next });
      return;
    }
    let live = true;
    void preloadMedia(next.filter((c, i) => c !== base[i]).map((c) => c.url)).then(() => {
      if (live) setHeld({ sig, picks: next });
    });
    return () => {
      live = false;
    };
  }, [next, base, shown, sig]);

  return useMemo(() => (base ? new Map(media.map((m, i) => [m, base[i].url])) : null), [media, base]);
}

type DriftHooks = { onBox: (axis: Axis, px: number) => void; onWant: (src: string) => void };

function Mosaic({
  axis,
  groups,
  lanes,
  stills,
  shown,
  clipUrls,
  frameRef,
  still,
  onBox,
  onWant,
}: {
  axis: Axis;
  still: boolean;
  groups: Group[];
  lanes: LanePool[];
  /** File per picture, once the chapter is near (null: no fetch yet). */
  stills: Map<ChapterStoryMedia, string> | null;
  shown: boolean;
  clipUrls: Record<string, string>;
  frameRef: RefObject<HTMLDivElement | null>;
} & DriftHooks) {
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
    const instance = createDrift(frame, lanesEls as HTMLElement[], tracks as HTMLElement[], axis, { onBox, onWant });
    controller.current = instance;
    return () => {
      instance.destroy();
      controller.current = null;
    };
  }, [axis, count, frameRef, onBox, onWant]);

  // Still: the lanes keep their paused animation at its starting phase, a frozen frame with no per-frame cost.
  useEffect(() => {
    controller.current?.setActive(active && shown && !still);
  }, [active, shown, still]);

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
              stills={stills}
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
  stills,
  clipUrls,
  laneRef,
  trackRef,
}: {
  axis: Axis;
  lane: LanePool;
  stills: Map<ChapterStoryMedia, string> | null;
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
          <Tile key={i} item={item} still={stills?.get(item)} clipUrl={item.kind === "video" ? clipUrls[item.src] : undefined} />
        ))}
      </div>
    </div>
  );
}

function Tile({ item, still, clipUrl }: { item: ChapterStoryMedia; still?: string; clipUrl?: string }) {
  return (
    <figure className="ev-chapter-story__tile" style={{ aspectRatio: item.ratio }} data-kind={item.kind}>
      {item.kind === "video" ? (
        // No autoPlay: the drift controller plays the one clip most in view.
        <video
          src={clipUrl}
          poster={still}
          data-clip={item.src}
          loop
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
        />
      ) : (
        <img src={still} alt="" decoding="async" draggable={false} />
      )}
    </figure>
  );
}

/* ── Drift: one Web Animation per lane on the compositor; the scroll only
   nudges `currentTime`, nothing reads layout per frame. The playing clip is
   derived from the known track offset, not from observers. ─────────────── */

type Clip = { el: HTMLVideoElement; start: number; size: number };
type LaneState = { lane: HTMLElement; track: HTMLElement; motion: LaneMotion; half: number; size: number; anim: Animation | null; clips: Clip[] };

function createDrift(frame: HTMLElement, lanes: HTMLElement[], tracks: HTMLElement[], axis: Axis, hooks: DriftHooks) {
  const states: LaneState[] = tracks.map((track, i) => ({ lane: lanes[i], track, motion: MOTION[i % MOTION.length], half: 0, size: 0, anim: null, clips: [] }));
  const vertical = axis === "y";
  const asked = new Set<string>();
  let active = false;
  let windowH = window.innerHeight;
  let frameH = frame.offsetHeight;
  let lastScrollY = window.scrollY;
  let scrollY = lastScrollY;
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
          if (visible > 0) candidates.push({ el, visible });
        }
      }
    }
    const selected = new Set(candidates.sort((a, b) => b.visible - a.visible).slice(0, MAX_PLAYING).map((c) => c.el));
    // Pause every outgoing clip before starting its replacement: never above the cap.
    for (const s of states) for (const { el } of s.clips) if (!selected.has(el) && !el.paused) el.pause();
    for (const el of selected) {
      // Not fetched yet: ask once and hold the poster (its first frame) until it arrives.
      if (!el.getAttribute("src")) {
        const clip = el.dataset.clip;
        if (clip && !asked.has(clip)) {
          asked.add(clip);
          hooks.onWant(clip);
        }
      } else if (el.paused) void el.play().catch(() => undefined);
    }
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

  // The offset is read in the scroll event (layout is clean there), the
  // frame callback only writes.
  const onScroll = () => {
    scrollY = window.scrollY;
    if (!raf) raf = requestAnimationFrame(applyScroll);
  };
  const onResize = () => {
    windowH = window.innerHeight;
  };

  const ro = new ResizeObserver(() => {
    frameH = frame.offsetHeight;
    states.forEach(measure);
    // Tile size for the file pick: column width / row height, device px.
    const cross = Math.max(0, ...states.map((s) => (vertical ? s.lane.clientWidth : s.lane.clientHeight)));
    if (cross) hooks.onBox(axis, cross * Math.min(window.devicePixelRatio || 1, MAX_DPR));
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
        lastScrollY = scrollY = window.scrollY;
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

function useSharedClipUrls(srcs: string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = srcs.join("|");
  useEffect(() => {
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
  }, [key]);
  return urls;
}
