import { useCallback, useSyncExternalStore } from "react";

/**
 * Live `matchMedia(query).matches`. `serverValue` (default false) is used for
 * server HTML and hydration, then the real value takes over: pick the layout
 * the server HTML should carry (Evoview renders the desktop one).
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}
