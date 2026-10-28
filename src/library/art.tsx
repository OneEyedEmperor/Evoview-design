import { useEffect, useRef } from "react";
import { Cover } from "./covers";
import { EntryIcon } from "./icons";

/* The player part's picture: a photograph where one exists
   (public/library/art/<id>-<192|640|1280>.webp, placeholders for now), else
   the entry's glyph. The page list's thumbnails use the same photograph. */
const PHOTO = new Set(["chapter", "card", "process-sequence", "story-blocks"]);
const REV = "20261027";
const SIZES = "(min-width: 768px) 50vw, 100vw";

const url = (id: string, width: 192 | 640 | 1280) => `/library/art/${id}-${width}.webp?v=${REV}`;

/* The photograph's URL for string-fed covers (navbar tray cards). */
export const entryPhotoSrc = (id: string): string | undefined => (PHOTO.has(id) ? url(id, 1280) : undefined);

/* The index cards' cover (Home EntryCard): the loop where one exists (its
   poster is the photograph's frame), else the photograph, in the card well.
   Below the fold, so the clip is fetched only once the card scrolls in. */
export function EntryCover({ id }: { id: string }) {
  if (VIDEO.has(id)) return <EntryVideo key={id} id={id} className="lib-cover" preload="none" />;
  if (!PHOTO.has(id)) return <Cover id={id} variant="card" />;
  return <img className="lib-cover" src={url(id, 1280)} srcSet={srcSet(id)} sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw" alt="" decoding="async" draggable={false} />;
}

export function EntryThumb({ id }: { id: string }) {
  if (!PHOTO.has(id)) return <Cover id={id} variant="card" />;
  return <img src={url(id, 192)} alt="" width={192} height={108} decoding="async" draggable={false} />;
}
const srcSet = (id: string) => `${url(id, 640)} 640w, ${url(id, 1280)} 1280w`;

/* Loops replacing the player's photograph as they arrive
   (public/library/art/<id>-<720|1280>.mp4 + <id>-poster.webp, its first
   frame). Each is a boomerang of a 5 s clip: forward, then reversed without
   its end frames, so both turns and the wrap step like any other frame.
   The player and the index cards play them; thumbnails and navbar trays
   keep the photograph. */
const VIDEO = new Set(["chapter", "process-sequence", "story-blocks"]);
const VIDEO_REV = "20261027e";
const clip = (id: string, file: string) => `/library/art/${id}-${file}?v=${VIDEO_REV}`;

export function EntryArt({ id }: { id: string }) {
  // Keyed: a <video> ignores <source> changes until load(), so each clip gets its own element.
  if (VIDEO.has(id)) return <EntryVideo key={id} id={id} />;
  if (!PHOTO.has(id)) return <EntryIcon id={id} className="lib-player__glyph" />;
  return <img className="lib-player__photo" src={url(id, 1280)} srcSet={srcSet(id)} sizes={SIZES} alt="" decoding="async" draggable={false} />;
}

/* Muted inline loop that plays only while on screen and the tab is visible
   (RULES §6 pause model); the poster holds the frame otherwise. */
function EntryVideo({ id, className = "lib-player__photo", preload = "auto" }: { id: string; className?: string; preload?: "auto" | "none" }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    let inView = false;
    const sync = () => {
      if (inView && document.visibilityState === "visible") void video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [id]);
  return (
    <video ref={ref} className={className} poster={clip(id, "poster.webp")} muted loop playsInline preload={preload} disablePictureInPicture aria-hidden="true">
      <source src={clip(id, "720.mp4")} media="(max-width: 767px)" type="video/mp4" />
      <source src={clip(id, "1280.mp4")} type="video/mp4" />
    </video>
  );
}

let warmed = false;

/* Fetch and decode every photo once the page is idle, through the same
   srcset, so a preview opens on a decoded picture instead of waiting. */
export function warmEntryArt(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const run = () => {
    for (const id of PHOTO) {
      const img = new Image();
      img.decoding = "async";
      img.sizes = SIZES;
      img.srcset = srcSet(id);
      img.src = url(id, 1280);
      void img.decode?.().catch(() => {});
    }
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 2500 });
  else setTimeout(run, 1200);
}
