import { useCallback, useEffect, useMemo, useState } from "react";
import { mediaGate } from "./tokens";

export type MediaSource = string | { src: string; type?: "image" | "video" } | null | undefined | false;

export type MediaReadyOptions = {
  /** Loader appears only if not ready after this. Default 350. */
  graceMs?: number;
  /** Once shown, the loader stays at least this long. Default 500. */
  minVisibleMs?: number;
  /** Not ready by then → failed (retry offered). Default 20000. */
  timeoutMs?: number;
  /** Video readiness: first decoded frame (default) or enough buffered to play through. */
  video?: "loadeddata" | "canplaythrough";
};

export type MediaReady = {
  /** Every source decoded (and the loader, if shown, held its minimum time). Reveal now. */
  ready: boolean;
  /** The loader should be visible (grace elapsed, not ready yet, or failed). */
  slow: boolean;
  failed: boolean;
  retry: () => void;
  loaded: number;
  total: number;
};

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
// Sources already decoded this session: a cached switch never flashes the loader.
const decoded = new Set<string>();
const DECODE_CAP_MS = 1500;
const METADATA_FALLBACK_MS = 1200;

const normalise = (sources: MediaSource[]) =>
  sources
    .filter((s): s is string | { src: string; type?: "image" | "video" } => !!s)
    .map((s) => (typeof s === "string" ? { src: s, type: VIDEO_RE.test(s) ? ("video" as const) : ("image" as const) } : { src: s.src, type: s.type ?? (VIDEO_RE.test(s.src) ? "video" : "image") }));

function load(item: { src: string; type: "image" | "video" }, videoEvent: "loadeddata" | "canplaythrough"): { promise: Promise<void>; abort: () => void } {
  if (item.type === "image") {
    const img = new Image();
    img.decoding = "async";
    const promise = new Promise<void>((resolve, reject) => {
      img.onload = () => {
        if (typeof img.decode !== "function") return resolve();
        // The bytes are in: a decode() that stalls must not hold the view
        // until the failure timeout.
        window.setTimeout(resolve, DECODE_CAP_MS);
        img.decode().then(resolve, resolve);
      };
      img.onerror = () => reject(new Error(`image failed: ${item.src}`));
    });
    img.src = item.src;
    return { promise, abort: () => { img.onload = img.onerror = null; } };
  }
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  let metaTimer: number | undefined;
  const promise = new Promise<void>((resolve, reject) => {
    video.addEventListener(videoEvent, () => resolve(), { once: true });
    // Mobile WebKit and data-saver modes stop a detached probe at metadata:
    // the first frame only arrives once the real element plays.
    video.addEventListener("loadedmetadata", () => { metaTimer = window.setTimeout(resolve, METADATA_FALLBACK_MS); }, { once: true });
    video.addEventListener("error", () => reject(new Error(`video failed: ${item.src}`)), { once: true });
  });
  video.src = item.src;
  video.load();
  return {
    promise,
    abort: () => {
      window.clearTimeout(metaTimer);
      video.removeAttribute("src");
      video.load();
    },
  };
}

/**
 * Media gate: reveal a view only once its media is decoded. The loader shows
 * after `graceMs`, then stays ≥ `minVisibleMs`; `timeoutMs` or an error →
 * `failed` with `retry()`. Closed (`open` false) resets.
 */
export function useMediaReady(open: boolean, sources: MediaSource[], options: MediaReadyOptions = {}): MediaReady {
  const { graceMs = mediaGate.graceMs, minVisibleMs = mediaGate.minVisibleMs, timeoutMs = mediaGate.timeoutMs, video = "loadeddata" } = options;
  const list = normalise(sources);
  const signature = list.map((s) => `${s.type}:${s.src}`).join("|");
  // Stable across renders for the same sources (callers pass fresh arrays).
  const items = useMemo(() => list, [signature]);
  const allCached = items.every((s) => decoded.has(s.src));

  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ signature: "", ready: false, slow: false, failed: false, loaded: 0 });

  useEffect(() => {
    if (!open) {
      setState({ signature, ready: false, slow: false, failed: false, loaded: 0 });
      return;
    }
    if (items.every((s) => decoded.has(s.src))) {
      setState({ signature, ready: true, slow: false, failed: false, loaded: items.length });
      return;
    }

    let cancelled = false;
    let shownAt: number | null = null;
    let holdTimer: number | undefined;
    let loaded = 0;
    setState({ signature, ready: false, slow: false, failed: false, loaded: 0 });

    const grace = window.setTimeout(() => {
      shownAt = performance.now();
      setState((s) => ({ ...s, slow: true }));
    }, graceMs);
    const fail = () => {
      if (cancelled) return;
      cancelled = true;
      window.clearTimeout(grace);
      setState((s) => ({ ...s, ready: false, slow: true, failed: true }));
    };
    const timeout = window.setTimeout(fail, timeoutMs);
    const loads = items.map((item) => {
      const l = load(item, video);
      l.promise.then(
        () => {
          decoded.add(item.src);
          if (cancelled) return;
          loaded += 1;
          setState((s) => ({ ...s, loaded }));
        },
        () => undefined,
      );
      return l;
    });

    Promise.all(loads.map((l) => l.promise)).then(
      () => {
        if (cancelled) return;
        window.clearTimeout(grace);
        window.clearTimeout(timeout);
        const finish = () => !cancelled && setState({ signature, ready: true, slow: false, failed: false, loaded: items.length });
        const hold = shownAt === null ? 0 : Math.max(0, minVisibleMs - (performance.now() - shownAt));
        if (hold > 0) holdTimer = window.setTimeout(finish, hold);
        else finish();
      },
      fail,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(grace);
      window.clearTimeout(timeout);
      window.clearTimeout(holdTimer);
      loads.forEach((l) => l.abort());
    };
  }, [open, items, signature, attempt, graceMs, minVisibleMs, timeoutMs, video]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // Until the effect catches up with a new source list, report its cached status.
  if (!open) return { ready: false, slow: false, failed: false, retry, loaded: 0, total: items.length };
  if (state.signature !== signature) {
    const ready = open && allCached;
    return { ready, slow: false, failed: false, retry, loaded: ready ? items.length : 0, total: items.length };
  }
  return { ready: state.ready, slow: state.slow, failed: state.failed, retry, loaded: state.loaded, total: items.length };
}
