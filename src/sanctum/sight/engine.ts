/* The eye. One canvas, drawn imperatively from requestAnimationFrame; React
   never re-renders per frame. Layout is read once per change (ResizeObserver,
   state), never inside the loop. The loop runs only while the eye is on
   screen and the document is visible (pause model). Every element also has a
   real button (hit target ≥ 44, label, name) in a DOM layer the engine
   positions itself.

   Meaning comes from fields: roles, kind flows, conditions, layer order.
   No map id, word or colour is written here. */

import { isLayerRef, refId } from "../model/rules";
import { BEYOND, type Element, type Id, type SanctumState, type Thread } from "../model/types";
import type { Lit } from "../data/lit";
import { lift, mix, rgba } from "./colour";
import { computeLayout, courseOf, PUPIL, roleOfKind, sampler, shortest, type CordRole, type Layout, type Placed } from "./geometry";

export interface View {
  litLayers: Set<Id>;
  litKinds: Set<Id>;
  reading: Lit | null;
  /** Condition shown (sealed, or foreseen). */
  condition: Id;
  /** The map's sealed condition. */
  sealed: Id;
  explanations: boolean;
  flow: boolean;
  rehearsal: boolean;
  focus: Id | null;
}

export type FrameMode = "full" | "focus" | "index";
export interface Frame { x: number; y: number; w: number; h: number; mode: FrameMode }

export interface Affordance {
  /** An element id or `layer:<id>` that may answer the console's question. */
  end?: string;
  /** A place where an element may stand (in a quarter of its realm, when the map gives one). */
  socket?: { realm: Id; order: number; quarter?: Id };
  ok: boolean;
}

export interface EngineHooks {
  onPick(id: Id, how: "tap" | "hover-in" | "hover-out"): void;
  onRingPick?(layerRef: string): void;
  onSocketPick?(socket: { realm: Id; order: number }): void;
}

interface Mark {
  id: Id;
  el: Element;
  shape: "disc" | "stone" | "knot" | "state" | "ground" | "crest";
  colour: string;
  isCore: boolean;
  pos: Placed;
  target: Placed;
  from?: Placed;
  moveT: number;
  alpha: number;
  appear: number;
  vision?: { img: HTMLImageElement | null; x: number; y: number; zoom: number; ready: number };
  ghost: number;
  removed: boolean;
  recoil: number;
  button?: HTMLButtonElement;
  labelEl?: HTMLSpanElement;
  sx: number;
  sy: number;
}

interface Cord {
  id: Id;
  t: Thread;
  role: CordRole;
  colour: string;
  steadfast: boolean;
  unit: Float32Array;
  toLayer?: Id;
  ring?: boolean;
  xy: Float32Array;
  smp: ReturnType<typeof sampler>;
  alpha: number;
  appear: number;
  sweep: number;
  amp: number;
  vel: number;
  ghost: number;
  removed: boolean;
  recoil: number;
  /** Next scheduled sign, per grade. */
  next: [number, number, number];
  lastPulse: number;
}

interface Particle {
  cord: Cord | null;
  path?: Float32Array;
  u: number;
  dur: number;
  grade: 0 | 1 | 2 | 3 | 4; /* micro, clutch, flood, mote, pulse */
  colour: string;
  examined: boolean;
  chain?: (Cord | Float32Array)[];
}

interface Flare { x: number; y: number; t: number; colour: string; big: boolean }

