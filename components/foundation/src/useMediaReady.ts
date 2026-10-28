import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHydrated } from "./hydration";
import { mediaGate } from "./tokens";

export type MediaSource = string | { src: string; type?: "image" | "video" } | null | undefined | false;

/** Element mode: the gate owns a mounted player instead of probing a detached copy. */
export type MediaElementGate = {
  /** The mounted `<video>` (callback-ref state). `null`: expected, not mounted yet (the gate waits). Omitted: no player. */
  video?: HTMLVideoElement | null;
  /** The player's source (the URL it is given); a change starts a new cycle. Only a player carrying it
      is gated: pass it whenever the player can change source while open. Required with `buffer: "full"`. */
  src?: string;
  /**
   * "frame" (default): first frame decoded. "full": `src` is fetched whole into
   * a session blob URL, returned as `src` (undefined while held, the network
   * URL if the fetch fails), and revealed only once buffered end to end.
   * Short loops only: blob URLs are kept for the session.
   */
  buffer?: "frame" | "full";
  /** Playback runs while ready and `play` (default true); it starts from zero on reveal. */
  play?: boolean;
};

export type MediaReadyOptions = {
  /** Loader appears only if not ready after this. Default 350. */
  graceMs?: number;
  /** Once shown, the loader stays at least this long. Default 500. */
  minVisibleMs?: number;
  /** Not ready by then → failed (retry offered). Default 20000. */
  timeoutMs?: number;
  /** Video readiness: first decoded frame (default) or enough buffered to play through. */
  video?: "loadeddata" | "canplaythrough";
  element?: MediaElementGate;
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

export type MediaElementReady = MediaReady & {
  /** The URL to give the player (see `MediaElementGate.buffer`). */
  src: string | undefined;
  /** The loader showed in this cycle; stays true after `ready` until `open`, the sources or `src` change. */
  wasSlow: boolean;
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

function load(item: { src: string; type: "image" | "video" }, videoEvent: "loadeddata" | "canplaythrough", priority?: "low"): { promise: Promise<void>; abort: () => void } {
  if (item.type === "image") {
    const img = new Image();
    img.decoding = "async";
    if (priority) (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
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

const inflight = new Map<string, Promise<void>>();

/**
 * Decode sources ahead of their gate (idle preload, hover intent), into the
 * same session memory the gate reads: a `useMediaReady` whose sources are all
 * preloaded is ready on its first render. Images are fetched at low priority;
 * concurrent calls share in-flight requests. Resolves once every source has
 * settled; failures are not remembered (the gate retries them).
 */
export function preloadMedia(sources: MediaSource[], video: "loadeddata" | "canplaythrough" = "loadeddata"): Promise<void> {
  const pending = normalise(sources)
    .filter((item) => !decoded.has(item.src))
    .map((item) => {
      const known = inflight.get(item.src);
      if (known) return known;
      const promise = load(item, video, "low")
        .promise.then(() => {
          decoded.add(item.src);
        }, () => undefined)
        .finally(() => inflight.delete(item.src));
      inflight.set(item.src, promise);
      return promise;
    });
  return Promise.all(pending).then(() => undefined);
}

const blobs = new Map<string, string>();
const blobFetches = new Map<string, Promise<string>>();

/**
 * Fetch `src` whole into a blob URL kept for the session (the element gate's
 * `buffer: "full"` store), so a reopened or switched view never depends on HTTP
 * revalidation or the player's range requests. Concurrent calls share the
 * request; failures are not remembered. Warm ahead by chaining calls.
 */
export function bufferMedia(src: string): Promise<string> {
  const known = blobs.get(src);
  if (known) return Promise.resolve(known);
  let request = blobFetches.get(src);
  if (!request) {
    request = fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${src}`);
        return response.blob();
      })
      .then((blob) => {
        if (!blob.size) throw new Error(`empty: ${src}`);
        const url = URL.createObjectURL(blob);
        blobs.set(src, url);
        return url;
      })
      .finally(() => blobFetches.delete(src));
    blobFetches.set(src, request);
  }
  return request;
}

/** The session blob URL of `src`, once `bufferMedia` has it. */
export function bufferedMedia(src: string): string | undefined {
  return blobs.get(src);
}

/**
 * Media gate: reveal a view only once its media is decoded. The loader shows
 * after `graceMs`, then stays ≥ `minVisibleMs`; `timeoutMs` or an error →
 * `failed` with `retry()`. Closed (`open` false) resets.
 * Server HTML and hydration: not ready, never slow (gate media and motion on
 * it, never copy: the copy of an open view is always mounted).
 * With `element`, the gate owns a mounted player (see `MediaElementGate`).
 */
export function useMediaReady(open: boolean, sources: MediaSource[], options: MediaReadyOptions & { element: MediaElementGate }): MediaElementReady;
export function useMediaReady(open: boolean, sources: MediaSource[], options?: MediaReadyOptions): MediaReady;
export function useMediaReady(open: boolean, sources: MediaSource[], options: MediaReadyOptions = {}): MediaReady | MediaElementReady {
  const elementMode = !!options.element;
  const probe = useProbeGate(open && !elementMode, sources, options);
  const element = useElementGate(open && elementMode, sources, options);
  return elementMode ? element : probe;
}

function useProbeGate(open: boolean, sources: MediaSource[], options: MediaReadyOptions): MediaReady {
  const { graceMs = mediaGate.graceMs, minVisibleMs = mediaGate.minVisibleMs, timeoutMs = mediaGate.timeoutMs, video = "loadeddata" } = options;
  const hydrated = useHydrated();
  const list = normalise(sources);
  const signature = list.map((s) => `${s.type}:${s.src}`).join("|");
  // Stable across renders for the same sources (callers pass fresh arrays).
  const items = useMemo(() => list, [signature]);
  // The session cache is client state: reading it while hydrating would
  // disagree with the server HTML.
  const allCached = hydrated && items.every((s) => decoded.has(s.src));

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
  if (!open || !hydrated) return { ready: false, slow: false, failed: false, retry, loaded: 0, total: items.length };
  if (state.signature !== signature) {
    const ready = open && allCached;
    return { ready, slow: false, failed: false, retry, loaded: ready ? items.length : 0, total: items.length };
  }
  return { ready: state.ready, slow: state.slow, failed: state.failed, retry, loaded: state.loaded, total: items.length };
}

// player: the element accepted in this cycle (a replaced element must pass again).
type Cycle = { key: string | null; loaded: ReadonlySet<string>; player: HTMLVideoElement | null; slow: boolean; wasSlow: boolean; failed: boolean; ready: boolean };
const freshCycle = (key: string | null, slow = false): Cycle => ({ key, loaded: new Set(), player: null, slow, wasSlow: slow, failed: false, ready: false });

/** The element is given `url`: its `src`, its selected source or one of its `<source>`s. */
function carries(video: HTMLVideoElement, url: string): boolean {
  const href = new URL(url, document.baseURI).href;
  if (video.src === href || video.currentSrc === href) return true;
  return Array.from(video.querySelectorAll("source")).some((source) => source.src === href);
}

function useElementGate(open: boolean, sources: MediaSource[], options: MediaReadyOptions): MediaElementReady {
  const { graceMs = mediaGate.graceMs, minVisibleMs = mediaGate.minVisibleMs, timeoutMs = mediaGate.timeoutMs, video: videoEvent = "loadeddata", element = {} } = options;
  const { video, src, buffer = "frame", play = true } = element;
  const hydrated = useHydrated();
  const hasPlayer = video !== undefined;
  const fullSrc = hasPlayer && buffer === "full" && src ? src : null;
  const full = fullSrc !== null;
  const list = normalise(sources).filter((item, i, all) => all.findIndex((other) => other.src === item.src) === i);
  const signature = list.map((s) => `${s.type}:${s.src}`).join("|");
  const items = useMemo(() => list, [signature]);
  const empty = !items.length && !hasPlayer;

  const [attempt, setAttempt] = useState(0);
  const base = open ? `${signature}#${hasPlayer ? `${buffer}:${src ?? ""}` : "-"}` : null;
  const key = base === null ? null : `${base}#${attempt}`;
  const [state, setState] = useState<Cycle>(() => freshCycle(key));
  const current = state.key === key ? state : freshCycle(key);
  const slowSince = useRef<{ key: string; at: number } | null>(null);
  const started = useRef<string | null>(null);
  // Without `src`: the element that last played a cycle, and that cycle's base.
  const lastPlayer = useRef<{ el: HTMLVideoElement; base: string } | null>(null);

  const update = useCallback((target: string, patch: (c: Cycle) => Partial<Cycle>) => {
    setState((previous) => {
      const c = previous.key === target ? previous : freshCycle(target);
      return { ...c, ...patch(c) };
    });
  }, []);

  // A reopened view with the same sources is a new cycle.
  useEffect(() => {
    if (!key) setState(freshCycle(null));
  }, [key]);

  // url null: the blob fetch failed, the player falls back to the network URL.
  const [fetched, setFetched] = useState<{ key: string; url: string | null } | null>(null);
  // Client state: never read while hydrating (the server HTML has no source).
  const blob = fullSrc !== null && hydrated ? blobs.get(fullSrc) : undefined;
  const playerSrc = !hasPlayer ? undefined : fullSrc === null ? src : (blob ?? (key && fetched?.key === key ? (fetched.url ?? fullSrc) : undefined));

  // The cycle's player carries its source. A player still showing another one (an
  // outgoing picture held through a channel switch) is not this cycle's: it is never
  // paused, seeked, played or accepted, and the gate waits as if it had no player.
  const owns = (el: HTMLVideoElement) => {
    if (src !== undefined) return playerSrc !== undefined && carries(el, playerSrc);
    const last = lastPlayer.current;
    return !last || last.el !== el || last.base === base;
  };

  useEffect(() => {
    if (!key || fullSrc === null || blobs.has(fullSrc)) return;
    let disposed = false;
    bufferMedia(fullSrc).then(
      (url) => { if (!disposed) setFetched({ key, url }); },
      () => { if (!disposed) setFetched({ key, url: null }); },
    );
    return () => { disposed = true; };
  }, [key, fullSrc]);

  useEffect(() => {
    if (!key || !items.length) return;
    let disposed = false;
    const settle = (done: string[]) => update(key, (c) => ({ loaded: new Set([...c.loaded, ...done]) }));
    const cached = items.filter((item) => decoded.has(item.src)).map((item) => item.src);
    if (cached.length) settle(cached);
    const loads = items.filter((item) => !decoded.has(item.src)).map((item) => {
      const l = load(item, videoEvent);
      l.promise.then(
        () => {
          decoded.add(item.src);
          if (!disposed) settle([item.src]);
        },
        () => { if (!disposed) update(key, () => ({ failed: true })); },
      );
      return l;
    });
    return () => {
      disposed = true;
      loads.forEach((l) => l.abort());
    };
  }, [key, items, videoEvent, update]);

  // Gate the real player: never an extra detached decoder for the same file.
  useEffect(() => {
    if (!key || !base || !video || (full && !playerSrc)) return;
    let disposed = false;
    let gating = false;
    let accepted = false;
    let stall: number | undefined;
    const accept = () => {
      if (disposed || !gating || accepted) return;
      accepted = true;
      window.clearTimeout(stall);
      lastPlayer.current = { el: video, base };
      update(key, () => ({ player: video }));
    };
    const check = () => {
      if (disposed || !gating || accepted || video.error) return;
      if (!full) {
        if (video.readyState >= 2) accept();
        return;
      }
      // A short loop never reveals on metadata or a single frame.
      if (video.seeking || video.readyState < 3 || !Number.isFinite(video.duration)) return;
      const ranges = video.buffered;
      for (let i = 0; i < ranges.length; i += 1) {
        if (ranges.start(i) <= 0.05 && ranges.end(i) >= video.duration - 0.05) return accept();
      }
    };
    // Mobile WebKit and data-saver modes can hold a paused player at metadata
    // until it plays; a stall is metadata with no data arriving.
    const armStall = () => {
      window.clearTimeout(stall);
      if (gating && !accepted && !video.error && video.readyState >= 1) stall = window.setTimeout(accept, METADATA_FALLBACK_MS);
    };
    const fail = () => {
      if (!disposed && gating && !accepted) update(key, () => ({ failed: true }));
    };
    const begin = () => {
      if (disposed || gating || !owns(video)) return;
      gating = true;
      if (started.current !== key) video.pause();
      if (video.preload !== "auto") video.preload = "auto";
      if (video.error || (attempt > 0 && video.readyState < 2)) video.load();
      else if (started.current !== key && video.readyState >= 1 && video.currentTime !== 0) video.currentTime = 0;
      check();
      armStall();
    };
    // The same element given this cycle's source (or, without `src`, reloading) becomes its player.
    const reload = () => {
      if (!gating && src === undefined) lastPlayer.current = { el: video, base };
      begin();
    };
    const checks = ["loadeddata", "canplay", "canplaythrough", "progress", "seeked", "durationchange"];
    const stalls = ["loadedmetadata", "progress"];
    const reloads = ["loadstart", "emptied"];
    checks.forEach((event) => video.addEventListener(event, check));
    stalls.forEach((event) => video.addEventListener(event, armStall));
    reloads.forEach((event) => video.addEventListener(event, reload));
    video.addEventListener("error", fail);
    begin();
    return () => {
      disposed = true;
      window.clearTimeout(stall);
      checks.forEach((event) => video.removeEventListener(event, check));
      stalls.forEach((event) => video.removeEventListener(event, armStall));
      reloads.forEach((event) => video.removeEventListener(event, reload));
      video.removeEventListener("error", fail);
    };
  }, [key, video, full, playerSrc, attempt, update]);

  const assetsReady = !!key && current.loaded.size === items.length && (!hasPlayer || (!!video && current.player === video));

  useEffect(() => {
    // After the reveal no loader comes back (a player swapped in the same cycle re-passes silently).
    if (!key || assetsReady || current.ready) return;
    const grace = window.setTimeout(() => {
      // A retry already holds the loader: its minimum time runs from the retry.
      if (slowSince.current?.key === key) return;
      slowSince.current = { key, at: performance.now() };
      update(key, () => ({ slow: true, wasSlow: true }));
    }, graceMs);
    const timeout = window.setTimeout(() => update(key, () => ({ failed: true })), timeoutMs);
    return () => {
      window.clearTimeout(grace);
      window.clearTimeout(timeout);
    };
  }, [key, assetsReady, current.ready, graceMs, timeoutMs, update]);

  const ready = empty ? !!key : !!key && current.ready;

  useEffect(() => {
    if (!key || empty || !assetsReady || current.ready) return;
    let frame = 0;
    let revealFrame = 0;
    const since = slowSince.current?.key === key ? slowSince.current.at : -Infinity;
    const hold = window.setTimeout(() => {
      // Commit the held view before its entrance starts.
      frame = requestAnimationFrame(() => {
        revealFrame = requestAnimationFrame(() => update(key, () => ({ ready: true })));
      });
    }, Math.max(0, since + minVisibleMs - performance.now()));
    return () => {
      window.clearTimeout(hold);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(revealFrame);
    };
  }, [key, empty, assetsReady, current.ready, minVisibleMs, update]);

  useEffect(() => {
    if (!video || (key && !owns(video))) return;
    if (!ready) {
      started.current = null;
      video.pause();
      return;
    }
    if (started.current !== key) {
      started.current = key;
      if (video.currentTime !== 0) video.currentTime = 0;
    }
    if (play) void video.play().catch(() => {});
    else video.pause();
  }, [ready, play, video, key, playerSrc]);

  const retry = useCallback(() => {
    if (base === null) return;
    // Keep the loader up through the retry instead of re-arming its grace.
    const next = `${base}#${attempt + 1}`;
    slowSince.current = { key: next, at: performance.now() };
    // Without `src`, a retry adopts the element on screen as this cycle's player.
    if (src === undefined && video) lastPlayer.current = { el: video, base };
    setState(freshCycle(next, true));
    setFetched(null);
    setAttempt(attempt + 1);
  }, [base, attempt, src, video]);

  return {
    ready,
    slow: !!key && !ready && (current.slow || current.failed),
    failed: !!key && !ready && current.failed,
    retry,
    loaded: current.loaded.size + (hasPlayer && !!video && current.player === video ? 1 : 0),
    total: items.length + (hasPlayer ? 1 : 0),
    src: playerSrc,
    wasSlow: !!key && current.wasSlow,
  };
}
