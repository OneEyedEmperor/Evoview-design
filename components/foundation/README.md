# foundation — Evoview tokens, hooks and shared primitives

The base every library package imports: the Evoview scale, type voices,
radius roles, rails, rhythm, motion, tones, accent mapping, the pause model
hooks and the approved attribution mark. Not a showcased component; no
per-site file. Rules it encodes: `docs/RULES.md` (§0, §1–6, §9, §10).

## Consuming it

- Client layout: `src/components/foundation/` next to the packages; a package
  imports `../foundation` (index re-exports everything and loads
  `foundation.css` once).
- Library layout: each dependent package carries a symlink
  `components/<name>/foundation -> ../foundation/src`, so the same
  `../foundation` import resolves in the library and in clients. Create it
  with `ln -sfn ../foundation/src components/<name>/foundation`.
- A package's `install.sh` calls `components/foundation/install.sh <client>`
  first (idempotent, replaces the folder, prints version changes).
- Cascade rule: a package's `index.ts` imports `../foundation` (and
  `../controls` if used) **before** its own CSS, so package rules win over
  foundation classes at equal specificity (e.g. `.ev-t-body { margin: 0 }`).
  Never import the package CSS from a component file ahead of these.
- Package root: `class="ev-root ev-<name>"`. Leaf components that may be used
  outside a root (controls) map the host accent in their own token block
  instead (`--<name>-accent: var(--primary, …)`), per RULES §0.

## Scale

`--ev-scale`: `1` < 768, `.86` ≥ 768, `clamp(.86, 100vw / 1710px, .9123)`
≥ 1024 (stepped fallback where typed calc division is unsupported). Never
touches the host root font-size. `--ev-rem = 16px × scale` is an absolute
length: tokens built on it are nesting-proof. `.ev-root` sets
`font-size: max(16px × scale, 13px)`, so `em` works inside a package root.

## Tokens (`foundation.css`)

