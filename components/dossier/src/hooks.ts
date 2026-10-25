import type { MediaSource } from "../foundation";
import type { DossierMedia } from "./types";

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export const isVideo = (media: DossierMedia) => (media.type ?? (VIDEO_RE.test(media.src) ? "video" : "image")) === "video";

export const toSource = (media: DossierMedia): MediaSource => ({ src: media.src, type: isVideo(media) ? "video" : "image" });

/* Server HTML is the desktop layout: width queries take their desktop value there (foundation `useMediaQuery(q, serverValue)`). */
export const DESKTOP_QUERY = "(min-width: 1024px)";
/* Touch devices have no hover: tiles take turns in the hover-equivalent state. */
export const TOUCH_CYCLE_QUERY = "(max-width: 1023px), (hover: none) and (pointer: coarse)";
export const TILE_HOVER_QUERY = "(hover: hover) and (min-width: 1024px)";
