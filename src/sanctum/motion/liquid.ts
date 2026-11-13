/* Liquid fill (RULES §1), ported for the sanctum so no library change can
   reach it. A level rises from the bottom with a moving wave surface and
   calms when still. Two layers are clipped from it: `dry` above the surface
   (the state left) and `wet` below (the state arriving), so every pixel is
   painted by one layer only. A settling transition: it stops once still. */

export interface LiquidController {
  /** Pour towards a level, 0 empty ... 1 full; retargets from where it is. */
  to(level: number): void;
  snap(level: number): void;
  level(): number;
  destroy(): void;
}

const HIDDEN = "inset(50%)";

function surface(level: number, amp: number, phase: number, drop = 0) {
  const y0 = 108 - level * 116 + drop;
  const pts: string[] = [];
  for (let x = -10; x <= 110; x += 5) {
    const y = y0 + amp * (0.7 * Math.sin((x / 70) * 2 * Math.PI + phase) + 0.3 * Math.sin((x / 31) * 2 * Math.PI - phase * 1.4));
    pts.push(`${x}% ${y.toFixed(2)}%`);
  }
  return pts.join(",");
}

/** Clip paths for a level: [dry, wet]. */
export function liquidClips(level: number, amp = 0, phase = 0): [string, string] {
  if (level <= 0.001 && amp < 0.05) return ["none", HIDDEN];
  if (level >= 0.999 && amp < 0.05) return [HIDDEN, "none"];
  /* The dry layer reaches a hair under the surface so the shared edge never
     anti-aliases into a line. */
  return [`polygon(${surface(level, amp, phase, 3)},110% -10%,-10% -10%)`, `polygon(${surface(level, amp, phase)},110% 110%,-10% 110%)`];
}

export function createLiquid(dry: HTMLElement, wet: HTMLElement, initial: number, maxAmp = 9): LiquidController {
  let target = initial, level = initial, v = 0, amp = 0, phase = 0, raf = 0, last = 0;
  const paint = () => {
    const [d, w] = liquidClips(level, amp, phase);
    dry.style.clipPath = d;
    wet.style.clipPath = w;
  };
  const tick = (t: number) => {
    const dt = last ? Math.min(0.032, (t - last) / 1000) : 1 / 60;
    last = t;
    const w = 11, z = 0.75;
    v += (w * w * (target - level) - 2 * z * w * v) * dt;
    level += v * dt;
    const ampTarget = level > 0.02 && level < 0.98 ? Math.min(maxAmp, (2.5 + Math.abs(v) * 7) * (maxAmp / 9)) : 0;
    amp += (ampTarget - amp) * Math.min(1, dt * 6);
    phase += dt * 7;
    const settled = Math.abs(target - level) < 0.002 && Math.abs(v) < 0.01 && amp < 0.05;
    if (settled) { level = target; v = 0; amp = 0; }
    paint();
    if (settled) { raf = 0; last = 0; return; }
    raf = requestAnimationFrame(tick);
  };
  paint();
  return {
    to(next) {
      target = Math.min(1, Math.max(0, next));
      if (!raf && (target !== level || amp > 0)) { last = 0; raf = requestAnimationFrame(tick); }
    },
    snap(next) {
      cancelAnimationFrame(raf);
      raf = 0;
      target = level = Math.min(1, Math.max(0, next));
      v = 0; amp = 0;
      paint();
    },
    level: () => level,
    destroy() { cancelAnimationFrame(raf); raf = 0; },
  };
}

const BLOCKED = ':disabled, [aria-disabled="true"], [aria-busy="true"], [data-locked]';

/** Fill while `host` is hovered (mouse / pen), focus-visible, or touch-pressed. Returns the unbind. */
export function bindLiquidHover(host: HTMLElement, set: (on: boolean) => void, { withFocus = true, withPress = false }: { withFocus?: boolean; withPress?: boolean } = {}) {
  let hovered = false, focused = false, pressed = false;
  const sync = () => set(!host.matches(BLOCKED) && (hovered || focused || pressed));
  const enter = (e: PointerEvent) => { if (e.pointerType !== "touch") hovered = true; sync(); };
  const leave = () => { hovered = false; pressed = false; sync(); };
  const down = (e: PointerEvent) => { if (withPress && e.pointerType === "touch") pressed = true; sync(); };
  const up = () => { pressed = false; sync(); };
  const focus = () => { focused = withFocus && host.matches(":focus-visible"); sync(); };
  const blur = () => { focused = false; sync(); };
  const events: [string, EventListener][] = [["pointerenter", enter as EventListener], ["pointerleave", leave], ["pointerdown", down as EventListener], ["pointerup", up], ["pointercancel", up], ["focus", focus], ["blur", blur]];
  events.forEach(([type, fn]) => host.addEventListener(type, fn));
  return () => events.forEach(([type, fn]) => host.removeEventListener(type, fn));
}
