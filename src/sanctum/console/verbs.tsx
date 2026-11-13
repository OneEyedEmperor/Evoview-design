/* The verbs of the lectern. Each composes one sentence from the slots the
   engine allows (slotsFor) and hands its ops to the console, which writes
   the draft. Nothing here knows a map id or word: every name is read from
   the state. */

import { useEffect, useMemo, useRef, useState } from "react";
import { checkLocally, markFrom, ops as op, rimOrder, room, slotsFor, type Choice, type DraftSubject, type SanctumStore, type Verdict } from "../data";
import { BUDGET, endTitle, isQuiet } from "../model/rules";
import { BEYOND, type Id, type Op, type Reading, type SanctumState, type TextField, type TextTargetType, type ThreadEnd, type VisionFiles } from "../model/types";
import { SurfaceFill } from "../motion";
import { patchDraft } from "./draft";
import { Field, Lines, Many, Sentence, Sockets, type Part } from "./Sentence";
import { aOrAn, lower, realmName, titleOf } from "./voice";

export interface Fix {
  label: string;
  run: () => void;
}

export interface Composed {
  ops: Op[] | null;
  /** What the sentence still lacks, in words ("a kind of cord"). */
  waiting?: string;
  fixes?: Fix[];
  /** What the change brings with it, in words (shown under the verdict). */
  brings?: string[];
}

export interface VerbProps {
  store: SanctumStore;
  state: SanctumState;
  brought: Record<Id, VisionFiles>;
  subject: DraftSubject | null;
  verdict: Verdict;
  previewState: SanctumState | null;
  compose: (c: Composed) => void;
}

const ok = (choices: Choice[] | undefined) => (choices ?? []).filter((c) => c.ok);
const has = (choices: Choice[] | undefined, v: string | undefined) => Boolean(v && choices?.some((c) => c.value === v && c.ok));
const kindTitle = (state: SanctumState, id: Id) => state.threadKinds.find((k) => k.id === id)?.title ?? "";

/** Hands the composition up whenever its ops (or words) change. */
function useCompose(compose: VerbProps["compose"], c: Composed, deps: unknown[]) {
  const last = useRef("");
  useEffect(() => {
    const key = JSON.stringify([c.ops, c.waiting, c.brings, c.fixes?.map((f) => f.label)]);
    if (key === last.current) return;
    last.current = key;
    compose(c);
  }, deps);
}

/** Neighbours an element would stand between on the rim, in a would-be state. */
function rimNeighbours(state: SanctumState | null, id: Id): [Id, Id] | null {
  if (!state) return null;
  const order = rimOrder(state).map((e) => e.id);
  const i = order.indexOf(id);
  if (i < 0 || order.length < 3) return null;
  return [order[(i - 1 + order.length) % order.length], order[(i + 1) % order.length]];
}

/** Which slot a refusal points at, so a fix can open it. */
function failingSlot(verdict: Verdict, map: Record<string, string>): string | null {
  for (const r of verdict.refusals) {
    const key = map[r.rule];
    if (key) return key;
  }
  return null;
}

/* ---------- raise an element ---------- */

