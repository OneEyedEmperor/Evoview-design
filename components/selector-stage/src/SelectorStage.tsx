import { useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import { OptionChip } from "../controls";
import { cn, pad, sequenceFillStyle, useInViewPause, useSequenceClock } from "../foundation";
import { Heading, Note, StageFrame, defaultCopy, layersOf, radioKeys, toneClass, useOnce, useStageGate } from "./stage";
import type { SelectorStageContent, SelectorStageCopy, Tone } from "./types";

export type SelectorStageProps = SelectorStageContent & {
  copy?: SelectorStageCopy;
  tone?: Tone;
  /** Chapter padding + wide rail. Off when the host chapter already provides them. */
  chapter?: boolean;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Cycle the options under the pause model. Off by default; a manual choice stops it. */
  autoplay?: boolean | { dwellMs?: number };
  headingLevel?: 2 | 3;
  className?: string;
  id?: string;
};

const DEFAULT_DWELL = 4200;

/**
 * Compare / demonstrate one variable at a time: joined selector rows on the
 * .70 side drive a 4:3 stage on the 1.30 side. Phone: a chip strip above the
 * stage (mechanism change, not stacking).
 */
export function SelectorStage({
  heading,
  body,
  label,
  note,
  options,
  copy = defaultCopy(),
  tone = "dark",
  chapter = true,
  defaultValue,
  onChange,
  autoplay = false,
  headingLevel = 2,
  className,
  id,
}: SelectorStageProps) {
  const uid = useId();
  const headingId = `${id ?? uid}-heading`;
  const rootRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const [index, setIndex] = useState(() => Math.max(0, options.findIndex((o) => o.id === defaultValue)));
  const active = options[Math.min(index, options.length - 1)];

  const dwell = typeof autoplay === "object" && autoplay.dwellMs ? autoplay.dwellMs : DEFAULT_DWELL;
  const [auto, setAuto] = useState(Boolean(autoplay));
  const [hold, setHold] = useState(false);

  const revealed = useOnce(rootRef);
  const gate = useStageGate(rootRef, options.map((o) => o.media));
  const pause = useInViewPause(rootRef, { enabled: auto && !hold && gate.ready });

  const select = (i: number, manual: boolean) => {
    if (manual) setAuto(false);
    setIndex(i);
    onChange?.(options[i].id);
  };
  const clock = useSequenceClock(index, pause.active, dwell, () => select((index + 1) % options.length, false));

  // Keep the active chip in view inside the phone strip (never scrolls the page).
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || strip.offsetParent === null || strip.scrollWidth <= strip.clientWidth) return;
    const chip = strip.querySelectorAll<HTMLElement>("[data-ss-item]")[index];
    if (!chip) return;
    const target = chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [index]);

  const { layers, keyOf } = layersOf(options);
  const onKeyDown = radioKeys((i) => select(i, true));

  const holdOn = (e: PointerEvent) => e.pointerType === "mouse" && setHold(true);
  const holdOff = (e: PointerEvent) => e.pointerType === "mouse" && setHold(false);
  const focusIn = () => setHold(true);
  const focusOut = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false);
  };

  return (
    <section
      ref={rootRef}
      id={id}
      className={cn("ev-root ev-selector-stage", toneClass(tone), chapter && "ss-chapter", className)}
      aria-labelledby={headingId}
      data-revealed={revealed || undefined}
      data-ev-paused={pause.active ? undefined : ""}
    >
      <div className={cn(chapter && "ev-rail ev-rail--wide")}>
        <div className="ss-split">
          <div className="ss-side">
            <div className="ss-reveal" style={{ ["--i" as string]: 0 }}>
              <Heading id={headingId} lines={heading} level={headingLevel} />
              {body && <p className="ev-t-body ss-body">{body}</p>}
            </div>

            <div className="ss-selector ss-reveal" style={{ ["--i" as string]: 1 }} onPointerEnter={holdOn} onPointerLeave={holdOff} onFocus={focusIn} onBlur={focusOut}>
              {/* ≥ 1024: joined rows */}
              <div className="ss-rows" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
                {options.map((o, i) => {
                  const selected = i === index;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      tabIndex={selected ? 0 : -1}
                      data-ss-item=""
                      data-selected={selected || undefined}
                      className="ss-row"
                      onClick={() => select(i, true)}
                    >
                      <span className="ev-t-readout ss-row__index" aria-hidden="true">{pad(i + 1)}</span>
                      <span className="ev-t-label ss-row__label">{o.label}</span>
                      <span className="ss-row__bar" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              {/* < 1024: chip strip above the stage */}
              <div ref={stripRef} className="ss-chips" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
                {options.map((o, i) => (
                  <OptionChip
                    key={o.id}
                    role="radio"
                    selected={i === index}
                    index={i + 1}
                    tabIndex={i === index ? 0 : -1}
                    data-ss-item=""
                    onClick={() => select(i, true)}
                  >
                    {o.label}
                  </OptionChip>
                ))}
              </div>
              {autoplay && (
                <button type="button" className="ss-auto" onClick={() => setAuto((a) => !a)}>
                  <span className="ss-auto__icon" data-paused={!auto || undefined} aria-hidden="true" />
                  <span className="ev-t-readout">{auto ? copy.autoplayPause : copy.autoplayResume}</span>
                </button>
              )}
            </div>
          </div>

          <div className="ss-main ss-reveal" style={{ ["--i" as string]: 2 }} onPointerEnter={holdOn} onPointerLeave={holdOff}>
            <StageFrame
              layers={layers}
              activeKey={keyOf(index)}
              activeMedia={active.media}
              kicker={`${copy.view} · ${pad(index + 1)}`}
              label={active.caption ?? active.label}
              gate={gate}
              copy={copy}
              edge={
                auto ? (
                  <span className="ss-progress" aria-hidden="true">
                    <i key={clock.key} style={sequenceFillStyle(clock)} />
                  </span>
                ) : null
              }
            />
            <p className="ev-t-body ss-detail" aria-live="polite">{active.detail}</p>
            <Note>{note}</Note>
          </div>
        </div>
      </div>
    </section>
  );
}
