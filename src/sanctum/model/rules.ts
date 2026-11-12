/* Budgets and small helpers shared by the engine, server and client. */

import { BEYOND, type Element, type Id, type LayerRef, type SanctumState, type ThreadEnd } from "./types.ts";

export const BUDGET = {
  title: 28,
  purpose: 160,
  explanation: 900,
  natureLines: 8,
  natureLine: 160,
  label: 48,
  visionTitle: 60,
  summary: 160,
  ops: 64,
  readingTitle: 40,
  readingText: 900,
  /** Readings that may be added beside the canonical ones. */
  ownReadings: 4,
} as const;

export const ZOOM = { min: 1, max: 4 } as const;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX = 48;
export const VISION_MAX_BYTES = 30 * 1024 * 1024;

export const isLayerRef = (end: string): end is LayerRef => end.startsWith("layer:");
export const layerRef = (id: Id): LayerRef => `layer:${id}`;
export const refId = (end: string) => end.slice(end.indexOf(":") + 1);

export function elementById(state: SanctumState): Map<Id, Element> {
  return new Map(state.elements.map((e) => [e.id, e]));
}

export function realmTitle(state: SanctumState, realm: Id): string {
  if (realm === BEYOND) return state.beyond.title;
  return state.layers.find((l) => l.id === realm)?.title ?? realm;
}

export function endTitle(state: SanctumState, end: ThreadEnd | string, byId = elementById(state)): string {
  if (isLayerRef(end)) return realmTitle(state, refId(end));
  if (end.startsWith("cord:")) return state.threadKinds.find((k) => k.id === refId(end))?.title ?? end;
  if (end === "lexicon") return state.lexicon.title;
  return byId.get(end)?.title ?? end;
}

/** One purpose = one sentence: closed by . ! or ?, none inside. */
export function isOneSentence(text: string): boolean {
  const t = text.trim();
  if (!/[.!?]$/.test(t)) return false;
  return !/[.!?]["”’)]?\s+\S/.test(t.slice(0, -1));
}

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Numbers in words, so no refusal reads like a counter. */
export function numberWord(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` and ${numberWord(rest)}` : ""}`;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function stableEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function omit<T extends object, K extends keyof T>(value: T, keys: K[]): Omit<T, K> {
  const out = { ...value };
  for (const k of keys) delete out[k];
  return out;
}
