import { memo, useCallback, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { GhostAction, PrimaryPlate } from "../controls";
import {
  ArrowRight,
  ChannelSwitch,
  EvoviewLogo,
  OrbFill,
  Readout,
  cn,
  sequenceFillStyle,
  useInViewPause,
  useMediaReady,
  useSequenceClock,
  type SequenceClock,
} from "../foundation";
import type { CardSequenceClip, CardSequenceCopy, CardSequenceDefinition, CardSequenceLayout } from "./types";

/* Timed focus over video cards (extracted from the Tchin Tchin karaoke clip
   board and "Vivez l'Expérience" gallery, docs/extraction/tchin-card-sequence.md).
   One card holds the focus for a dwell, plays its loop, and hands over; the
   others recede. A mouse or keyboard focus takes the focus and holds the
   clock; leaving resumes the sequence with its remaining dwell. */

const DWELL_MS = 2000;
/* Pointing away releases after this, so travel between neighbours keeps the
   clock held and never flashes the rest state (RULES §6). */
const RELEASE_MS = 140;
const MAX_TILT_X = 10;
const MAX_TILT_Y = 12;
const HOVER_MIN = "(min-width: 768px)";
/* ChannelSwitch writes `position: relative` inline; the screen fills the card. */
const SCREEN_STYLE: CSSProperties = { position: "absolute", inset: 0 };

export type CardSequenceProps = {
  sequence: CardSequenceDefinition;
  copy: CardSequenceCopy;
  layout?: CardSequenceLayout;
  tone?: "dark" | "light" | "paper";
  /** Heading level of the section title; the fact tiles take the next level. Default 2. */
  headingLevel?: 2 | 3;
  /** Called on a card click; `event.preventDefault()` keeps the page. */
  onOpen?: (clip: CardSequenceClip, event: MouseEvent<HTMLAnchorElement>) => void;
  id?: string;
  className?: string;
};

export function CardSequence({ sequence, copy, layout = "gallery", tone = "dark", headingLevel = 2, onOpen, id, className }: CardSequenceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLUListElement>(null);
  const clips = sequence.clips;
  const count = clips.length;
  const dwell = sequence.dwellMs ?? DWELL_MS;

  const near = useInViewPause(boardRef, { rootMargin: "400px 0px", once: true }).active;
  const revealed = useInViewPause(rootRef, { threshold: 0.12, once: true }).active;
  const live = useInViewPause(boardRef).active;

  const [focus, setFocus] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const release = useRef(0);

  const clock = useSequenceClock(focus, live && held === null && count > 1, dwell, () => setFocus((i) => (i + 1) % count));

  const hold = useCallback((index: number) => {
    window.clearTimeout(release.current);
    setHeld(index);
  }, []);
  const letGo = useCallback(() => {
    window.clearTimeout(release.current);
    release.current = window.setTimeout(() => setHeld(null), RELEASE_MS);
  }, []);

  useEffect(() => {
    const clear = () => {
      window.clearTimeout(release.current);
      setHeld(null);
    };
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("blur", clear);
      window.clearTimeout(release.current);
    };
  }, []);

  useEffect(() => {
    if (focus >= count) setFocus(0);
  }, [focus, count]);

  const shown = held ?? focus;
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const FactHeading = headingLevel === 3 ? "h4" : "h3";
  const board = layout === "board";

  const cards = (
    <ul
      ref={boardRef}
      className="csq-board"
      style={{ "--csq-ratio": sequence.ratio ?? "9 / 16", "--csq-n": count } as CSSProperties}
      onPointerLeave={(e) => e.pointerType === "mouse" && letGo()}
    >
      {clips.map((clip, i) => (
        <SequenceCard
          key={clip.id}
          clip={clip}
          index={i}
          copy={copy}
          near={near}
          focused={shown === i}
          playing={shown === i && live}
          held={held === i}
          clock={focus === i ? clock : null}
          clockHidden={held !== null && held !== i}
          watermark={sequence.watermark ?? true}
          onHold={hold}
          onRelease={letGo}
          onOpen={onOpen}
        />
      ))}
    </ul>
  );

  return (
    <section
      ref={rootRef}
      id={id}
      className={cn("ev-root ev-card-sequence", `ev-tone-${tone}`, className)}
      data-layout={layout}
      data-revealed={revealed || undefined}
      data-live={live || undefined}
      data-nav-tone={tone === "dark" ? "dark" : "light"}
    >
      <div className="ev-rail ev-rail--wide csq-rail">
        <header className="csq-head">
          <Heading className="ev-t-section-feature csq-title">{accented(sequence.title, sequence.accent)}</Heading>
          {sequence.lead && <p className="ev-t-lead csq-lead">{sequence.lead}</p>}
        </header>

        {board ? (
          <div className="csq-split">
            {cards}
            {!!sequence.facts?.length && (
              <ul className="csq-facts">
                {sequence.facts.map((fact, i) => (
                  <li key={fact.title} className="csq-fact" style={{ "--csq-i": count + i } as CSSProperties}>
                    <FactHeading className="ev-t-label csq-fact__title">{fact.title}</FactHeading>
                    <p className="ev-t-body csq-fact__body">{fact.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          cards
        )}

        {board && sequence.offer && (
          <div className="csq-offer" style={{ "--csq-i": count + (sequence.facts?.length ?? 0) } as CSSProperties}>
            <div className="csq-offer__text">
              <p className="csq-offer__price">
                <span className="csq-offer__value">{sequence.offer.value}</span>
                {sequence.offer.unit && <span className="ev-t-body csq-offer__unit">{sequence.offer.unit}</span>}
              </p>
              {sequence.offer.note && <p className="ev-t-body csq-offer__note">{sequence.offer.note}</p>}
            </div>
            {sequence.offer.action && (
              <PrimaryPlate className="csq-offer__action" href={sequence.offer.action.href}>
                {sequence.offer.action.label}
              </PrimaryPlate>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function accented(title: string, word?: string): ReactNode {
  const at = word ? title.indexOf(word) : -1;
  if (!word || at < 0) return title;
  return (
    <>
      {title.slice(0, at)}
      <em className="csq-title__accent">{word}</em>
      {title.slice(at + word.length)}
    </>
  );
}

type CardProps = {
  clip: CardSequenceClip;
  index: number;
  copy: CardSequenceCopy;
  near: boolean;
  focused: boolean;
  playing: boolean;
  held: boolean;
  /** The clock when this card is the sequence's own focus. */
  clock: SequenceClock | null;
  /** Another card is held: this one's dwell line waits, hidden, where it stopped. */
  clockHidden: boolean;
  watermark: boolean;
  onHold: (index: number) => void;
  onRelease: () => void;
  onOpen?: CardSequenceProps["onOpen"];
};

const SequenceCard = memo(function SequenceCard({ clip, index, copy, near, focused, playing, held, clock, clockHidden, watermark, onHold, onRelease, onOpen }: CardProps) {
  const gate = useMediaReady(near, [clip.poster]);
  const linkRef = useRef<HTMLElement | null>(null);
  const frame = useRef(0);

  /* Each time the card goes live it tunes in: the channel switch (RULES §6)
     folds the poster and opens on the decoded loop. */
  const [tune, setTune] = useState(0);
  useEffect(() => {
    if (playing) setTune((n) => n + 1);
  }, [playing]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const tilt = (rx: number, ry: number, mx: number, my: number, on: boolean) => {
    const el = linkRef.current;
    if (!el) return;
    el.dataset.tilting = on ? "true" : "false";
    el.style.setProperty("--csq-rx", `${rx}deg`);
    el.style.setProperty("--csq-ry", `${ry}deg`);
    el.style.setProperty("--csq-mx", `${mx}%`);
    el.style.setProperty("--csq-my", `${my}%`);
  };

  const mouse = (e: PointerEvent) => e.pointerType === "mouse" && window.matchMedia(HOVER_MIN).matches;

  const handlers = {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => mouse(e) && onHold(index),
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (!mouse(e)) return;
      const el = linkRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => tilt((0.5 - py) * MAX_TILT_X, (px - 0.5) * MAX_TILT_Y, px * 100, py * 100, true));
    },
    onPointerLeave: () => {
      cancelAnimationFrame(frame.current);
      tilt(0, 0, 50, 50, false);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => e.currentTarget.matches(":focus-visible") && onHold(index),
    onBlur: () => onRelease(),
  };

  const body = (
    <>
      <ChannelSwitch channel={tune} className="csq-card__screen" feedClassName="csq-card__feed" style={SCREEN_STYLE}>
        {near && (
          <img
            className="csq-card__poster"
            src={clip.poster}
            alt=""
            draggable={false}
            decoding="async"
            style={{ objectPosition: clip.position }}
          />
        )}
        {clip.video && <ClipVideo src={clip.video} play={playing && gate.ready} position={clip.position} />}
      </ChannelSwitch>
      <span className="csq-card__dim" aria-hidden="true" />
      <span className="csq-card__scrim" aria-hidden="true" />
      {watermark && (
        <span className="csq-card__mark" aria-hidden="true">
          <EvoviewLogo alt="" />
        </span>
      )}
      <span className="csq-card__glare" aria-hidden="true" />
      {(gate.slow || gate.failed) && (
        <span className="csq-card__status" role="status">
          <Readout>{gate.failed ? copy.failed : copy.loading}</Readout>
        </span>
      )}
      <span className="csq-card__foot">
        <span className="csq-card__text">
          <span className="ev-t-card csq-card__title">{clip.title}</span>
          {clip.meta && <span className="ev-t-compact csq-card__meta">{clip.meta}</span>}
          {clip.href && clip.external && <span className="ev-sr"> {copy.newTab}</span>}
        </span>
        {clip.href && (
          <span className="csq-card__orb" aria-hidden="true">
            <OrbFill on={focused}>
              <ArrowRight />
            </OrbFill>
          </span>
        )}
      </span>
      {/* The dwell: mounted for the whole run of its key, so pausing (hold,
          off-screen, hidden tab) freezes it and resuming continues it. */}
      <span className="csq-card__progress" aria-hidden="true">
        {clock && <span key={clock.key} className="csq-card__fill" data-hidden={clockHidden || held || undefined} style={sequenceFillStyle(clock)} />}
        {held && <span className="csq-card__fill" data-full="" />}
      </span>
    </>
  );

  return (
    <li className="csq-card" data-focused={focused || undefined} data-media={gate.ready ? "ready" : "pending"} style={{ "--csq-i": index } as CSSProperties}>
      <span className="csq-card__bloom" aria-hidden="true" />
      {clip.href ? (
        <a
          ref={(n) => void (linkRef.current = n)}
          className="csq-card__frame"
          href={clip.href}
          target={clip.external ? "_blank" : undefined}
          rel={clip.external ? "noopener noreferrer" : undefined}
          onClick={(e) => onOpen?.(clip, e)}
          {...handlers}
        >
          {body}
        </a>
      ) : (
        <div ref={(n) => void (linkRef.current = n)} className="csq-card__frame" {...handlers}>
          {body}
        </div>
      )}
      {gate.failed && (
        <GhostAction className="csq-card__retry" onClick={gate.retry}>
          {copy.retry}
        </GhostAction>
      )}
    </li>
  );
});

/** Muted loop: the source attaches the first time the card goes live, frames show once playing. */
function ClipVideo({ src, play, position }: { src: string; play: boolean; position?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [attached, setAttached] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (play) setAttached(true);
  }, [play]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !attached) return;
    if (play) v.play().catch(() => undefined);
    else v.pause();
  }, [play, attached]);

  return (
    <video
      ref={ref}
      className="csq-card__video"
      data-visible={visible || undefined}
      src={attached ? src : undefined}
      muted
      loop
      playsInline
      preload={attached ? "auto" : "none"}
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setVisible(true)}
      onError={() => setVisible(false)}
      style={{ objectPosition: position }}
    />
  );
}
