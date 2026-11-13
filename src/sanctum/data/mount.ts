import type { ReactNode } from "react";
import type { SanctumStore } from "./store.ts";

/** Props of `src/sanctum/sight/index.tsx` (default export). */
export interface SightProps {
  store: SanctumStore;
  /** The console, lazy-loaded after entry; the sight places it. */
  console: ReactNode;
}

/** Props of `src/sanctum/console/index.tsx` (default export). */
export interface ConsoleProps {
  store: SanctumStore;
}
