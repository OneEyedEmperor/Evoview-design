/* The eye's geometry, computed from structure alone (CONTRACT: positions are
   never stored). Everything here is in unit polar space: r in units of the
   eye's radius R (rim ≈ 1, core = 0), θ in degrees, 0 = east, clockwise.
   No map id, word or colour lives here; meaning is read from fields. */

import { isLayerRef, refId } from "../model/rules";
import { BEYOND, type Element, type Id, type SanctumState, type Thread, type ThreadKind } from "../model/types";

/* ---------- what each cord kind does, read from its fields ---------- */

export type CordRole =
  | "return" /* signs travel into the core */
  | "steer" /* pulses leave the core */
  | "bond" /* still, between equals */
  | "oath" /* still, directed, never removed */
  | "union" /* both ways */
  | "thrust" /* exists in one condition only */
  | "held" /* a single course onto the apex: strain, never a pulse */
  | "gather" /* many courses onto the apex */
  | "cross"; /* many courses into one point */

const onlyId = (sel: { element?: { ids?: Id[] } } | undefined) => (sel?.element?.ids?.length === 1 ? sel.element.ids[0] : undefined);

export function roleOfKind(kind: ThreadKind, state: SanctumState): CordRole {
  const { core, apex } = state.roles;
  const flow = kind.flow as string;
  if (flow === "both" || kind.grammar.bidirectional) return "union";
  if (flow === "held") return "held";
  if (flow === "still") return kind.directed ? "oath" : "bond";
  const courses = kind.grammar.courses;
  if (courses.length && courses.every((c) => onlyId(c.to) === core)) return "return";
  if (courses.some((c) => c.from.element?.ids?.includes(core))) return "steer";
  if (kind.grammar.condition) return "thrust";
  if (courses.length && courses.every((c) => onlyId(c.to) === apex)) return kind.grammar.max === 1 ? "held" : "gather";
  return "cross";
}

/* ---------- placement hints the map carries ---------- */

function hintsOf(state: SanctumState) {
  const quarters = [...(state.quarters ?? [])].sort((a, b) => a.order - b.order);
  const qIndex = new Map(quarters.map((q, i) => [q.id, i]));
  const stations = new Map((state.stations ?? []).map((s) => [s.id, s]));
  return {
    quarterCount: quarters.length,
    quarterOf: (e: Element) => (e.quarter !== undefined ? qIndex.get(e.quarter) : undefined),
    stationOf: (e: Element) => (e.station ? stations.get(e.station) : undefined),
  };
}

/* ---------- layout ---------- */

export interface Ring {
  id: Id;
  order: number;
  r0: number;
  r1: number;
  mid: number;
  count: number;
}

export interface Placed {
  r: number;
  th: number;
}

export interface Layout {
  rings: Ring[];
  /** Ring of each layer id. */
  ringOf: Map<Id, Ring>;
  pos: Map<Id, Placed>;
  pupil: number;
  /** Ray along which the beyond realm opens (degrees). */
  beyondRay: number;
  /** Farthest radius used (for fitting). */
  reach: number;
  /** Radius of the threshold between the core layer and the ring outside it. */
  threshold: number;
}

export const PUPIL = 0.112;
const RIM = 0.99;
const deg = (a: number) => ((a % 360) + 360) % 360;
export const shortest = (a: number, b: number) => {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};
const circMean = (angles: number[]) => {
  if (!angles.length) return undefined;
  let x = 0, y = 0;
  for (const a of angles) { x += Math.cos((a * Math.PI) / 180); y += Math.sin((a * Math.PI) / 180); }
  if (Math.hypot(x, y) < 1e-6) return undefined;
  return deg((Math.atan2(y, x) * 180) / Math.PI);
};

/** Ends of a cord or tie as element ids (layer ends resolved to nothing). */
const endEl = (end: string) => (isLayerRef(end) || end.startsWith("cord:") || end === "lexicon" ? undefined : end);

