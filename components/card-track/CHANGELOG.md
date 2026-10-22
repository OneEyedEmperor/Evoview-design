# card-track changelog

## 1.0.1

- Requires `foundation` 1.1.0 / `controls` 1.1.0: uses foundation's
  `useMediaQuery` instead of a private copy; `index.ts` loads `../foundation`
  and `../controls` before `card-track.css`. No config changes.

## 1.0.0

- First release on `foundation` 1.0.0 and `controls` 1.0.0 (retry action).
- `CardTrack`: desktop scrub (sticky stage, `calc(100vh + n × 35vh)`,
  lerp .25, 2px progress hairline on the wide rail, optional `01 / 04`
  index), phone native snap (82vw, dots 18 / 6), static row when nothing
  overflows, snap fallback when the stage does not fit the viewport height.
  Keyboard ←/→/Home/End, roving tab stop, live status.
- `MediaCard`: `ribbon` (light / dark ribbon, equal heights via subgrid,
  optional square tab) and `portrait` (.90 / .70, scrim, index → title →
  meta, title wipe and accent bloom on the current card). Glass affordance
  label (pointer / touch), graded media at rest, media gate with
  loading / failed + retry, videos gated by the pause model.
- Config: `card-track.config.tsx` — `buildCardTrackConfig(locale)` →
  `{ locale, copy, tracks }`.
