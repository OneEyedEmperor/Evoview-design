import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

export type SequenceClock = {
  key: string | number;
  duration: number;
  running: boolean;
  /** Elapsed ms at the last start/pause (live value: `progress()`). */
  elapsed: number;
  done: boolean;
  /** Live 0–1 progress of the current key. */
  progress: () => number;
  /** Restart the current key from 0. */
  reset: () => void;
};

type State = { key: string | number; elapsed: number; startedAt: number | null; done: boolean };

/**
 * A dwell timer that only counts time while `enabled` (on-screen, visible,
 * unsuspended, not held by hover…). Pausing keeps the elapsed time; resuming
 * continues with the remainder; a new `key` starts from 0. `onElapsed` fires
 * once per key. Never advances because unavailable time passed.
 */
export function useSequenceClock(key: string | number, enabled: boolean, durationMs: number, onElapsed: () => void): SequenceClock {
  const onElapsedRef = useRef(onElapsed);
  useEffect(() => {
    onElapsedRef.current = onElapsed;
  });

  const state = useRef<State>({ key, elapsed: 0, startedAt: null, done: false });
  const [snapshot, setSnapshot] = useState({ key, running: false, elapsed: 0, done: false });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const s = state.current;
    if (s.key !== key) {
      s.key = key;
      s.elapsed = 0;
      s.done = false;
    }
    if (!enabled || s.done || durationMs <= 0) {
      s.startedAt = null;
      setSnapshot({ key, running: false, elapsed: s.elapsed, done: s.done });
      return;
    }
    const remaining = Math.max(0, durationMs - s.elapsed);
    s.startedAt = performance.now();
    setSnapshot({ key, running: true, elapsed: s.elapsed, done: false });
    const timer = window.setTimeout(() => {
      s.elapsed = durationMs;
      s.startedAt = null;
      s.done = true;
      setSnapshot({ key, running: false, elapsed: durationMs, done: true });
      onElapsedRef.current();
    }, remaining);
    return () => {
      window.clearTimeout(timer);
      if (s.startedAt !== null) {
        s.elapsed = Math.min(durationMs, s.elapsed + performance.now() - s.startedAt);
        s.startedAt = null;
      }
    };
  }, [key, enabled, durationMs, nonce]);

  const progress = useCallback(() => {
    const s = state.current;
    if (s.key !== key || durationMs <= 0) return 0;
    const live = s.startedAt !== null ? s.elapsed + performance.now() - s.startedAt : s.elapsed;
    return Math.min(1, live / durationMs);
  }, [key, durationMs]);

  const reset = useCallback(() => {
    const s = state.current;
    s.elapsed = 0;
    s.done = false;
    s.startedAt = null;
    setNonce((n) => n + 1);
  }, []);

  // Between a key change and its effect, report the new key as not started.
  const fresh = snapshot.key === key;
  return {
    key,
    duration: durationMs,
    running: fresh && snapshot.running,
    elapsed: fresh ? snapshot.elapsed : 0,
    done: fresh && snapshot.done,
    progress,
    reset,
  };
}

/**
 * Inline style for a CSS fill animation that follows a clock (pauses with it,
 * resumes at the same point). The animated element must be keyed by
 * `clock.key` and declare an `animation-name` running 0 → full.
 */
export function sequenceFillStyle(clock: Pick<SequenceClock, "duration" | "elapsed" | "running" | "done">): CSSProperties {
  return {
    animationDuration: `${clock.duration}ms`,
    animationDelay: `${-(clock.done ? clock.duration : clock.elapsed)}ms`,
    animationPlayState: clock.running && !clock.done ? "running" : "paused",
    animationTimingFunction: "linear",
    animationFillMode: "both",
  };
}
