# card changelog

## Unreleased

- Showcase only (`/layouts/card`, not installed): title captions in the
  page's voice (were `CARDTRACK · …` readouts); the deck's desk leaves the
  deck's heading slot for the shared scene desk on the caption's rail; the
  sequence scene takes the chosen tone as a whole (caption and desk follow
  the section). The ribbon track is shown with `showIndex: false` (no
  `01 / 04` counter). No package, config or API change.

## 2.0.0

- **Breaking (install path):** package renamed `card-track` → `card`.
  Installs into `src/components/card/`, config file `card.config.tsx`
  (was `card-track.config.tsx`), version marker `.card-version`, skill
  `evoview-card`, showcase `/layouts/card`. Upgrade: move the client's
  `card-track.config.tsx` to `src/components/card/card.config.tsx`, re-run
  `install.sh`, delete `src/components/card-track/`, update imports to
  `@/components/card`.
- **CardDeck** (new, from the Tchin Tchin home menu deck): a category
  switch (`SegmentedControl`) over a dealt hand of `MediaCard`s, 3 or 6.
  Desktop ≥ 1024: the founder-approved deck deal (centre column first, side
  cards from under the opposite row's centre card) and the tab switch
  (undeal → top-centre flip → swap edge-on → flip in + re-deal), source
  timings, interruptible from the current frame. Below 1024: snap strip,
  staggered rise, dots. Optional `more` link to the full catalogue.
  Files `src/CardDeck.tsx`, `src/card-deck.css`. Config: new
  `buildCardDeckConfig(locale)` → `{ locale, copy, deck }` (types
  `CardDeckConfig`, `CardDeckDefinition`, `CardDeckCategory`,
  `CardDeckCopy` = `CardTrackCopy` + `showing`); `buildCardTrackConfig` and
  its keys unchanged. Clients upgrading keep their config: add a
  `buildCardDeckConfig` export to it before mounting `CardDeck`. Media:
  `public/library/card/deck/*.webp` (showcase placeholders).
- **CardSequence** (new, from the Tchin Tchin karaoke clip board + "Vivez
  l'Expérience" gallery): video cards under a timed focus (2,000 ms dwell,
  one loop plays, the others recede), mouse / keyboard hold with neighbour
  handoff and remaining-dwell resume, tune-in by foundation
  `ChannelSwitch`, dwell line, `OrbFill` arrow orb, pointer tilt,
  decorative watermark. Layouts `gallery` (one row) and `board` (clips +
  fact tiles + price row with `PrimaryPlate`). Files
  `src/CardSequence.tsx`, `src/card-sequence.css`. Config: new
  `buildCardSequenceConfig(locale)` → `{ locale, copy, sequences }` (types
  `CardSequenceConfig`, `CardSequenceDefinition`, `CardSequenceClip`,
  `CardSequenceFact`, `CardSequenceOffer`, `CardSequenceCopy`,
  `CardSequenceLayout`); `buildCardTrackConfig` / `buildCardDeckConfig`
  unchanged. Clients upgrading keep their config: add a
  `buildCardSequenceConfig` export before mounting `CardSequence`.
- **MediaCard API:** new `showIndex?: boolean` (default `true`) omits the
  portrait `01 / 05` readout; the readout row is not rendered when there is
  neither index nor affordance. CardDeck passes `false`. CardTrack unchanged.
- Fix: `MediaCard` used outside a `CardTrack` lost its focus ring (and the
  ribbon tab fill), because its rules read `--card-track-*`, defined only on
  `.ev-card-track`. The card root `.ctc` now maps its own `--ctc-accent`,
  `-ink`, `-signal`, `-deep` from the track tokens with fallbacks to
  foundation's `--ev-accent*`; inside a track it resolves to the same values.
  No config change.

## 1.2.1

- Visual: the progress hairline (+ index) and the phone dots move under the
  card row. Above the cards, directly under a chapter heading or caption, the
  full-width rail read as a heading underline (segmentation) rather than
  progress. No API or config change.

## 1.2.0

- Visual: the pinned scrub scene is centred, but the space above it is
  capped at the chapter's own top rhythm (`standard` / `compact` /
  `cinematic` token, min 5em). A short scene keeps its spare room below
  instead of pushing the cards out of the entry viewport. Tall scenes are
  unchanged. Measured content height is exposed as `--ctr-span` on the stage.
- Fix: in the fit check, a `display:none` stage child (e.g. an
  empty heading hidden by the host) reported top 0, inflated the span and
  kept the track in snap after a resize. Only rendered children count now.
- Showcase: captions moved to the frame's `ShowcaseVariant`
  (`CardTrack · portrait` first on the frame tone, `CardTrack · ribbon` after
  the tone cut); no page-owned heading or spacing. No config change.

## 1.1.0

- Fix: the scrub lerp was per frame, so slow frames left the track trailing
  the scroll (measured 120px behind after a jump under dev-mode jank). It is
  now time-based (.25 per 60 Hz frame).
- Fix: scrub geometry (sticky span = wrapper − stage, track overflow) is read
  live instead of cached at the last resize; the span no longer assumes
  `100vh === innerHeight`.
- Fix: rapid ←/→ during the smooth scroll of a previous press advanced only
  one card; presses now chain from the pending target.
- Fix: the fit check (scrub vs snap) also observes the stage children, so a
  heading that reflows inside the pinned stage (locale, fonts) re-evaluates.
- Fix: affordance wording uses `(pointer: coarse)` for the touch label;
  keyboard-only and pointer-less desktops no longer read `Toucher` / `Tap`.
- Visual: one progress indicator per mechanism — hairline (+ index) on
  desktop scrub and snap, dots only on the phone strip (was hairline + index
  + dots).
- Per-card handlers are stable, so an active change re-renders only the
  cards it touches.
- Config (`card-track.config.tsx`, reference only): the `visits` track and
  its two media are removed; `portfolio` drops `showIndex` (portrait cards
  carry their own index). Client configs are untouched by `install.sh`; no
  API change.

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