/** `beyondRay`: where the beyond realm opens (lower right on a wide screen, downward on a tall one). */
export function computeLayout(state: SanctumState, opts: { beyondRay?: number } = {}): Layout {
  const BEYOND_RAY = opts.beyondRay ?? 40;
  /* the core's name stands on the crest axis; the core's ring keeps that side clear */
  const CORE_NAME = 270;
  const layers = [...state.layers].sort((a, b) => a.order - b.order);
  const { core, apex } = state.roles;
  const byRealm = new Map<Id, Element[]>();
  for (const e of state.elements) {
    const list = byRealm.get(e.realm) ?? [];
    list.push(e);
    byRealm.set(e.realm, list);
  }
  for (const list of byRealm.values()) list.sort((a, b) => a.order - b.order);
  const coreRealm = state.elements.find((e) => e.id === core)?.realm;
  const { quarterOf, quarterCount, stationOf } = hintsOf(state);
  const onRing = (e: Element) => e.id !== core && !stationOf(e) && !e.awaiting;

  /* rings: band width by weight (how many it holds), rim outermost */
  const weightOf = (id: Id) => {
    const n = (byRealm.get(id) ?? []).filter(onRing).length;
    return 0.55 + Math.min(n, 8) * 0.12;
  };
  const gap = 0.014;
  const inner = PUPIL + 0.035;
  const total = layers.reduce((s, l) => s + weightOf(l.id), 0);
  const unit = (RIM - inner - gap * (layers.length - 1)) / total;
  const rings: Ring[] = [];
  let r1 = RIM;
  for (const l of layers) {
    const w = weightOf(l.id) * unit;
    const r0 = r1 - w;
    rings.push({ id: l.id, order: l.order, r0, r1, mid: (r0 + r1) / 2, count: (byRealm.get(l.id) ?? []).length });
    r1 = r0 - gap;
  }
  const ringOf = new Map(rings.map((r) => [r.id, r]));
  const coreRing = coreRealm ? ringOf.get(coreRealm) : undefined;
  const outsideCore = coreRing ? rings.find((r) => r.order === coreRing.order - 1) : undefined;
  /* a station stands on the boundary between its two layers */
  const boundary = (a: Id, b: Id) => {
    const A = ringOf.get(a), B = ringOf.get(b);
    if (!A || !B) return undefined;
    const [outer, inner2] = A.order < B.order ? [A, B] : [B, A];
    return (outer.r0 + inner2.r1) / 2;
  };
  const firstStation = (state.stations ?? [])[0];
  const threshold = (firstStation && boundary(firstStation.between[0], firstStation.between[1])) ?? (coreRing && outsideCore ? (coreRing.r1 + outsideCore.r0) / 2 : 0.33);

  const pos = new Map<Id, Placed>();
  const partners = new Map<Id, Id[]>();
  const link = (a?: Id, b?: Id) => {
    if (!a || !b || a === b) return;
    (partners.get(a) ?? partners.set(a, []).get(a)!).push(b);
    (partners.get(b) ?? partners.set(b, []).get(b)!).push(a);
  };
  for (const t of state.threads) link(endEl(t.from), endEl(t.to));
  for (const t of state.ties) link(endEl(t.from), endEl(t.to));
  const placedAnglesOf = (id: Id) => (partners.get(id) ?? []).filter((p) => p !== core && pos.has(p)).map((p) => pos.get(p)!.th);

  /* the core: the pupil */
  pos.set(core, { r: 0, th: 0 });

  /* the rim: quarters when the map gives them, else even by order from the top */
  const rimRing = rings[0];
  const quarterAngle = (q: number) => deg(-90 + (q * 360) / Math.max(1, quarterCount));
  if (rimRing) {
    const rim = (byRealm.get(rimRing.id) ?? []).filter(onRing);
    const quartered = quarterCount > 0 && rim.length > 0 && rim.every((e) => quarterOf(e) !== undefined);
    if (quartered) {
      for (let q = 0; q < quarterCount; q++) {
        const inQ = rim.filter((e) => quarterOf(e) === q);
        const span = Math.min(22, (300 / quarterCount) / Math.max(1, inQ.length));
        inQ.forEach((e, i) => pos.set(e.id, { r: rimRing.mid, th: deg(quarterAngle(q) + (i - (inQ.length - 1) / 2) * span) }));
      }
    } else rim.forEach((e, i) => pos.set(e.id, { r: rimRing.mid, th: deg(-90 + (i * 360) / Math.max(1, rim.length)) }));
  }
  /* come to rest, not yet bound: just outside the rim, in their quarter */
  const resting = state.elements.filter((e) => e.awaiting);
  resting.forEach((e, i) => {
    const q = quarterOf(e);
    const th = q !== undefined ? quarterAngle(q) + 9 + (i % 3) * 7 : BEYOND_RAY - 10 - i * 9;
    pos.set(e.id, { r: (rimRing?.r1 ?? RIM) + 0.06, th: deg(th) });
  });

  /* the apex stands at the crest */
  const apexEl = state.elements.find((e) => e.id === apex);
  if (apexEl) pos.set(apex, { r: ringOf.get(apexEl.realm)?.mid ?? 0.6, th: 270 });

  /* an element with states: its in-layer state faces the open beyond ray */
  const hasStates = (e: Element) => state.elements.some((c) => c.parent === e.id && c.condition);

  const placeRing = (ring: Ring) => {
    const free = (byRealm.get(ring.id) ?? []).filter((e) => !pos.has(e.id) && onRing(e));
    if (!free.length) return;
    const r = ring.mid;
    /* units: an element and its in-ring states stand together; other children spread like the rest */
    const childOf = new Map<Id, Element[]>();
    for (const e of free) if (e.parent && e.condition && free.some((p) => p.id === e.parent)) (childOf.get(e.parent) ?? childOf.set(e.parent, []).get(e.parent)!).push(e);
    const units = free.filter((e) => !(e.parent && e.condition && childOf.has(e.parent))).map((e) => [e, ...(childOf.get(e.id) ?? [])]);
    const spread = (phase: number) => {
      const out = new Map<Id, number>();
      const step = 360 / units.length;
      const near = Math.min(26, step * 0.32) * (0.26 / Math.max(0.2, r));
      units.forEach((u, i) => {
        const a = phase + i * step;
        out.set(u[0].id, deg(a));
        u.slice(1).forEach((c, k) => out.set(c.id, deg(a - near * (k + 1))));
      });
      return out;
    };
    const cost = (angles: Map<Id, number>) => {
      let c = 0;
      for (const [id, a] of angles) {
        for (const p of placedAnglesOf(id)) c += Math.abs(shortest(a, p)) / 180;
        const toRay = Math.abs(shortest(a, BEYOND_RAY));
        if (toRay < 30 && !state.elements.some((x) => x.parent === id || x.id === id && x.condition)) c += (30 - toRay) / 5;
        const toCrest = Math.abs(shortest(a, 270));
        if (toCrest < 10 && id !== apex) c += (10 - toCrest) / 5;
      }
      return c;
    };
    let best: Map<Id, number> | undefined;
    const withStates = units.find((u) => hasStates(u[0]));
    if (withStates && units.length) {
      /* the parent's first in-ring state stands on the beyond ray; the others take their own side,
         clear of the states, of the ray and of the core's name */
      const trial = spread(0);
      const anchor = withStates.length > 1 ? withStates[1].id : withStates[0].id;
      const shift = BEYOND_RAY - trial.get(anchor)!;
      best = new Map<Id, number>();
      for (const e of withStates) best.set(e.id, deg(trial.get(e.id)! + shift));
      const taken = [...best.values()];
      for (const u of units) {
        if (u === withStates) continue;
        let bestA = 0, bestC = Infinity;
        for (let a = 0; a < 360; a += 3) {
          let c = 0;
          for (const p of placedAnglesOf(u[0].id)) c += (0.3 * Math.abs(shortest(a, p))) / 180;
          const toName = Math.abs(shortest(a, CORE_NAME));
          if (toName < 40) c += 4 + (40 - toName) / 10;
          const toRay = Math.abs(shortest(a, BEYOND_RAY));
          if (toRay < 90) c += (90 - toRay) / 45;
          for (const t of taken) { const d = Math.abs(shortest(a, t)); if (d < 55) c += 4 + (55 - d) / 10; }
          if (c < bestC) { bestC = c; bestA = a; }
        }
        best.set(u[0].id, deg(bestA));
        taken.push(bestA);
        u.slice(1).forEach((ch, k) => { best!.set(ch.id, deg(bestA - 20 * (k + 1))); taken.push(bestA - 20 * (k + 1)); });
      }
    } else if (units.length === 1 && units[0].length === 1) {
      const id = units[0][0].id;
      /* a lone element faces what it serves, clear of the crest, the beyond ray and its neighbours */
      const start = circMean(placedAnglesOf(id)) ?? 250;
      const near = [...pos.entries()].filter(([pid, p]) => pid !== core && Math.abs(p.r - r) < 0.2 && Math.abs(p.r - r) > 0.01).map(([, p]) => p.th);
      let a = start;
      for (let k = 0; k < 40; k++) {
        const clear = Math.abs(shortest(a, 270)) >= 14 && Math.abs(shortest(a, BEYOND_RAY)) >= 24 && near.every((n) => Math.abs(shortest(a, n)) >= 22);
        if (clear) break;
        a = deg(start + (k % 2 ? 1 : -1) * Math.ceil((k + 1) / 2) * 6);
      }
      best = new Map([[id, a]]);
    } else {
      let bestCost = Infinity;
      for (let p = 0; p < 360 / Math.max(1, units.length); p += 2) {
        const trial = spread(p);
        const c = cost(trial);
        if (c < bestCost) { bestCost = c; best = trial; }
      }
    }
    for (const [id, a] of best ?? []) pos.set(id, { r, th: a });
  };

  /* the core's ring first (it decides the beyond ray), then rim inward */
  if (coreRing) placeRing(coreRing);
  for (const ring of rings.slice(1)) if (ring !== coreRing) placeRing(ring);
  /* stations: on their boundary, facing what they serve, clear of the beyond ray and the crest */
  state.elements.filter((e) => stationOf(e) && !pos.has(e.id)).forEach((e, i) => {
    const s = stationOf(e)!;
    const r = boundary(s.between[0], s.between[1]) ?? threshold;
    const taken = [...pos.entries()].filter(([id, p]) => id !== core && Math.abs(p.r - r) < 0.12).map(([, p]) => p.th);
    let th = circMean(placedAnglesOf(e.id)) ?? deg(200 + i * 40);
    for (let k = 0; k < 36; k++) {
      const clear = Math.abs(shortest(th, BEYOND_RAY)) > 24 && Math.abs(shortest(th, 270)) > 22 && taken.every((a) => Math.abs(shortest(th, a)) > 26);
      if (clear) break;
      th = deg(th + (k % 2 ? 1 : -1) * (k + 1) * 6);
    }
    pos.set(e.id, { r, th });
  });

  /* beyond: states on the ray, the ground they take further out, others fanned */
  const beyond = (byRealm.get(BEYOND) ?? []).filter((e) => !pos.has(e.id));
  let reach = RIM;
  const states = beyond.filter((e) => e.condition);
  const rest = beyond.filter((e) => !e.condition);
  states.forEach((e, i) => pos.set(e.id, { r: 1.13, th: deg(BEYOND_RAY + i * 16) }));
  rest.forEach((e, i) => {
    const side = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2);
    pos.set(e.id, { r: 1.3 - Math.abs(side) * 0.02, th: deg(BEYOND_RAY + side * 12) });
  });
  for (const e of beyond) reach = Math.max(reach, pos.get(e.id)!.r);

  /* anything left (new kinds of station) falls on its ring by order */
  for (const e of state.elements) if (!pos.has(e.id)) pos.set(e.id, { r: ringOf.get(e.realm)?.mid ?? 1.2, th: deg(e.order * 37) });

  return { rings, ringOf, pos, pupil: PUPIL, beyondRay: BEYOND_RAY, reach: reach + 0.06, threshold };
}

