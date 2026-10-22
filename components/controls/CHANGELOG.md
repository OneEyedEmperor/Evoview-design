# controls changelog

## 1.1.0

Requires `foundation` ≥ 1.1.0. No config changes, no breaking API changes.

- Typed `ref` on `GlassClose`, `PagerOrb`, `PrimaryPlate`, `GhostAction`,
  `OptionChip`, `OptionRow`, `Switch` (React 19 ref prop).
- Exported `rovingKeyDown(e, select, itemSelector?)`; `SegmentedControl` and
  the single-choice groups use it.
- `SegmentedProgress`: `captions` also accepts `"all"`, `"complete"` (caption
  locks on when its cell completes) or a per-cell function; type
  `ProgressCellState` exported.
- Behaviour: `SegmentedProgress` current cell is full when neither `fill` nor
  `clock` is given (was empty).
- Behaviour: `SegmentedControl` thumb is pulled toward the tone signal and
  stays visible with near-white / yellow accents on light tones.
- `index.ts` imports `../foundation` before `controls.css` (cascade order).

## 1.0.0

- First release on `foundation` 1.0.0: `PrimaryPlate`, `GhostAction`,
  `GlassClose`, `PagerOrb`, `OptionChip`, `ChipGroup`, `OptionRow`,
  `OptionRows`, `CheckOrb`, `StepMark`, `Tag`, `Badge`, `UnderlineField`,
  `FieldGrid`, `Switch`, `SegmentedControl`, `SegmentedProgress`,
  `ControlsProvider`.
- Tones: dark (default), light, paper; light accents read through
  `--controls-signal`.
- Config: `controls.config.tsx` (labels FR / EN, `defaultControlsLocale`).
