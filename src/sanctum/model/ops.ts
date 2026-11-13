/* Ops: the only way the map changes. Applied in order to a copy; the result
   is then checked by validate(). Bodies arrive from the network, so every
   field is checked for form here before it is trusted. */

import { BUDGET, SLUG, ZOOM, clone, elementById, endTitle, isLayerRef, numberWord, pairKey, realmTitle, ringPairs, stableEqual } from "./rules.ts";
import { expectedCondition } from "./validate.ts";
import {
  BEYOND,
  type Diff,
  type Element,
  type Id,
  type Op,
  type Reading,
  type Refusal,
  type SanctumState,
  type Sight,
  type TextField,
  type TextTarget,
  type Thread,
  type Tie,
  type VisionFiles,
} from "./types.ts";

export interface OpsContext {
  /** Files of a brought vision, by id (server: from disk; client: from the bring answer). */
  visionFiles?: (id: Id) => VisionFiles | undefined;
}

export interface OpsResult {
  state: SanctumState;
  refusals: Refusal[];
}

const FIELD_WORD: Record<TextField, string> = {
  title: "title",
  purpose: "purpose",
  explanation: "explanation",
  nature: "nature",
  label: "function",
  text: "words",
};

const SIGHT_KEYS: (keyof Sight)[] = ["layers", "kinds", "condition", "reading", "explanations", "flow", "rehearsal"];

/* Every key an op may carry; anything else is refused, never stored. */
const OP_KEYS: Record<string, string[]> = {
  setText: ["target", "field", "value"],
  addElement: ["element"],
  removeElement: ["id"],
  addThread: ["thread"],
  removeThread: ["id"],
  addVision: ["visionId", "title"],
  removeVision: ["visionId"],
  assignVision: ["visionId", "elementId", "x", "y", "zoom", "primary"],
  unassignVision: ["visionId", "elementId"],
  setVisionSubject: ["visionId", "elementId", "x", "y", "zoom"],
  reorderWithinLayer: ["realm", "order"],
  setEmphasis: ["id", "emphasis"],
  setSight: ["sight"],
  addReading: ["reading"],
  removeReading: ["id"],
  setReadingLights: ["id", "lights"],
  turn: ["condition"],
  firstBinding: ["id"],
};
const NESTED_KEYS: Record<string, string[]> = {
  target: ["type", "id"],
  element: ["id", "title", "kind", "realm", "parent", "condition", "quarter", "purpose", "nature", "explanation"],
  thread: ["id", "kind", "from", "to", "label", "purpose", "explanation"],
  reading: ["id", "title", "text", "lights"],
  lights: ["layers", "threadKinds", "elements"],
};
const onlyKeys = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every((k) => allowed.includes(k));
function wellFormed(raw: Record<string, unknown>): boolean {
  const allowed = OP_KEYS[raw.op as string];
  if (!allowed || !onlyKeys(raw, ["op", ...allowed])) return false;
  for (const [key, keys] of Object.entries(NESTED_KEYS)) {
    const inner = raw[key];
    if (inner !== undefined && (!isObj(inner) || !onlyKeys(inner, keys))) return false;
  }
  const lights = isObj(raw.reading) ? raw.reading.lights : undefined;
  if (lights !== undefined && (!isObj(lights) || !onlyKeys(lights, NESTED_KEYS.lights))) return false;
  return true;
}

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function compactOrder(state: SanctumState, realm: Id) {
  state.elements
    .filter((e) => e.realm === realm)
    .sort((a, b) => a.order - b.order)
    .forEach((e, i) => (e.order = i));
}

function freshId(taken: Set<Id>, base: string): Id {
  for (let n = 1; ; n++) {
    const id = `${base}-${n}`;
    if (!taken.has(id)) return id;
  }
}

/** The rim's ring is derived, never hand-bound: arcs between rim neighbours
    are added, arcs that are no longer between neighbours are drawn out. */
