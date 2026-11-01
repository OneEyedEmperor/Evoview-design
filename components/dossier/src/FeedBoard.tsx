import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import {
  ArrowLeft,
  ArrowRight,
  followRouteLink,
  RouteLink,
  TextFill,
  useHeldSrc,
  useHydrated,
  useInViewPause,
  useMediaQuery,
  useMediaReady,
  useSequenceClock,
} from "../foundation";
import { GhostAction, PrimaryPlate } from "../controls";
import { ChapterFigure, ChapterHead, DossierChapter } from "./Chapters";
import { feedOf, feedPageEntries, feedTileSizes, feedTileSource } from "./feed";
import { isVideo, TILE_HOVER_QUERY, toSource } from "./hooks";
import type { DossierEntry, DossierFeedCopy, DossierItem, DossierMedia, DossierTileMedia } from "./types";

/** What a feed board view remembers while the dossier stays open (a detail and back): batches shown, scroll. */
export type FeedMemory = { through?: number; scroll?: number };

type FeedBoardProps = {
  item: DossierItem;
  /** The view's page: the first batch (gated with the overview), the rest appended below it. */
  start: number;
  memory: FeedMemory;
  /** The dossier body: the sentinel's scroll root. */
  scrollRoot: RefObject<HTMLElement | null>;
  label: string;
  copy: DossierFeedCopy;
  tileMedia: DossierTileMedia;
  /** URL of an entry (by id) or a page; undefined: buttons. */
  entryHref: (id: string) => string | undefined;
  pageHref: (page: number) => string | undefined;
  onEntry: (id: string) => void;
  onPage: (page: number) => void;
  registerTile: (index: number, el: HTMLElement | null) => void;
};

const SIGNAL = "var(--dossier-signal)";
/** The next batch is asked for while the end of the board is still this far below the body's bottom. */
const SENTINEL_MARGIN = 600;

/**
 * The feed board: one batch per page, in one continuous grid. Tiles never move once placed: a batch is appended
 * below, as placeholders first (the cells it will take), then its tiles held until their media is decoded, then
 * revealed in place. Existing tiles neither re-enter nor wait. Below the grid: a real link to the next page (crawlers,
 * no script, keyboard), loading it in place on a plain click; the sentinel asks for it on scroll; then the error, cap
 * or end state.
 */
