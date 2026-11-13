/* Vault importer: reads the vault (frontmatter = typed relations, thread
   notes = every cord instance) through a private manifest that maps notes
   to ids and carries the rules. Generic: nothing of the map is written here;
   the manifest lives in the data dir. Trusted tool, run from scripts/. */

import fs from "node:fs";
import path from "node:path";
import { canonOf, expectedCondition, validate, type Canon } from "../../src/sanctum/model/validate.ts";
import { applyOps } from "../../src/sanctum/model/ops.ts";
import { clone } from "../../src/sanctum/model/rules.ts";
import {
  BEYOND,
  LEXICON,
  SCHEMA_VERSION,
  type Colour,
  type Element,
  type ElementKind,
  type Flow,
  type Grammar,
  type Id,
  type Layer,
  type Op,
  type Quarter,
  type Reading,
  type Refusal,
  type Rim,
  type Roles,
  type Station,
  type SanctumState,
  type Sight,
  type Thread,
  type ThreadKind,
  type Tie,
  type TieKind,
} from "../../src/sanctum/model/types.ts";
import { deriveVision, type Picture } from "./visions.ts";

export interface Manifest {
  vault: string;
  explanations?: string;
  summary: string;
  threshold: { note: string };
  lexicon: { note: string; colour: Colour };
  layers: { id: Id; note: string; title: string; hex: string; capacity: number }[];
  beyond: { title: string; purpose: string; colour: Colour; capacity: number; order: string[] };
  conditions: { id: Id; title: string; tag: string; turn?: string }[];
  condition?: Id;
  quarters?: Quarter[];
  stations?: Station[];
  rim?: Rim;
  elementKinds: ElementKind[];
  tieKinds: TieKind[];
  tieKeys: { key: string; tie: Id; from?: EndType; to?: EndType }[];
  /** Frontmatter keys naming an element's parent. */
  parentKeys: string[];
  threadKinds: { id: Id; note: string; hex: string; directed: boolean; flow: Flow; steadfast?: boolean; grammar: Grammar }[];
  /** Note title → element id, for every note that is an element. */
  elements: Record<string, Id>;
  roles: Roles;
  threads: {
    skip: { kind: Id; from: string; to: string }[];
    extra: { kind: Id; from: string; to: string; label: string; purpose: string }[];
  };
  visions: { id: Id; file: string; title: string; subjects: { elementId: Id; x: number; y: number; zoom: number }[] }[];
  sight: Sight;
}

type EndType = "element" | "layer" | "cord" | "lexicon";

interface Note {
  title: string;
  front: Record<string, string | string[] | boolean>;
  sections: Record<string, string[]>;
}

/* ---------- reading notes ---------- */