function deriveRing(state: SanctumState) {
  const rim = state.rim;
  if (!rim) return;
  const byId = elementById(state);
  const kind = state.threadKinds.find((k) => k.id === rim.ringKind);
  if (!kind) return;
  const isArc = (t: Thread) =>
    t.kind === rim.ringKind && !isLayerRef(t.from) && !isLayerRef(t.to) && byId.get(t.from)?.kind === rim.stoneKind && byId.get(t.to)?.kind === rim.stoneKind;
  const required = new Map(ringPairs(state).map(([a, b]) => [pairKey(a, b), [a, b] as const]));
  state.threads = state.threads.filter((t) => !isArc(t) || t.locked || required.has(pairKey(t.from, t.to)));
  const present = new Set(state.threads.filter(isArc).map((t) => pairKey(t.from, t.to)));
  const taken = new Set(state.threads.map((t) => t.id));
  for (const [key, [a, b]] of required) {
    if (present.has(key)) continue;
    const base = `${rim.ringKind}-${a}-${b}`.slice(0, 44).replace(/-+$/, "");
    const id = taken.has(base) ? freshId(taken, base) : base;
    taken.add(id);
    state.threads.push({
      id,
      kind: kind.id,
      from: a,
      to: b,
      label: rim.ring.label,
      purpose: rim.ring.purpose,
      explanation: "",
      bidirectional: Boolean(kind.grammar.bidirectional),
      irreversible: Boolean(kind.grammar.irreversible),
      locked: false,
    });
  }
}

const touchesRim = (state: SanctumState, e: { kind: Id; realm: Id }) => Boolean(state.rim && (e.kind === state.rim.stoneKind || e.realm === state.rim.realm));

export function applyOps(base: SanctumState, ops: unknown, ctx: OpsContext = {}): OpsResult {
  const state = clone(base);
  const refusals: Refusal[] = [];
  if (!Array.isArray(ops) || ops.length === 0) {
    return { state, refusals: [{ rule: "op", message: "A change needs at least one step." }] };
  }
  if (ops.length > BUDGET.ops) {
    return { state, refusals: [{ rule: "op", message: `A change holds at most ${numberWord(BUDGET.ops)} steps.` }] };
  }
  ops.forEach((raw, index) => {
    const message = applyOne(state, raw, ctx);
    if (message) refusals.push({ rule: "op", message, op: index });
  });
  return { state, refusals };
}

