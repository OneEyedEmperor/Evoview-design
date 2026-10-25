# controls changelog

## 1.2.0

Requires `foundation` ≥ 1.5.0 (`OrbFill`). No config changes, no API
changes.

- Behaviour: `PrimaryPlate` hover pours the accent over the whole plate,
  label and orb included, under one wave (foundation `SurfaceFill`); its orb
  no longer fills on its own. CSS: `.evc-plate` sets `--ev-surface-lit(-ink)`
  instead of a hover `background` / `color`; `.ev-surface-fill
  .evc-plate__orb` holds the filled orb colours.
- Behaviour: every orb now changes colour through the liquid fill instead
  of a background cut/fade: `CheckOrb` and `OptionRow` checks, `OptionChip` marks
  (the check rises in with the liquid), `StepMark` when `done`.
- Behaviour: text colour switches take the liquid fill (foundation
  `TextFill`): `GhostAction` label and icon (hover), `OptionChip` label
  (hover, selection), `OptionRow` index (selection), `StepMark` numeral
  (current), `SegmentedControl` option (hover; the checked ink still follows
  the thumb), `SegmentedProgress` captions (current, done).
- CSS: `.evc-ghost` sets `--ev-text-lit` instead of a hover `color` (its rest
  `color` still applies); the hover / state `color` rules of `.evc-chip`,
  `.evc-row__index`, `.evc-step[data-state="current"]`, `.evc-seg__option`
  hover and `.evc-progress__caption` are gone.
- CSS: `.evc-plate__orb`, `.evc-orb`, `.evc-chip__mark`, `.evc-step` no
  longer set their fill `background` / `color`; they declare
  `--ev-orb-rest(-ink)` / `--ev-orb-lit(-ink)` instead. Host overrides of
  those backgrounds must move to the tokens. Borders and halos still
  transition.

## 1.1.1

Requires `foundation` ≥ 1.1.1 (timed `SegmentedProgress` fill no longer
jumps ahead on pause). No config changes, no API changes.

- `PrimaryPlate busy` appends the locale's `busy` label ("En cours…") to the
  accessible name; `copy.busy` existed but was never read.
- Showcase rewritten (not installed): four role chapters (commands, choices,
  fields, progress) plus one paper scene, one client, no spec IDs or ruled
  captions.

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
