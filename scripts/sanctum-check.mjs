#!/usr/bin/env node
/* Sanctum checks. Content-free: subjects are drawn from the private state at
   run time; map-specific cases live in <data>/seed/checks.json (private).

   node scripts/sanctum-check.mjs [--build] [--live=http://127.0.0.1:37511] [--verbose]

   1. engine     every invariant refuses what it must and accepts what it must
   2. endpoints  a throwaway copy of the data dir behind a local server:
                 entry, backoff, cookies, writes, seal, record, restore, visions
   3. live       the running server gives nothing without entry
   4. content    no map words, colours, pictures or watchword in the repo,
                 the branch history or dist/ */

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSanctumStore } from "../src/sanctum/data/store.ts";
import { cordsFor, room, slotsFor } from "../src/sanctum/model/affordances.ts";
import { applyOps, summarize } from "../src/sanctum/model/ops.ts";
import { BUDGET, clone, isQuiet, pairKey, rimOrder, ringPairs } from "../src/sanctum/model/rules.ts";
import { BEYOND } from "../src/sanctum/model/types.ts";
import { canonOf, validate } from "../src/sanctum/model/validate.ts";
import { hashWatchword, signEntry } from "../server/sanctum/auth.ts";
import { createSanctumHandler } from "../server/sanctum/http.ts";
import { Store, dataDir, readJson } from "../server/sanctum/store.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const VERBOSE = Boolean(flag("verbose"));
const LIVE = (flag("live")?.split("=")[1]) ?? "http://127.0.0.1:37511";
const DIR = dataDir();

