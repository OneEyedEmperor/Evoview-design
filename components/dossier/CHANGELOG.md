# dossier changelog

## 1.1.2

- `--dossier-reserve-bottom` now defaults to the generic
  `--ev-modal-reserve-bottom` (shared with the `process-sequence` step
  dossier), then 0. A host sets one variable for both modals; an explicit
  `--dossier-reserve-bottom` still wins. Client default unchanged (0). No
  config changes.

## 1.1.1

- Requires `foundation` 1.2.0. The idle preload uses `preloadMedia`, so
  preloaded universes open and switch with the gate ready on its first
  render (no hold, no grace gap). No config changes.

## 1.1.0

Fixes (the "loads only half of the time" report):
- A universe's first visit (open, pager, dock) cut to an empty body for the
  350 ms grace, then a loader until its media arrived; revisits were
  instant. The body now keeps the previous view (inert, dimmed after 140 ms)
  until the next one is decoded, the dark cut plays when the board actually
  changes, and `<Dossier>` warms every item's board images on idle
  (`preload`, default on).
- Every entry open faded up from nothing for 0.15–0.5 s (detail entrance ×
  intro-chapter reveal). The intro chapter now enters with the detail; the
  detail fades from .35.
- Chapters skipped by a jump (End, scrollbar drag, the toast) stayed at
  opacity 0. The reveal is driven by the body's scroll position (top past
  90 % of the body), and every pending chapter above that line reveals too;
  no IntersectionObserver against the viewport.
- Reopening during the exit animation resumed the closing layer (previous
  item/entry, `initialItemId` ignored, no history entry, Back left the
  route). Every open now mounts a fresh layer.
- The page stayed inert and scroll-locked for the whole exit animation; it
  is released when the exit starts (the fading layer lets clicks through),
  and the layer is removed after 700 ms even without `animationend`.
- The content vanished as the shell left (the gate reset on close); it stays
  through the exit.
- Entrances fill backwards only (tiles, detail, chapters): content is
  visible even if an animation never runs.
- The completion toast sat under the current tab; it now sits under the tab
  it opens (under the last tab when it leaves for the next universe).

Visual (RULES §3):
- No rules: chapter seams, row hairlines, results top rule, loader head rule,
  header bottom border, strip bottom border, `Sommaire` and tab separators,
  header and dock dividers removed. The strip's per-tab track is its one line.
- Specimen without the `Exemple` label (the note says it); rows unnumbered
  unless they are a sequence.

Config / API changes:
- `ChapterRows`: `numbered` now defaults to `false`; pass `numbered` for a
  real sequence. The `evd-rows--plain` class is gone (`evd-rows--numbered`
  marks the numbered variant).
- `ChapterSpecimen`: `label` prop removed — delete it from configs; keep
  `note`.
- Reference config: overview `kicker` no longer repeats the brand
  (`"Expériences"` / `"Experiences"`); specimen and facts rows unnumbered.
- New `<Dossier preload>` prop (default `true`); new CSS knob
  `--dossier-reserve-bottom` (default 0).
- `DossierChapter` outside a dossier body renders revealed (no choreography).

## 1.0.2

- The inert walk skips elements carrying `data-ev-keep-interactive` (host
  dev/showcase chrome, e.g. the library's floating accent palette). Client
  behaviour unchanged. No config changes.

## 1.0.1

- Requires `controls` 1.1.0: initial focus goes to the close button through
  its `ref` (no `querySelector`). No config changes.

## 1.0.0

- First release on `foundation` 1.0.0 + `controls` 1.0.0: `Dossier` (portal
  modal), `SelectionBoard`, `DossierLoader`, open chapters (`DossierChapter`,
  `ChapterHead`, `ChapterFigure`, `ChapterSplit`, `ChapterRows`,
  `ChapterSpecimen`, `ChapterPayoff`).
- Config: `dossier.config.tsx` — `brand`, `kicker`, `items[] { id, label,
  accent?, accentInk?, entries[4] { id, title, label?, kicker?, media,
  sources?, content(ctx) } }`, `attribution { enabled, href, label }`,
  `copy` (FR / EN). `buildDossierConfig(locale)`, `dossierCopy(locale)`.
- Reference content: Maison Ardoise (fictional restaurant), 3 × 4 entries.
