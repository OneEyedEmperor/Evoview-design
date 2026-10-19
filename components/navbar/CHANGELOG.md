# navbar changelog

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
