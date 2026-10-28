import { useEffect } from "react";
import { retainPressJelly } from "./jelly";

/** Keeps the document-wide press jelly bound while the calling component is mounted (ref-counted, so any number of callers share one set of listeners). Mark hosts with `data-ev-jelly`. */
export function usePressJelly() {
  useEffect(retainPressJelly, []);
}
