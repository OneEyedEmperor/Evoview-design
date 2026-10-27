import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { bindLiquidHover, createLiquid } from "./liquid";
/* The aria-hidden copy renders its content only once hydrated, so prerendered
   HTML carries each text once. */
import { useHydrated } from "./hydration";
import { cn } from "./utils";

/* RULES §1, for buttons: a button whose surface changes colour (hover /
   focus / press) takes the same liquid fill as orbs and text. One surface
   pours over the whole button, so its background, label ink and any orb
   inside switch together.

   Put it as the last child of the button and pass it the button's content
   again, styled for the filled state. It lays that copy over the button
   (inset 0, the button's radius, display / padding / gap / alignment
   inherited, so the copy sits exactly on the original) on
   `--ev-surface-lit` with `--ev-surface-lit-ink`, and clips it to the
   rising liquid. The original stays in flow underneath: layout and
   accessible name come from it; the copy is aria-hidden. The button needs
   `position: relative`; drop its CSS hover background / colour swap. */

export type SurfaceFillProps = {
  /** `closest()` selector of the button; disabled / busy / locked buttons stay empty. */
  hoverWithin: string;
  /** Keyboard focus-visible fills too. Default false (most buttons signal focus with a ring). */
  withFocus?: boolean;
  /** A touch press fills while held. Default false. */
  withPress?: boolean;
  /** Mouse / pen hover fills. Default true. */
  withHover?: boolean;
  /** The button's content in its filled state. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const layer: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "inherit",
  alignItems: "inherit",
  justifyContent: "inherit",
  gap: "inherit",
  padding: "inherit",
  borderRadius: "inherit",
  background: "var(--ev-surface-lit, var(--primary, currentColor))",
  color: "var(--ev-surface-lit-ink, inherit)",
  /* Covers the anti-aliased rim of the button's own background, so no rest
     colour fringes the filled shape. */
  boxShadow: "0 0 0 0.75px var(--ev-surface-lit, var(--primary, currentColor))",
  clipPath: "inset(50%)",
  pointerEvents: "none",
  userSelect: "none",
};

export function SurfaceFill({ hoverWithin, withFocus = false, withPress = false, withHover = true, children, className, style }: SurfaceFillProps) {
  const wet = useRef<HTMLSpanElement>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    const el = wet.current;
    const host = el?.parentElement?.closest<HTMLElement>(hoverWithin);
    if (!el || !host) return;
    /* Only the wet copy is clipped: the button itself is the dry layer. */
    const liquid = createLiquid(document.createElement("span"), el, 0, 6);
    const off = bindLiquidHover(host, liquid, { withHover, withFocus, withPress });
    return () => {
      off();
      liquid.destroy();
    };
  }, [hoverWithin, withHover, withFocus, withPress]);

  return (
    <span ref={wet} className={cn("ev-surface-fill", className)} aria-hidden="true" style={{ ...layer, ...style }}>
      {hydrated ? children : null}
    </span>
  );
}
