import { useEffect, useId, useRef, type MutableRefObject } from "react";
import type { OrbFillController } from "../../components/foundation/src/OrbFill";

/* Accent fill of the seam between a card's well and its caption, on hover
   or keyboard focus: a plain bar runs in from the left; at the orb's ring it
   splits into two arcs (top and bottom) that meet on the far side, then the
   bar runs on to the right edge, all at one speed on one eased timeline; it
   drains back the same way. The orb's liquid fill (foundation OrbFill,
   passed as `orb`) is driven by the wrap, so it rises as the arcs go round.
   The rest ring is drawn here, so the arcs can fill it under the orb disc.
   Geometry is measured from the sibling well/caption/orb. */

type Orb = { cx: number; r: number; R: number };
type Geo = { W: number; h: number; rw: number; rc: number; orb: Orb | null; seam: boolean };

/* Path slots: 0 bar, 4–5 the end notches (all clipped to the seam's
   silhouette); 1 ring pie, 2–3 the arcs' leading caps. */
const SLOTS = 6;
const CLIPPED = [0, 4, 5];
const RING = [1, 2, 3];
const DURATION = 1000;

const pt = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

function circle(x: number, y: number, r: number) {
  if (r <= 0) return "";
  return `M${pt(x - r, y)}A${r},${r} 0 1 1 ${pt(x + r, y)}A${r},${r} 0 1 1 ${pt(x - r, y)}Z`;
}

function pill(x0: number, x1: number, h: number) {
  const w = x1 - x0;
  if (w <= 0.5) return "";
  const rx = Math.min(h / 2, w / 2);
  const ry = h / 2;
  return (
    `M${pt(x0 + rx, -ry)}H${(x1 - rx).toFixed(2)}A${rx},${ry} 0 0 1 ${pt(x1 - rx, ry)}` +
    `H${(x0 + rx).toFixed(2)}A${rx},${ry} 0 0 1 ${pt(x0 + rx, -ry)}Z`
  );
}

/* The gap between the well and the caption as one shape: the band plus,
   at each end, the notch left between the well's bottom corners (rw) and
   the caption's top corners (rc). */
function seamShape(W: number, h: number, rw: number, rc: number) {
  const yT = -h / 2;
  const yB = h / 2;
  return (
    `M${pt(0, yT - rw)}A${rw},${rw} 0 0 0 ${pt(rw, yT)}H${(W - rw).toFixed(2)}` +
    `A${rw},${rw} 0 0 0 ${pt(W, yT - rw)}V${(yB + rc).toFixed(2)}` +
    `A${rc},${rc} 0 0 0 ${pt(W - rc, yB)}H${rc.toFixed(2)}` +
    `A${rc},${rc} 0 0 0 ${pt(0, yB + rc)}Z`
  );
}

const rect = (x0: number, x1: number, half: number) =>
  x1 - x0 > 0.01 ? `M${pt(x0, -half)}H${x1.toFixed(2)}V${half.toFixed(2)}H${x0.toFixed(2)}Z` : "";

/* The ring filled from its leftmost point through ±theta: a pie (the inner
   part sits under the orb disc). */
function pie(cx: number, R: number, theta: number) {
  if (theta <= 0.001) return "";
  if (theta >= Math.PI - 0.001) return circle(cx, 0, R);
  const a1 = Math.PI - theta;
  const a2 = Math.PI + theta;
  return (
    `M${pt(cx, 0)}L${pt(cx + R * Math.cos(a1), R * Math.sin(a1))}` +
    `A${R},${R} 0 ${theta > Math.PI / 2 ? 1 : 0} 1 ${pt(cx + R * Math.cos(a2), R * Math.sin(a2))}Z`
  );
}

