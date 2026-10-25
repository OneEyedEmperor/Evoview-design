import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False while server rendering and while hydrating server HTML, true
 * afterwards (and from the first render of a client-only mount). Markup that
 * must never reach server HTML waits for it: `inert`, `aria-hidden` on
 * content, loaders, media-gate state.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
