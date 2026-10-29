# dossier changelog

## 1.11.0

Requires nothing new (foundation ≥ 1.13.0, unchanged).

Config changes (additive: existing configs keep compiling)
- `kicker` is optional. When it is omitted, empty or blank, no kicker
  element is rendered, so no gap and no empty node. The opening / overview
  title then sits centred in the header bar at every width. Before, a
  `kicker: ""` left an empty span whose 4px gap put the title 2px below the
  bar's centre (≥ 600). Omit it rather than set `""`.

Visual change for every client (RULES §1, no kicker tags)
- A detail view no longer shows its item's label as a kicker over the entry
  title; the title sits alone, centred in the bar (≥ 600; phones already
  showed one line).
  - The item stays on screen through the pager label (panorama), the
    chapter strip's way up and the dock's location glass.
  - For screen readers, it stays as a visually hidden label right after the
    h1, and the dialog's accessible name is now "<entry> <item>".
- Opening and overview views show `config.kicker` only when it is set,
  as before.

Measured on the showcase (title box centre minus bar centre):
- No kicker, ≥ 600: Δ 2.0 → 0.0.
- Details at 1440 / 1024: Δ 6.0–6.5 (two-line stack) → 0.0.
- Phones: Δ 0.0, unchanged.
- Cap-height ink within ±0.5px everywhere.

`verify:ssr`: the opening / first overview renders one kicker node when
`kicker` is set and none when it is omitted, `""` or blank. Every detail
renders none, even with `kicker` set, and keeps its item in the dialog's
`aria-labelledby`.

## 1.10.0

Requires `foundation` ≥ 1.13.0 (`HeldCopy rest`).

Config changes (additive, opt-in; nothing changes without them)
- `directLoad?: "entrance" | "at-rest"` (`DOSSIER_DIRECT_LOADS`, default
  `"entrance"`), a Variation. With `"at-rest"`, the layer the dossier mounts
  with (a page loaded or hydrated on a view URL) shows its first view
  settled from the first paint and hydrates in place:
  - no hold, no media gate, no loader, no remount;
  - that view's entrances run in zero time, ending on their end state;
  - its chapters start revealed;
  - videos get their source after hydration;
  - `<html>` has `overflow: hidden` from the first paint, so the scroll
    lock shifts nothing at hydration.

  Not affected: in-page opens, reopening after a close, every later view,
  and a first view waiting on a `pending` item. These keep the gated
  entrance. README "Direct load at rest".
- New `dossierViewMedia(config, view)`: the images a view shows first, in
  order, for the head preloads of a prerendered view page.

Measured in Tchin (`/menu/`, Lighthouse mobile, devtools throttling, median
of 3): LCP 4.65 s → 2.45 s (= FCP), score 0.78 → 0.93. No hydration warnings
(development React).

`pnpm verify:ssr` renders every reference view with `at-rest` too: the full
per-view contract, plus `data-rest`, no held copy, no waiting / locked /
pending markup, and enabled tiles. A pending item must keep the held path.

## 1.9.2

Fix. No config change. Requires `foundation` ≥ 1.12.0 (`restoreFocus`).

- Close returns focus through `restoreFocus`: a launcher made inert while the
  dossier was open (the navbar finder's pill, its deck closed on launch)
  hands focus to the finder trigger instead of dropping it on `<body>`.

## 1.9.1

Fix. No config change; requires unchanged.

- Opening screen on phones (< 600): the choice tiles stack one per row
  instead of sharing a row. Two tiles side by side on a phone came out
  around 1:4.5, too narrow for any photo's aspect; stacked, two tiles are
  about square. From 600 unchanged. Sheet tile `sizes` now always
  `(max-width: 599px) 100vw`.

## 1.9.0

Additive. Requires `foundation` ≥ 1.10.0 and `controls` ≥ 1.5.0 (unchanged).
Existing configs render as in 1.8.0.

Chapter kit:
- `ChapterRow.media?: DossierMedia`: a thumbnail beside the row's text (a
  dish, a product). Flush with the row's leading edge over its full height
  (5.5em phones, 7em from 768), clipped by the tile's or panel's radius, so
  concentric with no inset radius; beside the text at every width. Takes the
  config's `tileMedia` through the dossier body (graded at rest and released
  on row hover; true-colour: no filter). `<img>` always `loading="lazy"`,
  `decoding="async"`, `srcSet` / `sizes` honoured (default sizes
  `(min-width: 768px) 112px, 88px`), `alt` from `media.alt` else `""`
  (decorative: the label names the row); a video shows its poster. Outside the
  media gate: list the first rows' media in `entry.sources` when rows open the
  entry.
- `ChapterRow.marks?: ReactNode`: small marks after the label (dietary icons,
  a short tag), sized to the label, `--ev-fg-65`; each node names itself.

Markup / CSS:
- `.evd-rows[data-media="graded" | "true-colour"]` when any row has media;
  `.evd-rows__row[data-has-media]`, `.evd-rows__media`, `.evd-rows__marks`.

