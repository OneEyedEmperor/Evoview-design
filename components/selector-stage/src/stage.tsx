import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { GhostAction } from "../controls";
import { Readout, cn, useInViewPause, useMediaReady, type MediaReady } from "../foundation";
import { buildSelectorStageConfig, defaultSelectorStageLocale } from "./selector-stage.config";
import type { SelectorStageCopy, StageMedia, StageVisual, Tone } from "./types";

let fallbackCopy: SelectorStageCopy | null = null;
export const defaultCopy = () => (fallbackCopy ??= buildSelectorStageConfig(defaultSelectorStageLocale).copy);

export const toneClass = (tone: Tone) => `ev-tone-${tone}`;

/** Latched once true: the element came on screen (reveal) / near the screen (media preload). */
export function useOnce(ref: RefObject<Element | null>, rootMargin = "0px") {
  const { inView } = useInViewPause(ref, { rootMargin, ignoreSuspension: true });
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);
  return seen || inView;
}

/** Media gate for every photograph of a chapter: loads once the chapter is near the viewport. */
export function useStageGate(ref: RefObject<Element | null>, media: (StageMedia | undefined)[]): MediaReady {
  const near = useOnce(ref, "600px 0px");
  return useMediaReady(near, media.map((m) => m?.src));
}

/** Radio-group keyboard: arrows / Home / End move focus and select. Items carry data-ss-item. */
export function radioKeys(count: number, current: number, select: (i: number) => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (current + 1) % count
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (current - 1 + count) % count
      : e.key === "Home" ? 0
      : e.key === "End" ? count - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
    e.currentTarget.querySelectorAll<HTMLElement>("[data-ss-item]")[next]?.focus();
  };
}

/** Two short display lines, unboxed. */
export function Heading({ id, lines, level = 2 }: { id: string; lines: ReactNode[]; level?: 2 | 3 }) {
  const Tag = level === 3 ? "h3" : "h2";
  return (
    <Tag id={id} className="ev-t-heading ss-heading">
      {lines.map((line, i) => (
        <span key={i} className="ss-heading__line">{line}</span>
      ))}
    </Tag>
  );
}

export type Layer = StageVisual & { key: string };

/** Photographs shared by several options become one layer (crop / zoom per option). */
export function layersOf(items: (StageVisual & { id: string })[]): { layers: Layer[]; keyOf: (i: number) => string } {
  const keys = items.map((it) => (it.media ? `img:${it.media.src}` : `node:${it.id}`));
  const layers: Layer[] = [];
  items.forEach((it, i) => {
    if (!layers.some((l) => l.key === keys[i])) layers.push({ key: keys[i], media: it.media, render: it.render });
  });
  return { layers, keyOf: (i) => keys[i] };
}

type StageFrameProps = {
  layers: Layer[];
  activeKey: string;
  /** Crop / zoom / alt of the active photograph (an option may reuse another's image). */
  activeMedia?: StageMedia;
  transition?: "fade" | "wipe";
  kicker: ReactNode;
  label: ReactNode;
  gate: MediaReady;
  copy: SelectorStageCopy;
  /** Bottom-edge slot (autoplay progress). */
  edge?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * The 4:3 stage: stacked layers (crossfade 300ms or clip-path wipe), caption
 * inside the frame (readout kicker + label), media-gated with an honest loader.
 */
export function StageFrame({ layers, activeKey, activeMedia, transition = "fade", kicker, label, gate, copy, edge, className, style }: StageFrameProps) {
  // Previous layer stays underneath while the new one wipes in.
  const last = useRef(activeKey);
  const prev = useRef<string | null>(null);
  if (last.current !== activeKey) {
    prev.current = last.current;
    last.current = activeKey;
  }

  return (
    <figure className={cn("ss-stage", className)} data-transition={transition} data-ready={gate.ready || undefined} style={style}>
      <div className="ss-stage__layers">
        {layers.map((layer) => {
          const active = layer.key === activeKey;
          const state = active ? "active" : layer.key === prev.current ? "prev" : "idle";
          const media = active && activeMedia ? activeMedia : layer.media;
          return (
            <div key={layer.key} className="ss-layer" data-state={state} aria-hidden={active ? undefined : true}>
              {media ? (
                <img
                  src={media.src}
                  alt={active ? media.alt : ""}
                  decoding="async"
                  draggable={false}
                  style={{ objectPosition: media.position, transform: media.scale ? `scale(${media.scale})` : undefined }}
                />
              ) : (
                layer.render
              )}
            </div>
          );
        })}
      </div>
      <span className="ss-stage__scrim" aria-hidden="true" />
      {!gate.ready && gate.slow && (
        <div className="ss-loader" role="status">
          {gate.failed ? (
            <>
              <span className="ev-t-compact">{copy.failed}</span>
              <GhostAction onClick={gate.retry}>{copy.retry}</GhostAction>
            </>
          ) : (
            <>
              <span className="ss-loader__bar" aria-hidden="true">
                <i style={{ transform: `scaleX(${gate.total ? gate.loaded / gate.total : 0})` }} />
              </span>
              <Readout>
                {copy.loading} · {String(gate.loaded).padStart(2, "0")} / {String(gate.total).padStart(2, "0")}
              </Readout>
            </>
          )}
        </div>
      )}
      <figcaption className="ss-caption">
        <Readout className="ss-caption__kicker">{kicker}</Readout>
        <span className="ss-caption__label">{label}</span>
      </figcaption>
      {edge}
    </figure>
  );
}

export function Note({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <Readout as="p" className="ss-note">{children}</Readout>;
}
