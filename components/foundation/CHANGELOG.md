# foundation changelog

## 1.1.0

- Pause model covers pseudo-element loops: `[data-ev-paused]` and
  `html[data-ev-suspended]` now pause `.ev-ambient::before` / `::after`
  (`SectionMarker live` pulse now actually pauses).
- Added `useMediaQuery(query)`.
- Added `useInViewPause` option `once` (latches `active`, stops observing).
- README: cascade rule — package `index.ts` imports `../foundation` /
  `../controls` before its own CSS.
- No config changes, no breaking changes.

## 1.0.0

- First release: `--ev-scale` / `--ev-rem`, radius roles, rails, gutters,
  spacing bands, chapter rhythm, motion tokens, legibility floors, type-voice
  classes, tones (dark default, light, paper), host-mapped families and accent
  (`--ev-accent`, `-ink`, `-deep`, `-signal`).
- Hooks: `useInViewPause`, `useSequenceClock` (+ `sequenceFillStyle`),
  `useMediaReady`, page suspension API (`suspendBackground`,
  `useSuspendBackground`, `useBackgroundSuspended`).
- Primitives: `Readout`, `Index`, `SectionMarker`, `EvoviewMark`,
  `EvoviewLogo`, stroke icons; utils `cn`, `pad`, `formatIndex`, `inkFor`.
- Fonts (Overused Grotesk VF, Montserrat, Satoshi 700) bundled.