export function Raise({ store, state, subject, verdict, previewState, compose }: VerbProps) {
  const [kind, setKind] = useState("");
  const [quarter, setQuarter] = useState("");
  const [realm, setRealm] = useState("");
  const [parent, setParent] = useState(subject?.type === "element" ? subject.id ?? "" : "");
  const [condition, setCondition] = useState("");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [hold, setHold] = useState("");
  const [label, setLabel] = useState("");
  const [turnFirst, setTurnFirst] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const turnOp = turnFirst ? [op.turn(turnFirst)] : [];
  const base = useMemo(() => (turnFirst ? checkLocally(state, turnOp).state : state), [state, turnFirst]);
  const slots = useMemo(() => slotsFor(base, { op: "addElement", kind, realm, parent, condition, quarter }), [base, kind, realm, parent, condition, quarter]);
  const k = base.elementKinds.find((x) => x.id === kind);

  /* A slot with a single open answer answers itself. */
  const realmChoice = has(slots.slots.realm, realm) ? realm : ok(slots.slots.realm).length === 1 ? ok(slots.slots.realm)[0].value : "";
  const parentChoice = !slots.slots.parent ? "" : has(slots.slots.parent, parent) ? parent : ok(slots.slots.parent).length === 1 ? ok(slots.slots.parent)[0].value : "";
  const id = markFrom(title || "new", base.elements.map((e) => e.id));

  /* Does it need a cord to hold it? (A quartered stone is held by the ring.) */
  const element = k && realmChoice && title.trim() && purpose.trim()
    ? { id, title: title.trim(), kind, realm: realmChoice, ...(parentChoice ? { parent: parentChoice } : {}), ...(condition ? { condition } : {}), ...(quarter ? { quarter } : {}), purpose: purpose.trim() }
    : null;
  const elementKey = JSON.stringify(element);
  const alone = useMemo(() => (element ? checkLocally(base, [op.addElement(element)]).refusals.some((r) => r.rule === "no-dead-space" || r.rule === "reach") : false), [base, elementKey]);
  const cords = (slots.cords ?? []).filter((c) => c.ok);
  const holdChoices: Choice[] = cords.map((c, i) => {
    const other = c.from === "composing-element" ? c.to : c.from;
    const dir = c.from === "composing-element" ? "to" : "from";
    return { value: String(i), title: `a cord of ${lower(kindTitle(base, c.kind))} ${dir} ${endTitle(base, other)}`, ok: true };
  });
  const chosenHold = alone && holdChoices.some((h) => h.value === hold) ? cords[Number(hold)] : null;

  let waiting: string | undefined;
  if (!kind) waiting = "a kind to raise";
  else if (slots.slots.quarter && !quarter) waiting = "a quarter";
  else if (!realmChoice) waiting = "a realm";
  else if (slots.slots.parent && !parentChoice) waiting = "what it belongs to";
  else if (slots.slots.condition && !condition) waiting = "a condition";
  else if (!title.trim()) waiting = "a name";
  else if (!purpose.trim()) waiting = "its purpose";
  else if (alone && !chosenHold) waiting = "a cord to hold it";
  else if (alone && !label.trim()) waiting = "the function of its cord";

  const ops: Op[] | null = waiting || !element
    ? null
    : [
        ...turnOp,
        op.addElement(element),
        ...(chosenHold
          ? [op.addThread({ kind: chosenHold.kind, from: chosenHold.from === "composing-element" ? id : chosenHold.from, to: chosenHold.to === "composing-element" ? id : chosenHold.to, label: label.trim(), purpose: base.threadKinds.find((x) => x.id === chosenHold.kind)?.purpose ?? "" })]
          : []),
      ];

  const neighbours = quarter && k && base.rim?.stoneKind === kind ? rimNeighbours(previewState, id) : null;

  /* Fixes: a kind raised only in another condition may be raised after the turn. */
  const fixes: Fix[] = [];
  const turnable = state.elementKinds.find((x) => x.raisedIn && x.raisedIn.condition !== state.condition && x.addable);
  const turnWords = turnable && state.conditions.find((c) => c.id === turnable.raisedIn!.condition)?.turn;
  if (!turnFirst && !kind && turnable && turnWords) fixes.push({ label: `To raise ${aOrAn(lower(turnable.title))}, first: ${lower(turnWords.replace(/\.$/, ""))}`, run: () => setTurnFirst(turnable.raisedIn!.condition) });
  if (turnFirst && !kind) fixes.push({ label: "Without the turn", run: () => setTurnFirst("") });
  const failing = failingSlot(verdict, { "no-dead-space": "hold", reach: "hold", capacity: "kind", "kind-realm": "realm" });
  if (failing && verdict.state === "refused") fixes.push({ label: failing === "hold" ? "Choose a cord to hold it" : "Choose again", run: () => setOpenKey(failing) });

  useCompose(compose, { ops, waiting, fixes }, [JSON.stringify(ops), waiting, turnFirst, verdict.state, failing]);

  const kindRoom = k ? room(base, { elementKind: kind }) : null;
  const realmRoom = realmChoice ? room(base, { realm: realmChoice }) : null;
  const turnSentence = turnFirst ? state.conditions.find((c) => c.id === turnFirst)?.turn : "";

  const parts: Part[] = [
    turnSentence ? `First, ${lower(turnSentence.replace(/\.$/, ""))}. Then raise ` : "Raise ",
    { slot: "choice", key: "kind", placeholder: "a kind", value: kind, choices: slots.slots.kind ?? [], onChoose: (v) => { setKind(v); setQuarter(""); setRealm(""); setHold(""); } },
    slots.slots.quarter && " into the quarter of ",
    slots.slots.quarter && { slot: "choice", key: "quarter", placeholder: "a direction", value: quarter, choices: slots.slots.quarter, onChoose: setQuarter },
    kind && (ok(slots.slots.realm).length > 1 ? " in " : realmChoice ? " in " : ""),
    kind && (ok(slots.slots.realm).length > 1
      ? { slot: "choice", key: "realm", placeholder: "a realm", value: realmChoice, choices: slots.slots.realm ?? [], onChoose: setRealm }
      : realmChoice ? { slot: "name", title: realmName(base, realmChoice), end: realmChoice === BEYOND ? undefined : (`layer:${realmChoice}` as ThreadEnd) } : ""),
    slots.slots.parent && ", belonging to ",
    slots.slots.parent && { slot: "choice", key: "parent", placeholder: "what it belongs to", value: parentChoice, choices: slots.slots.parent, onChoose: setParent, onEye: true },
    slots.slots.condition && ", in ",
    slots.slots.condition && { slot: "choice", key: "condition", placeholder: "a condition", value: condition, choices: slots.slots.condition, onChoose: setCondition },
    kind && ", named ",
    kind && { slot: "text", key: "title", placeholder: "its name", value: title, budget: BUDGET.title, onChange: setTitle, label: "Its name" },
    kind && ".",
    neighbours && " It falls between ",
    neighbours && { slot: "name", title: titleOf(previewState!, neighbours[0]), end: neighbours[0] },
    neighbours && " and ",
    neighbours && { slot: "name", title: titleOf(previewState!, neighbours[1]), end: neighbours[1] },
    neighbours && ", and the ring binds it to both.",
    alone && " Hold it by ",
    alone && { slot: "choice", key: "hold", placeholder: "a cord", value: chosenHold ? hold : "", choices: holdChoices, onChoose: setHold },
    alone && chosenHold && ", whose function is ",
    alone && chosenHold && { slot: "text", key: "label", placeholder: "its function", value: label, budget: BUDGET.label, onChange: setLabel, label: "The function of its cord" },
    alone && chosenHold && ".",
  ];

  return (
    <>
      <Sentence store={store} parts={parts} openKey={openKey} onOpened={() => setOpenKey(null)} />
      {kind && <Field label="Its purpose, in one sentence" value={purpose} budget={BUDGET.purpose} onChange={setPurpose} rows={2} />}
      {(kindRoom || realmRoom) && (
        <div className="sanctum-console__room">
          {realmRoom && realmChoice && (
            <RoomLine label={`Room in ${realmName(base, realmChoice)}`} used={realmRoom.used} capacity={realmRoom.capacity} pending={realmRoom.pending} ghost={element ? 1 : 0} />
          )}
          {slots.slots.quarter && (
            <div className="sanctum-console__quarters">
              {slots.slots.quarter.map((q) => (
                <span key={q.value} className={`sanctum-console__quarter${q.value === quarter ? " is-chosen" : ""}`}>
                  <span className="sx-small">{q.title}</span>
                  <Sockets used={q.count ?? 0} ghost={q.value === quarter && element ? 1 : 0} />
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function RoomLine({ label, used, capacity, pending = 0, ghost = 0 }: { label: string; used: number; capacity: number; pending?: number; ghost?: number }) {
  return (
    <div className="sanctum-console__roomline">
      <span className="sx-small">{label}</span>
      <Sockets used={used} capacity={capacity} pending={pending} ghost={ghost} />
    </div>
  );
}

/* ---------- lay a cord ---------- */

export function LayCord({ store, state, subject, verdict, compose }: VerbProps) {
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState(subject?.type === "element" ? subject.id ?? "" : "");
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");
  const [purpose, setPurpose] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const slots = useMemo(() => slotsFor(state, { op: "addThread", kind }), [state, kind]);
  const fromOk = has(slots.slots.from, from) ? from : "";
  const toSlots = useMemo(() => (fromOk ? slotsFor(state, { op: "addThread", kind, from: fromOk }).slots.to : undefined), [state, kind, fromOk]);
  const toOk = has(toSlots, to) ? to : "";
  const k = state.threadKinds.find((x) => x.id === kind);

  let waiting: string | undefined;
  if (!kind) waiting = "a kind of cord";
  else if (!fromOk) waiting = "where it departs";
  else if (!toOk) waiting = "where it arrives";
  else if (!label.trim()) waiting = "its function";

  const ops = waiting || !k ? null : [op.addThread({ kind, from: fromOk as ThreadEnd, to: toOk as ThreadEnd, label: label.trim(), purpose: purpose.trim() || k.purpose })];
  const failing = failingSlot(verdict, { grammar: "to", "no-dead-space": "to", capacity: "kind", condition: "to" });
  const fixes: Fix[] = failing && verdict.state === "refused" ? [{ label: "Choose another end", run: () => setOpenKey(failing) }] : [];
  useCompose(compose, { ops, waiting, fixes }, [JSON.stringify(ops), waiting, verdict.state, failing]);

  const parts: Part[] = [
    "Lay a cord of ",
    { slot: "choice", key: "kind", placeholder: "a kind", value: kind, choices: slots.slots.kind ?? [], onChoose: (v) => { setKind(v); setTo(""); } },
    kind && " from ",
    kind && { slot: "choice", key: "from", placeholder: "its departure", value: fromOk, choices: slots.slots.from ?? [], onChoose: (v) => { setFrom(v); setTo(""); }, onEye: true },
    fromOk && " to ",
    fromOk && { slot: "choice", key: "to", placeholder: "its arrival", value: toOk, choices: toSlots ?? [], onChoose: setTo, onEye: true },
    toOk && ", whose function is ",
    toOk && { slot: "text", key: "label", placeholder: "its function", value: label, budget: BUDGET.label, onChange: setLabel, label: "Its function" },
    toOk && ".",
  ];
  const cordRoom = k ? room(state, { cordKind: kind }) : null;
  return (
    <>
      <Sentence store={store} parts={parts} openKey={openKey} onOpened={() => setOpenKey(null)} />
      {toOk && k && <Field label="Its purpose, in one sentence" value={purpose} budget={BUDGET.purpose} onChange={setPurpose} rows={2} hint={`Left empty, it takes the purpose of its kind: ${k.purpose}`} />}
      {cordRoom && cordRoom.capacity < 16 && <div className="sanctum-console__room"><RoomLine label={`Room for cords of ${lower(k!.title)}`} used={cordRoom.used} capacity={cordRoom.capacity} ghost={ops ? 1 : 0} /></div>}
    </>
  );
}

/* ---------- draw back ---------- */

type DrawWhat = "removeThread" | "removeElement" | "removeReading" | "removeVision";

export function DrawBack({ store, state, subject, previewState, compose }: VerbProps) {
  const [what, setWhat] = useState<DrawWhat | "">(subject?.type === "element" ? "removeElement" : subject?.type === "thread" ? "removeThread" : "");
  const [id, setId] = useState(subject?.id ?? "");
  const kinds: Choice[] = [
    { value: "removeThread", title: "a cord", ok: true },
    { value: "removeElement", title: "an element", ok: true },
    { value: "removeReading", title: "a reading", ok: true },
    { value: "removeVision", title: "a vision", ok: true },
  ];
  const slots = useMemo(() => (what ? slotsFor(state, { op: what }) : null), [state, what]);
  const idOk = has(slots?.slots.id, id) ? id : "";
  const waiting = !what ? "what to draw back" : !idOk ? "which one" : undefined;
  const ops = waiting || !what ? null : [what === "removeThread" ? op.removeThread(idOk) : what === "removeElement" ? op.removeElement(idOk) : what === "removeReading" ? op.removeReading(idOk) : op.removeVision(idOk)];

  /* What goes with it. The weave is never shown unravelling: only named. */
  const brings: string[] = [];
  if (ops && previewState && what === "removeElement") {
    const gone = state.threads.filter((t) => !previewState.threads.some((x) => x.id === t.id));
    for (const t of gone) brings.push(`The cord of ${lower(kindTitle(state, t.kind))} from ${endTitle(state, t.from)} to ${endTitle(state, t.to)} goes with it.`);
  }
  useCompose(compose, { ops, waiting, brings }, [JSON.stringify(ops), waiting, brings.join("|")]);

  const verbWord = what === "removeThread" ? "Unbind " : what === "removeElement" ? "Draw " : what ? "Set aside " : "Draw back ";
  const parts: Part[] = [
    verbWord,
    { slot: "choice", key: "what", placeholder: "what", value: what, choices: kinds, onChoose: (v) => { setWhat(v as DrawWhat); setId(""); } },
    what && " ",
    what && { slot: "choice", key: "id", placeholder: "which one", value: idOk, choices: slots?.slots.id ?? [], onChoose: setId, onEye: what === "removeElement" },
    what === "removeElement" ? " out of the map." : what ? "." : "",
  ];
  return <Sentence store={store} parts={parts} />;
}

/* ---------- rewrite words ---------- */

function currentText(state: SanctumState, type: TextTargetType, id: string, field: TextField): string | string[] {
  const holder: Record<string, unknown> | undefined =
    type === "element" ? (state.elements.find((x) => x.id === id) as unknown as Record<string, unknown>)
    : type === "thread" ? (state.threads.find((x) => x.id === id) as unknown as Record<string, unknown>)
    : type === "layer" ? (state.layers.find((x) => x.id === id) as unknown as Record<string, unknown>)
    : type === "beyond" ? (state.beyond as unknown as Record<string, unknown>)
    : type === "kind" ? (state.threadKinds.find((x) => x.id === id) as unknown as Record<string, unknown>)
    : type === "condition" ? (state.conditions.find((x) => x.id === id) as unknown as Record<string, unknown>)
    : type === "vision" ? (state.visions.find((x) => x.id === id) as unknown as Record<string, unknown>)
    : type === "reading" ? (state.readings.find((x) => x.id === id) as unknown as Record<string, unknown>)
    : type === "lexicon" ? (state.lexicon as unknown as Record<string, unknown>)
    : (state.threshold as unknown as Record<string, unknown>);
  const v = holder?.[field];
  return field === "nature" ? (Array.isArray(v) ? (v as string[]) : []) : typeof v === "string" ? v : "";
}

export function Rewrite({ store, state, subject, compose }: VerbProps) {
  const subjType = subject?.type === "element" ? "element" : subject?.type === "thread" ? "thread" : subject?.type === "layer" ? "layer" : subject?.type === "reading" ? "reading" : subject?.type === "vision" ? "vision" : "";
  const [type, setType] = useState<TextTargetType | "">(subjType);
  const [id, setId] = useState(subject?.id ?? "");
  const [field, setField] = useState<TextField | "">("");
  const [value, setValue] = useState<string | string[]>("");

  const slots = useMemo(() => (type ? slotsFor(state, { op: "setText", target: { type, ...(id ? { id } : {}) } }) : slotsFor(state, { op: "setText" })), [state, type, id]);
  const needsId = Boolean(slots.slots.id);
  const idOk = needsId ? (has(slots.slots.id, id) ? id : "") : "";
  const fieldOk = has(slots.slots.field, field) ? field : "";

  const choose = (f: TextField) => {
    setField(f);
    if (type) setValue(currentText(state, type, idOk, f));
  };
  useEffect(() => {
    if (type && fieldOk) setValue(currentText(state, type, idOk, fieldOk));
  }, [type, idOk]);

  const before = type && fieldOk ? currentText(state, type, idOk, fieldOk) : "";
  const changed = JSON.stringify(before) !== JSON.stringify(value);
  let waiting: string | undefined;
  if (!type) waiting = "what to rewrite";
  else if (needsId && !idOk) waiting = "which one";
  else if (!fieldOk) waiting = "which words";
  else if (!changed) waiting = "new words";
  const cleaned = Array.isArray(value) ? value.map((l) => l.trim()).filter(Boolean) : value.trim();
  const ops = waiting || !type || !fieldOk ? null : [op.setText({ type, ...(idOk ? { id: idOk } : {}) }, fieldOk, cleaned)];
  useCompose(compose, { ops, waiting }, [JSON.stringify(ops), waiting]);

  const budget = slots.budgets?.[fieldOk] ?? BUDGET.explanation;
  const parts: Part[] = [
    "Rewrite the ",
    type && needsId && !idOk ? "words" : { slot: "choice", key: "field", placeholder: "words", value: fieldOk, choices: slots.slots.field ?? [{ value: "", title: "words", ok: false, why: "Choose first whose words." }], onChoose: (v) => choose(v as TextField) },
    " of ",
    { slot: "choice", key: "type", placeholder: "a part of the map", value: type, choices: slots.slots.type ?? [], onChoose: (v) => { setType(v as TextTargetType); setId(""); setField(""); } },
    needsId && " ",
    needsId && { slot: "choice", key: "id", placeholder: "which one", value: idOk, choices: slots.slots.id ?? [], onChoose: (v) => { setId(v); setField(""); }, onEye: type === "element" },
    ".",
  ];
  const fieldWord = slots.slots.field?.find((f) => f.value === fieldOk)?.title ?? "words";
  return (
    <>
      <Sentence store={store} parts={parts} />
      {fieldOk && (fieldOk === "nature"
        ? <Lines label="Its nature, line by line" lines={Array.isArray(value) ? value : []} budget={BUDGET.natureLine} max={BUDGET.natureLines} onChange={setValue} />
        : <Field label={`The ${fieldWord}`} value={typeof value === "string" ? value : ""} budget={budget} onChange={setValue} rows={fieldOk === "explanation" || fieldOk === "text" ? 7 : 2} />)}
    </>
  );
}

/* ---------- order and weight ---------- */

export function Order({ store, state, subject, compose }: VerbProps) {
  const subjectEl = subject?.type === "element" ? state.elements.find((e) => e.id === subject.id) : undefined;
  const [mode, setMode] = useState<"order" | "weight">("order");
  const [realm, setRealm] = useState(subjectEl?.realm ?? "");
  const [order, setOrder] = useState<Id[]>([]);
  const [id, setId] = useState(subjectEl?.id ?? "");
  const [weight, setWeight] = useState("");

  const orderSlots = useMemo(() => slotsFor(state, { op: "reorderWithinLayer" }), [state]);
  const weightSlots = useMemo(() => slotsFor(state, { op: "setEmphasis" }), [state]);
  const realmOk = has(orderSlots.slots.realm, realm) ? realm : "";
  const members = useMemo(() => state.elements.filter((e) => e.realm === realmOk).sort((a, b) => a.order - b.order).map((e) => e.id), [state, realmOk]);
  useEffect(() => setOrder(members), [members.join("|")]);
  const el = state.elements.find((e) => e.id === id);

  let ops: Op[] | null = null;
  let waiting: string | undefined;
  if (mode === "order") {
    if (!realmOk) waiting = "a realm";
    else if (order.join("|") === members.join("|")) waiting = "a new order";
    else ops = [op.reorderWithinLayer(realmOk, order)];
  } else {
    if (!el) waiting = "an element";
    else if (!weight || Number(weight) === el.emphasis) waiting = "a new weight";
    else ops = [op.setEmphasis(el.id, Number(weight) as 0 | 1 | 2)];
  }
  useCompose(compose, { ops, waiting }, [JSON.stringify(ops), waiting, mode]);

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };
  const modeChoices: Choice[] = [{ value: "order", title: "Set the order", ok: true }, { value: "weight", title: "Set the weight", ok: true }];
  const parts: Part[] =
    mode === "order"
      ? [{ slot: "choice", key: "mode", placeholder: "", value: mode, choices: modeChoices, onChoose: (v) => setMode(v as "order") }, " of ", { slot: "choice", key: "realm", placeholder: "a realm", value: realmOk, choices: orderSlots.slots.realm ?? [], onChoose: setRealm }, realmOk ? ", from first to last:" : "."]
      : [
          { slot: "choice", key: "mode", placeholder: "", value: mode, choices: modeChoices, onChoose: (v) => setMode(v as "weight") },
          " of ",
          { slot: "choice", key: "id", placeholder: "an element", value: el?.id ?? "", choices: weightSlots.slots.id ?? [], onChoose: (v) => { setId(v); setWeight(""); }, onEye: true },
          el && ": let it stand ",
          el && { slot: "choice", key: "weight", placeholder: "how", value: weight || String(el.emphasis), choices: weightSlots.slots.emphasis ?? [], onChoose: setWeight },
          el && ".",
        ];
  return (
    <>
      <Sentence store={store} parts={parts} />
      {mode === "order" && realmOk && (
        <ol className="sx-tiles sanctum-console__order" aria-label={`The order of ${realmName(state, realmOk)}`}>
          {order.map((eid, i) => (
            <li key={eid} className="sx-tile">
              <span className="sanctum-console__choice-title" onPointerEnter={() => patchDraft(store, { hover: eid })} onPointerLeave={() => patchDraft(store, { hover: null })}>
                {titleOf(state, eid)}
              </span>
              <span className="sanctum-console__order-moves">
                <button type="button" className="sanctum-console__move" aria-label={`${titleOf(state, eid)}, earlier`} disabled={i === 0} data-jelly="" onClick={() => move(i, -1)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 9l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" className="sanctum-console__move" aria-label={`${titleOf(state, eid)}, later`} disabled={i === order.length - 1} data-jelly="" onClick={() => move(i, 1)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/* ---------- readings ---------- */

const EMPTY_LIGHTS: Reading["lights"] = { layers: [], threadKinds: [], elements: [] };

export function Readings({ store, state, subject, compose }: VerbProps) {
  const own = state.readings.filter((r) => !r.locked);
  const subjectReading = subject?.type === "reading" ? state.readings.find((r) => r.id === subject.id && !r.locked) : undefined;
  const [mode, setMode] = useState<"addReading" | "setReadingLights">(subjectReading ? "setReadingLights" : "addReading");
  const [id, setId] = useState(subjectReading?.id ?? "");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [lights, setLights] = useState<Reading["lights"]>(EMPTY_LIGHTS);

  const slots = useMemo(() => slotsFor(state, { op: mode, id }), [state, mode, id]);
  const reading = state.readings.find((r) => r.id === id);
  useEffect(() => {
    if (mode === "setReadingLights" && reading) setLights(reading.lights);
    if (mode === "addReading") setLights(EMPTY_LIGHTS);
  }, [mode, id]);
  const r = room(state, { readings: true });
  const lit = lights.layers.length + lights.threadKinds.length + lights.elements.length > 0;

  let waiting: string | undefined;
  let ops: Op[] | null = null;
  if (mode === "addReading") {
    if (!r.free) waiting = "room for another reading";
    else if (!title.trim()) waiting = "a title";
    else if (!lit) waiting = "what it lights";
    else if (!text.trim()) waiting = "its words";
    else ops = [op.addReading({ id: markFrom(title, state.readings.map((x) => x.id)), title: title.trim(), text: text.trim(), lights })];
  } else {
    if (!reading || reading.locked) waiting = "one of the map's own readings";
    else if (JSON.stringify(reading.lights) === JSON.stringify(lights)) waiting = "a change in what it lights";
    else ops = [op.setReadingLights(reading.id, lights)];
  }
  useCompose(compose, { ops, waiting }, [JSON.stringify(ops), waiting]);

  const modeChoices: Choice[] = [
    { value: "addReading", title: "Add a reading", ok: r.free > 0, ...(r.free ? {} : { why: slots.slots.room?.[0]?.why ?? "There is no room for another reading." }) },
    { value: "setReadingLights", title: "Change what a reading lights", ok: own.length > 0, ...(own.length ? {} : { why: "Every reading of the map is canonical: what they light is sealed." }) },
  ];
  const parts: Part[] =
    mode === "addReading"
      ? [{ slot: "choice", key: "mode", placeholder: "", value: mode, choices: modeChoices, onChoose: (v) => setMode(v as "addReading") }, " named ", { slot: "text", key: "title", placeholder: "its title", value: title, budget: BUDGET.readingTitle, onChange: setTitle, label: "Its title" }, ", which lights what is chosen below."]
      : [{ slot: "choice", key: "mode", placeholder: "", value: mode, choices: modeChoices, onChoose: (v) => setMode(v as "setReadingLights") }, ": ", { slot: "choice", key: "id", placeholder: "which reading", value: id, choices: slots.slots.id ?? [], onChoose: setId }, "."];
  const showLights = mode === "addReading" || (reading && !reading.locked);
  return (
    <>
      <Sentence store={store} parts={parts} />
      {showLights && (
        <>
          <Many label="It lights these layers" choices={slots.slots.layers ?? []} chosen={lights.layers} onChange={(v) => setLights({ ...lights, layers: v })} />
          <Many label="These cords" choices={slots.slots.threadKinds ?? []} chosen={lights.threadKinds} onChange={(v) => setLights({ ...lights, threadKinds: v })} />
          <Many label="These elements" choices={slots.slots.elements ?? []} chosen={lights.elements} onChange={(v) => setLights({ ...lights, elements: v })} />
        </>
      )}
      {mode === "addReading" && <Field label="Its words" value={text} budget={BUDGET.readingText} onChange={setText} rows={4} />}
      <div className="sanctum-console__room"><RoomLine label="Room beside the canonical readings" used={r.used} capacity={r.capacity} ghost={mode === "addReading" && ops ? 1 : 0} /></div>
    </>
  );
}

/* ---------- the sight at rest ---------- */

export function SightAtRest({ store, state, compose }: VerbProps) {
  const [layers, setLayers] = useState(state.sight.layers);
  const [kinds, setKinds] = useState(state.sight.kinds);
  const [reading, setReading] = useState(state.sight.reading ?? "");
  const [explanations, setExplanations] = useState(state.sight.explanations);
  const [flow, setFlow] = useState(state.sight.flow);
  const slots = useMemo(() => slotsFor(state, { op: "setSight" }), [state]);

  const patch: Record<string, unknown> = {};
  if (JSON.stringify([...layers].sort()) !== JSON.stringify([...state.sight.layers].sort())) patch.layers = layers;
  if (JSON.stringify([...kinds].sort()) !== JSON.stringify([...state.sight.kinds].sort())) patch.kinds = kinds;
  if ((reading || null) !== state.sight.reading) patch.reading = reading || null;
  if (explanations !== state.sight.explanations) patch.explanations = explanations;
  if (flow !== state.sight.flow) patch.flow = flow;
  const changed = Object.keys(patch).length > 0;
  const ops = changed ? [op.setSight(patch)] : null;
  useCompose(compose, { ops, waiting: changed ? undefined : "a change in the sight" }, [JSON.stringify(ops)]);

  const readingChoices: Choice[] = [{ value: "", title: "no reading", ok: true }, ...(slots.slots.reading ?? [])];
  return (
    <>
      <Sentence
        store={store}
        parts={[
          "At rest, the sight shows ",
          { slot: "choice", key: "reading", placeholder: "no reading", value: reading, choices: readingChoices, onChoose: setReading },
          ", and lights the layers and cords chosen below. Veiled ones only dim.",
        ]}
      />
      <Many label="Lit layers" choices={slots.slots.layers ?? []} chosen={layers} onChange={setLayers} />
      <Many label="Lit cords" choices={slots.slots.kinds ?? []} chosen={kinds} onChange={setKinds} />
      <div className="sx-tiles">
        <Switch label="Explanations shown" on={explanations} onChange={setExplanations} />
        <Switch label="Signs travel along the cords" on={flow} onChange={setFlow} />
      </div>
    </>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="sx-tile sanctum-console__switchrow" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="sanctum-console__choice-title">{label}</span>
      <span className="sx-switch" aria-checked={on} data-jelly="">
        <SurfaceFill on={on} lit="var(--sx-ivory)" />
        <span className="sx-switch__knob" />
      </span>
    </button>
  );
}

/* ---------- the turner's office ---------- */

export function Turn({ store, state, previewState, compose }: VerbProps) {
  const slots = useMemo(() => slotsFor(state, { op: "turn" }), [state]);
  const open = ok(slots.slots.condition);
  const [condition, setCondition] = useState(open.length === 1 ? open[0].value : "");
  const target = state.conditions.find((c) => c.id === condition);
  const ops = target ? [op.turn(target.id)] : null;

  /* The consequence, foreseen: what comes to rest, what falls quiet, what wakes. */
  const brings: string[] = [];
  if (ops && previewState) {
    for (const after of previewState.elements) {
      const before = state.elements.find((e) => e.id === after.id);
      if (!before || (before.realm === after.realm && before.kind === after.kind)) continue;
      const kt = previewState.elementKinds.find((k) => k.id === after.kind)?.title ?? "";
      brings.push(`${after.title} comes to rest in ${realmName(previewState, after.realm)} as ${aOrAn(lower(kt))}${after.awaiting ? ", awaiting its binding" : ""}.`);
    }
    for (const t of state.threads) {
      const was = isQuiet(state, t, state.condition);
      const after = previewState.threads.find((x) => x.id === t.id);
      if (!after) continue;
      const will = isQuiet(previewState, after, previewState.condition);
      if (was === will) continue;
      brings.push(`The cord of ${lower(kindTitle(state, t.kind))} from ${endTitle(state, t.from)} to ${endTitle(state, t.to)} ${will ? "falls quiet" : "wakes"}.`);
    }
  }
  useCompose(compose, { ops, waiting: target ? undefined : "a condition to turn into", brings }, [JSON.stringify(ops), brings.join("|")]);

  const now = state.conditions.find((c) => c.id === state.condition);
  return (
    <>
      <p className="sx-small">The map stands sealed in {lower(now?.title ?? "")}.</p>
      {open.length > 1 && (
        <Sentence store={store} parts={["Turn the map into ", { slot: "choice", key: "condition", placeholder: "a condition", value: condition, choices: slots.slots.condition ?? [], onChoose: setCondition }, "."]} />
      )}
      {target && <p className="sanctum-console__office">{target.turn}</p>}
    </>
  );
}

/* ---------- the first binding of an awaiting element ---------- */

export function Bind({ store, state, subject, previewState, compose }: VerbProps) {
  const slots = useMemo(() => slotsFor(state, { op: "firstBinding" }), [state]);
  const choices = slots.slots.id ?? [];
  const [id, setId] = useState(subject?.type === "element" && choices.some((c) => c.value === subject.id) ? subject.id ?? "" : ok(choices).length === 1 ? ok(choices)[0].value : "");
  const idOk = has(choices, id) ? id : "";
  const ops = idOk ? [op.firstBinding(idOk)] : null;
  const neighbours = idOk ? rimNeighbours(previewState, idOk) : null;
  useCompose(compose, { ops, waiting: choices.length ? (idOk ? undefined : "what is to be bound") : "something awaiting its binding" }, [JSON.stringify(ops)]);
  if (!choices.length) return <p className="sx-body">Nothing awaits its binding.</p>;
  return (
    <Sentence
      store={store}
      parts={[
        "Bind ",
        { slot: "choice", key: "id", placeholder: "what awaits", value: idOk, choices, onChoose: setId, onEye: true },
        " into the ring",
        neighbours ? " between " : ".",
        neighbours && { slot: "name", title: titleOf(previewState!, neighbours[0]), end: neighbours[0] },
        neighbours && " and ",
        neighbours && { slot: "name", title: titleOf(previewState!, neighbours[1]), end: neighbours[1] },
        neighbours && ".",
      ]}
    />
  );
}
