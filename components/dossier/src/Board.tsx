import { useRef, useState, type CSSProperties } from "react";
import { pad, RouteLink, sequenceFillStyle, TextFill, useHeld, useHeldSrc, useInViewPause, useMediaQuery, useSequenceClock } from "../foundation";
import { isVideo, TILE_HOVER_QUERY, TOUCH_CYCLE_QUERY } from "./hooks";
import type { DossierMedia, DossierTileMedia } from "./types";

/** mosaic: exactly four, 7/5 over 4/8 (panorama ≥ 1024), 2×2 from 600, rows below. grid: any count, two columns from
    600 (one below), an odd count's first tile spanning the row. choice: the opening screen, stacked on phones (half a
    phone's width fits no photo's aspect), from 600 every tile in one row while they fit (3, 4 in the panorama ≥ 1024),
    then the grid's rule. */
export const SELECTION_BOARD_LAYOUTS = ["mosaic", "grid", "choice"] as const;
export type SelectionBoardLayout = (typeof SELECTION_BOARD_LAYOUTS)[number];

/** What a tile shows: an entry, or an item on the opening screen. */
export type SelectionTile = { id: string; title: string; kicker?: string; media?: DossierMedia };

export type SelectionBoardProps = {
  /** The tiles, in order. */
  entries: SelectionTile[];
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
  /** Default: "mosaic" for four tiles, "grid" otherwise. */
  layout?: SelectionBoardLayout;
  /** The display-face numeral on each tile. Default true. */
  numbered?: boolean;
  /** `sizes` of the tile images. Default: the panorama's. */
  sizes?: string;
  /** Graded media releasing colour on focus (default), or the photo as shot with the frame carrying the state. */
  tileMedia?: DossierTileMedia;
};

/* Index and kicker take the signal as liquid (RULES §1). */
const SIGNAL = "var(--dossier-signal)";

/** Columns per width band (s < 600, m from 600, l = the panorama from 1024) and which bands the lead tile spans. */
function columns(layout: SelectionBoardLayout, n: number) {
  const m = layout === "choice" && n <= 3 ? n : 2;
  const l = layout === "choice" && n <= 4 ? n : m;
  const odd = n > 1 && n % 2 === 1;
  const span = [m === 2 && odd ? "m" : "", l === 2 && odd ? "l" : ""].filter(Boolean).join(" ");
  return { s: 1, m: Math.max(m, 1), l: Math.max(l, 1), span: span || undefined };
}

/** The `sizes` a tile's `<img>` renders with: the media's own, else the board's (`sizes` prop, else the layout's default). */
export function tileSizes(media: DossierMedia, shape: SelectionBoardLayout, count: number, boardSizes?: string): string {
  if (media.sizes) return media.sizes;
  if (boardSizes) return boardSizes;
  if (shape === "mosaic") return "(max-width: 599px) 100vw, (max-width: 1023px) 50vw, 58vw";
  const cols = columns(shape, count);
  return `(max-width: 599px) ${cols.s > 1 ? "50vw" : "100vw"}, (max-width: 1023px) ${cols.m > 1 ? "50vw" : "100vw"}, 46vw`;
}

/** Entrance offsets of a grid tile: from its side of the board, a short stagger capped so long boards don't drag. */
function arrival(i: number, n: number, cols: number, span: boolean): CSSProperties {
  const lead = span ? 1 : 0;
  const slot = i < lead ? -1 : i - lead;
  const col = slot < 0 ? 0.5 : cols === 1 ? 0 : slot % cols;
  const row = slot < 0 ? 0 : Math.floor(slot / cols) + lead;
  const rows = Math.ceil((n - lead) / cols) + lead;
  const dx = cols === 1 || col === 0.5 ? 0 : col < (cols - 1) / 2 ? -34 : col > (cols - 1) / 2 ? 34 : 0;
  const dy = rows < 2 ? 0 : row < (rows - 1) / 2 ? -18 : row > (rows - 1) / 2 ? 18 : 0;
  return { ["--evd-n" as string]: Math.min(i, 5) + 1, ["--evd-dx" as string]: `${dx}px`, ["--evd-dy" as string]: `${dy || (rows < 2 ? 18 : 0)}px` };
}

