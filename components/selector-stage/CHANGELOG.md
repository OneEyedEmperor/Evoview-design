# selector-stage changelog

## Unreleased

- Docs: ownership sections (RULES §13).
- API (additive): exported variation array `COMPARE_TOGGLE_MODES` (new type
  `CompareToggleMode`). No config change.

## 1.5.0

Requires `foundation` ≥ 1.9.0 (press jelly). No config changes, no CSS
changes.

- Behaviour: the autoplay toggle takes the press jelly (RULES §6). Rows and
  atlas thumbs are unchanged.

## 1.4.0

Requires `foundation` ≥ 1.5.0 (`TextFill`) and `controls` ≥ 1.2.0. No config
changes, no API changes.

- Behaviour: row labels (hover, selection), the autoplay toggle (icon and
  label) and atlas thumb labels take their new ink as a liquid fill
  (RULES §1). The `.ss-loader` ghost colour override still applies.
- CSS: `.ss-row__label`, `.ss-auto`, `.ss-thumb__label` state rules no
  longer set `color`.

## 1.3.0

- Requires `foundation` 1.4.0 (`StepGauge`).
- Joined selector rows (≥ 1024) show their position as a vertical step
  gauge (RULES §1) instead of `01`…`04`: dim until the row is selected,
  then in the signal. Chip strip (< 1024) unchanged.
- No config changes.

## 1.2.0

- Requires `foundation` 1.3.0 (`--ev-surface-list` / `--ev-surface-list-alt`;
  fallbacks mix 4 % / 6 % foreground into the tone background).
- Selector rows are a text list on tonal surfaces (RULES §3): joined rows
  alternate the two list surfaces inside a surface-radius panel; first/last
  rows follow the panel radius. Selection (tint over the surface, inset
  box, 22px bar, text contrast) and hover paint on top of the surface.
- Phone chip strip unchanged (choosable tokens, not a text list). No config
  changes.

## 1.1.2

- Config (reference content only): the four reference chapters no longer
  fill `note`; the slot stays (`ChapterCopy.note`) for one honest
  "illustrative" mention per page. Atlas item `note`s are unchanged.

## 1.1.1

- Borders only for media clipping and selection: unselected rows and resting
  atlas thumbs carry no frame (rows: selection is an inset 1px box; thumbs:
  a 2px inset ring on the scrim, the grade carries rest vs active). Stage
  keeps its 44 % accent frame (media clipping). No config changes.
- `showcase.css` removed (the library frame owns showcase spacing).

## 1.1.0

Visual contract changes (no type / prop changes):
- Selector rows: no hairlines between or above rows; the selected row carries
  a full 65 % accent border (was bottom border only).
- Pair: the `≠` seam marker is removed (ornament). The pair is documented as
  two alternatives; before/after belongs on the toggle.
- Fade stage: the new layer fades in over opaque predecessors (z = recency)
  instead of a symmetric crossfade; fast clicks no longer dip to the well
  (measured coverage 0.57 → 1.00).
- Wipe stage: the "after" sheet is a clip-path transition over a fixed base,
  so toggling mid-wipe reverses in place (was: snap to full, then re-wipe in
  the same direction).
- Autoplay: only the choices and the stage hold the clock (the toggle held
  it, so a keyboard "resume" never resumed); resume restarts a full dwell in
  sync with the progress fill. Phone chip centring measured from rects (was
  `offsetLeft` against an incidental offset parent).

Config (reference content only; installed configs are not touched):
- `chapters.plans` rewritten as two proposals: state ids `existing`/`project`
  → `glass`/`open`, new labels/captions/details, `note` added; the local
  `PlanDrawing` `variant` is `"glass" | "open"` (was `"before" | "after"`).
- `SelectorStageCopy.versus` kept; now documented as the screen-reader link
  between the two alternatives of a pair.

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
