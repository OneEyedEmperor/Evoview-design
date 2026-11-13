/* Affordances: what may be composed next, read from the rules the state
   carries and confirmed by the engine itself. Every choice comes back with
   `ok` and, when refused, the refusal in the map's tongue, so the console
   can offer only what holds and the sight can make the rest recoil.
   Pass the state being composed upon (a draft's previewState when ops are
   already pending). Content-free: no id is known here. */

import { applyOps } from "./ops.ts";
import { BUDGET, ZOOM, elementById, endTitle, isLayerRef, numberWord, realmTitle } from "./rules.ts";
import { BEYOND, type Element, type Id, type Op, type OpName, type Refusal, type SanctumState, type TextField, type TextTargetType, type ThreadEnd, type VisionFiles } from "./types.ts";
import { canonOf, expectedCondition, matchesElement, matchesEnd, threadKey, validate, type Canon } from "./validate.ts";

export interface Choice {
  value: string;
  title: string;
  ok: boolean;
  /** Why it cannot be chosen, in the map's tongue. */
  why?: string;
  /** For quarters: elements already standing in it. */
  count?: number;
}

export interface CordChoice {
  kind: Id;
  from: ThreadEnd;
  to: ThreadEnd;
  ok: boolean;
  why?: string;
}

export interface Room {
  used: number;
  /** Room already kept for what will come to rest here on a turn. */
  pending: number;
  capacity: number;
  free: number;
}

export type RoomOf = { realm: Id } | { elementKind: Id } | { cordKind: Id } | { readings: true };

const PROBE = { label: "A cord", purpose: "A cord." };

interface Ctx {
  state: SanctumState;
  canon: Canon;
  byId: Map<Id, Element>;
  layerIds: Set<Id>;
}

const ctxOf = (state: SanctumState): Ctx => ({ state, canon: canonOf(state), byId: elementById(state), layerIds: new Set(state.layers.map((l) => l.id)) });

function refusalsOf(ctx: Ctx, ops: Op[]): Refusal[] {
  const { state: next, refusals } = applyOps(ctx.state, ops);
  return refusals.length ? refusals : validate(next, ctx.canon);
}

const verdict = (refusals: Refusal[]) => (refusals.length ? { ok: false, why: refusals[0].message } : { ok: true });

/** Every end a cord may name: elements, then layers. */
function allEnds(state: SanctumState): ThreadEnd[] {
  return [...state.elements.map((e) => e.id), ...state.layers.map((l) => `layer:${l.id}` as ThreadEnd)];
}

/** Cheap grammar test before the full engine runs. */
function grammarWhy(ctx: Ctx, kindId: Id, from: ThreadEnd, to: ThreadEnd): string | undefined {
  const { state, byId, layerIds } = ctx;
  const kind = state.threadKinds.find((k) => k.id === kindId);
  if (!kind) return "No such kind of cord is named in the lexicon.";
  const title = (end: string) => endTitle(state, end, byId);
  if (from === to) return `A cord cannot run from ${title(from)} to itself.`;
  if (!kind.grammar.courses.some((c) => matchesEnd(from, c.from, byId, layerIds) && matchesEnd(to, c.to, byId, layerIds))) return kind.grammar.refusal;
  const kinds = new Map(state.threadKinds.map((k) => [k.id, k]));
  if (expectedCondition({ kind: kindId, from, to }, kinds, byId).conflict) return `${title(from)} and ${title(to)} never stand in the same condition.`;
  const key = threadKey({ kind: kindId, from, to }, kinds);
  if (state.threads.some((t) => threadKey(t, kinds) === key)) return "This cord is already bound.";
  const count = state.threads.filter((t) => t.kind === kindId).length;
  if (count >= kind.grammar.max) return `The map holds at most ${numberWord(kind.grammar.max)} cord${kind.grammar.max === 1 ? "" : "s"} of ${kind.title.toLowerCase()}.`;
  return undefined;
}

function cordChoice(ctx: Ctx, kind: Id, from: ThreadEnd, to: ThreadEnd): CordChoice {
  const why = grammarWhy(ctx, kind, from, to);
  if (why) return { kind, from, to, ok: false, why };
  const v = verdict(refusalsOf(ctx, [{ op: "addThread", thread: { kind, from, to, ...PROBE } }]));
  return { kind, from, to, ...v };
}

