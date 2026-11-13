/* Shells of the liquid fill (RULES §1) and the press jelly hook, shared by the
   sight and the console. Colours are any CSS colour (custom properties
   included); the liquid only moves the clip.

   - TextFill: a label's colour change rises through the glyphs.
   - OrbFill: an orb's colour change rises as a level inside it.
   - SurfaceFill: a pill / button / switch track pours its new surface; put
     it as the last child of a `position: relative` host and pass the host's
     content again as it looks when filled. Driven by `on`, or by the host's
     hover with `hoverWithin`.
   - usePressJelly: call once in a component that renders `data-jelly` hosts. */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { bindLiquidHover, createLiquid, type LiquidController } from "./liquid";
import { retainPressJelly } from "./jelly";

export { JELLY_ATTR } from "./jelly";

export function usePressJelly() {
  useEffect(() => retainPressJelly(), []);
}

function useHostHover(ref: { current: HTMLElement | null }, selector: string | undefined, opts: { withFocus?: boolean; withPress?: boolean }) {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const host = selector ? ref.current?.closest<HTMLElement>(selector) : null;
    if (!host) return;
    const off = bindLiquidHover(host, setHovered, opts);
    return () => { off(); setHovered(false); };
  }, [selector, opts.withFocus, opts.withPress]);
  return hovered;
}

export interface TextFillProps {
  /** The colour shown now. A change pours in; returning to the previous colour drains. */
  ink: string;
  /** Host (closest selector) whose hover shows `hoverInk`. */
  hoverWithin?: string;
  hoverInk?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function TextFill({ ink, hoverWithin, hoverInk, children, className, style }: TextFillProps) {
  const root = useRef<HTMLSpanElement>(null);
  const dry = useRef<HTMLSpanElement>(null);
  const wet = useRef<HTMLSpanElement>(null);
  const liquid = useRef<LiquidController | null>(null);
  const hovered = useHostHover(root, hoverWithin, { withFocus: true });
  const colour = hovered && hoverInk ? hoverInk : ink;
  const inks = useRef({ dry: colour, wet: colour });

  useEffect(() => {
    if (!dry.current || !wet.current) return;
    const l = createLiquid(dry.current, wet.current, 0, 6);
    liquid.current = l;
    return () => { l.destroy(); liquid.current = null; };
  }, []);

  useEffect(() => {
    const l = liquid.current, d = dry.current, w = wet.current;
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
    <span ref={root} className={className} style={{ display: "inline-grid", ...style }}>
      <span ref={dry} style={{ gridArea: "1 / 1", color: inks.current.dry }}>{children}</span>
      <span ref={wet} aria-hidden="true" style={{ gridArea: "1 / 1", color: inks.current.wet, clipPath: "inset(50%)", userSelect: "none", pointerEvents: "none" }}>{children}</span>
    </span>
  );
}

function useLevel(on: boolean, wetRef: { current: HTMLElement | null }, dryRef: { current: HTMLElement | null } | null, maxAmp: number) {
  const liquid = useRef<LiquidController | null>(null);
  const first = useRef(on);
  useEffect(() => {
    const wet = wetRef.current;
    if (!wet) return;
    const l = createLiquid(dryRef?.current ?? document.createElement("span"), wet, first.current ? 1 : 0, maxAmp);
    liquid.current = l;
    return () => { l.destroy(); liquid.current = null; };
  }, []);
  useEffect(() => { liquid.current?.to(on ? 1 : 0); }, [on]);
}

export interface OrbFillProps {
  on: boolean;
  /** Colour poured in when on. */
  lit: string;
  /** Colour at rest (default: a step off the dark). */
  rest?: string;
  size?: number;
  /** Ring drawn around the orb (a ring may transition; the fill never cuts). */
  ring?: string;
  children?: ReactNode;
  className?: string;
}

export function OrbFill({ on, lit, rest = "var(--sx-tile-3)", size = 18, ring, children, className }: OrbFillProps) {
  const wet = useRef<HTMLSpanElement>(null);
  const dry = useRef<HTMLSpanElement>(null);
  useLevel(on, wet, dry, 9);
  const layer: CSSProperties = { position: "absolute", inset: 0, borderRadius: "inherit", display: "grid", placeItems: "center" };
  return (
    <span className={className} aria-hidden="true" style={{ position: "relative", display: "inline-block", flex: "none", width: size, height: size, borderRadius: "50%", boxShadow: ring ? `inset 0 0 0 1.5px ${ring}` : undefined }}>
      <span ref={dry} style={{ ...layer, background: rest }}>{children}</span>
      <span ref={wet} style={{ ...layer, background: lit, clipPath: on ? "none" : "inset(50%)" }}>{children}</span>
    </span>
  );
}

export interface SurfaceFillProps {
  /** Driven state; ignored when `hoverWithin` is given. */
  on?: boolean;
  hoverWithin?: string;
  /** Surface and ink once filled. */
  lit: string;
  litInk?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function SurfaceFill({ on = false, hoverWithin, lit, litInk, children, style }: SurfaceFillProps) {
  const wet = useRef<HTMLSpanElement>(null);
  const hovered = useHostHover(wet, hoverWithin, { withFocus: false });
  const filled = hoverWithin ? hovered : on;
  useLevel(filled, wet, null, 6);
  return (
    <span
      ref={wet}
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0, display: "inherit", alignItems: "inherit", justifyContent: "inherit", gap: "inherit", padding: "inherit",
        borderRadius: "inherit", background: lit, color: litInk ?? "inherit", boxShadow: `0 0 0 0.75px ${lit}`,
        clipPath: filled ? "none" : "inset(50%)", pointerEvents: "none", userSelect: "none", ...style,
      }}
    >
      {children}
    </span>
  );
}
