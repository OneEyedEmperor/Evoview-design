import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigationType, type Location } from "react-router-dom";
import "./channel-switch.css";

/* Channel switch (trial): changing page reads as zapping a digital TV. The
   picture breaks into macroblocks that grow in hard steps, its colour planes
   slip apart and the frame jitters; tiles of static replace it band by band
   until the screen is pure snow. The next page tunes in out of coarse blocks,
   resolving step by step while it rolls down into place.

   One progress value drives everything: p = 0 is the page at rest, p = 1 is
   the screen fully in static. Leaving runs p to 1, arriving runs it back to
   0, so a navigation can retarget mid-flight from wherever p is. The router
   keeps rendering the old location until p reaches 1. The stage is the
   element marked `data-channel-stage`; a route without one still gets the
   static. The navbar stays above it all, crisp, like the set's OSD. */

const OUT_MS = 260;
const IN_MS = 440;
const PREPARE_TIMEOUT_MS = 2500;
/* Static grain and the tiles it arrives in, in CSS px. */
const GRAIN = 3;
const TILE_GRAINS = 16;
/* Macroblock sizes in px, one hard step each: never interpolated. */
const BLOCKS = [6, 10, 16, 24, 36, 52];
const NOISE_BANK = 1 << 16;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const raf = () => new Promise<number>((r) => requestAnimationFrame(r));
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/* Mosaic without a per-pixel neighbourhood: one block of a displacement
   map whose R/G point every pixel at the block's centre, tiled over the
   viewport. Encoded around 0.5 with feDisplacementMap scale = block size. */
