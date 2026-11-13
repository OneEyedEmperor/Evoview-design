/* Every invariant of the map, interpreted from the rules the state carries.
   The server runs this on every change (authority); the client runs the
   same engine for instant feedback. Messages are in the map's tongue. */

import { alludesToName, equatesFigures, fold, hasHiddenMarks, impureWords, type NameContext } from "../../../server/sanctum/purity.ts";
import {
  BUDGET,
  SLUG,
  SLUG_MAX,
  ZOOM,
  elementById,
  endTitle,
  isLayerRef,
  isOneSentence,
  numberWord,
  omit,
  pairKey,
  realmTitle,
  refId,
  ringPairs,
  stableEqual,
} from "./rules.ts";
import {
  BEYOND,
  LEXICON,
  SCHEMA_VERSION,
  type Beyond,
  type Colour,
  type Condition,
  type Element,
  type ElementKind,
  type ElementSelector,
  type EndSelector,
  type Id,
  type Layer,
  type Passage,
  type Quarter,
  type Reading,
  type Refusal,
  type Rim,
  type Roles,
  type Station,
  type SanctumState,
  type Thread,
  type ThreadKind,
  type Tie,
  type TieKind,
} from "./types.ts";

/** What can never change: the fixed tables and every locked part, as sealed. */
export interface Canon {
  threshold: Passage;
  lexicon: Passage & { colour: Colour };
  layers: Layer[];
  beyond: Beyond;
  conditions: Condition[];
  quarters: Quarter[];
  stations: Station[];
  rim?: Rim;
  elementKinds: ElementKind[];
  threadKinds: ThreadKind[];
  tieKinds: TieKind[];
  roles: Roles;
  readings: Reading[];
  elements: Element[];
  threads: Thread[];
  ties: Tie[];
}

export function canonOf(state: SanctumState): Canon {
  const pick = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  return pick({
    threshold: state.threshold,
    lexicon: state.lexicon,
    layers: state.layers,
    beyond: state.beyond,
    conditions: state.conditions,
    quarters: state.quarters,
    stations: state.stations,
    rim: state.rim,
    elementKinds: state.elementKinds,
    threadKinds: state.threadKinds,
    tieKinds: state.tieKinds,
    roles: state.roles,
    readings: state.readings.filter((r) => r.locked),
    elements: state.elements.filter((e) => e.locked),
    threads: state.threads.filter((t) => t.locked),
    ties: state.ties.filter((t) => t.locked),
  });
}

const ELEMENT_FREE: (keyof Element)[] = ["explanation", "nature", "visions", "emphasis", "order"];
const THREAD_FREE: (keyof Thread)[] = ["explanation"];

export function matchesElement(e: Element, sel: ElementSelector, layerIds: Set<Id>): boolean {
  if (sel.ids && !sel.ids.includes(e.id)) return false;
  if (sel.kinds && !sel.kinds.includes(e.kind)) return false;
  if (sel.realms && !sel.realms.includes(e.realm)) return false;
  if (sel.inLayers && !layerIds.has(e.realm)) return false;
  if (sel.condition && e.condition !== sel.condition) return false;
  if (sel.not?.includes(e.id)) return false;
  return true;
}

export function matchesEnd(end: string, sel: EndSelector, byId: Map<Id, Element>, layerIds: Set<Id>): boolean {
  if (isLayerRef(end)) return Boolean(sel.layers?.includes(refId(end)));
  const e = byId.get(end);
  return Boolean(e && sel.element && matchesElement(e, sel.element, layerIds));
}

/** The condition a cord must carry: its kind's, or that of a state at its ends. */
export function expectedCondition(
  t: Pick<Thread, "kind" | "from" | "to">,
  kinds: Map<Id, ThreadKind>,
  byId: Map<Id, Element>,
): { condition?: Id; conflict: boolean } {
  const found = new Set<Id>();
  const kc = kinds.get(t.kind)?.grammar.condition;
  if (kc) found.add(kc);
  for (const end of [t.from, t.to]) {
    const c = isLayerRef(end) ? undefined : byId.get(end)?.condition;
    if (c) found.add(c);
  }
  if (found.size > 1) return { conflict: true };
  return { condition: [...found][0], conflict: false };
}

export function threadKey(t: Pick<Thread, "kind" | "from" | "to">, kinds: Map<Id, ThreadKind>): string {
  const k = kinds.get(t.kind);
  const unordered = !k || !k.directed || k.grammar.bidirectional;
  const [a, b] = unordered && t.to < t.from ? [t.to, t.from] : [t.from, t.to];
  return `${t.kind}|${a}|${b}`;
}