/* ---------- cord courses ---------- */

export interface Course {
  /** Unit polar samples, interleaved r, θ. */
  pts: Float32Array;
  /** The course ends on a whole layer, not an element. */
  toLayer?: Id;
  /** Encircles its layer (a still cord to a whole layer). */
  ring?: boolean;
}

const SWIRL = 30;

function spiral(a: Placed, b: Placed, opts: { d?: number; bow?: number; dip?: number; n?: number } = {}): Float32Array {
  const n = opts.n ?? 72;
  const d = opts.d ?? shortest(a.th, b.th);
  const out = new Float32Array((n + 1) * 2);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out[i * 2] = a.r + (b.r - a.r) * t - (opts.dip ?? 0) * Math.sin(Math.PI * t);
    out[i * 2 + 1] = a.th + d * t + (opts.bow ?? 0) * Math.sin(Math.PI * t);
  }
  return out;
}

export function courseOf(t: Thread, role: CordRole, layout: Layout, state: SanctumState): Course | null {
  const { core } = state.roles;
  const fromEl = endEl(t.from), toEl = endEl(t.to);
  const A = fromEl ? layout.pos.get(fromEl) : undefined;
  if (!A) return null;
  const P = layout.pupil * 1.03;
  if (isLayerRef(t.to)) {
    const ring = layout.ringOf.get(refId(t.to));
    if (!ring) return null;
    if (role === "oath") {
      /* a still cord owed to a whole layer: a taut ring around it, tied at its origin */
      const rr = ring.id === layout.rings[layout.rings.length - 1]?.id ? Math.max(layout.pupil + 0.07, ring.r0 + (ring.r1 - ring.r0) * 0.3) : ring.mid;
      const n = 150;
      const out = new Float32Array((n + 2) * 2);
      out[0] = A.r; out[1] = A.th;
      for (let i = 0; i <= n; i++) { out[(i + 1) * 2] = rr; out[(i + 1) * 2 + 1] = A.th + (i / n) * 359.5; }
      return { pts: out, toLayer: ring.id, ring: true };
    }
    const into = { r: Math.min(ring.r1, Math.max(ring.r0, ring.mid)), th: A.th + (A.r > ring.mid ? -12 : 12) };
    return { pts: spiral(A, into, { bow: 4 }), toLayer: ring.id };
  }
  const B = toEl ? layout.pos.get(toEl) : undefined;
  if (!B) return null;
  if (toEl === core && fromEl !== core) {
    if (role === "union") return { pts: spiral(A, { r: P, th: A.th }, {}) };
    return { pts: spiral(A, { r: P, th: A.th + SWIRL }, {}) };
  }
  if (fromEl === core) {
    if (role === "union") return { pts: spiral({ r: P, th: B.th }, B, {}) };
    return { pts: spiral({ r: P, th: B.th + SWIRL }, B, {}) };
  }
  const sameRing = Math.abs(A.r - B.r) < 0.02;
  if (role === "bond" && sameRing) return { pts: spiral(A, B, { dip: 0.04 }) };
  if (role === "cross") {
    const n = 90;
    const d = shortest(A.th, B.th);
    const out = new Float32Array((n + 1) * 2);
    const hi = Math.max(A.r, B.r), lo = Math.min(A.r, B.r);
    const run = lo + (hi - lo) * 0.45;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out[i * 2] = A.r > B.r ? B.r + (run - B.r) * (1 - t ** 5) + (A.r - run) * (1 - t) ** 7 : A.r + (B.r - A.r) * t;
      out[i * 2 + 1] = A.th + d * t;
    }
    return { pts: out };
  }
  if (sameRing) return { pts: spiral(A, B, { dip: -0.05 }) };
  return { pts: spiral(A, B, {}) };
}

/** Length-normalised sample along a screen polyline (pts interleaved x, y). */
export function sampler(xy: Float32Array) {
  const n = xy.length / 2;
  const acc = new Float32Array(n);
  for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + Math.hypot(xy[i * 2] - xy[i * 2 - 2], xy[i * 2 + 1] - xy[i * 2 - 1]);
  const total = acc[n - 1] || 1;
  return {
    total,
    at(u: number, out: { x: number; y: number; a: number }) {
      const s = Math.max(0, Math.min(1, u)) * total;
      let lo = 1, hi = n - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (acc[m] < s) lo = m + 1; else hi = m; }
      const i = Math.max(1, lo);
      const k = (s - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
      const x0 = xy[i * 2 - 2], y0 = xy[i * 2 - 1], x1 = xy[i * 2], y1 = xy[i * 2 + 1];
      out.x = x0 + (x1 - x0) * k; out.y = y0 + (y1 - y0) * k; out.a = Math.atan2(y1 - y0, x1 - x0);
      return out;
    },
  };
}
