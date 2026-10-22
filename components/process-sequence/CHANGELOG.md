# process-sequence changelog

## 1.0.1

- Requires `controls` 1.1.0: step dossier focuses its close button through the
  `GlassClose` ref; `index.ts` loads `../foundation`, `../controls`, then
  `process-sequence.css` (moved from `ProcessSequence.tsx`). No config changes.

## 1.0.0

- First release on `foundation` 1.0.0 + `controls` 1.0.0: `ProcessSequence`
  (split heading with `SegmentedProgress` + locking captions, 4/4/4/6 s clock
  under the pause model, neutral drain, Z-order column stacks with reserved
  height, three-state `StepCard`, phone index + monitor) and `StepDossier`
  (5/12 : 7/12 split, media gate, ←/→ / Esc, focus containment, phone full
  sheet, last-step CTA, Evoview mark in the stage strip).
- Config: `process-sequence.config.tsx` — `buildProcessSequenceConfig(locale,
  { media?, steps? })`; `steps[]`, `durations`, `completionMark`
  (`check` | `numeral` | `icon`), `copy` (FR / EN), `cta`, `attribution`.