/** Applies one op in place; answers a refusal in the map's tongue, or nothing. */
function applyOne(state: SanctumState, raw: unknown, ctx: OpsContext): string | undefined {
  const unknown = "The map does not know this change.";
  const missing = "Nothing of that mark stands in the map.";
  if (!isObj(raw) || !isStr(raw.op) || !wellFormed(raw)) return unknown;
  const op = raw as unknown as Op;
  const byId = elementById(state);

  switch (op.op) {
    case "setText": {
      if (!isObj(op.target) || !isStr(op.target.type) || !isStr(op.field)) return unknown;
      return setText(state, op.target, op.field, op.value);
    }

    case "addElement": {
      const n = op.element as unknown;
      if (!isObj(n) || !isStr(n.id) || !isStr(n.title) || !isStr(n.kind) || !isStr(n.realm) || !isStr(n.purpose)) return unknown;
      if (n.parent !== undefined && !isStr(n.parent)) return unknown;
      if (n.condition !== undefined && !isStr(n.condition)) return unknown;
      if (n.nature !== undefined && !isStrList(n.nature)) return unknown;
      if (n.explanation !== undefined && !isStr(n.explanation)) return unknown;
      if (n.quarter !== undefined && !isStr(n.quarter)) return unknown;
      const kind = state.elementKinds.find((k) => k.id === n.kind);
      if (!kind) return `${n.title}: no such kind of element is known to the map.`;
      if (!kind.addable) return `No ${kind.title.toLowerCase()} may be added to the map.`;
      if (kind.raisedIn && state.condition !== kind.raisedIn.condition) return kind.raisedIn.refusal;
      if (!SLUG.test(n.id)) return `${n.title}: its mark must be plain lowercase words joined by dashes.`;
      if (byId.has(n.id)) return `${n.title}: another part of the map already bears this mark.`;
      const element: Element = {
        id: n.id,
        title: n.title,
        kind: n.kind,
        realm: n.realm,
        ...(n.parent ? { parent: n.parent } : {}),
        ...(n.condition ? { condition: n.condition } : {}),
        ...(n.quarter ? { quarter: n.quarter as string } : {}),
        purpose: n.purpose,
        nature: (n.nature as string[] | undefined) ?? [],
        explanation: (n.explanation as string | undefined) ?? n.purpose,
        visions: [],
        emphasis: 1,
        order: state.elements.filter((e) => e.realm === n.realm).length,
        locked: false,
      };
      state.elements.push(element);
      const tieIds = new Set(state.ties.map((t) => t.id));
      const tie = (kindId: Id, to: string) => {
        const t: Tie = { id: freshId(tieIds, `${kindId}-${element.id}`), kind: kindId, from: element.id, to: to as Tie["to"], locked: false };
        tieIds.add(t.id);
        state.ties.push(t);
      };
      if (kind.parent && element.parent) tie(kind.parent.tie, element.parent);
      for (const req of kind.ties ?? []) tie(req.kind, req.to);
      if (touchesRim(state, element)) deriveRing(state);
      return;
    }

    case "removeElement": {
      if (!isStr(op.id)) return unknown;
      const e = byId.get(op.id);
      if (!e) return missing;
      if (e.locked) return `${e.title} is canonical: it cannot be drawn out of the map.`;
      const child = state.elements.find((x) => x.parent === e.id);
      if (child) return `${e.title} cannot be drawn out while ${child.title} belongs to it.`;
      const touching = (t: Thread | Tie) => t.from === e.id || t.to === e.id;
      if (state.threads.some((t) => touching(t) && (t.locked || t.irreversible))) return `${e.title} is held by a canonical cord.`;
      if (state.ties.some((t) => touching(t) && t.locked)) return `${e.title} is held by the canonical structure.`;
      state.threads = state.threads.filter((t) => !touching(t));
      state.ties = state.ties.filter((t) => !touching(t));
      for (const v of state.visions) v.subjects = v.subjects.filter((s) => s.elementId !== e.id);
      for (const r of state.readings) {
        if (!r.locked) r.lights.elements = r.lights.elements.filter((id) => id !== e.id);
      }
      state.elements = state.elements.filter((x) => x.id !== e.id);
      compactOrder(state, e.realm);
      if (touchesRim(state, e)) deriveRing(state);
      return;
    }

    case "addThread": {
      const n = op.thread as unknown;
      if (!isObj(n) || !isStr(n.kind) || !isStr(n.from) || !isStr(n.to) || !isStr(n.label) || !isStr(n.purpose)) return unknown;
      if (n.id !== undefined && !isStr(n.id)) return unknown;
      if (n.explanation !== undefined && !isStr(n.explanation)) return unknown;
      const kind = state.threadKinds.find((k) => k.id === n.kind);
      if (!kind) return "No such kind of cord is named in the lexicon.";
      const taken = new Set(state.threads.map((t) => t.id));
      const id = (n.id as string | undefined) ?? freshId(taken, kind.id);
      if (!SLUG.test(id)) return "A cord's mark must be plain lowercase words joined by dashes.";
      if (taken.has(id)) return "Another cord already bears this mark.";
      const kinds = new Map(state.threadKinds.map((k) => [k.id, k]));
      const cond = expectedCondition({ kind: n.kind, from: n.from as Thread["from"], to: n.to as Thread["to"] }, kinds, byId);
      const thread: Thread = {
        id,
        kind: kind.id,
        from: n.from as Thread["from"],
        to: n.to as Thread["to"],
        label: n.label,
        purpose: n.purpose,
        explanation: (n.explanation as string | undefined) ?? "",
        ...(cond.condition && !cond.conflict ? { condition: cond.condition } : {}),
        bidirectional: Boolean(kind.grammar.bidirectional),
        irreversible: Boolean(kind.grammar.irreversible),
        locked: false,
      };
      state.threads.push(thread);
      return;
    }

    case "removeThread": {
      if (!isStr(op.id)) return unknown;
      const t = state.threads.find((x) => x.id === op.id);
      if (!t) return missing;
      const kind = state.threadKinds.find((k) => k.id === t.kind);
      if (t.irreversible) return `The cord of ${kind?.title.toLowerCase() ?? "the map"} is irreversible: it can never be unbound.`;
      if (t.locked) return `The cord of ${kind?.title.toLowerCase() ?? "the map"} from ${endTitle(state, t.from, byId)} to ${endTitle(state, t.to, byId)} is canonical: it cannot be unbound.`;
      state.threads = state.threads.filter((x) => x.id !== t.id);
      return;
    }

    case "addVision": {
      if (!isStr(op.visionId) || !isStr(op.title)) return unknown;
      if (state.visions.some((v) => v.id === op.visionId)) return "That vision is already in the map.";
      const files = ctx.visionFiles?.(op.visionId);
      if (!files || files.id !== op.visionId) return "That vision has not been brought.";
      state.visions.push({ ...clone(files), title: op.title, subjects: [] });
      return;
    }

    case "removeVision": {
      if (!isStr(op.visionId)) return unknown;
      const v = state.visions.find((x) => x.id === op.visionId);
      if (!v) return "That vision is not in the map.";
      const held = v.subjects[0] && byId.get(v.subjects[0].elementId);
      if (held) return `This vision is still set upon ${held.title}.`;
      state.visions = state.visions.filter((x) => x.id !== v.id);
      return;
    }

    case "assignVision": {
      if (!isStr(op.visionId) || !isStr(op.elementId)) return unknown;
      for (const k of ["x", "y", "zoom"] as const) if (op[k] !== undefined && !isNum(op[k])) return unknown;
      const v = state.visions.find((x) => x.id === op.visionId);
      const e = byId.get(op.elementId);
      if (!v) return "That vision is not in the map.";
      if (!e) return missing;
      if (state.roles.unseen.includes(e.id)) return `${e.title} takes no vision.`;
      if (v.subjects.some((s) => s.elementId === e.id)) return `This vision is already set upon ${e.title}.`;
      v.subjects.push({ elementId: e.id, x: op.x ?? 0.5, y: op.y ?? 0.5, zoom: op.zoom ?? ZOOM.min });
      e.visions = op.primary ? [v.id, ...e.visions] : [...e.visions, v.id];
      return;
    }

    case "unassignVision": {
      if (!isStr(op.visionId) || !isStr(op.elementId)) return unknown;
      const v = state.visions.find((x) => x.id === op.visionId);
      const e = byId.get(op.elementId);
      if (!v || !e || !v.subjects.some((s) => s.elementId === e.id)) return "That vision is not set upon this element.";
      v.subjects = v.subjects.filter((s) => s.elementId !== e.id);
      e.visions = e.visions.filter((id) => id !== v.id);
      return;
    }

    case "setVisionSubject": {
      if (!isStr(op.visionId) || !isStr(op.elementId) || !isNum(op.x) || !isNum(op.y) || !isNum(op.zoom)) return unknown;
      const v = state.visions.find((x) => x.id === op.visionId);
      const s = v?.subjects.find((x) => x.elementId === op.elementId);
      if (!v || !s) return "That vision is not set upon this element.";
      s.x = op.x;
      s.y = op.y;
      s.zoom = op.zoom;
      return;
    }

    case "reorderWithinLayer": {
      if (!isStr(op.realm) || !isStrList(op.order)) return unknown;
      const members = state.elements.filter((e) => e.realm === op.realm);
      const title = realmTitle(state, op.realm);
      if (!members.length) return missing;
      const same = op.order.length === members.length && new Set(op.order).size === members.length && members.every((e) => op.order.includes(e.id));
      if (!same) return `The new order must hold every element of ${title}, each once.`;
      op.order.forEach((id, i) => (byId.get(id)!.order = i));
      if (state.rim?.realm === op.realm) deriveRing(state);
      return;
    }

    case "turn": {
      if (!isStr(op.condition)) return unknown;
      const c = state.conditions.find((x) => x.id === op.condition);
      if (!c) return "The map knows no such condition.";
      if (state.condition === c.id) return `The map already stands in ${c.title.toLowerCase()}.`;
      state.condition = c.id;
      state.sight.condition = c.id;
      for (const kind of state.elementKinds) {
        const b = kind.becomes;
        if (!b || b.on !== c.id) continue;
        const shedTies = new Set((kind.ties ?? []).map((t) => t.kind));
        const tieIds = new Set(state.ties.map((t) => t.id));
        for (const e of state.elements.filter((x) => x.kind === kind.id && !x.locked)) {
          const from = e.realm;
          state.threads = state.threads.filter((t) => t.from !== e.id && t.to !== e.id);
          state.ties = state.ties.filter((t) => !(t.from === e.id && shedTies.has(t.kind)));
          e.kind = b.kind;
          e.realm = b.realm;
          e.awaiting = true;
          delete e.parent;
          delete e.condition;
          e.order = state.elements.filter((x) => x.realm === b.realm && x.id !== e.id).length;
          const id = freshId(tieIds, `${b.tie}-${e.id}`);
          tieIds.add(id);
          state.ties.push({ id, kind: b.tie, from: e.id, to: b.to as Tie["to"], locked: false });
          compactOrder(state, from);
        }
      }
      return;
    }

    case "firstBinding": {
      if (!isStr(op.id)) return unknown;
      const e = byId.get(op.id);
      if (!e) return missing;
      if (!e.awaiting) return `${e.title} awaits no binding.`;
      delete e.awaiting;
      const kind = state.elementKinds.find((k) => k.id === e.kind);
      const tieIds = new Set(state.ties.map((t) => t.id));
      for (const req of kind?.ties ?? []) {
        if (state.ties.some((t) => t.kind === req.kind && t.from === e.id && t.to === req.to)) continue;
        const id = freshId(tieIds, `${req.kind}-${e.id}`);
        tieIds.add(id);
        state.ties.push({ id, kind: req.kind, from: e.id, to: req.to, locked: false });
      }
      deriveRing(state);
      return;
    }

    case "setEmphasis": {
      if (!isStr(op.id)) return unknown;
      const e = byId.get(op.id);
      if (!e) return missing;
      if (op.emphasis !== 0 && op.emphasis !== 1 && op.emphasis !== 2) return `The weight of ${e.title} must be quiet, as it is, or heightened.`;
      e.emphasis = op.emphasis;
      return;
    }

    case "setSight": {
      if (!isObj(op.sight)) return unknown;
      for (const [key, value] of Object.entries(op.sight)) {
        if (!SIGHT_KEYS.includes(key as keyof Sight)) return "The sight knows no such choice.";
        (state.sight as unknown as Record<string, unknown>)[key] = clone(value);
      }
      return;
    }

    case "addReading": {
      const n = op.reading as unknown;
      if (!isObj(n) || !isStr(n.id) || !isStr(n.title) || !isStr(n.text) || !isLights(n.lights)) return unknown;
      if (!SLUG.test(n.id)) return `${n.title}: its mark must be plain lowercase words joined by dashes.`;
      if (state.readings.some((r) => r.id === n.id)) return `${n.title}: another reading already bears this mark.`;
      const reading: Reading = { id: n.id, title: n.title, text: n.text, lights: lightsOf(n.lights), order: state.readings.length, locked: false };
      state.readings.push(reading);
      return;
    }

    case "removeReading": {
      if (!isStr(op.id)) return unknown;
      const r = state.readings.find((x) => x.id === op.id);
      if (!r) return missing;
      if (r.locked) return `The reading ${r.title} is canonical: it cannot be set aside.`;
      state.readings = state.readings.filter((x) => x.id !== r.id);
      state.readings.sort((a, b) => a.order - b.order).forEach((x, i) => (x.order = i));
      if (state.sight.reading === r.id) state.sight.reading = null;
      return;
    }

    case "setReadingLights": {
      if (!isStr(op.id) || !isLights(op.lights)) return unknown;
      const r = state.readings.find((x) => x.id === op.id);
      if (!r) return missing;
      if (r.locked) return `The reading ${r.title} is canonical: what it lights is sealed.`;
      r.lights = lightsOf(op.lights);
      return;
    }

    default:
      return unknown;
  }
}

