import { memo, useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { GhostAction } from "../controls";
import { Readout, cn, pad, useMediaReady } from "../foundation";
import type { CardTrackCopy, CardTrackItem, CardTrackMedia, CardTrackVariant } from "./types";

/* A rapid scrub must not start a media load per card it passes. */
const VIDEO_SETTLE_MS = 160;
/* Touch: movement beyond this is a swipe, not a tap. */
const TAP_SLOP_PX = 6;

export type MediaCardProps = {
  item: CardTrackItem;
  index: number;
  total: number;
  variant: CardTrackVariant;
  ribbon?: "light" | "dark";
  copy: CardTrackCopy;
  /** Focus state of the track (portrait: undimmed, title shown, bloom). */
  current?: boolean;
  /** Grade released (current, hovered or focused). */
  released?: boolean;
  /** Load media (near the viewport). */
  near?: boolean;
  /** The card's video may play now (already gated by the pause model). */
  play?: boolean;
  /** Roving tab stop. */
  tabbable?: boolean;
  onOpen?: () => void;
  onHover?: (hovering: boolean) => void;
  onFocusCard?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
};

export const MediaCard = memo(function MediaCard({
  item,
  index,
  total,
  variant,
  ribbon = "light",
  copy,
  current = false,
  released = false,
  near = true,
  play = false,
  tabbable = true,
  onOpen,
  onHover,
  onFocusCard,
  buttonRef,
  className,
  style,
}: MediaCardProps) {
  const gate = useMediaReady(near, [item.media.src]);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const label = copy.position(index + 1, total, item.title);
  const portrait = variant === "portrait";

  return (
    <article
      className={cn("ctc", `ctc--${variant}`, !portrait && `ctc--ribbon-${ribbon}`, className)}
      data-current={current || undefined}
      data-released={released || undefined}
      data-media={gate.ready ? "ready" : gate.failed ? "failed" : "pending"}
      role="group"
      aria-roledescription={copy.slide}
      aria-label={label}
      style={{ ...style, "--ctc-i": index } as CSSProperties}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover?.(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHover?.(false)}
    >
      <div className="ctc__frame">
        <div className="ctc__media">
          {near && (
            <img
              className="ctc__img"
              src={item.media.src}
              alt={item.media.alt ?? ""}
              draggable={false}
              decoding="async"
              style={{ objectFit: item.media.fit ?? "cover", objectPosition: item.media.position }}
            />
          )}
          {item.media.video && near && <CardVideo media={item.media} play={play && gate.ready} rewind={!portrait} />}
          {(gate.slow || gate.failed) && (
            <div className="ctc__status ev-tone-dark" role="status">
              <Readout>{gate.failed ? copy.failed : copy.loading}</Readout>
              {gate.failed && (
                <GhostAction className="ctc__retry" onClick={gate.retry}>
                  {copy.retry}
                </GhostAction>
              )}
            </div>
          )}
          {portrait && <span className="ctc__scrim" aria-hidden="true" />}
          {!portrait && onOpen && <Affordance copy={copy} className="ctc__affordance--center" />}
        </div>

        {portrait ? (
          <div className="ctc__identity">
            <div className="ctc__readout">
              <Readout aria-hidden="true">
                {pad(index + 1)} / {pad(total)}
              </Readout>
              {onOpen && <Affordance copy={copy} className="ctc__affordance--inline" />}
            </div>
            <h3 className="ctc__title ctc__title--portrait">
              <span className="ctc__wipe">{item.title}</span>
            </h3>
            {item.meta && <p className="ctc__meta ev-t-readout">{item.meta}</p>}
          </div>
        ) : (
          <div className="ctc__ribbon">
            {item.tab && <span className="ctc__tab ev-t-readout">{item.tab}</span>}
            <h3 className="ctc__title ev-t-card">{item.title}</h3>
            {item.body && <p className="ctc__body">{item.body}</p>}
          </div>
        )}

        {onOpen && (
          <button
            ref={buttonRef}
            type="button"
            className="ctc__open"
            aria-label={copy.open(item.title)}
            tabIndex={tabbable ? 0 : -1}
            onFocus={onFocusCard}
            onPointerDown={(e) => {
              start.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY, moved: false };
            }}
            onPointerMove={(e) => {
              const s = start.current;
              if (s && !s.moved && (Math.abs(e.clientX - s.x) > TAP_SLOP_PX || Math.abs(e.clientY - s.y) > TAP_SLOP_PX)) s.moved = true;
            }}
            onClick={() => {
              const swiped = start.current?.moved;
              start.current = null;
              if (!swiped) onOpen();
            }}
          />
        )}
      </div>
    </article>
  );
});

function Affordance({ copy, className }: { copy: CardTrackCopy; className: string }) {
  return (
    <span className={cn("ctc__affordance", className)} aria-hidden="true">
      <span className="ctc__affordance-pointer">{copy.affordance.pointer}</span>
      <span className="ctc__affordance-touch">{copy.affordance.touch}</span>
    </span>
  );
}

/** Muted loop: the source attaches after a short settle, shows only once frames play. */
function CardVideo({ media, play, rewind }: { media: CardTrackMedia; play: boolean; rewind: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [attached, setAttached] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!play || attached) return;
    const t = window.setTimeout(() => setAttached(true), VIDEO_SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [play, attached]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !attached) return;
    if (play) {
      v.playbackRate = media.playbackRate ?? 1;
      v.play().catch(() => undefined);
    } else {
      v.pause();
      if (rewind) v.currentTime = 0;
    }
  }, [play, attached, rewind, media.playbackRate]);

  return (
    <video
      ref={ref}
      className="ctc__video"
      data-visible={(play && playing) || undefined}
      src={attached ? media.video : undefined}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onError={() => setPlaying(false)}
      style={{ objectFit: media.fit ?? "cover", objectPosition: media.position }}
    />
  );
}
