import { memo, useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { OrbFill, Readout, cn, followRouteLink, useInViewPause, useMediaReady, type OrbFillController } from "../foundation";
import { IndexSeam } from "./IndexSeam";
import type { CardHeadingLevel, CardIndexColumns, CardIndexCopy, CardIndexDefinition, CardIndexItem } from "./types";

export type CardIndexProps = {
  index: CardIndexDefinition;
  copy: CardIndexCopy;
  /** Desktop columns (≥ 1024): 2 (default) or 3. 768–1023 keeps 2; phones list rows. */
  columns?: CardIndexColumns;
  /** Order as a bare number in an orb set into the seam (RULES §1). Default true. */
  numbered?: boolean;
  /** The client's emblem, centred on every veiled cover; it leaves with the veil. Decorative (aria-hidden). */
  mark?: ReactNode;
  /** Paints the chapter. Omit to inherit the host's tone. */
  tone?: "dark" | "light" | "paper";
  /** Block padding (foundation chapter rhythm). Default "standard". */
  rhythm?: "standard" | "compact" | "cinematic";
  /** Chapter heading, above the grid. */
  heading?: ReactNode;
  /** Card title level. Default 3 (the chapter heading is the h2). */
  cardHeadingLevel?: CardHeadingLevel;
  /** Plain click on a card (in-app routing); modified clicks and external cards stay native. */
  onOpen?: (item: CardIndexItem, event: MouseEvent<HTMLAnchorElement>) => void;
  id?: string;
  className?: string;
};

const SIZES: Record<CardIndexColumns, string> = {
  2: "(min-width: 768px) 50vw, 40vw",
  3: "(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 40vw",
};

/* An index of peer destinations (services, collections, pages), each card a
   link: graded cover under a dark blurred veil with the client's emblem,
   caption on a tonal tile, the order as an orb set into the seam between
   them. Hover or keyboard focus lifts the veil and runs the accent through
   the seam and round the orb (IndexSeam + OrbFill). Source: the Evoview
   Library index. */
export function CardIndex({
  index,
  copy,
  columns = 2,
  numbered = true,
  mark,
  tone,
  rhythm = "standard",
  heading,
  cardHeadingLevel = 3,
  onOpen,
  id,
  className,
}: CardIndexProps) {
  const tagged = index.items.some((item) => !!item.tag);
  return (
    <div
      id={id}
      className={cn("ev-root ev-card-index", tone && `ev-tone-${tone}`, rhythm === "standard" ? "ev-chapter" : `ev-chapter ev-chapter--${rhythm}`, className)}
      data-columns={columns}
    >
      {heading && <div className="cix-head ev-rail ev-rail--wide">{heading}</div>}
      <div className="ev-rail ev-rail--wide">
        <ol className="cix-grid" aria-label={index.label}>
          {index.items.map((item, i) => (
            <li key={item.id}>
              <IndexCard
                item={item}
                order={numbered ? i + 1 : undefined}
                tagged={tagged}
                mark={mark}
                copy={copy}
                sizes={SIZES[columns]}
                headingLevel={cardHeadingLevel}
                onOpen={onOpen}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

type IndexCardProps = {
  item: CardIndexItem;
  order?: number;
  /** Some card of the index carries a tag. */
  tagged: boolean;
  mark?: ReactNode;
  copy: CardIndexCopy;
  sizes: string;
  headingLevel: CardHeadingLevel;
  onOpen?: CardIndexProps["onOpen"];
};

const IndexCard = memo(function IndexCard({ item, order, tagged, mark, copy, sizes, headingLevel, onOpen }: IndexCardProps) {
  const orb = useRef<OrbFillController | null>(null);
  const Title = `h${headingLevel}` as "h2" | "h3" | "h4";
  const numbered = order !== undefined;
  return (
    <a
      className="cix-card"
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      draggable={false}
      onClick={onOpen && !item.external ? (e) => followRouteLink(e, () => onOpen(item, e)) : undefined}
    >
      <IndexWell item={item} mark={mark} copy={copy} sizes={sizes} />
      <div className="cix-caption">
        {numbered && (
          <span className="cix-orb" aria-hidden="true">
            <OrbFill controller={orb}>{order}</OrbFill>
          </span>
        )}
        {/* Kept empty on untagged cards of a tagged index, so titles share a line across a row. */}
        {tagged && <div className="cix-meta">{item.tag && <Readout size="lg" className="cix-tag">{item.tag}</Readout>}</div>}
        <Title className="cix-title ev-t-card">
          {item.title}
          {item.external && <span className="ev-sr"> {copy.newTab}</span>}
        </Title>
        {item.body && <p className="cix-body">{item.body}</p>}
      </div>
      {/* Keyed: the seam measures the orb once, so adding or removing it remounts the seam. */}
      <IndexSeam key={numbered ? "numbered" : "free"} orb={numbered ? orb : undefined} />
    </a>
  );
});

/* Cover: fetched once the card is near, revealed once decoded; a loop plays
   under the veil only while on screen and the page visible (pause model). */
function IndexWell({ item, mark, copy, sizes: gridSizes }: { item: CardIndexItem; mark?: ReactNode; copy: CardIndexCopy; sizes: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { media } = item;
  const near = useInViewPause(ref, { rootMargin: "600px 0px", ignoreSuspension: true, once: true }).active;
  const live = useInViewPause(ref).active;
  const srcSet = media.srcSet || undefined;
  const sizes = srcSet ? (media.sizes ?? gridSizes) : undefined;
  // The gate probes the same candidate the <img> picks, so it is fetched once.
  const gate = useMediaReady(near, [srcSet ? { src: media.src, srcSet, sizes } : media.src]);
  const state = gate.ready ? "ready" : gate.failed ? "failed" : gate.slow ? "loading" : "pending";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (live && gate.ready) void video.play().catch(() => {});
    else video.pause();
  }, [live, gate.ready]);

  return (
    <div ref={ref} className="cix-well" data-state={state} style={media.position ? ({ "--cix-pos": media.position } as CSSProperties) : undefined}>
      {near && <img className="cix-cover" src={media.src} srcSet={srcSet} sizes={sizes} alt={media.alt ?? ""} loading="lazy" decoding="async" draggable={false} />}
      {near && media.video && (
        <video ref={videoRef} className="cix-cover" poster={media.src} muted loop playsInline preload="none" disablePictureInPicture aria-hidden="true">
          <source src={media.video} type="video/mp4" />
        </video>
      )}
      {mark && (
        <span className="cix-mark" aria-hidden="true">
          {mark}
        </span>
      )}
      {/* No retry button: it may not sit inside the card's link. */}
      {(state === "loading" || state === "failed") && (
        <span className="cix-status" role="status">
          <Readout>{state === "loading" ? copy.loading : copy.failed}</Readout>
        </span>
      )}
    </div>
  );
}