function isLights(v: unknown): v is Reading["lights"] {
  return isObj(v) && isStrList(v.layers) && isStrList(v.threadKinds) && isStrList(v.elements);
}

/** Lights rebuilt from their three lists only. */
const lightsOf = (l: Reading["lights"]): Reading["lights"] => ({ layers: [...l.layers], threadKinds: [...l.threadKinds], elements: [...l.elements] });

const ALLOWED: Record<TextTarget["type"], TextField[]> = {
  element: ["explanation", "nature", "title", "purpose"],
  thread: ["explanation", "label", "purpose"],
  layer: ["explanation", "nature"],
  beyond: ["explanation", "nature"],
  kind: ["explanation"],
  condition: ["explanation"],
  lexicon: ["explanation"],
  threshold: ["explanation"],
  vision: ["title"],
  reading: ["title", "text"],
};

function setText(state: SanctumState, target: TextTarget, field: TextField, value: unknown): string | undefined {
  const allowed = ALLOWED[target.type];
  if (!allowed || !(field in FIELD_WORD)) return "The map does not know this change.";
  if (field === "nature" ? !isStrList(value) : !isStr(value)) return "The map does not know this change.";
  let holder: Record<string, unknown> | undefined;
  let title = "";
  let locked = false;
  switch (target.type) {
    case "element": {
      const e = state.elements.find((x) => x.id === target.id);
      if (e) [holder, title, locked] = [e as unknown as Record<string, unknown>, e.title, e.locked];
      break;
    }
    case "thread": {
      const t = state.threads.find((x) => x.id === target.id);
      if (t) [holder, title, locked] = [t as unknown as Record<string, unknown>, `the cord from ${endTitle(state, t.from)} to ${endTitle(state, t.to)}`, t.locked];
      break;
    }
    case "layer": {
      const l = state.layers.find((x) => x.id === target.id);
      if (l) [holder, title] = [l as unknown as Record<string, unknown>, l.title];
      break;
    }
    case "beyond":
      [holder, title] = [state.beyond as unknown as Record<string, unknown>, state.beyond.title];
      break;
    case "kind": {
      const k = state.threadKinds.find((x) => x.id === target.id);
      if (k) [holder, title] = [k as unknown as Record<string, unknown>, k.title];
      break;
    }
    case "condition": {
      const c = state.conditions.find((x) => x.id === target.id);
      if (c) [holder, title] = [c as unknown as Record<string, unknown>, c.title];
      break;
    }
    case "lexicon":
      [holder, title] = [state.lexicon as unknown as Record<string, unknown>, state.lexicon.title];
      break;
    case "threshold":
      [holder, title] = [state.threshold as unknown as Record<string, unknown>, state.threshold.title];
      break;
    case "vision": {
      const v = state.visions.find((x) => x.id === target.id);
      if (v) [holder, title] = [v as unknown as Record<string, unknown>, v.title];
      break;
    }
    case "reading": {
      const r = state.readings.find((x) => x.id === target.id);
      if (r) [holder, title] = [r as unknown as Record<string, unknown>, r.title];
      break;
    }
  }
  if (!holder) return "Nothing of that mark stands in the map.";
  if (!allowed.includes(field)) return `The ${FIELD_WORD[field]} of ${title} cannot be changed.`;
  if (locked && (field === "title" || field === "purpose" || field === "label")) {
    return field === "purpose" ? `${cap(title)} is canonical: its purpose is sealed.` : `${cap(title)} is canonical: its ${FIELD_WORD[field]} stays as it was given.`;
  }
  holder[field] = clone(value);
  return;
}

