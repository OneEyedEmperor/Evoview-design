# controls changelog

## 1.6.0

- Sync (`docs/SYNC.md`): `evoview.json` (`requires` foundation `>=1.9.0 <2`);
  `install.sh` wraps `sync.sh` (clean plans only; local edits merged and
  recorded as patches, files removed upstream deleted). Policy: additive
  within a major.
- Config changes: new client-owned `src/controls.theme.css` (accent tokens,
  commented defaults), imported by `index.ts` after `controls.css`; created by
  the next sync, never overwritten. Existing config untouched; built CSS
  unchanged.
- Docs: ownership sections (RULES §13).

## 1.5.0

Requires `foundation` ≥ 1.9.0 (press jelly). No config changes, no API changes.

- Behaviour: `PrimaryPlate`, `GhostAction`, `GlassClose`, `PagerOrb`,
  `OptionChip`, `SegmentedControl` options and the `Switch` track take the
  press jelly (RULES §6). `OptionRow` keeps its `:active` scale (row).
- CSS: the `:active` `transform: scale()` rules of `.evc-plate`,
  `.evc-glass` and `.evc-chip` are gone. Host overrides must not add an
  `:active` scale or transition `scale` on these.

## 1.4.0

Requires `foundation` ≥ 1.5.0 (`OrbFill`). No config changes, no API changes.

- Behaviour: `SegmentedControl` no longer slides one accent thumb: each
  option carries its own pill, the picked one fills with the accent and the
  checked ink as liquid, the previous one drains (RULES §1). Hover ink on the
  other options unchanged.
- Behaviour: `Switch` track and knob take their checked colours as liquid
  (track → accent, knob → accent ink with the check rising in); the knob
  still slides.
- CSS: `.evc-seg__thumb` is gone (and the `--evc-seg-n` / `--evc-seg-i`
  inline vars); new `.evc-seg__pill` (inset 3px, accent and ring as
  `--ev-orb-lit(-ink)` + box-shadow), `.evc-seg__option` is
  `position: relative`. `.evc-switch__track` / `__thumb` set `--ev-orb-*`
  instead of `background`; the track ring moved to `::before`. Host
  overrides of those backgrounds must move to the tokens.

## 1.3.0

View links for crawlable modals (`docs/CRAWLABLE-MODALS.md` §4). Requires
`foundation` ≥ 1.6.0 (`followRouteLink`). No config changes; existing usage
renders the same markup.

- `SegmentedProgress`: `hrefFor?(index)`. A selectable cell with a URL
  renders `<a class="evc-progress__hit" href>` (plain click → `onSelect`
  through `followRouteLink`, modified click opens the URL); other cells stay
  buttons (`disabled` when not selectable).
- `PagerOrb`: `href?` renders `<a>` with the same classes (`PagerOrbProps` is
  now button-or-anchor, like `PrimaryPlate` / `GhostAction`).
- `GlassClose` unchanged: closing is never a view link.
- CSS: `:where(a.ev-controls, .ev-controls a)` gets `touch-action:
  manipulation` and no tap highlight, like buttons.

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
