# navbar changelog

## 2.10.3

Fix. No config change, no visual change at rest. Requires nothing new
(foundation suspension API, present since 1.0.0).

- The bar's resting loops (eye pulse `nav-reticle-lids`, 3.2 s; REC dot
  `nav-page-pill-dot`, 1 s) are Web Animations, which ignore
  `html[data-ev-suspended]`: they kept running under an open modal. They now
  follow foundation suspension (`subscribeSuspension`), pausing in place and
  resuming from the same frame (no restart). Read in the loop's effect only:
  nothing changes in render, server HTML or hydration. Showcase dossier open:
  2 → 0 running navbar animations.

## 2.10.2

No config changes.

- Fix: the bar's `px-4` sat glued to a template expression
  (`` `…px-4${…}` ``), so Tailwind's scanner saw `px-4${prefersReducedMotion`
  and only generated `.px-4` when another source file used it. Production
  builds of hosts without another `px-4` (the library showcase) lost the
  bar's 16px side padding on phones. The class is now a separate token.

## 2.10.1

No config changes.

- Fix: with the current-page pill showing (multi-page sites off the home
  route, or `sectionPill`), the desktop unfold shift counted only the Menu
  pill as folding away, not the page slot beside it. The open finder slid
  left too far by the slot's width (≈ 100–180 px), or shifted where nothing
  overflowed. The shift now subtracts the whole trigger cell (Menu pill +
  page slot), so the open capsule ends on the 16px gutter exactly when it
  would cross it. Trays follow, as their clamp reads the shift. Mobile and
  the home route were unaffected.

## 2.10.0

Requires `foundation` ≥ 1.10.0 (`useScrollLock`). No config changes.

- Behaviour: the mobile finder locks page scroll through foundation's shared
  `useScrollLock` (before paint, ref-counted) instead of pinning `<body>`
  with `position: fixed` and scrolling back on close. The page keeps its
  offset natively (no `scrollTo` on close), a classic scrollbar's width is
  kept (narrow desktop windows), and a lock taken while the finder is open
  (a modal opened from a tray link) survives its close; the old cleanup
  restored the whole body `style` attribute. Focus trap, Escape and focus
  restore unchanged.
- CSS: `.ev-navbar { right: var(--ev-scroll-lock-gap, 0px) }`: the fixed bar
  keeps its centre while any foundation lock (dossier, step dossier, mobile
  finder) hides a classic scrollbar. Unlocked: unchanged.

## 2.9.0

- Sync (`docs/SYNC.md`): `evoview.json` (`requires` foundation `>=1.9.0 <2`;
  client-owned `navbar.config.tsx`, `navbar.theme.css`, `brand/`);
  `install.sh` wraps `sync.sh` (clean plans only). Fix: upgrades now delete
  files removed upstream (the old `install.sh` never did); local edits are
  merged and recorded as patches instead of overwritten.
- Config changes: new client-owned `src/navbar.theme.css` (every `--nav-*`
  token, commented defaults), imported by `index.ts` after the modules that
  load `navbar.css` / `navbar.lang.css`; created by the next sync, never
  overwritten. Token overrides move there (or stay in `config.vars`, which
  wins); editing the token block in `navbar.css` becomes a recorded patch.
  Existing config untouched; built CSS unchanged.
- Docs: ownership sections (RULES §13). "Adapting" is split into Signature /
  Variations / Expression: of the former "change with care" items only the
  ink scale stays client-adaptable; timings, gloss, mobile tile wash and tray
  card treatment are Signature (library changes).
- API (additive): exported variation arrays `NAV_RETICLES`,
  `NAV_TRAY_LAYOUTS` (new types `NavReticle`, `NavTrayLayout`). No config
  change.

## 2.8.0

Requires `foundation` ≥ 1.9.0 (press jelly). No config changes.

Performance (shipped in the 2.8.0 commit; no visual change):