Reference: Maison Ardoise's menu sections carry a thumbnail per dish and
vegetarian / spicy marks (inline glyphs). `verify:ssr`: every row thumbnail is
an `<img>` with src, alt, lazy, async, and a view carries as many as its
content (the menu's sections must have some).

## 1.8.0

Additive. Requires `foundation` ≥ 1.10.0 and `controls` ≥ 1.5.0 (unchanged).
Existing configs render as in 1.7.0 except the two fixes below. Browsers:
container queries (Chrome 105, Safari 16, Firefox 110); without them the
panorama's chapters keep their tablet layout.

Config (all optional):
- `composition?: "panorama" | "sheet"` (new Variation, `DOSSIER_COMPOSITIONS`;
  default `"panorama"`). `sheet` = the phone / tablet composition at every
  width; from 1024 a centred portrait shell `max(40em, .9 × h) × h`, h = the
  panorama's height.
- `tileMedia?: "graded" | "true-colour"` (new Variation, `DOSSIER_TILE_MEDIA`;
  default `"graded"` = 1.7). `true-colour`: board and opening tiles show the
  photo as shot in every state (no filter, no filter transition, no accent
  wash, neighbours undimmed); border, edge, numeral, shine and scale carry
  the state; the caption scrim stays. `SelectionBoard` takes it as
  `tileMedia` (`data-tile-media` on `.evd-board`).
- `opening?: { id, title, label?, description? }`: an opening screen above
  the items (own view, URL and head).
- Items: `cover?`, `kicker?` (opening tile), `empty?: { title, body? }`
  (board without entries), `pending?` (live content loading).
- Entry counts: any count from 0 (was exactly four). Four keep the
  panorama's mosaic (2×2 in the sheet); other counts take the symmetric
  grid (two columns from 600, one below, an odd count's first tile spans
  the row); none shows the empty panel.
- Copy (optional, defaults per locale): `openItem`, `chooseItem`, `up`,
  `empty`, `loader.pending`. The reference config adds them, plus
  `buildDossierMenuConfig(locale, { specials?, composition? })` (Maison
  Ardoise's menu behind an opening screen; not exported by `index.ts`, so an
  older client-owned config keeps compiling).

API:
- `DossierView` = `{ item: string; entry?: string; opening?: string } |
  { opening: string }`: with `config.opening`, the opening view (key =
  its id) is level 1 and item / entry views carry `opening` (levels 2 / 3);
  without it, views, keys and levels are unchanged
  (`docs/CRAWLABLE-MODALS.md` §1). Code reading `view.item` now gets
  `string | undefined`.
- `dossierRoutes.parse` accepts the entry keys of a pending item.
- Live content: a requested view the config no longer holds settles on its
  ancestor (unknown entry → overview, unknown item → top level) and the
  dossier reports it through `onNavigate`; the body follows entries by id
  (reorders keep the open entry) and keeps the previous board until changed
  media are decoded.
- `SelectionBoard`: `entries` accepts `SelectionTile` (`{ id, title, kicker?,
  media? }`, entries still fit); new `layout?` (`SELECTION_BOARD_LAYOUTS`:
  `mosaic` · `grid` · `choice`; default mosaic for four, grid otherwise; was
  the first four in the mosaic), `numbered?`, `sizes?`.
- New exports: `DOSSIER_COMPOSITIONS`, `DossierComposition`,
  `DOSSIER_TILE_MEDIA`, `DossierTileMedia`, `DossierOpening`,
  `SELECTION_BOARD_LAYOUTS`, `SelectionBoardLayout`, `SelectionTile`.

Markup / CSS:
- Root: `data-composition`; `data-view` gains `opening`; `data-board`
  (`mosaic` · `grid` · `choice` · `empty`) on overviews.
- `.evd-body` is a size container (`evd-body`): the desktop rules of the
  atmosphere, tile text and chapters apply from 1024 *and* a body ≥ 900px
  (the panorama always is; the sheet is not). Measured identical to 1.7.0 at
  390, 834 and 1024 / 1440 (detail).
- New: `.evd-empty*`, `.evd-strip[data-level="items"]`,
  `.evd-board[data-layout]` grid rules, the sheet block (`[data-composition="sheet"]`
  from 1024).

Fixes (visible in 1.7 configs, panorama ≥ 1024):
- Without a header pager (one item) the Evoview mark and the close sat in
  the middle column; they are back on the right edge (`.evd-header__end`
  `grid-column: 3`).
- Every overview scrolled by ~76px (the atmosphere's box hung past the
  body): the glow is drawn inside the body, the board gains the scrollbar's
  10px; rows unchanged (387 / 258 at 1440).

## 1.7.0

Requires `foundation` ≥ 1.10.0 (`lockScroll`). No config changes, no CSS
changes.

- Behaviour: the page scroll lock goes through foundation's shared
  `lockScroll()`, same timing (before paint, released when the exit
  starts). Changes: ref-counted with every other foundation lock (a modal or
  the mobile navbar closing out of order no longer unlocks the page under
  another one); the overflow moves from `<html>` to the element that reaches
  the viewport (body unless the host styles `<html>` overflow); the
  scrollbar compensation adds to the host's body padding instead of
  replacing it; `--ev-scroll-lock-gap` is set while locked; closing near the
  bottom of a page no longer jumps it by a few pixels (Chrome clamp).
  Inert walk, suspension and focus unchanged.

## 1.6.0

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
