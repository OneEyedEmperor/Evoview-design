/* Press jelly (RULES §6), ported for the sanctum: a pressed pill or button
   squashes vertically and widens slightly, then springs back with an elastic
   overshoot on release. Written as the CSS `scale` property so it composes
   with the host's own transforms. Delegated: one listener set, an engine per
   pressed element. Opt in with `data-jelly` (empty: the host deforms; a
   selector: that descendant deforms, e.g. a switch's track). */

export const JELLY_ATTR = "data-jelly";
const PRESS = { w: 30, z: 0.6 };
const RELEASE = { w: 15, z: 0.14 };
const MAX_SQUASH = 0.11, MAX_STRETCH = 0.07;
const BLOCKED = ':disabled, [aria-disabled="true"], [aria-busy="true"], [data-locked]';
const MIN_HOLD = 100;

interface Jelly { to(p: number): void }

function createJelly(el: HTMLElement): Jelly {
  let target = 0, p = 0, v = 0, raf = 0, last = 0, sy = 0, sx = 0, written = "";
  const measure = () => {
    const h = el.offsetHeight || 1, w = el.offsetWidth || 1;
    sy = Math.min(MAX_SQUASH, 7 / h);
    sx = Math.min(MAX_STRETCH, 10 / w);
  };
  const paint = () => {
    const next = p === 0 ? "" : `${(1 + sx * p).toFixed(4)} ${(1 - sy * p).toFixed(4)}`;
    if (next === written) return;
    written = next;
    el.style.scale = next;
    el.style.willChange = next ? "scale" : "";
  };
  const tick = (t: number) => {
    const dt = last ? Math.min(0.032, (t - last) / 1000) : 1 / 60;
    last = t;
    const { w, z } = target > 0 ? PRESS : RELEASE;
    v += (w * w * (target - p) - 2 * z * w * v) * dt;
    p += v * dt;
    const settled = Math.abs(target - p) < 0.01 && Math.abs(v) < 0.1;
    if (settled) { p = target; v = 0; }
    paint();
    if (settled) { raf = 0; last = 0; return; }
    raf = requestAnimationFrame(tick);
  };
  return {
    to(next) {
      target = Math.min(1, Math.max(0, next));
      if (target > 0 && p === 0 && v === 0) measure();
      if (!raf && (target !== p || v !== 0)) { last = 0; raf = requestAnimationFrame(tick); }
    },
  };
}

const jellies = new WeakMap<HTMLElement, Jelly>();
const jellyFor = (el: HTMLElement) => jellies.get(el) ?? jellies.set(el, createJelly(el)).get(el)!;

function bind(root: Document) {
  let held: { host: HTMLElement; jelly: Jelly; at: number; key?: string } | null = null;
  const hostOf = (target: EventTarget | null) => {
    const host = (target as Element | null)?.closest?.<HTMLElement>(`[${JELLY_ATTR}]`);
    return host && !host.matches(BLOCKED) ? host : null;
  };
  const release = (now = false) => {
    if (!held) return;
    const { jelly, at } = held;
    held = null;
    const wait = now ? 0 : MIN_HOLD - (performance.now() - at);
    if (wait <= 0) jelly.to(0);
    else window.setTimeout(() => jelly.to(0), wait);
  };
  const press = (host: HTMLElement, key?: string) => {
    release(true);
    const sel = host.getAttribute(JELLY_ATTR);
    const el = (sel && host.querySelector<HTMLElement>(sel)) || host;
    const jelly = jellyFor(el);
    jelly.to(1);
    held = { host, jelly, at: performance.now(), key };
  };
  const down = (e: PointerEvent) => { if (e.isPrimary && e.button === 0) { const h = hostOf(e.target); if (h) press(h); } };
  const up = () => { if (held && !held.key) release(); };
  const keydown = (e: KeyboardEvent) => { if (!e.repeat && (e.key === "Enter" || e.key === " ")) { const h = hostOf(e.target); if (h) press(h, e.key); } };
  const keyup = (e: KeyboardEvent) => { if (held?.key === e.key) release(); };
  const blur = () => release();
  const opts = { passive: true, capture: true } as const;
  root.addEventListener("pointerdown", down as EventListener, opts);
  root.addEventListener("keydown", keydown as EventListener, opts);
  root.addEventListener("keyup", keyup as EventListener, opts);
  window.addEventListener("pointerup", up, opts);
  window.addEventListener("pointercancel", up, opts);
  window.addEventListener("blur", blur);
  return () => {
    release(true);
    root.removeEventListener("pointerdown", down as EventListener, opts);
    root.removeEventListener("keydown", keydown as EventListener, opts);
    root.removeEventListener("keyup", keyup as EventListener, opts);
    window.removeEventListener("pointerup", up, opts);
    window.removeEventListener("pointercancel", up, opts);
    window.removeEventListener("blur", blur);
  };
}

let users = 0;
let unbind: (() => void) | null = null;

/** Ref-counted document-wide binding; returns the release. */
export function retainPressJelly() {
  if (typeof document === "undefined") return () => {};
  if (users++ === 0) unbind = bind(document);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--users === 0) { unbind?.(); unbind = null; }
  };
}
