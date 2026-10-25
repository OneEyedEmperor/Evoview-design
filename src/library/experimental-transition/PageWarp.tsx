import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigationType, type Location } from "react-router-dom";
import "./page-warp.css";

/* Page warp (trial): a vacuum swallow. A REC dot opens at the centre of the
   viewport, the page swells for an instant (the inhale), then is sucked
   straight into the dot, pinched toward it like a funnel. The dot spits the
   next page out along the same path, time-reversed, so the inhale becomes a
   soft landing. No spin, no blur.

   One progress value drives everything: p = 0 is the page at rest, p = 1 is
   the page swallowed. Swallowing runs p linearly to 1 and spitting back to 0,
   and every visual is a function of p, so the spit is the exact reverse of
   the swallow and a navigation can retarget mid-flight from wherever p is.

   The router keeps rendering the old location until p reaches 1, so the page
   that falls in is the one being left, whatever triggered the navigation
   (link, navbar, back/forward, programmatic). The stage is the element
   marked `data-page-warp`; a route without one still gets the dot and the
   void. Cost per frame: one transform, one CSS mask and one SVG displacement
   on a viewport-sized region. */

/* One gesture, not a wait: the page accelerates into the dot and the next
   one leaves it at full speed, so the fastest instant is the swap itself.
   No hold at the bottom unless the next page is genuinely not ready. */
const SWALLOW_MS = 380;
const SPIT_MS = 460;
const PREPARE_TIMEOUT_MS = 2500;
const MAP_W = 192;