| Group | Tokens |
| --- | --- |
| Scale | `--ev-scale`, `--ev-rem` |
| Radius by role | `--ev-radius-shell` 1.5 · `-surface` 1 · `-control` .75 · `-tag` .5 · `-badge` .25 · `-round` (× `--ev-rem`) |
| Rails | `--ev-rail-reading` 70, `--ev-rail-wide` 85, `--ev-gutter` 20px / 2 / 3 / 4 at 640 / 1024 / 1280 |
| Spacing bands | `--ev-gap-internal` .5 · `-neighbour` 1.25 · `-group` 2 · `-heading` 3 → 4 (≥ 768) |
| Chapter rhythm | `--ev-chapter-standard` 5 → 7.5 · `-compact` 4 → 6 · `-cinematic-top` 6 → 9 · `-cinematic-bottom` 5 → 7.5 |
| Motion | `--ev-dur-fast` 180 · `-control` 280 · `-reveal` 600 · `-cinematic` 900 ms · `--ev-stagger` 80ms · `--ev-ease` `(.2,.8,.2,1)` · `--ev-ease-cinematic` `(.23,1,.32,1)` (JS: `motion`) |
| Floors | `--ev-floor-body` 13px · `-label` 11px · `-readout` 9px |
| Families (host-mapped) | `--ev-font-display` ← `--font-heading` (Overused Grotesk) · `--ev-font-body` ← `--font-body` (Montserrat) · `--ev-font-readout` ← `--font-readout` (Satoshi). Fonts ship in `fonts/` as "Evoview Grotesk / Montserrat / Satoshi". |
| Accent (host-mapped) | `--ev-accent` ← `--primary` (#818cf8 fallback) · `--ev-accent-ink` ← `--primary-foreground` · `--ev-accent-deep` (62 % toward black on dark tones, translucent on light) · `--ev-accent-signal` (pulled toward the tone foreground: 88 % on dark, 62 % on light — strokes, thin fills, focus, accent text) |
| Tone (`.ev-tone-dark` default, `.ev-tone-light`, `.ev-tone-paper`) | `--ev-bg`, `--ev-bg-alt`, `--ev-shell`, `--ev-fg` + ladder `-90 -65 -55 -35 -12`, `--ev-line`, `--ev-line-strong`, `--ev-surface`, `--ev-surface-list`, `--ev-surface-list-alt`, `--ev-well`, `--ev-glass`, `--ev-glass-line`, `--ev-plate`, `--ev-plate-ink`, `--ev-error`, `--ev-error-text`. Tone classes also paint `background` + `color`. |
| Text-list surfaces (RULES §3) | `--ev-surface-list` / `--ev-surface-list-alt`: two quiet steps off the environment for lists of text (tiles with a small gap, or joined alternating rows). Dark `#141416` / `#18181a` (raised), light `#f8f8f6` / `#fcfcfb` (raised), paper `#f5f5f3` / `#f0f0ee` (recessed). No borders on them; text ladder unchanged; radius `surface` for tiles, 0 for joined rows. Not for selection (`--ev-surface`) or media (`--ev-well`). |

Host-mapped tokens re-resolve on every `.ev-root` and tone class, so a subtree
that sets `--primary` (palette, per-item accent) is honoured. Per-item accent
= set `--primary` / `--primary-foreground` on that subtree.

## Classes

Type voices (floors applied): what it is — `.ev-t-display`, `.ev-t-title`,
`.ev-t-heading`, `.ev-t-section-feature`, `.ev-t-section`, `.ev-t-card`,
`.ev-t-question` (sentence case); why/how — `.ev-t-lead`, `.ev-t-body`,
`.ev-t-compact`; where/state — `.ev-t-label` (Overused 700, controls),
`.ev-t-readout`, `.ev-t-readout-lg`, `.ev-t-index`.
Layout: `.ev-rail`, `.ev-rail--wide`, `.ev-track-gutters`, `.ev-chapter`
(`--compact`, `--cinematic`), `.ev-hairline`. Misc: `.ev-sr`, `.ev-ambient`.

## JS API

```ts
cn(...classes): string
pad(n, width = 2), formatIndex(current1Based, total) // "01 / 04"
inkFor(color): "#101011" | "#fafafa"                 // contrast ink for --primary-foreground
motion, breakpoints, mediaGate, EVOVIEW_URL

// Pause model
suspendBackground(): () => void          // ref-counted; sets <html data-ev-suspended>
useSuspendBackground(active: boolean)    // for modals
useBackgroundSuspended(): boolean
isBackgroundSuspended(), subscribeSuspension(cb)
useInViewPause(ref, { rootMargin?, threshold?, ignoreSuspension?, enabled?, once? })
  → { active, inView, documentVisible, suspended }
  // once: `active` latches true after the first activation, observing stops (reveal once, lazy load)
  // follows ref.current: an element mounted later or swapped by a keyed remount is (re)observed
useMediaQuery(query, serverValue = false): boolean  // live matchMedia; serverValue on the server and while hydrating
useHydrated(): boolean                   // false on the server and while hydrating

// Timed sequences: only enabled time counts, remainder carried, new key = 0
useSequenceClock(key, enabled, durationMs, onElapsed)
  → { key, duration, running, elapsed, done, progress(): 0–1, reset() }
sequenceFillStyle(clock): CSSProperties  // CSS fill that pauses with the clock; key the element by
                                         // clock.key so it mounts when the key starts (reset() needs a remount)

// Media gate
useMediaReady(open, sources, { graceMs = 350, minVisibleMs = 500, timeoutMs = 20000, video = "loadeddata" })
  → { ready, slow, failed, retry, loaded, total }
preloadMedia(sources, video = "loadeddata"): Promise<void>   // decode ahead of a gate (idle / intent)
```

`useMediaReady` sources: URLs or `{ src, type }` (type guessed from the
extension). Decoded sources are remembered for the session, so a cached
switch never flashes the loader. Show the loader while `slow`, the failure
state + `retry` when `failed`, reveal on `ready` (`ready` is false the
moment `open` turns false). Images count as ready on load + `decode()`
(decode capped at 1.5s); a video probe that stops at metadata (mobile
WebKit, data saver) counts as ready 1.2s after `loadedmetadata`.
`preloadMedia` decodes into the same session memory (images at low fetch
priority, shared in-flight requests, failures not remembered), so a gate
whose sources were preloaded is `ready` on its first render — no grace gap,
no loader. Call it on idle or on intent (hover / focus of a launcher) for
views the visitor is likely to open; it cannot be cancelled, so do not feed
it large videos speculatively.

## Server rendering and crawlable modals

Every hook and primitive renders on the server (`pnpm verify:ssr`):
environment reads go through `useSyncExternalStore` server snapshots
(visibility visible, not suspended, not in view, `useMediaQuery` →
`serverValue`), `useMediaReady` is not ready and never slow on the server
and while hydrating, `inkFor` gives the same ink on both sides for hex /
`rgb()` / `hsl()`. The suspension store is module-level, so a modal
hydrated in its own React root (island) still suspends the page. Contract
for modal packages: `docs/CRAWLABLE-MODALS.md`.

```ts
type ModalRoutes<C, V> = { views(c): V[]; parent(v): V | null; key(v): string; parse(c, key): V | null; head(c, v): ViewHead };
type ViewHead = { title; description /* ≤ 160 */; breadcrumb: string[]; image?: { src; alt } };
type RouteViewProps<V> = { view: V | null; onNavigate(v: V | null): void; hrefFor?(v: V | null): string; history?: boolean };

useRouteHistory({ view, routes, hrefFor?, onNavigate, history? })  // keeps window.history in step with the view
routeHrefs(base, routes.key) → (view | null) => string              // "<base>/<key>/", base for null
viewFromPath(pathname, base, routes, config) → V | null | undefined // inverse (undefined: outside base)
followRouteLink(event, action)            // onClick of a view link: plain click → action, modified click → native
<RouteLink href? onFollow disabled? …>    // <a href> + handler; <button> when href is undefined
<HeldCopy live>, useHeld(), useHeldSrc(src)  // copy mounted before media; no video src until live
ROUTE_LAYER_NOSCRIPT_CSS                  // <noscript><style> for prerendered view pages
```

`useRouteHistory`: one entry per level; open pushes the view's ancestry,
deeper = push, same level = replace, up = Back (lands on the ancestor of
the view on screen), close = Back past every level. A page loaded on the
view's URL first rewrites its entry to `hrefFor(null)`. Reload / Forward
onto its own entries adopts them, also entries left by an earlier document
of the page (no bfcache) when nothing is open and `hrefFor(entry.view)` is
the current URL; Forward after a close reopens through `onNavigate` (keep
the modal mounted). History state: `evRoute` (spread
over the existing state, so router keys survive). Without `hrefFor` the
entries keep the current URL.

`HeldCopy`: wrap the open view's copy, `live={gate.ready}`. Until live it
carries `data-ev-held` (CSS animations paused) and `useHeldSrc` returns
`undefined`; going live remounts it, so its entrance starts when the view
used to mount (state inside resets). Images keep their `src`.

Primitives: `<Readout size?>`, `<Index current total srLabel? size?>`,
`<StepGauge current total srLabel?>` (stacked-list position as a vertical
battery filled from the bottom; the norm for list rows, RULES §1; colour =
`currentColor`), `<SectionMarker live?>`, `<EvoviewMark label href?>`,
`<EvoviewLogo>`.
`<OrbFill on? hoverWithin? withFocus? withPress? controller? lit?>` — the
only way an orb changes colour (RULES §1): the new colour rises as liquid
with a wave surface, the content turning to the new ink, and drains on
reversal. Put it inside the orb (host `position: relative`, its radius, no
background of its own); it paints both states from `--ev-orb-rest`,
`--ev-orb-rest-ink`, `--ev-orb-lit` (default `--primary`), `--ev-orb-lit-ink`.
State from `on`, or from the closest `hoverWithin` host's hover / focus-visible
/ touch press (disabled or `aria-busy` hosts stay empty), or drive the level
yourself through `controller.current.to(0…1)`. `children` show at rest, `lit`
(default `children`) on the liquid. A settling transition, no loop. Imports
no CSS, so `../foundation/OrbFill` can be used without `foundation.css`.
`<TextFill ink? on? hoverWithin? hoverInk? withHover? withFocus? withPress? truncate?>`
— the only way text changes colour (RULES §1): the new colour rises through
the glyphs, going back drains it, a third colour rises over whichever
shows. Shown colour: `hoverInk` (default `--ev-text-lit`) while the
`hoverWithin` host is hovered / focus-visible / pressed, else
`--ev-text-lit` (default `--primary`) when `on`, else `ink` (any CSS colour,
for state colours; default `--ev-text-rest` = inherited `color`, so host
`color` rules keep working). The text is laid twice in one `inline-grid`
cell (the lit copy is aria-hidden): wrap a label, title or link text, not
words mid-paragraph; `truncate` keeps a single-line ellipsis. Inline SVG in
`currentColor` fills too (give an icon its own `TextFill`). Engine shared
with `OrbFill`: `liquid.ts`.
`<SurfaceFill hoverWithin withHover? withFocus? withPress?>` — a button
whose surface changes colour on hover pours it in: pass the button's
content again as children (styled for the filled state; override inner
colours with `.ev-surface-fill …` selectors), as the button's last child.
The copy lies over the button (inset 0, display / padding / gap / alignment
/ radius inherited) on `--ev-surface-lit`, ink `--ev-surface-lit-ink`; the
original stays in flow for layout and the accessible name. Host:
`position: relative`, no CSS hover background swap.
Icons: `ArrowRight`, `ArrowLeft`, `ArrowUpRight`, `Check`, `Close`,
`Chevron dir`.

## Motion policy (every package README must restate it)

No `prefers-reduced-motion` branch (architecture skill): one full-motion
experience. Instead every sequence has a complete stable state (final frame,
poster, every step reachable by click) and obeys the pause model: loops and
clocks run only while on-screen, the document is visible and no modal
suspends the page (`useInViewPause` + `useSequenceClock`); ambient CSS loops
carry `.ev-ambient` and pause under `[data-ev-paused]` or a suspended page
(modal content opts out with `data-ev-modal`); the rule covers the element's
`::before` / `::after` loops too. A loop on a deeper descendant needs its own
`.ev-ambient`.

## Attribution (approved placement)

`<EvoviewMark>` is the one linked Evoview wordmark per component: in its
header / chassis strip, `https://evoview.be/` (`EVOVIEW_URL`, verified), new
tab, `rel="noopener"`, no tracking, accessible name in the page language that
names Evoview and the new tab. Never inside or next to a client CTA. Further
marks are decorative (`<EvoviewLogo alt="">`, `aria-hidden`, ≤ .12 opacity).
On by default in every package config; turning it off is the founder's call.

## Client adaptation

Free: `--primary` / `--primary-foreground` (accent), `--font-heading` /
`--font-body` / `--font-readout` if the client's typography replaces the
Evoview voices, tone choice per section. Protected: scale, radius roles,
rhythm, motion tokens, floors, tone values, accent roles (signal only — never
backgrounds, body text or a resting primary plate).

## Host contract

React 19, Vite (`?raw` import for the wordmark, woff2 asset URLs),
TypeScript strict. No other dependency.

## Verification

`pnpm build`; `pnpm verify:ssr` (foundation section passes); a consuming package at 1440 / 1024 / 390: rendered root font
13.76 / 13.76 / 16px, no text below the floors, accent follows `--primary`
live, tones flip with the class, clocks stop off-screen / hidden tab / under
`suspendBackground()` and resume with the remainder.
