# selector-stage changelog

## 1.0.1

- Requires `foundation` 1.1.0 / `controls` 1.1.0: radiogroup keys use controls'
  `rovingKeyDown`; `useOnce` uses `useInViewPause({ once })`. No config
  changes.

## 1.0.0

- First release on `foundation` 1.0.0 + `controls` 1.0.0: `SelectorStage`
  (joined rows ↔ phone chip strip, 4:3 stage, optional autoplay under the
  pause model), `CompareToggle` (`toggle` wipe / `pair` with ≠, phone toggle),
  `ProofAtlas` (1.22 / .78, graded thumbs, phone snap strip).
- Config: `selector-stage.config.tsx` — `buildSelectorStageConfig(locale)` →
  `{ locale, copy, chapters }`; reference media in `src/media/` (kept on upgrade).
