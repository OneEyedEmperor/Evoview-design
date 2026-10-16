# navbar changelog

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
