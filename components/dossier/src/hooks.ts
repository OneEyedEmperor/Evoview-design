import type { MediaSource } from "../foundation";
import type { DossierMedia } from "./types";

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export const isVideo = (media: DossierMedia) => (media.type ?? (VIDEO_RE.test(media.src) ? "video" : "image")) === "video";

/** What the gate decodes for `media`: an image's `srcSet` with the `sizes` it renders at (default its own). */
export const toSource = (media: DossierMedia, sizes = media.sizes): MediaSource =>
  isVideo(media) ? { src: media.src, type: "video" } : { src: media.src, type: "image", srcSet: media.srcSet, sizes };

/* Server HTML is the desktop layout: width queries take their desktop value there (foundation `useMediaQuery(q, serverValue)`). */
export const DESKTOP_QUERY = "(min-width: 1024px)";
/* Touch devices have no hover: tiles take turns in the hover-equivalent state. */
export const TOUCH_CYCLE_QUERY = "(max-width: 1023px), (hover: none) and (pointer: coarse)";
export const TILE_HOVER_QUERY = "(hover: hover) and (min-width: 1024px)";
