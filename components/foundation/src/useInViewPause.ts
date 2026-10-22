import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { useBackgroundSuspended } from "./suspension";

export type InViewPauseOptions = {
  /** IntersectionObserver rootMargin. Default "0px" (strictly on-screen). */
  rootMargin?: string;
  /** Visible fraction that counts as on-screen. Default 0. */
  threshold?: number;
  /** Content of the modal itself keeps running while the page is suspended. */
  ignoreSuspension?: boolean;
  /** Extra gate (e.g. "revealed", "hover not holding"). Default true. */
  enabled?: boolean;
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
  const { rootMargin = "0px", threshold = 0, ignoreSuspension = false, enabled = true } = options;
  const [inView, setInView] = useState(false);
  const documentVisible = useSyncExternalStore(subscribeVisibility, getVisible, () => true);
  const suspendedGlobal = useBackgroundSuspended();
  const suspended = !ignoreSuspension && suspendedGlobal;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
  }, [ref, rootMargin, threshold]);

  return { active: enabled && inView && documentVisible && !suspended, inView, documentVisible, suspended };
}
