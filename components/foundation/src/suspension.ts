import { startTransition, useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { useHydrated } from "./hydration";

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

/** True while any modal suspends the page; re-renders in the commit that suspends. */
export function useBackgroundSuspended(): boolean {
  return useSyncExternalStore(subscribeSuspension, isBackgroundSuspended, () => false);
}

/**
 * The same flag at transition priority, for consumers that only pause (loops,
 * clocks, media): their re-render stays out of the modal's opening frame.
 */
export function useBackgroundSuspendedDeferred(): boolean {
  const hydrated = useHydrated();
  const [suspended, setSuspended] = useState(isBackgroundSuspended);
  useEffect(() => {
    // useSyncExternalStore updates are always synchronous; a transition is the only way to defer them.
    const update = () => startTransition(() => setSuspended(isBackgroundSuspended()));
    update();
    return subscribeSuspension(update);
  }, []);
  return hydrated && suspended;
}

/** For modals: suspend the page while `active`. */
export function useSuspendBackground(active: boolean): void {
  // Registered in the modal's mount commit, so the page-wide restyle of the
  // html attribute lands before its first paint, not inside its opening animation.
  useLayoutEffect(() => (active ? suspendBackground() : undefined), [active]);
}