function endsFor(ctx: Ctx, kind: Id, from?: ThreadEnd): Choice[] {
  const { state, byId } = ctx;
  const ends = allEnds(state);
  if (from) {
    return ends.filter((to) => to !== from).map((to) => {
      const c = cordChoice(ctx, kind, from, to);
      return { value: to, title: endTitle(state, to, byId), ok: c.ok, ...(c.why ? { why: c.why } : {}) };
    });
  }
  const k = state.threadKinds.find((x) => x.id === kind);
  const kindTitle = k?.title.toLowerCase() ?? "";
  return ends.map((f) => {
    /* No course departs from here at all: the rule itself is the reason. */
    if (k && !k.grammar.courses.some((c) => matchesEnd(f, c.from, byId, ctx.layerIds))) {
      return { value: f, title: endTitle(state, f, byId), ok: false, why: k.grammar.refusal };
    }
    const ok = ends.some((to) => to !== f && !grammarWhy(ctx, kind, f, to) && cordChoice(ctx, kind, f, to).ok);
    return { value: f, title: endTitle(state, f, byId), ok, ...(ok ? {} : { why: `No cord of ${kindTitle} may depart from ${endTitle(state, f, byId)} now.` }) };
  });
}

/** Valid ends for a cord kind: departures when `from` is omitted, else destinations from `from`. */
export function cordEnds(state: SanctumState, kind: Id, from?: ThreadEnd): Choice[] {
  return endsFor(ctxOf(state), kind, from);
}

/** Every cord that could be bound touching `elementId` now, both ways, every kind. */
export function cordsFor(state: SanctumState, elementId: Id): CordChoice[] {
  const ctx = ctxOf(state);
  const out: CordChoice[] = [];
  for (const k of state.threadKinds) {
    for (const other of allEnds(state)) {
      if (other === elementId) continue;
      out.push(cordChoice(ctx, k.id, elementId, other));
      if (!isLayerRef(other)) out.push(cordChoice(ctx, k.id, other, elementId));
    }
  }
  return out;
}

/** Free sockets against capacity. */
export function room(state: SanctumState, of: RoomOf): Room {
  const make = (used: number, capacity: number, pending = 0): Room => ({ used, pending, capacity, free: Math.max(0, capacity - used - pending) });
  const pendingWhere = (match: (b: NonNullable<SanctumState["elementKinds"][number]["becomes"]>) => boolean) =>
    state.elementKinds.filter((k) => k.becomes && match(k.becomes)).reduce((n, k) => n + state.elements.filter((e) => e.kind === k.id && !e.locked).length, 0);
  if ("realm" in of) {
    const cap = of.realm === BEYOND ? state.beyond.capacity : state.layers.find((l) => l.id === of.realm)?.capacity ?? 0;
    return make(state.elements.filter((e) => e.realm === of.realm).length, cap, pendingWhere((b) => b.realm === of.realm));
  }
  if ("elementKind" in of) {
    return make(
      state.elements.filter((e) => e.kind === of.elementKind).length,
      state.elementKinds.find((k) => k.id === of.elementKind)?.capacity ?? 0,
      pendingWhere((b) => b.kind === of.elementKind),
    );
  }
  if ("cordKind" in of) {
    return make(state.threads.filter((t) => t.kind === of.cordKind).length, state.threadKinds.find((k) => k.id === of.cordKind)?.grammar.max ?? 0);
  }
  return make(state.readings.filter((r) => !r.locked).length, BUDGET.ownReadings);
}

/* ---------- slots of a sentence being composed ---------- */

export type PartialOp = { op: OpName } & Record<string, unknown>;

export interface Slots {
  op: OpName;
  /** Choices per slot; a slot appears once the slots it depends on are chosen. */
  slots: Record<string, Choice[]>;
  /** For a new element: the cords that would hold it (it needs one to be sealed). */
  cords?: CordChoice[];
  /** Letter budgets of the free-text slots. */
  budgets?: Record<string, number>;
  bounds?: { x: [number, number]; y: [number, number]; zoom: [number, number] };
}

const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);