- Fix: the live deck pill's REC dot blinked inside the folded deck
  (`opacity: 0` pill). An opacity loop with no visible box can't run on the
  compositor, so Blink ticked it on the main thread and re-layerized the
  whole page every frame (≈4.5 ms/frame at 4× CPU on multi-page routes).
- The resting loops (eye pulse, hud reticle blink, REC dots of the current
  page pill and the live deck pill) are Web Animations (`useLoop` in
  `finderShared.tsx`) instead of CSS `@keyframes`: React listens for
  `animationiteration`, so CSS loops woke the main thread at every
  iteration. Same keyframes, per-half `ease-in-out` and durations
  (1 s / 1.6 s / 3.2 s). Each loop holds while its mark is hidden (folded
  deck, folded page slot, desktop finder covered by the open deck, the
  `display: none` finder of the other breakpoint) and resumes in place.
  The hud dot yields to its CSS hover/expanded blink and restarts from its
  lit frame, as before. Loops start at hydration (static before it) and
  follow `prefers-reduced-motion` as before.
- CSS: removed `nav-eye-pulse` and the `animation` of `.nav-reticle-dot`,
  `.nav-reticle-lids` and `.nav-page-pill-dot`, plus
  `.nav-page-pill-dot--still` (the class is gone). Host CSS that set
  `animation` on these no longer affects the blink; the timings live in
  `REC_BLINK` / `RETICLE_BLINK` / `EYE_PULSE`.
- A fully folded deck (`data-folded`, ~700 ms after closing) skips its
  transitions; label swaps there finish their rise-in at once. Scrolling a
  one-page site no longer re-tones and re-labels the hidden deck frame by
  frame. Opening clears it in the same frame.
- The desktop finder's scroll dismissal returns early when there is nothing
  to close.

Press jelly:

- Behaviour: the finder trigger (Menu pill), deck pills (desktop and mobile)
  and the tray CTA take the press jelly (RULES §6). Tray rows and cover
  cards keep their own press feedback.
- CSS: removed the `:active` scales of the mobile trigger, mobile deck
  pills and `.nav-tray-cta`, `scale` from the mobile pills'
  `transition-property`, and the tray CTA's `transform` transition.

## 2.7.0

- Now depends on `foundation` (≥ 1.5.0): `install.sh` installs it first,
  and the package gets a `foundation -> ../foundation/src` symlink in the
  library.
- Behaviour: the tray rows' number orbs fill on hover / focus-visible /
  touch press with the liquid rise (foundation `OrbFill`, RULES §1) instead
  of a background cut; the 1.08 scale stays.
- CSS: `.nav-simple-menu-orb` declares `--ev-orb-rest(-ink)` /
  `--ev-orb-lit(-ink)` (light and dark tone) instead of hover
  `background` / `color` rules; `.nav-simple-menu-number` no longer sets a
  colour.
- Behaviour: the CTA tray's plate pours its hover colour in (foundation
  `SurfaceFill`; the accent on dark bars) instead of a background swap.
  CSS: `.nav-tray-cta` sets `--ev-surface-lit`.
- No config changes.

## 2.6.0

- Current page pill (multi-page sites, i.e. `activeKey` set): at rest the
  bar shows, right of the finder pill and in its colours, a blinking red
  REC dot (`--nav-rec-dot`, Evoview `redBlink` timing) and the page name
  (the matching tray entry's `title`, else the deck `label`). Not shown on
  the home route. Desktop: it
  folds away with the finder as the deck opens. Mobile: right of
  Menu/Close, truncated, folded while the menu is open; the wordmark no
  longer shrinks to make room.
- Multi-page sites: in the open deck (desktop and mobile), the live pill's
  icon is replaced by the same blinking REC dot.
- The live deck pill shows the current page's name (e.g. "Réservation"
  instead of "Composants"); its link still targets the section and its
  accessible name carries both.
- Desktop: hovering or focusing a tray entry previews its title on the
  tray's own pill (width glides, words rise in) only while that entry is
  hovered/focused; off an entry (gaps, tray title) the pill shows its own
  name again. Entry-to-entry moves swap straight, without a flash between.