/** Elements that reach the core along cords and ties. */
export function reachingCore(state: SanctumState): Set<Id> {
  const kinds = new Map(state.threadKinds.map((k) => [k.id, k]));
  const tieKinds = new Map(state.tieKinds.map((k) => [k.id, k]));
  const reverse = new Map<string, string[]>();
  const edge = (from: string, to: string) => {
    const list = reverse.get(to);
    if (list) list.push(from);
    else reverse.set(to, [from]);
  };
  for (const t of state.threads) {
    edge(t.from, t.to);
    const k = kinds.get(t.kind);
    if (t.bidirectional || (k && !k.directed)) edge(t.to, t.from);
  }
  for (const t of state.ties) {
    if (t.from.startsWith("cord:") || t.to.startsWith("cord:") || t.from === LEXICON || t.to === LEXICON) continue;
    edge(t.from, t.to);
    if (tieKinds.get(t.kind)?.symmetric) edge(t.to, t.from);
  }
  for (const e of state.elements) if (e.realm !== BEYOND) edge(`layer:${e.realm}`, e.id);
  const seen = new Set<string>([state.roles.core]);
  const queue = [state.roles.core];
  while (queue.length) {
    const node = queue.pop()!;
    for (const prev of reverse.get(node) ?? []) {
      if (!seen.has(prev)) {
        seen.add(prev);
        queue.push(prev);
      }
    }
  }
  return seen;
}

function realmRuleText(state: SanctumState, kind: ElementKind): string {
  const parts = kind.realms.map((r) => {
    if (r.realms) return r.realms.map((id) => realmTitle(state, id)).join(" or ");
    if (r.inLayers) return "one of the layers";
    if (r.parentRealm) return "the realm of what it belongs to";
    return "";
  });
  return [...new Set(parts.filter(Boolean))].join(", or ");
}

