/* What a reading lights (BRIEF §10): its realms and elements as listed; a
   cord when its kind is listed and both ends are lit. A layer end counts as
   lit when that layer or any element standing in it is lit. */

import { isLayerRef, refId } from "../model/rules.ts";
import type { Id, Reading, SanctumState } from "../model/types.ts";

export interface Lit {
  /** Realm ids (layer ids and/or BEYOND). */
  layers: Set<Id>;
  elements: Set<Id>;
  threads: Set<Id>;
}

export function litBy(state: SanctumState, reading: Reading): Lit {
  const layers = new Set(reading.lights.layers);
  const elements = new Set(reading.lights.elements);
  const kinds = new Set(reading.lights.threadKinds);
  const realmsWithLitElement = new Set(state.elements.filter((e) => elements.has(e.id)).map((e) => e.realm));
  const endLit = (end: string) => (isLayerRef(end) ? layers.has(refId(end)) || realmsWithLitElement.has(refId(end)) : elements.has(end));
  const threads = new Set(state.threads.filter((t) => kinds.has(t.kind) && endLit(t.from) && endLit(t.to)).map((t) => t.id));
  return { layers, elements, threads };
}
