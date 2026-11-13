# Sanctum contract

Types: `types.ts`. Engine: `validate.ts` (invariants), `ops.ts` (apply ops),
shared by server and client. Server: `server/sanctum/`. Client data layer:
`src/sanctum/data/`.

## Privacy rule for every builder

The repo is publicly fetchable. No map content in any committed file: no
element, layer or cord id, title, purpose, colour or rule. Code reads meaning
from fields, never from ids. Content reaches the browser only through the
endpoints below, after entry.

- Roles: `state.roles.core` (the element at the core; every element in a
  layer reaches it), `.apex` (the element the inward cords meet short of the
  core), `.unseen` (elements that take no vision: never show a vision slot),
  `.turner` (the element whose office turns the sealed condition).
- Sealed condition: `state.condition`, changed only by the `turn` op; its
  record words are `conditions[].turn`. `sight.condition` is the condition
  viewed (a foresight when it differs). `isQuiet(state, thread, condition?)`:
  a cord carrying another condition is quiet.
- Quarters: `state.quarters[]` (ordered around the rim); `element.quarter`.
  Stations: `state.stations[]` (`between: [layerId, layerId]`, drawn on that
  boundary); `element.station` is a placement hint the layout honours.
- Rim (`state.rim`): the ring of `ringKind` cords between rim neighbours is
  derived (`rimOrder`, `ringPairs`: by quarter, then order); each quarter holds
  exactly one `crossingKind` cord, from its canonical stone (a raised stone
  never carries one). `element.awaiting`: come to rest, not yet bound (held by
  a tie, outside the ring, no cords) until `firstBinding`.
- Layer order: `layers[].order` (0 = rim, last = core). `BEYOND` is the realm
  outside the layers (`state.beyond`).
- Cord semantics: `threadKinds[].directed`, `.flow` (`along` = signs travel
  from → to, `both`, `still`), `.colour`, `.steadfast` (never dims below
  faint), `.grammar.condition` (kind exists only in that condition),
  `.grammar.irreversible`, `.grammar.bidirectional`.
- An element with states: elements whose `parent` is it and whose kind is
  `conditional`; each carries `condition`. Cords touching a state carry the
  same `condition`. Cords whose `condition` is unset or equals the condition
  shown are active; the others are quiet.
- Children: elements sharing a `parent`, joined by the tie named in
  `elementKinds[].parent.tie`.
- Element colour = its realm's colour; cord colour = its kind's colour.
- Sight is a dim, never a removal: `sight.layers` / `sight.kinds` list what
  is lit; the rest dims (steadfast kinds stay at least faint), and no
  preference may make an element look isolated. `sight.reading` lights exactly
  that reading's `lights`. `sight.rehearsal`: the both-ways cord rehearses its
  shared rhythm.
- Readings (`state.readings`): whole-map interpretations, each one semantic
  layer; locked ones are canonical (lights sealed), up to four more may be
  added.
- Positions are computed from structure (realm, order, parent, counts,
  emphasis). Nothing stores coordinates.

## Endpoints

All under `/sanctum-api`, JSON unless noted. Every response carries
`X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store` (visions:
`private`). Every write (POST/DELETE) needs the entry cookie and the header
`X-Sanctum: 1`; a foreign `Origin` is refused. Not entered: `401 {"entered":false}`,
nothing else.

| Method | Path | Body | Answer |
| --- | --- | --- | --- |
| GET | `/session` | | `{entered}` |
| POST | `/session` | `{watchword}` | `200 {entered:true}` + cookie; `401 {entered:false}`; `429 {entered:false, rest}` (seconds) |
| DELETE | `/session` | | `{entered:false}`, cookie cleared, entry revoked |
| GET | `/map` | | `SanctumState` |
| POST | `/changes` | `ChangeRequest` | `ChangeResponse`: `200 accepted`, `422` refusals, `409` moved |
| GET | `/record` | | `{entries: RecordEntry[]}` newest first |
| GET | `/record/:version` | | `SanctumState` as sealed then |
| POST | `/restore` | `{version, baseVersion, dryRun?}` | `ChangeResponse` (a restore seals a new entry) |
| POST | `/visions` | raw image, `Content-Type: image/png\|jpeg\|webp`, ≤ 30 MB | `{files: VisionFiles}` (not yet in the map) |
| GET | `/visions/:id/:width.:format` | | image, `format` ∈ `files.formats`, `width` ∈ `files.sizes` |

Cookie: HttpOnly, Secure, SameSite=Strict, Path=/sanctum-api, HMAC-signed,
expires; the gate rests with growing backoff after refusals.

## Changes

`POST /changes {ops, dryRun?, baseVersion, summary?}`

- Ops apply in order to a copy; then every invariant runs on the result.
- `dryRun: true`: nothing is sealed; answer has the would-be `state` and a
  `diff` (ids added / removed / changed) for a ghosted preview.
