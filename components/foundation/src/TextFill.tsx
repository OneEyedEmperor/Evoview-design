import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { bindLiquidHover, createLiquid, type LiquidController } from "./liquid";
import { cn } from "./utils";

/* RULES §1, for text: a text colour switch is the same liquid fill as the
   orbs. The new colour rises through the glyphs from the bottom with a moving
   wave surface and calms when full; going back to the previous colour drains
   it down; a third colour rises over whichever one is showing.

   The text is laid twice in one grid cell (identical wrapping): the rest copy
   keeps the accessible text, the lit copy is aria-hidden. The root is
   `inline-grid`, so wrap a label, title or link text, never words in the
   middle of running text. Inline SVG drawn in `currentColor` fills too.

   Colour shown, first match wins:
   - hovered (`hoverWithin` host hovered / focus-visible / pressed):
     `hoverInk`, default `--ev-text-lit`;
   - `on`: `--ev-text-lit` (default `--primary`);
   - `ink` (any CSS colour, e.g. a state colour), default `--ev-text-rest`
     (default: the inherited colour, so host `color` rules keep working). */

const LIT = "var(--ev-text-lit, var(--primary, currentColor))";
const REST = "var(--ev-text-rest, inherit)";

export type TextFillProps = {
  /** Show `--ev-text-lit`. */
  on?: boolean;
  /** Colour at rest / for the current state (any CSS colour). */
  ink?: string;
  /** `closest()` selector of the host whose hover / focus-visible (/ press) shows `hoverInk`; disabled or busy hosts never do. */
  hoverWithin?: string;
  /** Colour while the host is hovered; default `--ev-text-lit`. */
  hoverInk?: string;
  /** With `hoverWithin`: mouse / pen hover counts. Default true (false: press / focus only). */
  withHover?: boolean;
  /** With `hoverWithin`: keyboard focus-visible counts as hover. Default true. */
  withFocus?: boolean;
  /** With `hoverWithin`: a touch press counts while held. Default false. */
  withPress?: boolean;
  /** Single line with an ellipsis (block-level, shrinks in flex / grid). */
  truncate?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const CLIP: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

export function TextFill({ on = false, ink, hoverWithin, hoverInk, withHover = true, withFocus = true, withPress = false, truncate = false, children, className, style }: TextFillProps) {
  const root = useRef<HTMLSpanElement>(null);
  const dry = useRef<HTMLSpanElement>(null);
  const wet = useRef<HTMLSpanElement>(null);
  const liquid = useRef<(LiquidController & { destroy(): void }) | null>(null);
  const [hovered, setHovered] = useState(false);
  const colour = hovered ? (hoverInk ?? LIT) : on ? LIT : (ink ?? REST);
  /* Colours of the two layers; the level says how much of `wet` shows. */
  const inks = useRef({ dry: colour, wet: colour });

  useEffect(() => {
    if (!dry.current || !wet.current) return;
    /* A gentler surface than the orbs: on a line of text a 9 % wave reads
       as a slosh, 6 % as a ripple. */
    const l = createLiquid(dry.current, wet.current, 0, 6);
    liquid.current = l;
    return () => {
      l.destroy();
      liquid.current = null;
    };
  }, []);

  useEffect(() => {
    const host = hoverWithin ? root.current?.closest<HTMLElement>(hoverWithin) : null;
    if (!host) return;
    const off = bindLiquidHover(host, { to: (level) => setHovered(level > 0), snap: () => {}, level: () => 0 }, { withHover, withFocus, withPress });
    return () => {
      off();
      setHovered(false);
    };
  }, [hoverWithin, withHover, withFocus, withPress]);

  useEffect(() => {
    const l = liquid.current;
    const d = dry.current;
    const w = wet.current;
    if (!l || !d || !w) return;
    const cur = inks.current;
    if (colour === cur.dry && colour === cur.wet) return;
    if (colour === cur.wet) return l.to(1);
    if (colour === cur.dry) return l.to(0);
    const showing = l.level() >= 0.5 ? cur.wet : cur.dry;
    cur.dry = showing;
    cur.wet = colour;
    d.style.color = showing;
    w.style.color = colour;
    l.snap(0);
    l.to(1);
  }, [colour]);

  return (
    <span ref={root} className={cn("ev-text-fill", className)} style={{ display: truncate ? "grid" : "inline-grid", ...(truncate && { minWidth: 0 }), ...style }}>
      <span ref={dry} className="ev-text-fill__rest" style={{ gridArea: "1 / 1", color: inks.current.dry, ...(truncate && CLIP) }}>
        {children}
      </span>
      <span
        ref={wet}
        className="ev-text-fill__lit"
        aria-hidden="true"
        style={{ gridArea: "1 / 1", color: inks.current.wet, clipPath: "inset(50%)", userSelect: "none", pointerEvents: "none", ...(truncate && CLIP) }}
      >
        {children}
      </span>
    </span>
  );
}
