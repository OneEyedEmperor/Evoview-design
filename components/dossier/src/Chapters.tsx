import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn, pad, useHeldSrc, useHydrated } from "../foundation";
import type { DossierMedia, DossierTileMedia } from "./types";
import { isVideo } from "./hooks";

/* Open chapters for a dossier detail: claim → artefact → one interpreting
   sentence. Chapters are unboxed; they separate by spacing and an
   alternating near-black, never by rules. Any block library (e.g.
   story-blocks) may replace the inner pieces; keep DossierChapter as the
   shell. */

/** Provided by the dossier body: registers a chapter for its scroll-driven reveal; returns the unregister. */
export type ChapterReveal = (el: HTMLElement, reveal: () => void) => () => void;
export const ChapterRevealContext = createContext<ChapterReveal | null>(null);

/** Provided by the dossier body: the config's `tileMedia`, so row thumbnails take the board's treatment. */
export const ChapterMediaContext = createContext<DossierTileMedia>("graded");

export const DOSSIER_CHAPTER_VARIANTS = ["intro", "standard", "payoff"] as const;
export type DossierChapterVariant = (typeof DOSSIER_CHAPTER_VARIANTS)[number];

export type DossierChapterProps = {
  /** "a" #0c0c0d, "b" #101011 (alternate them), "paper" light chapter inside the dark shell. */
  tone?: "a" | "b" | "paper";
  /** "intro" opens the story (tighter top, enters with the detail), "payoff" closes it (bloom). */
  variant?: DossierChapterVariant;
  className?: string;
  children: ReactNode;
};

export function DossierChapter({ tone = "a", variant = "standard", className, children }: DossierChapterProps) {
  const ref = useRef<HTMLElement>(null);
  const register = useContext(ChapterRevealContext);
  // The intro enters with the detail itself; outside a dossier body there is no choreography.
  const [revealed, setRevealed] = useState(variant === "intro" || !register);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || revealed || !register) return;
    return register(el, () => setRevealed(true));
  }, [register, revealed]);
  // Hidden while pending only once hydrated: server HTML (crawlers, no script) carries every chapter at rest.
  const pending = useHydrated() && !revealed;
  return (
    <section ref={ref} className={cn("evd-chapter", `evd-chapter--${variant}`, tone === "paper" && "ev-tone-light", className)} data-tone={tone} data-pending={pending || undefined}>
      <div className="evd-rail">{children}</div>
    </section>
  );
}

export type ChapterHeadProps = {
  title: ReactNode;
  lead?: ReactNode;
  body?: ReactNode;
  /** "title" once per story (intro), "heading" per chapter. */
  level?: "title" | "heading";
  /** "h1": the detail's title as the view's h1 (entry `heading: "content"`, with `id` = `ctx.headingId`). */
  as?: "h1" | "h2" | "h3";
  id?: string;
};

/** Title / copy split, .72 / 1.28; copy bottom-aligned. */
export function ChapterHead({ title, lead, body, level = "heading", as: Tag = level === "title" ? "h2" : "h3", id }: ChapterHeadProps) {
  return (
    <div className={cn("evd-head", !lead && !body && "evd-head--solo")}>
      <Tag id={id} className={level === "title" ? "ev-t-title" : "ev-t-heading"}>{title}</Tag>
      {(lead || body) && (
        <div className="evd-head__copy">
          {lead && <p className="ev-t-lead evd-head__lead">{lead}</p>}
          {body && <p className="ev-t-body evd-head__body">{body}</p>}
        </div>
      )}
    </div>
  );
}

export type ChapterFigureProps = {
  media: DossierMedia & { alt: string };
  /** "hero" 16:10 → 4:5 phone, "stage" 4:3, or a number (w / h). */
  ratio?: "hero" | "stage" | number;
  /** `kicker` optional: without text, no kicker element (RULES §1: no small label over a title). */
  caption?: { kicker?: string; title: string };
  className?: string;
};

/** Media well with the caption inside (readout kicker + accent dot + title). */
export function ChapterFigure({ media, ratio = "stage", caption, className }: ChapterFigureProps) {
  const style = { objectPosition: media.position ?? "50% 50%", objectFit: media.fit ?? "cover" } as const;
  const videoSrc = useHeldSrc(media.src);
  return (
    <figure
      className={cn("evd-figure", typeof ratio === "string" && `evd-figure--${ratio}`, className)}
      style={typeof ratio === "number" ? { aspectRatio: String(ratio) } : undefined}
    >
      {isVideo(media) ? (
        <video src={videoSrc} poster={media.poster} muted loop autoPlay playsInline aria-label={media.alt} style={style} />
      ) : (
        <img src={media.src} srcSet={media.srcSet} sizes={media.sizes} alt={media.alt} decoding="async" style={style} />
      )}
      {caption && (
        <figcaption className="evd-figure__caption">
          {caption.kicker?.trim() && <span className="ev-t-readout evd-figure__kicker">{caption.kicker}</span>}
          <span className="evd-figure__title">{caption.title}</span>
          <span className="evd-figure__dot" aria-hidden="true" />
        </figcaption>
      )}
    </figure>
  );
}