let passed = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    if (VERBOSE) console.log(`  ok  ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const section = (title) => console.log(`\n${title}`);

/* ---------------------------------------------------------------- engine */

const store = new Store(DIR);
const base = store.current();
const canon = store.canon();

function run(ops, state = base, files = {}) {
  const { state: next, refusals } = applyOps(state, ops, { visionFiles: (id) => files[id] });
  return refusals.length ? { next, refusals } : { next, refusals: validate(next, canon) };
}
const rules = (r) => [...new Set(r.refusals.map((x) => x.rule))];
const refusedBy = (name, ops, rule, state) => {
  const r = run(ops, state);
  check(`${name} → refused (${rule})`, r.refusals.some((x) => x.rule === rule), `got ${rules(r).join(",") || "accepted"}`);
  return r;
};
const accepted = (name, ops, state, files) => {
  const r = run(ops, state, files);
  check(`${name} → accepted`, r.refusals.length === 0, r.refusals.map((x) => `${x.rule}: ${x.message}`).slice(0, 3).join(" | "));
  return r;
};

section("1. engine");

check("current state passes every invariant", validate(base, canon).length === 0, validate(base, canon).map((r) => r.message).join(" | "));
{
  const ids = (c) => JSON.stringify(["elements", "threads", "ties", "readings"].map((k) => c[k].map((x) => x.id).sort()));
  check("the canon holds exactly the locked parts of the current state", ids(canonOf(base)) === ids(canon));
}

const byId = new Map(base.elements.map((e) => [e.id, e]));
const layerIds = new Set(base.layers.map((l) => l.id));
const locked = base.elements.filter((e) => e.locked);
const lockedThread = base.threads.find((t) => t.locked && !t.irreversible);
const irreversible = base.threads.find((t) => t.irreversible);
const someLayer = base.layers[0];
const stamp = (n) => `check-${crypto.randomBytes(3).toString("hex")}-${n}`;

/* fixed tables */
refusedBy("a layer's title through setText", [{ op: "setText", target: { type: "layer", id: someLayer.id }, field: "title", value: "Another" }], "op");
{
  const s = clone(base);
  s.layers.pop();
  check("a layer removed → refused (fixed)", validate(s, canon).some((r) => r.rule === "fixed"));
  const t = clone(base);
  t.layers.reverse();
  check("layers reordered → refused (fixed)", validate(t, canon).some((r) => r.rule === "fixed"));
  const u = clone(base);
  u.threadKinds.push({ ...clone(u.threadKinds[0]), id: "another" });
  check("a cord kind added → refused (fixed)", validate(u, canon).some((r) => r.rule === "fixed"));
  const v = clone(base);
  v.threadKinds[0].grammar.max += 1;
  check("a grammar loosened → refused (fixed)", validate(v, canon).some((r) => r.rule === "fixed"));
  const w = clone(base);
  w.roles.unseen = [];
  check("roles changed → refused (fixed)", validate(w, canon).some((r) => r.rule === "fixed"));
}
accepted("a layer's explanation", [{ op: "setText", target: { type: "layer", id: someLayer.id }, field: "explanation", value: "Seen anew from the rim." }]);
accepted("a cord kind's explanation", [{ op: "setText", target: { type: "kind", id: base.threadKinds[0].id }, field: "explanation", value: "Seen anew from the rim." }]);

/* canonical */
refusedBy("removing a canonical element", [{ op: "removeElement", id: locked[0].id }], "op");
refusedBy("retitling a canonical element", [{ op: "setText", target: { type: "element", id: locked[0].id }, field: "title", value: "Another" }], "op");
refusedBy("rewriting a canonical purpose", [{ op: "setText", target: { type: "element", id: locked[0].id }, field: "purpose", value: "Another purpose." }], "op");
refusedBy("unbinding a canonical cord", [{ op: "removeThread", id: lockedThread.id }], "op");
refusedBy("unbinding an irreversible cord", [{ op: "removeThread", id: irreversible.id }], "op");
refusedBy("relabelling a canonical cord", [{ op: "setText", target: { type: "thread", id: lockedThread.id }, field: "label", value: "Another" }], "op");
accepted("a canonical element's explanation", [{ op: "setText", target: { type: "element", id: locked[0].id }, field: "explanation", value: "Seen anew from the rim." }]);
accepted("a canonical element's nature", [{ op: "setText", target: { type: "element", id: locked[0].id }, field: "nature", value: ["Seen anew.", "Held fast."] }]);
{
  const s = clone(base);
  s.elements.find((e) => e.locked).title = "Another";
  check("a canonical title changed in the state → refused (canonical)", validate(s, canon).some((r) => r.rule === "canonical"));
  const t = clone(base);
  t.threads = t.threads.filter((x) => x.id !== lockedThread.id);
  check("a canonical cord missing from the state → refused (canonical)", validate(t, canon).some((r) => r.rule === "canonical"));
  const u = clone(base);
  u.ties.pop();
  check("a canonical tie missing from the state → refused (canonical)", validate(u, canon).some((r) => r.rule === "canonical"));
}

/* grammar sweep: every kind × every ordered pair of ends, against an oracle */
const selElement = (e, sel) =>
  (!sel.ids || sel.ids.includes(e.id)) &&
  (!sel.kinds || sel.kinds.includes(e.kind)) &&
  (!sel.realms || sel.realms.includes(e.realm)) &&
  (!sel.inLayers || layerIds.has(e.realm)) &&
  (!sel.condition || e.condition === sel.condition) &&
  !(sel.not ?? []).includes(e.id);
const selEnd = (end, sel) => (end.startsWith("layer:") ? Boolean(sel.layers?.includes(end.slice(6))) : Boolean(sel.element && selElement(byId.get(end), sel.element)));
const ends = [...base.elements.map((e) => e.id), ...base.layers.map((l) => `layer:${l.id}`)];
let sweptRefused = 0;
let sweptAdmitted = 0;
let sweepWrong = 0;
for (const kind of base.threadKinds) {
  for (const from of ends) {
    for (const to of ends) {
      if (from === to || from.startsWith("layer:")) continue;
      const admitted = kind.grammar.courses.some((c) => selEnd(from, c.from) && selEnd(to, c.to));
      const r = run([{ op: "addThread", thread: { kind: kind.id, from, to, label: "Probe", purpose: "A probe of the grammar." } }]);
      const courseRefused = r.refusals.some((x) => x.rule === "grammar" && x.message.includes("refuses the course"));
      if (admitted === courseRefused) sweepWrong++;
      if (admitted) sweptAdmitted++;
      else sweptRefused++;
    }
  }
}
check(`grammar sweep: ${sweptRefused} courses refused, ${sweptAdmitted} admitted, each as the grammar says`, sweepWrong === 0, `${sweepWrong} disagreements`);
refusedBy("a cord from an element to itself", [{ op: "addThread", thread: { kind: base.threadKinds[0].id, from: locked[0].id, to: locked[0].id, label: "Probe", purpose: "A probe." } }], "grammar");
refusedBy("a cord toward nothing", [{ op: "addThread", thread: { kind: base.threadKinds[0].id, from: locked[0].id, to: "nowhere-at-all", label: "Probe", purpose: "A probe." } }], "grammar");
refusedBy("a kind of cord the lexicon does not name", [{ op: "addThread", thread: { kind: "nameless", from: locked[0].id, to: locked[1].id, label: "Probe", purpose: "A probe." } }], "op");
for (const kind of base.threadKinds) {
  const count = base.threads.filter((t) => t.kind === kind.id).length;
  const sample = base.threads.find((t) => t.kind === kind.id);
  if (count >= kind.grammar.max && sample) {
    const twin = { kind: kind.id, from: sample.from, to: sample.to, label: "Probe", purpose: "A probe." };
    refusedBy(`a cord beyond the most of its kind (${kind.grammar.max === 1 ? "single" : "full"} kind)`, [{ op: "addThread", thread: twin }], "grammar");
  }
}
{
  const s = clone(base);
  const t = s.threads.find((x) => !x.condition && !s.threadKinds.find((k) => k.id === x.kind).grammar.condition);
  t.condition = s.conditions[0].id;
  check("a cord carrying a condition the map does not give it → refused (grammar)", validate(s, canon).some((r) => r.rule === "grammar"));
  const u = clone(base);
  const both = u.threads.find((x) => x.bidirectional);
  if (both) {
    both.bidirectional = false;
    check("a both-ways cord made one-way → refused", validate(u, canon).some((r) => r.rule === "grammar" || r.rule === "canonical"));
  }
}

/* kind and realm, for every addable kind in every realm */
const realms = [...base.layers.map((l) => l.id), BEYOND];
let realmWrong = 0;
let realmCases = 0;
for (const kind of base.elementKinds.filter((k) => k.addable)) {
  const parent = kind.parent ? base.elements.find((e) => selElement(e, kind.parent.select)) : undefined;
  for (const realm of realms) {
    const id = stamp(`${kind.id}-${realm}`);
    const expected = kind.realms.some((r) => !r.condition && (r.realms?.includes(realm) || (r.inLayers && layerIds.has(realm)) || (r.parentRealm && parent?.realm === realm)));
    const pre = kind.raisedIn && kind.raisedIn.condition !== base.condition ? [{ op: "turn", condition: kind.raisedIn.condition }] : [];
    const quarter = kind.quarter ? { quarter: base.quarters[0].id } : {};
    const r = run([...pre, { op: "addElement", element: { id, title: "Probe", kind: kind.id, realm, purpose: "A probe of the realms.", ...quarter, ...(parent ? { parent: parent.id } : {}) } }]);
    const realmRefused = r.refusals.some((x) => x.rule === "kind-realm" && x.message.includes("cannot stand in"));
    realmCases++;
    if (expected === realmRefused) realmWrong++;
  }
}
check(`kind ↔ realm: ${realmCases} placements, each as the rules say`, realmWrong === 0, `${realmWrong} disagreements`);
const unaddable = base.elementKinds.find((k) => !k.addable);
if (unaddable) refusedBy("adding an element of a kind that cannot be added", [{ op: "addElement", element: { id: stamp("x"), title: "Probe", kind: unaddable.id, realm: BEYOND, purpose: "A probe." } }], "op");
const parented = base.elementKinds.find((k) => k.addable && k.parent);
if (parented) {
  const wrongParent = base.elements.find((e) => !selElement(e, parented.parent.select));
  const realm = parented.realms.find((r) => r.realms)?.realms[0];
  refusedBy("an element belonging to the wrong parent", [{ op: "addElement", element: { id: stamp("p"), title: "Probe", kind: parented.id, realm, parent: wrongParent.id, purpose: "A probe." } }], "kind-realm");
}

/* no dead space and reach */
const free = base.elementKinds.find((k) => k.addable && !k.parent && k.realms.some((r) => r.inLayers));
const freeRealm = base.layers.find((l) => base.elements.filter((e) => e.realm === l.id).length < l.capacity);
if (free && freeRealm) {
  const id = stamp("lone");
  refusedBy("an element with no cord", [{ op: "addElement", element: { id, title: "Probe", kind: free.id, realm: freeRealm.id, purpose: "A probe." } }], "no-dead-space");
  /* only an incoming cord: touched, but it reaches nothing */
  const add = { op: "addElement", element: { id, title: "Probe", kind: free.id, realm: freeRealm.id, purpose: "A probe." } };
  const inbound = base.threadKinds.flatMap((k) =>
    k.directed && !k.grammar.bidirectional
      ? base.elements.filter((src) => src.id !== id && k.grammar.courses.some((c) => selEnd(src.id, c.from) && c.to.element && !c.to.element.ids && !c.to.element.kinds)).map((src) => ({ k, src }))
      : [],
  )[0];
  if (inbound) {
    refusedBy("an element held only by a cord into it", [add, { op: "addThread", thread: { kind: inbound.k.id, from: inbound.src.id, to: id, label: "Probe", purpose: "A probe." } }], "reach");
  }
  const outbound = base.threadKinds.find((k) => k.grammar.courses.some((c) => c.to.element?.ids?.includes(base.roles.core) && (!c.from.element?.ids || c.from.element.ids.length === 0)));
  if (outbound) accepted("a new element whose cord reaches the core", [add, { op: "addThread", thread: { kind: outbound.id, from: id, to: base.roles.core, label: "Probe", purpose: "A probe of the reach." } }]);
}

/* capacity: fill the tightest realm one past its measure */
{
  const kind = base.elementKinds.find((k) => k.addable && k.realms.some((r) => r.realms && !r.condition));
  const realm = kind.realms.find((r) => r.realms).realms[0];
  const measure = realm === BEYOND ? base.beyond.capacity : base.layers.find((l) => l.id === realm).capacity;
  const have = base.elements.filter((e) => e.realm === realm).length;
  const parent = kind.parent ? base.elements.find((e) => selElement(e, kind.parent.select)) : undefined;
  const ops = Array.from({ length: Math.min(measure - have + 1, BUDGET.ops) }, (_, i) => ({ op: "addElement", element: { id: stamp(`cap-${i}`), title: "Probe", kind: kind.id, realm, purpose: "A probe.", ...(parent ? { parent: parent.id } : {}) } }));
  refusedBy("a realm filled past its measure", ops, "capacity");
}

/* the rim: a derived ring, one crossing per quarter */
if (base.rim) {
  const rim = base.rim;
  const q0 = base.quarters[0];
  const raise = (id, quarter = q0.id) => ({ op: "addElement", element: { id, title: "Probe", kind: rim.stoneKind, realm: rim.realm, quarter, purpose: "A probe of the rim." } });
  const id = stamp("rim");
  const r = run([raise(id)]);
  const arcs = (s) => new Set(s.threads.filter((t) => t.kind === rim.ringKind).map((t) => pairKey(t.from, t.to)));
  const ringHolds = (s) => ringPairs(s).every(([a, b]) => arcs(s).has(pairKey(a, b)));
  check("raising a stone in a quarter re-derives the ring through it", r.refusals.length === 0 && ringHolds(r.next) && ringPairs(r.next).some(([a, b]) => a === id || b === id), r.refusals.map((x) => x.message).join(" | "));
  check("the raised stone takes no crossing of its own", r.next.threads.filter((t) => t.kind === rim.crossingKind && t.from === id).length === 0);
  const order = rimOrder(base).map((e) => e.id);
  if (order.length >= 4) refusedBy("a binding between stones that are not rim neighbours", [{ op: "addThread", thread: { kind: rim.ringKind, from: order[0], to: order[2], label: "Probe", purpose: "A probe." } }], "rim");
  const arc = base.threads.find((t) => t.kind === rim.ringKind && !t.locked && byId.get(t.from)?.kind === rim.stoneKind && byId.get(t.to)?.kind === rim.stoneKind);
  if (arc) refusedBy("an arc of the ring unbound", [{ op: "removeThread", id: arc.id }], "rim");
  const crossing = base.threads.find((t) => t.kind === rim.crossingKind);
  if (crossing) refusedBy("a quarter with two crossings", [raise(id), { op: "addThread", thread: { kind: rim.crossingKind, from: id, to: crossing.to, label: "Probe", purpose: "A probe." } }], "rim");
  refusedBy("a stone with no quarter", [{ op: "addElement", element: { id, title: "Probe", kind: rim.stoneKind, realm: rim.realm, purpose: "A probe." } }], "kind-realm");
  const loose = clone(base);
  const station = loose.elements.find((e) => e.station);
  if (station) {
    station.station = undefined;
    check("a canonical station moved → refused (canonical)", validate(loose, canon).some((x) => x.rule === "canonical"));
  }
}

/* the sealed condition and its turn */
const other = base.conditions.find((c) => c.id !== base.condition);
if (other) {
  const t = accepted("a turn into the other condition", [{ op: "turn", condition: other.id }]);
  check("the turn seals the condition and the record speaks its words", t.next.condition === other.id && summarize(base, t.next, [{ op: "turn", condition: other.id }]) === other.turn);
  refusedBy("a turn into the condition already sealed", [{ op: "turn", condition: base.condition }], "op");
  const quiet = base.threads.filter((x) => x.condition && x.condition !== base.condition);
  check("cords of the other condition are quiet, the rest never", quiet.every((x) => isQuiet(base, x)) && base.threads.filter((x) => !x.condition).every((x) => !isQuiet(base, x)));
}

/* what is taken in one condition comes to rest in the other */
const taker = base.elementKinds.find((k) => k.becomes && k.raisedIn && k.addable);
if (taker && base.rim) {
  const into = taker.raisedIn.condition;
  const pre = into !== base.condition ? [{ op: "turn", condition: into }] : [];
  const realm = taker.realms.find((r) => r.realms)?.realms[0];
  const id = stamp("taken");
  const add = { op: "addElement", element: { id, title: "Probe", kind: taker.id, realm, quarter: base.quarters[1 % base.quarters.length].id, purpose: "A probe of what is taken." } };
  if (pre.length) refusedBy("an element raised outside its condition", [add], "op");
  const { state: virtual } = applyOps(base, [...pre, add]);
  const hold = cordsFor(virtual, id).find((c) => c.ok);
  check("a cord can hold what is taken", Boolean(hold));
  if (hold) {
    const bind = { op: "addThread", thread: { kind: hold.kind, from: hold.from, to: hold.to, label: "Probe", purpose: "A probe." } };
    accepted("an element taken in its condition", [...pre, add, bind]);
    const unquartered = { ...add, element: { ...add.element, quarter: undefined } };
    refusedBy("an element taken without its bearing", [...pre, unquartered, bind], "kind-realm");
    const rest = [...pre, add, bind, { op: "turn", condition: taker.becomes.on }];
    const r = accepted("what was taken comes to rest on the turn", rest);
    const rested = r.next.elements.find((e) => e.id === id);
    check("…as an awaiting element of the new kind, held by its tie, outside the ring", rested?.awaiting === true && rested.kind === taker.becomes.kind && r.next.ties.some((t) => t.from === id && t.kind === taker.becomes.tie) && !ringPairs(r.next).flat().includes(id));
    const homeward = base.threadKinds.find((k) => k.grammar.courses.some((c) => c.to.element?.ids?.includes(base.roles.core)));
    if (homeward) refusedBy("an awaiting element touched by a cord", [...rest, { op: "addThread", thread: { kind: homeward.id, from: id, to: base.roles.core, label: "Probe", purpose: "A probe." } }], "rim");
    const b = accepted("the first binding joins it to the ring", [...rest, { op: "firstBinding", id }]);
    check("…and the ring runs through it", ringPairs(b.next).flat().includes(id) && ringPairs(b.next).every(([x, y]) => b.next.threads.some((t) => t.kind === base.rim.ringKind && pairKey(t.from, t.to) === pairKey(x, y))));
    refusedBy("a binding of what awaits nothing", [{ op: "firstBinding", id: locked[0].id }], "op");
    const realmCap = base.layers.find((l) => l.id === taker.becomes.realm)?.capacity ?? 0;
    const free = realmCap - base.elements.filter((e) => e.realm === taker.becomes.realm).length;
    const fill = Array.from({ length: free }, (_, i) => ({ op: "addElement", element: { id: stamp(`fill-${i}`), title: "Probe", kind: base.rim.stoneKind, realm: base.rim.realm, quarter: base.quarters[i % base.quarters.length].id, purpose: "A probe." } }));
    if (fill.length + 3 <= BUDGET.ops) refusedBy("taking while the rim has no room for it", [...fill, ...pre, add, bind], "capacity");
  }
}

/* affordances: every choice offered agrees with the engine */
{
  let disagreements = 0;
  let judged = 0;
  const t0 = performance.now();
  const kindSlots = slotsFor(base, { op: "addThread" }).slots.kind;
  const slotMs = performance.now() - t0;
  for (const k of kindSlots.filter((c) => c.ok)) {
    const from = slotsFor(base, { op: "addThread", kind: k.value }).slots.from.find((c) => c.ok);
    if (!from) {
      disagreements++;
      continue;
    }
    for (const to of slotsFor(base, { op: "addThread", kind: k.value, from: from.value }).slots.to) {
      const r = run([{ op: "addThread", thread: { kind: k.value, from: from.value, to: to.value, label: "Probe", purpose: "A probe." } }]);
      judged++;
      if (to.ok !== (r.refusals.length === 0)) disagreements++;
    }
  }
  check(`slotsFor: ${judged} offered cord ends each judged as the engine judges`, disagreements === 0 && judged > 0, `${disagreements} disagreements`);
  check(`slotsFor answers the kinds of cord in good time (${Math.round(slotMs)} ms)`, slotMs < 1500);
  for (const k of kindSlots.filter((c) => !c.ok)) check(`a kind offered as closed says why (${k.value})`, Boolean(k.why));
  if (base.rim) {
    const s = slotsFor(base, { op: "addElement", kind: base.rim.stoneKind });
    const counted = (s.slots.quarter ?? []).reduce((n, c) => n + (c.count ?? 0), 0);
    check("raising offers every quarter with its count", s.slots.quarter?.length === base.quarters.length && counted === base.elements.filter((e) => e.kind === base.rim.stoneKind).length);
    check("raising offers only the rim's realm", s.slots.realm.filter((c) => c.ok).every((c) => c.value === base.rim.realm));
    const withRealm = slotsFor(base, { op: "addElement", kind: base.rim.stoneKind, realm: base.rim.realm, quarter: base.quarters[0].id });
    check("a stone being raised is offered the cords that could hold it", (withRealm.cords ?? []).some((c) => c.ok));
    const r = room(base, { realm: base.rim.realm });
    check("room = capacity less used and pending", r.free === Math.max(0, r.capacity - r.used - r.pending));
  }
  const turn = slotsFor(base, { op: "turn" }).slots.condition;
  check("turning offers only the condition not sealed", turn.filter((c) => c.ok).every((c) => c.value !== base.condition) && turn.some((c) => !c.ok && c.why));
  const unseen = slotsFor(base, { op: "assignVision", visionId: base.visions[0]?.id }).slots.elementId ?? [];
  check("no vision is offered to what takes none", base.roles.unseen.every((id) => unseen.find((c) => c.value === id)?.ok === false));
}

/* words */
const e0 = locked[0].id;
const said = (value, field = "explanation") => [{ op: "setText", target: { type: "element", id: e0 }, field, value }];
refusedBy("an explanation past its budget", said("a".repeat(BUDGET.explanation + 1)), "text");
accepted("an explanation of six hundred and sixty letters", said(`${"Every cord holds. ".repeat(36)}Held.`.slice(0, 660)));
refusedBy("nature past its lines", said(Array.from({ length: BUDGET.natureLines + 1 }, () => "Held."), "nature"), "text");
{
  const addTitle = (title, purpose = "A probe.") => run([{ op: "addElement", element: { id: stamp("t"), title, kind: free.id, realm: freeRealm.id, purpose } }]);
  check("a title past its budget → refused (text)", addTitle("A".repeat(BUDGET.title + 1)).refusals.some((r) => r.rule === "text"));
  check("a purpose of two sentences → refused (text)", addTitle("Probe", "One sentence. Then another.").refusals.some((r) => r.rule === "text"));
}
for (const word of ["login", "password", "upload", "save", "settings", "error", "loading", "data", "node", "edge", "link", "click", "toggle", "dashboard", "version", "file", "user", "agent"]) {
  const plural = word.endsWith("s") ? word : `${word}s`;
  const r1 = run(said(`The wall holds the ${word} now.`));
  const r2 = run(said(`The wall holds ${plural} now.`));
  check(`purity: “${word}” and “${plural}” refused`, r1.refusals.some((r) => r.rule === "purity") && r2.refusals.some((r) => r.rule === "purity"));
}
accepted("purity keeps word boundaries (ledger, filed under none, sedge, unlinked words)", said("The ledger lies near the sedge, and the wall was saved."));
refusedBy("a phrase of the machines (log in)", said("Here you log in to the wall."), "purity");
refusedBy("a text alluding to the form of the sealed name", said("His name begins with a letter of the cold rim."), "sealed-name");
refusedBy("a text writing the sealed name's place", said(`${byId.get(base.roles.core).title}'s name is kept here.`), "sealed-name");
accepted("the silence of the name may be spoken of", said("Its silence is kept, and the name stays sealed."));

/* visions */
const vision = base.visions[0];
if (vision) {
  for (const unseen of base.roles.unseen) refusedBy("a vision set upon an element that takes no vision", [{ op: "assignVision", visionId: vision.id, elementId: unseen }], "op");
  const bare = base.elements.find((e) => !base.roles.unseen.includes(e.id) && !e.visions.includes(vision.id));
  accepted("a vision set upon another element", [{ op: "assignVision", visionId: vision.id, elementId: bare.id, x: 0.3, y: 0.6, zoom: 1.5 }]);
  const held = vision.subjects[0].elementId;
  refusedBy("a gaze outside the picture", [{ op: "setVisionSubject", visionId: vision.id, elementId: held, x: 1.4, y: 0.5, zoom: 1 }], "vision");
  refusedBy("a gaze drawn too close", [{ op: "setVisionSubject", visionId: vision.id, elementId: held, x: 0.5, y: 0.5, zoom: 9 }], "vision");
  accepted("a vision lifted from its subject", [{ op: "unassignVision", visionId: vision.id, elementId: held }]);
  refusedBy("a vision set aside while still set upon an element", [{ op: "removeVision", visionId: vision.id }], "op");
  refusedBy("a vision that was never brought", [{ op: "addVision", visionId: "v-0000000000", title: "Probe" }], "op");
  const s = clone(base);
  s.elements.find((e) => e.id === held).visions = [];
  check("visions and subjects disagreeing → refused (vision)", validate(s, canon).some((r) => r.rule === "vision"));
}

/* readings */
const lights = { layers: [someLayer.id], threadKinds: [], elements: [] };
accepted("a reading of one's own", [{ op: "addReading", reading: { id: stamp("r"), title: "Probe", text: "A reading of the rim.", lights } }]);
refusedBy("a reading lighting what the map does not hold", [{ op: "addReading", reading: { id: stamp("r"), title: "Probe", text: "A reading.", lights: { layers: ["nowhere"], threadKinds: [], elements: [] } } }], "reading");
refusedBy("a reading title past its budget", [{ op: "addReading", reading: { id: stamp("r"), title: "A".repeat(BUDGET.readingTitle + 1), text: "A reading.", lights } }], "text");
refusedBy(
  "more readings of one's own than allowed",
  Array.from({ length: BUDGET.ownReadings + 1 - base.readings.filter((r) => !r.locked).length }, (_, i) => ({ op: "addReading", reading: { id: stamp(`r${i}`), title: "Probe", text: "A reading.", lights } })),
  "capacity",
);
const canonicalReading = base.readings.find((r) => r.locked);
if (canonicalReading) {
  refusedBy("setting aside a canonical reading", [{ op: "removeReading", id: canonicalReading.id }], "op");
  refusedBy("changing what a canonical reading lights", [{ op: "setReadingLights", id: canonicalReading.id, lights }], "op");
  accepted("rewriting a canonical reading's words", [{ op: "setText", target: { type: "reading", id: canonicalReading.id }, field: "text", value: "Read anew from the rim." }]);
} else if (VERBOSE) console.log("  (no canonical readings yet: their locks are checked once they are merged)");

/* sight and form */
accepted("a sight with one layer dimmed", [{ op: "setSight", sight: { layers: base.sight.layers.slice(1) } }]);
refusedBy("a sight naming an unknown condition", [{ op: "setSight", sight: { condition: "nowhere" } }], "sight");
refusedBy("a sight naming an unknown reading", [{ op: "setSight", sight: { reading: "nowhere" } }], "sight");
refusedBy("a sight choice that does not exist", [{ op: "setSight", sight: { anything: true } }], "op");
refusedBy("an unknown change", [{ op: "rewriteEverything" }], "op");
refusedBy("a change of no steps", [], "op");
refusedBy("a change past its steps", Array.from({ length: BUDGET.ops + 1 }, () => ({ op: "setSight", sight: {} })), "op");
refusedBy("a reorder that loses an element", [{ op: "reorderWithinLayer", realm: someLayer.id, order: [] }], "op");
refusedBy("an emphasis out of bounds", [{ op: "setEmphasis", id: e0, emphasis: 7 }], "op");

/* map-specific cases, kept private */
const privateCases = readJson(path.join(DIR, "seed", "checks.json")) ?? [];
for (const c of privateCases) {
  const r = run(c.ops);
  if (c.expect === "accepted") check(`[private] ${c.name} → accepted`, r.refusals.length === 0, r.refusals.map((x) => x.message).slice(0, 2).join(" | "));
  else check(`[private] ${c.name} → refused${c.rule ? ` (${c.rule})` : ""}`, c.rule ? r.refusals.some((x) => x.rule === c.rule) : r.refusals.length > 0, `got ${rules(r).join(",") || "accepted"}`);
}
if (!privateCases.length) console.log("  (no private cases in seed/checks.json)");

/* ------------------------------------------------------------- endpoints */

section("2. endpoints (throwaway copy of the data dir)");

const tmp = path.join(DIR, `.check-${crypto.randomBytes(4).toString("hex")}`);
let server;
try {
  fs.mkdirSync(path.join(tmp, "seed"), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(tmp, "state", "history"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "visions"), { recursive: true });
  fs.copyFileSync(store.canonPath, path.join(tmp, "seed", "canon.json"));
  fs.copyFileSync(store.statePath, path.join(tmp, "state", "current.json"));
  for (const f of fs.readdirSync(store.historyDir)) fs.copyFileSync(path.join(store.historyDir, f), path.join(tmp, "state", "history", f));
  for (const v of base.visions) fs.symlinkSync(store.visionDir(v.id), path.join(tmp, "visions", v.id));
  const word = crypto.randomBytes(12).toString("base64url");
  const auth = await hashWatchword(word);
  fs.writeFileSync(path.join(tmp, "auth.json"), JSON.stringify(auth), { mode: 0o600 });

  const handler = createSanctumHandler({ dir: tmp });
  server = http.createServer((req, res) => handler(req, res, () => ((res.statusCode = 404), res.end())));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const B = `http://127.0.0.1:${server.address().port}`;
  const W = { "Content-Type": "application/json", "X-Sanctum": "1" };
  const req = async (p, init = {}) => {
    const res = await fetch(B + p, init);
    const buf = Buffer.from(await res.arrayBuffer());
    let body;
    try {
      body = JSON.parse(buf.toString("utf8"));
    } catch {
      body = buf;
    }
    return { status: res.status, headers: res.headers, body, raw: buf };
  };
  const titles = base.elements.map((e) => e.title);
  const holdsNothing = (r) => !titles.some((t) => r.raw.toString("utf8").includes(t)) && r.raw.length < 64;

  /* nothing without entry */
  const v0 = base.visions[0];
  const closed = [
    ["GET", "/sanctum-api/map"],
    ["GET", "/sanctum-api/record"],
    ["GET", "/sanctum-api/record/1"],
    ["GET", v0 ? `/sanctum-api/visions/${v0.id}/${v0.sizes[0]}.webp` : "/sanctum-api/visions/x/1.webp"],
    ["POST", "/sanctum-api/changes"],
    ["POST", "/sanctum-api/restore"],
    ["POST", "/sanctum-api/visions"],
  ];
  for (const [method, p] of closed) {
    const r = await req(p, { method, headers: method === "POST" ? W : {}, body: method === "POST" ? "{}" : undefined });
    check(`${method} ${p.replace(/visions\/[^/]+/, "visions/:id")} without entry → 401, nothing`, r.status === 401 && holdsNothing(r), `status ${r.status}`);
  }
  const s0 = await req("/sanctum-api/session");
  check("GET /session without entry → {entered:false}", s0.status === 200 && s0.body.entered === false);
  check("answers carry X-Robots-Tag noindex, nofollow", s0.headers.get("x-robots-tag") === "noindex, nofollow");
  check("answers are not stored", s0.headers.get("cache-control") === "no-store");

  /* the gate */
  const enter = (w, headers = W) => req("/sanctum-api/session", { method: "POST", headers, body: JSON.stringify({ watchword: w }) });
  check("entry without the custom header → 403", (await enter(word, { "Content-Type": "application/json" })).status === 403);
  check("entry from a foreign origin → 403", (await enter(word, { ...W, Origin: "https://elsewhere.example" })).status === 403);
  check("entry from a cross-site fetch → 403", (await enter(word, { ...W, "Sec-Fetch-Site": "cross-site" })).status === 403);
  const wrong = [];
  for (let i = 0; i < 6; i++) wrong.push(await enter(`wrong-${i}`));
  check("wrong watchwords → 401", wrong.slice(0, 4).every((r) => r.status === 401 && r.body.entered === false));
  check("the gate rests after repeated refusals (backoff, 429 with rest)", wrong[4].body.rest > 0 && wrong[5].status === 429 && wrong[5].body.rest > 0);
  check("even the true watchword waits while the gate rests", (await enter(word)).status === 429);
  await new Promise((r) => setTimeout(r, (wrong[5].body.rest + 0.3) * 1000));
  const ok = await enter(word);
  const setCookie = ok.headers.get("set-cookie") ?? "";
  check("the true watchword → entered", ok.status === 200 && ok.body.entered === true);
  check("the entry cookie is HttpOnly, Secure, SameSite=Strict, scoped, expiring", /HttpOnly/.test(setCookie) && /Secure/.test(setCookie) && /SameSite=Strict/.test(setCookie) && /Path=\/sanctum-api/.test(setCookie) && /Max-Age=\d+/.test(setCookie));
  const cookie = setCookie.split(";")[0];
  const C = { cookie };
  const CW = { ...W, cookie };

  /* forged and lapsed entries */
  const [name, value] = cookie.split("=");
  const forged = `${name}=${value.slice(0, -2)}${value.endsWith("A") ? "B" : "A"}A`;
  check("a forged entry → 401", (await req("/sanctum-api/map", { headers: { cookie: forged } })).status === 401);
  const lapsed = `${name}=${signEntry(auth.secret, "lapsed", Date.now() - 1000)}`;
  check("a lapsed entry → 401", (await req("/sanctum-api/map", { headers: { cookie: lapsed } })).status === 401);
  const unknown = `${name}=${signEntry(auth.secret, "never-opened", Date.now() + 60000)}`;
  check("a signed entry that was never opened → 401", (await req("/sanctum-api/map", { headers: { cookie: unknown } })).status === 401);

  /* reading */
  const map = await req("/sanctum-api/map", { headers: C });
  check("GET /map with entry → the state", map.status === 200 && map.body.meta?.version === base.meta.version);
  if (v0) {
    const img = await req(`/sanctum-api/visions/${v0.id}/${v0.sizes[0]}.avif`, { headers: C });
    check("a vision with entry → image/avif, private cache", img.status === 200 && img.headers.get("content-type") === "image/avif" && /private/.test(img.headers.get("cache-control")));
    check("a width the vision was not derived at → 404", (await req(`/sanctum-api/visions/${v0.id}/7.webp`, { headers: C })).status === 404);
  }

  /* writing */
  const v = base.meta.version;
  const probeOp = { op: "setText", target: { type: "element", id: e0 }, field: "explanation", value: "Sealed by the check." };
  check("a write without the custom header → 403", (await req("/sanctum-api/changes", { method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify({ ops: [probeOp], baseVersion: v }) })).status === 403);
  check("a write from a foreign origin → 403", (await req("/sanctum-api/changes", { method: "POST", headers: { ...CW, Origin: "https://elsewhere.example" }, body: JSON.stringify({ ops: [probeOp], baseVersion: v }) })).status === 403);
  const dry = await req("/sanctum-api/changes", { method: "POST", headers: CW, body: JSON.stringify({ ops: [probeOp], dryRun: true, baseVersion: v }) });
  check("a dry run → accepted, not sealed, with a diff", dry.status === 200 && dry.body.accepted && !dry.body.sealed && dry.body.diff.elements.changed.includes(e0));
  check("a dry run leaves the map as it was", (await req("/sanctum-api/map", { headers: C })).body.meta.version === v);
  const refused = await req("/sanctum-api/changes", { method: "POST", headers: CW, body: JSON.stringify({ ops: [{ op: "removeElement", id: e0 }], baseVersion: v }) });
  check("a refused change → 422 with words in the map's tongue", refused.status === 422 && refused.body.refusals[0].message.length > 0);
  check("a change without the version it was made upon → 409", (await req("/sanctum-api/changes", { method: "POST", headers: CW, body: JSON.stringify({ ops: [probeOp] }) })).status === 409);
  const sealed = await req("/sanctum-api/changes", { method: "POST", headers: CW, body: JSON.stringify({ ops: [probeOp], baseVersion: v }) });
  check("a change sealed → a new version", sealed.status === 200 && sealed.body.sealed && sealed.body.state.meta.version === v + 1);
  const stale = await req("/sanctum-api/changes", { method: "POST", headers: CW, body: JSON.stringify({ ops: [probeOp], baseVersion: v }) });
  check("a change made upon a moved map → 409 (moved)", stale.status === 409 && stale.body.refusals[0].rule === "moved");
  const record = await req("/sanctum-api/record", { headers: C });
  check("the record holds the new entry first, with a summary", record.body.entries[0].version === v + 1 && record.body.entries[0].summary.length > 0);
  check("the record entry is a file of its own (append-only)", fs.existsSync(path.join(tmp, "state", "history", `${v + 1}.json`)));
  check("GET /record/:version → that state", (await req(`/sanctum-api/record/${v}`, { headers: C })).body.meta?.version === v);
  const restoreDry = await req("/sanctum-api/restore", { method: "POST", headers: CW, body: JSON.stringify({ version: v, baseVersion: v + 1, dryRun: true }) });
  check("a restore previewed → not sealed", restoreDry.status === 200 && !restoreDry.body.sealed);
  const restored = await req("/sanctum-api/restore", { method: "POST", headers: CW, body: JSON.stringify({ version: v, baseVersion: v + 1 }) });
  const back = restored.body.state;
  check("a restore seals a new version", restored.status === 200 && back.meta.version === v + 2);
  check("the restored map equals the one restored", JSON.stringify({ ...back, meta: null }) === JSON.stringify({ ...base, meta: null }));
  check("the record marks the restore", (await req("/sanctum-api/record", { headers: C })).body.entries[0].restoredFrom === v);

  /* bringing a vision */
  const pic = path.join(tmp, "probe.png");
  execFileSync("convert", ["-size", "900x600", "gradient:#203040-#a0b0c0", pic]);
  const brought = await req("/sanctum-api/visions", { method: "POST", headers: { cookie, "X-Sanctum": "1", "Content-Type": "image/png" }, body: fs.readFileSync(pic) });
  const files = brought.body.files;
  check("a picture brought → derived widths in avif and webp", brought.status === 200 && files.sizes.join() === "480,900" && files.formats.includes("avif") && files.formats.includes("webp"));
  check("a brought vision is not yet in the map", !(await req("/sanctum-api/map", { headers: C })).body.visions.some((x) => x.id === files.id));
  const bare = back.elements.find((e) => !back.roles.unseen.includes(e.id));
  const set = await req("/sanctum-api/changes", {
    method: "POST",
    headers: CW,
    body: JSON.stringify({ ops: [{ op: "addVision", visionId: files.id, title: "Probe" }, { op: "assignVision", visionId: files.id, elementId: bare.id, x: 0.4, y: 0.4, zoom: 1.2 }], baseVersion: v + 2 }),
  });
  check("a brought vision set into the map and upon an element", set.status === 200 && set.body.state.elements.find((e) => e.id === bare.id).visions.includes(files.id));
  check("its widths are served", (await req(`/sanctum-api/visions/${files.id}/480.webp`, { headers: C })).headers.get("content-type") === "image/webp");
  const notPic = await req("/sanctum-api/visions", { method: "POST", headers: { cookie, "X-Sanctum": "1", "Content-Type": "image/png" }, body: Buffer.from("not a picture at all") });
  check("something that is not a picture → refused", notPic.status === 415);
  const heavy = await fetch(`${B}/sanctum-api/visions`, { method: "POST", headers: { cookie, "X-Sanctum": "1", "Content-Type": "image/png", "Content-Length": String(31 * 1024 * 1024) }, body: Buffer.alloc(16) }).catch(() => ({ status: 413 }));
  check("a picture heavier than the measure → 413", heavy.status === 413);

  /* the client store's draft, against this server */
  {
    const realFetch = globalThis.fetch;
    let jar = "";
    globalThis.fetch = async (url, init = {}) => {
      const res = await realFetch(String(url).startsWith("/") ? B + url : url, { ...init, headers: { ...(init.headers ?? {}), ...(jar ? { cookie: jar } : {}) } });
      const sc = res.headers.get("set-cookie");
      if (sc) jar = sc.split(";")[0];
      return res;
    };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
      const st = createSanctumStore();
      await st.enter(word);
      check("store: entered and gathered", st.get().status === "open" && Boolean(st.get().state));
      const v = st.get().state.meta.version;
      const words = (text) => ({ op: "setText", target: { type: "element", id: e0 }, field: "explanation", value: text });
      st.setDraft({ ops: [words("Drafted by the check.")] });
      check("store: a draft is judged at once, locally", st.get().draft.verdict.state === "checking" && Boolean(st.get().draft.previewState) && st.get().draft.open);
      await sleep(900);
      const d = st.get().draft;
      check("store: …then confirmed by the server's dry run", d.verdict.state === "accepted" && d.verdict.confirmed && d.verdict.summary.length > 0 && d.diff.elements.changed.includes(e0));
      st.setDraft({ ops: [{ op: "removeElement", id: e0 }] });
      check("store: a refused draft is refused at once, in words", st.get().draft.verdict.state === "refused" && st.get().draft.verdict.refusals[0]?.message.length > 0);
      st.setDraft({ ops: [words("First thought.")] });
      st.setDraft({ ops: [words("Second thought.")] });
      await sleep(900);
      const late = st.get().draft.previewState.elements.find((e) => e.id === e0).explanation;
      check("store: a late dry run never overwrites a newer draft", late === "Second thought." && st.get().draft.verdict.confirmed);
      const sealedOk = await st.seal();
      check("store: seal → a new version, the draft cleared, the shell still open", sealedOk && st.get().state.meta.version === v + 1 && st.get().draft.ops.length === 0 && st.get().draft.open && st.get().word.length > 0);
      const rec = await st.loadRecord();
      check("record: a sealed change carries its op names", JSON.stringify(rec[0].opNames) === JSON.stringify(["setText"]));
      const previewed = await st.restore(v);
      check("store: a restore previewed as a draft", previewed && st.get().draft.restoring === v && st.get().draft.verdict.state === "accepted");
      const restoredOk = await st.seal();
      check("store: the restore sealed, the shell still open", restoredOk && st.get().state.meta.version === v + 2 && st.get().draft.open && st.get().draft.restoring === null && (await st.loadRecord())[0].restoredFrom === v);
      st.setDraft({ ops: [words("Withdrawn.")] });
      st.closeDraft();
      await sleep(600);
      check("store: a withdrawn draft leaves nothing behind", st.get().draft.ops.length === 0 && st.get().draft.verdict.state === "empty");
      await st.leave();
      check("store: leaving returns to the gate", st.get().status === "gate" && !st.get().state);
    } finally {
      globalThis.fetch = realFetch;
    }
  }

  /* leaving */
  check("leaving → the entry is revoked", (await req("/sanctum-api/session", { method: "DELETE", headers: CW })).status === 200 && (await req("/sanctum-api/map", { headers: C })).status === 401);
} catch (err) {
  check("endpoint checks ran to the end", false, err.stack);
} finally {
  server?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ live */

section(`3. live (${LIVE})`);
try {
  const r = await fetch(`${LIVE}/sanctum-api/map`);
  check("GET /sanctum-api/map without entry → 401", r.status === 401 && (await r.text()).length < 64);
  const page = await fetch(`${LIVE}/sanctum`);
  check("/sanctum carries X-Robots-Tag noindex, nofollow", page.headers.get("x-robots-tag") === "noindex, nofollow");
  for (const p of [`/@fs${store.statePath}`, `/@fs${path.join(DIR, "auth.json")}`, `/@fs${store.canonPath}`]) {
    const x = await fetch(`${LIVE}${p}`);
    const text = await x.text();
    check(`the data dir is not served (${path.basename(p)})`, !(x.ok && text.includes('"meta"')) && !text.includes('"scrypt"') && !text.includes('"layers"'));
  }
  if (base.visions[0]) {
    const x = await fetch(`${LIVE}/sanctum-api/visions/${base.visions[0].id}/${base.visions[0].sizes[0]}.webp`);
    check("a vision without entry → 401", x.status === 401);
  }
  const ww = process.env.EVOVIEW_SANCTUM_WATCHWORD;
  if (ww) {
    const e = await fetch(`${LIVE}/sanctum-api/session`, { method: "POST", headers: { "Content-Type": "application/json", "X-Sanctum": "1" }, body: JSON.stringify({ watchword: ww }) });
    const c = (e.headers.get("set-cookie") ?? "").split(";")[0];
    const m = await fetch(`${LIVE}/sanctum-api/map`, { headers: { cookie: c } });
    check("the vault's watchword enters the live server", e.status === 200 && m.status === 200);
    await fetch(`${LIVE}/sanctum-api/session`, { method: "DELETE", headers: { cookie: c, "X-Sanctum": "1" } });
  } else console.log("  (EVOVIEW_SANCTUM_WATCHWORD not in the environment: live entry not tried)");
} catch (err) {
  check(`live server reachable at ${LIVE}`, false, err.message);
}

/* --------------------------------------------------------------- content */

section("4. content");

if (flag("build")) {
  console.log("  building…");
  execFileSync("pnpm", ["build"], { cwd: ROOT, stdio: VERBOSE ? "inherit" : "ignore" });
}

const dict = new Set(fs.readFileSync("/usr/share/dict/words", "utf8").split("\n"));
const needles = new Set();
const add = (text, sentence = false) => {
  const t = (text ?? "").trim();
  if (!t) return;
  if (sentence) {
    if (t.length >= 24) needles.add(t);
    return;
  }
  if (t.includes(" ") || t.includes("-")) {
    if (t.length >= 6) needles.add(t);
  } else if (!dict.has(t.toLowerCase()) && t.length >= 4) needles.add(t);
};
const words = [];
for (const s of [base, ...store.record().map((e) => store.at(e.version)?.state).filter(Boolean)]) {
  for (const e of s.elements) {
    add(e.title);
    add(e.id);
    words.push(e.purpose, e.explanation, ...e.nature);
  }
  for (const t of s.threads) words.push(t.purpose, t.explanation);
  for (const l of [...s.layers, s.beyond]) {
    add(l.title);
    words.push(l.purpose, l.explanation, ...l.nature);
  }
  for (const k of s.threadKinds) words.push(k.purpose, k.course, k.explanation, k.grammar.refusal);
  for (const r of s.readings) {
    add(r.title);
    words.push(r.text);
  }
  for (const v of s.visions) add(v.id);
  words.push(s.threshold.purpose, s.lexicon.purpose, s.lexicon.title);
}
for (const w of words) add(w, true);
const colours = new Set([...base.layers, base.beyond, ...base.threadKinds, base.lexicon].map((x) => x.colour.hex.toLowerCase()));
const watchword = process.env.EVOVIEW_SANCTUM_WATCHWORD;
const pictureHashes = new Set();
const pictureSizes = new Set();
for (const v of base.visions) {
  const d = store.visionDir(v.id);
  for (const f of fs.readdirSync(d)) {
    const buf = fs.readFileSync(path.join(d, f));
    pictureSizes.add(buf.length);
    pictureHashes.add(crypto.createHash("sha256").update(buf).digest("hex"));
  }
}
for (const f of fs.existsSync(path.join(DIR, "intake")) ? fs.readdirSync(path.join(DIR, "intake")) : []) {
  const buf = fs.readFileSync(path.join(DIR, "intake", f));
  pictureSizes.add(buf.length);
  pictureHashes.add(crypto.createHash("sha256").update(buf).digest("hex"));
}

const hits = new Map();
function scan(label, text) {
  const lower = text.toLowerCase();
  const found = [...needles].filter((n) => text.includes(n));
  for (const c of colours) if (lower.includes(c)) found.push(c);
  if (watchword && text.includes(watchword)) found.push("(the watchword)");
  if (found.length) hits.set(label, found);
}
function scanFile(file, label = path.relative(ROOT, file)) {
  const stat = fs.statSync(file);
  if (!stat.isFile()) return;
  if (pictureSizes.has(stat.size) && pictureHashes.has(crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"))) {
    hits.set(label, ["(a vision's picture)"]);
    return;
  }
  if (stat.size > 8 * 1024 * 1024) return;
  const buf = fs.readFileSync(file);
  if (buf.includes(0)) return;
  scan(label, buf.toString("utf8"));
}

const repoFiles = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: ROOT }).toString().split("\0").filter(Boolean);
for (const f of repoFiles) if (fs.existsSync(path.join(ROOT, f))) scanFile(path.join(ROOT, f));
check(`no map words, colours, pictures or watchword in ${repoFiles.length} repo files`, ![...hits.keys()].some((k) => !k.startsWith("dist/") && !k.startsWith("history")), [...hits.keys()].join(", "));

