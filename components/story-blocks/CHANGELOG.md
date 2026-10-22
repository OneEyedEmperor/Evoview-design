# story-blocks changelog

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