export default function SeamFlow({ orb: orbFill }: { orb?: MutableRefObject<OrbFillController | null> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const clipRef = useRef<SVGPathElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const clipId = `seam-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const svg = svgRef.current;
    const card = svg?.parentElement;
    if (!svg || !card) return;
    const well = card.querySelector<HTMLElement>(".lib-well");
    const caption = card.querySelector<HTMLElement>(".lib-card__caption");
    const orbEl = card.querySelector<HTMLElement>(".lib-card__orb");
    if (!well || !caption) return;

    let geo: Geo = { W: 0, h: 0, rw: 0, rc: 0, orb: null, seam: false };
    let p = 0;
    let from = 0;
    let target = 0;
    let start = 0;
    let dur = 0;
    let raf = 0;
    let hovered = false;
    let focused = false;

    const measure = () => {
      const c = card.getBoundingClientRect();
      const w = well.getBoundingClientRect();
      const cap = caption.getBoundingClientRect();
      /* Bled 0.75px under each edge so fractional seams show no fringe. */
      const h = Math.max(1, cap.top - w.bottom) + 1.5;
      let orb: Orb | null = null;
      if (orbEl) {
        const o = orbEl.getBoundingClientRect();
        const r = o.width / 2;
        const ring = 0.3 * parseFloat(getComputedStyle(orbEl).fontSize);
        orb = { cx: o.left + r - c.left, r, R: r + ring };
      }
      const rw = Math.min(c.width / 2, parseFloat(getComputedStyle(well).borderBottomLeftRadius) || 0);
      const rc = Math.min(c.width / 2, parseFloat(getComputedStyle(caption).borderTopLeftRadius) || 0);
      geo = { W: c.width, h, rw, rc, orb, seam: getComputedStyle(svg).display !== "none" };
      const pad = Math.ceil(Math.max(orb ? orb.R + 2 : 0, h / 2 + Math.max(rw, rc) + 2));
      clipRef.current?.setAttribute("d", seamShape(c.width, h, rw, rc));
      svg.style.top = `${(w.bottom + cap.top) / 2 - c.top - pad}px`;
      svg.style.width = `${c.width}px`;
      svg.style.height = `${pad * 2}px`;
      svg.setAttribute("viewBox", `0 ${-pad} ${c.width} ${pad * 2}`);
      const ring = ringRef.current;
      if (ring) {
        ring.setAttribute("cx", orb ? String(orb.cx) : "0");
        ring.setAttribute("r", orb ? String(orb.R) : "0");
      }
    };

    /* One distance for the whole run: up to the ring, around it (both arcs
       at the bar's speed, on the ring's mid radius), then out to the edge. */
    const layout = () => {
      const { W, h, orb } = geo;
      if (!orb) return { L: W, enter: 0, s2: 0, exit0: 0, rm: 1 };
      const rm = (orb.R + orb.r) / 2;
      const enter = orb.cx - orb.R;
      const s2 = enter + Math.PI * rm;
      const exit0 = orb.cx + orb.R - h / 2;
      return { L: s2 + Math.max(0, W - exit0), enter, s2, exit0, rm };
    };

    /* Seam shapes; returns the orb's target fill (0–1). */
    const renderSeam = () => {
      const { W, h, rw, rc, orb } = geo;
      const { L, enter, s2, exit0, rm } = layout();
      const s = p * L;
      const d: string[] = Array(SLOTS).fill("");
      let F = s;
      let theta = 0;
      if (orb) {
        theta = clamp((s - enter) / rm, 0, Math.PI);
        F = s <= s2 ? Math.min(s, orb.cx) : exit0 + (s - s2);
        d[1] = pie(orb.cx, orb.R + 0.5, theta);
        if (theta > 0.001 && theta < Math.PI - 0.001) {
          const cr = (orb.R - orb.r) / 2 + 0.25;
          d[2] = circle(orb.cx + rm * Math.cos(Math.PI - theta), rm * Math.sin(Math.PI - theta), cr);
          d[3] = circle(orb.cx + rm * Math.cos(Math.PI + theta), rm * Math.sin(Math.PI + theta), cr);
        }
      }
      F = Math.min(F, W);
      d[0] = pill(0, F, h);
      /* At the ends the front runs flat through the corner notch (the clip
         gives it the corners' exact curves), so the gap fills edge to edge. */
      const notch = Math.max(rw, rc);
      const half = h / 2 + notch + 1;
      if (F > 0.5) d[4] = rect(-1, Math.min(F, notch), half);
      if (F > W - notch) d[5] = rect(W - notch, F >= W - 0.5 ? W + 1 : F, half);
      pathRefs.current.forEach((el, i) => {
        if (el && el.getAttribute("d") !== d[i]) el.setAttribute("d", d[i]);
      });
      /* Phones hide the seam: the orb then just follows the timeline. */
      return geo.seam ? theta / Math.PI : p;
    };

    const tick = (t: number) => {
      const k = dur > 0 ? clamp((t - start) / dur, 0, 1) : 1;
      p = from + (target - from) * ease(k);
      orbFill?.current?.to(renderSeam());
      if (k >= 1) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const update = () => {
      const next = hovered || focused ? 1 : 0;
      if (next === target) return;
      target = next;
      from = p;
      start = performance.now();
      dur = Math.max(250, DURATION * Math.abs(target - from));
      if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hovered = true;
      update();
    };
    const onLeave = () => {
      hovered = false;
      update();
    };
    const onFocus = () => {
      focused = card.matches(":focus-visible");
      update();
    };
    const onBlur = () => {
      focused = false;
      update();
    };

    measure();
    renderSeam();
    const ro = new ResizeObserver(() => {
      measure();
      renderSeam();
    });
    ro.observe(card);
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    card.addEventListener("focus", onFocus);
    card.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      card.removeEventListener("focus", onFocus);
      card.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <svg ref={svgRef} className="lib-flow" aria-hidden="true" focusable="false">
      <circle ref={ringRef} className="lib-flow__ring" cy="0" />
      <defs>
        <clipPath id={clipId}>
          <path ref={clipRef} />
        </clipPath>
      </defs>
      <g className="lib-flow__liquid" clipPath={`url(#${clipId})`}>
        {CLIPPED.map((i) => (
          <path key={i} ref={(el) => void (pathRefs.current[i] = el)} />
        ))}
      </g>
      <g className="lib-flow__liquid">
        {RING.map((i) => (
          <path key={i} ref={(el) => void (pathRefs.current[i] = el)} />
        ))}
      </g>
    </svg>
  );
}