let branchLog = "";
try {
  branchLog = execFileSync("git", ["log", "-p", "--no-color", "master..HEAD"], { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }).toString();
} catch {
  /* no master ref */
}
scan("history (master..HEAD)", branchLog);
check("none in the branch's commits", !hits.has("history (master..HEAD)"), (hits.get("history (master..HEAD)") ?? []).length ? `${hits.get("history (master..HEAD)").length} hits` : "");

const dist = path.join(ROOT, "dist");
if (fs.existsSync(dist)) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]));
  const distFiles = walk(dist);
  for (const f of distFiles) scanFile(f);
  check(`none in dist/ (${distFiles.length} files)`, ![...hits.keys()].some((k) => k.startsWith("dist/")), [...hits.keys()].filter((k) => k.startsWith("dist/")).join(", "));
  const js = distFiles.filter((f) => f.endsWith(".js"));
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const mainName = /<script[^>]+src="\/assets\/([^"]+\.js)"/.exec(html)?.[1];
  const main = mainName ? fs.readFileSync(path.join(dist, "assets", mainName), "utf8") : "";
  check("the main chunk holds no sanctum code (route is lazy)", Boolean(main) && !main.includes("sanctum-gate") && !main.includes("/sanctum-api"), mainName ?? "main chunk not found");
  const gate = js.find((f) => fs.readFileSync(f, "utf8").includes("sanctum-gate"));
  const gateCode = gate ? fs.readFileSync(gate, "utf8") : "";
  check("the gate lives in its own lazy chunk", Boolean(gate) && path.basename(gate) !== mainName, gate ? path.basename(gate) : "not found");
  const lazyChunks = [...gateCode.matchAll(/import\("\.\/([^"]+\.js)"\)/g)].map((m) => m[1]);
  check("the gate chunk loads the sight and console as further chunks (after entry)", lazyChunks.length >= 2, `found ${lazyChunks.join(", ") || "none"}`);
  if (VERBOSE) console.log(`  main: ${mainName}; gate: ${gate ? path.basename(gate) : "?"}; after entry: ${lazyChunks.join(", ")}`);
} else console.log("  (no dist/: run with --build to scan the client bundle)");

if (VERBOSE && hits.size) for (const [k, v] of hits) console.log(`  ${k}: ${v.length} hits`);
console.log(`\n${passed} passed, ${failures.length} failed (${needles.size} map words and ${colours.size} colours searched)`);
process.exit(failures.length ? 1 : 0);
