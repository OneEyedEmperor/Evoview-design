import { useRef, useState } from "react";
import { pad, sequenceFillStyle, useInViewPause, useSequenceClock } from "../foundation";
import { isVideo, TOUCH_CYCLE_QUERY, useMediaQuery } from "./hooks";
import type { DossierEntry, DossierMedia } from "./types";

export type SelectionBoardProps = {
  /** Four entries (the mosaic is built for exactly four destinations). */
  entries: DossierEntry[];
  /** Accessible name of the group. */
  label: string;
  /** Media decoded and the board may enter; tiles stay disabled before. */
  revealed: boolean;
  onSelect: (index: number) => void;
  /** Spoken tile name, e.g. "Ouvrir l'expérience 2 sur 4 : Cocktails". */
  openLabel: (index: number, total: number, title: string) => string;
  registerTile?: (index: number, el: HTMLButtonElement | null) => void;
  /** Touch-cycle dwell per tile. */
  dwellMs?: number;
};

/** The overview: an asymmetric 4-tile mosaic (7/5 over 4/8). Graded media releases colour on focus. */
export function SelectionBoard({ entries, label, revealed, onSelect, openLabel, registerTile, dwellMs = 2000 }: SelectionBoardProps) {
  const tiles = entries.slice(0, 4);
  const boardRef = useRef<HTMLDivElement>(null);
  const touch = useMediaQuery(TOUCH_CYCLE_QUERY);
  const [held, setHeld] = useState(false);
  const cycle = touch && revealed;
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
        <button
          key={entry.id}
          ref={(el) => registerTile?.(i, el)}
          type="button"
          className="evd-tile"
          data-index={i + 1}
          data-cycle-focus={(cycle && active === i) || undefined}
          disabled={!revealed}
          aria-label={openLabel(i + 1, tiles.length, entry.title)}
          onClick={() => onSelect(i)}
        >
          <TileMedia media={entry.media} />
          <span className="evd-tile__grade" aria-hidden="true" />
          <span className="evd-tile__scrim" aria-hidden="true" />
          <span className="evd-tile__shine" aria-hidden="true" />
          <span className="evd-tile__num" aria-hidden="true">{pad(i + 1)}</span>
          <span className="evd-tile__edge" aria-hidden="true" />
          {cycle && (
            <span className="evd-tile__track" aria-hidden="true">
              {active === i && <span key={String(clock.key)} className="evd-tile__fill" style={sequenceFillStyle(clock)} />}
            </span>
          )}
          <span className="evd-tile__caption" aria-hidden="true">
            {entry.kicker && <span className="ev-t-readout evd-tile__kicker">{entry.kicker}</span>}
            <span className="evd-tile__title">{entry.title}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function TileMedia({ media }: { media: DossierMedia }) {
  const style = { objectPosition: media.position ?? "50% 50%", objectFit: media.fit ?? "cover" } as const;
  if (isVideo(media)) {
    return <video className="evd-tile__media" src={media.src} poster={media.poster} muted loop autoPlay playsInline preload="auto" aria-hidden="true" style={style} />;
  }
  return <img className="evd-tile__media" src={media.src} srcSet={media.srcSet} sizes={media.sizes ?? "(max-width: 599px) 100vw, (max-width: 1023px) 50vw, 58vw"} alt="" decoding="async" draggable={false} style={style} />;
}
