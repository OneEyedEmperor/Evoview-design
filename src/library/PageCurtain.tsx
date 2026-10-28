import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigationType, type Location } from "react-router-dom";
import "./page-curtain.css";

/* Page curtain: on a page change, a night panel rises from the bottom
   over everything under the hero, the page swaps behind it, then the panel
   drops back down, uncovering the new page from the top. A sideways move
   (`side`, e.g. switching category) plays on the other axis as one
   right-to-left swipe: in from the right, out to the left, uncovering from
   the right. The hero above
   stays put, so the library's lockup reads as the one fixed thing while
   the pages slide under it.

   The router keeps rendering the old location until the curtain covers,
   whatever triggered the navigation; the curtain's top follows the hero's
   bottom edge every frame (0 once the hero is scrolled away); pages swap at
   the scroll position they were left at (ScrollManager). */

const IN_MS = 380;
const OUT_MS = 520;
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const PREPARE_TIMEOUT_MS = 2500;

type Options = {
  /* Same key: same page (hash moves, category routes of the index); null:
     outside the curtain's stage (full-screen demos). Both swap instantly. */
  pageKey: (location: Location) => string | null;
  /* Resolves when the incoming page can render without a fallback. */
  prepare?: (location: Location) => Promise<unknown> | void;
  /* True when the move plays on the horizontal axis. */
  side?: (from: Location, to: Location) => boolean;
};

const OFF = { y: "translateY(100%)", x: "translateX(100%)" };

const raf = () => new Promise<number>((r) => requestAnimationFrame(r));
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function usePageCurtain({ pageKey, prepare, side }: Options): {
  location: Location;
  layer: ReactNode;
} {
  const location = useLocation();
  const action = useNavigationType();
  const [shown, setShown] = useState(location);
  const enabled = typeof window !== "undefined" && window.self === window.top;

  const latest = useRef({ location, action });
  latest.current = { location, action };
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const keyOf = useRef(pageKey);
  keyOf.current = pageKey;
  const prepareRef = useRef(prepare);
  prepareRef.current = prepare;
  const sideRef = useRef(side);
  sideRef.current = side;

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const running = useRef(false);
  const commits = useRef<Array<() => void>>([]);
  const scrolls = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    commits.current.splice(0).forEach((r) => r());
  }, [shown]);

  const swap = useCallback((next: Location) => {
    const landed = new Promise<void>((r) => commits.current.push(r));
    setShown(next);
    return landed;
  }, []);

  const animated = useCallback((a: Location, b: Location) => {
    const ka = keyOf.current(a);
    const kb = keyOf.current(b);
    return ka !== null && kb !== null && ka !== kb && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const run = useCallback(async () => {
    const el = root.current;
    const sheet = panel.current;
    if (!el || !sheet || running.current) return;
    running.current = true;
    let frame = 0;
    const follow = () => {
      // A showcase page's navigation sits inside the hero: it changes with
      // the page, so it goes under the curtain too.
      const deck = document.querySelector<HTMLElement>(".lib-hero__deck");
      const hero = document.querySelector<HTMLElement>(".lib-hero");
      const edge = deck ? deck.getBoundingClientRect().top : hero ? hero.getBoundingClientRect().bottom : 0;
      const top = Math.max(0, edge);
      el.style.setProperty("--curtain-top", `${Math.round(top)}px`);
      frame = requestAnimationFrame(follow);
    };
    // Blocking listeners only while the curtain runs: outside it, a
    // non-passive wheel / touchmove listener would hold every scroll on
    // the main thread.
    const block = (event: Event) => event.preventDefault();
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    try {
      el.hidden = false;
      document.documentElement.classList.add("page-curtaining");
      follow();
      while (latest.current.location !== shownRef.current) {
        const from = shownRef.current;
        if (!animated(from, latest.current.location)) {
          await swap(latest.current.location);
          continue;
        }
        scrolls.current.set(from.key, window.scrollY);
        // A sideways move is one right-to-left swipe: in from the right,
        // out to the left. Otherwise up from and back down to the bottom.
        const sideways = Boolean(sideRef.current?.(from, latest.current.location));
        const enter = sideways ? OFF.x : OFF.y;
        const leave = sideways ? "translateX(-100%)" : OFF.y;
        const ready = Promise.race([Promise.resolve(prepareRef.current?.(latest.current.location)).catch(() => undefined), sleep(PREPARE_TIMEOUT_MS)]);
        await sheet.animate([{ transform: enter }, { transform: "none" }], { duration: IN_MS, easing: EASE, fill: "forwards" }).finished;
        await ready;
        // Redirects (<Navigate replace>) land while the curtain still covers.
        for (let guard = 0; guard < 4 && latest.current.location !== shownRef.current; guard++) {
          const target = latest.current;
          await swap(target.location);
          if (target.action === "POP") window.scrollTo(0, scrolls.current.get(target.location.key) ?? 0);
          await raf();
          await raf();
        }
        await sheet.animate([{ transform: "none" }, { transform: leave }], { duration: OUT_MS, easing: EASE, fill: "forwards" }).finished;
      }
    } finally {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      cancelAnimationFrame(frame);
      sheet.getAnimations().forEach((a) => a.cancel());
      el.hidden = true;
      document.documentElement.classList.remove("page-curtaining");
      running.current = false;
    }
  }, [animated, swap]);

  useLayoutEffect(() => {
    if (location === shownRef.current) return;
    if (!enabled || (!running.current && !animated(shownRef.current, location))) {
      setShown(location);
      return;
    }
    void run();
  }, [location, enabled, animated, run]);

  useEffect(() => {
    if (!enabled) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, [enabled]);

  const layer = enabled
    ? createPortal(
        <div ref={root} className="page-curtain ev-library" hidden aria-hidden="true">
          <div ref={panel} className="page-curtain__panel" />
        </div>,
        document.body,
      )
    : null;

  return { location: enabled ? shown : location, layer };
}
