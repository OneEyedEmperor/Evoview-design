# navbar

The Evoview finder navigation: one glass capsule (wordmark + eye/MENU pill)
that unfolds into a deck of pills, each with an optional sliding tray.
Sideways on desktop, downward on mobile. Re-tones (light/dark glass) to the
surface under it; the eye's pupil carries the section accent on one-page sites.

Reference: `https://evoview-library.said.bet` — Evoview-branded, multi-page
shape (the baseline every client starts from) · `/evoview` there: the
evoview.be one-page shape with sections and trays. Live client example:
`https://resto-tchin.said.bet` (same component, restaurant branding via config).

```
desktop   [ logo  (◉ MENU) ]  →hover→  [ logo  (⌂ ACCUEIL)(◎ SERVICES)(◎ PORTFOLIO)(◎ MÉTHODE)(⇄ FR EN)(✉ CONTACT) ]
                                                   └── optional tray under a pill: 2×2 numbered rows, or a CTA block
mobile    [ logo        (◉ MENU) ]  →tap→  [ logo        (◉ FERMER) ]
                                           [ (⌂ ACCUEIL)(◎ SERVICES) ]   ← resting tiles, slide in from their edge
                                           [ (◎ PORTFOLIO)(◎ MÉTHODE)]
                                           [ (⇄ FR EN)(✉ CONTACT)    ]   ← an odd count would give the CTA the whole last row
```

What stays recognizably Evoview on every client (the signature, see
`STRATEGY.md`): the glass capsule, the eye reticle, the unfold choreography,
the mobile tiles and the pill typography. What a client changes: logo, accent,
copy, destinations, icons (config only).

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/navbar.config.tsx` | Every label, destination, colour, token and action. | **yes — the only one** |
| `src/brand/` | Evoview wordmark (reference). Replace with the client's. | yes |
| `src/types.ts` | `NavbarConfig` contract (every field commented). | no |
| `src/Navbar.tsx` | Root: tone/section probe, `accent`/`vars` → CSS, mounts both finders. | no |
| `src/NavFinder.tsx` | Desktop finder (hover state machine, tray positioning, keyboard). | no |
| `src/NavFinderMobile.tsx` | Mobile finder (fold, word morph, scroll lock, focus trap). | no |
| `src/finderShared.tsx` | Reticle, tray rows, action handlers. | no |
| `src/NavIcons.tsx` | Built-in marks (`services`, `portfolio`, `method`, `envelope`) + `DeckIcon`. | no |
| `src/NavLangSwitch.tsx` + `navbar.lang.css` | Language toggle for a deck entry's `content`. | no |
| `src/useNavbarLinks.ts` | Hands internal deck clicks to a client-side router. | no |
| `src/useNavState.ts` | Scroll probe → `{ tone, section, color }`. | no |
| `src/useNavTrays.ts` | Idle loader + cache for lazy tray contents. | no |
| `src/navbar.css` | All styles, scoped under `.ev-navbar`. Tokens block at the top. | tokens only (prefer `config.vars`) |
| `examples/evoview.config.tsx` | One-page config with sections and trays. Not installed. | — |

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/navbar/install.sh /root/.vibehub/projects/<client>
```

Copies `src/` to `<client>/src/components/navbar/`. Re-running upgrades the
components and preserves `navbar.config.tsx` + `brand/`.

Mount once in the page shell, before `<main>`.

Multi-page site (react-router):

```tsx
import { Navbar, useNavbarLinks } from "@/components/navbar";
import { buildNavbarConfig, withRoute } from "@/components/navbar/navbar.config";

const navigate = useNavigate();
useNavbarLinks(useCallback((to: string) => navigate(to), [navigate]));
const config = useMemo(() => withRoute(buildNavbarConfig(locale, setLocale), pathname), [locale, pathname]);
<Navbar config={config} />
```

One-page site: export a constant `navbarConfig` with `sections` filled and
`section` on each pill (see `examples/evoview.config.tsx`), then
`<Navbar config={navbarConfig} />`.

`Navbar.tsx` imports its CSS itself; nothing to add to `index.css`.

## Host contract

- React 19 (uses the `inert` prop), Vite, TypeScript strict, Tailwind v4 (the
  JSX uses utility classes for layout; the breakpoint is **not** Tailwind's,
  see below). `lucide-react` only if the config uses lucide marks.
- The element behind the bar on load is dark → `initialTone: "dark"` and
  `data-nav-tone="dark"` on the page wrapper (or on each dark section). The
  bar renders light glass over anything else.
- One-page sites: every `config.sections[].id` exists as an element id in the
  page. Multi-page sites: `sections: []` + `activeKey` (via `withRoute`).
- `config.sections` must be a module-level constant (the scroll store is keyed
  by reference). The config object itself may be rebuilt per locale/route.
- Fonts: reads `--font-heading`, `--font-body`, `--font-technical` from
  `:root`; falls back to Overused Grotesk / Inter / body. Load whatever the
  fallback resolves to, or set the variables.
- Anchors and routes are plain `<a href>`. A client router must intercept
  them: `useNavbarLinks(navigate)`. Server rendering works (`renderToString`).
- Desktop/mobile swap at `768px`, defined twice: `navbar.css` (`@media`) and
  `DESKTOP_QUERY` in `NavFinderMobile.tsx`. Change both or neither.