const unquote = (v: string) => v.replace(/^["'](.*)["']$/, "$1");
const linkOf = (v: string) => /\[\[([^\]|#]+)/.exec(v)?.[1]?.trim();
const linksIn = (v: string) => [...v.matchAll(/\[\[([^\]|#]+)[^\]]*\]\]/g)].map((m) => m[1].trim());
const plain = (v: string) => v.replace(/\*\*/g, "").replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b ?? a).trim();

export function parseNote(file: string): Note {
  const raw = fs.readFileSync(file, "utf8");
  const title = path.basename(file, ".md");
  const front: Note["front"] = {};
  let body = raw;
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (m) {
    body = raw.slice(m[0].length);
    let key = "";
    for (const line of m[1].split("\n")) {
      const item = /^\s+-\s+(.*)$/.exec(line);
      if (item && key) {
        const prev = front[key];
        front[key] = [...(Array.isArray(prev) ? prev : []), unquote(item[1].trim())];
        continue;
      }
      const kv = /^([\w-]+):\s*(.*)$/.exec(line);
      if (!kv) continue;
      key = kv[1];
      const value = kv[2].trim();
      front[key] = value === "" ? [] : value === "true" ? true : value === "false" ? false : unquote(value);
    }
  }
  const sections: Note["sections"] = {};
  let current = "";
  for (const line of body.split("\n")) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) {
      current = h[1].trim();
      sections[current] = [];
      continue;
    }
    if (current && line.trim()) sections[current].push(line.trim());
  }
  return { title, front, sections };
}

function readVault(dir: string): Map<string, Note> {
  const notes = new Map<string, Note>();
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".md")) {
        const note = parseNote(p);
        notes.set(note.title, note);
      }
    }
  };
  walk(dir);
  return notes;
}

const bullets = (lines: string[] = []) => lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());

function sentence(text: string): string {
  let t = plain(text).trim().replace(/\s+/g, " ");
  if (!t) return t;
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

interface ThreadLine {
  label: string;
  arrow: string;
  links: string[];
  text: string;
  kindNote?: string;
}

function parseThreadLine(line: string): ThreadLine | undefined {
  const m = /^\*\*(.+?)\*\*\s*(→|←|↔)\s*(.*)$/.exec(line);
  if (!m) return undefined;
  let rest = m[3];
  let kindNote: string | undefined;
  const tail = /\s+·\s+(\[\[[^\]]+\]\])\s*$/.exec(rest);
  if (tail) {
    kindNote = linkOf(tail[1]);
    rest = rest.slice(0, tail.index);
  }
  const dash = rest.indexOf(" — ");
  const linksPart = dash >= 0 ? rest.slice(0, dash) : rest;
  const text = dash >= 0 ? rest.slice(dash + 3).trim() : "";
  return { label: m[1].trim(), arrow: m[2], links: linksIn(linksPart), text, kindNote };
}

/* ---------- building the seed ---------- */

export interface SeedResult {
  state: SanctumState;
  vault: Record<string, Note>;
}

export async function buildSeed(manifest: Manifest, dir: string): Promise<SeedResult> {
  const notes = readVault(manifest.vault);
  const need = (title: string) => {
    const n = notes.get(title);
    if (!n) throw new Error(`missing note: ${title}`);
    return n;
  };
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const list = (v: unknown) => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []);

  const layerByNote = new Map(manifest.layers.map((l) => [l.note, l.id]));
  const kindByNote = new Map(manifest.threadKinds.map((k) => [k.note, k.id]));
  const colourName = (v: unknown) => str(v).replace(/^\w/, (c) => c.toUpperCase());

  const resolve = (title: string | undefined, allow: EndType[] = ["element", "layer", "cord", "lexicon"]): string | undefined => {
    if (!title) return undefined;
    if (allow.includes("element") && manifest.elements[title]) return manifest.elements[title];
    if (allow.includes("layer") && layerByNote.has(title)) return `layer:${layerByNote.get(title)}`;
    if (allow.includes("cord") && kindByNote.has(title)) return `cord:${kindByNote.get(title)}`;
    if (allow.includes("lexicon") && title === manifest.lexicon.note) return LEXICON;
    return undefined;
  };

  /* threshold, lexicon, layers */
  const thresholdNote = need(manifest.threshold.note);
  const lexiconNote = need(manifest.lexicon.note);
  const threshold = { title: thresholdNote.title, purpose: str(thresholdNote.front.purpose), explanation: str(thresholdNote.front.purpose) };
  const lexicon = { title: lexiconNote.title, purpose: str(lexiconNote.front.purpose), explanation: str(lexiconNote.front.purpose), colour: manifest.lexicon.colour };
  const layers: Layer[] = manifest.layers.map((l, order) => {
    const n = need(l.note);
    return {
      id: l.id,
      title: l.title,
      purpose: str(n.front.purpose),
      nature: bullets(n.sections.Nature).map(plain),
      explanation: str(n.front.purpose),
      colour: { name: colourName(n.front.colour), hex: l.hex },
      order,
      capacity: l.capacity,
    };
  });

  /* cord kinds, titled as the lexicon names them */
  const lexiconTitles = new Map<string, string>();
  for (const line of bullets(lexiconNote.sections["The nine cords"] ?? Object.values(lexiconNote.sections)[0])) {
    const m = /^\*\*(.+?)\*\*\s*→\s*(\[\[[^\]]+\]\])/.exec(line);
    if (m) lexiconTitles.set(linkOf(m[2])!, m[1].trim());
  }
  const threadKinds: ThreadKind[] = manifest.threadKinds.map((k, order) => {
    const n = need(k.note);
    return {
      id: k.id,
      title: lexiconTitles.get(k.note) ?? k.note,
      purpose: str(n.front.purpose),
      course: str(n.front.course),
      colour: { name: colourName(n.front.colour), hex: k.hex },
      directed: k.directed,
      flow: k.flow,
      order,
      ...(k.steadfast ? { steadfast: true } : {}),
      grammar: k.grammar,
      explanation: str(n.front.purpose),
    };
  });

  /* elements */
  const conditionByTag = new Map(manifest.conditions.map((c) => [c.tag, c.id]));
  const elements: Element[] = [];
  for (const [title, id] of Object.entries(manifest.elements)) {
    const n = need(title);
    const kind = str(n.front.kind);
    const layer = layerByNote.get(linkOf(str(n.front.layer)) ?? "");
    const parentNote = manifest.parentKeys.map((k) => linkOf(str(n.front[k]))).find(Boolean);
    const condition = list(n.front.tags).map((t) => conditionByTag.get(t)).find(Boolean);
    const purpose = str(n.front.purpose);
    elements.push({
      id,
      title,
      kind,
      realm: layer ?? BEYOND,
      ...(parentNote ? { parent: manifest.elements[parentNote] } : {}),
      ...(condition ? { condition } : {}),
      purpose,
      nature: bullets(n.sections.Nature ?? n.sections.Practice).map(plain),
      explanation: purpose,
      visions: [],
      emphasis: 1,
      order: 0,
      locked: true,
    });
  }
  const orderIn = (titles: string[]) => titles.map((t) => manifest.elements[t]).filter(Boolean);
  const realmOrder = new Map<Id, Id[]>();
  for (const l of manifest.layers) realmOrder.set(l.id, orderIn(list(need(l.note).front.holds).map((h) => linkOf(String(h)) ?? "")));
  realmOrder.set(BEYOND, orderIn(manifest.beyond.order));
  for (const [realm, ids] of realmOrder) {
    const members = elements.filter((e) => e.realm === realm);
    members.sort((a, b) => (ids.indexOf(a.id) + 1 || 999) - (ids.indexOf(b.id) + 1 || 999)).forEach((e, i) => (e.order = i));
  }

  /* cords: every instance listed by the thread notes */
  const linesByNote = new Map<string, ThreadLine[]>();
  for (const n of notes.values()) {
    linesByNote.set(n.title, bullets(n.sections.Threads).map(parseThreadLine).filter((l): l is ThreadLine => Boolean(l)));
  }
  /* A line naming this one counterpart beats a line naming many. */
  const fallbackText = (kindNote: string, fromNote: string, toNote: string) => {
    const lines = (note: string, other: string) =>
      (linesByNote.get(note) ?? []).filter((l) => (!l.kindNote || l.kindNote === kindNote) && l.links.includes(other) && l.text);
    const all = [...lines(fromNote, toNote), ...lines(toNote, fromNote)];
    return (all.find((l) => l.links.length === 1) ?? all[0])?.text;
  };
  const skip = new Set(manifest.threads.skip.map((s) => `${s.kind}|${s.from}|${s.to}`));
  const slugEnd = (end: string) => end.replace(":", "-");
  const threadIds = new Set<string>();
  const threads: Thread[] = [];
  const pushThread = (kind: ThreadKind, fromNote: string, toNote: string, label: string, purpose: string) => {
    const from = resolve(fromNote, ["element", "layer"]);
    const to = resolve(toNote, ["element", "layer"]);
    if (!from || !to) throw new Error(`unresolved cord: ${kind.id} ${fromNote} → ${toNote}`);
    let id = `${kind.id}-${slugEnd(from)}-${slugEnd(to)}`.slice(0, 48).replace(/-+$/, "");
    for (let i = 2; threadIds.has(id); i++) id = `${kind.id}-${i}`;
    threadIds.add(id);
    threads.push({
      id,
      kind: kind.id,
      from: from as Thread["from"],
      to: to as Thread["to"],
      label,
      purpose: sentence(purpose || kind.purpose),
      explanation: "",
      bidirectional: Boolean(kind.grammar.bidirectional),
      irreversible: Boolean(kind.grammar.irreversible),
      locked: true,
    });
  };
  for (const k of manifest.threadKinds) {
    const kind = threadKinds.find((x) => x.id === k.id)!;
    for (const line of bullets(need(k.note).sections["Cords of this kind"])) {
      const parsed = parseThreadLine(line);
      if (!parsed || parsed.links.length < 2) continue;
      const fromNote = parsed.links[0];
      const toNote = parsed.arrow === "↔" ? parsed.links[1] : parsed.links[parsed.links.length - 1];
      if (skip.has(`${k.id}|${fromNote}|${toNote}`)) continue;
      pushThread(kind, fromNote, toNote, plain(parsed.label), parsed.text || fallbackText(k.note, fromNote, toNote) || "");
    }
  }
  for (const x of manifest.threads.extra) {
    pushThread(threadKinds.find((k) => k.id === x.kind)!, x.from, x.to, x.label, x.purpose);
  }
  const byId = new Map(elements.map((e) => [e.id, e]));
  const kindsById = new Map(threadKinds.map((k) => [k.id, k]));
  for (const t of threads) {
    const c = expectedCondition(t, kindsById, byId);
    if (c.condition && !c.conflict) t.condition = c.condition;
  }

  /* ties: typed relations from frontmatter */
  const ties: Tie[] = [];
  const tieKeys = new Set<string>();
  const endType = (end: string): EndType =>
    end.startsWith("layer:") ? "layer" : end.startsWith("cord:") ? "cord" : end === LEXICON ? "lexicon" : "element";
  for (const n of notes.values()) {
    const self = resolve(n.title, ["element", "layer"]);
    if (!self) continue;
    for (const rule of manifest.tieKeys) {
      if (rule.from && endType(self) !== rule.from) continue;
      for (const value of list(n.front[rule.key])) {
        const to = resolve(linkOf(String(value)));
        if (!to || (rule.to && endType(to) !== rule.to)) continue;
        const symmetric = manifest.tieKinds.find((k) => k.id === rule.tie)?.symmetric;
        const key = symmetric && to < self ? `${rule.tie}|${to}|${self}` : `${rule.tie}|${self}|${to}`;
        if (tieKeys.has(key)) continue;
        tieKeys.add(key);
        ties.push({ id: `${rule.tie}-${slugEnd(self)}-${slugEnd(to)}`.slice(0, 64), kind: rule.tie, from: self as Tie["from"], to: to as Tie["to"], locked: true });
      }
    }
  }

  const state: SanctumState = {
    meta: { schemaVersion: SCHEMA_VERSION, version: 1, updatedAt: new Date().toISOString(), summary: manifest.summary },
    threshold,
    lexicon,
    layers,
    beyond: { id: BEYOND, title: manifest.beyond.title, purpose: manifest.beyond.purpose, nature: [], explanation: manifest.beyond.purpose, colour: manifest.beyond.colour, capacity: manifest.beyond.capacity },
    conditions: manifest.conditions.map((c) => ({ id: c.id, title: c.title, turn: c.turn ?? "", explanation: "" })),
    condition: manifest.condition ?? manifest.conditions[0].id,
    quarters: manifest.quarters ?? [],
    stations: manifest.stations ?? [],
    ...(manifest.rim ? { rim: manifest.rim } : {}),
    elementKinds: manifest.elementKinds,
    threadKinds,
    tieKinds: manifest.tieKinds,
    roles: manifest.roles,
    readings: [],
    elements,
    threads,
    ties,
    visions: [],
    sight: manifest.sight,
  };

  /* visions: derived once from intake, then set upon their subjects */
  for (const v of manifest.visions) {
    const metaFile = path.join(dir, "visions", v.id, "meta.json");
    let files = fs.existsSync(metaFile) ? (JSON.parse(fs.readFileSync(metaFile, "utf8")) as SanctumState["visions"][number]) : undefined;
    if (!files) {
      const src = path.join(dir, v.file);
      const kind = (path.extname(src).slice(1).replace("jpeg", "jpg") as Picture) ?? "png";
      files = { ...(await deriveVision(dir, v.id, src, kind)), title: v.title, subjects: [] };
    }
    const { title: _t, subjects: _s, ...bare } = files as SanctumState["visions"][number];
    void _t;
    void _s;
    state.visions.push({ ...bare, title: v.title, subjects: clone(v.subjects) });
    for (const s of v.subjects) byId.get(s.elementId)?.visions.push(v.id);
  }

  return { state, vault: Object.fromEntries(notes) };
}