/** Side / stage split, .7 / 1.3. The stage (larger side) holds the proof; on phones it comes first. */
export function ChapterSplit({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="evd-split">
      <div className="evd-split__aside">{aside}</div>
      <div className="evd-split__stage">{children}</div>
    </div>
  );
}

export type ChapterRow = {
  label: ReactNode;
  detail: ReactNode;
  index?: string;
  /** Thumbnail beside the text (a dish, a product): an image (a video shows its poster). Decorative unless `alt` is set;
      lazy, outside the media gate (list the first rows' media in `entry.sources` when the rows open the entry). */
  media?: DossierMedia;
  /** Small marks after the label (dietary icons, a short tag): nodes carrying their own accessible name. */
  marks?: ReactNode;
};

export type ChapterRowsProps = {
  rows: ChapterRow[];
  /** Accent index column, only when the rows are a sequence. */
  numbered?: boolean;
  /** Tonal surfaces (RULES §3): "rows" one panel, rows alternating a step (info sheets, programmes); "tiles" one surface per item (peers). */
  surface?: ChapterRowsSurface;
  className?: string;
};

export const CHAPTER_ROWS_SURFACES = ["rows", "tiles"] as const;
export type ChapterRowsSurface = (typeof CHAPTER_ROWS_SURFACES)[number];

/** Default `sizes` of a row thumbnail: its column width (5.5em phones, 7em from 768) at the 16px root. */
const ROW_MEDIA_SIZES = "(min-width: 768px) 112px, 88px";

function RowMedia({ media }: { media: DossierMedia }) {
  const src = isVideo(media) ? media.poster : media.src;
  if (!src) return null;
  return (
    <span className="evd-rows__media">
      <img
        src={src}
        srcSet={isVideo(media) ? undefined : media.srcSet}
        sizes={isVideo(media) || !media.srcSet ? undefined : (media.sizes ?? ROW_MEDIA_SIZES)}
        alt={media.alt ?? ""}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: media.position ?? "50% 50%", objectFit: media.fit ?? "cover" }}
      />
    </span>
  );
}

/** A text list on tonal surfaces: label · detail, no rules. Rows may carry a thumbnail (`media`) and marks. */
export function ChapterRows({ rows, numbered = false, surface = "rows", className }: ChapterRowsProps) {
  const tileMedia = useContext(ChapterMediaContext);
  const withMedia = rows.some((row) => row.media);
  return (
    <ol className={cn("evd-rows", numbered && "evd-rows--numbered", className)} data-surface={surface} data-media={withMedia ? tileMedia : undefined}>
      {rows.map((row, i) => (
        <li key={i} className="evd-rows__row" data-has-media={row.media ? "" : undefined}>
          {row.media && <RowMedia media={row.media} />}
          {numbered && <span className="ev-t-readout evd-rows__index">{row.index ?? pad(i + 1)}</span>}
          <span className="ev-t-label evd-rows__label">
            {row.label}
            {row.marks && <span className="evd-rows__marks">{row.marks}</span>}
          </span>
          <span className="evd-rows__detail">{row.detail}</span>
        </li>
      ))}
    </ol>
  );
}

/** Paper specimen inside the dark shell: a demonstration of a client artefact (menu, card, plan). The note says it is an example. */
export function ChapterSpecimen({ note, children }: { note?: string; children: ReactNode }) {
  return (
    <div className="ev-tone-paper evd-specimen">
      {children}
      {note && <p className="ev-t-compact evd-specimen__note">{note}</p>}
    </div>
  );
}

export type ChapterPayoffProps = {
  /** Two short lines, period-terminated. */
  lines: string[];
  /** Index of the line taking the accent (signal). */
  accentLine?: number;
  lead?: ReactNode;
  results?: { value: string; label: string }[];
  /** The one exit CTA of the story (client action), e.g. a PrimaryPlate. */
  action?: ReactNode;
  /** Consequence readout under the CTA ("Quitte le dossier"). */
  consequence?: string;
};

/** Closing band: statement 1.2 | .8 action, results row below. */
export function ChapterPayoff({ lines, accentLine, lead, results, action, consequence }: ChapterPayoffProps) {
  return (
    <div className="evd-payoff">
      <div className="evd-payoff__statement">
        <h3 className="ev-t-display">
          {lines.map((line, i) => (
            <span key={i} className={cn("evd-payoff__line", i === accentLine && "evd-payoff__line--accent")}>
              {line}
            </span>
          ))}
        </h3>
        {lead && <p className="ev-t-lead evd-payoff__lead">{lead}</p>}
        {results && results.length > 0 && (
          <dl className="evd-payoff__results">
            {results.map((r, i) => (
              <div key={i}>
                <dt className="ev-t-compact">{r.label}</dt>
                <dd className="evd-payoff__value">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {action && (
        <div className="evd-payoff__action">
          {action}
          {consequence && <span className="ev-t-readout evd-payoff__consequence">{consequence}</span>}
        </div>
      )}
    </div>
  );
}