type Options = {
  /* Locations with the same key are the same page (hash moves, category
     routes of the index): they swap without the warp. */
  pageKey: (location: Location) => string;
  /* Resolves when the incoming page can render without a fallback. The dot
     holds (blinking) in the void until then. */
  prepare?: (location: Location) => Promise<unknown> | void;
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const raf = () => new Promise<number>((r) => requestAnimationFrame(r));
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/* Suction field for feDisplacementMap: every output pixel samples the page
   from further out along its own ray, strongest on an inner ring and fading
   to nothing at the centre and the rim. The page reads as drawn down a
   funnel into the dot: pure radial pull, no turn. Encoded around 0.5 in
   R/G, normalised to the field's maximum, so `scale` is twice the peak
   offset in px. */
function buildSuctionMap(vw: number, vh: number) {
  const w = MAP_W;
  const h = MAP_W;
  // The map spans the viewport diagonal; the field is sized by the short
  // side so a portrait phone never pulls in the page's own side edges.
  const side = Math.hypot(vw, vh);
  const radius = Math.min(side / 2, 0.75 * Math.min(vw, vh));
  const field = new Float32Array(w * h * 2);
  let peak = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = ((x + 0.5) / w - 0.5) * side;
      const py = ((y + 0.5) / h - 0.5) * side;
      const u = clamp(Math.hypot(px, py) / radius);
      const pull = (1 - u) * (1 - u);
      const dx = px * pull;
      const dy = py * pull;
      field[(y * w + x) * 2] = dx;
      field[(y * w + x) * 2 + 1] = dy;
      peak = Math.max(peak, Math.abs(dx), Math.abs(dy));
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    image.data[i * 4] = Math.round(127.5 + (127.5 * field[i * 2]) / peak);
    image.data[i * 4 + 1] = Math.round(127.5 + (127.5 * field[i * 2 + 1]) / peak);
    image.data[i * 4 + 2] = 128;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return { href: canvas.toDataURL("image/png"), peak };
}

type Parts = {
  void: HTMLDivElement;
  ring: HTMLDivElement;
  dot: HTMLDivElement;
  image: SVGFEImageElement;
  displace: SVGFEDisplacementMapElement;
  filter: SVGFilterElement;
};

class Warp {
  p = 0;
  private target = 0;
  private frame = 0;
  private last = 0;
  private waiters: Array<() => void> = [];
  private map: { href: string; peak: number; vw: number; vh: number } | null = null;
  private stage: HTMLElement | null = null;
  private filterId: string;
  parts: Parts | null = null;

  constructor(filterId: string) {
    this.filterId = filterId;
  }

  get busy() {
    return this.p > 0 || this.target > 0;
  }

  go(target: 0 | 1) {
    this.target = target;
    if (target === 1 && this.p === 0) document.documentElement.classList.add("page-warping");
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

  private end() {
    document.documentElement.classList.remove("page-warping");
    if (this.stage) this.clearStage(this.stage);
    this.stage = null;
  }

  private clearStage(stage: HTMLElement) {
    for (const prop of ["transform", "transform-origin", "filter", "mask-image", "-webkit-mask-image", "opacity", "position", "z-index", "will-change"]) {
      stage.style.removeProperty(prop);
    }
  }

  private tick = (now: number) => {
    const dt = Math.min(64, now - this.last);
    this.last = now;
    // Dev only: `__pageWarpSlow = 8` plays the warp in slow motion.
    const slow = import.meta.env.DEV ? ((window as unknown as { __pageWarpSlow?: number }).__pageWarpSlow ?? 1) : 1;
    const span = (this.target > this.p ? SWALLOW_MS : SPIT_MS) * slow;
    const step = dt / span;
    this.p = this.target > this.p ? Math.min(this.target, this.p + step) : Math.max(this.target, this.p - step);
    this.render();
    if (this.p === this.target) {
      this.frame = 0;
      if (this.p === 0) this.end();
      this.waiters.splice(0).forEach((r) => r());
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  /* Build the suction map ahead of the first click so frame one never pays for it. */
  warm() {
    this.ensureMap(window.innerWidth, window.innerHeight);
  }

  private ensureMap(vw: number, vh: number) {
    if (this.map && this.map.vw === vw && this.map.vh === vh) return this.map;
    const built = buildSuctionMap(vw, vh);
    this.map = built ? { ...built, vw, vh } : null;
    if (this.map && this.parts) this.parts.image.setAttribute("href", this.map.href);
    return this.map;
  }

  render() {
    const parts = this.parts;
    if (!parts) return;
    const p = this.p;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const vmin = Math.min(vw, vh);
    const half = Math.hypot(vw, vh) / 2;

    // Overlay: void, suction ring, REC dot.
    const active = p > 0 || this.target > 0;
    parts.void.style.opacity = String(smooth(0.08, 0.9, p));
    parts.void.hidden = !active;
    parts.ring.hidden = !active;
    parts.dot.hidden = !active;
    if (active) {
      const birth = smooth(0, 0.14, p);
      const gulp = Math.exp(-Math.pow((p - 0.94) / 0.05, 2)) * 0.6;
      parts.dot.style.transform = `translate(-50%, -50%) scale(${(birth * (1 + gulp + 0.2 * smooth(0.3, 0.9, p))).toFixed(3)})`;
      parts.dot.toggleAttribute("data-held", p === 1);
    }

    // Stage: the page itself.
    const stage = document.querySelector<HTMLElement>("[data-page-warp]");
    if (stage !== this.stage) {
      if (this.stage) this.clearStage(this.stage);
      this.stage = stage;
    }
    if (!stage) return;
    if (!active) {
      this.clearStage(stage);
      return;
    }
    const map = this.ensureMap(vw, vh);

    // Viewport centre in the stage's own (untransformed) box.
    const left = stage.offsetLeft - window.scrollX;
    const top = stage.offsetTop - window.scrollY;
    const cx = vw / 2 - left;
    const cy = vh / 2 - top;

    // Inhale: a brief swell before the pull. Then the suck, accelerating
    // hard into the dot.
    const inhale = 1 + 0.03 * Math.sin(Math.PI * clamp(p / 0.22));
    const suck = Math.pow(smooth(0.08, 1, p), 1.8);
    const scale = Math.max(0.0005, inhale * (1 - suck));
    const pull = smooth(0.06, 0.6, p);
    const maskR = lerp(half * 1.08, vmin * 0.36, smooth(0.08, 0.6, p));
    // Fading is layer opacity over the void (free on the compositor).
    const fade = (1 - 0.35 * smooth(0.25, 0.9, p)) * (1 - smooth(0.84, 0.985, p));

    // The vacuum's mouth: a thin ring riding the edge of the page as it is
    // drawn in, closing onto the dot.
    const mouth = Math.max(9, maskR * 0.78 * scale);
    parts.ring.style.setProperty("--warp-ring", `${mouth.toFixed(1)}px`);
    parts.ring.style.opacity = (smooth(0.12, 0.35, p) * (1 - smooth(0.88, 1, p))).toFixed(3);

    // Filter only what can reach the screen, plus the farthest the field
    // can pull a pixel from.
    const reach = map ? map.peak * pull : 0;
    const rx = Math.min(maskR, vw / 2 / scale) + reach;
    const ry = Math.min(maskR, vh / 2 / scale) + reach;
    parts.filter.setAttribute("x", (cx - rx).toFixed(1));
    parts.filter.setAttribute("y", (cy - ry).toFixed(1));
    parts.filter.setAttribute("width", (rx * 2).toFixed(1));
    parts.filter.setAttribute("height", (ry * 2).toFixed(1));
    parts.image.setAttribute("x", (cx - half).toFixed(1));
    parts.image.setAttribute("y", (cy - half).toFixed(1));
    parts.image.setAttribute("width", (half * 2).toFixed(1));
    parts.image.setAttribute("height", (half * 2).toFixed(1));
    parts.displace.setAttribute("scale", map ? (2 * map.peak * pull).toFixed(2) : "0");

    const mask = `radial-gradient(circle ${maskR.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, #000 ${(maskR * 0.55).toFixed(1)}px, transparent)`;
    stage.style.setProperty("position", "relative");
    stage.style.setProperty("z-index", "41");
    stage.style.setProperty("will-change", "transform, filter");
    stage.style.setProperty("transform-origin", `${cx.toFixed(1)}px ${cy.toFixed(1)}px`);
    stage.style.setProperty("transform", `scale(${scale.toFixed(4)})`);
    if (map) stage.style.setProperty("filter", `url(#${this.filterId})`);
    stage.style.setProperty("mask-image", mask);
    stage.style.setProperty("-webkit-mask-image", mask);
    stage.style.setProperty("opacity", fade.toFixed(3));
  }
}

/* Returns the location the routes should render (it lags the real one
   while the old page is being swallowed) and the overlay to mount once. */
export function usePageWarp({ pageKey, prepare }: Options): { location: Location; layer: ReactNode } {
  const location = useLocation();
  const action = useNavigationType();
  const [shown, setShown] = useState(location);
  const enabled = typeof window !== "undefined" && window.self === window.top;

  const latest = useRef({ location, action });
  latest.current = { location, action };
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const warp = useRef<Warp | null>(null);
  const running = useRef(false);
  const commits = useRef<Array<() => void>>([]);
  const scrolls = useRef(new Map<string, number>());
  const parts = useRef<Partial<Parts>>({});
  const filterId = "page-warp-suction";

  const keyOf = useRef(pageKey);
  keyOf.current = pageKey;
  const prepareRef = useRef(prepare);
  prepareRef.current = prepare;

  useLayoutEffect(() => {
    if (!enabled) return;
    const w = new Warp(filterId);
    w.parts = parts.current as Parts;
    warp.current = w;
    // Scrub by hand while tuning: __pageWarp.p = 0.5; __pageWarp.render()
    if (import.meta.env.DEV) (window as unknown as { __pageWarp?: Warp }).__pageWarp = w;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let idle = window.setTimeout(() => w.warm(), 800);
    const onResize = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(() => !w.busy && w.warm(), 300);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("resize", onResize);
      w.dispose();
      warp.current = null;
      running.current = false;
      history.scrollRestoration = previous;
    };
  }, [enabled]);

  // Commits of `shown` resolve whoever waits for the swap to land.
  useLayoutEffect(() => {
    commits.current.splice(0).forEach((r) => r());
  }, [shown]);

  const swap = useCallback((next: Location) => {
    const landed = new Promise<void>((r) => commits.current.push(r));
    setShown(next);
    return landed;
  }, []);

  const run = useCallback(async () => {
    const w = warp.current;
    if (!w || running.current) return;
    running.current = true;
    try {
      while (warp.current === w) {
        const { location: next } = latest.current;
        const current = shownRef.current;
        if (keyOf.current(next) === keyOf.current(current) && w.p === 0) {
          if (next !== current) await swap(next);
          break;
        }
        if (keyOf.current(next) !== keyOf.current(current)) {
          if (w.p === 0) scrolls.current.set(current.key, window.scrollY);
          const ready = Promise.race([Promise.resolve(prepareRef.current?.(next)).catch(() => undefined), sleep(PREPARE_TIMEOUT_MS)]);
          await w.go(1);
          if (warp.current !== w) break;
          await ready;
          // Redirects (<Navigate replace>) land while the void still covers.
          for (let guard = 0; guard < 4 && latest.current.location !== shownRef.current; guard++) {
            const target = latest.current;
            await swap(target.location);
            if (target.action === "POP") window.scrollTo(0, scrolls.current.get(target.location.key) ?? 0);
            await raf();
            await raf();
          }
          if (warp.current !== w) break;
        } else if (next !== current) {
          await swap(next);
        }
        await w.go(0);
        if (latest.current.location === shownRef.current) break;
      }
    } finally {
      running.current = false;
    }
  }, [swap]);

  useLayoutEffect(() => {
    if (location === shownRef.current) return;
    const w = warp.current;
    if (!w) {
      setShown(location);
      return;
    }
    if (!running.current && keyOf.current(location) === keyOf.current(shownRef.current) && !w.busy) {
      setShown(location);
      return;
    }
    // A navigation during the spit turns the page back into the dot.
    if (running.current && w.p > 0 && keyOf.current(location) !== keyOf.current(shownRef.current)) void w.go(1);
    void run();
  }, [location, run]);

  // No scrolling while the page is in flight: its geometry is fixed to the viewport.
  useEffect(() => {
    if (!enabled) return;
    const block = (event: Event) => {
      if (warp.current?.busy) event.preventDefault();
    };
    const keys = (event: KeyboardEvent) => {
      if (warp.current?.busy && ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) event.preventDefault();
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

  const layer = enabled
    ? createPortal(
        <div className="page-warp" aria-hidden="true">
          <svg className="page-warp__defs" width="0" height="0" focusable="false">
            <filter
              id={filterId}
              ref={(el) => void (parts.current.filter = el ?? undefined)}
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              {/* Neutral grey under the map: outside it, no pixel moves. */}
              <feFlood floodColor="rgb(128,128,128)" result="still" />
              <feImage ref={(el) => void (parts.current.image = el ?? undefined)} preserveAspectRatio="none" result="map" />
              <feComposite in="map" in2="still" operator="over" result="field" />
              <feDisplacementMap
                ref={(el) => void (parts.current.displace = el ?? undefined)}
                in="SourceGraphic"
                in2="field"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </svg>
          <div className="page-warp__void" hidden ref={(el) => void (parts.current.void = el ?? undefined)} />
          <div className="page-warp__ring" hidden ref={(el) => void (parts.current.ring = el ?? undefined)} />
          <div className="page-warp__dot" hidden ref={(el) => void (parts.current.dot = el ?? undefined)}>
            <span />
          </div>
        </div>,
        document.body,
      )
    : null;

  return { location: enabled ? shown : location, layer };
}