/* ---------- canon amendments (trusted: rulings) ---------- */

/** One raw edit. `set` replaces a top-level field; the others act on an id-keyed collection. */
export type AmendEdit =
  | { set: string; value: unknown }
  | { add: string; value: { id: string } & Record<string, unknown> }
  | { remove: string; id: string }
  | { patch: string; id: string; value: Record<string, unknown> };

export interface AmendEntry {
  summary: string;
  edits: AmendEdit[];
}

const COLLECTIONS = new Set(["elements", "threads", "ties", "layers", "threadKinds", "elementKinds", "tieKinds", "conditions", "readings", "quarters", "stations"]);

/** Applies raw edits past every lock; the result becomes the canon only if it passes every invariant against itself. */
export function applyAmendment(base: SanctumState, entry: AmendEntry): { state: SanctumState; canon: Canon; refusals: Refusal[] } {
  const state = clone(base) as SanctumState & Record<string, unknown>;
  if (state.meta.schemaVersion !== SCHEMA_VERSION) {
    state.condition ??= state.sight.condition;
    state.quarters ??= [];
    state.stations ??= [];
    state.conditions = state.conditions.map((c) => ({ turn: "", ...c }));
  }
  const coll = (name: string) => {
    if (!COLLECTIONS.has(name)) throw new Error(`unknown collection ${name}`);
    return state[name] as ({ id: string } & Record<string, unknown>)[];
  };
  for (const edit of entry.edits) {
    if ("set" in edit) (state as Record<string, unknown>)[edit.set] = clone(edit.value);
    else if ("add" in edit) {
      const list = coll(edit.add);
      if (list.some((x) => x.id === edit.value.id)) throw new Error(`${edit.add} ${edit.value.id} exists`);
      list.push(clone(edit.value));
    } else if ("remove" in edit) {
      const list = coll(edit.remove);
      if (!list.some((x) => x.id === edit.id)) throw new Error(`${edit.remove} ${edit.id} missing`);
      (state as Record<string, unknown>)[edit.remove] = list.filter((x) => x.id !== edit.id);
    } else {
      const item = coll(edit.patch).find((x) => x.id === edit.id);
      if (!item) throw new Error(`${edit.patch} ${edit.id} missing`);
      for (const [k, v] of Object.entries(edit.value)) {
        if (v === null) delete item[k];
        else item[k] = clone(v);
      }
    }
  }
  state.meta = { ...state.meta, schemaVersion: SCHEMA_VERSION, summary: entry.summary };
  const canon = canonOf(state);
  return { state, canon, refusals: validate(state, canon) };
}

