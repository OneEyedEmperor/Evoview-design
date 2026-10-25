/* The liquid fill engine shared by OrbFill and TextFill (RULES §1): a level
   that rises from the bottom with a moving wave surface, trailing its target
   like poured liquid and calming when still. Two layers are clipped from it:
   `dry` (above the surface, the rest state) and `wet` (below, the new
   state), so every point is painted by one layer only. A settling
   transition, not a loop: it stops once still (no pause model needed). */

export type LiquidController = {
  /** Animate the liquid towards a level, 0 empty … 1 full (may be called every frame). */
  to(level: number): void;
  /** Jump to a level without animating. */
  snap(level: number): void;
  /** Current level (0–1). */
  level(): number;
};

export type LiquidHover = {
  /** Mouse / pen hover fills. Default true. */
  withHover?: boolean;
  /** Keyboard focus-visible fills too. */
  withFocus: boolean;
  /** A touch press fills while held. */
  withPress: boolean;
};

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
export function liquidClips(level: number, amp = 0, phase = 0): [dry: string, wet: string] {
  if (level <= 0.001 && amp < 0.05) return ["none", HIDDEN];
  if (level >= 0.999 && amp < 0.05) return [HIDDEN, "none"];
  /* The dry layer reaches a hair under the surface (the wet one paints over
     it), so the shared edge never anti-aliases into a hairline. */
  return [`polygon(${surface(level, amp, phase, 3)},110% -10%,-10% -10%)`, `polygon(${surface(level, amp, phase)},110% 110%,-10% 110%)`];
}

/** Drive two layers' clip-paths from a level. `maxAmp` is the wave height in % of the box. */
export function createLiquid(dry: HTMLElement, wet: HTMLElement, initial: number, maxAmp = 9): LiquidController & { destroy(): void } {
  let target = initial;
  let level = initial;
  let v = 0;
  let amp = 0;
  let phase = 0;
  let raf = 0;
  let last = 0;

  const paint = () => {
    const [d, w] = liquidClips(level, amp, phase);
    dry.style.clipPath = d;
    wet.style.clipPath = w;
  };

  const tick = (t: number) => {
    const dt = last ? Math.min(0.032, (t - last) / 1000) : 1 / 60;
    last = t;
    const w = 11;
    const z = 0.75;
    v += (w * w * (target - level) - 2 * z * w * v) * dt;
    level += v * dt;
    const ampTarget = level > 0.02 && level < 0.98 ? Math.min(maxAmp, (2.5 + Math.abs(v) * 7) * (maxAmp / 9)) : 0;
    amp += (ampTarget - amp) * Math.min(1, dt * 6);
    phase += dt * 7;
    const settled = Math.abs(target - level) < 0.002 && Math.abs(v) < 0.01 && amp < 0.05;
    if (settled) {
      level = target;
      v = 0;
      amp = 0;
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
      if (!raf && (target !== level || amp > 0)) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    },
    snap(next) {
      cancelAnimationFrame(raf);
      raf = 0;
      target = level = Math.min(1, Math.max(0, next));
      v = 0;
      amp = 0;
      paint();
    },
    level: () => level,
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}

/** Fill while `host` is hovered (mouse/pen), focus-visible or touch-pressed; disabled or busy hosts stay empty. Returns the unbind. */
export function bindLiquidHover(host: HTMLElement, liquid: LiquidController, { withHover = true, withFocus, withPress }: LiquidHover) {
  let hovered = false;
  let focused = false;
  let pressed = false;
  const sync = () => {
    const blocked = host.matches(':disabled, [aria-disabled="true"], [aria-busy="true"], [data-locked]');
    liquid.to(!blocked && (hovered || focused || pressed) ? 1 : 0);
  };
  const enter = (e: PointerEvent) => {
    if (withHover && e.pointerType !== "touch") hovered = true;
    sync();
  };
  const leave = () => {
    hovered = false;
    pressed = false;
    sync();
  };
  const down = (e: PointerEvent) => {
    if (withPress && e.pointerType === "touch") pressed = true;
    sync();
  };
  const up = () => {
    pressed = false;
    sync();
  };
  const focus = () => {
    focused = withFocus && host.matches(":focus-visible");
    sync();
  };
  const blur = () => {
    focused = false;
    sync();
  };
  const events: [string, EventListener][] = [
    ["pointerenter", enter as EventListener],
    ["pointerleave", leave],
    ["pointerdown", down as EventListener],
    ["pointerup", up],
    ["pointercancel", up],
    ["focus", focus],
    ["blur", blur],
  ];
  events.forEach(([type, fn]) => host.addEventListener(type, fn));
  return () => events.forEach(([type, fn]) => host.removeEventListener(type, fn));
}