const TAU = Math.PI * 2;
const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
function rng(seed: number) { let s = Math.floor(seed * 2147483646) + 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

const LABEL_FONT = "700 11px Satoshi";
const LABEL_TRACK = 1.3;

export class SightEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private host: HTMLElement;
  private layer: HTMLElement;
  private hooks: EngineHooks;
  private dpr = 1;
  private W = 0;
  private H = 0;

  private state: SanctumState | null = null;
  private layout: Layout | null = null;
  private marks = new Map<Id, Mark>();
  private cords: Cord[] = [];
  private ties: { a: Id; b: Id; aLayer?: Id }[] = [];
  private particles: Particle[] = [];
  private flares: Flare[] = [];
  private view: View;
  private frame: Frame = { x: 0, y: 0, w: 1, h: 1, mode: "full" };
  private cam = { cx: 0, cy: 0, R: 100 };
  private camTarget = { cx: 0, cy: 0, R: 100 };
  private camVel = { cx: 0, cy: 0, R: 0 };
  private camSettled = false;

  private t = 0;
  private last = 0;
  private raf = 0;
  private visible = true;
  private onScreen = true;
  private wakeT = 0;
  private wakeLen = 0;
  private coreAppear = 0;
  private passage = { from: "", to: "", p: 1, gesture: 0, gestureFrom: "" as Id, gestureTo: "" as Id };
  private restoring = false;
  private affordances: Affordance[] = [];
  private sockets: { pos: Placed; ok: boolean; socket: { realm: Id; order: number } }[] = [];
  private hoverEnd: string | null = null;
  private refused = new Set<Id>();
  /** Where the beyond realm opens: lower right on a wide screen, downward on a tall one. */
  private beyondRay = typeof window !== "undefined" && window.innerWidth / window.innerHeight < 0.8 ? 72 : 40;
  private pan = { x: 0, vx: 0, min: 0, max: 0 };
  private drag: { id: number; x0: number; pan0: number; moved: boolean; lastX: number; lastT: number } | null = null;
  private suppressTap = 0;
  private lastSet: Parameters<SightEngine["setState"]> | null = null;
  private pointer = { x: -9999, y: -9999, vx: 0, vy: 0, t: 0, inside: false };
  private texture: { key: string; R: number; canvases: Map<Id, HTMLCanvasElement> } = { key: "", R: 0, canvases: new Map() };
  private layerAlpha = new Map<Id, number>();
  private explainSlots = new Map<Id, number>();
  private labelsDirty = true;
  private unseen = new Set<Id>();
  private lexiconTone = "#e9e2cf";
  private threshold = 0;
  private hasThresholdStation = false;
  private steerRR = 0;
  private perf: number[] = [];
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private destroyed = false;
  private visionCache = new Map<string, HTMLImageElement>();

  constructor(canvas: HTMLCanvasElement, layer: HTMLElement, host: HTMLElement, view: View, hooks: EngineHooks) {
    this.canvas = canvas;
    this.layer = layer;
    this.host = host;
    this.view = view;
    this.hooks = hooks;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io = new IntersectionObserver((entries) => { this.onScreen = entries.some((e) => e.isIntersecting); this.kick(); });
    this.io.observe(host);
    document.addEventListener("visibilitychange", this.onVisibility);
    host.addEventListener("pointermove", this.onPointerMove);
    host.addEventListener("pointerleave", this.onPointerLeave);
    host.addEventListener("pointerdown", this.onPointerDown, { capture: true });
    host.addEventListener("pointerup", this.onPointerUp);
    host.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("click", this.onCanvasClick);
    this.resize();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.host.removeEventListener("pointermove", this.onPointerMove);
    this.host.removeEventListener("pointerleave", this.onPointerLeave);
    this.host.removeEventListener("pointerdown", this.onPointerDown, { capture: true });
    this.host.removeEventListener("pointerup", this.onPointerUp);
    this.host.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("click", this.onCanvasClick);
    this.layer.replaceChildren();
  }

  /* ---------------------------------------------------------------- input */

  setView(view: View) {
    const prev = this.view;
    this.view = view;
    if (prev.condition !== view.condition && this.state && this.passage.to !== view.condition) this.startPassage(prev.condition, view.condition, false);
    this.labelsDirty = true;
    /* a focus quiets the other names at once */
    if (prev.focus !== view.focus && view.focus) {
      const keep = this.focusSet();
      for (const m of this.marks.values()) if (m.labelEl && !keep.has(m.id)) m.labelEl.dataset.hidden = "true";
    }
    this.kick();
  }

  setFrame(frame: Frame) {
    this.frame = frame;
    const ray = window.innerWidth / window.innerHeight < 0.8 ? 72 : 40;
    if (ray !== this.beyondRay) {
      this.beyondRay = ray;
      if (this.lastSet) this.setState(...this.lastSet);
    }
    this.fitCamera(false);
    this.labelsDirty = true;
    this.kick();
  }

  /** The sealed state, with an optional ghosted preview of the would-be state. */
  setState(state: SanctumState, opts: { preview?: { state: SanctumState; added: Id[]; removed: Id[]; changed: Id[]; restoring?: boolean } | null; refused?: Id[]; turned?: { from: Id; to: Id } | null } = {}) {
    const first = !this.state;
    const prior = this.state;
    const shown = opts.preview?.state ?? state;
    const wasRestoring = this.restoring;
    this.restoring = Boolean(opts.preview?.restoring);
    this.state = shown;
    this.unseen = new Set(shown.roles.unseen);
    this.lexiconTone = lift(shown.lexicon.colour.hex, 0.82);
    this.lastSet = [state, { ...opts, turned: null }];
    this.layout = computeLayout(shown, { beyondRay: this.beyondRay });
    this.threshold = this.layout.threshold;
    this.hasThresholdStation = shown.elements.some((e) => Boolean(e.station));
    const removedIds = new Set(opts.preview?.removed ?? []);
    this.build(shown, prior, opts.preview ? state : null, removedIds, new Set(opts.preview?.added ?? []), new Set(opts.preview?.changed ?? []));
    /* a refusal strikes once, then holds faintly while it stands */
    const refused = new Set(opts.refused ?? []);
    for (const id of refused) {
      const m = this.marks.get(id);
      if (m && !this.refused.has(id)) m.recoil = 1;
      const c = this.cords.find((x) => x.id === id);
      if (c && !this.refused.has(id)) c.recoil = 1;
    }
    this.refused = refused;
    if (first) this.startWake(3.2);
    else if (this.restoring && !wasRestoring) this.startWake(2.6);
    /* a sealed change of condition plays its gesture, then the passage, even if it was foreseen a moment ago */
    if (opts.turned) this.startPassage(opts.turned.from, opts.turned.to, true);
    this.texture.key = "";
    this.labelsDirty = true;
    this.kick();
  }

  setAffordances(list: Affordance[]) {
    this.affordances = list;
    this.sockets = [];
    const state = this.state;
    if (state) {
      for (const a of list) {
        if (!a.socket) continue;
        /* a quartered place stands at the end of its quarter; others at their order in the realm */
        const quarter = a.socket.quarter;
        const inRealmNow = state.elements.filter((e) => e.realm === a.socket!.realm);
        const order = quarter !== undefined ? inRealmNow.reduce((mx, e) => Math.max(mx, e.order), -1) + 0.5 : a.socket.order - 0.5;
        const kind = (quarter !== undefined ? inRealmNow.find((e) => e.quarter !== undefined) : inRealmNow[0])?.kind ?? "";
        const phantom: Element = { id: "\u0000socket", title: "", kind, realm: a.socket.realm, purpose: "", nature: [], explanation: "", visions: [], emphasis: 1, order, locked: false, ...(quarter !== undefined ? { quarter } : {}) };
        const trial = { ...state, elements: [...state.elements, phantom].map((e) => (e.realm === phantom.realm ? { ...e } : e)) };
        const inRealm = trial.elements.filter((e) => e.realm === phantom.realm).sort((x, y) => x.order - y.order);
        inRealm.forEach((e, i) => { e.order = i; });
        const lay = computeLayout(trial, { beyondRay: this.beyondRay });
        const p = lay.pos.get(phantom.id);
        if (p) this.sockets.push({ pos: p, ok: a.ok, socket: a.socket });
      }
    }
    this.kick();
  }

  /** Touch felt by the whole: the element rings, its cords ring, one hop further rings, and a sign travels home. */
  touch(id: Id) {
    const m = this.marks.get(id);
    if (!m || !this.state) return;
    const near = this.cords.filter((c) => c.t.from === id || c.t.to === id);
    for (const c of near) { c.vel += 260; }
    const others = new Set(near.flatMap((c) => [c.t.from, c.t.to]).filter((x) => x !== id));
    window.setTimeout(() => {
      for (const c of this.cords) if ((others.has(c.t.from) || others.has(c.t.to)) && !near.includes(c)) c.vel += 150;
      this.kick();
    }, 140);
    const route = this.routeHome(id);
    if (route.length) window.setTimeout(() => { this.particles.push({ cord: null, u: 0, dur: 1.5, grade: 0, colour: "#f6dc8e", examined: false, chain: route }); this.kick(); }, 260);
    this.kick();
  }

  perfSamples() { return this.perf.slice(); }

  /** The end the console names under its pointer: it pulses. */
  setHover(end: string | null) {
    this.hoverEnd = end;
    this.kick();
  }

  private active = true;
  /** Hidden behind something opaque: stop drawing until shown again. */
  setActive(on: boolean) {
    this.active = on;
    if (on) this.kick();
  }

  /* --------------------------------------------------------------- build */

  private build(state: SanctumState, prior: SanctumState | null, sealed: SanctumState | null, removed: Set<Id>, added: Set<Id>, changed: Set<Id>) {
    const lay = this.layout!;
    const kinds = new Map(state.threadKinds.map((k) => [k.id, k]));
    const elKinds = new Map(state.elementKinds.map((k) => [k.id, k]));
    const rim = lay.rings[0]?.id;
    const realmColour = (realm: Id) => (realm === BEYOND ? state.beyond.colour.hex : state.layers.find((l) => l.id === realm)?.colour.hex ?? "#8a8f99");
    const shapeOf = (e: Element): Mark["shape"] => {
      if (e.id === state.roles.apex) return "crest";
      const k = elKinds.get(e.kind);
      if (k?.conditional) return "state";
      if (k?.parent && !k.conditional) return "knot";
      if (k && k.realms.every((r) => r.realms?.length === 1 && r.realms[0] === BEYOND)) return "ground";
      if (k && rim && k.realms.every((r) => r.realms?.length === 1 && r.realms[0] === rim)) return "stone";
      return "disc";
    };

    const old = this.marks;
    const next = new Map<Id, Mark>();
    /* an element of the outer realm that now stands on the rim travels from where it stood */
    const vanished = prior ? prior.elements.filter((e) => e.realm === BEYOND && !state.elements.some((x) => x.id === e.id)) : [];
    for (const e of state.elements) {
      const target = lay.pos.get(e.id)!;
      const prev = old.get(e.id);
      let start: Placed | undefined = prev?.pos;
      if (!prev && rim && e.realm === rim && vanished.length) {
        const v = vanished.shift()!;
        start = old.get(v.id)?.pos;
      }
      const vision = this.visionFor(state, e);
      next.set(e.id, {
        id: e.id, el: e, shape: shapeOf(e), colour: lift(realmColour(e.realm)), isCore: e.id === state.roles.core,
        pos: start ? { ...start } : { ...target }, target, from: start ? { ...start } : undefined, moveT: start && (start.r !== target.r || start.th !== target.th) ? 0 : 1,
        alpha: prev?.alpha ?? 0, appear: prev?.appear ?? 0, vision: vision ?? prev?.vision, ghost: added.has(e.id) ? 1 : changed.has(e.id) ? 0.5 : 0, removed: false, recoil: 0,
        button: prev?.button, labelEl: prev?.labelEl, sx: prev?.sx ?? 0, sy: prev?.sy ?? 0,
      });
    }
    /* removed parts of a preview stay visible, hollow, where they stood */
    if (sealed) for (const id of removed) {
      const e = sealed.elements.find((x) => x.id === id);
      const prev = old.get(id);
      if (e && prev) next.set(id, { ...prev, removed: true, ghost: 0 });
    }
    for (const [id, m] of old) if (!next.has(id)) { m.button?.remove(); }
    this.marks = next;

    const oldCords = new Map(this.cords.map((c) => [c.id, c]));
    const cords: Cord[] = [];
    const addCord = (t: Thread, isRemoved: boolean) => {
      const kind = kinds.get(t.kind);
      if (!kind) return;
      const role = roleOfKind(kind, state);
      const course = courseOf(t, role, lay, state);
      if (!course) return;
      const prev = oldCords.get(t.id);
      const h = hash(t.id);
      cords.push({
        id: t.id, t, role, colour: lift(kind.colour.hex, role === "oath" ? 0.9 : 0.72), steadfast: Boolean(kind.steadfast), unit: course.pts, toLayer: course.toLayer, ring: course.ring,
        xy: new Float32Array(course.pts.length), smp: sampler(new Float32Array(4)), alpha: prev?.alpha ?? 0, appear: prev?.appear ?? 0, sweep: prev?.sweep ?? (this.wakeLen ? 0 : 1),
        amp: 0, vel: 0, ghost: added.has(t.id) ? 1 : changed.has(t.id) ? 0.5 : 0, removed: isRemoved, recoil: 0,
        next: prev?.next ?? [this.t + 0.6 + h * 2, this.t + 3 + h * 5, this.t + 7 + h * 9], lastPulse: 0,
      });
    };
    for (const t of state.threads) addCord(t, false);
    if (sealed) for (const id of removed) { const t = sealed.threads.find((x) => x.id === id); if (t && !state.threads.some((x) => x.id === id)) addCord(t, true); }
    this.cords = cords;
    this.ties = state.ties.filter((t) => !t.to.startsWith("cord:") && t.to !== "lexicon").map((t) => ({ a: t.from, b: isLayerRef(t.to) ? t.from : t.to, aLayer: isLayerRef(t.to) ? refId(t.to) : undefined })).filter((t) => this.marks.has(t.a) && (t.aLayer || this.marks.has(t.b)));
    const byId = new Map(cords.map((c) => [c.id, c]));
    this.particles = this.particles.filter((p) => !p.cord || byId.has(p.cord.id));
    for (const p of this.particles) if (p.cord) p.cord = byId.get(p.cord.id)!;
    this.explainSlots.clear();
    this.project();
  }

  private visionFor(state: SanctumState, e: Element): Mark["vision"] | undefined {
    if (this.unseen.has(e.id) || !e.visions.length) return undefined;
    /* an element whose states carry its picture shows it through them */
    if (state.elements.some((c) => c.parent === e.id && c.condition && c.visions.length)) return undefined;
    const v = state.visions.find((x) => x.id === e.visions[0]);
    const sub = v?.subjects.find((s) => s.elementId === e.id);
    if (!v || !sub) return undefined;
    const fmt = v.formats.includes("webp") ? "webp" : v.formats[0];
    const w = v.sizes.find((s) => s >= 480) ?? v.sizes[v.sizes.length - 1];
    const url = `/sanctum-api/visions/${v.id}/${w}.${fmt}`;
    let img = this.visionCache.get(url) ?? null;
    if (!img) {
      img = new Image();
      img.decoding = "async";
      img.src = url;
      this.visionCache.set(url, img);
      img.decode().then(() => this.kick(), () => {});
    }
    return { img, x: sub.x, y: sub.y, zoom: sub.zoom, ready: 0 };
  }

  /* ------------------------------------------------------------ geometry */

  private resize() {
    const r = this.host.getBoundingClientRect();
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    /* DPR-aware within a pixel budget: crisp on phones, bounded on large screens */
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1, Math.sqrt(4.2e6 / (this.W * this.H))));
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.fitCamera(true);
    this.texture.key = "";
    this.labelsDirty = true;
    this.kick();
  }

  private fitCamera(snap: boolean) {
    const f = this.frame;
    const reach = this.layout?.reach ?? 1.36;
    const ray = this.layout?.beyondRay ?? this.beyondRay;
    const tall = f.mode === "full" && f.w < 560 && f.h > f.w * 1.4;
    const padX = f.mode === "index" ? 8 : f.w < 560 ? 18 : 76;
    const padY = f.mode === "index" ? 8 : f.w < 560 ? 30 : 46;
    /* the eye's box: rim on three sides, the beyond ray reaching out on the fourth */
    const right = Math.max(1, reach * Math.cos(rad(ray)) + 0.08);
    const down = Math.max(1, reach * Math.sin(rad(ray)) + 0.06);
    let R: number, cx: number;
    if (tall) {
      /* a tall screen: the eye takes the height, the core stays centred, the sides are reached by pan */
      R = Math.max(40, Math.min((f.h - padY * 2) / (1 + down), f.w * 0.8));
      const left = R + 46, rightExt = R * right + 46;
      this.pan.max = Math.max(0, left - f.w / 2);
      this.pan.min = -Math.max(0, rightExt - f.w / 2);
      this.pan.x = Math.max(this.pan.min, Math.min(this.pan.max, this.pan.x));
      cx = f.x + f.w / 2 + this.pan.x;
    } else {
      R = Math.max(40, Math.min((f.w - padX * 2) / (1 + right), (f.h - padY * 2) / (1 + down)));
      cx = f.x + padX + R + ((f.w - padX * 2) - R * (1 + right)) / 2;
      this.pan.max = this.pan.min = this.pan.x = this.pan.vx = 0;
    }
    this.host.style.touchAction = this.pan.max > 0 || this.pan.min < 0 ? "none" : "";
    const cy = f.y + padY + R + ((f.h - padY * 2) - R * (1 + down)) / 2;
    this.camTarget = { cx, cy, R };
    this.camSettled = false;
    if (snap || !this.cam.R || this.cam.R === 100) {
      this.cam = { ...this.camTarget };
      this.camVel = { cx: 0, cy: 0, R: 0 };
      if (this.state) { this.project(); this.moveButtons(); }
    }
  }

  private toXY(r: number, th: number, out: { x: number; y: number }) {
    out.x = this.cam.cx + Math.cos(rad(th)) * r * this.cam.R;
    out.y = this.cam.cy + Math.sin(rad(th)) * r * this.cam.R;
    return out;
  }

  /** Screen positions of every mark and cord (after camera or layout motion). */
  private project() {
    const tmp = { x: 0, y: 0 };
    for (const m of this.marks.values()) { this.toXY(m.pos.r, m.pos.th, tmp); m.sx = tmp.x; m.sy = tmp.y; }
    for (const c of this.cords) {
      const from = this.marks.get(c.t.from);
      const to = isLayerRef(c.t.to) ? undefined : this.marks.get(c.t.to);
      /* follow moving ends: offset the course by how far its ends have travelled */
      const dA = from ? { r: from.pos.r - from.target.r, th: shortest(from.target.th, from.pos.th) } : { r: 0, th: 0 };
      const dB = to ? { r: to.pos.r - to.target.r, th: shortest(to.target.th, to.pos.th) } : dA;
      const n = c.unit.length / 2;
      for (let i = 0; i < n; i++) {
        const k = n > 1 ? i / (n - 1) : 0;
        const r = c.unit[i * 2] + dA.r * (1 - k) + dB.r * k;
        const th = c.unit[i * 2 + 1] + dA.th * (1 - k) + dB.th * k;
        this.toXY(r, th, tmp);
        c.xy[i * 2] = tmp.x;
        c.xy[i * 2 + 1] = tmp.y;
      }
      c.smp = sampler(c.xy);
    }
  }

  /* ---------------------------------------------------------- sequences */

  private startWake(len: number) {
    const lay = this.layout;
    if (!lay || !this.state) return;
    this.wakeT = 0;
    this.wakeLen = len;
    const ringIndex = new Map(lay.rings.map((r, i) => [r.id, i]));
    const n = lay.rings.length;
    const step = (len * 0.62) / Math.max(1, n);
    for (const m of this.marks.values()) {
      if (m.isCore) continue;
      const ri = m.el.realm === BEYOND ? n - 0.5 : ringIndex.get(m.el.realm) ?? n;
      m.appear = 0.12 + ri * step + m.el.order * 0.045;
      m.alpha = 0;
    }
    const core = [...this.marks.values()].find((m) => m.isCore);
    /* the first stroke: cords among the rim, in the rim's order */
    const rimId = lay.rings[0]?.id;
    const rimOrder = (id: Id) => this.marks.get(id)?.el.order ?? 0;
    const rimCords = this.cords.filter((c) => this.marks.get(c.t.from)?.el.realm === rimId && !isLayerRef(c.t.to) && this.marks.get(c.t.to)?.el.realm === rimId);
    rimCords.sort((a, b) => Math.min(rimOrder(a.t.from), rimOrder(a.t.to)) - Math.min(rimOrder(b.t.from), rimOrder(b.t.to)));
    let latest = 0;
    for (const c of this.cords) {
      const a = this.marks.get(c.t.from)?.appear ?? 0;
      const b = isLayerRef(c.t.to) ? a : this.marks.get(c.t.to)?.appear ?? 0;
      c.appear = Math.max(a, b) + 0.14;
      c.sweep = 0;
      latest = Math.max(latest, c.appear);
    }
    rimCords.forEach((c, i) => { c.appear = 0.32 + i * 0.13; });
    this.coreAppear = latest + 0.35;
    if (core) { core.appear = this.coreAppear; core.alpha = 0; }
    this.wakeLen = this.coreAppear + 0.8;
  }

  private startPassage(from: Id, to: Id, sealedTurn: boolean) {
    const state = this.state;
    if (!state) return;
    const p = this.passage;
    p.from = from;
    p.to = to;
    p.p = 0;
    p.gesture = 0;
    p.gestureFrom = "";
    p.gestureTo = "";
    if (sealedTurn) {
      /* the gesture travels from the role that seals the condition to the element whose states change */
      const parent = state.elements.find((e) => e.condition && e.parent)?.parent;
      const turner = state.roles.turner;
      if (turner && parent && this.marks.has(turner)) { p.gestureFrom = turner; p.gestureTo = parent; p.gesture = 0.0001; }
    }
    this.kick();
  }

  /* --------------------------------------------------------------- loop */

  private onVisibility = () => { this.visible = document.visibilityState === "visible"; this.kick(); };

  private kick() {
    if (this.destroyed || this.raf || !this.visible || !this.onScreen || !this.active) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (!this.visible || !this.onScreen || this.destroyed || !this.active) return;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    const t0 = performance.now();
    this.step(dt);
    this.draw();
    const spent = performance.now() - t0;
    this.perf.push(spent);
    if (this.perf.length > 600) this.perf.shift();
    this.raf = requestAnimationFrame(this.tick);
  };

  private step(dt: number) {
    this.t += dt;
    const state = this.state;
    if (!state) return;
    if (this.wakeLen) {
      const before = this.wakeT;
      this.wakeT += dt;
      /* names arrive as their elements surface */
      if (Math.floor(before * 2) !== Math.floor(this.wakeT * 2)) this.labelsDirty = true;
      if (this.wakeT > this.wakeLen + 1) { this.wakeLen = 0; this.labelsDirty = true; }
    }

    /* camera: a soft spring, so a focus or a panel pours the eye aside */
    let moving = false;
    for (const k of ["cx", "cy", "R"] as const) {
      const w = 7.5, z = 1;
      this.camVel[k] += (w * w * (this.camTarget[k] - this.cam[k]) - 2 * z * w * this.camVel[k]) * dt;
      this.cam[k] += this.camVel[k] * dt;
      if (Math.abs(this.camTarget[k] - this.cam[k]) > 0.3 || Math.abs(this.camVel[k]) > 0.3) moving = true;
      else { this.cam[k] = this.camTarget[k]; this.camVel[k] = 0; }
    }
    /* names step aside while the eye travels far, and return placed anew when it rests */
    const far = Math.abs(this.camTarget.R - this.cam.R) > 16 || Math.hypot(this.camTarget.cx - this.cam.cx, this.camTarget.cy - this.cam.cy) > 30;
    if (moving && far && !this.drag) this.layer.dataset.moving = "";
    if (!moving && !this.camSettled) { this.camSettled = true; this.labelsDirty = true; this.project(); this.moveButtons(); delete this.layer.dataset.moving; }
    this.stepPan(dt);

    /* passage between conditions: gesture first, then one in-out sequence */
    const ps = this.passage;
    if (ps.gesture > 0 && ps.gesture < 1) { ps.gesture = Math.min(1, ps.gesture + dt / 0.9); }
    else if (ps.p < 1) { ps.p = Math.min(1, ps.p + dt / 2.4); if (ps.p === 1) this.labelsDirty = true; }

    /* element motion (others make room; an element changing realm travels) */
    let anyMove = false;
    for (const m of this.marks.values()) {
      if (m.moveT < 1 && m.from) {
        m.moveT = Math.min(1, m.moveT + dt / 1.1);
        const e = inOut(m.moveT);
        m.pos.r = m.from.r + (m.target.r - m.from.r) * e;
        m.pos.th = m.from.th + shortest(m.from.th, m.target.th) * e;
        anyMove = true;
        if (m.moveT === 1) this.labelsDirty = true;
      }
      m.recoil = Math.max(this.refused.has(m.id) ? 0.3 : 0, m.recoil - dt / 1.3);
      const target = this.markAlpha(m);
      m.alpha += (target - m.alpha) * (1 - Math.exp(-dt / 0.2));
      if (m.vision?.img?.complete && m.vision.img.naturalWidth) m.vision.ready = Math.min(1, m.vision.ready + dt / 0.6);
    }

    /* cords: alpha, sweep, pluck springs */
    for (const c of this.cords) {
      const target = this.cordAlpha(c);
      c.alpha += (target - c.alpha) * (1 - Math.exp(-dt / 0.2));
      if (this.wakeLen) c.sweep = clamp01((this.wakeT - c.appear) / 0.6);
      else if (c.sweep < 1) c.sweep = Math.min(1, c.sweep + dt / 0.6);
      if (c.amp !== 0 || c.vel !== 0) {
        const w = 17, z = 0.09;
        c.vel += (-w * w * c.amp - 2 * z * w * c.vel) * dt;
        c.amp += c.vel * dt;
        if (Math.abs(c.amp) < 0.02 && Math.abs(c.vel) < 0.5) { c.amp = 0; c.vel = 0; }
      }
      c.recoil = Math.max(this.refused.has(c.id) ? 0.35 : 0, c.recoil - dt / 1.3);
    }

    this.focusVeil += ((this.view.focus ? 0.3 : 0) - this.focusVeil) * (1 - Math.exp(-dt / 0.25));
    for (const [id, a] of this.layerAlphaTargets()) {
      const cur = this.layerAlpha.get(id) ?? a;
      this.layerAlpha.set(id, cur + (a - cur) * (1 - Math.exp(-dt / 0.22)));
    }

    if (moving || anyMove || this.wakeLen) this.project();
    if (this.labelsDirty && !moving) this.placeLabels();
    if (moving || anyMove) this.moveButtons();

    if (this.view.flow) this.stepFlow(dt);
    for (let i = this.flares.length - 1; i >= 0; i--) if (this.t - this.flares[i].t > 1.4) this.flares.splice(i, 1);
  }

  /* ---------------------------------------------------- what is lit */

  private present(c: Cord) {
    const cond = c.t.condition;
    return !cond || cond === this.view.condition;
  }

  private markAlpha(m: Mark) {
    const v = this.view;
    if (this.wakeLen && this.wakeT < m.appear) return 0;
    let a = m.removed ? 0.42 : 1;
    if (m.el.condition && m.el.condition !== v.condition) a *= 0.32;
    if (!v.litLayers.has(m.el.realm)) a *= 0.24;
    if (v.reading && !v.reading.elements.has(m.id) && !m.isCore) a *= 0.2;
    if (v.focus && !this.focusSet().has(m.id)) a *= 0.42;
    return a;
  }

  private focusCache: { id: Id | null; set: Set<Id> } = { id: null, set: new Set() };
  private focusSet() {
    const id = this.view.focus;
    if (this.focusCache.id === id) return this.focusCache.set;
    const set = new Set<Id>();
    if (id && this.state) {
      set.add(id);
      const e = this.state.elements.find((x) => x.id === id);
      if (e?.parent) set.add(e.parent);
      for (const x of this.state.elements) if (x.parent === id || (e?.parent && x.parent === e.parent)) set.add(x.id);
      const family = new Set(set);
      for (const t of this.state.threads) if (family.has(t.from) || family.has(t.to)) { set.add(t.from); if (!isLayerRef(t.to)) set.add(t.to); }
      set.add(this.state.roles.core);
    }
    this.focusCache = { id, set };
    return set;
  }

  private cordAlpha(c: Cord) {
    const v = this.view;
    if (c.removed) return 0.35;
    let a = 1;
    if (!this.present(c)) a = c.role === "thrust" ? 0.06 : 0.11;
    if (!v.litKinds.has(c.t.kind)) a *= 0.15;
    const fromRealm = this.marks.get(c.t.from)?.el.realm;
    const toRealm = isLayerRef(c.t.to) ? refId(c.t.to) : this.marks.get(c.t.to)?.el.realm;
    if ((fromRealm && !v.litLayers.has(fromRealm)) || (toRealm && !v.litLayers.has(toRealm))) a *= 0.35;
    if (v.reading && !v.reading.threads.has(c.id)) a *= 0.08;
    if (v.focus && !this.isFamily(c)) a *= 0.16;
    if (c.role === "union" && !this.rehearsing()) a = Math.min(a, 0.4);
    /* the permanent signature: never wholly veiled */
    if ((c.steadfast || c.role === "union" || c.role === "oath") && a < 0.3) a = 0.3;
    if (c.role === "held" && a < 0.2 && v.litKinds.has(c.t.kind)) a = 0.2;
    return a;
  }

  private isFamily(c: Cord) {
    const id = this.view.focus;
    if (!id || !this.state) return false;
    const e = this.state.elements.find((x) => x.id === id);
    const fam = new Set([id, ...(e?.parent ? [e.parent] : []), ...this.state.elements.filter((x) => x.parent === id || (e?.parent && x.parent === e.parent)).map((x) => x.id)]);
    return fam.has(c.t.from) || fam.has(c.t.to);
  }

  private rehearsing() {
    const v = this.view;
    if (v.rehearsal) return true;
    if (!v.reading || !this.state) return false;
    return this.cords.some((c) => c.role === "union" && v.reading!.threads.has(c.id));
  }

  private layerAlphaTargets() {
    const out = new Map<Id, number>();
    const v = this.view;
    for (const r of this.layout?.rings ?? []) {
      let a = v.litLayers.has(r.id) ? 1 : 0.25;
      if (v.reading && !v.reading.layers.has(r.id) && ![...this.marks.values()].some((m) => m.el.realm === r.id && v.reading!.elements.has(m.id))) a *= 0.3;
      out.set(r.id, a);
    }
    return out;
  }

  /* --------------------------------------------------------------- flow */

  private coreId() { return this.state?.roles.core ?? ""; }

  private stepFlow(dt: number) {
    const core = this.coreId();
    const sealedNow = this.t;
    const ready = (c: Cord) => c.sweep >= 1 && this.present(c) && !c.removed && c.ghost < 1 && c.alpha > 0.05;
    for (const c of this.cords) {
      if (!ready(c)) continue;
      if (c.role === "return" && c.t.to === core) {
        for (let g = 0 as 0 | 1 | 2; g <= 2; g = (g + 1) as 0 | 1 | 2) {
          if (sealedNow < c.next[g]) continue;
          const r = hash(c.id + g + Math.floor(sealedNow));
          c.next[g] = sealedNow + (g === 0 ? 1.1 + r * 1.9 : g === 1 ? 5 + r * 5 : 11 + r * 9);
          if (this.particles.length > 70) continue;
          const lenK = Math.max(0.7, c.smp.total / Math.max(1, this.cam.R));
          this.particles.push({ cord: c, u: 0, dur: (g === 0 ? 1.5 : g === 1 ? 2.3 : 3.4) * lenK, grade: g, colour: c.colour, examined: false });
        }
      } else if (c.role === "gather" || c.role === "cross") {
        if (sealedNow >= c.next[0]) {
          c.next[0] = sealedNow + 2.2 + hash(c.id + Math.floor(sealedNow)) * 2.6;
          this.particles.push({ cord: c, u: 0, dur: 2.2, grade: 3, colour: c.colour, examined: true });
        }
      } else if (c.role === "steer" && c.t.from !== core) {
        /* a cord from a state into the core's realm keeps its own slow rhythm */
        const toRealm = this.marks.get(c.t.to)?.el.realm;
        const coreRealm = this.marks.get(core)?.el.realm;
        if (toRealm === coreRealm && sealedNow >= c.next[1]) {
          c.next[1] = sealedNow + 6 + hash(c.id + Math.floor(sealedNow)) * 4;
          this.particles.push({ cord: c, u: 0, dur: 1.8, grade: 4, colour: c.colour, examined: true });
        }
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.u += dt / p.dur;
      if (p.cord && !p.examined && this.hasThresholdStation && p.cord.t.to === core) {
        const at = p.cord.smp.at(p.u, { x: 0, y: 0, a: 0 });
        const r = Math.hypot(at.x - this.cam.cx, at.y - this.cam.cy) / this.cam.R;
        if (r <= this.threshold) { p.examined = true; this.flares.push({ x: at.x, y: at.y, t: this.t, colour: this.lexiconTone, big: false }); }
      }
      if (p.u < 1) continue;
      this.particles.splice(i, 1);
      if (p.chain && p.chain.length > 1) { this.particles.push({ ...p, u: 0, chain: p.chain.slice(1), dur: 1.2 }); continue; }
      const c = p.cord ?? (p.chain && p.chain[0] instanceof Float32Array ? null : (p.chain?.[0] as Cord | undefined) ?? null);
      if (!c) continue;
      const end = c.smp.at(1, { x: 0, y: 0, a: 0 });
      if (c.t.to === core && (c.role === "return" || p.chain)) {
        this.flares.push({ x: end.x, y: end.y, t: this.t, colour: c.colour, big: p.grade === 2 });
        this.emitSteer();
      } else if (c.role === "steer") {
        /* steering from the core passes outward only: onward from its target, never back into the core's realm */
        const coreRealm = this.marks.get(core)?.el.realm;
        const onward = this.cords.filter((x) => x.role === "steer" && x.t.from === c.t.to && !isLayerRef(x.t.to) && this.marks.get(x.t.to)?.el.realm !== coreRealm && ready(x));
        if (onward.length && p.grade === 4 && c.t.from === core) this.particles.push({ cord: onward[0], u: 0, dur: 1.5, grade: 4, colour: onward[0].colour, examined: true });
      }
    }
  }

  /** A steering pulse leaves the core only now, after a return has landed. */
  private emitSteer() {
    const core = this.coreId();
    const out = this.cords.filter((c) => c.role === "steer" && c.t.from === core && c.sweep >= 1 && this.present(c) && !c.removed && c.alpha > 0.05);
    if (!out.length) return;
    const c = out[this.steerRR++ % out.length];
    this.particles.push({ cord: c, u: 0, dur: 1.5, grade: 4, colour: c.colour, examined: true });
  }

  private routeHome(id: Id): (Cord | Float32Array)[] {
    const core = this.coreId();
    const prev = new Map<Id, { via: Cord | null; from: Id }>();
    const queue = [id];
    prev.set(id, { via: null, from: id });
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === core) break;
      for (const c of this.cords) {
        if (c.t.from !== cur || isLayerRef(c.t.to) || !this.present(c) || prev.has(c.t.to)) continue;
        if (c.role === "steer") continue;
        prev.set(c.t.to, { via: c, from: cur });
        queue.push(c.t.to);
      }
      for (const t of this.ties) {
        if (t.a !== cur || t.aLayer || prev.has(t.b)) continue;
        prev.set(t.b, { via: null, from: cur });
        queue.push(t.b);
      }
    }
    if (!prev.has(core)) return [];
    const route: (Cord | Float32Array)[] = [];
    let cur = core;
    while (cur !== id) {
      const step = prev.get(cur)!;
      if (step.via) route.unshift(step.via);
      else {
        const a = this.marks.get(step.from)!, b = this.marks.get(cur)!;
        route.unshift(new Float32Array([a.sx, a.sy, (a.sx + b.sx) / 2, (a.sy + b.sy) / 2 - 6, b.sx, b.sy]));
      }
      cur = step.from;
    }
    return route;
  }

  /* --------------------------------------------------------------- draw */

  private draw() {
    const ctx = this.ctx;
    const { dpr, W, H } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const state = this.state, lay = this.layout;
    if (!state || !lay) { ctx.fillStyle = "#06080b"; ctx.fillRect(0, 0, W, H); return; }
    const breath = Math.sin((this.t / 8) * TAU);
    const beat = this.rehearsing() ? Math.max(0, Math.sin((this.t / 2.4) * TAU)) ** 3 : 0;

    this.drawStatic();
    this.drawTies();
    this.drawCords(beat);
    this.drawBreach();
    this.drawParticles();
    this.drawCore(breath, beat);
    this.drawMarks(beat);
    this.drawSockets();
    this.drawGesture();
    if (this.view.explanations && this.frame.mode !== "index" && this.cam.R >= 220) this.drawExplanations();
  }

  private ensureTexture() {
    const lay = this.layout!, state = this.state!;
    const R = this.cam.R;
    const key = `${lay.rings.map((r) => `${r.id}:${r.r0.toFixed(3)}:${r.count}`).join("|")}|${this.dpr}|${this.frame.mode}`;
    if (this.texture.key === key && Math.abs(this.texture.R - R) / R < 0.07) return;
    if (this.texture.key === key && !this.camSettled) return;
    this.texture.key = key;
    this.texture.R = R;
    this.texture.canvases.clear();
    const coreRing = lay.rings[lay.rings.length - 1];
    const apexRealm = state.elements.find((e) => e.id === state.roles.apex)?.realm;
    lay.rings.forEach((ring, idx) => {
      const size = Math.ceil((ring.r1 * R + 8) * 2 * this.dpr);
      const cv = document.createElement("canvas");
      cv.width = cv.height = size;
      const g = cv.getContext("2d")!;
      g.setTransform(this.dpr, 0, 0, this.dpr, size / 2, size / 2);
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      const col = lift(state.layers.find((l) => l.id === ring.id)?.colour.hex ?? "#888888", 0.68);
      const rnd = rng(hash(ring.id + "fibre"));
      const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
      const lw = Math.max(0.55, R / 390);
      const line = (r1: number, t1: number, r2: number, t2: number, a: number, w = 0.7) => {
        g.strokeStyle = rgba(col, a); g.lineWidth = w * lw;
        g.beginPath(); g.moveTo(Math.cos(rad(t1)) * r1 * R, Math.sin(rad(t1)) * r1 * R); g.lineTo(Math.cos(rad(t2)) * r2 * R, Math.sin(rad(t2)) * r2 * R); g.stroke();
      };
      const dens = Math.min(1.35, Math.max(0.5, R / 300));
      const marksHere = [...this.marks.values()].filter((m) => m.el.realm === ring.id && !m.isCore);
      if (idx === 0) {
        /* the outermost ring: tufts around each element, empty between */
        for (const m of marksHere) for (let i = 0; i < 150 * dens; i++) {
          const th = m.target.th + gauss() * 18; const ra = ring.r0 + rnd() * (ring.r1 - ring.r0) * 0.5; const rb = ra + 0.025 + rnd() * 0.07;
          line(ra, th, rb, th + gauss() * 1.2, (0.05 + rnd() * 0.14) * (1 - Math.min(1, Math.abs(th - m.target.th) / 32)));
        }
      } else if (ring === coreRing) {
        /* the center: fine rays out of the pupil */
        for (let i = 0; i < 900 * dens; i++) {
          const th = rnd() * 360; const ra = PUPIL + 0.012 + rnd() * 0.02; const rb = ra + 0.04 + rnd() * (ring.r1 - ra) * 0.85;
          line(ra, th, rb, th + gauss() * 2.5, 0.03 + rnd() * 0.1, 0.65);
        }
      } else if (ring.id === apexRealm) {
        /* the apex's ring: one thin bright line */
        g.strokeStyle = rgba(col, 0.42); g.lineWidth = 1.1 * lw; g.beginPath(); g.arc(0, 0, ring.mid * R, 0, TAU); g.stroke();
        g.strokeStyle = rgba(col, 0.06); g.lineWidth = 9 * lw; g.stroke();
      } else if (coreRing && ring.order === coreRing.order - 1) {
        /* the ring just outside the core's: a continuous woven band */
        for (let i = 0; i < 1400 * dens; i++) {
          const th = rnd() * 360; const r = ring.r0 + rnd() * (ring.r1 - ring.r0 - 0.03); const s = rnd() < 0.5 ? 1 : -1;
          line(r, th, r + 0.032, th + s * 4.2, 0.035 + rnd() * 0.085, 0.75);
        }
      } else if (ring.count > 2) {
        /* many: spiral strokes driving inward */
        for (let i = 0; i < 800 * dens; i++) {
          const th = rnd() * 360; const ra = ring.r1 - rnd() * 0.03; const rb = ring.r0 + rnd() * 0.03;
          const t2 = th + 15 + rnd() * 9, tm = th + 4, rm = (ra + rb) / 2;
          g.strokeStyle = rgba(col, 0.025 + rnd() * 0.07); g.lineWidth = 0.7 * lw;
          g.beginPath(); g.moveTo(Math.cos(rad(th)) * ra * R, Math.sin(rad(th)) * ra * R);
          g.quadraticCurveTo(Math.cos(rad(tm)) * rm * R, Math.sin(rad(tm)) * rm * R, Math.cos(rad(t2)) * rb * R, Math.sin(rad(t2)) * rb * R); g.stroke();
        }
      } else {
        /* few: brushed force */
        for (let i = 0; i < 520 * dens; i++) {
          const th = rnd() * 360; const r = ring.r0 + rnd() * (ring.r1 - ring.r0);
          line(r, th, r, th + 2 + rnd() * 4, 0.04 + rnd() * 0.09, 0.9);
        }
      }
      this.texture.canvases.set(ring.id, cv);
    });
  }

  /** Air, the iris body, the ring fibres and names: drawn once into a layer, re-drawn only when they change. */
  private staticCv: HTMLCanvasElement | null = null;
  private staticBase = "";
  private staticCamKey = "";
  private staticCam = { cx: 0, cy: 0, R: 1 };
  private ringAlpha(i: number, id: Id) {
    const lay = this.layout!;
    const wake = this.wakeLen ? clamp01((this.wakeT - (0.05 + i * (this.wakeLen * 0.62) / lay.rings.length)) / 0.8) : 1;
    return (this.layerAlpha.get(id) ?? 1) * wake;
  }
  private drawStatic() {
    const lay = this.layout!;
    const { cx, cy, R } = this.cam;
    this.ensureTexture();
    /* rebuilt on a quantised change only; while the camera travels the last layer is drawn transformed (exact for rings) */
    const alphas = lay.rings.map((r, i) => Math.round(this.ringAlpha(i, r.id) * 20)).join(",");
    const base = `${this.texture.key}|${this.texture.R}|${alphas}|${this.frame.mode}|${this.canvas.width}x${this.canvas.height}|${this.ringNameKey}`;
    const camKey = `${cx.toFixed(1)}|${cy.toFixed(1)}|${R.toFixed(1)}`;
    if (!this.staticCv) this.staticCv = document.createElement("canvas");
    const sc = this.staticCv;
    if (base !== this.staticBase || (this.camSettled && camKey !== this.staticCamKey)) {
      this.staticBase = base;
      this.staticCamKey = camKey;
      this.staticCam = { cx, cy, R };
      if (sc.width !== this.canvas.width || sc.height !== this.canvas.height) { sc.width = this.canvas.width; sc.height = this.canvas.height; }
      const g = sc.getContext("2d")!;
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.fillStyle = "#06080b";
      g.fillRect(0, 0, this.W, this.H);
      /* cathedral air: cold above, warm reception at the core */
      const air = g.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.95);
      air.addColorStop(0, "rgba(40,56,84,0.20)"); air.addColorStop(0.5, "rgba(18,26,40,0.12)"); air.addColorStop(1, "rgba(6,8,11,0)");
      g.fillStyle = air; g.fillRect(0, 0, this.W, this.H);
      const body = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      body.addColorStop(0, "rgba(26,24,20,0.9)"); body.addColorStop(0.45, "rgba(16,18,24,0.85)"); body.addColorStop(0.97, "rgba(12,15,21,0.8)"); body.addColorStop(1, "rgba(6,8,11,0)");
      g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
      const k = R / this.texture.R;
      g.globalCompositeOperation = "lighter";
      lay.rings.forEach((ring, i) => {
        const cv = this.texture.canvases.get(ring.id);
        if (!cv) return;
        const a = Math.round(this.ringAlpha(i, ring.id) * 20) / 20;
        if (a < 0.01) return;
        g.globalAlpha = a;
        const s = (cv.width / this.dpr) * k;
        g.drawImage(cv, cx - s / 2, cy - s / 2, s, s);
      });
      g.globalAlpha = 1;
      /* the eye's own edge */
      g.strokeStyle = "rgba(200,215,235,0.09)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      g.globalCompositeOperation = "source-over";
      if (this.frame.mode === "full") this.drawRingNames(g);
    }
    const ctx = this.ctx;
    const s = this.staticCam;
    ctx.save();
    if (s.cx === cx && s.cy === cy && s.R === R) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(sc, 0, 0);
    } else {
      ctx.fillStyle = "#06080b";
      ctx.fillRect(0, 0, this.W, this.H);
      const k = R / s.R;
      ctx.setTransform(this.dpr * k, 0, 0, this.dpr * k, this.dpr * (cx - s.cx * k), this.dpr * (cy - s.cy * k));
      ctx.drawImage(sc, 0, 0, this.W, this.H);
    }
    ctx.restore();
    /* focus quiets the fibres with one veil, not a rebuild */
    const veil = this.focusVeil;
    if (veil > 0.005) { ctx.fillStyle = `rgba(6,8,11,${veil.toFixed(3)})`; ctx.fillRect(0, 0, this.W, this.H); }
  }
  private focusVeil = 0;

  /** Tinted glow sprites, so no gradient is built per frame. */
  private sprites = new Map<string, HTMLCanvasElement>();
  private glow(x: number, y: number, r: number, colour: string, a: number) {
    if (a < 0.01 || r < 0.5) return;
    let s = this.sprites.get(colour);
    if (!s) {
      s = document.createElement("canvas");
      s.width = s.height = 64;
      const g = s.getContext("2d")!;
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, rgba(colour, 1)); gr.addColorStop(0.35, rgba(colour, 0.45)); gr.addColorStop(1, rgba(colour, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      this.sprites.set(colour, s);
    }
    const ctx = this.ctx;
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = prev;
  }

  /** Ring names at the places the placement pass chose: lower arcs read with their tops inward, upper arcs upright. */
  private drawRingNames(ctx: CanvasRenderingContext2D) {
    const size = 11;
    ctx.save();
    ctx.font = `700 ${size}px Satoshi`;
    ctx.textBaseline = "middle";
    const p = { x: 0, y: 0 };
    for (const n of this.ringNames) {
      const a = (this.layerAlpha.get(n.id) ?? 1) * 0.56 * (this.wakeLen ? clamp01(this.wakeT / 1.5) : 1);
      ctx.fillStyle = rgba(n.colour, a);
      const rr = n.r * this.cam.R;
      const total = n.widths.reduce((s, x) => s + x, 0);
      let s = -total / 2;
      for (let i = 0; i < n.text.length; i++) {
        const gw = n.widths[i];
        const mid = n.th + ((s + gw / 2) / rr) * (180 / Math.PI) * (n.up ? 1 : -1);
        this.toXY(n.r, mid, p);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rad(n.up ? mid + 90 : mid - 90));
        ctx.fillText(n.text[i], -ctx.measureText(n.text[i]).width / 2, 0);
        ctx.restore();
        s += gw;
      }
    }
    ctx.restore();
  }

  private drawTies() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 0.8;
    for (const t of this.ties) {
      const a = this.marks.get(t.a);
      if (!a) continue;
      let bx: number, by: number;
      if (t.aLayer) {
        const ring = this.layout!.ringOf.get(t.aLayer);
        if (!ring) continue;
        const p = this.toXY(ring.r1, a.pos.th, { x: 0, y: 0 });
        bx = p.x; by = p.y;
      } else {
        const b = this.marks.get(t.b);
        if (!b) continue;
        bx = b.sx; by = b.sy;
      }
      const al = Math.min(a.alpha, t.aLayer ? 1 : this.marks.get(t.b)?.alpha ?? 1) * 0.12;
      if (al < 0.01) continue;
      ctx.strokeStyle = `rgba(230,226,215,${al.toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy);
      const mx = (a.sx + bx) / 2, my = (a.sy + by) / 2;
      const ox = (my - this.cam.cy) * 0.12, oy = -(mx - this.cam.cx) * 0.12;
      ctx.quadraticCurveTo(mx + ox, my + oy, bx, by); ctx.stroke();
    }
    ctx.restore();
  }

  private tracePath(c: Cord, upTo = 1, shake = 0) {
    const ctx = this.ctx, xy = c.xy, n = xy.length / 2;
    const last = Math.max(1, Math.floor((n - 1) * upTo));
    ctx.beginPath();
    for (let i = 0; i <= last; i++) {
      let x = xy[i * 2], y = xy[i * 2 + 1];
      const amp = c.amp + shake;
      if (amp !== 0 && i > 0 && i < n - 1) {
        const dx = xy[(i + 1) * 2] - xy[(i - 1) * 2], dy = xy[(i + 1) * 2 + 1] - xy[(i - 1) * 2 + 1];
        const len = Math.hypot(dx, dy) || 1;
        const s = Math.sin((Math.PI * i) / (n - 1)) * amp;
        x += (-dy / len) * s; y += (dx / len) * s;
      }
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }

  private drawCords(beat: number) {
    const ctx = this.ctx;
    const lw = Math.max(0.6, this.cam.R / 390);
    const W0: Record<CordRole, number> = { bond: 1.2, cross: 1.0, gather: 1.4, held: 2.5, return: 1.3, steer: 1.2, oath: 0.9, thrust: 2.4, union: 1.0 };
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const c of this.cords) {
      const a = c.alpha;
      if (a < 0.01 || c.sweep <= 0) continue;
      const w = W0[c.role] * lw;
      const ghost = c.ghost >= 1 || c.removed || (c.t.condition && c.t.condition === this.view.condition && this.view.condition !== this.view.sealed);
      const passageIn = this.passage.p < 1 && c.t.condition === this.passage.to ? clamp01((this.passage.p - 0.62) / 0.36) : 1;
      const sweep = Math.min(c.sweep, passageIn);
      if (sweep <= 0) continue;
      /* a refused change shakes what it touched; a still cord never shakes, it holds and brightens */
      const holds = c.role === "oath" || c.role === "held";
      const shake = c.recoil > 0 && !holds ? Math.sin(this.t * 60) * 3 * c.recoil : 0;
      if (c.recoil > 0 && holds) {
        this.tracePath(c, sweep);
        ctx.strokeStyle = rgba(mix(c.colour, "#ffffff", 0.4), 0.18 * c.recoil); ctx.lineWidth = w * 9; ctx.stroke();
        ctx.strokeStyle = rgba("#ffffff", 0.7 * c.recoil); ctx.lineWidth = w * 1.4; ctx.stroke();
      }
      if (ghost) { ctx.setLineDash([5 * lw, 7 * lw]); ctx.lineDashOffset = -this.t * 18; }
      const strain = c.role === "held" ? 1 + beat * 0.45 : 1;
      const union = c.role === "union" ? (this.rehearsing() ? 0.6 + beat * 0.6 : 0.5) : 1;
      if (c.role === "held") {
        /* held strain: steady, a fine tremor, never a pulse */
        const tremor = Math.sin(this.t * 47) * 0.35 + Math.sin(this.t * 31) * 0.25;
        this.tracePath(c, sweep, tremor + shake);
        ctx.strokeStyle = rgba(c.colour, 0.22 * a * strain); ctx.lineWidth = w * 2.6; ctx.stroke();
        ctx.strokeStyle = rgba(c.colour, 0.9 * a); ctx.lineWidth = w; ctx.stroke();
        ctx.strokeStyle = rgba("#fff2dc", 0.6 * a * strain); ctx.lineWidth = w * 0.35; ctx.stroke();
      } else if (c.role === "union") {
        for (const side of [1, -1]) {
          const n = c.xy.length / 2;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const dx = c.xy[Math.min(n - 1, i + 1) * 2] - c.xy[Math.max(0, i - 1) * 2], dy = c.xy[Math.min(n - 1, i + 1) * 2 + 1] - c.xy[Math.max(0, i - 1) * 2 + 1];
            const len = Math.hypot(dx, dy) || 1; const s = Math.sin((i / n) * Math.PI * 5) * 2.2 * lw * side;
            const x = c.xy[i * 2] + (-dy / len) * s, y = c.xy[i * 2 + 1] + (dx / len) * s;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgba(c.colour, 0.08 * a * union); ctx.lineWidth = w * 6; ctx.stroke();
          ctx.strokeStyle = rgba(c.colour, 0.85 * a * union); ctx.lineWidth = w; ctx.stroke();
        }
      } else if (c.role === "thrust") {
        this.tracePath(c, sweep, shake);
        ctx.strokeStyle = rgba(c.colour, 0.12 * a); ctx.lineWidth = w * 4; ctx.stroke();
        ctx.strokeStyle = rgba(c.colour, 0.9 * a); ctx.lineWidth = w * 0.8; ctx.stroke();
        const tip = c.smp.at(sweep, { x: 0, y: 0, a: 0 });
        ctx.fillStyle = rgba(mix(c.colour, "#ffffff", 0.35), a);
        ctx.beginPath(); ctx.moveTo(tip.x + Math.cos(tip.a) * 5 * lw, tip.y + Math.sin(tip.a) * 5 * lw);
        ctx.lineTo(tip.x - Math.cos(tip.a - 0.4) * 12 * lw, tip.y - Math.sin(tip.a - 0.4) * 12 * lw);
        ctx.lineTo(tip.x - Math.cos(tip.a + 0.4) * 12 * lw, tip.y - Math.sin(tip.a + 0.4) * 12 * lw); ctx.closePath(); ctx.fill();
      } else {
        this.tracePath(c, sweep, shake);
        const k = c.role === "bond" || c.role === "cross" ? 0.8 : 1;
        if (c.role !== "oath") { ctx.strokeStyle = rgba(c.colour, 0.085 * a * k); ctx.lineWidth = w * 6; ctx.stroke(); }
        ctx.strokeStyle = rgba(c.colour, (c.role === "oath" ? 0.6 : 0.86) * a * k); ctx.lineWidth = w; ctx.stroke();
        if (c.role === "oath" && c.ring) this.drawReach(c, w, a);
      }
      if (c.ghost > 0 && c.ghost < 1) { this.tracePath(c, sweep); ctx.strokeStyle = rgba("#ffffff", 0.25 * a * (0.5 + 0.5 * Math.sin(this.t * 3))); ctx.lineWidth = w * 0.8; ctx.stroke(); }
      if (ghost) ctx.setLineDash([]);
      if (c.recoil > 0 && !holds) {
        const mid = c.smp.at(0.55, { x: 0, y: 0, a: 0 });
        const g = ctx.createRadialGradient(mid.x, mid.y, 0, mid.x, mid.y, 40 * lw);
        g.addColorStop(0, `rgba(210,80,70,${(0.45 * c.recoil).toFixed(3)})`); g.addColorStop(1, "rgba(210,80,70,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mid.x, mid.y, 40 * lw, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  /** Where a still cord owed to a whole layer must reach: the state of its origin that stands outside
      that layer (shown or foreseen), or the travelling light while the passage plays. */
  private reachEnd(c: Cord): { x: number; y: number; th: number } | null {
    const state = this.state!;
    const kids = state.elements.filter((e) => e.parent === c.t.from && e.condition);
    if (!kids.length) return null;
    const home = this.marks.get(c.t.from)?.el.realm;
    const ps = this.passage;
    const fromK = kids.find((k) => k.condition === ps.from), toK = kids.find((k) => k.condition === ps.to);
    if (ps.p < 1 && fromK && toK && (fromK.realm !== home || toK.realm !== home)) {
      const a = this.marks.get(fromK.id), b = this.marks.get(toK.id);
      if (a && b) {
        const u = inOut(clamp01((ps.p - 0.08) / 0.62));
        const r = a.pos.r + (b.pos.r - a.pos.r) * u;
        const th = a.pos.th + shortest(a.pos.th, b.pos.th) * u;
        const p = this.toXY(r, th, { x: 0, y: 0 });
        return { ...p, th };
      }
    }
    const shown = kids.find((k) => k.condition === this.view.condition);
    if (!shown || shown.realm === home) return null;
    const m = this.marks.get(shown.id);
    return m ? { x: m.sx, y: m.sy, th: m.pos.th } : null;
  }

  /** The reach: taut and still from the ring to that state, lengthening as it goes out; it never flows. */
  private drawReach(c: Cord, w: number, a: number) {
    const end = this.reachEnd(c);
    if (!end) return;
    const ringR = c.unit[2];
    const start = this.toXY(ringR, end.th, { x: 0, y: 0 });
    if (Math.hypot(end.x - start.x, end.y - start.y) < 2) return;
    const ctx = this.ctx;
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = rgba(c.colour, 0.07 * a); ctx.lineWidth = w * 5; ctx.stroke();
    ctx.strokeStyle = rgba(c.colour, 0.72 * a); ctx.lineWidth = w * 1.1; ctx.stroke();
    ctx.fillStyle = rgba(c.colour, 0.85 * a);
    ctx.beginPath(); ctx.arc(start.x, start.y, 1.8 * w, 0, TAU); ctx.fill();
  }

  /** The passage: the in-layer state's light goes out along its ray, the rim parts where it crosses. */
  private drawBreach() {
    const ps = this.passage;
    if (ps.p >= 1 && ps.gesture >= 1) return;
    const state = this.state!;
    const fromEl = state.elements.find((e) => e.condition === ps.from && e.parent);
    const toEl = state.elements.find((e) => e.condition === ps.to && e.parent === fromEl?.parent);
    const a = fromEl && this.marks.get(fromEl.id), b = toEl && this.marks.get(toEl.id);
    if (!a || !b || ps.p >= 1) return;
    const u = inOut(clamp01((ps.p - 0.08) / 0.62));
    const r = a.pos.r + (b.pos.r - a.pos.r) * u;
    const th = a.pos.th + shortest(a.pos.th, b.pos.th) * u;
    const p = this.toXY(r, th, { x: 0, y: 0 });
    const ctx = this.ctx, R = this.cam.R;
    const rim = this.layout!.rings[0];
    if (rim && r > rim.r0 - 0.05 && r < rim.r1 + 0.12) {
      const q = this.toXY((rim.r0 + rim.r1) / 2, th, { x: 0, y: 0 });
      const open = Math.sin(clamp01((r - rim.r0 + 0.05) / (rim.r1 - rim.r0 + 0.17)) * Math.PI);
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, R * 0.09);
      g.addColorStop(0, `rgba(4,5,8,${(0.85 * open).toFixed(3)})`); g.addColorStop(1, "rgba(4,5,8,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, R * 0.09, 0, TAU); ctx.fill();
    }
    const tone = b.colour;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 0.07);
    g.addColorStop(0, rgba("#ffffff", 0.75)); g.addColorStop(0.3, rgba(tone, 0.45)); g.addColorStop(1, rgba(tone, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.07, 0, TAU); ctx.fill();
    ctx.restore();
  }

  private drawGesture() {
    const ps = this.passage;
    if (!(ps.gesture > 0 && ps.gesture < 1)) return;
    const a = this.marks.get(ps.gestureFrom), b = this.marks.get(ps.gestureTo);
    if (!a || !b) return;
    const ctx = this.ctx;
    const u = inOut(ps.gesture);
    const mx = (a.sx + b.sx) / 2 + (b.sy - a.sy) * 0.25, my = (a.sy + b.sy) / 2 - (b.sx - a.sx) * 0.25;
    const x = (1 - u) ** 2 * a.sx + 2 * (1 - u) * u * mx + u * u * b.sx;
    const y = (1 - u) ** 2 * a.sy + 2 * (1 - u) * u * my + u * u * b.sy;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(a.colour, 0.35 * Math.sin(u * Math.PI)); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.quadraticCurveTo(mx, my, b.sx, b.sy); ctx.stroke();
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, "rgba(255,248,230,0.95)"); g.addColorStop(1, rgba(a.colour, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
    ctx.restore();
  }

  private drawParticles() {
    const ctx = this.ctx;
    const lw = Math.max(0.6, this.cam.R / 390);
    const pt = { x: 0, y: 0, a: 0 };
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const p of this.particles) {
      let smp: ReturnType<typeof sampler>;
      let a = 1;
      if (p.cord) { smp = p.cord.smp; a = Math.max(0.35, p.cord.alpha); }
      else if (p.chain?.length) { const seg = p.chain[0]; smp = seg instanceof Float32Array ? sampler(seg) : seg.smp; }
      else continue;
      const u = Math.min(1, p.u);
      if (p.grade === 2) {
        /* flood of heat: a long swell, warm, thickening the cord */
        const n = 14;
        for (let i = 1; i <= n; i++) {
          const k = i / n; const s = Math.sin(k * Math.PI * 0.92);
          const u0 = u - 0.22 * (1 - (i - 1) / n), u1 = u - 0.22 * (1 - k);
          if (u1 <= 0) continue;
          const A = smp.at(Math.max(0, u0), { x: 0, y: 0, a: 0 }), B = smp.at(u1, pt);
          ctx.strokeStyle = rgba("#ffb35a", 0.1 * s * a); ctx.lineWidth = 16 * s * lw; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
          ctx.strokeStyle = rgba(mix(p.colour, "#fff1c8", k), 0.78 * s * a); ctx.lineWidth = (1.4 + 4.6 * s) * lw; ctx.stroke();
        }
        continue;
      }
      const len = p.grade === 4 ? 0.09 : p.grade === 1 ? 0.035 : p.grade === 3 ? 0.06 : 0.03;
      const w = p.grade === 1 ? 3.4 : p.grade === 4 ? 1.6 : p.grade === 3 ? 1.3 : 1.1;
      const head = p.grade === 1 ? 3.4 : p.grade === 4 ? 1.9 : p.grade === 3 ? 1.6 : 1.35;
      const colour = p.grade === 4 ? mix(p.colour, "#ffffff", 0.3) : p.grade === 0 ? mix(p.colour, "#fff6d8", 0.35) : p.colour;
      const steps = 8;
      let prev = smp.at(Math.max(0, u - len), { x: 0, y: 0, a: 0 });
      for (let i = 1; i <= steps; i++) {
        const k = i / steps; const q = smp.at(Math.max(0, u - len * (1 - k)), pt);
        ctx.strokeStyle = rgba(colour, k * 0.9 * a); ctx.lineWidth = w * (0.4 + k * 0.8) * lw;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        prev = { x: q.x, y: q.y, a: q.a };
      }
      const h = smp.at(u, pt); const rr = head * 4.5 * lw;
      this.glow(h.x, h.y, rr, colour, 0.6 * a);
      ctx.fillStyle = `rgba(255,252,240,${(0.95 * a).toFixed(3)})`; ctx.beginPath(); ctx.arc(h.x, h.y, head * 0.62 * lw, 0, TAU); ctx.fill();
      if (p.grade === 1) { ctx.strokeStyle = rgba("#fff1c8", 0.55 * a); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x, h.y, 5.2 * lw, 0, TAU); ctx.stroke(); }
    }
    /* arrival flares, and a mark where signs cross a station's boundary */
    for (const f of this.flares) {
      const k = (this.t - f.t) / 1.4;
      const a = (1 - k) ** 2;
      const rr = (f.big ? 26 : 14) * lw * (0.6 + k);
      this.glow(f.x, f.y, rr, mix(f.colour, "#fff4dc", 0.6), 0.75 * a);
      if (f.colour === this.lexiconTone) { ctx.strokeStyle = rgba(f.colour, 0.6 * a); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(f.x, f.y, 6 * lw + k * 8, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
  }

  private drawCore(breath: number, beat: number) {
    const ctx = this.ctx;
    const core = [...this.marks.values()].find((m) => m.isCore);
    if (!core) return;
    const { cx, cy, R } = this.cam;
    const wake = this.wakeLen ? clamp01((this.wakeT - this.coreAppear) / 0.8) : 1;
    const pr = PUPIL * R * (1 + breath * 0.03 + beat * 0.05);
    const dim = this.view.reading && !this.view.reading.elements.has(core.id) ? 0.3 : 1;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    this.glow(cx, cy, pr * (3.6 + beat * 0.5), core.colour, (0.5 + beat * 0.2) * wake * dim);
    ctx.restore();
    ctx.fillStyle = "#020203"; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.fill();
    const ig = ctx.createRadialGradient(cx, cy, pr * 0.2, cx, cy, pr);
    ig.addColorStop(0, "rgba(0,0,0,0)"); ig.addColorStop(1, rgba(core.colour, 0.1 * wake));
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(core.colour, 0.85 * wake); ctx.lineWidth = Math.max(1, 1.5 * R / 390); ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(core.colour, 0.16 * wake); ctx.lineWidth = 7 * Math.max(0.6, R / 390); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = `rgba(255,255,255,${(0.5 * wake).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(cx - pr * 0.36, cy - pr * 0.42, pr * 0.16, pr * 0.1, -0.6, 0, TAU); ctx.fill();
  }

  private drawMarks(beat: number) {
    const ctx = this.ctx;
    const R = this.cam.R;
    const s0 = Math.max(0.62, Math.min(1.1, R / 390));
    const apex = this.state!.roles.apex;
    for (const m of this.marks.values()) {
      if (m.isCore) continue;
      let a = m.alpha;
      if (a < 0.01) continue;
      const recoilX = m.recoil > 0 ? Math.sin(this.t * 55) * 4 * m.recoil : 0;
      const x = m.sx + recoilX, y = m.sy;
      const pull = this.pullOf(m);
      const px = x + pull.x, py = y + pull.y;
      const s = s0 * (m.id === apex ? 1 + beat * 0.25 : 1) * (1 + 0.12 * m.el.emphasis - 0.12);
      const glowCol = m.colour;
      /* come to rest, unbound: cold, without the glow of a bound element */
      if (m.el.awaiting) a *= 0.7;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      this.glow(px, py, 4.5 * s * 4.2, glowCol, (m.el.awaiting ? 0.14 : 0.5) * a);
      ctx.restore();
      if (m.removed) a *= 0.8;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(px, py);
      const radial = Math.atan2(m.sy - this.cam.cy, m.sx - this.cam.cx);
      if (m.vision && m.vision.ready > 0 && m.vision.img) {
        const d = Math.max(22, Math.min(54, R * (this.frame.mode === "index" ? 0.12 : 0.125)));
        ctx.globalAlpha = a * m.vision.ready;
        this.drawCameo(m, d);
        ctx.globalAlpha = a;
      } else if (m.removed) {
        ctx.strokeStyle = rgba(m.colour, 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 6 * s, 0, TAU); ctx.stroke();
      } else if (m.shape === "stone") {
        ctx.rotate(radial + Math.PI / 4); ctx.fillStyle = mix(m.colour, "#d4dbe3", 0.35); ctx.beginPath(); ctx.roundRect(-4.6 * s, -4.6 * s, 9.2 * s, 9.2 * s, 2 * s); ctx.fill();
      } else if (m.shape === "knot") {
        ctx.rotate(radial); ctx.fillStyle = m.colour; ctx.beginPath(); ctx.moveTo(0, -5 * s); ctx.lineTo(4 * s, 0); ctx.lineTo(0, 5 * s); ctx.lineTo(-4 * s, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 1.3 * s, 0, TAU); ctx.fill();
      } else if (m.shape === "crest") {
        ctx.rotate(radial + Math.PI / 2); ctx.fillStyle = m.colour; ctx.beginPath(); ctx.moveTo(-7 * s, -6 * s); ctx.lineTo(7 * s, -6 * s); ctx.lineTo(4.4 * s, 6 * s); ctx.lineTo(-4.4 * s, 6 * s); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff3ea"; ctx.beginPath(); ctx.arc(0, 0, 1.6 * s, 0, TAU); ctx.fill();
      } else if (m.shape === "ground") {
        ctx.strokeStyle = m.colour; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.arc(0, 0, 6.5 * s, 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba(m.colour, m.el.condition === this.view.condition || this.cords.some((c) => c.role === "thrust" && c.t.to === m.id && this.present(c)) ? 0.75 : 0.2);
        ctx.beginPath(); ctx.arc(0, 0, 3.4 * s, 0, TAU); ctx.fill();
      } else if (m.shape === "state") {
        ctx.strokeStyle = m.colour; ctx.lineWidth = 1.8 * s; ctx.beginPath(); ctx.arc(0, 0, 6.6 * s, 0, TAU); ctx.stroke();
        ctx.fillStyle = m.colour; ctx.beginPath(); ctx.arc(0, 0, 3 * s, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = m.colour; ctx.beginPath(); ctx.arc(0, 0, 5.6 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = "#fffaf0"; ctx.beginPath(); ctx.arc(0, 0, 2 * s, 0, TAU); ctx.fill();
        if (this.state!.elements.some((e) => e.parent === m.id && e.condition)) { ctx.strokeStyle = rgba(m.colour, 0.9); ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.arc(0, 0, 8.6 * s, 0, TAU); ctx.stroke(); }
      }
      if (m.ghost > 0) {
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(230,224,255,${(0.6 + 0.3 * Math.sin(this.t * 3)).toFixed(3)})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, 0, 13 * s, 0, TAU); ctx.stroke();
      }
      if (m.recoil > 0) {
        ctx.globalCompositeOperation = "lighter";
        const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 30 * s);
        rg.addColorStop(0, `rgba(210,80,70,${(0.5 * m.recoil).toFixed(3)})`); rg.addColorStop(1, "rgba(210,80,70,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 30 * s, 0, TAU); ctx.fill();
      }
      const aff = this.affordances.find((x) => x.end === m.id);
      if (aff) {
        ctx.globalCompositeOperation = "lighter";
        const k = 0.5 + 0.5 * Math.sin(this.t * 4);
        ctx.strokeStyle = aff.ok ? `rgba(243,239,230,${(0.5 + 0.4 * k).toFixed(3)})` : "rgba(210,90,80,0.45)";
        ctx.lineWidth = aff.ok ? 1.6 : 1;
        ctx.beginPath(); ctx.arc(0, 0, (aff.ok ? 14 + k * 3 : 12) * s, 0, TAU); ctx.stroke();
      }
      if (this.hoverEnd === m.id) {
        ctx.globalCompositeOperation = "lighter";
        const k = (this.t * 1.4) % 1;
        ctx.strokeStyle = rgba(m.colour, 0.8 * (1 - k)); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, (10 + k * 18) * s, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
  }

  private pullOf(m: Mark) {
    const aff = this.affordances.find((x) => x.end === m.id);
    if (!aff || !this.pointer.inside) return { x: 0, y: 0 };
    const dx = this.pointer.x - m.sx, dy = this.pointer.y - m.sy;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 140) return { x: 0, y: 0 };
    const k = aff.ok ? Math.min(6, 600 / (d + 60)) : -Math.min(7, 700 / (d + 50));
    return { x: (dx / d) * k, y: (dy / d) * k };
  }

  private drawCameo(m: Mark, d: number) {
    const ctx = this.ctx, v = m.vision!, img = v.img!;
    const s = Math.max(d / img.naturalWidth, d / img.naturalHeight) * v.zoom;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    let x = d / 2 - v.x * w, y = d / 2 - v.y * h;
    x = Math.min(0, Math.max(d - w, x)); y = Math.min(0, Math.max(d - h, y));
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, d / 2, 0, TAU); ctx.clip();
    ctx.drawImage(img, -d / 2 + x, -d / 2 + y, w, h);
    const sh = ctx.createRadialGradient(0, 0, d * 0.25, 0, 0, d / 2);
    sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = sh; ctx.fillRect(-d, -d, d * 2, d * 2);
    ctx.restore();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(m.colour, 0.9); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, d / 2, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(m.colour, 0.16); ctx.lineWidth = 8; ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  private drawSockets() {
    if (!this.sockets.length) return;
    const ctx = this.ctx;
    const k = 0.5 + 0.5 * Math.sin(this.t * 2.6);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const s of this.sockets) {
      const p = this.toXY(s.pos.r, s.pos.th, { x: 0, y: 0 });
      const col = s.ok ? "#e8e2ff" : "#d26a5c";
      ctx.strokeStyle = rgba(col, 0.45 + 0.35 * k); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 9 + k * 2, 0, TAU); ctx.stroke();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
      g.addColorStop(0, rgba(col, 0.22 * (0.6 + k * 0.4))); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /** Each cord's function, written where the placement pass found room. */
  private drawExplanations() {
    if (!this.explainPlaced.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `500 ${this.cam.R > 300 ? 11.5 : 11}px Montserrat`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (const { cord: c, u, text } of this.explainPlaced) {
      if (c.alpha < 0.3 || c.sweep < 1) continue;
      const p = c.smp.at(u, { x: 0, y: 0, a: 0 });
      let ang = p.a; if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
      ctx.lineWidth = 3.2; ctx.strokeStyle = `rgba(6,8,11,${(0.9 * c.alpha).toFixed(3)})`; ctx.strokeText(text, 0, -4);
      ctx.fillStyle = rgba(mix(c.colour, "#ffffff", 0.35), 0.95 * c.alpha); ctx.fillText(text, 0, -4);
      ctx.restore();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------- DOM marks */

  private ensureButton(m: Mark) {
    if (m.button) return m.button;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sx-mark";
    b.setAttribute("aria-label", m.el.title);
    const label = document.createElement("span");
    label.className = "sx-mark__label";
    label.textContent = m.el.title;
    label.setAttribute("aria-hidden", "true");
    b.appendChild(label);
    b.addEventListener("click", () => {
      if (performance.now() < this.suppressTap) return;
      this.touch(m.id);
      this.hooks.onPick(m.id, "tap");
    });
    /* a mark reached by keyboard outside the view glides in (the pan's own inertia travels vx / 5) */
    b.addEventListener("focus", () => {
      if (this.pan.max <= 0 && this.pan.min >= 0) return;
      const f = this.frame, edge = 120;
      const d = m.sx < f.x + edge ? f.x + edge - m.sx : m.sx > f.x + f.w - edge ? f.x + f.w - edge - m.sx : 0;
      if (!d) return;
      const to = Math.max(this.pan.min, Math.min(this.pan.max, this.pan.x + d));
      this.pan.vx = (to - this.pan.x) * 5;
      this.kick();
    });
    b.addEventListener("pointerenter", () => this.hooks.onPick(m.id, "hover-in"));
    b.addEventListener("pointerleave", () => this.hooks.onPick(m.id, "hover-out"));
    this.layer.appendChild(b);
    m.button = b;
    m.labelEl = label;
    return b;
  }

  private moveButtons() {
    for (const m of this.marks.values()) {
      const b = this.ensureButton(m);
      b.style.transform = `translate(${(m.sx - 22).toFixed(1)}px, ${(m.sy - 22).toFixed(1)}px)`;
      b.style.visibility = m.removed ? "hidden" : "";
    }
  }

  /** Tab follows the sight, not the data: the core first, then ring by ring outward, clockwise from the top; beyond last. */
  private orderButtons() {
    const lay = this.layout;
    if (!lay) return;
    const ringIndex = new Map(lay.rings.map((r, i) => [r.id, i]));
    const n = lay.rings.length;
    const rank = (m: Mark) => (m.isCore ? -1 : m.el.realm === BEYOND ? n + 1 : m.el.awaiting ? n : n - 1 - (ringIndex.get(m.el.realm) ?? 0));
    const clock = (m: Mark) => ((m.target.th + 90) % 360 + 360) % 360;
    const all = [...this.marks.values()].filter((m) => m.button);
    /* a state in its element's own realm follows that element */
    const follows = (m: Mark) => { const p = m.el.parent ? this.marks.get(m.el.parent) : undefined; return p?.button && p.el.realm === m.el.realm ? p : null; };
    const sorted = all.filter((m) => !follows(m)).sort((a, b) => rank(a) - rank(b) || a.target.r - b.target.r || clock(a) - clock(b))
      .flatMap((m) => [m, ...all.filter((k) => follows(k) === m).sort((a, b) => clock(a) - clock(b))]);
    const current = [...this.layer.children];
    if (sorted.every((m, i) => current[i] === m.button)) return;
    for (const m of sorted) this.layer.appendChild(m.button!);
  }

  private obstacles: { x: number; y: number; w: number; h: number }[] = [];
  /** Chrome laid over the eye; names keep clear of it. */
  setObstacles(rects: { x: number; y: number; w: number; h: number }[]) {
    const same = rects.length === this.obstacles.length && rects.every((r, i) => Math.abs(r.x - this.obstacles[i].x) < 1 && Math.abs(r.y - this.obstacles[i].y) < 1 && Math.abs(r.w - this.obstacles[i].w) < 1 && Math.abs(r.h - this.obstacles[i].h) < 1);
    if (same) return;
    this.obstacles = rects;
    this.labelsDirty = true;
    this.kick();
  }

  /** A hidden name waits beside its own mark, so a hover or focus reveal never shows it elsewhere. */
  private hideLabel(label: HTMLElement) {
    label.dataset.hidden = "true";
    label.style.transform = "translate(33px, 15px)";
  }

  /** Return keyboard focus to an element's own mark (after its view closes). */
  focusMark(id: Id) {
    this.marks.get(id)?.button?.focus({ preventScroll: true });
  }

  /** One deterministic pass, by structure: the core's name first and alone on its line, then every
      element's name in a free spot around its mark, then each ring's name where no mark, name or
      cord crosses it, then (when asked) the cords' functions. A name that cannot fit hides; its
      button keeps the name and shows it on hover or focus. */
  private placeLabels() {
    this.labelsDirty = false;
    this.moveButtons();
    this.orderButtons();
    const ctx = this.ctx;
    const { cx, cy, R } = this.cam;
    const f = this.frame;
    const lay = this.layout, state = this.state;
    if (!lay || !state) return;
    type Box = [number, number, number, number];
    const hits = (a: Box, b: Box) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
    const lens = Math.max(11, Math.min(27, R * 0.0625));
    const marks: Box[] = [...this.marks.values()].filter((m) => !m.isCore && !m.removed).map((m) => { const k = m.vision?.img ? lens + 2 : 8; return [m.sx - k, m.sy - k, m.sx + k, m.sy + k]; });
    /* chrome laid over the eye (notes, cards) is an obstacle like a mark */
    for (const o of this.obstacles) marks.push([o.x - 6, o.y - 6, o.x + o.w + 6, o.y + o.h + 6]);
    const placed: Box[] = [];
    const markInFrame = (m: Mark) => m.sx >= f.x + 2 && m.sx <= f.x + f.w - 2 && m.sy >= f.y + 2 && m.sy <= f.y + f.h - 2;
    const pupilR = PUPIL * R * 1.45;
    const inFrame = (b: Box) => b[0] >= f.x + 6 && b[2] <= f.x + f.w - 6 && b[1] >= f.y + 6 && b[3] <= f.y + f.h - 6;
    const onPupil = (b: Box) => Math.hypot(Math.max(b[0] - cx, 0, cx - b[2]), Math.max(b[1] - cy, 0, cy - b[3])) < pupilR;
    let coreName: Box | null = null;
    /* the core's name keeps its own line: no other name shares it or comes near */
    const nearCore = (b: Box) => {
      if (!coreName) return false;
      const z: Box = [coreName[0] - 40, coreName[1] - 8, coreName[2] + 40, coreName[3] + 8];
      if (hits(b, z)) return true;
      const sameLine = b[1] < coreName[3] + 3 && b[3] > coreName[1] - 3;
      return sameLine && Math.max(coreName[0] - b[2], b[0] - coreName[2]) < 84;
    };
    const free = (b: Box) => inFrame(b) && !onPupil(b) && !nearCore(b) && !placed.some((x) => hits([b[0] - 3, b[1] - 2, b[2] + 3, b[3] + 2], x)) && !marks.some((x) => hits(b, x));

    ctx.save();
    ctx.font = LABEL_FONT;
    ctx.letterSpacing = `${LABEL_TRACK}px`;
    const focus = this.view.focus ? this.focusSet() : null;
    const index = f.mode === "index";
    const priority = (m: Mark) => (m.isCore ? 0 : m.shape === "crest" || (m.shape === "disc" && !m.el.parent) ? 1 : m.shape === "state" ? 2 : 3) + (m.el.realm === BEYOND ? 0.5 : 0) + (m.el.awaiting ? 1 : 0);
    const order = [...this.marks.values()].filter((m) => !m.removed).sort((a, b) => priority(a) - priority(b) || a.el.order - b.el.order || (a.id < b.id ? -1 : 1));
    const H = 14;
    for (const m of order) {
      this.ensureButton(m);
      const label = m.labelEl!;
      /* a name stays with its mark: none for a mark out of view; dimmed names dim, they never vanish */
      const show = !index && (!focus || focus.has(m.id)) && m.alpha > 0.02 && markInFrame(m);
      if (!show) { this.hideLabel(label); continue; }
      const w = ctx.measureText(m.el.title.toUpperCase()).width + 2;
      if (m.isCore) {
        const off = pupilR + 6;
        const cands: Box[] = [[cx - w / 2, cy - off - H, cx + w / 2, cy - off], [cx - w / 2, cy + off, cx + w / 2, cy + off + H], [cx - off - w, cy - H / 2, cx - off, cy + H / 2], [cx + off, cy - H / 2, cx + off + w, cy + H / 2]];
        const box = cands.find((b) => !marks.some((x) => hits(b, x))) ?? cands[0];
        coreName = box;
        placed.push(box);
        this.setLabel(m, box);
        continue;
      }
      const gap0 = (m.vision?.img ? lens : 0) + 11;
      const radial = Math.atan2(m.sy - cy, m.sx - cx);
      let done = false;
      for (const gap of [gap0, gap0 + 9, gap0 + 20]) {
        for (let k = 0; k < 16 && !done; k++) {
          const d = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 8);
          const a = radial + d;
          const ax = m.sx + Math.cos(a) * gap, ay = m.sy + Math.sin(a) * gap;
          const ca = Math.cos(a), sa = Math.sin(a);
          const x0 = ca > 0.38 ? ax : ca < -0.38 ? ax - w : ax - w / 2;
          const y0 = sa > 0.38 ? ay : sa < -0.38 ? ay - H : ay - H / 2;
          const box: Box = [x0, y0, x0 + w, y0 + H];
          if (!free(box)) continue;
          placed.push(box);
          this.setLabel(m, box);
          done = true;
        }
        if (done) break;
      }
      if (!done) this.hideLabel(label);
    }

    /* ring names: all six, quiet, where nothing crosses them */
    this.ringNames = [];
    if (f.mode === "full" && R > 150) {
      const size = 11;
      ctx.font = `700 ${size}px Satoshi`;
      ctx.letterSpacing = "0px";
      const track = size * 0.24;
      for (const ring of lay.rings) {
        const layer = state.layers.find((l) => l.id === ring.id);
        if (!layer) continue;
        const text = layer.title.toUpperCase();
        const widths = [...text].map((ch) => ctx.measureText(ch).width + track);
        const total = widths.reduce((s, x) => s + x, 0);
        const r0 = ring.r1 - ring.r0 > 0.07 ? ring.r1 - 0.03 : ring.r1 + 0.009;
        let best: { th: number; r: number; cost: number; glyphs: Box[] } | null = null;
        for (const [r, rCost] of [[r0, 0], [r0 - 0.022, 1], [r0 + 0.018, 1.5]] as [number, number][]) {
          const rr = r * R;
          const span = (total / rr) * (180 / Math.PI);
          for (let th = 0; th < 360; th += 3) {
            /* the top of the eye reads poorly as an arc: names stay below unless nothing else is free */
            const up = th > 180 && th < 360;
            const glyphs: Box[] = [];
            let s = -total / 2;
            for (const gw of widths) {
              const mid = th + ((s + gw / 2) / rr) * (180 / Math.PI) * (up ? 1 : -1);
              const p = this.toXY(r, mid, { x: 0, y: 0 });
              glyphs.push([p.x - size * 0.45, p.y - size * 0.45, p.x + size * 0.45, p.y + size * 0.45]);
              s += gw;
            }
            if (glyphs.some((g) => !inFrame(g) || onPupil(g) || marks.some((x) => hits(g, x)) || placed.some((x) => hits(g, x)) || nearCore(g))) continue;
            let crossings = 0;
            const a0 = th - span / 2 - 1, a1 = th + span / 2 + 1;
            for (const c of this.cords) {
              if (c.alpha < 0.1) continue;
              for (let i = 0; i < c.xy.length; i += 4) {
                const dx = c.xy[i] - cx, dy = c.xy[i + 1] - cy;
                if (Math.abs(Math.hypot(dx, dy) - rr) > 9) continue;
                const ang = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
                if (ang >= a0 && ang <= a1) { crossings++; break; }
              }
            }
            const cost = crossings * 3 + Math.abs(shortest(th, 140)) / 45 + (up ? 2.5 : 0) + rCost + (Math.abs(shortest(th, lay.beyondRay)) < 26 ? 4 : 0);
            if (!best || cost < best.cost) best = { th, r, cost, glyphs };
          }
        }
        if (!best) continue;
        placed.push(...best.glyphs);
        this.ringNames.push({ text, r: best.r, th: best.th, up: best.th > 180 && best.th < 360, widths, colour: lift(layer.colour.hex, 0.7), id: ring.id });
      }
    }
    this.ringNameKey = this.ringNames.map((n) => `${n.id}@${n.th}`).join(",");

    /* the cords' functions, along their courses, clear of every name */
    this.explainPlaced = [];
    if (this.view.explanations && f.mode !== "index" && R >= 220) {
      ctx.font = `500 ${R > 300 ? 11.5 : 11}px Montserrat`;
      ctx.letterSpacing = "0px";
      const seen = new Set<string>();
      for (const c of this.cords) {
        if (this.cordAlpha(c) < 0.45 || c.ring) continue;
        const kindTitle = state.threadKinds.find((k) => k.id === c.t.kind)?.title ?? "";
        const purpose = c.t.purpose.replace(/\.$/, "");
        const text = c.t.label && c.t.label !== kindTitle ? c.t.label : purpose.length <= 44 ? purpose.charAt(0).toLowerCase() + purpose.slice(1) : "";
        if (!text) continue;
        const key = `${c.t.kind}|${text}`;
        if (seen.has(key)) continue;
        const w = ctx.measureText(text).width;
        if (w > c.smp.total * 0.75) continue;
        for (const u of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          const p = c.smp.at(u, { x: 0, y: 0, a: 0 });
          let ang = p.a; if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
          const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
          const pts = [[-w / 2, -16], [w / 2, -16], [-w / 2, -2], [w / 2, -2]].map(([a2, b2]) => [p.x + ux * a2 + nx * b2, p.y + uy * a2 + ny * b2]);
          const box: Box = [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
          if (!free(box)) continue;
          placed.push(box);
          this.explainPlaced.push({ cord: c, u, text });
          seen.add(key);
          break;
        }
      }
    }
    ctx.restore();
  }

  private ringNames: { id: Id; text: string; r: number; th: number; up: boolean; widths: number[]; colour: string }[] = [];
  private ringNameKey = "";
  private explainPlaced: { cord: Cord; u: number; text: string }[] = [];

  private setLabel(m: Mark, box: [number, number, number, number]) {
    const label = m.labelEl!;
    delete label.dataset.hidden;
    label.style.transform = `translate(${(box[0] - (m.sx - 22)).toFixed(1)}px, ${(box[1] - (m.sy - 22)).toFixed(1)}px)`;
    label.style.color = m.isCore ? mix(m.colour, "#fff6dc", 0.25) : m.el.realm === BEYOND ? mix(m.colour, "#ffffff", 0.55) : "";
    /* a dimmed element's name dims with it */
    label.style.setProperty("--sx-label-dim", m.alpha < 0.5 ? "0.42" : "1");
  }

  /* -------------------------------------------------------------- pointer */

  /* pan, on a tall screen where the eye is wider than the view */
  private onPointerDown = (e: PointerEvent) => {
    if (this.pan.max <= 0 && this.pan.min >= 0) return;
    this.drag = { id: e.pointerId, x0: e.clientX, pan0: this.pan.x, moved: false, lastX: e.clientX, lastT: performance.now() };
    this.pan.vx = 0;
  };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    if (this.drag.moved) { this.suppressTap = performance.now() + 300; this.layer.style.pointerEvents = ""; }
    this.drag = null;
    this.kick();
  };

  private shiftPan(x: number) {
    const d = x - this.pan.x;
    if (!d) return;
    this.pan.x = x;
    this.camTarget.cx += d;
    this.cam.cx += d;
    this.project();
    this.moveButtons();
  }

  private stepPan(dt: number) {
    if (this.drag || (this.pan.vx === 0 && this.pan.x <= this.pan.max && this.pan.x >= this.pan.min)) return;
    let x = this.pan.x + this.pan.vx * dt;
    this.pan.vx *= Math.exp(-dt * 5);
    if (x > this.pan.max) { x += (this.pan.max - x) * Math.min(1, dt * 12); this.pan.vx *= 0.5; }
    if (x < this.pan.min) { x += (this.pan.min - x) * Math.min(1, dt * 12); this.pan.vx *= 0.5; }
    if (Math.abs(this.pan.vx) < 6 && x <= this.pan.max + 0.5 && x >= this.pan.min - 0.5) {
      this.pan.vx = 0;
      x = Math.max(this.pan.min, Math.min(this.pan.max, x));
      this.labelsDirty = true;
    }
    this.shiftPan(x);
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.drag && e.pointerId === this.drag.id) {
      const dx = e.clientX - this.drag.x0;
      if (!this.drag.moved && Math.abs(dx) > 8) {
        this.drag.moved = true;
        this.layer.style.pointerEvents = "none";
        try { this.host.setPointerCapture(e.pointerId); } catch { /* the pointer may already be gone */ }
      }
      if (this.drag.moved) {
        const now = performance.now();
        this.pan.vx = ((e.clientX - this.drag.lastX) / Math.max(1, now - this.drag.lastT)) * 1000;
        this.drag.lastX = e.clientX;
        this.drag.lastT = now;
        let x = this.drag.pan0 + dx;
        if (x > this.pan.max) x = this.pan.max + (x - this.pan.max) * 0.35;
        if (x < this.pan.min) x = this.pan.min + (x - this.pan.min) * 0.35;
        this.shiftPan(x);
        this.kick();
        return;
      }
    }
    const r = this.host.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const now = performance.now();
    const dt = Math.max(1, now - this.pointer.t);
    const vx = (x - this.pointer.x) / dt, vy = (y - this.pointer.y) / dt;
    const speed = Math.hypot(vx, vy);
    this.pointer = { x, y, vx, vy, t: now, inside: true };
    if (speed < 0.08 || speed > 20) { this.kick(); return; }
    /* cords under the pointer bow and ring like strings */
    for (const c of this.cords) {
      if (c.alpha < 0.1 || c.ring) continue;
      const xy = c.xy;
      let best = 1e9;
      for (let i = 0; i < xy.length; i += 6) { const d = (xy[i] - x) ** 2 + (xy[i + 1] - y) ** 2; if (d < best) best = d; }
      if (best < 18 * 18) c.vel += Math.min(120, speed * 60) * (vx * (c.xy[c.xy.length - 1] - c.xy[1]) - vy * (c.xy[c.xy.length - 2] - c.xy[0]) > 0 ? 1 : -1);
    }
    this.kick();
  };

  private onPointerLeave = () => { this.pointer.inside = false; };

  private onCanvasClick = (e: MouseEvent) => {
    if (!this.layout) return;
    const r = this.host.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    for (const s of this.sockets) {
      const p = this.toXY(s.pos.r, s.pos.th, { x: 0, y: 0 });
      if (Math.hypot(p.x - px, p.y - py) < 24) { if (s.ok) this.hooks.onSocketPick?.(s.socket); return; }
    }
    if (!this.hooks.onRingPick) return;
    const d = Math.hypot(px - this.cam.cx, py - this.cam.cy) / this.cam.R;
    const ring = this.layout.rings.find((x) => d >= x.r0 - 0.01 && d <= x.r1 + 0.01);
    if (ring && this.affordances.some((a) => a.end === `layer:${ring.id}`)) this.hooks.onRingPick(`layer:${ring.id}`);
  };
}
