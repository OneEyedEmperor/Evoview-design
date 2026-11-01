# story-blocks changelog

## 2.7.0

Additive. Requires `foundation` ≥ 1.16.0 (`MediaSource` `srcSet` / `sizes`:
the media gate probes the candidate the `<img>` picks, so it is fetched
once).

API (additive): `StoryMedia` takes `srcSet?` and `sizes?`. They render on
every block's `<img>` and go into its media gate. Without `sizes`, each
block supplies its own from its layout: `STORY_INTRO_SIZES`,
`STORY_SEQUENCE_SIZES`, `storyProofSizes(span, half)`, exported, values in
the README "Media". `StoryMedia` has no video, so there's no `posterSrcSet`.
Without `srcSet` the markup is byte-identical to 2.6.0. The media gate's
reveal is unchanged.

Config changes: none (the reference config has no renditions).

## 2.6.0

Additive. Requires nothing new. No config changes.

API (additive): `StoryIntro` (and `{ kind: "intro" }` chapters) take
`level?: 1 | 2` (default 2). `1` makes a page's opening intro title its h1;
the element changes, the voice (`ev-t-title`), size and markup don't. On a
page hosting a crawlable modal the host passes `1` on the page URL and `2`
while a view is open (`docs/CRAWLABLE-MODALS.md` §4). Existing configs
render unchanged (same server HTML).

## 2.5.0

- Sync (`docs/SYNC.md`): `evoview.json` (`requires` foundation `>=1.9.0 <2`,
  controls `>=1.1.0 <2`); `install.sh` wraps `sync.sh` (clean plans only;
  local edits merged and recorded as patches, files removed upstream deleted).
- Config changes: new client-owned `src/story-blocks.theme.css` (accent
  tokens), imported by `index.ts` after `story-blocks.css`; created by the
  next sync, never overwritten. Existing config untouched; built CSS
  unchanged.
- Docs: ownership sections (RULES §13).
- API (additive): exported variation arrays `STORY_INTRO_ALIGNS`,
  `INDEXED_ROWS_SURFACES`, `PROOF_GRID_HEADING_POSITIONS` (new types
  `StoryIntroAlign`, `IndexedRowsSurface`, `ProofGridHeadingAt`). No config
  change.

## 2.4.0

Requires `foundation` ≥ 1.9.0 (press jelly). No config changes, no CSS
changes.

- Behaviour: the media retry button takes the press jelly (RULES §6).

## 2.3.0

Requires `foundation` 1.7.0 (`--ev-accent-wash`, with a local fallback).
No config changes. `IndexedRows` rows (tiles and joined rows) carry the
accent wash over their list surface, matching the process-sequence dossier pills.

## 2.2.0 — step gauge on sequence rows (RULES §1)

Requires `foundation` 1.4.0 (`StepGauge`).

- `IndexedRows` rows without an authored `index` show their position as a
  vertical step gauge (filled from the bottom, accent) instead of `01`…`04`.
  Rows with `index` (times, codes) keep the text readout.
- No config changes.

## 2.1.0 — text lists on tonal surfaces (RULES §3)

Requires `foundation` 1.3.0 (`--ev-surface-list` / `-alt`; a `color-mix`
fallback keeps older foundations readable).

Config changes:

- `IndexedRows.surface?: "tiles" | "rows"` — default `"tiles"` with
  `media`, `"rows"` without.

Visual:

- Sequence rows: each step on its own tile (`--ev-surface-list`, radius
  `surface`, 8px gap), staggered reveal. From 1024 the sequence image's
  ratio is a minimum, so it grows to the last tile's baseline when the
  column runs taller (1024 was 110px off).
- Text-only rows (schedules): one rounded surface of joined rows
  alternating `-list` / `-list-alt`, time · label · detail on one line from
  768; revealed as one surface.
- Payoff results: three peer tiles; on phones one joined surface, title and
  detail on one line, rows alternating. Revealed as one group.
