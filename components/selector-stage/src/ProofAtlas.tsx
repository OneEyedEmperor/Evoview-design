import { useId, useRef, useState } from "react";
import { cn, pad } from "../foundation";
import { Heading, Note, StageFrame, defaultCopy, layersOf, radioKeys, toneClass, useOnce, useStageGate } from "./stage";
import type { AtlasContent, SelectorStageCopy, Tone } from "./types";

export type ProofAtlasProps = AtlasContent & {
  copy?: SelectorStageCopy;
  tone?: Tone;
  chapter?: boolean;
  defaultValue?: string;
  onChange?: (id: string) => void;
  headingLevel?: 2 | 3;
  className?: string;
  id?: string;
};

/**
 * Same world, different frames: a 4:3 main frame (1.22) and square thumbnails
 * in a 2-column grid (.78). Resting thumbs are graded down; the active one
 * releases colour. Phone: main frame + horizontal snap strip.
 */
export function ProofAtlas({
  heading,
  body,
  label,
  note,
  items,
  copy = defaultCopy(),
  tone = "dark",
  chapter = true,
  defaultValue,
  onChange,
  headingLevel = 2,
  className,
  id,
}: ProofAtlasProps) {
  const uid = useId();
  const headingId = `${id ?? uid}-heading`;
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((it) => it.id === defaultValue)));
  const active = items[Math.min(index, items.length - 1)];

  const revealed = useOnce(rootRef);
  const gate = useStageGate(rootRef, items.map((it) => it.media));
  const select = (i: number) => {
    setIndex(i);
    onChange?.(items[i].id);
  };
  const { layers, keyOf } = layersOf(items);

  return (
    <section
      ref={rootRef}
      id={id}
      className={cn("ev-root ev-selector-stage", toneClass(tone), chapter && "ss-chapter", className)}
      aria-labelledby={headingId}
      data-revealed={revealed || undefined}
    >
      <div className={cn(chapter && "ev-rail ev-rail--wide")}>
        <div className="ss-headsplit ss-reveal" style={{ ["--i" as string]: 0 }}>
          <Heading id={headingId} lines={heading} level={headingLevel} />
          {body && <p className="ev-t-body ss-body">{body}</p>}
        </div>
        <div className="ss-atlas">
          <div className="ss-atlas__main ss-reveal" style={{ ["--i" as string]: 1 }}>
            <StageFrame
              layers={layers}
              activeKey={keyOf(index)}
              activeMedia={active.media}
              kicker={`${copy.frame} · ${pad(index + 1)}`}
              label={active.note ? `${active.label} · ${active.note}` : active.label}
              gate={gate}
              copy={copy}
            />
          </div>
          <div
            className="ss-thumbs ss-reveal"
            style={{ ["--i" as string]: 2 }}
            role="radiogroup"
            aria-label={label}
            onKeyDown={radioKeys(items.length, index, select)}
          >
            {items.map((it, i) => {
              const selected = i === index;
              return (
                <button
                  key={it.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  data-ss-item=""
                  data-selected={selected || undefined}
                  className="ss-thumb"
                  onClick={() => select(i)}
                >
                  <img src={it.media.src} alt="" decoding="async" draggable={false} data-ready={gate.ready || undefined} />
                  <span className="ev-t-readout ss-thumb__label">
                    {pad(i + 1)} · {it.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <Note>{note}</Note>
      </div>
    </section>
  );
}