export function FeedBoard({ item, start, memory, scrollRoot, label, copy, tileMedia, entryHref, pageHref, onEntry, onPage, registerTile }: FeedBoardProps) {
  const feed = feedOf(item);
  const hydrated = useHydrated();
  const tileHover = useMediaQuery(TILE_HOVER_QUERY, true);
  const [through, setThroughState] = useState(() => Math.max(start, memory.through ?? start));
  const setThrough = (next: number) => {
    memory.through = next;
    setThroughState(next);
  };
  const [revealed, setRevealed] = useState<Record<number, true>>({});
  const [said, setSaid] = useState("");
  const boardRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  /* Batches start … through: a loaded page shows its tiles, a page on its way its placeholders; the first page that
     failed or does not exist ends the board. */
  const batches: { page: number; entries: DossierEntry[] | null }[] = [];
  let stop: "error" | "end" | null = null;
  let stopPage = 0;
  for (let p = start; p <= through; p++) {
    const status = feed.pageStatus(p);
    if (status === "error" || status === "missing") {
      stop = status === "error" ? "error" : "end";
      stopPage = p;
      break;
    }
    batches.push({ page: p, entries: status === "ready" ? feedPageEntries(item, p) : null });
  }
  const last = batches[batches.length - 1];
  const lastPage = feed.pages.find((p) => p.page === last?.page);
  if (!stop && lastPage && lastPage.next === null) stop = "end";
  const lastReady = !!last?.entries && (last.page === start || revealed[last.page]);
  const more = !stop && !!lastPage;
  const capped = through - start + 1 >= feed.batchCap;
  const canAppend = hydrated && more && lastReady && !capped;

  // Pages the board shows but the feed has not asked for yet (a remembered board after a fresh open, an append).
  useEffect(() => {
    for (let p = start + 1; p <= through; p++) if (feed.pageStatus(p) === "idle") feed.loadPage(p);
  });

  const append = () => {
    if (!canAppend) return;
    setSaid(copy.loading);
    // A page that failed earlier (another board view) is asked for again: appending is the visitor's new request.
    if (feed.pageStatus(through + 1) === "error") feed.loadPage(through + 1, true);
    setThrough(through + 1);
  };

  /* The sentinel: the foot nearing the body's bottom asks for the next batch. The observer only wakes the check; the
     distance is read when it fires and again whenever a batch lands (a tall window keeps filling, one batch at a time). */
  const [crossings, setCrossings] = useState(0);
  useEffect(() => {
    const el = footRef.current;
    const root = scrollRoot.current;
    if (!el || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(() => setCrossings((n) => n + 1), { root, rootMargin: `0px 0px ${SENTINEL_MARGIN}px 0px` });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRoot]);
  useEffect(() => {
    const el = footRef.current;
    const root = scrollRoot.current;
    if (!canAppend || !el || !root) return;
    if (el.getBoundingClientRect().top - root.getBoundingClientRect().bottom < SENTINEL_MARGIN) append();
  }, [crossings, canAppend]); // eslint-disable-line react-hooks/exhaustive-deps

  // Where the visitor is on this board, so a detail and back returns to it.
  useEffect(() => {
    const root = scrollRoot.current;
    if (!root) return;
    const save = () => {
      // Not once the board has left (a detail taking the body resets its scroll before this listener is gone).
      if (boardRef.current?.isConnected) memory.scroll = root.scrollTop;
    };
    root.addEventListener("scroll", save, { passive: true });
    return () => root.removeEventListener("scroll", save);
  }, [scrollRoot, memory]);

  /* Live updates (`refreshMs`): page 1 is checked on a clock that runs only while the board is on screen, the
     document visible and nothing is waiting (pause model); what it finds waits behind the control. */
  const watching = hydrated && start === 1 && !!feed.checkFresh && !!feed.refreshMs && feed.fresh === 0;
  const pause = useInViewPause(boardRef, { ignoreSuspension: true, enabled: watching });
  const [checks, setChecks] = useState(0);
  useSequenceClock(checks, pause.active, feed.refreshMs ?? 60_000, () => {
    feed.checkFresh?.();
    setChecks((n) => n + 1);
  });
  const showFresh = () => {
    feed.showFresh();
    setThrough(start);
    setRevealed({});
    const root = scrollRoot.current;
    if (root) root.scrollTop = 0;
  };

  const offsets = (i: number) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    return { ["--evd-n" as string]: Math.min(i, 5) + 1, ["--evd-dx" as string]: `${col === 0 ? -34 : col === 2 ? 34 : 0}px`, ["--evd-dy" as string]: `${row === 0 ? -18 : row >= 2 ? 18 : 0}px` } as CSSProperties;
  };

  return (
    <div className="evd-feed" data-tile-media={tileMedia}>
      {feed.fresh > 0 && start === 1 && (
        <div className="evd-feed__fresh">
          <button type="button" className="evd-feed__fresh-pill" data-ev-jelly="" aria-label={copy.freshAria(feed.fresh)} onClick={showFresh}>
            <ArrowRight />
            <span>{copy.fresh(feed.fresh)}</span>
          </button>
        </div>
      )}
      {start >= 2 && (
        <FeedLink className="evd-feed__newer" icon={<ArrowLeft />} iconPosition="start" href={pageHref(start - 1)} onFollow={() => onPage(start - 1)}>
          {copy.newer}
        </FeedLink>
      )}
      <div ref={boardRef} className="evd-board" role="group" aria-label={label} data-layout="feed" data-tile-media={tileMedia} data-revealed="">
        {batches.map((batch) => {
          if (!batch.entries) {
            return Array.from({ length: feed.pageSize }, (_, i) => <span key={`ghost-${batch.page}-${i}`} className="evd-feed__ghost" aria-hidden="true" />);
          }
          return (
            <FeedBatch
              key={`batch-${batch.page}`}
              page={batch.page}
              entries={batch.entries}
              first={batch.page === start}
              offset={(batch.page - 1) * feed.pageSize}
              offsets={offsets}
              tileHover={tileHover}
              copy={copy}
              entryHref={entryHref}
              onEntry={onEntry}
              registerTile={(i, el) => registerTile(item.entries.findIndex((e) => e.id === batch.entries?.[i]?.id), el)}
              onRevealed={() => {
                setRevealed((r) => (r[batch.page] ? r : { ...r, [batch.page]: true }));
                if (batch.page !== start) setSaid(copy.loaded(batch.entries?.length ?? 0));
              }}
            />
          );
        })}
      </div>
      <div ref={footRef} className="evd-feed__foot">
        {stop === "error" && (
          <div className="evd-feed__state" role="alert">
            <p className="ev-t-body">{copy.failed}</p>
            <PrimaryPlate onClick={() => feed.loadPage(stopPage, true)}>{copy.retry}</PrimaryPlate>
          </div>
        )}
        {stop === "end" && batches.length > 0 && (
          <div className="evd-feed__state">
            <p className="ev-t-body">{copy.end}</p>
          </div>
        )}
        {more && (
          <FeedLink
            className="evd-feed__older"
            icon={<ArrowRight />}
            iconPosition="end"
            href={pageHref(through + 1)}
            busy={!lastReady}
            onFollow={() => (capped ? onPage(through + 1) : append())}
          >
            {copy.older}
          </FeedLink>
        )}
      </div>
      <span className="ev-sr" role="status">{said}</span>
    </div>
  );
}