- Row index column sizes to the tabular readout (`auto`), gap 1.25em.

## 2.0.2

- Config: `PayoffCta.consequence` is optional; the readout under the plate
  (and its `aria-describedby`) renders only when set. Use it only when the
  click does something the label doesn't say (leaving a dossier).
- Reference stories: both payoffs drop "Ouvre la réservation" / "Opens the
  booking" (it restated "Réserver …").

## 2.0.1

- Showcase only: both configurations are `ShowcaseVariant`s (`Story · dark`,
  `Story · paper`, `rhythm="cinematic"`), so the frame owns header → demo
  spacing; `showcase.css` (outer padding, gutter override) removed now that
  the frame rail is foundation's rail. No package source or config changes.

## 2.0.0 — no line segmentation (refinement pass, 2026-10-23)

Chapters and their contents are now separated by space, scale, alignment
and tone only (RULES §3). Breaking: no client had installed 1.x.

Removed:

- Every segmenting line: chapter hairlines, row rules, pillar rules and
  verticals, results top rules, the proof-grid note rule, the hero's
  accent border, the payoff's closing rule.
- Automatic base / alt band alternation (zebra chapters) and the `band`
  prop on every block. A tone cut is a new `<Story>` with the other tone.
- `RuledPillars` and `kind: "pillars"`: without rules it was a generic
  three-up feature grid. Three facts go in the payoff `results`; facts
  worth showing get an image in the proof grid.
- `ProofGrid` `note`; `ProofItem` `label` / `qualifier` and the automatic
  `NN / LABEL` caption indices.

Config changes:

- `ProofItem`: `caption?: ReactNode` (one sentence-case line), `span?: number`
  (desktop columns of 12; default still alternates 7/5 ↔ 5/7).
- `ProofGrid`: `headingAt?: "start" | "end"` — `"end"` puts the heading
  split after the images (show, then explain).
- `IndexedRows`: `media?: StoryMedia & { ratio?, ratioPhone? }` — the
  sequence beside its proof (media on the 1.28 side, heading tops it, rows
  end on its baseline; media first on phones). `layout` removed: without
  media the rows always sit beside the heading. `IndexedRow.index?` replaces
  the automatic `01` with a real value (a time, a day).
- `StoryIntro`: `caption` optional, `caption.kicker` optional.
- `PayoffBand`: `lead` optional.
- Reference stories: `harvest` (dark: intro → sequence + media → four-image
  proof, heading at end → payoff with results) and `visit` (light page:
  timed sequence → payoff without results).

Visual:

- Chapter band = `--ev-chapter-cinematic-top` (96 / 144 authored) on page
  rhythm, `--ev-chapter-compact` in dossiers; padding on top of each chapter
  and under the last one only (no doubled 240px gaps).
- Row labels in the card voice (Overused 900) over body-size detail;
  proof captions in compact body, no readout indices.
- Payoff bloom drawn with `closest-side` inside the chapter: it never meets
  an edge (the 1.x bloom was clipped into a visible seam).
- Copy aligns to the split's inner edge (no right-pushed asides).

## 1.0.1

- Requires `foundation` 1.1.0 / `controls` 1.1.0: `Reveal` and `StoryFigure`
  latch with `useInViewPause({ once })` instead of local state; `index.ts`
  loads `../foundation` and `../controls` before `story-blocks.css`. No config
  changes.

## 1.0.0

- First release on `foundation` 1.0.0 and `controls` 1.0.0: `Story` (tone,
  rhythm, data-driven `chapters` or composed children), `StoryIntro`,
  `IndexedRows` (`split` / `full`), `ProofGrid`, `RuledPillars`,
  `PayoffBand`, plus `StoryFigure` (media gate) and `Reveal`.
- Config: `story-blocks.config.tsx` — `copy` (media loading / failed /
  retry, FR / EN) and `stories` (reference winery: `harvest`, `visit`).
