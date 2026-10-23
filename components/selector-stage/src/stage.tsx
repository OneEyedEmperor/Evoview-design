import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { GhostAction, rovingKeyDown } from "../controls";
import { Readout, cn, useInViewPause, useMediaReady, type MediaReady } from "../foundation";
import { buildSelectorStageConfig, defaultSelectorStageLocale } from "./selector-stage.config";
import type { SelectorStageCopy, StageMedia, StageVisual, Tone } from "./types";

let fallbackCopy: SelectorStageCopy | null = null;
export const defaultCopy = () => (fallbackCopy ??= buildSelectorStageConfig(defaultSelectorStageLocale).copy);

export const toneClass = (tone: Tone) => `ev-tone-${tone}`;

/** Latched once true: the element came on screen (reveal) / near the screen (media preload). */
export function useOnce(ref: RefObject<Element | null>, rootMargin = "0px") {
  return useInViewPause(ref, { rootMargin, ignoreSuspension: true, once: true }).active;
}

/** Media gate for every photograph of a chapter: loads once the chapter is near the viewport. */
export function useStageGate(ref: RefObject<Element | null>, media: (StageMedia | undefined)[]): MediaReady {
  const near = useOnce(ref, "600px 0px");
  return useMediaReady(near, media.map((m) => m?.src));
}

/** Radio-group keyboard (controls' roving helper): arrows / Home / End move focus and select. Items carry data-ss-item. */
export function radioKeys(select: (i: number) => void) {
  return (e: KeyboardEvent<HTMLElement>) => rovingKeyDown(e, (i) => select(i), "[data-ss-item]");
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

const FADE_SETTLE_MS = 340;

/**
 * Fade stacking: the newest layer fades in on top while every layer that was
 * visible at the switch stays opaque underneath, so fast changes never show
 * the well through two half-transparent photographs. They drop once the
 * newest layer has fully arrived.
 */
function useFadeStack(activeKey: string) {
  const order = useRef<string[]>([activeKey]);
  const under = useRef<Set<string>>(new Set());
  const last = useRef(activeKey);
  if (last.current !== activeKey) {
    const next = new Set(under.current).add(last.current);
    next.delete(activeKey);
    under.current = next;
    order.current = [...order.current.filter((k) => k !== activeKey), activeKey];
    last.current = activeKey;
  }
  const [, settle] = useState(0);
  useEffect(() => {
    if (!under.current.size) return;
    const t = window.setTimeout(() => {
      under.current = new Set();
      settle((n) => n + 1);
    }, FADE_SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [activeKey]);
  return { z: (k: string) => order.current.indexOf(k) + 1, under: (k: string) => under.current.has(k) };
}

/**
 * The 4:3 stage: stacked layers (crossfade or clip-path wipe), caption inside
 * the frame (readout kicker + label), media-gated with an honest loader.
 * Wipe: the first layer is the base; later layers are sheets that clip in
 * over it and clip back out (a reversal mid-wipe turns around in place).
 */
export function StageFrame({ layers, activeKey, activeMedia, transition = "fade", kicker, label, gate, copy, edge, className, style }: StageFrameProps) {
  const stack = useFadeStack(activeKey);

  return (
    <figure className={cn("ss-stage", className)} data-transition={transition} data-ready={gate.ready || undefined} style={style}>
      <div className="ss-stage__layers">
        {layers.map((layer, i) => {
          const active = layer.key === activeKey;
          const media = active && activeMedia ? activeMedia : layer.media;
          const fade = transition === "fade";
          const state = active ? "active" : fade && stack.under(layer.key) ? "under" : "idle";
          return (
            <div
              key={layer.key}
              className="ss-layer"
              data-state={state}
              data-base={!fade && i === 0 ? "" : undefined}
              aria-hidden={active ? undefined : true}
              style={{ zIndex: fade ? stack.z(layer.key) : i }}
            >
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