- Sealing needs `baseVersion === meta.version`, else `409` with
  `rule: "moved"` (gather the map again).
- Accepted: `meta.version + 1`, appended to the record with `summary` (pure
  language, ≤ 160; composed from the ops when omitted).
- Refused: `422 {accepted:false, refusals}`. Each refusal has `rule`, a
  ready-to-show `message` in the map's tongue, and `op` / `subject` when known.
- At most 64 ops per change.

### Ops

| Op | Fields | Notes |
| --- | --- | --- |
| `setText` | `target {type, id?}`, `field`, `value` | see matrix below; `nature` takes `string[]` |
| `addElement` | `element: NewElement` | kind must be `addable`; `quarter` where the kind asks; only in `raisedIn.condition`; order appended; parent tie and kind ties made; a rim stone re-derives the ring (needs no cord) |
| `removeElement` | `id` | unlocked only, no children; its unlocked cords, ties and vision subjects go with it; the ring re-derives |
| `addThread` | `thread: NewThread` | `bidirectional` / `irreversible` from the grammar; `condition` from the grammar or a state end; id `<kind>-<n>` when omitted |
| `removeThread` | `id` | unlocked and not irreversible |
| `addVision` | `visionId`, `title` | files from `POST /visions` enter the map |
| `removeVision` | `visionId` | only when set on no element (files stay for the record) |
| `assignVision` | `visionId`, `elementId`, `x? y? zoom? primary?` | defaults 0.5, 0.5, 1; refused for `roles.unseen` |
| `unassignVision` | `visionId`, `elementId` | |
| `setVisionSubject` | `visionId`, `elementId`, `x`, `y`, `zoom` | x, y ∈ [0, 1], zoom ∈ [1, 4] |
| `reorderWithinLayer` | `realm`, `order: Id[]` | a permutation of the realm's elements |
| `setEmphasis` | `id`, `emphasis` | 0, 1 or 2 |
| `setSight` | `sight: Partial<Sight>` | ids must exist |
| `addReading` | `reading: NewReading` | unlocked; at most four beside the canonical ones |
| `removeReading` | `id` | unlocked only |
| `setReadingLights` | `id`, `lights` | unlocked only |
| `turn` | `condition` | the turner's office; seals `state.condition` (and `sight.condition`); on the turn into `becomes.on`, unlocked elements of that kind come to rest: new kind and realm, `awaiting`, cords dropped, held by `becomes.tie` |
| `firstBinding` | `id` | an awaiting element joins the ring between its quarter neighbours |

`setText` matrix (locked = canonical):

| Target | Fields |
| --- | --- |
| `element` | `explanation`, `nature`; `title`, `purpose` when unlocked |
| `thread` | `explanation`; `label`, `purpose` when unlocked |
| `layer`, `beyond` | `explanation`, `nature` |
| `kind`, `condition`, `lexicon`, `threshold` | `explanation` |
| `vision` | `title` |
| `reading` | `title`, `text` |

## Invariants (server authority; the client mirror runs the same engine)

- Layers, beyond, conditions, quarters, stations, rim and every kind table
  equal the canon: nothing added, removed, reordered or renamed. `roles` fixed.
  The canon changes only through the trusted tools (merge, rules, amend), each
  a record entry.
- Canonical (locked) elements, cords and ties equal the canon except their
  `explanation`, `nature`, `visions`, `emphasis`, `order`.
- Sealed condition is one of `conditions`; kinds with `raisedIn` hold no
  unlocked element outside it; what `becomes` keeps its room in advance.
- Rim: exactly one closed ring of `ringKind` cords through every bound rim
  element in rim order (no other binding between rim elements); exactly one
  `crossingKind` cord per quarter; quarters where kinds ask; awaiting elements
  touch no cord and hold by a tie.
- Every cord follows a course of its kind's grammar; condition, both-ways and
  irreversible flags agree with it; no twin cords; each kind within
  `grammar.min..max`.
- Element kind ↔ realm (`elementKinds[].realms`), parent rule and its tie,
  kind ties, condition only on conditional kinds.
- Capacity: each layer / beyond ≤ `capacity`; each element kind ≤ `capacity`.
- No dead space: every element touches at least one cord. Every element in a
  layer reaches `roles.core` along cords (both ways when `bidirectional` or
  the kind is not `directed`), ties, and from a layer to what it holds.
- Text: title ≤ 28, purpose one sentence ≤ 160, explanation ≤ 900, nature ≤ 8
  lines of ≤ 160, label ≤ 48, vision title ≤ 60, reading title ≤ 40, reading
  text ≤ 900, summary ≤ 160. Every text passes the purity lexicon
  (`server/sanctum/purity.ts`) and the sealed-name guard.
- Visions: `element.visions` mirrors `vision.subjects`; focal and zoom in
  bounds; `roles.unseen` elements hold none.
