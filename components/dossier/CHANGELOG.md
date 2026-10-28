# dossier changelog

## Unreleased

- Sync (`docs/SYNC.md`): `evoview.json` (`requires` foundation `>=1.9.0 <2`,
  controls `>=1.5.0 <2`); `install.sh` wraps `sync.sh` (clean plans only;
  local edits merged and recorded as patches, files removed upstream deleted).
- Config changes: new client-owned `src/dossier.theme.css` (accent tokens,
  `--dossier-z`, `--dossier-reserve-bottom`), imported by `index.ts` after
  `dossier.css`; created by the next sync, never overwritten. Existing config
  untouched; built CSS unchanged.
- Docs: ownership sections (RULES §13).
- API (additive): exported variation arrays `DOSSIER_CHAPTER_VARIANTS`,
  `CHAPTER_ROWS_SURFACES` (new types `DossierChapterVariant`,
  `ChapterRowsSurface`). No config change.

## 1.5.0

Requires `foundation` ≥ 1.9.0 and `controls` ≥ 1.5.0 (press jelly). No
config changes.

- Behaviour: mobile dock items and the toast action take the press jelly
  (RULES §6); close / pager / plates through controls. Board tiles and the
  strip's flat cells are unchanged.
- CSS: `.evd-dock__item:active` keeps only its tint (the
  `translate3d(0, 1px, 0) scale(.965)` and the springy `transform`
  transition are gone); `.evd-toast__action` lost its `:active` translate.

## 1.4.0

Crawlable views (`docs/CRAWLABLE-MODALS.md`): every view has a URL and its
server HTML carries the view's copy. Requires `foundation` ≥ 1.6.1 and
`controls` ≥ 1.3.0. The look is unchanged (before/after screenshots at 1440
and 390 are pixel-identical except timing frames).

API:
- New `dossierRoutes: ModalRoutes<DossierConfig, DossierView>`, `type
  DossierView = { item: string; entry?: string }` (keys `item`,
  `item/entry`; ids are URL slugs).
- `<Dossier>` is controlled (`DossierRouteProps`): `view` (null = closed),
  `onNavigate`, `hrefFor?`, `history?`. Tiles, strip, pager, dock, toast,
  Escape, backdrop, close and Back / Forward all call `onNavigate`; history
  is foundation `useRouteHistory` (one entry per level). Keep it mounted
  while closed.
- Legacy props `open` / `onClose` / `initialItemId` / `initialEntryId`
  (`DossierLegacyProps`, used when `view` is omitted) keep working, mapped
  onto an internal view, no URLs. Deprecated; removed in 2.0.
- `SelectionBoard`: new `hrefFor?(index)` (tiles become `<a href>`);
  `registerTile` now receives `HTMLElement | null` (was
  `HTMLButtonElement | null`).
- New exports: `dossierRoutes`, `DossierView`, `DossierRouteProps`,
  `DossierLegacyProps`.

Config (optional, additive): `DossierItem.description?`,
`DossierEntry.description?` (head description, cut to 160 characters),
`DossierMedia.alt?` (head image alt; the board tile stays decorative). The
reference config sets entry descriptions (story lead + body) and media alt.

Markup and behaviour:
- Server-renderable: no environment read in render (server layout =
  desktop), `data-ev-route-layer` on the root; `inert`, `aria-hidden`, the
  loader and the body lock only after hydration.
- Copy mounted, media gated: on a first open the target view's copy mounts
  at once in `HeldCopy` (animations paused, no video source), not shown once
  hydrated, and remounts live when its media are decoded, so the body looks
  and enters exactly as before. Switches still keep the previous view until
  the next one's media are decoded.
- One h1 per view: the header title (overview `copy.overviewTitle`, entry
  label). `.evd-header__meta` is a `div`; the overview's phone readout is an
  aria-hidden sibling of the h1. The detail carries an sr-only h2 with the
  entry title (it names the detail region). Tile captions are no longer
  aria-hidden (the tile's name is still `copy.openEntry`).
- Real links: with `hrefFor`, tiles, `Sommaire`, strip tabs, pager orbs
  (controls `PagerOrb href`), dock buttons and the completion toast are
  `<a href>` with the in-page handler on a plain click; modified clicks open
  the URL. Close stays a button. Without `hrefFor`: buttons, as before.
- Chapters below the intro hide while pending only once hydrated
  (`data-pending`; was the absence of `data-revealed`).
- Focus: closing returns focus to the launcher (React's commit-phase focus
  restore used to take it back to the close button, then it fell to
  `body`); going back to an overview (Escape, `Sommaire`, browser Back)
  refocuses the tile you came from.
- CSS: `.evd-toast button` → `.evd-toast .evd-toast__action`;
  `.evd-tile[aria-disabled="true"]`; `.evd-body [data-waiting]`;
  `.evd-chapter[data-pending]`; link resets for the view links.

## 1.3.0

Requires `foundation` ≥ 1.5.0 (`TextFill`) and `controls` ≥ 1.2.0. No config
changes, no API changes.

- Behaviour: text colour switches take the liquid fill (RULES §1): strip tab
  labels (rest → past → active, hover), the overview link (label and arrow),
  tile index and kicker (hover from 1024 with hover, cycle focus on touch),
  dock icon and label (touch press). The active tab's number keeps following
  its accent badge.
- Behaviour: the completion toast's hover plate pours in (foundation
  `SurfaceFill`).
- CSS: those rules no longer set `color`; backgrounds and opacity still
  transition.

## 1.2.0

Text lists on tonal surfaces (RULES §3; uses foundation 1.3.0
`--ev-surface-list*`, with fallbacks):
- `ChapterRows`: one rounded panel, rows alternating a step, label · detail
  on one line from 768; placed straight on a chapter rail it sits under the
  heading's copy column from 1024. New `surface` prop: `"rows"` (default) or
  `"tiles"` (one rounded tile per item).
- `ChapterSpecimen` with rows: the paper card is the panel — rows edge to
  edge, banding a step down; the example note closes the card.
- `ChapterPayoff` results: peer tiles; on phones one joined panel, value ·
  label on one line, rows alternating.
- Surfaces resolve per chapter tone (`--dossier-list` / `--dossier-list-alt`
  on `.evd-chapter`: a, b and paper each step off their own ground). No
  borders, same text ladder.

Config / API changes: `ChapterRows` gains `surface?: "rows" | "tiles"`
(default `"rows"`); `ChapterRowsProps` exported. The reference config is
unchanged (practical info and specimens use the default).

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
