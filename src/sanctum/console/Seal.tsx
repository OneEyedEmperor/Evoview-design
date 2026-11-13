/* Hold to seal: the ring fills while the plate is held (pointer, Enter or
   Space) and drains when let go early. Written per frame to the DOM only. */

import { useEffect, useRef } from "react";

const HOLD_MS = 900;
const R = 9;
const C = 2 * Math.PI * R;

export function SealButton({ label, disabled, onSeal }: { label: string; disabled: boolean; onSeal: () => void }) {
  const ring = useRef<SVGCircleElement>(null);
  const state = useRef({ level: 0, holding: false, raf: 0, last: 0, done: false });

  useEffect(() => () => cancelAnimationFrame(state.current.raf), []);
  useEffect(() => {
    if (disabled) release(true);
  }, [disabled]);

  const paint = () => {
    if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - state.current.level));
  };

  const tick = (now: number) => {
    const s = state.current;
    const dt = Math.min(48, now - (s.last || now));
    s.last = now;
    s.level = Math.max(0, Math.min(1, s.level + (s.holding ? dt / HOLD_MS : -dt / (HOLD_MS / 2.2))));
    paint();
    if (s.holding && s.level >= 1 && !s.done) {
      s.done = true;
      s.holding = false;
      onSeal();
    }
    if (s.holding || s.level > 0) s.raf = requestAnimationFrame(tick);
    else s.last = 0;
  };

  const hold = () => {
    const s = state.current;
    if (disabled || s.holding) return;
    s.holding = true;
    s.done = false;
    s.last = 0;
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(tick);
  };

  function release(instant = false) {
    const s = state.current;
    s.holding = false;
    if (instant) {
      s.level = 0;
      paint();
      return;
    }
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(tick);
  }

  return (
    <button
      type="button"
      className="sx-plate sanctum-console__seal"
      data-jelly=""
      disabled={disabled}
      aria-describedby="sanctum-console-seal-how"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        hold();
      }}
      onPointerUp={() => release()}
      onPointerCancel={() => release()}
      onPointerLeave={() => release()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          hold();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") release();
      }}
      onBlur={() => release()}
      onClick={(e) => e.preventDefault()}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r={R} fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="2" />
        <circle
          ref={ring}
          cx="11"
          cy="11"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          transform="rotate(-90 11 11)"
        />
      </svg>
      {label}
    </button>
  );
}