- Readings: lights name existing realms, kinds and elements; canonical ones
  stay (lights sealed); at most four unlocked.
- Sight: every id exists.

## Client data layer (`src/sanctum/data`)

`createSanctumStore()` / `useSanctum(store, select)`: status
(`unknown | gate | gathering | open`), `state`, `draft`, `record`, `brought`
(visions brought, not yet in the map), `busy`, `word` (last outcome in pure
words); actions `enter`, `leave`, `gather`, `loadRecord`, `recordAt(version)`,
`bringVision(blob)`, and the draft's. `select` must return a field, not a
fresh object.

### The draft (console writes, sight renders)

`draft`: `open`, `subject`, `ops`, `baseVersion`, `previewState` (would-be
map: local at once, the server's once confirmed), `diff`, `verdict
{state: empty|checking|accepted|refused, confirmed, refusals, summary}`,
`awaiting {slot, choices: AwaitChoice[]}` (what a tap may answer; a choice is
`{value: ThreadEnd}` or `{socket: {realm, order}}`, with `ok`, `why`),
`hover` (the end the console points at), `picked {slot, value, at}`,
`restoring` (version whose restore is previewed).

`openDraft(subject?)`, `closeDraft()` (withdraw), `setDraft({ops|subject|awaiting|hover})`
(new ops: local verdict at once, server dry run after a pause; a late answer
never overwrites a newer draft), `pick(value)` (the sight, on a tap while
`awaiting`), `seal(summary?)` (seals the ops or the restore; on `moved` the map
is gathered and the draft recomposed), `restore(version)`.

### Affordances (judged by the engine; pass `draft.previewState` when composing on pending ops)

- `slotsFor(state, partial, brought?)` → `{op, slots: Record<slot, Choice[]>,
  cords?, budgets?, bounds?}`; `Choice {value, title, ok, why?, count?}`. A
  slot appears once the slots it depends on are chosen. Covers every op,
  including `quarter` (with counts), `turn`, `firstBinding`.
- `cordEnds(state, kind, from?)`: departures, or destinations from `from`.
- `cordsFor(state, elementId)`: every cord that could touch it now.
- `room(state, {realm} | {elementKind} | {cordKind} | {readings: true})` →
  `{used, pending, capacity, free}`.
- `rimOrder`, `ringPairs`, `isQuiet`.

### Also

- Record entries: `opNames` (sealed changes), `restoredFrom` (restores),
  `trusted` (`seed | merge | rules | amend`: canon entries). Moments sealed
  before schema 2 stay readable and cannot be restored.
- Testing seals: `node scripts/sanctum-trial.mjs [--fresh]` makes a throwaway
  copy (`/root/.evoview-sanctum-trial`, its own test watchword in
  `trial-watchword`); serve it with `EVOVIEW_SANCTUM_DIR=/root/.evoview-sanctum-trial
  pnpm exec vite --port 37512 --strictPort --host 127.0.0.1`. Never seal tests on
  the real dir.
- `checkLocally(state, ops, brought)`: the same engine, for instant feedback.
- `litBy(state, reading)` → `{ layers, elements, threads }` (sets of ids): a
  cord lights when its kind is listed and both ends are lit; a layer end is lit
  when that layer or any element in it is lit (BRIEF §10).
- `ops.*` builders; `markFrom(title, taken)` for new marks.
- Media: `visionSrcSet(files, format)`, `visionUrl(id, w, format)`; reveal a
  vision only once decoded (`files.placeholder` and `files.tone` veil it until then).
- The keeper (voice of refusals and acceptances, BRIEF §10): the element with
  a tie whose `to` is `lexicon`. Read its title from the state; never name it
  in code. The turner (voice of the turn): `roles.turner`.

## Route entry and mounts

`/sanctum` (lazy, outside the library layout, never preloaded or linked).
`src/sanctum/index.tsx` renders the gate until entered, then lazy-loads:

- `src/sanctum/sight/index.tsx`: default export, `SightProps { store, console }`
  (Render owns). The sight places `console` wherever it belongs.
- `src/sanctum/console/index.tsx`: default export, `ConsoleProps { store }`
  (Console owns), passed to the sight as the `console` slot.

Both start as placeholders. Nothing of the map loads before entry.

### Gate markup (stable; restyle freely, keep the classes and words)

```
main.sanctum-gate
  form.sanctum-gate__form
    label.sanctum-gate__label[for=sanctum-watchword]   "Watchword"
    input#sanctum-watchword.sanctum-gate__field[type=password]
    button.sanctum-gate__enter[type=submit]           "Enter"
    p.sanctum-gate__words[role=status]                 "" | "The gate weighs the watchword."
                                                       | "The watchword is not received."
                                                       | "The gate rests. Return in a moment."
```

Styles: `src/sanctum/Gate.css` (functional only). While gathering:
`p.sanctum-gathering` "The sight is gathering.". Root: `div.sanctum-root[lang=en]`.