/* ---------- amending the rules ---------- */

export interface AmendResult {
  state: SanctumState;
  canon: Canon;
  changed: string[];
}

/** Rule tables re-read from the manifest (grammar, kinds, roles, capacities); content untouched. */
export function amendRules(base: SanctumState, baseCanon: Canon, manifest: Manifest): AmendResult {
  const state = clone(base);
  const changed: string[] = [];
  const note = (what: string, before: unknown, after: unknown) => {
    if (JSON.stringify(before) !== JSON.stringify(after)) changed.push(what);
  };
  for (const k of state.threadKinds) {
    const m = manifest.threadKinds.find((x) => x.id === k.id);
    if (!m) throw new Error(`manifest lacks cord kind ${k.id}`);
    const before = clone(k);
    k.grammar = clone(m.grammar);
    k.directed = m.directed;
    k.flow = m.flow;
    k.colour = { ...k.colour, hex: m.hex };
    if (m.steadfast) k.steadfast = true;
    else delete k.steadfast;
    note(`cord kind ${k.id}`, before, k);
  }
  for (const l of state.layers) {
    const m = manifest.layers.find((x) => x.id === l.id);
    if (!m) throw new Error(`manifest lacks layer ${l.id}`);
    note(`layer ${l.id}`, [l.capacity, l.colour.hex], [m.capacity, m.hex]);
    l.capacity = m.capacity;
    l.colour = { ...l.colour, hex: m.hex };
  }
  note("beyond", state.beyond.capacity, manifest.beyond.capacity);
  state.beyond.capacity = manifest.beyond.capacity;
  note("element kinds", state.elementKinds, manifest.elementKinds);
  note("tie kinds", state.tieKinds, manifest.tieKinds);
  note("roles", state.roles, manifest.roles);
  note("quarters", state.quarters, manifest.quarters ?? []);
  note("stations", state.stations, manifest.stations ?? []);
  note("rim", state.rim, manifest.rim);
  state.elementKinds = clone(manifest.elementKinds);
  state.tieKinds = clone(manifest.tieKinds);
  state.roles = clone(manifest.roles);
  state.quarters = clone(manifest.quarters ?? []);
  state.stations = clone(manifest.stations ?? []);
  if (manifest.rim) state.rim = clone(manifest.rim);
  else delete state.rim;
  for (const c of state.conditions) {
    const m = manifest.conditions.find((x) => x.id === c.id);
    if (!m) throw new Error(`manifest lacks condition ${c.id}`);
    note(`condition ${c.id}`, [c.title, c.turn], [m.title, m.turn ?? ""]);
    c.title = m.title;
    c.turn = m.turn ?? "";
  }
  const canon: Canon = {
    ...baseCanon,
    layers: clone(state.layers),
    beyond: clone(state.beyond),
    conditions: clone(state.conditions),
    quarters: clone(state.quarters),
    stations: clone(state.stations),
    ...(state.rim ? { rim: clone(state.rim) } : { rim: undefined }),
    threadKinds: clone(state.threadKinds),
    elementKinds: clone(state.elementKinds),
    tieKinds: clone(state.tieKinds),
    roles: clone(state.roles),
  };
  return { state, canon, changed };
}