export function validate(state: SanctumState, canon: Canon): Refusal[] {
  const out: Refusal[] = [];
  const seenMessages = new Set<string>();
  const refuse = (rule: Refusal["rule"], message: string, subject?: Refusal["subject"]) => {
    if (seenMessages.has(message)) return;
    seenMessages.add(message);
    out.push(subject ? { rule, message, subject } : { rule, message });
  };

  const arrays = ["layers", "conditions", "quarters", "stations", "elementKinds", "threadKinds", "tieKinds", "readings", "elements", "threads", "ties", "visions"] as const;
  if (!state || typeof state !== "object" || arrays.some((k) => !Array.isArray(state[k])) || !state.sight || !state.meta || !state.roles || !state.beyond) {
    return [{ rule: "shape", message: "The map has lost its form." }];
  }
  if (state.meta.schemaVersion !== SCHEMA_VERSION || !Number.isInteger(state.meta.version) || state.meta.version < 1) {
    refuse("shape", "The map has lost its form.");
  }

  /* ---- fixed tables ---- */
  const passage = <T extends { explanation: string }>(p: T) => omit(p, ["explanation"]);
  const realmFree = <T extends { explanation: string; nature: string[] }>(p: T) => omit(p, ["explanation", "nature"]);
  if (!stableEqual(state.layers.map(realmFree), canon.layers.map(realmFree))) {
    refuse("fixed", "The layers are fixed: none may be added, removed, moved or renamed.", { type: "layer" });
  }
  if (!stableEqual(realmFree(state.beyond), realmFree(canon.beyond))) {
    refuse("fixed", `${canon.beyond.title} is fixed: only its explanation and nature may change.`, { type: "layer", id: BEYOND });
  }
  if (!stableEqual(state.threadKinds.map(passage), canon.threadKinds.map(passage))) {
    refuse("fixed", "The kinds of cord are fixed: none may be added, removed or altered.", { type: "kind" });
  }
  if (!stableEqual(state.conditions.map(passage), canon.conditions.map(passage))) {
    refuse("fixed", "The conditions of the map are fixed.", { type: "map" });
  }
  if (!stableEqual(state.elementKinds, canon.elementKinds) || !stableEqual(state.tieKinds, canon.tieKinds)) {
    refuse("fixed", "The kinds of the map are fixed.", { type: "map" });
  }
  if (!stableEqual(state.roles, canon.roles)) refuse("fixed", "The roles of the map are fixed.", { type: "map" });
  if (!stableEqual(state.quarters, canon.quarters) || !stableEqual(state.stations, canon.stations) || !stableEqual(state.rim, canon.rim)) {
    refuse("fixed", "The quarters, stations and ring of the map are fixed.", { type: "map" });
  }
  if (!state.conditions.some((c) => c.id === state.condition)) refuse("condition", "The map must stand in one of its conditions.", { type: "map" });
  if (!stableEqual(passage(state.lexicon), passage(canon.lexicon)) || !stableEqual(passage(state.threshold), passage(canon.threshold))) {
    refuse("fixed", `${canon.lexicon.title} and ${canon.threshold.title} are fixed: only their explanations may change.`, { type: "map" });
  }

  const layerIds = new Set(state.layers.map((l) => l.id));
  const realmIds = new Set([...layerIds, BEYOND]);
  const conditionIds = new Set(state.conditions.map((c) => c.id));
  const quarterIds = new Set(state.quarters.map((q) => q.id));
  const stationIds = new Set(state.stations.map((s) => s.id));
  const elementKinds = new Map(state.elementKinds.map((k) => [k.id, k]));
  const threadKinds = new Map(state.threadKinds.map((k) => [k.id, k]));
  const tieKinds = new Map(state.tieKinds.map((k) => [k.id, k]));
  const byId = elementById(state);
  const visionIds = new Set(state.visions.map((v) => v.id));
  const title = (end: string) => endTitle(state, end, byId);

  /* ---- elements: form ---- */
  const marks = new Set<Id>();
  for (const e of state.elements) {
    const subject = { type: "element" as const, id: e.id };
    if (typeof e.id !== "string" || !SLUG.test(e.id) || e.id.length > SLUG_MAX || e.id.startsWith("layer") || e.id.startsWith("cord") || e.id === LEXICON) {
      refuse("shape", `${e.title}: its mark must be plain lowercase words joined by dashes.`, subject);
    }
    if (marks.has(e.id)) refuse("shape", `${e.title}: another part of the map already bears this mark.`, subject);
    marks.add(e.id);
    if (![0, 1, 2].includes(e.emphasis)) refuse("shape", `The weight of ${e.title} must be quiet, as it is, or heightened.`, subject);
    if (!Array.isArray(e.nature) || !Array.isArray(e.visions) || typeof e.locked !== "boolean") refuse("shape", `${e.title} has lost its form.`, subject);
  }
  const byRealm = new Map<Id, Element[]>();
  for (const e of state.elements) {
    const list = byRealm.get(e.realm);
    if (list) list.push(e);
    else byRealm.set(e.realm, [e]);
  }
  for (const [realm, list] of byRealm) {
    const orders = list.map((e) => e.order).sort((a, b) => a - b);
    if (orders.some((o, i) => o !== i)) refuse("shape", `The order within ${realmTitle(state, realm)} is broken.`, { type: "layer", id: realm });
  }

  /* ---- canonical elements ---- */
  const canonElements = new Set(canon.elements.map((e) => e.id));
  for (const c of canon.elements) {
    const e = byId.get(c.id);
    const subject = { type: "element" as const, id: c.id };
    if (!e) {
      refuse("canonical", `${c.title} is canonical: it cannot be drawn out of the map.`, subject);
      continue;
    }
    if (e.title !== c.title) refuse("canonical", `${c.title} is canonical: its title stays as it was given.`, subject);
    if (e.purpose !== c.purpose) refuse("canonical", `${c.title} is canonical: its purpose is sealed.`, subject);
    if (!stableEqual(omit(e, [...ELEMENT_FREE, "title", "purpose"]), omit(c, [...ELEMENT_FREE, "title", "purpose"]))) {
      refuse("canonical", `${c.title} is canonical: its place in the map is sealed.`, subject);
    }
  }
  for (const e of state.elements) {
    if (e.locked && !canonElements.has(e.id)) refuse("canonical", `${e.title} cannot be made canonical: only the canon's elements are.`, { type: "element", id: e.id });
  }

  /* ---- kind and realm ---- */
  for (const e of state.elements) {
    const subject = { type: "element" as const, id: e.id };
    const kind = elementKinds.get(e.kind);
    if (!kind) {
      refuse("kind-realm", `${e.title}: no such kind of element is known to the map.`, subject);
      continue;
    }
    if (!realmIds.has(e.realm)) {
      refuse("kind-realm", `${e.title} stands in a realm the map does not hold.`, subject);
      continue;
    }
    const parent = e.parent ? byId.get(e.parent) : undefined;
    if (e.parent && !parent) refuse("kind-realm", `${e.title} belongs to something that is not in the map.`, subject);
    if (kind.conditional) {
      if (!e.condition || !conditionIds.has(e.condition)) refuse("kind-realm", `${e.title} must carry one of the conditions of the map.`, subject);
    } else if (e.condition !== undefined) {
      refuse("kind-realm", `${e.title} cannot carry a condition.`, subject);
    }
    const becomesQuartered = !e.locked && kind.becomes && elementKinds.get(kind.becomes.kind)?.quarter === "required";
    if (e.quarter !== undefined && !quarterIds.has(e.quarter)) refuse("kind-realm", `${e.title} stands in a quarter the map does not hold.`, subject);
    else if (!kind.quarter && e.quarter !== undefined) refuse("kind-realm", `${e.title} cannot carry a quarter.`, subject);
    else if ((kind.quarter === "required" || becomesQuartered) && e.quarter === undefined) refuse("kind-realm", `${e.title} must stand in one of the quarters.`, subject);
    if (e.station !== undefined && !stationIds.has(e.station)) refuse("kind-realm", `${e.title} keeps a station the map does not hold.`, subject);
    if (e.awaiting !== undefined && (e.awaiting !== true || !state.rim || e.kind !== state.rim.stoneKind)) refuse("kind-realm", `${e.title} cannot await a binding.`, subject);
    if (kind.raisedIn && !e.locked && state.condition !== kind.raisedIn.condition) refuse("condition", kind.raisedIn.refusal, subject);
    const realmOk = kind.realms.some((r) => {
      if (r.condition && e.condition !== r.condition) return false;
      if (r.realms?.includes(e.realm)) return true;
      if (r.inLayers && layerIds.has(e.realm)) return true;
      if (r.parentRealm && parent && parent.realm === e.realm) return true;
      return false;
    });
    if (!realmOk) refuse("kind-realm", `${e.title} cannot stand in ${realmTitle(state, e.realm)}: a ${kind.title.toLowerCase()} stands in ${realmRuleText(state, kind)}.`, subject);
    if (kind.parent) {
      if (!parent) {
        if (!e.parent) refuse("kind-realm", `${e.title} must belong to another: a ${kind.title.toLowerCase()} never stands on its own.`, subject);
      } else {
        if (!matchesElement(parent, kind.parent.select, layerIds)) refuse("kind-realm", `${e.title} cannot belong to ${parent.title}.`, subject);
        const tieKind = kind.parent.tie;
        if (!state.ties.some((t) => t.kind === tieKind && t.from === e.id && t.to === parent.id)) {
          refuse("kind-realm", `The structure of ${e.title} is incomplete: it is not bound to ${parent.title}.`, subject);
        }
      }
    } else if (e.parent !== undefined) {
      refuse("kind-realm", `${e.title} cannot belong to another.`, subject);
    }
    for (const req of e.awaiting ? [] : kind.ties ?? []) {
      if (!state.ties.some((t) => t.kind === req.kind && t.from === e.id && t.to === req.to)) {
        refuse("kind-realm", `The structure of ${e.title} is incomplete.`, subject);
      }
    }
  }
  for (const [tieKind, kind] of state.elementKinds.flatMap((k) => (k.parent ? [[k.parent.tie, k] as const] : []))) {
    for (const t of state.ties) {
      if (t.kind !== tieKind) continue;
      const from = byId.get(t.from);
      if (from && from.kind === kind.id && from.parent !== t.to) refuse("kind-realm", `The structure of ${from.title} is broken.`, { type: "element", id: from.id });
    }
  }

  /* ---- capacity ---- */
  for (const l of [...state.layers, state.beyond]) {
    const n = byRealm.get(l.id)?.length ?? 0;
    if (n > l.capacity) refuse("capacity", `${l.title} holds at most ${numberWord(l.capacity)}.`, { type: "layer", id: l.id });
  }
  for (const k of state.elementKinds) {
    const n = state.elements.filter((e) => e.kind === k.id).length;
    if (n > k.capacity) refuse("capacity", `The map holds at most ${numberWord(k.capacity)} of the kind ${k.title.toLowerCase()}.`, { type: "kind", id: k.id });
    /* What will come to rest on a turn keeps its room in advance. */
    if (k.becomes) {
      const pending = state.elements.filter((e) => e.kind === k.id && !e.locked).length;
      const realmCap = k.becomes.realm === BEYOND ? state.beyond.capacity : state.layers.find((l) => l.id === k.becomes!.realm)?.capacity ?? 0;
      const target = elementKinds.get(k.becomes.kind);
      const inRealm = byRealm.get(k.becomes.realm)?.length ?? 0;
      const ofTarget = state.elements.filter((e) => e.kind === k.becomes!.kind).length;
      if (pending && (inRealm + pending > realmCap || (target && ofTarget + pending > target.capacity))) refuse("capacity", k.becomes.refusal, { type: "kind", id: k.id });
    }
  }

  /* ---- cords ---- */
  const canonThreads = new Map(canon.threads.map((t) => [t.id, t]));
  const threadMarks = new Set<Id>();
  const twins = new Set<string>();
  const perKind = new Map<Id, number>();
  for (const t of state.threads) {
    const subject = { type: "thread" as const, id: t.id };
    const kind = threadKinds.get(t.kind);
    const named = kind ? `the cord of ${kind.title.toLowerCase()}` : "a cord";
    if (typeof t.id !== "string" || !SLUG.test(t.id) || t.id.length > SLUG_MAX) refuse("shape", `${cap(named)}: its mark must be plain lowercase words joined by dashes.`, subject);
    if (threadMarks.has(t.id)) refuse("shape", `${cap(named)}: another cord already bears this mark.`, subject);
    threadMarks.add(t.id);
    if (!kind) {
      refuse("grammar", "No such kind of cord is named in the lexicon.", subject);
      continue;
    }
    perKind.set(kind.id, (perKind.get(kind.id) ?? 0) + 1);
    const endOk = (end: string) => (isLayerRef(end) ? layerIds.has(refId(end)) : byId.has(end));
    if (!endOk(t.from) || !endOk(t.to)) {
      refuse("grammar", `${cap(named)} reaches toward something that is not in the map.`, subject);
      continue;
    }
    if (t.from === t.to) {
      refuse("grammar", `${cap(named)} cannot run from ${title(t.from)} to itself.`, subject);
      continue;
    }
    const courseOk = kind.grammar.courses.some(
      (c) => matchesEnd(t.from, c.from, byId, layerIds) && matchesEnd(t.to, c.to, byId, layerIds),
    );
    if (!courseOk) refuse("grammar", `${cap(named)} refuses the course from ${title(t.from)} to ${title(t.to)}: ${kind.grammar.refusal}`, subject);
    const expected = expectedCondition(t, threadKinds, byId);
    if (expected.conflict) {
      refuse("grammar", `${cap(named)} cannot join ${title(t.from)} and ${title(t.to)}: they never stand in the same condition.`, subject);
    } else if (t.condition !== expected.condition) {
      const c = state.conditions.find((x) => x.id === expected.condition);
      refuse("grammar", c ? `${cap(named)} from ${title(t.from)} to ${title(t.to)} exists only in ${c.title.toLowerCase()}.` : `${cap(named)} from ${title(t.from)} to ${title(t.to)} carries no condition.`, subject);
    }
    if (t.bidirectional !== Boolean(kind.grammar.bidirectional)) {
      refuse("grammar", kind.grammar.bidirectional ? `${cap(named)} always runs both ways.` : `${cap(named)} does not run both ways.`, subject);
    }
    if (t.irreversible !== Boolean(kind.grammar.irreversible)) {
      refuse("grammar", kind.grammar.irreversible ? `${cap(named)} is irreversible.` : `${cap(named)} cannot be made irreversible.`, subject);
    }
    const key = threadKey(t, threadKinds);
    if (twins.has(key)) refuse("grammar", `${cap(named)} between ${title(t.from)} and ${title(t.to)} is already bound.`, subject);
    twins.add(key);
    const c = canonThreads.get(t.id);
    if (c && !stableEqual(omit(t, THREAD_FREE), omit(c, THREAD_FREE))) {
      refuse("canonical", `${cap(named)} from ${title(c.from)} to ${title(c.to)} is canonical: its course, function and purpose are sealed.`, subject);
    }
    if (t.locked && !c) refuse("canonical", `${cap(named)} cannot be made canonical: only the vault's cords are.`, subject);
  }
  for (const c of canon.threads) {
    if (!threadMarks.has(c.id)) {
      const kind = threadKinds.get(c.kind);
      refuse("canonical", `The cord of ${kind?.title.toLowerCase() ?? "the map"} from ${title(c.from)} to ${title(c.to)} is canonical: it cannot be unbound.`, { type: "thread", id: c.id });
    }
  }
  for (const k of state.threadKinds) {
    const n = perKind.get(k.id) ?? 0;
    if (n < k.grammar.min) refuse("grammar", `The map needs at least ${numberWord(k.grammar.min)} cord${k.grammar.min === 1 ? "" : "s"} of ${k.title.toLowerCase()}.`, { type: "kind", id: k.id });
    if (n > k.grammar.max) refuse("grammar", `The map holds at most ${numberWord(k.grammar.max)} cord${k.grammar.max === 1 ? "" : "s"} of ${k.title.toLowerCase()}.`, { type: "kind", id: k.id });
  }

  /* ---- an element with states acts only through them ---- */
  for (const parent of state.elements) {
    const states = state.elements.filter((e) => e.parent === parent.id && elementKinds.get(e.kind)?.conditional);
    if (!states.length) continue;
    const stateIds = new Set(states.map((s) => s.id));
    const carried = new Set(state.threads.filter((t) => stateIds.has(t.from) || stateIds.has(t.to)).map((t) => t.kind));
    for (const t of state.threads) {
      if ((t.from === parent.id || t.to === parent.id) && carried.has(t.kind)) {
        const kind = threadKinds.get(t.kind);
        refuse("grammar", `${parent.title} acts through its states: a cord of ${kind?.title.toLowerCase() ?? "this kind"} belongs to them.`, { type: "thread", id: t.id });
      }
    }
  }

  /* ---- ties ---- */
  const canonTies = new Map(canon.ties.map((t) => [t.id, t]));
  const tieMarks = new Set<Id>();
  const tieTwins = new Set<string>();
  for (const t of state.ties) {
    const subject = { type: "tie" as const, id: t.id };
    if (typeof t.id !== "string" || !SLUG.test(t.id) || tieMarks.has(t.id)) refuse("shape", "The structure of the map has lost its form.", subject);
    tieMarks.add(t.id);
    const kind = tieKinds.get(t.kind);
    const endOk = (end: string) =>
      isLayerRef(end) ? layerIds.has(refId(end)) : end.startsWith("cord:") ? threadKinds.has(refId(end)) : end === LEXICON || byId.has(end);
    if (!kind || !endOk(t.from) || !endOk(t.to) || t.from === t.to) {
      refuse("shape", "The structure of the map reaches toward something it does not hold.", subject);
      continue;
    }
    const key = kind.symmetric && t.to < t.from ? `${t.kind}|${t.to}|${t.from}` : `${t.kind}|${t.from}|${t.to}`;
    if (tieTwins.has(key)) refuse("shape", `${title(t.from)} ${kind.title.toLowerCase()} ${title(t.to)} is already held.`, subject);
    tieTwins.add(key);
    const c = canonTies.get(t.id);
    if (c && !stableEqual(t, c)) refuse("canonical", `The structure of the map is canonical: ${title(c.from)} ${kind.title.toLowerCase()} ${title(c.to)} stays.`, subject);
    if (t.locked && !c) refuse("canonical", "Only the vault's structure is canonical.", subject);
  }
  for (const c of canon.ties) {
    if (!tieMarks.has(c.id)) {
      const kind = tieKinds.get(c.kind);
      refuse("canonical", `The structure of the map is canonical: ${title(c.from)} ${kind?.title.toLowerCase() ?? ""} ${title(c.to)} stays.`, { type: "tie", id: c.id });
    }
  }

  /* ---- no dead space, and every element reaches the core ---- */
  const touched = new Set<string>();
  for (const t of state.threads) {
    touched.add(t.from);
    touched.add(t.to);
  }
  const reaching = reachingCore(state);
  const core = byId.get(state.roles.core);
  for (const e of state.elements) {
    const subject = { type: "element" as const, id: e.id };
    if (e.awaiting) {
      if (touched.has(e.id)) refuse("rim", `${e.title} awaits its binding: no cord may touch it yet.`, subject);
      else if (!state.ties.some((t) => t.from === e.id || t.to === e.id)) refuse("no-dead-space", `No dead space: ${e.title} would stand held by nothing.`, subject);
      else if (!reaching.has(e.id)) refuse("reach", `${e.title} would no longer reach ${core?.title ?? "the core"}.`, subject);
      continue;
    }
    if (!touched.has(e.id)) refuse("no-dead-space", `No dead space: ${e.title} would stand without a cord.`, subject);
    else if (e.realm !== BEYOND && !reaching.has(e.id)) refuse("reach", `${e.title} would no longer reach ${core?.title ?? "the core"}.`, subject);
  }

  /* ---- the rim: one closed ring, one crossing per quarter ---- */
  if (state.rim) {
    const rim = state.rim;
    const required = new Map(ringPairs(state).map(([a, b]) => [pairKey(a, b), [a, b] as const]));
    const bound = new Set<string>();
    for (const t of state.threads) {
      if (t.kind !== rim.ringKind || isLayerRef(t.from) || isLayerRef(t.to)) continue;
      const a = byId.get(t.from);
      const b = byId.get(t.to);
      if (a?.kind !== rim.stoneKind || b?.kind !== rim.stoneKind) continue;
      const key = pairKey(a.id, b.id);
      if (!required.has(key)) refuse("rim", `The rim is one closed ring: ${a.title} and ${b.title} are not neighbours on it.`, { type: "thread", id: t.id });
      bound.add(key);
    }
    for (const [key, [a, b]] of required) {
      if (!bound.has(key)) refuse("rim", `The rim is one closed ring: ${title(a)} and ${title(b)} must be bound.`, { type: "map" });
    }
    const perQuarter = new Map<Id, number>(state.quarters.map((q) => [q.id, 0]));
    for (const t of state.threads) {
      if (t.kind !== rim.crossingKind) continue;
      const from = byId.get(t.from);
      if (from?.quarter && perQuarter.has(from.quarter)) perQuarter.set(from.quarter, perQuarter.get(from.quarter)! + 1);
      else refuse("rim", `A crossing departs only from an element of a quarter.`, { type: "thread", id: t.id });
    }
    for (const q of state.quarters) {
      const n = perQuarter.get(q.id) ?? 0;
      const holdsAny = state.elements.some((e) => e.quarter === q.id && e.kind === rim.stoneKind && !e.awaiting);
      if (holdsAny && n !== 1) refuse("rim", `Each quarter gathers into exactly one crossing: ${q.title} holds ${n ? numberWord(n) : "none"}.`, { type: "map" });
    }
  }

  /* ---- words ---- */
  const turnerEl = byId.get(state.roles.turner);
  const names: NameContext = { core: core?.title, turner: turnerEl?.title };
  const words = (value: unknown, what: string, budget: number, subject: Refusal["subject"], opts: { sentence?: boolean; required?: boolean; title?: boolean } = {}) => {
    if (typeof value !== "string") {
      refuse("text", `The words of ${what} have lost their form.`, subject);
      return;
    }
    const text = value.trim();
    if (opts.required && !text) refuse("text", `${cap(what)} cannot be left empty.`, subject);
    if ([...value].length > budget) refuse("text", `${cap(what)} holds at most ${numberWord(budget)} letters.`, subject);
    if (opts.sentence && text && !isOneSentence(text)) refuse("text", `${cap(what)} must be one sentence.`, subject);
    if (hasHiddenMarks(value)) refuse("text", `${cap(what)} holds marks that cannot be seen.`, subject);
    if (opts.title && text && !/\p{L}/u.test(text)) refuse("text", `${cap(what)} needs at least one letter.`, subject);
    for (const w of impureWords(value)) refuse("purity", `The word “${w}” does not belong to the map's tongue (${what}).`, subject);
    if (alludesToName(value, names)) refuse("sealed-name", `The sealed name stays sealed: ${what} may not speak of its form.`, subject);
    if (equatesFigures(value, names)) refuse("apart", `${names.turner} and ${names.core} are never one figure (${what}).`, subject);
  };
  const lines = (value: unknown, what: string, subject: Refusal["subject"]) => {
    if (!Array.isArray(value)) {
      refuse("text", `The words of ${what} have lost their form.`, subject);
      return;
    }
    if (value.length > BUDGET.natureLines) refuse("text", `${cap(what)} holds at most ${numberWord(BUDGET.natureLines)} lines.`, subject);
    value.forEach((line) => words(line, what, BUDGET.natureLine, subject, { required: true }));
  };
  const seenTitles = new Map<string, Id>();
  const holds = (title: string, other?: string) => Boolean(other) && new RegExp(`(^|[^\\p{L}])${fold(other!).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u").test(fold(title));
  for (const e of state.elements) {
    const subject = { type: "element" as const, id: e.id };
    words(e.title, "a title", BUDGET.title, subject, { required: true, title: true });
    const key = fold(e.title).trim().replace(/\s+/g, " ");
    if (seenTitles.has(key)) refuse("text", `${e.title}: another element of the map already bears this title.`, subject);
    seenTitles.set(key, e.id);
    if (e.id !== state.roles.core && holds(e.title, core?.title)) refuse("apart", `No title but its own may hold ${core?.title}.`, subject);
    if (e.id !== state.roles.turner && holds(e.title, turnerEl?.title)) refuse("apart", `No title but his own may hold ${turnerEl?.title}.`, subject);
    words(e.purpose, `the purpose of ${e.title}`, BUDGET.purpose, subject, { sentence: true, required: true });
    words(e.explanation, `the explanation of ${e.title}`, BUDGET.explanation, subject);
    lines(e.nature, `the nature of ${e.title}`, subject);
  }
  for (const t of state.threads) {
    const subject = { type: "thread" as const, id: t.id };
    const what = `the cord from ${title(t.from)} to ${title(t.to)}`;
    words(t.label, `the function of ${what}`, BUDGET.label, subject, { required: true });
    words(t.purpose, `the purpose of ${what}`, BUDGET.purpose, subject, { sentence: true, required: true });
    words(t.explanation, `the explanation of ${what}`, BUDGET.explanation, subject);
  }
  for (const l of [...state.layers, state.beyond]) {
    const subject = { type: "layer" as const, id: l.id };
    words(l.explanation, `the explanation of ${l.title}`, BUDGET.explanation, subject);
    lines(l.nature, `the nature of ${l.title}`, subject);
  }
  for (const p of [...state.threadKinds, ...state.conditions, state.lexicon, state.threshold]) {
    words(p.explanation, `the explanation of ${p.title}`, BUDGET.explanation, { type: "kind" });
  }
  for (const p of [...state.layers, state.beyond, ...state.threadKinds, state.lexicon, state.threshold]) {
    for (const w of impureWords(`${p.title} ${p.purpose}`)) refuse("purity", `The word “${w}” does not belong to the map's tongue (${p.title}).`, { type: "map" });
  }
  words(state.meta.summary, "the summary of the change", BUDGET.summary, { type: "map" });

  /* ---- visions ---- */
  const visionMarks = new Set<Id>();
  for (const v of state.visions) {
    const subject = { type: "vision" as const, id: v.id };
    if (typeof v.id !== "string" || !SLUG.test(v.id) || visionMarks.has(v.id)) refuse("vision", "A vision has lost its mark.", subject);
    visionMarks.add(v.id);
    words(v.title, "the title of a vision", BUDGET.visionTitle, subject, { required: true, title: true });
    const sizesOk = Array.isArray(v.sizes) && v.sizes.length > 0 && v.sizes.every((s, i) => Number.isInteger(s) && s > 0 && (i === 0 || s > v.sizes[i - 1]));
    const formatsOk = Array.isArray(v.formats) && v.formats.length > 0 && v.formats.every((f) => f === "avif" || f === "webp");
    if (!(v.width > 0 && v.height > 0) || !sizesOk || !formatsOk || !Array.isArray(v.subjects)) refuse("vision", `The vision ${v.title} has lost its form.`, subject);
    const seen = new Set<Id>();
    for (const s of v.subjects ?? []) {
      const e = byId.get(s.elementId);
      if (!e) {
        refuse("vision", `The vision ${v.title} is set upon something the map does not hold.`, subject);
        continue;
      }
      if (seen.has(s.elementId)) refuse("vision", `The vision ${v.title} is set upon ${e.title} twice.`, subject);
      seen.add(s.elementId);
      const inside = (n: number) => typeof n === "number" && n >= 0 && n <= 1;
      if (!inside(s.x) || !inside(s.y)) refuse("vision", `The gaze upon ${e.title} must fall within the vision.`, subject);
      if (typeof s.zoom !== "number" || s.zoom < ZOOM.min || s.zoom > ZOOM.max) refuse("vision", `A vision draws closer upon ${e.title} at most ${numberWord(ZOOM.max)} times.`, subject);
      if (!e.visions.includes(v.id)) refuse("vision", `The visions of ${e.title} and the subjects of ${v.title} disagree.`, subject);
    }
  }
  for (const e of state.elements) {
    if (state.roles.unseen.includes(e.id) && e.visions.length) refuse("vision", `${e.title} takes no vision.`, { type: "element", id: e.id });
    if (new Set(e.visions).size !== e.visions.length) refuse("vision", `A vision is set upon ${e.title} twice.`, { type: "element", id: e.id });
    for (const id of e.visions) {
      const v = state.visions.find((x) => x.id === id);
      if (!visionIds.has(id) || !v) refuse("vision", `A vision is set upon ${e.title} that the map does not hold.`, { type: "element", id: e.id });
      else if (!v.subjects.some((s) => s.elementId === e.id)) refuse("vision", `The visions of ${e.title} and the subjects of ${v.title} disagree.`, { type: "element", id: e.id });
    }
  }

  /* ---- readings ---- */
  const readingIds = new Set<Id>();
  const readingTitles = new Set<string>();
  const canonReadings = new Map(canon.readings.map((r) => [r.id, r]));
  for (const r of state.readings) {
    const subject = { type: "reading" as const, id: r.id };
    if (typeof r.id !== "string" || !SLUG.test(r.id) || r.id.length > SLUG_MAX) refuse("shape", `${r.title}: its mark must be plain lowercase words joined by dashes.`, subject);
    if (readingIds.has(r.id)) refuse("shape", `${r.title}: another reading already bears this mark.`, subject);
    readingIds.add(r.id);
    words(r.title, "the title of a reading", BUDGET.readingTitle, subject, { required: true, title: true });
    const readingKey = fold(r.title).trim().replace(/\s+/g, " ");
    if (readingTitles.has(readingKey)) refuse("text", `${r.title}: another reading already bears this title.`, subject);
    readingTitles.add(readingKey);
    words(r.text, `the reading ${r.title}`, BUDGET.readingText, subject, { required: true });
    const l = r.lights;
    const lightsOk =
      l && Array.isArray(l.layers) && Array.isArray(l.threadKinds) && Array.isArray(l.elements) &&
      l.layers.every((id) => realmIds.has(id)) && l.threadKinds.every((id) => threadKinds.has(id)) && l.elements.every((id) => byId.has(id));
    if (!lightsOk) refuse("reading", `The reading ${r.title} lights something the map does not hold.`, subject);
    else if (!l.layers.length && !l.threadKinds.length && !l.elements.length) refuse("reading", `The reading ${r.title} lights nothing.`, subject);
    const c = canonReadings.get(r.id);
    if (c && !stableEqual(omit(r, ["title", "text", "order"]), omit(c, ["title", "text", "order"]))) refuse("canonical", `The reading ${c.title} is canonical: what it lights is sealed.`, subject);
    if (r.locked && !c) refuse("canonical", `The reading ${r.title} cannot be made canonical.`, subject);
  }
  for (const c of canon.readings) {
    if (!readingIds.has(c.id)) refuse("canonical", `The reading ${c.title} is canonical: it cannot be set aside.`, { type: "reading", id: c.id });
  }
  const own = state.readings.filter((r) => !r.locked).length;
  if (own > BUDGET.ownReadings) refuse("capacity", `Beside the canonical readings, the map holds at most ${numberWord(BUDGET.ownReadings)} of your own.`, { type: "reading" });
  const readingOrders = state.readings.map((r) => r.order).sort((a, b) => a - b);
  if (readingOrders.some((o, i) => o !== i)) refuse("shape", "The order of the readings is broken.", { type: "reading" });

  /* ---- sight ---- */
  const sight = state.sight;
  const sightOk =
    Array.isArray(sight.layers) && sight.layers.every((id) => realmIds.has(id)) && new Set(sight.layers).size === sight.layers.length &&
    Array.isArray(sight.kinds) && sight.kinds.every((id) => threadKinds.has(id)) && new Set(sight.kinds).size === sight.kinds.length &&
    conditionIds.has(sight.condition) &&
    (sight.reading === null || readingIds.has(sight.reading)) &&
    typeof sight.explanations === "boolean" && typeof sight.flow === "boolean" && typeof sight.rehearsal === "boolean";
  if (!sightOk) refuse("sight", "The sight names something the map does not hold.", { type: "sight" });

  return out;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
