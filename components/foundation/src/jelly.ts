/* Press jelly (RULES §6): a pressed pill or button squashes vertically and
   widens slightly, then springs back with a small elastic overshoot on
   release. One value, the press (0 rest … 1 held), moves on a spring and is
   written as the CSS `scale` property (it composes with the host's own
   `transform`, which keeps its transitions). Layout is read once per press,
   never per frame. A settling transition, not a loop: it stops once still and
   clears its inline style. */

export type JellyController = {
  /** Spring towards a press amount, 0 rest … 1 fully pressed; retargets from the current state. */
  to(press: number): void;
  /** Jump to a press amount without animating. */
  snap(press: number): void;
  /** Current press amount (negative while overshooting on release). */
  level(): number;
  destroy(): void;
};

/* Press in: near-critically damped and quick. Release: underdamped, so the
   shape overshoots once (taller and narrower) and settles in ~0.5s. */
const PRESS = { w: 30, z: 0.6 };
const RELEASE = { w: 15, z: 0.14 };
/* Ceilings as a fraction of the box, so small orbs don't collapse. */
const MAX_SQUASH = 0.11;
const MAX_STRETCH = 0.07;

function token(style: CSSStyleDeclaration, name: string, fallback: number) {
  const v = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

/** Deform `el` by a press amount. Squash / stretch depths come from `--ev-jelly-squash` / `--ev-jelly-stretch` (px), read once per press. */
export function createJelly(el: HTMLElement): JellyController {
  let target = 0;
  let p = 0;
  let v = 0;
  let raf = 0;
  let last = 0;
  let sy = 0;
  let sx = 0;
  let written = "";

  const measure = () => {
    const style = getComputedStyle(el);
    const h = el.offsetHeight || 1;
    const w = el.offsetWidth || 1;
    sy = Math.min(MAX_SQUASH, token(style, "--ev-jelly-squash", 7) / h);
    sx = Math.min(MAX_STRETCH, token(style, "--ev-jelly-stretch", 10) / w);
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
    /* By target, not direction: the release overshoot (p < 0) must keep the loose spring. */
    const { w, z } = target > 0 ? PRESS : RELEASE;
    v += (w * w * (target - p) - 2 * z * w * v) * dt;
    p += v * dt;
    const settled = Math.abs(target - p) < 0.01 && Math.abs(v) < 0.1;
    if (settled) {
      p = target;
      v = 0;
    }
    paint();
    if (settled) {
      raf = 0;
      last = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  return {
    to(next) {
      target = Math.min(1, Math.max(0, next));
      if (target > 0 && p === 0 && v === 0) measure();
      if (!raf && (target !== p || v !== 0)) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    },
    snap(next) {
      cancelAnimationFrame(raf);
      raf = 0;
      target = p = Math.min(1, Math.max(0, next));
      v = 0;
      if (p > 0) measure();
      paint();
    },
    level: () => p,
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      p = 0;
      paint();
    },
  };
}

/** Attribute that opts a pressable host in. Empty: the host deforms; a selector value: that descendant deforms (e.g. a switch's track). */
export const JELLY_ATTR = "data-ev-jelly";
const BLOCKED = ':disabled, [aria-disabled="true"], [aria-busy="true"], [data-locked]';
/* A tap is held at least this long, so a quick click still reads as a press. */
const MIN_HOLD = 100;

const jellies = new WeakMap<HTMLElement, JellyController>();
const jellyFor = (el: HTMLElement) => {
  let j = jellies.get(el);
  if (!j) jellies.set(el, (j = createJelly(el)));
  return j;
};

/** Press jelly on every host inside `root` (`[data-ev-jelly]`, or the hosts matched by `selector`): pointer press (any pointer type, primary button) and Enter / Space. Delegated: one set of listeners, an engine per pressed element only. Returns the unbind. */
export function bindPressJelly(root: Document | HTMLElement = document, selector = `[${JELLY_ATTR}]`) {
  let held: { host: HTMLElement; jelly: JellyController; at: number; key?: string } | null = null;
  const timers = new Map<JellyController, number>();

  const hostOf = (target: EventTarget | null) => {
    const host = (target as Element | null)?.closest?.<HTMLElement>(selector);
    if (!host || !root.contains(host) || host.matches(BLOCKED)) return null;
    return host;
  };

  const press = (host: HTMLElement, key?: string) => {
    release(true);
    const sel = host.getAttribute(JELLY_ATTR);
    const el = (sel && host.querySelector<HTMLElement>(sel)) || host;
    const jelly = jellyFor(el);
    clearTimeout(timers.get(jelly));
    timers.delete(jelly);
    jelly.to(1);
    held = { host, jelly, at: performance.now(), key };
  };

  function release(now = false) {
    if (!held) return;
    const { jelly, at } = held;
    held = null;
    const wait = now ? 0 : MIN_HOLD - (performance.now() - at);
    if (wait <= 0) return jelly.to(0);
    timers.set(
      jelly,
      window.setTimeout(() => {
        timers.delete(jelly);
        jelly.to(0);
      }, wait),
    );
  }

  const down = (e: PointerEvent) => {
    if (!e.isPrimary || e.button !== 0) return;
    const host = hostOf(e.target);
    if (host) press(host);
  };
  const up = () => {
    if (held && !held.key) release();
  };
  const keydown = (e: KeyboardEvent) => {
    if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
    const host = hostOf(e.target);
    if (host) press(host, e.key);
  };
  const keyup = (e: KeyboardEvent) => {
    if (held?.key === e.key) release();
  };
  /* Only a key press ends on focus loss: a pointer press moves focus itself. */
  const focusout = (e: Event) => {
    if (held?.key && held.host.contains(e.target as Node)) release();
  };
  const blur = () => release();

  const opts = { passive: true, capture: true } as const;
  root.addEventListener("pointerdown", down as EventListener, opts);
  root.addEventListener("keydown", keydown as EventListener, opts);
  root.addEventListener("keyup", keyup as EventListener, opts);
  root.addEventListener("focusout", focusout, opts);
  window.addEventListener("pointerup", up, opts);
  window.addEventListener("pointercancel", up, opts);
  window.addEventListener("blur", blur);
  return () => {
    release(true);
    timers.forEach((id, jelly) => {
      clearTimeout(id);
      jelly.to(0);
    });
    timers.clear();
    root.removeEventListener("pointerdown", down as EventListener, opts);
    root.removeEventListener("keydown", keydown as EventListener, opts);
    root.removeEventListener("keyup", keyup as EventListener, opts);
    root.removeEventListener("focusout", focusout, opts);
    window.removeEventListener("pointerup", up, opts);
    window.removeEventListener("pointercancel", up, opts);
    window.removeEventListener("blur", blur);
  };
}

let users = 0;
let unbind: (() => void) | null = null;

/** Ref-counted document-wide `bindPressJelly`: every component that renders jelly hosts retains it; the listeners go when the last one releases. */
export function retainPressJelly() {
  if (typeof document === "undefined") return () => {};
  if (users++ === 0) unbind = bindPressJelly(document);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--users === 0) {
      unbind?.();
      unbind = null;
    }
  };
}