type FeedBatchProps = {
  page: number;
  entries: DossierEntry[];
  /** The view's own page: revealed with the overview (its gate and the board's Signature entrance). */
  first: boolean;
  /** Place of the batch's first entry in the feed ((page − 1) × pageSize): spoken positions continue across pages. */
  offset: number;
  offsets: (i: number) => CSSProperties;
  tileHover: boolean;
  copy: DossierFeedCopy;
  entryHref: (id: string) => string | undefined;
  onEntry: (id: string) => void;
  registerTile: (i: number, el: HTMLElement | null) => void;
  onRevealed: () => void;
};

/** An appended batch waits on its own media (decoded, or failed: the tile keeps its well), never on another's. */
function FeedBatch({ entries, first, offset, offsets, tileHover, copy, entryHref, onEntry, registerTile, onRevealed }: FeedBatchProps) {
  const sources = useMemo(() => entries.map((e) => feedTileSource(e.media)), [entries]);
  const gate = useMediaReady(!first, sources);
  const shown = first || gate.ready || gate.failed;
  const onRevealedRef = useRef(onRevealed);
  onRevealedRef.current = onRevealed;
  useEffect(() => {
    if (shown) onRevealedRef.current();
  }, [shown]);
  return entries.map((entry, i) => (
    <RouteLink
      key={entry.id}
      ref={(el) => registerTile(i, el)}
      href={entryHref(entry.id)}
      onFollow={() => onEntry(entry.id)}
      className="evd-tile"
      data-enter={first ? "board" : shown ? "batch" : undefined}
      data-held={!shown || undefined}
      disabled={!shown}
      draggable={false}
      aria-label={copy.open(offset + i + 1, entry.title)}
      style={first ? offsets(i) : ({ ["--evd-n" as string]: Math.min(i, 5) + 1 } as CSSProperties)}
    >
      <FeedMedia media={entry.media} lazy={!first} />
      <span className="evd-tile__grade" aria-hidden="true" />
      <span className="evd-tile__scrim" aria-hidden="true" />
      <span className="evd-tile__shine" aria-hidden="true" />
      <span className="evd-tile__edge" aria-hidden="true" />
      <span className="evd-tile__caption">
        {entry.kicker && (
          <span className="ev-t-readout evd-tile__kicker">
            <TextFill hoverWithin={tileHover ? ".evd-tile" : undefined} hoverInk={SIGNAL} withFocus={false}>
              {entry.kicker}
            </TextFill>
          </span>
        )}
        <span className="evd-tile__title">{entry.title}</span>
      </span>
    </RouteLink>
  ));
}

