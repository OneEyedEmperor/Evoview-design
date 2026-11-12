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
  core), `.unseen` (elements that take no vision: never show a vision slot).
- Layer order: `layers[].order` (0 = rim, last = core). `BEYOND` is the realm
  outside the layers (`state.beyond`).
- Cord semantics: `threadKinds[].directed`, `.flow` (`along` = signs travel
  from → to, `both`, `still`), `.colour`, `.steadfast` (never dims below
  faint), `.grammar.condition` (kind exists only in that condition),
  `.grammar.irreversible`, `.grammar.bidirectional`.
- An element with states: elements whose `parent` is it and whose kind is
  `conditional`; each carries `condition`. Cords touching a state carry the
  same `condition`. Cords whose `condition` is unset or equals
  `sight.condition` are present; the others belong to the other condition.
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
| `addElement` | `element: NewElement` | kind must be `addable`; order appended; parent tie and kind ties made |
| `removeElement` | `id` | unlocked only, no children; its unlocked cords, ties and vision subjects go with it |
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

- Layers, beyond, conditions and every kind table equal the seed: nothing
  added, removed, reordered or renamed. `roles` fixed.
- Canonical (locked) elements, cords and ties equal the seed except their
  `explanation`, `nature`, `visions`, `emphasis`, `order`.
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
(`unknown | gate | gathering | open`), `state`, `preview` (dry-run result),
`refusals`, `record`; actions `enter`, `leave`, `gather`, `preview(ops)`,
`seal(ops, summary?)`, `restore(version, dryRun?)`, `loadRecord`,
`bringVision(blob)`. `checkLocally(state, ops)` runs the same engine for
instant feedback. Media: `visionSrcSet(files, format)`, `visionUrl(id, w, f)`.

## Route entry

`/sanctum` (lazy, outside the library layout). The entry renders the gate
until entered, then lazy-loads `src/sanctum/sight/index.tsx`, whose default
export receives `{ store }`. Nothing of the map loads before entry.
