import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { useBackgroundSuspendedDeferred } from "./suspension";

export type InViewPauseOptions = {
  /** IntersectionObserver rootMargin. Default "0px" (strictly on-screen). */
  rootMargin?: string;
  /** Visible fraction that counts as on-screen. Default 0. */
  threshold?: number;
  /** Content of the modal itself keeps running while the page is suspended. */
  ignoreSuspension?: boolean;
  /** Extra gate (e.g. "revealed", "hover not holding"). Default true. */
  enabled?: boolean;
  /** Latch: `active` stays true after the first activation and observation stops (reveal once, lazy load). */
  once?: boolean;
};

export type InViewPause = {
  /** On-screen, document visible, not suspended and enabled: loops and clocks may run. */
  active: boolean;
  inView: boolean;
  documentVisible: boolean;
  suspended: boolean;
};

const subscribeVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};
const getVisible = () => document.visibilityState !== "hidden";

/** The pause model: loops and clocks run only while this returns `active`. */
export function useInViewPause(ref: RefObject<Element | null>, options: InViewPauseOptions = {}): InViewPause {
  const { rootMargin = "0px", threshold = 0, ignoreSuspension = false, enabled = true, once = false } = options;
  const [inView, setInView] = useState(false);
  const [latched, setLatched] = useState(false);
  const documentVisible = useSyncExternalStore(subscribeVisibility, getVisible, () => true);
  const suspendedGlobal = useBackgroundSuspendedDeferred();
  const suspended = !ignoreSuspension && suspendedGlobal;
  const live = enabled && inView && documentVisible && !suspended;
  const done = once && latched;

  useEffect(() => {
    if (once && live) setLatched(true);
  }, [once, live]);

  // Follow the element itself, not the ref object: a ref whose element mounts
  // after the first commit (behind a loader) or is replaced by a keyed remount
  // would otherwise never be observed, or stay bound to the detached node.
  const [el, setEl] = useState<Element | null>(null);
  useEffect(() => {
    if (ref.current !== el) setEl(ref.current);
  });

  useEffect(() => {
    if (!el) {
      setInView(false);
      return;
    }
    if (done) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setInView(entry.isIntersecting && entry.intersectionRatio >= threshold);
      },
      { rootMargin, threshold: [0, threshold].filter((v, i, a) => a.indexOf(v) === i) },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, rootMargin, threshold, done]);

  return { active: done || live, inView, documentVisible, suspended };
}
