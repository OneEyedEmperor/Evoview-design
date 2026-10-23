import { useId, useRef, useState } from "react";
import { SegmentedControl } from "../controls";
import { cn, pad } from "../foundation";
import { Heading, Note, StageFrame, defaultCopy, layersOf, toneClass, useOnce, useStageGate } from "./stage";
import type { CompareContent, SelectorStageCopy, Tone } from "./types";

export type CompareToggleProps = CompareContent & {
  /**
   * "toggle": a transformation (before / after) wiped on one frame.
   * "pair": two alternatives read side by side as peers (phone: toggle).
   */
  mode?: "toggle" | "pair";
  copy?: SelectorStageCopy;
  tone?: Tone;
  chapter?: boolean;
  /** State shown first. Default: the first ("toggle") — show the problem, then the answer. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  headingLevel?: 2 | 3;
  className?: string;
  id?: string;
};

/** Before / after on the same frame (clip-path wipe), or two alternatives side by side. */
export function CompareToggle({
  heading,
  body,
  label,
  note,
  states,
  mode = "toggle",
  copy = defaultCopy(),
  tone = "dark",
  chapter = true,
  defaultValue,
  onChange,
  headingLevel = 2,
  className,
  id,
}: CompareToggleProps) {
  const uid = useId();
  const headingId = `${id ?? uid}-heading`;
  const rootRef = useRef<HTMLElement>(null);
  const [value, setValue] = useState(() => (states.some((s) => s.id === defaultValue) ? defaultValue! : states[0].id));
  const index = Math.max(0, states.findIndex((s) => s.id === value));
  const active = states[index];

  const revealed = useOnce(rootRef);
  const gate = useStageGate(rootRef, states.map((s) => s.media));
  const choose = (v: string) => {
    setValue(v);
    onChange?.(v);
  };

  const segmented = (
    <SegmentedControl
      block
      className="ss-segmented"
      label={label}
      value={value}
      onChange={choose}
      options={states.map((s) => ({ value: s.id, label: s.label }))}
    />
  );

  const root = cn("ev-root ev-selector-stage", toneClass(tone), chapter && "ss-chapter", className);

  if (mode === "pair") {
    return (
      <section ref={rootRef} id={id} className={root} aria-labelledby={headingId} data-revealed={revealed || undefined}>
        <div className={cn(chapter && "ev-rail ev-rail--wide")}>
          <div className="ss-headsplit ss-reveal" style={{ ["--i" as string]: 0 }}>
            <Heading id={headingId} lines={heading} level={headingLevel} />
            {body && <p className="ev-t-body ss-body">{body}</p>}
          </div>
          <div className="ss-pair ss-reveal" style={{ ["--i" as string]: 1 }}>
            <div className="ss-pair__switch">{segmented}</div>
            {states.map((s, i) => {
              const { layers } = layersOf([s]);
              return (
                <div key={s.id} className="ss-pair__item" data-active={i === index || undefined}>
                  <StageFrame
                    layers={layers}
                    activeKey={layers[0].key}
                    kicker={`${pad(i + 1)} · ${s.label}`}
                    label={s.caption ?? s.label}
                    gate={gate}
                    copy={copy}
                  />
                  {s.detail && <p className="ev-t-body ss-detail">{s.detail}</p>}
                </div>
              );
            })}
            <p className="ev-sr">
              {states[0].label} {copy.versus} {states[1].label}
            </p>
          </div>
          <Note>{note}</Note>
        </div>
      </section>
    );
  }

  const { layers, keyOf } = layersOf(states);
  return (
    <section ref={rootRef} id={id} className={root} aria-labelledby={headingId} data-revealed={revealed || undefined}>
      <div className={cn(chapter && "ev-rail ev-rail--wide")}>
        <div className="ss-split ss-split--compare">
          <div className="ss-area-head ss-reveal" style={{ ["--i" as string]: 0 }}>
            <Heading id={headingId} lines={heading} level={headingLevel} />
            {body && <p className="ev-t-body ss-body">{body}</p>}
          </div>
          <div className="ss-area-controls ss-reveal" style={{ ["--i" as string]: 1 }}>
            {segmented}
            {active.detail && (
              <p className="ev-t-body ss-detail" aria-live="polite">{active.detail}</p>
            )}
            <Note>{note}</Note>
          </div>
          <div className="ss-area-stage ss-reveal" style={{ ["--i" as string]: 2 }}>
            <StageFrame
              layers={layers}
              activeKey={keyOf(index)}
              transition="wipe"
              kicker={`${active.label} · ${pad(index + 1)}`}
              label={active.caption ?? active.label}
              gate={gate}
              copy={copy}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
