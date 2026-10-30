# foundation changelog

## 1.14.0

Additive. `EvoviewMark` `href: null` pauses the attribution link while its
destination isn't live: the wordmark stays in place, rendered as a
`<span class="ev-attribution" data-link="paused" role="img" aria-label="Evoview">`
(no link, not focusable, no hover lift). The emperor's call, client by client;
restore the URL (or omit `href`) to relink.

## 1.13.0

No config change. Additive API. Requires nothing new.

- `HeldCopy` takes `rest?: boolean`: the view is shown settled from the
  first render (a direct load at rest). It is never held (no
  `data-ev-held`) and never remounted, so hydration keeps the server DOM.
  `useHeldSrc` inside it withholds video sources until hydration only.
  Without `rest`, nothing changes.

## 1.12.1

No config or API change. Requires nothing new. No visual change.

Fix
- `.ev-attribution` hit area ≥ 44 × 44 at any wordmark size (RULES §7):
  a centred `::before` of `max(100%, 44px)` each way; the link gains
  `position: relative`. The dossier header mark on phones (54px wordmark)
  measured 70 × 42, now 70 × 44. The wordmark, its size and its placement
  are unchanged.

## 1.12.0

No config change. Additive API. Requires nothing new.

- New `restoreFocus(target, options?)`: gives focus back to a modal's
  launcher. A launcher that can no longer take it (inert or hidden: a navbar
  finder pill whose deck closed when it opened the modal) hands it to the
  trigger of its disclosure, the element whose `aria-controls` names the
  nearest region around it, up through nested disclosures. Works with any
  host disclosure that follows the ARIA pattern; no opt-in attribute.

## 1.11.2

No config or API change. Requires nothing new.

Fix
- `useRouteHistory`: a page loaded (or routed) on a URL the host resolves to
  another view (an unknown key falling back to its nearest ancestor) kept
  that URL as the entry under the modal, so closing landed on a dead view
  URL. On first open, any URL other than `hrefFor(null)` is now a deep link:
  its entry becomes `hrefFor(null)`, the resolved view's ancestry is pushed
  (the address bar shows the resolved URL), and Back / close step out one
  level at a time, as for a valid deep link. Hosts: `hrefFor(null)` must be
  the URL of the page an in-page launcher sits on (docs/CRAWLABLE-MODALS.md
  §5).

## 1.11.1

No config or API change. Requires nothing new.

Fix
- `useMediaReady` element mode acted on whatever element it was handed. A
  player that outlives its source (`ChannelSwitch` holds the outgoing
  picture through its fold while the step, the gate's `src`, changes) was
  paused and seeked to 0 mid-fold by the new cycle, accepted on `seeked`,
  and `ready` turned true before the incoming player existed; an incoming
  player that then errored was never reported (`failed` needs `!ready`): no
  loader, no retry. The gate now acts only on the player that carries the
  cycle's source (with `src`: the URL the gate returned; without: an element
  that played other sources counts again on `loadstart` or `retry()`). Any
  other element is never paused, seeked, played or accepted: the gate waits.
  A player swapped within the cycle must pass again; no loader timer runs
  after the reveal.

## 1.11.0

No config changes. Additive API; two behaviour changes in existing hooks
(suspension timing), from the evoview site.

- `useSuspendBackground` registers in a layout effect (was a post-paint
  effect): `<html data-ev-suspended>` and its restyle land in the modal's
  mount commit for any update priority (a view URL loaded directly, a
  non-discrete open), never inside the opening animation.
- New `useBackgroundSuspendedDeferred()`: the suspension flag at transition
  priority (state + subscribe + `startTransition`; `useSyncExternalStore`
  cannot defer). `useInViewPause` now reads it, so loops, clocks and media
  pause in a transition after the opening frame instead of re-rendering
  inside it. `useBackgroundSuspended` is unchanged (same-commit).
