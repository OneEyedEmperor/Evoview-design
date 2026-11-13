/* The sanctum model: the shape the endpoints return and the ops accept.
   Content-free on purpose. Every identifier, title, colour and rule of the
   map lives in the private state; code only knows the shape and reads
   meaning from fields (CONTRACT.md). Never add a map id or word here. */

export const SCHEMA_VERSION = 2;

/** The realm outside the layers (an element that stands in no layer). */
export const BEYOND = "beyond";
/** Tie end for the lexicon of cord kinds. */
export const LEXICON = "lexicon";

export type Id = string;
/** Reference to a layer itself, e.g. as the target of a cord. */
export type LayerRef = `layer:${string}`;
/** Reference to a cord kind, e.g. as the target of a tie. */
export type KindRef = `cord:${string}`;
/** A cord runs between elements, or to a layer where the map says so. */
export type ThreadEnd = Id | LayerRef;
export type TieEnd = Id | LayerRef | KindRef | typeof LEXICON;

export interface Colour {
  name: string;
  hex: string;
}

/** A titled passage of the map (the threshold, the lexicon, a realm...). */
export interface Passage {
  title: string;
  purpose: string;
  explanation: string;
}

export interface Layer extends Passage {
  id: Id;
  nature: string[];
  colour: Colour;
  /** 0 = rim ... last = core. Fixed. */
  order: number;
  /** Most elements the layer may hold. */
  capacity: number;
}

/** The realm beyond the layers. Same shape as a layer, without order. */
export interface Beyond extends Passage {
  id: typeof BEYOND;
  nature: string[];
  colour: Colour;
  capacity: number;
}

/** A condition of the map. One is sealed (`state.condition`, changed only by
    the `turn` op); `sight.condition` is the one viewed (a foresight when it differs). */
export interface Condition {
  id: Id;
  title: string;
  /** The record's words when the map is turned into this condition. */
  turn: string;
  explanation: string;
}

/** A direction of the rim; quartered elements fall into one. */
export interface Quarter {
  id: Id;
  title: string;
  /** Position around the rim. */
  order: number;
}

/** A placement hint: drawn on the boundary between two layers. */
export interface Station {
  id: Id;
  title: string;
  between: [Id, Id];
}

/** The rim's ring rules. */
export interface Rim {
  /** The layer the ring stands in. */
  realm: Id;
  /** Element kind that forms the ring. */
  stoneKind: Id;
  /** Cord kind binding rim neighbours: exactly one closed ring through every bound element, in rim order. */
  ringKind: Id;
  /** Cord kind of which each quarter holds exactly one, departing from an element of that quarter. */
  crossingKind: Id;
  /** Words of the ring cords the map derives. */
  ring: { label: string; purpose: string };
  /** The record's words when an awaiting element is bound ("{title}" is replaced). */
  firstBinding: string;
}

/** A whole-map interpretation, shown as one semantic layer lighting exactly `lights`. */
export interface Reading {
  id: Id;
  title: string;
  text: string;
  lights: { layers: Id[]; threadKinds: Id[]; elements: Id[] };
  order: number;
  /** Canonical: cannot be removed; its lights are sealed. */
  locked: boolean;
}

/* ---------- rules (data, interpreted by validate.ts) ---------- */

/** Matches an element. Every given constraint must hold; `{}` = any element. */
export interface ElementSelector {
  ids?: Id[];
  kinds?: Id[];
  /** Realm ids: layer ids or BEYOND. */
  realms?: Id[];
  /** Stands in one of the layers (not beyond). */
  inLayers?: boolean;
  condition?: Id;
  not?: Id[];
}

/** Matches one end of a cord: an element, or a layer itself. */
export interface EndSelector {
  element?: ElementSelector;
  layers?: Id[];
}

export interface Course {
  from: EndSelector;
  to: EndSelector;
}

export interface Grammar {
  /** A cord of the kind must follow one of these courses. */
  courses: Course[];
  /** Every cord of the kind carries this condition. */
  condition?: Id;
  /** Cords of the kind run both ways (`thread.bidirectional`). */
  bidirectional?: boolean;
  /** Cords of the kind can never be removed (`thread.irreversible`). */
  irreversible?: boolean;
  min: number;
  max: number;
  /** The rule in the map's tongue, shown when a course is refused. */
  refusal: string;
}

export type Flow = "along" | "both" | "still";

export interface ThreadKind {
  id: Id;
  title: string;
  purpose: string;
  /** Its course in words, as the lexicon gives it. */
  course: string;
  colour: Colour;
  /** Has a direction (from → to). False: drawn as a tie between equals. */
  directed: boolean;
  /** How signs travel: along from → to, both ways, or held still. */
  flow: Flow;
  /** Position in the lexicon. */
  order: number;
  /** Never dims below faint, whatever the sight. */
  steadfast?: boolean;
  grammar: Grammar;
  explanation: string;
}

