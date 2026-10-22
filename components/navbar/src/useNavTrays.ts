import { useEffect, useSyncExternalStore } from "react";
import type { NavTray, NavTrayItem, NavbarConfig } from "./types";

/* Tray contents are copy, not chrome. A tray declared with a loader is
   fetched on idle instead of shipping with the header; trays are closed at
   that point so nothing pops in. A pointer or focus arriving earlier forces
   the load through `ensureTray`. Results are cached per tray object. */

const cache = new WeakMap<object, NavTrayItem[]>();
const pending = new WeakMap<object, Promise<NavTrayItem[]>>();
const listeners = new Set<() => void>();
let version = 0;

export function getTrayItems(tray: NavTray | undefined): NavTrayItem[] | null {
  if (!tray || tray.kind !== "items") return null;
  if (Array.isArray(tray.items)) return tray.items;
  return cache.get(tray) ?? null;
}

export function ensureTray(tray: NavTray | undefined): Promise<NavTrayItem[] | null> {
  if (!tray || tray.kind !== "items") return Promise.resolve(null);
  if (Array.isArray(tray.items)) return Promise.resolve(tray.items);
  const cached = cache.get(tray);
  if (cached) return Promise.resolve(cached);
  let promise = pending.get(tray);
  if (!promise) {
    const load = tray.items;
    promise = load()
      .then((items) => {
        cache.set(tray, items);
        version += 1;
        listeners.forEach((listener) => listener());
        return items;
      })
      .catch((error: unknown) => {
        pending.delete(tray);
        throw error;
      });
    pending.set(tray, promise);
  }
  return promise;
}

export function preloadTrays(config: NavbarConfig) {
  for (const tray of Object.values(config.trays)) void ensureTray(tray).catch(() => undefined);
}

/** Desktop presentation of a tray (see `NavTray.layout`). */
export function trayLayout(tray: NavTray | undefined, items: NavTrayItem[] | null): "cards" | "rows" {
  if (!tray || tray.kind !== "items") return "rows";
  if (tray.layout) return tray.layout;
  return items?.some((item) => item.cover) ? "cards" : "rows";
}

const warmed = new Set<string>();

/** Fetches the desktop card covers ahead of the first tray, so a card's
    artwork is decoded by the time it slides in. */
export function warmTrayCovers(config: NavbarConfig) {
  for (const tray of Object.values(config.trays)) {
    if (!tray || tray.kind !== "items") continue;
    void ensureTray(tray).then((items) => {
      for (const item of items ?? []) {
        if (typeof item.cover !== "string" || warmed.has(item.cover)) continue;
        warmed.add(item.cover);
        const image = new Image();
        image.decoding = "async";
        image.src = item.cover;
      }
    }).catch(() => undefined);
  }
}

/** Subscribes the caller to tray loads; the value only matters for re-rendering. */
export function useTrayVersion(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
    () => 0,
  );
}

export function useIdleTrayPreload(config: NavbarConfig) {
  useEffect(() => {
    const supportsIdle = "requestIdleCallback" in window;
    const load = () => preloadTrays(config);
    const idle = supportsIdle
      ? window.requestIdleCallback(load, { timeout: 1200 })
      : window.setTimeout(load, 200);
    const fallback = window.setTimeout(load, 1500);
    return () => {
      if (supportsIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.clearTimeout(fallback);
    };
  }, [config]);
}