/** The selection board: the asymmetric 4-tile mosaic, the symmetric grid, or the opening choice. Graded media releases colour on focus. */
export function SelectionBoard({ entries, label, revealed, onSelect, hrefFor, openLabel, registerTile, dwellMs = 2000, layout, numbered = true, sizes, tileMedia = "graded" }: SelectionBoardProps) {
  const tiles = entries;
  const count = tiles.length;
  const shape: SelectionBoardLayout = layout ?? (count === 4 ? "mosaic" : "grid");
  const cols = columns(shape, count);
  const boardRef = useRef<HTMLDivElement>(null);
  const touch = useMediaQuery(TOUCH_CYCLE_QUERY);
  /* The tile's signal ink on hover exists only where the CSS hover grade does. */
  const tileHover = useMediaQuery(TILE_HOVER_QUERY, true);
  const [held, setHeld] = useState(false);
  // A held stand-in (copy mounted before its media) never cycles: the live board starts the clock.
  const standIn = useHeld();
  const cycle = touch && revealed && !standIn && count > 1;
  // Modal content: runs while the page behind is suspended, stops off-screen / hidden tab / while touched.
  const pause = useInViewPause(boardRef, { ignoreSuspension: true, enabled: cycle && !held });
  const [cursor, setCursor] = useState(0);
  // Live entries may shrink the board under the cycle: the cursor wraps onto the tiles that remain.
  const active = count ? cursor % count : 0;
  const clock = useSequenceClock(active, pause.active, dwellMs, () => setCursor((i) => (i % Math.max(count, 1) + 1) % Math.max(count, 1)));
  const release = () => setHeld(false);

  return (
    <div
      ref={boardRef}
      className="evd-board"
      role="group"
      aria-label={label}
      data-layout={shape}
      data-tile-media={tileMedia}
      data-cycle={cycle || undefined}
      data-revealed={revealed || undefined}
      style={shape === "mosaic" ? undefined : ({ ["--evd-cols-s" as string]: cols.s, ["--evd-cols-m" as string]: cols.m, ["--evd-cols-l" as string]: cols.l } as CSSProperties)}
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
          data-span={i === 0 ? cols.span : undefined}
          data-cycle-focus={(cycle && active === i) || undefined}
          disabled={!revealed}
          draggable={false}
          aria-label={openLabel(i + 1, count, entry.title)}
          style={shape === "mosaic" ? undefined : arrival(i, count, cols.m, i === 0 && !!cols.span)}
        >
          {entry.media ? <TileMedia media={entry.media} sizes={tileSizes(entry.media, shape, count, sizes)} /> : <span className="evd-tile__media evd-tile__media--none" aria-hidden="true" />}
          <span className="evd-tile__grade" aria-hidden="true" />
          <span className="evd-tile__scrim" aria-hidden="true" />
          <span className="evd-tile__shine" aria-hidden="true" />
          {numbered && (
            <span className="evd-tile__num" aria-hidden="true">
              <TextFill ink={cycle && active === i ? SIGNAL : undefined} hoverWithin={tileHover ? ".evd-tile" : undefined} hoverInk={SIGNAL} withFocus={false}>
                {pad(i + 1)}
              </TextFill>
            </span>
          )}
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

function TileMedia({ media, sizes }: { media: DossierMedia; sizes: string }) {
  const style = { objectPosition: media.position ?? "50% 50%", objectFit: media.fit ?? "cover" } as const;
  const videoSrc = useHeldSrc(media.src);
  if (isVideo(media)) {
    return <video className="evd-tile__media" src={videoSrc} poster={media.poster} muted loop autoPlay playsInline preload="auto" aria-hidden="true" style={style} />;
  }
  return <img className="evd-tile__media" src={media.src} srcSet={media.srcSet} sizes={sizes} alt="" decoding="async" draggable={false} style={style} />;
}