- Multi-page sites: the live pill leads the deck (desktop and mobile); the
  other pills keep their configured order. A live CTA keeps its last slot;
  one-page sites keep the configured order.
- Mobile: in an odd deck the last tile always spans the last row (was CTA
  only).
- Mobile tray rows show the title only (no `meta` line), at 0.95em
  (was 0.78em). Desktop `rows` trays keep `meta`.
- Desktop tray cards drop the index numeral; `--nav-font-numeral` is
  removed (a leftover `vars` entry is harmless).
- Tray head is the section's `label` as a title (heading face, 1.125em),
  since the open pill may show a page name instead; no count. Mobile keeps
  the `sectionLink` at its end. `NavTray.unit` is now optional and unused.
- The current page's tray card holds the hover state at rest (sharp
  cover, accent grade, edge); other cards hover as before.
- Tray "active page" badge redesigned in the REC language: light plate
  (`--nav-current-item` `#fbf8f6`), red ink (`--nav-current-item-ink`
  `#c42a1f`), red dot (`--nav-current-dot` now defaults to `--nav-rec-dot`)
  on the REC blink.
- Per-section REC colour: optional `dot` on a deck entry. While that pill is
  live (multi-page), it colours every REC dot (page pill, live deck pill,
  tray badge; the badge ink is the dot darkened) and the finder's eye.
  Without it: dots `--nav-rec-dot`, eye the site accent. A deck entry with
  `dot` shows that dot instead of its icon (desktop and mobile, any page);
  only the live pill's dot blinks. Its tray is graded in the same colour
  (card overlay and hover edge, row orbs), over any row `accent`.
- The current-page pill animates: its slot unfolds from zero width (and
  folds away keeping its last contents), a change of page glides the
  pill's width and brings the new dot and name in (rise + fade).
