# navbar changelog

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