export interface TieKind {
  id: Id;
  /** Phrase read from → to. */
  title: string;
  /** Phrase read to → from, when the map gives one. */
  inverse?: string;
  symmetric?: boolean;
}

export interface RealmRule {
  realms?: Id[];
  inLayers?: boolean;
  /** Stands in its parent's realm. */
  parentRealm?: boolean;
  /** The rule holds only for an element carrying this condition. */
  condition?: Id;
}

export interface ElementKind {
  id: Id;
  title: string;
  /** An element's realm must satisfy one of these. */
  realms: RealmRule[];
  /** Elements of the kind have a parent matching this, joined by `tie`. */
  parent?: { select: ElementSelector; tie: Id };
  /** Elements of the kind carry a condition. */
  conditional?: boolean;
  /** Ties every element of the kind carries (made when it is added). */
  ties?: { kind: Id; to: TieEnd }[];
  capacity: number;
  /** Elements of this kind may be added through the console. */
  addable: boolean;
  /** Elements carry a quarter: always, or when given. */
  quarter?: "required" | "optional";
  /** New elements of this kind are raised only in this sealed condition. */
  raisedIn?: { condition: Id; refusal: string };
  /** On the turn into `on`, unlocked elements of this kind become `kind` in `realm`,
      awaiting binding, held by a tie of kind `tie` to `to`. Their room is kept in advance. */
  becomes?: { on: Id; kind: Id; realm: Id; tie: Id; to: Id; refusal: string };
}

/* ---------- the map ---------- */

export type Emphasis = 0 | 1 | 2;

export interface Element {
  /** Immutable slug. */
  id: Id;
  title: string;
  kind: Id;
  /** A layer id or BEYOND. */
  realm: Id;
  parent?: Id;
  condition?: Id;
  /** Its quarter of the rim. */
  quarter?: Id;
  /** Placement hint (`state.stations`); layout honours it. */
  station?: Id;
  /** Come to rest but not yet bound (holds by a tie; outside the ring; takes no cord). */
  awaiting?: boolean;
  /** One sentence. */
  purpose: string;
  nature: string[];
  explanation: string;
  /** Mirrors `visions[].subjects`; the first is the primary vision. */
  visions: Id[];
  /** 0 quiet, 1 as is, 2 heightened. */
  emphasis: Emphasis;
  /** Position within its realm, 0-based, contiguous. */
  order: number;
  /** Canonical: cannot be removed; title and purpose are sealed. */
  locked: boolean;
}

export interface Thread {
  id: Id;
  kind: Id;
  from: ThreadEnd;
  to: ThreadEnd;
  /** Its function. */
  label: string;
  purpose: string;
  explanation: string;
  condition?: Id;
  bidirectional: boolean;
  irreversible: boolean;
  locked: boolean;
}

/** Structural relation: drawn as structure, carries no flow. */
export interface Tie {
  id: Id;
  kind: Id;
  from: TieEnd;
  to: TieEnd;
  locked: boolean;
}

export type VisionFormat = "avif" | "webp";

export interface VisionSubject {
  elementId: Id;
  /** Focal point, 0..1 from the left / top of the picture. */
  x: number;
  y: number;
  /** 1 = the whole picture ... 4. */
  zoom: number;
}

/** What the files of a brought vision give (before it enters the map). */
export interface VisionFiles {
  id: Id;
  width: number;
  height: number;
  /** Derived widths, ascending. */
  sizes: number[];
  formats: VisionFormat[];
  /** Average colour, `#rrggbb`. */
  tone: string;
  /** Tiny blurred image as a data URI, for the veil before decode. */
  placeholder: string;
  broughtAt: string;
}

export interface Vision extends VisionFiles {
  title: string;
  subjects: VisionSubject[];
}

/** Preferences of the sight. Unlit = dimmed, never removed. */
export interface Sight {
  /** Lit realms: layer ids and/or BEYOND. */
  layers: Id[];
  /** Lit cord kinds. */
  kinds: Id[];
  condition: Id;
  /** The reading shown, or none. */
  reading: Id | null;
  explanations: boolean;
  flow: boolean;
  /** The both-ways cord rehearses its shared rhythm. */
  rehearsal: boolean;
}

export interface Roles {
  /** The element at the core: every element in a layer must reach it. */
  core: Id;
  /** The element the inward cords meet, short of the core. */
  apex: Id;
  /** Elements that take no vision. */
  unseen: Id[];
  /** The element whose office turns the sealed condition. */
  turner: Id;
}

export interface Meta {
  schemaVersion: typeof SCHEMA_VERSION;
  version: number;
  updatedAt: string;
  summary: string;
}

export interface SanctumState {
  meta: Meta;
  threshold: Passage;
  lexicon: Passage & { colour: Colour };
  layers: Layer[];
  beyond: Beyond;
  conditions: Condition[];
  /** The sealed condition. Cords carrying another condition are quiet. */
  condition: Id;
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
  visions: Vision[];
  sight: Sight;
}

/* ---------- ops ---------- */

