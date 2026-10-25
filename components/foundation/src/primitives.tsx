import type { ElementType, HTMLAttributes, ReactNode } from "react";
import EvoviewLogo from "./brand/EvoviewLogo";
import { EVOVIEW_URL } from "./tokens";
import { cn, pad } from "./utils";

type ReadoutProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** "lg" = instrument readout (12px+), default = technical label (9px floor). */
  size?: "md" | "lg";
  children?: ReactNode;
};

/** Satoshi 700 uppercase: where / state (indices, counters, status, kickers). */
export function Readout({ as: Tag = "span", size = "md", className, ...rest }: ReadoutProps) {
  return <Tag className={cn(size === "lg" ? "ev-t-readout-lg" : "ev-t-readout", className)} {...rest} />;
}

type IndexProps = {
  /** 1-based. */
  current: number;
  total: number;
  /** Spoken form, e.g. "Étape 2 sur 4". Without it the visible "02 / 04" is read. */
  srLabel?: string;
  size?: "md" | "lg";
  className?: string;
};

/** `01 / 04` — every repeated object carries an index. */
export function Index({ current, total, srLabel, size = "md", className }: IndexProps) {
  return (
    <span className={cn(size === "lg" ? "ev-t-readout-lg" : "ev-t-readout", "ev-index", className)}>
      <span aria-hidden={srLabel ? true : undefined}>
        <span className="ev-index__current">{pad(current)}</span> / <span className="ev-index__total">{pad(total)}</span>
      </span>
      {srLabel && <span className="ev-sr">{srLabel}</span>}
    </span>
  );
}

type StepGaugeProps = {
  /** 1-based position. */
  current: number;
  total: number;
  /** Spoken form, e.g. "Étape 2 sur 4". Omit inside an `<ol>` (order is already announced). */
  srLabel?: string;
  className?: string;
};

/**
 * Position in a vertical list as a battery: one segment per item, filled from
 * the bottom up to `current` (2 of 4 = half). Replaces `01`…`04` readouts at
 * the head of stacked list rows. Fill colour follows `currentColor`
 * (set `color` on the gauge or an ancestor); empty segments use `--ev-gauge-empty`.
 */
export function StepGauge({ current, total, srLabel, className }: StepGaugeProps) {
  return (
    <span className={cn("ev-gauge", className)} style={{ ["--ev-gauge-n" as string]: total }}>
      <span className="ev-gauge__cells" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="ev-gauge__cell" data-on={total - i <= current || undefined} />
        ))}
      </span>
      {srLabel && <span className="ev-sr">{srLabel}</span>}
    </span>
  );
}

/** 20px heading marker with the accent dot. `live` adds a slow ambient pulse (pauses with the page). */
export function SectionMarker({ live = false, className }: { live?: boolean; className?: string }) {
  return <span className={cn("ev-marker", live && "ev-ambient", className)} data-live={live || undefined} aria-hidden="true" />;
}

type EvoviewMarkProps = {
  /** Accessible name in the page language; must name Evoview and the new tab. */
  label: string;
  href?: string;
  className?: string;
};

/**
 * The approved Evoview attribution: one linked wordmark per component, in its
 * header / chassis strip, never inside or next to a client CTA.
 */
export function EvoviewMark({ label, href = EVOVIEW_URL, className }: EvoviewMarkProps) {
  return (
    <a className={cn("ev-attribution", className)} href={href} target="_blank" rel="noopener" aria-label={label}>
      <EvoviewLogo alt="" />
    </a>
  );
}

export { EvoviewLogo };
