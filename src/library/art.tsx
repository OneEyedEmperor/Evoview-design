import { Cover } from "./covers";
import { EntryIcon } from "./icons";

/* The player part's picture: a photograph where one exists
   (public/library/art/<id>-<192|640|1280>.webp, placeholders for now), else
   the entry's glyph. The page list's thumbnails use the same photograph. */
const PHOTO = new Set(["chapter", "card-track", "process-sequence", "story-blocks"]);
const REV = "20261027";
const SIZES = "(min-width: 768px) 50vw, 100vw";

const url = (id: string, width: 192 | 640 | 1280) => `/library/art/${id}-${width}.webp?v=${REV}`;

/* The photograph's URL for string-fed covers (navbar tray cards). */
export const entryPhotoSrc = (id: string): string | undefined => (PHOTO.has(id) ? url(id, 1280) : undefined);

/* The index cards' cover (Home EntryCard): the photograph in the card well. */
export function EntryCover({ id }: { id: string }) {
  if (!PHOTO.has(id)) return <Cover id={id} variant="card" />;
  return <img className="lib-cover" src={url(id, 1280)} srcSet={srcSet(id)} sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw" alt="" decoding="async" draggable={false} />;
}

export function EntryThumb({ id }: { id: string }) {
  if (!PHOTO.has(id)) return <Cover id={id} variant="card" />;
  return <img src={url(id, 192)} alt="" width={192} height={108} decoding="async" draggable={false} />;
}
const srcSet = (id: string) => `${url(id, 640)} 640w, ${url(id, 1280)} 1280w`;

export function EntryArt({ id }: { id: string }) {
  if (!PHOTO.has(id)) return <EntryIcon id={id} className="lib-player__glyph" />;
  return <img className="lib-player__photo" src={url(id, 1280)} srcSet={srcSet(id)} sizes={SIZES} alt="" decoding="async" draggable={false} />;
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
