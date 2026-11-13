/* Readings of the state the chrome needs, all from fields. */

import { endTitle, isLayerRef } from "../model/rules";
import { BEYOND, type Element, type Id, type SanctumState, type Thread, type ThreadKind } from "../model/types";
import { lift } from "./colour";
import { roleOfKind, type CordRole } from "./geometry";

export interface KindInfo { kind: ThreadKind; role: CordRole; colour: string }

export function kindInfos(state: SanctumState): KindInfo[] {
  return [...state.threadKinds].sort((a, b) => a.order - b.order).map((kind) => {
    const role = roleOfKind(kind, state);
    return { kind, role, colour: lift(kind.colour.hex, role === "oath" ? 0.9 : 0.72) };
  });
}

export const realmColour = (state: SanctumState, realm: Id) =>
  lift(realm === BEYOND ? state.beyond.colour.hex : state.layers.find((l) => l.id === realm)?.colour.hex ?? "#8a8f99");

/** The element whose states the map shows one at a time, if any. */
export function entityWithStates(state: SanctumState): Element | undefined {
  const child = state.elements.find((e) => e.condition && e.parent);
  return child ? state.elements.find((e) => e.id === child.parent) : undefined;
}

/** The state of `id`'s family shown in `condition` (the element itself when it has no states). */
export function stateShown(state: SanctumState, id: Id, condition: Id): Element | undefined {
  const el = state.elements.find((e) => e.id === id);
  if (!el) return undefined;
  const parent = el.condition ? el.parent : el.id;
  const sib = state.elements.find((e) => e.parent === parent && e.condition === condition);
  return sib ?? el;
}

export function otherCondition(state: SanctumState, sealed: Id) {
  return state.conditions.find((c) => c.id !== sealed);
}

export interface CordRow { thread: Thread; info: KindInfo; dir: "out" | "in" | "both"; end: string; latent: boolean }

export function cordsOf(state: SanctumState, id: Id, condition: Id, infos: KindInfo[]): CordRow[] {
  const byKind = new Map(infos.map((i) => [i.kind.id, i]));
  const el = state.elements.find((e) => e.id === id);
  const family = new Set([id]);
  if (el && state.elements.some((e) => e.parent === id && e.condition)) for (const e of state.elements) if (e.parent === id && e.condition) family.add(e.id);
  const rows: CordRow[] = [];
  for (const t of state.threads) {
    const out = family.has(t.from), into = !isLayerRef(t.to) && family.has(t.to);
    if (!out && !into) continue;
    const info = byKind.get(t.kind);
    if (!info) continue;
    const other = out ? t.to : t.from;
    rows.push({ thread: t, info, dir: t.bidirectional ? "both" : out ? "out" : "in", end: endTitle(state, other), latent: Boolean(t.condition && t.condition !== condition) });
  }
  return rows.sort((a, b) => Number(a.latent) - Number(b.latent) || a.info.kind.order - b.info.kind.order);
}

export function realmsInOrder(state: SanctumState) {
  return [...state.layers].sort((a, b) => a.order - b.order);
}
