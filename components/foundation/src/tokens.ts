/* JS mirrors of the foundation.css tokens, for timers and inline styles. */

export const motion = {
  fast: 180,
  control: 280,
  reveal: 600,
  cinematic: 900,
  stagger: 80,
  ease: "cubic-bezier(.2,.8,.2,1)",
  easeCinematic: "cubic-bezier(.23,1,.32,1)",
} as const;

export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export const mediaGate = { graceMs: 350, minVisibleMs: 500, timeoutMs: 20000 } as const;

/* Protected Evoview attribution destination (verified). */
export const EVOVIEW_URL = "https://evoview.be/";