/* ---------- summary and diff ---------- */

function opSentence(before: SanctumState, after: SanctumState, op: Op): string {
  const t = (id: string) => endTitle(after, id, elementById(after)) || endTitle(before, id);
  const bt = (id: string) => endTitle(before, id);
  const kindTitle = (id: Id) => (after.threadKinds.find((k) => k.id === id)?.title ?? "").toLowerCase();
  switch (op.op) {
    case "setText": {
      const word = FIELD_WORD[op.field] ?? "words";
      const target =
        op.target.type === "element" ? bt(op.target.id ?? "")
        : op.target.type === "layer" ? realmTitle(before, op.target.id ?? "")
        : op.target.type === "beyond" ? before.beyond.title
        : op.target.type === "kind" ? before.threadKinds.find((k) => k.id === op.target.id)?.title ?? ""
        : op.target.type === "reading" ? before.readings.find((r) => r.id === op.target.id)?.title ?? ""
        : op.target.type === "vision" ? before.visions.find((v) => v.id === op.target.id)?.title ?? ""
        : op.target.type === "lexicon" ? before.lexicon.title
        : op.target.type === "threshold" ? before.threshold.title
        : op.target.type === "condition" ? before.conditions.find((c) => c.id === op.target.id)?.title ?? ""
        : "a cord";
      return `The ${word} of ${target} was rewritten.`;
    }
    case "addElement":
      return `${op.element.title} was set into ${realmTitle(after, op.element.realm)}.`;
    case "removeElement":
      return `${bt(op.id)} was drawn out of the map.`;
    case "addThread":
      return `A cord of ${kindTitle(op.thread.kind)} was bound from ${t(op.thread.from)} to ${t(op.thread.to)}.`;
    case "removeThread": {
      const th = before.threads.find((x) => x.id === op.id);
      return th ? `The cord of ${kindTitle(th.kind)} from ${bt(th.from)} to ${bt(th.to)} was unbound.` : "A cord was unbound.";
    }
    case "addVision":
      return `A vision was brought: ${op.title}.`;
    case "removeVision":
      return "A vision was set aside.";
    case "assignVision":
      return `A vision was set upon ${t(op.elementId)}.`;
    case "unassignVision":
      return `A vision was lifted from ${t(op.elementId)}.`;
    case "setVisionSubject":
      return `The gaze of a vision upon ${t(op.elementId)} was moved.`;
    case "reorderWithinLayer":
      return `The order within ${realmTitle(after, op.realm)} was changed.`;
    case "setEmphasis":
      return `The weight of ${t(op.id)} was changed.`;
    case "setSight":
      return "The sight was set anew.";
    case "addReading":
      return `A reading was added: ${op.reading.title}.`;
    case "removeReading":
      return `The reading ${before.readings.find((r) => r.id === op.id)?.title ?? ""} was set aside.`;
    case "setReadingLights":
      return `What the reading ${before.readings.find((r) => r.id === op.id)?.title ?? ""} lights was changed.`;
    case "turn":
      return before.conditions.find((c) => c.id === op.condition)?.turn ?? "The map was turned.";
    case "firstBinding":
      return (before.rim?.firstBinding ?? "{title} was bound.").replace("{title}", bt(op.id));
  }
}