- `sectionPill` (opt-in, one-page): the current-page pill follows the
  section in view (deck entry's dot + `label`), and that entry's deck dot
  blinks and leads the deck; nothing shows over sections without a deck entry.
- Config changes: optional `NavDeckEntry.dot`, `NavbarConfig.sectionPill`; otherwise none (uses
  `activeKey`, `currentPath`, `labels.currentItem` as screen-reader prefix).

## 2.5.0

- Active page in trays: the entry whose `href` matches the current route
  gets an indigo "active page" badge with a blinking green dot (top right on
  desktop cards, in place of the arrow on rows), plus
  `aria-current="page"`. The blink stops under reduced motion.
- Config changes (all optional): `currentPath` on `NavbarConfig` (set by
  `withRoute`, else read from `window.location.pathname`);
  `labels.currentItem` (badge text, default "Active page"); tokens
  `--nav-current-item`, `--nav-current-item-ink`, `--nav-current-dot`. Existing clients: add
  `currentItem` to `labels` per locale; optionally add `currentPath: path`
  to the return of their `withRoute`.

## 2.4.0

- Desktop cover cards read as titles: the cover is blurred at rest (3.5px)
  and sharpens on hover/focus, the title grows 1.125em → 1.375em, and the `meta`
  caption is no longer rendered on cards (rows and mobile keep it).
- Config changes: `cardMeta` removed from `NavTray`. Delete it from the
  client config; TypeScript flags it otherwise.

## 2.3.1

- Mobile now marks the live pill (`activeKey`, or the section in view):
  the tile takes the pressed wash + 70 % hairline and a 1.375em × 2px
  indicator bar under the label (plate ink on the CTA), so the state is not
  colour-only. Both finders set `aria-current` (`page` on multi-page sites,
  `location` on one-page sites); desktop's lit gloss is unchanged.
- `--nav-font-numeral` now falls back to the readout face
  (`--nav-font-technical`) instead of the heading face. Gaegu stays only in
  `examples/evoview.config.tsx` (evoview.be's art direction).
- Config changes: none. A client that wants the old numeral sets
  `vars["--nav-font-numeral"]`.

## 2.3.0 — cover-card trays, route entries (evoview.be finder, 2026-10-22)

Ported from the evoview.be working tree (`src/components/nav/*`) and its
live behaviour. Mobile is unchanged: the library's 2.x mobile (edge-slide
tiles, accent wash, eye reticle) was already ahead of the site.

Config (additive; existing configs compile and behave as before):

- `NavTrayItem.cover?: string | ReactNode` — desktop card artwork: image URL
  (900×216 banner, fades in once decoded) or a rendered preview node.
- `NavTrayItem.href?: string` — the entry renders as `<a href>`; routed by
  `useNavbarLinks`; tracked as `nav_click`.
- `NavTrayItem.onSelect` is now optional and receives the click event
  (`preventDefault()` cancels the `href`). Give each entry `href`, `onSelect`
  or both.
- `NavTray` (`kind: "items"`): `layout?: "cards" | "rows"` (default `cards`
  when any entry has a cover), `cardMeta?: boolean` (show `meta` on cards).
- Tokens: `--nav-font-numeral` (card index numeral; falls back to the
  heading font; Evoview uses Gaegu 700), `--nav-tray-card-h` (6em).
- Reference config (fresh installs only): a four-entry route tray under
  Services; `withRoute()` lights a pill on its sub-routes (`/services/x`).

Behaviour:

- Desktop cover trays: entries stack as full-width cards — monochrome cover,
  centred uppercase title, handwritten index numeral; hover/focus grades the
  cover with the entry accent, zooms 4 % and draws a 2px accent edge. Items
  stagger in (36 ms). ↑/↓ step one card. Covers are prefetched when the
  pointer or focus first reaches the finder.
- Desktop tray centres on its pill and is clamped to 16px viewport gutters
  (was: left-aligned and kept inside the capsule span).
- Narrow desktops: when the unfolded deck would cross the viewport edge, the
  finder slides left by exactly the overflow, timed with the unfold
  (`--nav-finder-shift`; 460 ms open / 380 ms close).
- Fix: `useNavbarLinks` resolves the clicked link from the event's dispatch
  path. Closing the desktop menu unmounts the tray entry before the click
  reaches the document, which made every route entry a full page reload.

## 2.2.0 — reference rebranded to Evoview

The 2.0.0 reference config carried Tchin Tchin branding (gold, restaurant
logo, Carte/Karaoké/Réserver). The library is Evoview's: the reference now
uses the Evoview wordmark (`src/brand/EvoviewLogo.tsx`), brand indigo
`#3f51b5` with the Méthode/Portfolio/Contact accents, the built-in eye marks,
and Accueil / Services / Portfolio / Méthode / FR·EN / Contact over routes.
Mechanics are unchanged from 2.1.0 (multi-page shape, language switch, eye
reticle, tiles). No config contract change; `install.sh` upgrades leave client
configs and `brand/` untouched. `tchin-logo.svg` removed from the package.

## 2.1.0

- Restore the eye's 3.2s opacity pulse on a separate, stacked lids SVG with
  `will-change: opacity`. Corners and pupil remain in the upper SVG; paths
  themselves do not pulse. HUD hover/open choreography is unchanged, and
  both reduced-motion mechanisms disable the pulse.
- Chrome profiling (4s steady idle windows): 2.0.1 static **0 Paint**,
  reproduced old single-SVG/path pulse **0 Paint**, split-SVG pulse **0 Paint**.
  Respectively, UpdateLayer counts were 0 / 0 / 6 and CompositeLayers counts
  were 0 / 0 / 0. Chrome already composites the old SVG-child animation;
  these measurements do not demonstrate a before/after paint improvement.
- The separate SVG box is retained for cross-engine compositing: Safari and
  Firefox do not share Chrome's SVG-child animation compositing support.
  Element-level opacity provides the independent layer boundary instead.
  Safari/Firefox performance was not measured in this verification.
- Config changes: none.

## 2.0.1

- `eye` reticle no longer pulses. The infinite opacity loop on an SVG path
  forced a full header repaint (backdrop blur included) every frame while the
  page sat idle. The eye is now static at rest; nothing animates until hover.
  Known remaining idle loop: `hud` mode's REC dot blink (`nav-rec-blink`),
  used only by the evoview example.

## 2.0.0 — the Tchin Tchin refinements become the baseline

The reference is now a typical client shape (resto-tchin): multi-page site,
five pills + CTA, lucide marks, language switch, no trays. Evoview's one-page
config moved to `examples/evoview.config.tsx` (rendered at `/evoview` in the
showcase).

Config (`NavbarConfig`):

- `accent` — brand accent; drives focus ring, CTA glow/hover, mobile tiles,
  language thumb and the pupil fallback. Set inline, no CSS edit needed.
- `vars` — any `--nav-*` token override from the config.
- `reticle: "eye" | "hud"` — default is now `eye` (solid accent almond with a
  pupil); evoview's outlined blinking lids are `hud`. **Breaking** for 1.x
  configs that want the old look: add `reticle: "hud"`.
- `activeKey` — live pill by deck key for multi-page sites (`withRoute()` in
  the reference config derives it from the pathname).
- Deck entries: `content` (replace icon+label with any node; `label` becomes
  the aria-label) and `keepOpen` (click leaves the menu open).

New exports: `NavLangSwitch` (deck `content` language toggle, styles in
`navbar.lang.css`), `useNavbarLinks(navigate)` (hands internal deck clicks
to a client router), `DeckIcon`.

Behaviour:

- Desktop: hover cannot reopen the menu right after a click closed it until
  the pointer leaves; a `keepOpen` click suppresses the scroll-dismiss for
  500 ms (page reflow is not the reader scrolling).
- Mobile: MENU⇄CLOSE morphs between measured word widths (the 1fr/0fr grid
  snapped at the end); deck pills are resting tiles (accent wash + hairline,
  full-ink label, no gloss — gloss stays on the CTA), columns slide in from
  their own edge with a per-row delay; scroll restore after close is
  `instant` so a page-level `scroll-behavior: smooth` can't animate it;
  trigger pulled in `-0.25em` so the capsule's three gaps match; capsule is
  `calc(100% - 1.5rem)` wide.
- Tokens: `--nav-font-technical` falls back to the body font; body font
  fallback is Inter; `--nav-accent-ink`, `--nav-mobile-pill-accent`,
  `--nav-eye-pupil`, `--nav-eye-iris` added.

`brand/` now holds the Tchin logo; evoview assets live in
`examples/evoview-brand/`. `install.sh` still preserves `navbar.config.tsx`
and `brand/` on upgrade.

## 1.1.0

Additive; no config change required.

- SSR: `useNavState` no longer calls `CSS.escape` unguarded (crashed
  `renderToString`).
- `config.initialTone` (`"light" | "dark"`): tone before the first probe, so a
  prerendered dark site does not flash light glass.
- `--nav-logo-dark-filter` token (default `invert(1)`): set `none` for a
  coloured wordmark.
- Mobile deck: a trailing CTA in an odd-count deck spans the last row.

## 1.0.0

Extracted from evoview.be (`src/components/nav/*`, `SiteHeader.tsx`, the
`NAVIGATION` blocks of `index.css`). Behaviour and visuals unchanged; the
site-specific imports were replaced by `NavbarConfig`:

- data (`navigation.ts`, `sectionAccents.ts`, `navigationManifest.ts`) → `config.sections`, `config.deck`, `config.trays`
- `navIntents.ts` / `analytics.ts` → `NavTrayItem.onSelect`, `config.onSection`, `config.track`
- `EvoviewLogo` → `config.logo`
- global tokens (`--ease-*`, `--vs-radius-*`, `--font-*`, `redBlink`, `.type-technical-label`) → `--nav-*` with fallbacks in `navbar.css`
- `hidden md:block` / `md:hidden` → `navbar.css` breakpoint rules + `DESKTOP_QUERY`
- icon key `partners` renamed `portfolio`, `candidature` renamed `envelope`
