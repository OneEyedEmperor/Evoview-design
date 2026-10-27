---
name: evoview-foundation
description: Evoview library foundation — tokens (--ev-scale, type voices, radius roles, rails, rhythm, motion, tones, accent mapping), pause-model hooks (useInViewPause, useSequenceClock, useMediaReady, suspendBackground), crawlable-modal routing (useRouteHistory, RouteLink, HeldCopy, useHydrated), the channel switch for hover-preview screens (ChannelSwitch) and the approved Evoview attribution mark. Use when building or adapting any Evoview library package, installing one into a client, server-rendering / prerendering one, building a screen that previews the hovered option, or when asked about Evoview tokens, scale, tones or the pause model. Triggers on "evoview foundation", "ev-scale", "evoview tokens", "pause model", "useSequenceClock", "useMediaReady", "crawlable modal", "useRouteHistory", "channel switch", "hover preview glitch".
---

# Evoview foundation

Package: `/root/.vibehub/projects/evoview-design-library/components/foundation/`

Read `README.md` (tokens, hooks, attribution, motion policy) and the
library's `STRATEGY.md` + `docs/RULES.md` first.

## Procedure

- **Client**: installed automatically by every package's `install.sh`; run
  `components/foundation/install.sh <client>` alone only to upgrade it. Map
  the client accent through `--primary` / `--primary-foreground` (use
  `inkFor` when the host has no foreground token). Map fonts through
  `--font-heading` / `--font-body` / `--font-readout` only when the client's
  typography deliberately replaces the Evoview voices.
- **New library package**: root `class="ev-root ev-<name>"`, symlink
  `ln -sfn ../foundation/src components/<name>/foundation`, import from
  `../foundation`, author structure on `--ev-rem` tokens / `em` inside the
  root, use the type classes, gate every loop and clock with
  `useInViewPause` + `useSequenceClock`, gate media with `useMediaReady`
  (warm likely views with `preloadMedia` on idle / intent), put
  the one `<EvoviewMark>` in the header strip. `install.sh` must call
  `../foundation/install.sh` first.
- **Package with a modal**: follow `docs/CRAWLABLE-MODALS.md` — export
  `<name>Routes: ModalRoutes`, take `RouteViewProps` (`view`, `onNavigate`,
  `hrefFor`, `history`), keep history with `useRouteHistory`, navigate with
  `RouteLink`, mount copy at once inside `<HeldCopy live={gate.ready}>`,
  gate `inert` / `aria-hidden` / loaders on `useHydrated()`; then add it to
  `PACKAGES` in `scripts/verify-ssr.mjs` and keep `pnpm verify:ssr` green.

## Rules

- Never change the host root font-size; never add a `prefers-reduced-motion`
  branch (stable final states + the pause model instead).
- An orb never changes colour by a CSS cut or fade: wrap its content in
  `<OrbFill>` (liquid rise, RULES §1) and set the `--ev-orb-*` colours.
  Same for text: a label, title, index or link text that changes colour
  goes in `<TextFill>` (`ink` / `on` / `hoverWithin` + `hoverInk`), never a
  `color` rule on `:hover` or a state selector. A button whose surface
  changes colour on hover gets `<SurfaceFill>` (its content again, filled
  state) instead of a hover `background` swap.
- A screen previewing the option under the pointer or focus (options beside
  a picture, selector beside a stage, list beside a player) changes through
  `<ChannelSwitch channel={id}>` (RULES §6), never a cut, crossfade or
  slide. Copy belonging to the screen (title, category) switches in its own
  `<ChannelSwitch signal={false}>`; debounce the return to rest (~140 ms).
- Accent is signal only (selection, progress, focus, indices, blooms,
  primary hover). Light accents (yellow, near-white) must still read: use
  `--ev-accent-signal` for strokes and accent text, never colour alone.
- Changing a token is a library-wide change: bump `VERSION`, note it in
  `CHANGELOG.md`, rebuild and re-check every showcase page at 1440 and 390.
- Respond in English even when the client interface is French.