function buildBlockMap(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(size, size);
  // Whole-pixel offsets onto the centre pixel, so 8-bit rounding never
  // tips a sample into its neighbour (that reads as stripes in a block).
  const mid = Math.floor(size / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      image.data[i] = Math.round(255 * clamp(0.5 + (mid - x) / size));
      image.data[i + 1] = Math.round(255 * clamp(0.5 + (mid - y) / size));
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

type Parts = {
  layer: HTMLDivElement;
  snow: HTMLCanvasElement;
  scan: HTMLDivElement;
  filter: SVGFilterElement;
  cell: SVGFEImageElement;
  shift: SVGFEDisplacementMapElement;
  red: SVGFEOffsetElement;
  cyan: SVGFEOffsetElement;
};

class Channel {
  p = 0;
  private target = 0;
  private frame = 0;
  private last = 0;
  private waiters: Array<() => void> = [];
  private stage: HTMLElement | null = null;
  private filterId: string;
  private bank: Uint32Array | null = null;
  private image: ImageData | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private tiles: Float32Array = new Float32Array(0);
  private cols = 0;
  private rows = 0;
  private maps: string[] = [];
  parts: Parts | null = null;

  constructor(filterId: string) {
    this.filterId = filterId;
  }

  get busy() {
    return this.p > 0 || this.target > 0;
  }

  go(target: 0 | 1) {
    if (target === 1 && this.p === 0) {
      document.documentElement.classList.add("channel-switching");
      this.shuffle();
    }
    this.target = target;
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
    return new Promise<void>((resolve) => this.waiters.push(resolve));
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.p = 0;
    this.target = 0;
    this.render();
    this.end();
    this.waiters.splice(0).forEach((r) => r());
  }

  /* Grey snow and the block maps, built once; each frame reads the snow
     from a random offset. */
  warm() {
    if (this.bank) return;
    this.maps = BLOCKS.map(buildBlockMap);
    const bank = new Uint32Array(NOISE_BANK + 4096);
    for (let i = 0; i < bank.length; i++) {
      const r = Math.random();
      const v = Math.round(r * r * 235 + 12);
      bank[i] = (255 << 24) | (v << 16) | (v << 8) | v;
    }
    this.bank = bank;
  }

  private end() {
    document.documentElement.classList.remove("channel-switching");
    if (this.stage) this.clearStage(this.stage);
    this.stage = null;
  }

  private clearStage(stage: HTMLElement) {
    for (const prop of ["transform", "filter", "will-change"]) stage.style.removeProperty(prop);
  }

  /* Each tile gets the moment it turns to static: half its own luck, half
     its row's, so the snow tears in horizontal bands like a lost signal. */
  private shuffle() {
    const parts = this.parts;
    if (!parts) return;
    const cols = Math.ceil(window.innerWidth / (GRAIN * TILE_GRAINS));
    const rows = Math.ceil(window.innerHeight / (GRAIN * TILE_GRAINS));
    const tiles = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      const band = Math.random();
      for (let x = 0; x < cols; x++) tiles[y * cols + x] = 0.55 * Math.random() + 0.45 * band;
    }
    this.tiles = tiles;
    this.cols = cols;
    this.rows = rows;
    const w = Math.ceil(window.innerWidth / GRAIN);
    const h = Math.ceil(window.innerHeight / GRAIN);
    if (parts.snow.width !== w || parts.snow.height !== h) {
      parts.snow.width = w;
      parts.snow.height = h;
      this.ctx = null;
    }
    this.ctx ??= parts.snow.getContext("2d");
    this.image = this.ctx ? this.ctx.createImageData(w, h) : null;
  }

  private tick = (now: number) => {
    const dt = Math.min(64, now - this.last);
    this.last = now;
    // Dev only: `__channelSlow = 8` plays the switch in slow motion.
    const slow = import.meta.env.DEV ? ((window as unknown as { __channelSlow?: number }).__channelSlow ?? 1) : 1;
    const span = (this.target > this.p ? OUT_MS : IN_MS) * slow;
    const step = dt / span;
    this.p = this.target > this.p ? Math.min(this.target, this.p + step) : Math.max(this.target, this.p - step);
    this.render();
    // Static keeps crawling while the next page is still on its way.
    if (this.p === this.target && this.p === 1) {
      this.waiters.splice(0).forEach((r) => r());
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    if (this.p === this.target) {
      this.frame = 0;
      this.end();
      this.waiters.splice(0).forEach((r) => r());
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private paintSnow(coverage: number) {
    const { ctx, image, bank } = this;
    if (!ctx || !image || !bank) return;
    const w = image.width;
    const h = image.height;
    const out = new Uint32Array(image.data.buffer);
    const offset = Math.floor(Math.random() * NOISE_BANK);
    // Rolling sync: a brighter band drifts down the snow.
    const roll = (performance.now() / 6) % h;
    for (let ty = 0; ty < this.rows; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        const on = this.tiles[ty * this.cols + tx] < coverage;
        const x0 = tx * TILE_GRAINS;
        const x1 = Math.min(w, x0 + TILE_GRAINS);
        const y1 = Math.min(h, (ty + 1) * TILE_GRAINS);
        for (let y = ty * TILE_GRAINS; y < y1; y++) {
          const row = y * w;
          if (!on) {
            out.fill(0, row + x0, row + x1);
            continue;
          }
          const lift = Math.abs(y - roll) < h * 0.06 ? 0x00202020 : 0;
          const src = (offset + row * 7 + x0 * 3) % NOISE_BANK;
          for (let x = x0; x < x1; x++) out[row + x] = bank[src + x - x0] | lift;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  render() {
    const parts = this.parts;
    if (!parts) return;
    const p = this.p;
    const arriving = this.target < p;
    const active = p > 0 || this.target > 0;
    parts.layer.hidden = !active;

    const coverage = smooth(0.42, 0.97, p);
    if (active) {
      this.paintSnow(coverage);
      parts.scan.style.opacity = (0.85 * smooth(0.04, 0.4, p)).toFixed(3);
    }

    const stage = document.querySelector<HTMLElement>("[data-channel-stage]");
    if (stage !== this.stage) {
      if (this.stage) this.clearStage(this.stage);
      this.stage = stage;
    }
    if (!stage) return;
    if (!active) {
      this.clearStage(stage);
      return;
    }

    // Picture breakup: hard steps through the block sizes.
    const level = Math.min(BLOCKS.length - 1, Math.floor(clamp((p - 0.06) / 0.8) * BLOCKS.length));
    const block = p <= 0.06 || !this.maps[level] ? 0 : BLOCKS[level];
    const split = Math.round(2 + 6 * smooth(0.06, 0.5, p));
    const shake = smooth(0.08, 0.45, p) * (1 - smooth(0.85, 1, p));
    const jx = Math.round((Math.random() - 0.5) * 2 * 9 * shake);
    const jy = arriving ? Math.round(0.05 * window.innerHeight * smooth(0, 0.7, p)) : 0;

    stage.style.setProperty("will-change", "transform, filter");
    stage.style.setProperty("transform", `translate3d(${jx}px, ${jy}px, 0)`);
    if (!block) {
      stage.style.removeProperty("filter");
      return;
    }

    // Filter only the viewport, in the stage's own (untransformed) box.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = window.scrollX - stage.offsetLeft;
    const y = window.scrollY - stage.offsetTop;
    const pad = BLOCKS[BLOCKS.length - 1];
    parts.filter.setAttribute("x", String(x - pad));
    parts.filter.setAttribute("y", String(y - pad));
    parts.filter.setAttribute("width", String(vw + 2 * pad));
    parts.filter.setAttribute("height", String(vh + 2 * pad));
    if (parts.cell.getAttribute("width") !== String(block)) {
      parts.cell.setAttribute("href", this.maps[level]);
      parts.cell.setAttribute("width", String(block));
      parts.cell.setAttribute("height", String(block));
    }
    parts.cell.setAttribute("x", String(x));
    parts.cell.setAttribute("y", String(y));
    parts.shift.setAttribute("scale", String(block));
    parts.red.setAttribute("dx", String(split));
    parts.cyan.setAttribute("dx", String(-split));
    stage.style.setProperty("filter", `url(#${this.filterId})`);
  }
}

/* Returns the location the routes should render (it lags the real one
   while the old channel goes to static) and the overlay to mount once. */
export function useChannelSwitch({ pageKey, prepare }: {
  /* Locations with the same key are the same page (hash moves, category
     routes of the index): they swap without the switch. */
  pageKey: (location: Location) => string;
  /* Resolves when the incoming page can render without a fallback. The
     static holds until then. */
  prepare?: (location: Location) => Promise<unknown> | void;
}): { location: Location; layer: ReactNode } {
  const location = useLocation();
  const action = useNavigationType();
  const [shown, setShown] = useState(location);
  const [enabled] = useState(
    () => typeof window !== "undefined" && window.self === window.top && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const latest = useRef({ location, action });
  latest.current = { location, action };
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const channel = useRef<Channel | null>(null);
  const running = useRef(false);
  const commits = useRef<Array<() => void>>([]);
  const scrolls = useRef(new Map<string, number>());
  const parts = useRef<Partial<Parts>>({});
  const filterId = "channel-switch-blocks";

  const keyOf = useRef(pageKey);
  keyOf.current = pageKey;
  const prepareRef = useRef(prepare);
  prepareRef.current = prepare;

  useLayoutEffect(() => {
    if (!enabled) return;
    const c = new Channel(filterId);
    c.parts = parts.current as Parts;
    channel.current = c;
    // Scrub by hand while tuning: __channel.p = 0.5; __channel.render()
    if (import.meta.env.DEV) (window as unknown as { __channel?: Channel }).__channel = c;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const idle = window.setTimeout(() => c.warm(), 600);
    return () => {
      window.clearTimeout(idle);
      c.dispose();
      channel.current = null;
      running.current = false;
      history.scrollRestoration = previous;
    };
  }, [enabled]);

  useLayoutEffect(() => {
    commits.current.splice(0).forEach((r) => r());
  }, [shown]);

  const swap = useCallback((next: Location) => {
    const landed = new Promise<void>((r) => commits.current.push(r));
    setShown(next);
    return landed;
  }, []);

  const run = useCallback(async () => {
    const c = channel.current;
    if (!c || running.current) return;
    running.current = true;
    c.warm();
    try {
      while (channel.current === c) {
        const { location: next } = latest.current;
        const current = shownRef.current;
        if (keyOf.current(next) === keyOf.current(current) && c.p === 0) {
          if (next !== current) await swap(next);
          break;
        }
        if (keyOf.current(next) !== keyOf.current(current)) {
          if (c.p === 0) scrolls.current.set(current.key, window.scrollY);
          const ready = Promise.race([Promise.resolve(prepareRef.current?.(next)).catch(() => undefined), sleep(PREPARE_TIMEOUT_MS)]);
          await c.go(1);
          if (channel.current !== c) break;
          await ready;
          // Redirects (<Navigate replace>) land while the static still covers.
          for (let guard = 0; guard < 4 && latest.current.location !== shownRef.current; guard++) {
            const target = latest.current;
            await swap(target.location);
            if (target.action === "POP") window.scrollTo(0, scrolls.current.get(target.location.key) ?? 0);
            await raf();
            await raf();
          }
          if (channel.current !== c) break;
        } else if (next !== current) {
          await swap(next);
        }
        await c.go(0);
        if (latest.current.location === shownRef.current) break;
      }
    } finally {
      running.current = false;
    }
  }, [swap]);

  useLayoutEffect(() => {
    if (location === shownRef.current) return;
    const c = channel.current;
    if (!c) {
      setShown(location);
      return;
    }
    if (!running.current && keyOf.current(location) === keyOf.current(shownRef.current) && !c.busy) {
      setShown(location);
      return;
    }
    // Zapping again while the page tunes in sends it back to static.
    if (running.current && c.p > 0 && keyOf.current(location) !== keyOf.current(shownRef.current)) void c.go(1);
    void run();
  }, [location, run]);

  // No scrolling mid-switch: the filter is fitted to the viewport.
  useEffect(() => {
    if (!enabled) return;
    const block = (event: Event) => {
      if (channel.current?.busy) event.preventDefault();
    };
    const keys = (event: KeyboardEvent) => {
      if (channel.current?.busy && ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) event.preventDefault();
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", keys);
    };
  }, [enabled]);

  const set = <K extends keyof Parts>(key: K) => (el: Parts[K] | null) => void (parts.current[key] = el ?? undefined);

  const layer = enabled
    ? createPortal(
        <div className="channel-switch" aria-hidden="true">
          <svg className="channel-switch__defs" width="0" height="0" focusable="false">
            <filter id={filterId} ref={set("filter")} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feImage ref={set("cell")} preserveAspectRatio="none" />
              <feTile result="field" />
              <feDisplacementMap ref={set("shift")} in="SourceGraphic" in2="field" xChannelSelector="R" yChannelSelector="G" result="blocks" />
              <feColorMatrix in="blocks" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
              <feOffset ref={set("red")} result="red" />
              <feColorMatrix in="blocks" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
              <feOffset ref={set("cyan")} result="cyan" />
              <feComposite in="red" in2="cyan" operator="arithmetic" k2="1" k3="1" />
            </filter>
          </svg>
          <div className="channel-switch__layer" hidden ref={set("layer")}>
            <canvas className="channel-switch__snow" ref={set("snow")} />
            <div className="channel-switch__scan" ref={set("scan")} />
          </div>
        </div>,
        document.body,
      )
    : null;

  return { location: enabled ? shown : location, layer };
}
