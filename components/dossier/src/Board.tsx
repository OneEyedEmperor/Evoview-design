import { useRef, useState } from "react";
import { pad, RouteLink, sequenceFillStyle, TextFill, useHeld, useHeldSrc, useInViewPause, useMediaQuery, useSequenceClock } from "../foundation";
import { isVideo, TILE_HOVER_QUERY, TOUCH_CYCLE_QUERY } from "./hooks";
import type { DossierEntry, DossierMedia } from "./types";

export type SelectionBoardProps = {
  /** Four entries (the mosaic is built for exactly four destinations). */
  entries: DossierEntry[];
  /** Accessible name of the group. */
  label: string;
  /** Media decoded and the board may enter; tiles stay disabled before. */
  revealed: boolean;
  onSelect: (index: number) => void;
  /** URL of a tile's view: tiles become `<a href>` links (plain clicks still call `onSelect`). Omitted: buttons. */
  hrefFor?: (index: number) => string | undefined;
  /** Spoken tile name, e.g. "Ouvrir l'expérience 2 sur 4 : Cocktails". */
  openLabel: (index: number, total: number, title: string) => string;
  registerTile?: (index: number, el: HTMLElement | null) => void;
  /** Touch-cycle dwell per tile. */
  dwellMs?: number;
};

/* Index and kicker take the signal as liquid (RULES §1). */
const SIGNAL = "var(--dossier-signal)";

/** The overview: an asymmetric 4-tile mosaic (7/5 over 4/8). Graded media releases colour on focus. */
export function SelectionBoard({ entries, label, revealed, onSelect, hrefFor, openLabel, registerTile, dwellMs = 2000 }: SelectionBoardProps) {
  const tiles = entries.slice(0, 4);
  const boardRef = useRef<HTMLDivElement>(null);
  const touch = useMediaQuery(TOUCH_CYCLE_QUERY);
  /* The tile's signal ink on hover exists only where the CSS hover grade does. */
  const tileHover = useMediaQuery(TILE_HOVER_QUERY, true);
  const [held, setHeld] = useState(false);
  // A held stand-in (copy mounted before its media) never cycles: the live board starts the clock.
  const standIn = useHeld();
  const cycle = touch && revealed && !standIn;
  // Modal content: runs while the page behind is suspended, stops off-screen / hidden tab / while touched.
  const pause = useInViewPause(boardRef, { ignoreSuspension: true, enabled: cycle && !held });
  const [active, setActive] = useState(0);
  const clock = useSequenceClock(active, pause.active, dwellMs, () => setActive((i) => (i + 1) % tiles.length));
  const release = () => setHeld(false);

  return (
    <div
      ref={boardRef}
      className="evd-board"
      role="group"
      aria-label={label}
      data-cycle={cycle || undefined}
      data-revealed={revealed || undefined}
      onPointerDown={() => setHeld(true)}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      {tiles.map((entry, i) => (
        <RouteLink
          key={entry.id}
          ref={(el) => registerTile?.(i, el)}
          href={hrefFor?.(i)}
          onFollow={() => onSelect(i)}
          className="evd-tile"
          data-index={i + 1}
          data-cycle-focus={(cycle && active === i) || undefined}
          disabled={!revealed}
          draggable={false}
          aria-label={openLabel(i + 1, tiles.length, entry.title)}
        >
          <TileMedia media={entry.media} />
          <span className="evd-tile__grade" aria-hidden="true" />
          <span className="evd-tile__scrim" aria-hidden="true" />
          <span className="evd-tile__shine" aria-hidden="true" />
          <span className="evd-tile__num" aria-hidden="true">
            <TextFill ink={cycle && active === i ? SIGNAL : undefined} hoverWithin={tileHover ? ".evd-tile" : undefined} hoverInk={SIGNAL} withFocus={false}>
              {pad(i + 1)}
            </TextFill>
          </span>
          <span className="evd-tile__edge" aria-hidden="true" />
          {cycle && (
            <span className="evd-tile__track" aria-hidden="true">
              {active === i && <span key={String(clock.key)} className="evd-tile__fill" style={sequenceFillStyle(clock)} />}
            </span>
          )}
          <span className="evd-tile__caption">
            {entry.kicker && (
              <span className="ev-t-readout evd-tile__kicker">
                <TextFill ink={cycle && active === i ? SIGNAL : undefined} hoverWithin={tileHover ? ".evd-tile" : undefined} hoverInk={SIGNAL} withFocus={false}>
                  {entry.kicker}
                </TextFill>
              </span>
            )}
            <span className="evd-tile__title">{entry.title}</span>
          </span>
        </RouteLink>
      ))}
    </div>
  );
}

function TileMedia({ media }: { media: DossierMedia }) {
  const style = { objectPosition: media.position ?? "50% 50%", objectFit: media.fit ?? "cover" } as const;
  const videoSrc = useHeldSrc(media.src);
  if (isVideo(media)) {
    return <video className="evd-tile__media" src={videoSrc} poster={media.poster} muted loop autoPlay playsInline preload="auto" aria-hidden="true" style={style} />;
  }
  return <img className="evd-tile__media" src={media.src} srcSet={media.srcSet} sizes={media.sizes ?? "(max-width: 599px) 100vw, (max-width: 1023px) 50vw, 58vw"} alt="" decoding="async" draggable={false} style={style} />;
}
