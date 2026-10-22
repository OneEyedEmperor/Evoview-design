import type { CSSProperties } from "react";
import { cn, sequenceFillStyle, type SequenceClock } from "../foundation";
import { useControlsCopy } from "./copy";

export type SegmentedProgressProps = {
  count: number;
  /** 0-based current segment; `count` (or more) = all complete. */
  current: number;
  /** Accessible name of the instrument ("Progression", the flow name). */
  label: string;
  /** Per-segment names (aria labels, captions). Default "Étape n sur N". */
  labels?: string[];
  /** Complete segments; default: those before `current`. */
  isComplete?: (index: number) => boolean;
  /** "sm" 3px cells (sheets, headers), "lg" 6px cells in an instrument shell. */
  size?: "sm" | "lg";
  /** Static 0–1 charge of the current segment (scroll, upload). */
  fill?: number;
  /** Timed charge of the current segment, from `useSequenceClock` (pauses with it). */
  clock?: Pick<SequenceClock, "key" | "duration" | "elapsed" | "running" | "done">;
  /** Makes segments buttons (jump to a step). */
  onSelect?: (index: number) => void;
  /** Which segments can be jumped to; default all except the current one. */
  canSelect?: (index: number) => boolean;
  /** Show `labels` above the cells. */
  captions?: boolean;
  className?: string;
};

/** Equal segments: current charges (foreground), complete = accent; optionally clickable, aria-current="step". */
export function SegmentedProgress({
  count,
  current,
  label,
  labels,
  isComplete,
  size = "sm",
  fill,
  clock,
  onSelect,
  canSelect,
  captions = false,
  className,
}: SegmentedProgressProps) {
  const copy = useControlsCopy();
  const nameOf = (i: number) => labels?.[i] ?? copy.step(i + 1, count);
  const done = (i: number) => (isComplete ? isComplete(i) : i < current);

  return (
    <ol
      className={cn("ev-controls evc-progress", `evc-progress--${size}`, onSelect && "evc-progress--interactive", className)}
      aria-label={label}
      style={{ ["--evc-progress-n" as string]: count }}
    >
      {Array.from({ length: count }, (_, i) => {
        const isCurrent = i === current;
        const state = isCurrent ? "current" : done(i) ? "done" : "upcoming";
        const status = copy.stepStatus[state];
        const fillStyle: CSSProperties | undefined = isCurrent
          ? clock
            ? sequenceFillStyle(clock)
            : { transform: `scaleX(${Math.max(0, Math.min(1, fill ?? 0))})` }
          : undefined;
        const cell = (
          <>
            {captions && <span className="ev-t-readout evc-progress__caption" aria-hidden="true">{nameOf(i)}</span>}
            <span className="evc-progress__cell" aria-hidden="true">
              <span key={isCurrent && clock ? `${clock.key}` : undefined} className={cn("evc-progress__fill", isCurrent && clock && "evc-progress__fill--clock")} style={fillStyle} />
            </span>
          </>
        );
        const selectable = !!onSelect && (canSelect ? canSelect(i) : !isCurrent);
        return (
          <li key={i} data-state={state} aria-current={isCurrent ? "step" : undefined}>
            {onSelect ? (
              <button type="button" className="evc-progress__hit" aria-label={`${nameOf(i)} · ${status}`} aria-current={isCurrent ? "step" : undefined} disabled={!selectable} onClick={() => onSelect(i)}>
                {cell}
              </button>
            ) : (
              <>
                <span className="ev-sr">{`${nameOf(i)} · ${status}`}</span>
                {cell}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
