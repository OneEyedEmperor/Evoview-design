import { useEffect, useSyncExternalStore } from "react";

/* Page suspension: while a modal (dossier, consent, lightbox…) is open the
   page behind it stops its loops and clocks. Ref-counted, reflected as
   <html data-ev-suspended> so CSS can pause `.ev-ambient` animations too. */

const ATTR = "data-ev-suspended";
let count = 0;
const listeners = new Set<() => void>();

function sync() {
  if (typeof document !== "undefined") {
    if (count > 0) document.documentElement.setAttribute(ATTR, "");
    else document.documentElement.removeAttribute(ATTR);
  }
  listeners.forEach((l) => l());
}

/** Suspend the background; returns the release function (idempotent). */
export function suspendBackground(): () => void {
  count += 1;
  sync();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count = Math.max(0, count - 1);
    sync();
  };
}

export function isBackgroundSuspended(): boolean {
  return count > 0;
}

export function subscribeSuspension(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True while any modal suspends the page. */
export function useBackgroundSuspended(): boolean {
  return useSyncExternalStore(subscribeSuspension, isBackgroundSuspended, () => false);
}

/** For modals: suspend the page while `active`. */
export function useSuspendBackground(active: boolean): void {
  useEffect(() => (active ? suspendBackground() : undefined), [active]);
}
