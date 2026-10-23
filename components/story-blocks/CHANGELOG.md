# story-blocks changelog

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
