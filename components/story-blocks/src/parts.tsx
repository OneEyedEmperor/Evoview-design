import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn, useInViewPause, useMediaReady } from "../foundation";
import { useStoryCopy } from "./copy";
import type { Lines, StoryMedia } from "./types";

export function renderLines(lines: Lines, accentLine?: number): ReactNode {
  const list = (Array.isArray(lines) ? lines : [lines]) as readonly ReactNode[];
  return list.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {i === accentLine ? <span className="evsb-accent-line">{line}</span> : line}
    </Fragment>
  ));
}

type RevealProps = {
  as?: "div" | "li" | "header";
  /** Stagger position (× 80ms). */
  index?: number;
  /** "text": y24 / 600ms · "media": y45 / 900ms. */
  kind?: "text" | "media";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * Reveal once (y + fade) when the part is on-screen in a visible document.
 * Content is only hidden after mount with IntersectionObserver available, so
 * the stable state (everything visible) never depends on the animation.
 */
export function Reveal({ as: Tag = "div", index = 0, kind = "text", className, style, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);
  const { inView, documentVisible } = useInViewPause(ref, { threshold: 0.12, enabled: armed && !shown });

  useLayoutEffect(() => {
    if (typeof IntersectionObserver !== "undefined") setArmed(true);
  }, []);
  useEffect(() => {
    if (armed && inView && documentVisible) setShown(true);
  }, [armed, inView, documentVisible]);

  return (
    <Tag
      ref={ref as never}
      className={cn("evsb-reveal", className)}
      data-kind={kind}
      data-reveal={armed ? (shown ? "in" : "pending") : undefined}
      style={{ "--evsb-i": index, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

type FigureProps = {
  media: StoryMedia;
  className?: string;
  /** Load immediately (above the fold) instead of when near the viewport. */
  eager?: boolean;
  /** Bottom scrim for captions laid inside the media. */
  scrim?: boolean;
  /** Overlay content (caption inside the media). */
  children?: ReactNode;
};

/** Media well: the image is revealed only once decoded; text status after 350ms, retry on failure. */
export function StoryFigure({ media, className, eager = false, scrim = false, children }: FigureProps) {
  const copy = useStoryCopy();
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(eager);
  const { inView } = useInViewPause(ref, { rootMargin: "600px 0px", enabled: !near });
  useEffect(() => {
    if (inView) setNear(true);
  }, [inView]);
  const gate = useMediaReady(near, [media.src]);
  const state = gate.ready ? "ready" : gate.failed ? "failed" : gate.slow ? "loading" : "pending";

  const style = {
    "--evsb-pos": media.position ?? "50% 50%",
    "--evsb-pos-phone": media.positionPhone ?? media.position ?? "50% 50%",
    "--evsb-fit": media.fit ?? "cover",
  } as CSSProperties;

  return (
    <figure ref={ref} className={cn("evsb-figure", className)} data-state={state} style={style}>
      {near && <img className="evsb-figure__img" src={media.src} alt={media.alt} decoding="async" />}
      {scrim && <span className="evsb-figure__scrim" aria-hidden="true" />}
      {state === "loading" && (
        <span className="evsb-figure__status" role="status">
          <span className="ev-t-readout">{copy.mediaLoading}</span>
        </span>
      )}
      {state === "failed" && (
        <span className="evsb-figure__status" role="status">
          <span className="ev-t-readout">{copy.mediaFailed}</span>
          <button type="button" className="evsb-retry ev-t-readout" onClick={gate.retry}>
            {copy.retry}
          </button>
        </span>
      )}
      {children}
    </figure>
  );
}