export function summarize(before: SanctumState, after: SanctumState, ops: Op[]): string {
  const first = opSentence(before, after, ops[0]);
  const rest = ops.length - 1;
  const text = rest > 0 ? `${first.slice(0, -1)}, with ${numberWord(rest)} further change${rest === 1 ? "" : "s"}.` : first;
  return [...text].length > BUDGET.summary ? `${[...text].slice(0, BUDGET.summary - 1).join("").trimEnd()}…` : text;
}

function diffById<T extends { id: Id }>(a: T[], b: T[]) {
  const before = new Map(a.map((x) => [x.id, x]));
  const after = new Map(b.map((x) => [x.id, x]));
  return {
    added: b.filter((x) => !before.has(x.id)).map((x) => x.id),
    removed: a.filter((x) => !after.has(x.id)).map((x) => x.id),
    changed: b.filter((x) => before.has(x.id) && !stableEqual(before.get(x.id), x)).map((x) => x.id),
  };
}

export function diffStates(a: SanctumState, b: SanctumState): Diff {
  const ties = diffById(a.ties, b.ties);
  const passages: string[] = [];
  if (!stableEqual(a.threshold, b.threshold)) passages.push("threshold");
  if (!stableEqual(a.lexicon, b.lexicon)) passages.push("lexicon");
  if (!stableEqual(a.beyond, b.beyond)) passages.push(BEYOND);
  for (const l of b.layers) if (!stableEqual(a.layers.find((x) => x.id === l.id), l)) passages.push(`layer:${l.id}`);
  for (const k of b.threadKinds) if (!stableEqual(a.threadKinds.find((x) => x.id === k.id), k)) passages.push(`cord:${k.id}`);
  for (const c of b.conditions) if (!stableEqual(a.conditions.find((x) => x.id === c.id), c)) passages.push(`condition:${c.id}`);
  return {
    readings: diffById(a.readings, b.readings),
    elements: diffById(a.elements, b.elements),
    threads: diffById(a.threads, b.threads),
    ties: { added: ties.added, removed: ties.removed },
    visions: diffById(a.visions, b.visions),
    passages,
    sight: !stableEqual(a.sight, b.sight),
    condition: a.condition !== b.condition,
  };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
