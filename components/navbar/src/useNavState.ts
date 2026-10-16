import { useSyncExternalStore } from "react";
import type { NavSection } from "./types";

/* What is under the bar right now: the tone (light or dark glass) and the
   section whose accent the reticle dot should carry.

   Both are measured from the DOM on scroll (rAF-throttled) rather than with
   IntersectionObservers: sections may mount lazily or be replaced on
   breakpoint changes, and rect measuring recomputes the answer from scratch
   every frame, so it can never hold a stale element.

   Tone: a section opts in with `data-nav-tone="dark"` on its own element; the
   probe is one point on the bar's own axis (30px down), so the switch happens
   exactly when the dark surface reaches the pills.
   Section: the element from `sections` whose top is the lowest one above
   30% of the viewport height. */

export type NavTone = "light" | "dark";
export type NavState = { tone: NavTone; section: string; color: string };

const TONE_PROBE_Y = 30;
const SECTION_PROBE_RATIO = 0.3;

type Store = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => NavState;
  getServerSnapshot: () => NavState;
};

type NavElement = {
  element: HTMLElement;
  section: string | null;
  dark: boolean;
  top: number;
  bottom: number;
};

const stores = new WeakMap<NavSection[], Store>();

function createStore(sections: NavSection[]): Store {
  const colors = Object.fromEntries(sections.map(({ id, color }) => [id, color])) as Record<string, string>;
  const ids = new Set(sections.map(({ id }) => id));
  const first = sections[0];
  const DEFAULT_STATE: NavState = {
    tone: "light",
    section: first?.id ?? "",
    color: first?.color ?? "currentColor",
  };
  const selector = [...sections.map(({ id }) => `#${CSS.escape(id)}`), '[data-nav-tone="dark"]'].join(",");

  let state = DEFAULT_STATE;
  let elements: NavElement[] = [];
  let layoutDirty = true;
  let viewportHeight = 0;
  let frame = 0;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  const listeners = new Set<() => void>();

  const containsNavElement = (node: Node): boolean =>
    node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null);

  const mutationChangesNavElements = (mutation: MutationRecord): boolean => {
    if (mutation.type === "childList") {
      return Array.from(mutation.addedNodes).some(containsNavElement)
        || Array.from(mutation.removedNodes).some(containsNavElement);
    }
    if (mutation.attributeName === "id") {
      return ids.has(mutation.oldValue ?? "") || ids.has((mutation.target as HTMLElement).id);
    }
    return mutation.oldValue === "dark" || (mutation.target as HTMLElement).dataset.navTone === "dark";
  };

  const collectElements = () => {
    resizeObserver?.disconnect();
    resizeObserver?.observe(document.documentElement);
    elements = Array.from(document.querySelectorAll<HTMLElement>(selector), (element) => {
      resizeObserver?.observe(element);
      return {
        element,
        section: ids.has(element.id) ? element.id : null,
        dark: element.dataset.navTone === "dark",
        top: 0,
        bottom: 0,
      };
    });
    layoutDirty = true;
  };

  // Sections are static flow content: document-space positions only change
  // on layout changes, so scroll frames stay layout-free.
  const measureLayout = () => {
    const scrollY = window.scrollY;
    viewportHeight = window.innerHeight;
    for (const item of elements) {
      const rect = item.element.getBoundingClientRect();
      item.top = rect.top + scrollY;
      item.bottom = rect.bottom + scrollY;
    }
    layoutDirty = false;
  };

  const measure = () => {
    frame = 0;
    if (layoutDirty) measureLayout();

    const scrollY = window.scrollY;
    const toneProbeY = scrollY + TONE_PROBE_Y;
    const sectionProbeY = scrollY + viewportHeight * SECTION_PROBE_RATIO;
    let tone: NavTone = "light";
    let section = DEFAULT_STATE.section;
    let bestTop = -Infinity;

    for (const { section: elementSection, dark, top, bottom } of elements) {
      if (dark && top <= toneProbeY && bottom >= toneProbeY) tone = "dark";
      if (elementSection && bottom !== top && top <= sectionProbeY && top > bestTop) {
        bestTop = top;
        section = elementSection;
      }
    }

    if (tone === state.tone && section === state.section) return;
    state = { tone, section, color: colors[section] ?? DEFAULT_STATE.color };
    listeners.forEach((listener) => listener());
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };
  const invalidateLayout = () => {
    layoutDirty = true;
    schedule();
  };
  const refreshElements = () => {
    collectElements();
    schedule();
  };

  const start = () => {
    resizeObserver = new ResizeObserver(invalidateLayout);
    collectElements();
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidateLayout);
    mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some(mutationChangesNavElements)) refreshElements();
    });
    mutationObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["id", "data-nav-tone"],
      attributeOldValue: true,
    });
  };

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    mutationObserver?.disconnect();
    mutationObserver = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", invalidateLayout);
    elements = [];
    layoutDirty = true;
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      if (listeners.size === 1) start();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
    getSnapshot: () => state,
    getServerSnapshot: () => DEFAULT_STATE,
  };
}

export function useNavState(sections: NavSection[]): NavState {
  let store = stores.get(sections);
  if (!store) {
    store = createStore(sections);
    stores.set(sections, store);
  }
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
