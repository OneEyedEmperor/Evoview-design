import { useCallback, useSyncExternalStore } from "react";
import type { MediaSource } from "../foundation";
import type { DossierMedia } from "./types";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export const isVideo = (media: DossierMedia) => (media.type ?? (VIDEO_RE.test(media.src) ? "video" : "image")) === "video";

export const toSource = (media: DossierMedia): MediaSource => ({ src: media.src, type: isVideo(media) ? "video" : "image" });

export const DESKTOP_QUERY = "(min-width: 1024px)";
/* Touch devices have no hover: tiles take turns in the hover-equivalent state. */
export const TOUCH_CYCLE_QUERY = "(max-width: 1023px), (hover: none) and (pointer: coarse)";
