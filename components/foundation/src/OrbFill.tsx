import { useEffect, useRef, type CSSProperties, type MutableRefObject, type ReactNode } from "react";
import { bindLiquidHover, createLiquid, liquidClips, type LiquidController } from "./liquid";
/* The aria-hidden copy renders its content only once hydrated, so prerendered
   HTML carries each text once. */
import { useHydrated } from "./hydration";
import { cn } from "./utils";

/* RULES §1: an orb never switches colour by a cut or a fade. The new colour
   rises from the bottom as a liquid level with a moving wave surface that
   calms when full; the content turns to the new ink as it goes under, and
   drains back down on reversal (engine: ./liquid).

   OrbFill fills its host orb (it sits at inset 0, taking the host's radius,
   so the host needs `position: relative` and no background of its own) and
   paints both states: `--ev-orb-rest` / `--ev-orb-rest-ink` at rest,
   `--ev-orb-lit` / `--ev-orb-lit-ink` once filled. */

export type OrbFillController = LiquidController;

export type OrbFillProps = {
  /** Filled state; ignored while `hoverWithin` drives it. */
  on?: boolean;
  /** `closest()` selector of the host whose hover (and focus-visible / press,
      see below) fills the orb; disabled or busy hosts stay empty. */
  hoverWithin?: string;
  /** With `hoverWithin`: keyboard focus-visible fills too. Default true. */
  withFocus?: boolean;
  /** With `hoverWithin`: a touch press fills while held. Default false. */
  withPress?: boolean;
  /** Drive the level yourself (e.g. synced to another animation). */
  controller?: MutableRefObject<OrbFillController | null>;
  /** Content at rest. */
  children?: ReactNode;
  /** Content on the liquid; defaults to `children`. */
  lit?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const layer: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Shared wiring for the fill components: engine, hover binding, `on`, controller. */
export function useLiquid(
  refs: { root: { current: HTMLElement | null }; dry: { current: HTMLElement | null }; wet: { current: HTMLElement | null } },
  { on, hoverWithin, withFocus, withPress, controller, maxAmp }: { on: boolean; hoverWithin?: string; withFocus: boolean; withPress: boolean; controller?: MutableRefObject<LiquidController | null>; maxAmp?: number },
) {
  const ctl = useRef<LiquidController | null>(null);
  const initial = useRef(liquidClips(on ? 1 : 0));

  useEffect(() => {
    const dry = refs.dry.current;
    const wet = refs.wet.current;
    if (!dry || !wet) return;
    const liquid = createLiquid(dry, wet, on ? 1 : 0, maxAmp);
    ctl.current = liquid;
    if (controller) controller.current = liquid;
    const host = hoverWithin ? refs.root.current?.closest<HTMLElement>(hoverWithin) : null;
    const off = host ? bindLiquidHover(host, liquid, { withFocus, withPress }) : () => {};
    return () => {
      off();
      liquid.destroy();
      ctl.current = null;
      if (controller) controller.current = null;
    };
    // The engine owns its state; `on` changes are forwarded by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverWithin, withFocus, withPress, maxAmp]);

  useEffect(() => {
    if (!hoverWithin && !controller) ctl.current?.to(on ? 1 : 0);
  }, [on, hoverWithin, controller]);

  return initial.current;
}

export function OrbFill({ on = false, hoverWithin, withFocus = true, withPress = false, controller, children, lit, className, style }: OrbFillProps) {
  const root = useRef<HTMLSpanElement>(null);
  const dry = useRef<HTMLSpanElement>(null);
  const wet = useRef<HTMLSpanElement>(null);
  const [dryClip, wetClip] = useLiquid({ root, dry, wet }, { on, hoverWithin, withFocus, withPress, controller });
  const hydrated = useHydrated();

  return (
    <span
      ref={root}
      className={cn("ev-orb-fill", className)}
      aria-hidden="true"
      style={{ ...layer, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none", ...style }}
    >
      <span
        ref={dry}
        className="ev-orb-fill__rest"
        style={{ ...layer, background: "var(--ev-orb-rest, transparent)", color: "var(--ev-orb-rest-ink, inherit)", clipPath: dryClip }}
      >
        {children}
      </span>
      <span
        ref={wet}
        className="ev-orb-fill__lit"
        style={{ ...layer, background: "var(--ev-orb-lit, var(--primary, currentColor))", color: "var(--ev-orb-lit-ink, inherit)", clipPath: wetClip }}
      >
        {hydrated || on ? (lit ?? children) : null}
      </span>
    </span>
  );
}