/* ---------- merging explanations and readings ---------- */

export interface Explanations {
  layers?: unknown;
  threadKinds?: unknown;
  elements?: unknown;
  beyond?: unknown;
  readings?: unknown;
}

function entries(v: unknown): [Id, string][] {
  if (Array.isArray(v)) {
    return v.flatMap((x) => (x && typeof x === "object" && typeof x.id === "string" && typeof x.explanation === "string" ? [[x.id, x.explanation] as [Id, string]] : []));
  }
  if (v && typeof v === "object") {
    return Object.entries(v as Record<string, unknown>).flatMap(([id, x]) =>
      typeof x === "string" ? [[id, x] as [Id, string]] : x && typeof x === "object" && typeof (x as { explanation?: unknown }).explanation === "string" ? [[id, (x as { explanation: string }).explanation] as [Id, string]] : [],
    );
  }
  return [];
}

export interface MergeResult {
  state: SanctumState;
  canon: Canon;
  applied: string[];
  refused: { what: string; refusals: Refusal[] }[];
}

/** Each explanation and reading passes the validator on its own; refused ones are reported and left out. */
export function mergeExplanations(base: SanctumState, baseCanon: Canon, data: Explanations): MergeResult {
  let state = clone(base);
  let canon = clone(baseCanon);
  const applied: string[] = [];
  const refused: MergeResult["refused"] = [];
  const tryOps = (what: string, ops: Op[]) => {
    const { state: next, refusals } = applyOps(state, ops);
    const all = refusals.length ? refusals : validate(next, canon);
    if (all.length) refused.push({ what, refusals: all });
    else {
      state = next;
      applied.push(what);
    }
  };
  for (const [id, text] of entries(data.layers)) tryOps(`layer ${id}`, [{ op: "setText", target: { type: "layer", id }, field: "explanation", value: text }]);
  for (const [id, text] of entries(data.threadKinds)) tryOps(`kind ${id}`, [{ op: "setText", target: { type: "kind", id }, field: "explanation", value: text }]);
  for (const [id, text] of entries(data.elements)) tryOps(`element ${id}`, [{ op: "setText", target: { type: "element", id }, field: "explanation", value: text }]);
  if (typeof data.beyond === "string") tryOps("beyond", [{ op: "setText", target: { type: "beyond" }, field: "explanation", value: data.beyond }]);
  const readings = Array.isArray(data.readings) ? data.readings : [];
  readings.forEach((raw: unknown) => {
    const r = raw as Partial<Reading> & { lights?: Partial<Reading["lights"]> };
    const what = `reading ${String(r?.id)}`;
    if (!r || typeof r.id !== "string" || typeof r.title !== "string" || typeof r.text !== "string" || !r.lights) {
      refused.push({ what, refusals: [{ rule: "shape", message: "The reading has lost its form." }] });
      return;
    }
    const existing = state.readings.find((x) => x.id === r.id);
    const reading: Reading = {
      id: r.id,
      title: r.title,
      text: r.text,
      lights: { layers: r.lights.layers ?? [], threadKinds: r.lights.threadKinds ?? [], elements: r.lights.elements ?? [] },
      order: existing ? existing.order : state.readings.length,
      locked: true,
    };
    const next = clone(state);
    next.readings = existing ? next.readings.map((x) => (x.id === r.id ? reading : x)) : [...next.readings, reading];
    const nextCanon: Canon = { ...canon, readings: clone(next.readings.filter((x) => x.locked)) };
    const refusals = validate(next, nextCanon);
    if (refusals.length) refused.push({ what, refusals });
    else {
      state = next;
      canon = nextCanon;
      applied.push(what);
    }
  });
  return { state, canon, applied, refused };
}
