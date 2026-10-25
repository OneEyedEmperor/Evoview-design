import type { StepMedia } from "./types";

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
export const isVideo = (m: StepMedia) => (m.type ? m.type === "video" : VIDEO_RE.test(m.src));