function FeedMedia({ media, lazy }: { media: DossierMedia; lazy: boolean }) {
  const style = { objectPosition: media.position ?? "50% 50%", objectFit: media.fit ?? "cover" } as const;
  const videoSrc = useHeldSrc(media.src);
  if (isVideo(media)) {
    return <video className="evd-tile__media" src={videoSrc} poster={media.poster} muted loop autoPlay playsInline preload={lazy ? "none" : "auto"} aria-hidden="true" style={style} />;
  }
  return <img className="evd-tile__media" src={media.src} srcSet={media.srcSet} sizes={feedTileSizes(media)} alt="" loading={lazy ? "lazy" : undefined} decoding="async" draggable={false} style={style} />;
}

/** A page link (newer / older): `<a href>` with the in-page handler, a button without URLs; busy while a batch loads. */
function FeedLink({ className, icon, iconPosition, href, busy = false, onFollow, children }: { className: string; icon: ReactNode; iconPosition: "start" | "end"; href?: string; busy?: boolean; onFollow: () => void; children: ReactNode }) {
  if (href === undefined) {
    return (
      <GhostAction className={className} icon={icon} iconPosition={iconPosition} aria-busy={busy || undefined} onClick={() => !busy && onFollow()}>
        {children}
      </GhostAction>
    );
  }
  return (
    <GhostAction
      className={className}
      icon={icon}
      iconPosition={iconPosition}
      href={href}
      aria-busy={busy || undefined}
      onClick={(event) => followRouteLink(event, () => !busy && onFollow())}
    >
      {children}
    </GhostAction>
  );
}

/* ─── A normalised entry: what most feeds carry ─── */

export type DossierFeedArticle = {
  /** URL slug, stable across fetches. */
  id: string;
  /** The view's h1 (header or content, `heading`) and the tile title. */
  title: string;
  /** Short tab / dock label and the phone header's readout. Default: title. */
  label?: string;
  /** The tile's readout: section, date ("Cave · 28 oct."). */
  kicker?: string;
  media: DossierMedia;
  /** One or two sentences: the lead, and the view's meta description. */
  excerpt?: string;
  /** The text, one paragraph each. */
  body?: string[];
  /** Where the view's h1 is (entry `heading`): "content" (default: the intro's title, as headlines run long) or
      "header" (the bar's full title; the intro then opens on the excerpt). */
  heading?: "header" | "content";
  /** Detail chapters of your own, instead of the default (lead + picture, then the text). List what they show in `sources`. */
  content?: DossierEntry["content"];
  /** With `content`: the media your chapters show, as rendered (what the detail waits on and preloads). */
  sources?: DossierEntry["sources"];
  /** One closing chapter after the text (the story's one exit CTA, a source link). */
  closing?: DossierEntry["content"];
};

/**
 * A feed record as a dossier entry, with a default article detail: title and lead over the picture, then the text. The
 * default detail shows the media as a hero (its own `sizes`), so a `srcSet` media is listed in `sources` as rendered: the
 * detail waits on, and a direct load preloads, the candidate the hero shows, never the tile's.
 */
export function feedEntry(article: DossierFeedArticle): DossierEntry {
  const { id, title, label, kicker, media, excerpt, body, heading = "content", content, sources, closing } = article;
  return {
    id,
    title,
    label,
    kicker,
    media,
    heading,
    description: excerpt,
    sources: content ? sources : media.srcSet && !isVideo(media) ? [toSource(media)] : undefined,
    content:
      content ??
      ((ctx) => (
        <>
          <DossierChapter tone="a" variant="intro">
            {/* One heading carries the title: the content's h1, or (header) the bar's, the intro then opens on the excerpt. */}
            {heading === "content" ? (
              <ChapterHead level="title" as="h1" id={ctx.headingId} title={title} lead={excerpt} />
            ) : (
              excerpt && <p className="ev-t-lead evd-head__lead">{excerpt}</p>
            )}
            <ChapterFigure ratio="hero" media={{ ...media, alt: media.alt ?? "" }} />
          </DossierChapter>
          {body && body.length > 0 && (
            <DossierChapter tone="b">
              <div className="evd-prose">
                {body.map((paragraph, i) => (
                  <p key={i} className="ev-t-body">
                    {paragraph}
                  </p>
                ))}
              </div>
            </DossierChapter>
          )}
          {closing?.(ctx)}
        </>
      )),
  };
}