- Deck of 3–6 entries; the reference has six (four destinations, language
  switch, CTA). The CTA spans the last mobile row when the count is odd.

## Config reference

`src/types.ts` is the source of truth. Summary:

| Field | What it controls |
| --- | --- |
| `logo` | Wordmark node, sized by `--nav-logo-*`. Black artwork is inverted on dark; coloured artwork → `vars["--nav-logo-dark-filter"] = "none"`. |
| `homeHref` | Wordmark link. |
| `labels` | `menu`, `close` (mobile morph), `sectionLink`, aria strings, `loading`. |
| `accent` | Brand accent → focus ring, CTA glow/hover, mobile tiles, language thumb, pupil fallback. |
| `vars` | Any `--nav-*` token (logo box, fonts, radii, tray width, `--nav-eye-pupil`, …). |
| `reticle` | `eye` (default: solid accent almond + pupil, quiet pulse) or `hud` (outlined lids that blink on hover). |
| `sections` | `{ id, color }[]` in document order, or `[]`. `color` = pupil colour. |
| `activeKey` | Live pill on multi-page sites. `withRoute()` derives it from the pathname. |
| `initialTone` | Tone before the first probe. `"dark"` for a dark first screen. |
| `deck` | Pills: `key`, `label`, `icon` (built-in key or node), `href` (`<a>`; omit → `<button>`), `section`, `accent`, `cta`, `content` (replaces icon+label, e.g. `<NavLangSwitch>`), `keepOpen` (click leaves the menu open). |
| `trays` | Per deck key, optional. `items` (array or loader) + `unit`, or `cta` block. No tray → the pill navigates on first interaction. |
| `onSection` | Intercept a pill click; `event.preventDefault()` to replace the navigation (locale flip, modal). |
| `track` | `nav_click`, `nav_modal_open`, `cta_click` with payloads. |

Tray `onSelect` is where a site opens its own modal, routes, or scrolls. The
navbar never owns a modal.

## Adapting

**Change freely** (config only):

- Copy, language, routes/anchors, deck count and order, which pill is the
  CTA, icons (lucide or custom nodes), `accent`, every `vars` token, logo,
  `reticle`, tray contents.

**Change with care** (in `navbar.css`; these make it feel like this component):

- Ink scale (`#151515`, the `rgba(21,21,21,…)` ramp) — a global replace if
  the client's ink is not near-black. Keep the light/dark pairs symmetrical.
- Timings in `.nav-finder` (`460ms` open / `380ms` close, `35ms` stagger)
  and `OPEN/CLOSE/TRAY_DELAY` in `NavFinder.tsx`. Keep the open faster-out
  than the close eases-in-out.
- Gloss gradients (`--nav-gloss-*`): adjust lightness, keep the single sweep.
- Mobile tile wash/hairline percentages (7 % / 26 % resting, 14 % / 70 % pressed).

**Do not change** (structural; breaking any of these needs a redesign):

- The 0fr⇄1fr grid-track morph and the mask feathering (desktop cells, mobile
  body); the measured-width word morph; the measured tray height.
- The resting-width anchor on desktop.
- Panels stay mounted, hidden with `visibility`/`inert`; never conditionally
  render them.
- Mouse click never closes a hover-opened menu; hover never reopens a menu a
  click just closed until the pointer leaves; `keepOpen` clicks hold off the
  scroll-dismiss for 500 ms.
- Scroll lock + focus trap + Escape + focus restore on mobile; Escape/blur/
  scroll/resize dismissal on desktop; arrow-key navigation in deck and tray.
- Reduced motion resolves to the same end states with no slide or stagger.
- Tone detection by DOM probe, not by a list of section ids in the header.

## Verification (do all of it before reporting done)

```bash
pnpm build                       # must be green
```

In the browser (agent-browser or browser-bridge), at the client dev URL:

1. **1440×900**: hover MENU → capsule unfolds right, wordmark does not move;
   the live pill is lit. Click a pill → route/anchor changes, menu closes,
   and it does **not** reopen under the still pointer. Hover each pill with
   a tray → tray slides under it inside the capsule span; a row click fires
   the site action.
2. **1024×800**: same; five pills must not wrap.
3. **390×844**: tap MENU → capsule unfolds down, pills slide in from their
   edges, MENU morphs smoothly to the close word (no snap at the end), page
   dims and does not scroll. CTA fills the last row. Tap a pill → navigates
   (or its tray unfolds). Escape/backdrop closes; page position unchanged.
4. Language pill (if any): flips copy in place, menu stays open, thumb
   slides, page does not jump.
5. Tone: dark first screen renders dark glass on first paint (no light
   flash). One-page sites: glass flips exactly when a dark section reaches
   the bar; pupil takes each section's `color`.
6. Keyboard: Tab to MENU, Enter → first pill; ←/→ cycle; ↓ enters a tray;
   Esc closes the tray then the menu, focus returns.
7. `prefers-reduced-motion: reduce`: everything still opens/closes, nothing
   slides.
8. Brand fonts: pill labels (0.75em, 700, 0.14em tracking) fit at the deck's
   natural width; the logo box (`--nav-logo-*`) matches the artwork ratio.

## Upgrading a client

Re-run `install.sh`. Read `CHANGELOG.md` for the versions between
`<client>/src/components/navbar/.navbar-version` and `VERSION`; apply any
config changes it lists; run the verification.
