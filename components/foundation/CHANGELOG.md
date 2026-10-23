# foundation changelog

## 1.2.0

- Added `preloadMedia(sources, video = "loadeddata")`: decodes sources into
  the same session memory `useMediaReady` reads, so a gate whose sources
  were preloaded is `ready` on its first render (no grace gap, no loader).
  Images at low fetch priority; concurrent calls share in-flight requests;
  failures are not remembered. Exported from the package index.
- No config changes; `useMediaReady` behaviour unchanged.

## 1.1.1

No config changes, no API changes. Fixes:

- `sequenceFillStyle`: a fill no longer jumps ahead when its clock pauses.
  It set `animation-delay: -elapsed` on an element whose CSS animation had
  already accumulated that time, so every pause counted the elapsed time
  twice (measured 0.25 → 0.49 at the pause). The delay is now 0 while
  running/paused (the paused animation holds its own time) and `-duration`
  when done. Contract unchanged: key the element by `clock.key`.
- `useInViewPause`: observes the element itself, not the ref object. An
  element that mounts after the first commit (behind a loader / condition)
  was never observed, and one replaced by a keyed remount stayed bound to
  the detached node (`inView` stuck at false → clocks never started).
- `useMediaReady`: `ready` is false on the same render `open` turns false
  (was stale-true for one render); an image `decode()` that never settles is
  capped at 1.5s after `load`; a video probe that stops at `loadedmetadata`
  (mobile WebKit / data saver never preload a detached video's frames) counts
  as ready 1.2s later instead of failing at the 20s timeout.

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
