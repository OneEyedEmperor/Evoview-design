import { createContext, useContext, type ReactNode } from "react";

const Held = createContext(false);

/**
 * The copy of an open view, mounted from the first render (and in server
 * HTML) while its media are still on their way. Until `live` it is a held
 * stand-in: CSS animations paused (`[data-ev-held]` in foundation.css) and
 * `useHeldSrc` withholding video sources. When `live` turns true the copy
 * remounts, so its entrance starts at the exact moment the view used to
 * mount: the choreography is unchanged. State inside resets at that swap.
 * Pass the media gate: `<HeldCopy live={gate.ready}>`.
 */
export function HeldCopy({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <Held.Provider value={!live}>
      <div key={live ? "live" : "held"} data-ev-held={live ? undefined : ""} style={{ display: "contents" }}>
        {children}
      </div>
    </Held.Provider>
  );
}

/** True inside a held copy. */
export function useHeld(): boolean {
  return useContext(Held);
}

/** A video `src` (or `<source>`): undefined while held, so server HTML and the held copy start no download. Images keep their `src`. */
export function useHeldSrc(src: string | undefined): string | undefined {
  return useContext(Held) ? undefined : src;
}
