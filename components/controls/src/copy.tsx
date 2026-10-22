import { createContext, useContext, type ReactNode } from "react";
import { buildControlsConfig, defaultControlsLocale, type ControlsConfig, type ControlsCopy } from "./controls.config";

const ControlsContext = createContext<ControlsConfig | null>(null);
const fallback = buildControlsConfig(defaultControlsLocale);

/** Optional: supplies the locale's default labels to every control below it. */
export function ControlsProvider({ config, children }: { config: ControlsConfig; children: ReactNode }) {
  return <ControlsContext.Provider value={config}>{children}</ControlsContext.Provider>;
}

export function useControlsCopy(): ControlsCopy {
  return (useContext(ControlsContext) ?? fallback).copy;
}