- `useMediaReady` element mode (`element: { video, src, buffer, play }`,
  from the site's contact and Méthode gates): gates the mounted `<video>`
  instead of a detached probe; `buffer: "full"` fetches the file into a
  session blob URL (returned as `src`, held until then, network fallback)
  and reveals once buffered end to end; playback from zero on reveal, while
  `play`; reveal two frames after the loader's minimum time; `retry()` keeps
  the loader up; a late arrival after a failure still reveals; metadata
  stall fallback (1.2s without data) for the mounted player. Returns
  `src` and `wasSlow` in addition. The source mode is unchanged.
- New `bufferMedia(src)` / `bufferedMedia(src)`: the session blob store.
- `ChannelSwitch`: `ready` (default true) holds the open, never the fold,
  until the host's media gate is ready; turning false cancels an open still
  in its decode wait, an open already playing completes. `mediaSelector`
  (default `"img, video"`) scopes which incoming media are awaited. Defaults
  keep the previous behaviour.

## 1.10.0

No config changes. Additive API: the page scroll lock (from the evoview
site's `src/lib/scrollLock.ts`).

- `lockScroll()`: ref-counted, returns an idempotent release; nested modals
  release in any order, the page stays locked until the last release.
  Hides the overflow of the element that reaches the viewport (body, or
  `<html>` when the host gives it an overflow, so sticky elements keep their
  scroller), keeps a classic scrollbar's width as body padding added to the
  host's own (none under `scrollbar-gutter: stable`) and sets
  `--ev-scroll-lock-gap` (`SCROLL_LOCK_GAP`) on `<html>` while locked, for
  fixed chrome anchored right. The release keeps the scroll offset: Chrome
  first lays the page out without the returning scrollbar, which clamped the
  offset near the bottom of a page that is shorter at full width (a jump of
  that difference on close; the site's lock had it too).
- `useScrollLock(active)`: the lock in a layout effect (before paint;
  nothing on the server).
- Exported from the index and importable alone as `../foundation/scrollLock`
  (no CSS).

## 1.9.1

- Sync (`docs/SYNC.md`): `evoview.json` (no `requires`, no client-owned
  file, `hostDeps` react ≥ 19). No theme template: the adaptable inputs are
  host tokens (`--primary`, `--font-*`). `install.sh` wraps `sync.sh`.
  Installed / upgraded only when a package's `requires` needs it. Policy:
  additive within a major; a breaking change is a major bump. No API change.
- Docs: ownership sections (RULES §13).

## 1.9.0

No config changes. New primitive: the press jelly (RULES §6, the norm for
every clickable pill / button). `jelly.ts` (engine `createJelly`, delegated
binding `bindPressJelly(root?, selector?)`, ref-counted
`retainPressJelly`) and the hook `usePressJelly()`; hosts opt in with
`data-ev-jelly` (selector value: deform that descendant). Spring on the CSS
`scale` property: press ω 30 ζ .6, release ω 15 ζ .14 (rings: ~7 %, 4 %,
3 %, 2 %, 1 % over ~1.5s), depth capped at 11 % / 7 % of the box, tap held ≥ 100 ms, Enter /
Space too, blocked on disabled / busy / locked. New tokens
`--ev-jelly-squash` (7px) / `--ev-jelly-stretch` (10px).

## 1.8.0

No config changes. New primitive `ChannelSwitch` (RULES §6, the norm for
hover-preview screens): the evoview contact application's channel switch
(fold to a line, open with a shudder, signal lines), with coalescing of
fast pointer travel, turn-back mid-fold and media decode before opening.
Exported from the index and importable alone as `../foundation/ChannelSwitch`
(no CSS).

## 1.7.1

No config changes, no API changes. Fix:

- `OrbFill`, `TextFill`, `SurfaceFill`: the aria-hidden filled copy renders
  its content only after hydration (foundation's `useHydrated()`), so
  prerendered HTML carries each label, link text and button
  name once (crawlers, accessible names) and hydration still matches.
  `OrbFill` renders it at once when it starts `on`.

## 1.7.0

No config changes. New token `--ev-accent-wash`: the accent gradient layer
(deep accent 36 % → 8 % at 75 %, left to right) laid over a list surface.

## 1.6.1

No config changes, no API changes. Fix:

- `useRouteHistory`: a popstate onto a view entry made by an earlier
  document of the page (the page was left for another site, or reloaded,
  and traversed back into without the bfcache) found a foreign owner, so the
  hook reported `null` and the modal stayed closed on a view URL (deep link →
  Back past the page → Forward → Forward). With nothing open, such an entry
  is now adopted when `hrefFor(entry.view)` is the current URL (and its key
  matches), so another modal's entries are never taken.

## 1.6.0

Server rendering and crawlable modals (`docs/CRAWLABLE-MODALS.md`).

- `useHydrated()`: false while server rendering and hydrating, true after
  (and on a client-only mount). Gate `inert`, `aria-hidden`, loaders on it.
- `useMediaQuery(query, serverValue = false)`: optional server / hydration
  value (pass `true` for desktop queries: server HTML is the desktop layout).
- `useMediaReady`: not ready and never slow while server rendering and
  hydrating (the decoded-session cache is read only after hydration).
  Client-only mounts behave as before.
- `inkFor`: hex, `rgb()` and `hsl()` parsed in JS, same ink on server and
  client; other syntaxes still use a canvas on the client (`#101011` on the
  server).
- Routing: types `ModalRoutes`, `ViewHead`, `RouteViewProps`;
  `useRouteHistory` (history model of crawlable modals); `routeHrefs` /
  `viewFromPath` (default URL scheme); `followRouteLink`; `RouteLink`
  (`<a href>` with the in-page handler, button without a URL);
  `ROUTE_LAYER_NOSCRIPT_CSS`.
- Held copy: `HeldCopy`, `useHeld`, `useHeldSrc`; `[data-ev-held]` pauses
  CSS animations (foundation.css).
- Every hook and primitive renders on the server (`pnpm verify:ssr`).
- No config changes; existing exports unchanged.

## 1.5.0

- `OrbFill` (+ types `OrbFillProps`, `OrbFillController`): the one way an
  orb changes colour (RULES §1). The new colour rises from the bottom as a
  liquid level with a moving wave surface that calms when full, the content
  turning to the new ink as it goes under; drains back on reversal. Driven
  by `on`, by a `hoverWithin` host (hover, focus-visible, opt-in touch
  press; disabled / busy hosts stay empty) or externally via
  `controller.current.to(level)`. Colours: `--ev-orb-rest`,
  `--ev-orb-rest-ink`, `--ev-orb-lit`, `--ev-orb-lit-ink`. No CSS file.
- `TextFill` (+ `TextFillProps`): the same liquid fill for a text colour
  switch (RULES §1); the new colour rises through the glyphs, returning to
  the previous one drains it, a third rises over whichever shows. Colour
  from `hoverWithin` + `hoverInk` (with `withHover` / `withFocus` /
  `withPress`), `on` (`--ev-text-lit`, default `--primary`) or `ink` (any
  state colour; default `--ev-text-rest`, i.e. the inherited colour).
  `truncate` for single-line ellipsis labels. Root is `inline-grid` (labels,
  titles, link text; not mid-paragraph).
- `SurfaceFill` (+ `SurfaceFillProps`): the liquid fill for a button whose
  surface changes colour: a copy of its content in the filled state, laid
  over the button (display / padding / gap / radius inherited) on
  `--ev-surface-lit` with `--ev-surface-lit-ink`, poured in on hover
  (`withHover` / `withFocus` / `withPress`; disabled, busy, locked stay
  empty). The button needs `position: relative`.
- `liquid.ts`: the shared engine (`createLiquid`, `bindLiquidHover`,
  `liquidClips`, type `LiquidController`, exported from the index).
- No config changes; existing exports unchanged.

## 1.4.0

- `StepGauge({ current, total, srLabel?, className? })` + `.ev-gauge`: a
  row's position in a stacked list as a vertical battery, one cell per
  item, filled from the bottom (RULES §1, the norm for list rows instead of
  `01`…`04`). Lit cells use `currentColor`; tune with `--ev-gauge-h / -w /
  -pad / -gap / -empty`.
- No config changes; existing exports unchanged.

## 1.3.0

- Tone tokens `--ev-surface-list` / `--ev-surface-list-alt`: the two
  text-list surfaces of RULES §3 (lists of text are segmented by tone, never
  by rules or bare spacing). Dark `#141416` / `#18181a` and light
  `#f8f8f6` / `#fcfcfb` step up from the environment; paper `#f5f5f3` /
  `#f0f0ee` steps down. Use for tiles (radius `surface`, small gap) or
  joined alternating rows (radius 0 inside a `surface` group).
- No config changes; existing tokens unchanged.

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
