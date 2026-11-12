/* Op builders, so callers never hand-write op objects. */

import { SLUG_MAX } from "../model/rules";
import type { Emphasis, Id, NewElement, NewReading, NewThread, Op, Reading, Sight, TextField, TextTarget } from "../model/types";

export const ops = {
  setText: (target: TextTarget, field: TextField, value: string | string[]): Op => ({ op: "setText", target, field, value }),
  addElement: (element: NewElement): Op => ({ op: "addElement", element }),
  removeElement: (id: Id): Op => ({ op: "removeElement", id }),
  addThread: (thread: NewThread): Op => ({ op: "addThread", thread }),
  removeThread: (id: Id): Op => ({ op: "removeThread", id }),
  addVision: (visionId: Id, title: string): Op => ({ op: "addVision", visionId, title }),
  removeVision: (visionId: Id): Op => ({ op: "removeVision", visionId }),
  assignVision: (visionId: Id, elementId: Id, focus: { x?: number; y?: number; zoom?: number; primary?: boolean } = {}): Op => ({ op: "assignVision", visionId, elementId, ...focus }),
  unassignVision: (visionId: Id, elementId: Id): Op => ({ op: "unassignVision", visionId, elementId }),
  setVisionSubject: (visionId: Id, elementId: Id, x: number, y: number, zoom: number): Op => ({ op: "setVisionSubject", visionId, elementId, x, y, zoom }),
  reorderWithinLayer: (realm: Id, order: Id[]): Op => ({ op: "reorderWithinLayer", realm, order }),
  setEmphasis: (id: Id, emphasis: Emphasis): Op => ({ op: "setEmphasis", id, emphasis }),
  setSight: (sight: Partial<Sight>): Op => ({ op: "setSight", sight }),
  addReading: (reading: NewReading): Op => ({ op: "addReading", reading }),
  removeReading: (id: Id): Op => ({ op: "removeReading", id }),
  setReadingLights: (id: Id, lights: Reading["lights"]): Op => ({ op: "setReadingLights", id, lights }),
};

/** A fresh mark for a new element or reading, from its title. */
export function markFrom(title: string, taken: Iterable<Id>): Id {
  const used = new Set(taken);
  let base =
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, SLUG_MAX - 8)
      .replace(/-+$/, "") || "mark";
  /* Marks beginning like a layer or cord reference would be ambiguous. */
  if (base.startsWith("layer") || base.startsWith("cord") || base === "lexicon") base = `the-${base}`;
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}