export type TextTargetType = "element" | "thread" | "layer" | "beyond" | "kind" | "condition" | "vision" | "lexicon" | "threshold" | "reading";
export type TextField = "title" | "purpose" | "explanation" | "nature" | "label" | "text";

export interface TextTarget {
  type: TextTargetType;
  /** Omitted for beyond, lexicon, threshold. */
  id?: Id;
}

export interface NewElement {
  id: Id;
  title: string;
  kind: Id;
  realm: Id;
  parent?: Id;
  condition?: Id;
  quarter?: Id;
  purpose: string;
  nature?: string[];
  /** Defaults to the purpose. */
  explanation?: string;
}

export interface NewThread {
  /** Given by the server when omitted (`<kind>-<n>`). */
  id?: Id;
  kind: Id;
  from: ThreadEnd;
  to: ThreadEnd;
  label: string;
  purpose: string;
  explanation?: string;
}

export interface NewReading {
  id: Id;
  title: string;
  text: string;
  lights: Reading["lights"];
}

export type Op =
  | { op: "setText"; target: TextTarget; field: TextField; value: string | string[] }
  | { op: "addReading"; reading: NewReading }
  | { op: "removeReading"; id: Id }
  | { op: "setReadingLights"; id: Id; lights: Reading["lights"] }
  | { op: "addElement"; element: NewElement }
  | { op: "removeElement"; id: Id }
  | { op: "addThread"; thread: NewThread }
  | { op: "removeThread"; id: Id }
  | { op: "addVision"; visionId: Id; title: string }
  | { op: "removeVision"; visionId: Id }
  | { op: "assignVision"; visionId: Id; elementId: Id; x?: number; y?: number; zoom?: number; primary?: boolean }
  | { op: "unassignVision"; visionId: Id; elementId: Id }
  | { op: "setVisionSubject"; visionId: Id; elementId: Id; x: number; y: number; zoom: number }
  | { op: "reorderWithinLayer"; realm: Id; order: Id[] }
  | { op: "setEmphasis"; id: Id; emphasis: Emphasis }
  | { op: "setSight"; sight: Partial<Sight> }
  /** The turner's office: seal another condition (taken elements come to rest per `becomes`). */
  | { op: "turn"; condition: Id }
  /** Bind an awaiting element into the ring. */
  | { op: "firstBinding"; id: Id };

export type OpName = Op["op"];

/* ---------- refusals and responses ---------- */

export type RuleId =
  | "shape"
  | "fixed"
  | "canonical"
  | "grammar"
  | "no-dead-space"
  | "reach"
  | "kind-realm"
  | "capacity"
  | "text"
  | "purity"
  | "sealed-name"
  | "vision"
  | "sight"
  | "reading"
  | "rim"
  | "condition"
  | "apart"
  | "op"
  | "moved";

export interface Refusal {
  rule: RuleId;
  /** In the map's tongue, ready to show. */
  message: string;
  /** Index of the op that met the refusal, when one did. */
  op?: number;
  subject?: { type: "element" | "thread" | "tie" | "layer" | "kind" | "vision" | "reading" | "sight" | "map"; id?: Id };
}

export interface Diff {
  readings: { added: Id[]; removed: Id[]; changed: Id[] };
  elements: { added: Id[]; removed: Id[]; changed: Id[] };
  threads: { added: Id[]; removed: Id[]; changed: Id[] };
  ties: { added: Id[]; removed: Id[] };
  visions: { added: Id[]; removed: Id[]; changed: Id[] };
  /** Layers, kinds, lexicon, threshold, beyond or conditions whose words changed. */
  passages: string[];
  sight: boolean;
  /** The sealed condition turned. */
  condition: boolean;
}

export interface ChangeRequest {
  ops: Op[];
  /** Apply and check without sealing. */
  dryRun?: boolean;
  /** The `meta.version` the ops were made against. Required to seal. */
  baseVersion?: number;
  /** Pure-language summary for the record; composed from the ops when omitted. */
  summary?: string;
}

export type ChangeResponse =
  | { accepted: true; sealed: boolean; state: SanctumState; diff: Diff; summary: string }
  | { accepted: false; refusals: Refusal[]; version: number };

export interface RecordEntry {
  version: number;
  at: string;
  summary: string;
  /** Set when the entry restored an earlier one. */
  restoredFrom?: number;
  /** Number of ops in the change (0 for the seed and restores). */
  ops: number;
  /** The kinds of op sealed, in order (changes sealed through the endpoint). */
  opNames?: OpName[];
  /** Canon entries written by the trusted tools (seed, explanations, rules, rulings). */
  trusted?: "seed" | "merge" | "rules" | "amend";
  /** Computed when the record is read: the moment can be restored under the canon and rules as they stand. */
  restorable?: boolean;
  /** Why it cannot, in the keeper's voice (set when `restorable` is false). */
  unrestorable?: string;
}

export interface SessionResponse {
  entered: boolean;
  /** Seconds the gate rests after repeated refusals. */
  rest?: number;
}