const TEXT_FIELDS: Record<TextTargetType, TextField[]> = {
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

const TYPE_WORD: Record<TextTargetType, string> = {
  element: "element",
  thread: "cord",
  layer: "layer",
  beyond: "the realm beyond",
  kind: "kind of cord",
  condition: "condition",
  vision: "vision",
  lexicon: "the lexicon",
  threshold: "the threshold",
  reading: "reading",
};

const FIELD_WORD: Record<TextField, string> = {
  title: "title",
  purpose: "purpose",
  explanation: "explanation",
  nature: "nature",
  label: "function",
  text: "words",
};

const FIELD_BUDGET: Record<TextField, number> = {
  title: BUDGET.title,
  purpose: BUDGET.purpose,
  explanation: BUDGET.explanation,
  nature: BUDGET.natureLine,
  label: BUDGET.label,
  text: BUDGET.readingText,
};

/** Choices for each slot of `partial`, given the slots already filled. `brought`: visions brought, not yet in the map. */
export function slotsFor(state: SanctumState, partial: PartialOp, brought: Record<Id, VisionFiles> = {}): Slots {
  const ctx = ctxOf(state);
  const { byId } = ctx;
  const out: Slots = { op: partial.op, slots: {} };
  const el = (e: Element, refusals: Refusal[] = []): Choice => ({ value: e.id, title: e.title, ...verdict(refusals) });
  const realms = [...state.layers.map((l) => l.id), BEYOND];

  switch (partial.op) {
    case "addThread": {
      const kind = s(partial.kind);
      const from = s(partial.from);
      out.slots.kind = state.threadKinds.map((k) => {
        const r = room(state, { cordKind: k.id });
        if (!r.free) return { value: k.id, title: k.title, ok: false, why: `The map holds at most ${numberWord(r.capacity)} cord${r.capacity === 1 ? "" : "s"} of ${k.title.toLowerCase()}.` };
        const any = endsFor(ctx, k.id).some((c) => c.ok);
        return { value: k.id, title: k.title, ok: any, ...(any ? {} : { why: `No cord of ${k.title.toLowerCase()} can be bound now.` }) };
      });
      if (kind) out.slots.from = endsFor(ctx, kind);
      if (kind && from) out.slots.to = endsFor(ctx, kind, from as ThreadEnd);
      out.budgets = { label: BUDGET.label, purpose: BUDGET.purpose, explanation: BUDGET.explanation };
      break;
    }

    case "addElement": {
      const kindId = s(partial.kind);
      const realm = s(partial.realm);
      const parentId = s(partial.parent);
      const condition = s(partial.condition);
      out.slots.kind = state.elementKinds.map((k) => {
        if (!k.addable) return { value: k.id, title: k.title, ok: false, why: `No ${k.title.toLowerCase()} may be added to the map.` };
        if (k.raisedIn && k.raisedIn.condition !== state.condition) return { value: k.id, title: k.title, ok: false, why: k.raisedIn.refusal };
        if (k.becomes && (!room(state, { realm: k.becomes.realm }).free || !room(state, { elementKind: k.becomes.kind }).free)) return { value: k.id, title: k.title, ok: false, why: k.becomes.refusal };
        const r = room(state, { elementKind: k.id });
        return { value: k.id, title: k.title, ok: r.free > 0, ...(r.free ? {} : { why: `The map holds at most ${numberWord(r.capacity)} of the kind ${k.title.toLowerCase()}.` }) };
      });
      const kind = state.elementKinds.find((k) => k.id === kindId);
      if (!kind) break;
      if (kind.quarter || kind.becomes) {
        out.slots.quarter = [...state.quarters]
          .sort((a, b) => a.order - b.order)
          .map((q) => ({ value: q.id, title: q.title, ok: true, count: state.elements.filter((e) => e.quarter === q.id && e.kind === (kind.becomes?.kind ?? kind.id)).length }));
      }
      if (kind.parent) {
        out.slots.parent = state.elements.map((e) =>
          matchesElement(e, kind.parent!.select, ctx.layerIds) ? el(e) : { value: e.id, title: e.title, ok: false, why: `Nothing of this kind may belong to ${e.title}.` },
        );
      }
      if (kind.conditional) out.slots.condition = state.conditions.map((c) => ({ value: c.id, title: c.title, ok: true }));
      const parent = parentId ? byId.get(parentId) : undefined;
      out.slots.realm = realms.map((id) => {
        const title = realmTitle(state, id);
        const fits = kind.realms.some(
          (r) => (!r.condition || r.condition === condition) && (r.realms?.includes(id) || (r.inLayers && ctx.layerIds.has(id)) || (r.parentRealm && parent?.realm === id)),
        );
        if (!fits) return { value: id, title, ok: false, why: `A ${kind.title.toLowerCase()} cannot stand in ${title}.` };
        const r = room(state, { realm: id });
        return { value: id, title, ok: r.free > 0, ...(r.free ? {} : { why: `${title} holds at most ${numberWord(r.capacity)}.` }) };
      });
      out.budgets = { title: BUDGET.title, purpose: BUDGET.purpose, explanation: BUDGET.explanation, nature: BUDGET.natureLine, natureLines: BUDGET.natureLines };
      const quarter = s(partial.quarter);
      if (realm && (!kind.parent || parent)) {
        const id = "composing-element";
        const { state: virtual } = applyOps(state, [
          {
            op: "addElement",
            element: { id, title: "A new element", kind: kind.id, realm, ...(parent ? { parent: parent.id } : {}), ...(condition ? { condition } : {}), ...(quarter ? { quarter } : {}), purpose: "A new element." },
          },
        ]);
        out.cords = cordsFor(virtual, id);
      }
      break;
    }

    case "turn":
      out.slots.condition = state.conditions.map((c) =>
        c.id === state.condition ? { value: c.id, title: c.title, ok: false, why: `The map already stands in ${c.title.toLowerCase()}.` } : { value: c.id, title: c.title, ok: true },
      );
      break;

    case "firstBinding":
      out.slots.id = state.elements.filter((e) => e.awaiting).map((e) => el(e, refusalsOf(ctx, [{ op: "firstBinding", id: e.id }])));
      break;

    case "removeElement":
      out.slots.id = state.elements.map((e) =>
        e.locked ? { value: e.id, title: e.title, ok: false, why: `${e.title} is canonical: it cannot be drawn out of the map.` } : el(e, refusalsOf(ctx, [{ op: "removeElement", id: e.id }])),
      );
      break;

    case "removeThread":
      out.slots.id = state.threads.map((t) => {
        const title = `${endTitle(state, t.from, byId)} → ${endTitle(state, t.to, byId)}`;
        if (t.irreversible || t.locked) return { value: t.id, title, ok: false, why: t.irreversible ? "This cord is irreversible: it can never be unbound." : "This cord is canonical: it cannot be unbound." };
        return { value: t.id, title, ...verdict(refusalsOf(ctx, [{ op: "removeThread", id: t.id }])) };
      });
      break;

    case "setText": {
      const target = (partial.target ?? {}) as { type?: TextTargetType; id?: string };
      out.slots.type = (Object.keys(TEXT_FIELDS) as TextTargetType[]).map((t) => ({ value: t, title: TYPE_WORD[t], ok: true }));
      if (!target.type) break;
      const ids: Choice[] =
        target.type === "element" ? state.elements.map((e) => el(e))
        : target.type === "thread" ? state.threads.map((t) => ({ value: t.id, title: `${endTitle(state, t.from, byId)} → ${endTitle(state, t.to, byId)}`, ok: true }))
        : target.type === "layer" ? state.layers.map((l) => ({ value: l.id, title: l.title, ok: true }))
        : target.type === "kind" ? state.threadKinds.map((k) => ({ value: k.id, title: k.title, ok: true }))
        : target.type === "condition" ? state.conditions.map((c) => ({ value: c.id, title: c.title, ok: true }))
        : target.type === "vision" ? state.visions.map((v) => ({ value: v.id, title: v.title, ok: true }))
        : target.type === "reading" ? state.readings.map((r) => ({ value: r.id, title: r.title, ok: true }))
        : [];
      if (ids.length) out.slots.id = ids;
      const needsId = ids.length > 0;
      if (needsId && !target.id) break;
      const locked =
        target.type === "element" ? byId.get(target.id ?? "")?.locked
        : target.type === "thread" ? state.threads.find((t) => t.id === target.id)?.locked
        : false;
      out.slots.field = TEXT_FIELDS[target.type].map((f) => {
        const sealed = locked && (f === "title" || f === "purpose" || f === "label");
        return { value: f, title: FIELD_WORD[f], ok: !sealed, ...(sealed ? { why: f === "purpose" ? "A canonical purpose is sealed." : `A canonical ${FIELD_WORD[f]} stays as it was given.` } : {}) };
      });
      out.budgets = Object.fromEntries(TEXT_FIELDS[target.type].map((f) => [f, target.type === "reading" && f === "title" ? BUDGET.readingTitle : target.type === "vision" && f === "title" ? BUDGET.visionTitle : FIELD_BUDGET[f]]));
      break;
    }

    case "addVision":
      out.slots.visionId = Object.values(brought).map((f) => ({ value: f.id, title: f.id, ...(state.visions.some((v) => v.id === f.id) ? { ok: false, why: "That vision is already in the map." } : { ok: true }) }));
      out.budgets = { title: BUDGET.visionTitle };
      break;

    case "removeVision":
      out.slots.visionId = state.visions.map((v) => {
        const held = v.subjects[0] && byId.get(v.subjects[0].elementId);
        return { value: v.id, title: v.title, ok: !held, ...(held ? { why: `This vision is still set upon ${held.title}.` } : {}) };
      });
      break;

    case "assignVision":
    case "unassignVision":
    case "setVisionSubject": {
      const visionId = s(partial.visionId);
      out.slots.visionId = state.visions.map((v) => ({ value: v.id, title: v.title, ok: true }));
      const v = state.visions.find((x) => x.id === visionId);
      if (v) {
        out.slots.elementId = state.elements.map((e) => {
          const held = v.subjects.some((x) => x.elementId === e.id);
          if (partial.op !== "assignVision") return { value: e.id, title: e.title, ok: held, ...(held ? {} : { why: "That vision is not set upon this element." }) };
          if (state.roles.unseen.includes(e.id)) return { value: e.id, title: e.title, ok: false, why: `${e.title} takes no vision.` };
          return { value: e.id, title: e.title, ok: !held, ...(held ? { why: `This vision is already set upon ${e.title}.` } : {}) };
        });
      }
      if (partial.op !== "unassignVision") out.bounds = { x: [0, 1], y: [0, 1], zoom: [ZOOM.min, ZOOM.max] };
      break;
    }

    case "reorderWithinLayer":
      out.slots.realm = realms.map((id) => {
        const n = state.elements.filter((e) => e.realm === id).length;
        return { value: id, title: realmTitle(state, id), ok: n > 1, ...(n > 1 ? {} : { why: "There is nothing to reorder here." }) };
      });
      break;

    case "setEmphasis":
      out.slots.id = state.elements.map((e) => el(e));
      out.slots.emphasis = [
        { value: "0", title: "quiet", ok: true },
        { value: "1", title: "as it is", ok: true },
        { value: "2", title: "heightened", ok: true },
      ];
      break;

    case "setSight":
      out.slots.layers = realms.map((id) => ({ value: id, title: realmTitle(state, id), ok: true }));
      out.slots.kinds = state.threadKinds.map((k) => ({ value: k.id, title: k.title, ok: true }));
      out.slots.condition = state.conditions.map((c) => ({ value: c.id, title: c.title, ok: true }));
      out.slots.reading = state.readings.map((r) => ({ value: r.id, title: r.title, ok: true }));
      break;

    case "addReading":
    case "setReadingLights":
    case "removeReading": {
      const r = room(state, { readings: true });
      if (partial.op === "addReading" && !r.free) out.slots.room = [{ value: "readings", title: "readings", ok: false, why: `Beside the canonical readings, the map holds at most ${numberWord(r.capacity)} of your own.` }];
      if (partial.op !== "addReading") {
        out.slots.id = state.readings.map((x) => ({ value: x.id, title: x.title, ok: !x.locked, ...(x.locked ? { why: `The reading ${x.title} is canonical.` } : {}) }));
      }
      if (partial.op !== "removeReading") {
        out.slots.layers = realms.map((id) => ({ value: id, title: realmTitle(state, id), ok: true }));
        out.slots.threadKinds = state.threadKinds.map((k) => ({ value: k.id, title: k.title, ok: true }));
        out.slots.elements = state.elements.map((e) => el(e));
        out.budgets = { title: BUDGET.readingTitle, text: BUDGET.readingText };
      }
      break;
    }
  }
  return out;
}
