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
                                                   └── optional tray centred under a pill: stacked cover cards,
                                                       2×2 numbered rows, or a CTA block
mobile    [ logo        (◉ MENU) ]  →tap→  [ logo        (◉ FERMER) ]
                                           [ (⌂ ACCUEIL)(◎ SERVICES) ]   ← resting tiles, slide in from their edge
                                           [ (◎ PORTFOLIO)(◎ MÉTHODE)]
                                           [ (⇄ FR EN)(✉ CONTACT)    ]   ← an odd count would give the CTA the whole last row
                                           [ SERVICES        VOIR → ]   ← tapped pill's tray, in the capsule: single-column rows
```

## Signature (preserve)

What stays recognizably Evoview on every client (`STRATEGY.md`); changing it
is a library change, never a client edit (RULES §13):

- The glass capsule, the eye reticle, the unfold choreography, the mobile
  tiles, the pill typography, and the tray cards (monochrome cover at rest,
  the entry's accent grading it on hover).
- Tuning in `navbar.css` / `NavFinder.tsx`:
  - Timings in `.nav-finder` (`460ms` open / `380ms` close, `35ms` stagger)
    and `OPEN/CLOSE/TRAY_DELAY` in `NavFinder.tsx`. Keep the open
    faster-out than the close eases-in-out.
  - Gloss gradients (`--nav-gloss-*`): adjust lightness, keep the single
    sweep.
  - Mobile tile wash/hairline percentages (7 % / 26 % resting, 14 % / 70 %
    pressed).
  - Tray card treatment: `grayscale(1) brightness(.62)` at rest →
    `grayscale(.6) brightness(.82)` + 4 % zoom + accent grade and 2px edge
    on hover/focus; dark `#0c0c0d` plate on both tones.
- Structural (breaking any of these needs a redesign):
  - The 0fr⇄1fr grid-track morph and the mask feathering (desktop cells,
    mobile body); the measured-width word morph; the measured tray height.
  - The resting-width anchor on desktop, and the unfold shift that slides
    the finder left by exactly the overflow when the open deck would cross
    the 16px viewport gutter.
  - The tray centres on its pill (from the settled unfold, not the mid-
    transition position) and only yields to the 16px viewport gutters.
  - Panels stay mounted, hidden with `visibility`/`inert`; never
    conditionally render them.
  - Mouse click never closes a hover-opened menu; hover never reopens a menu
    a click just closed until the pointer leaves; `keepOpen` clicks hold off
    the scroll-dismiss for 500 ms.
  - Scroll lock (foundation `useScrollLock`, shared with the modals' locks)
    + focus trap + Escape + focus restore on mobile; the fixed bar's `right`
    follows `--ev-scroll-lock-gap` under any lock; Escape/
    blur/scroll/resize dismissal on desktop; arrow-key navigation in deck
    and tray.
  - Reduced motion resolves to the same end states with no slide or stagger.
  - Tone detection by DOM probe, not by a list of section ids in the header.
- **Attribution:** on a client site the navbar carries the client's logo and
  no Evoview mark or link; Evoview authorship is carried by the signature
  above. Do not add an Evoview mark, credit link or referral destination to
  the navbar without explicit approval and a supplied destination
  (`STRATEGY.md`).

## Variations (select)

- **Site shape:** one-page (`sections` + `section` per pill, optional
  `sectionPill`; `examples/evoview.config.tsx`) or multi-page
  (`sections: []` + `activeKey` via `withRoute`).
- `reticle`: `NAV_RETICLES` — `eye` (default) · `hud`.
- Per pill: a tray (`kind: "items"`, `layout` from `NAV_TRAY_LAYOUTS`:
  `cards` · `rows`, default `cards` when any entry has a cover), a `cta`
  block, or none (the pill navigates).

## Expression (adapt)

Config only: copy, language, routes/anchors, deck count (3–6) and order,
which pill is the CTA, icons (lucide or custom nodes), `accent`, every
`vars` token, logo, tray contents and covers (`--nav-tray-card-h`,
`--nav-tray-w`); tokens can also live in the client-owned `navbar.theme.css`.
In `navbar.css`: the ink scale (`#151515`, the `rgba(21,21,21,…)` ramp) — a
global replace if the client's ink is not near-black; keep the light/dark
pairs symmetrical (sync records it as a local patch).

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/navbar.config.tsx` | Every label, destination, colour, token and action. | **yes** (client-owned, like the theme file) |
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
| `src/navbar.theme.css` | Client-owned: every `--nav-*` token, commented with its default; loaded after `navbar.css`. Never overwritten by sync. | yes (or `config.vars`, which wins) |
| `src/navbar.css` | All styles, scoped under `.ev-navbar`. Tokens block at the top (defaults). | no: tokens go in `navbar.theme.css`; an ink-scale edit here is a recorded local patch |
| `examples/evoview.config.tsx` | One-page config with sections and cover-card trays (`examples/evoview-brand/`). Not installed. | — |

## Install

```bash
L=/root/.vibehub/projects/evoview-design-library
$L/sync.sh plan /root/.vibehub/projects/<client> navbar   # read-only: files, deps, compat, changelog
$L/sync.sh apply /root/.vibehub/projects/<client> navbar  # then resolve conflicts, fill patch reasons
$L/sync.sh verify /root/.vibehub/projects/<client>
```

Writes `src/` to `<client>/src/components/navbar/`, plus `foundation` (the
menu number orbs fill through its `OrbFill`) when absent or too old;
`navbar.config.tsx`, `navbar.theme.css` (tokens) and `brand/` (first
install only) are client-owned, never overwritten. `install.sh <client>`
applies clean plans only. Contract: `docs/SYNC.md`.

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
- Anchors and routes (deck pills and tray entries with `href`) are plain
  `<a href>`. A client router must intercept them: `useNavbarLinks(navigate)`.
  Server rendering works (`renderToString`).
- Tray covers: 900×216 WebP banner crops of the entry's own artwork
  (≈5–100 kB each). They are fetched when the pointer first reaches the
  finder and fade in once decoded; a missing cover leaves the dark card.
- Desktop/mobile swap at `768px`, defined twice: `navbar.css` (`@media`) and
  `DESKTOP_QUERY` in `NavFinderMobile.tsx`. Change both or neither.
- Press feedback: the Menu pill, deck pills and tray CTA take foundation's
  press jelly (RULES §6, `data-ev-jelly`); don't add an `:active` scale or
  a `scale` transition to them in host CSS.
- Deck of 3–6 entries; the reference has six (four destinations, language
  switch, CTA). The CTA spans the last mobile row when the count is odd.

## Config reference

`src/types.ts` is the source of truth. Summary:

| Field | What it controls |
| --- | --- |
| `logo` | Wordmark node, sized by `--nav-logo-*`. Black artwork is inverted on dark; coloured artwork → `vars["--nav-logo-dark-filter"] = "none"`. |
| `homeHref` | Wordmark link. |
| `labels` | `menu`, `close` (mobile morph), `sectionLink`, aria strings, `loading`, optional `currentItem` (active-page badge, default "Active page"). |
| `accent` | Brand accent → focus ring, CTA glow/hover, mobile tiles, language thumb, pupil fallback. |
| `vars` | Any `--nav-*` token (logo box, fonts, radii, tray width, `--nav-eye-pupil`, …). |
| `reticle` | `eye` (default: solid accent almond + pupil, quiet pulse) or `hud` (outlined lids that blink on hover). |
| `sections` | `{ id, color }[]` in document order, or `[]`. `color` = pupil colour. |
| `activeKey` | Live pill on multi-page sites. `withRoute()` derives it from the pathname. Also turns on the resting current-page pill (blinking REC dot `--nav-rec-dot` + page name, finder colours, right of the finder; none on the home route), and the live deck pill swaps its icon for the same dot and moves to the front of the deck (a CTA keeps its slot). |
| `sectionPill` | One-page sites (or a one-page route of a multi-page site): show the current-page pill for the section in view (live entry's dot + deck `label`), blink that entry's dot and lead the deck with it. Off by default. |
| `currentPath` | Route used to mark the tray entry whose `href` matches it (`currentItem` badge with a blinking dot; `--nav-current-item`, `--nav-current-dot`). Set by `withRoute()`; falls back to `window.location.pathname`. |
| `initialTone` | Tone before the first probe. `"dark"` for a dark first screen. |
| `deck` | Pills: `key`, `label`, `icon` (built-in key or node), `href` (`<a>`; omit → `<button>`), `section`, `accent`, `dot` (replaces the icon with a dot of that colour, blinking only while live; multi-page: also the REC dots + finder eye colour while this pill is live), `cta`, `content` (replaces icon+label, e.g. `<NavLangSwitch>`), `keepOpen` (click leaves the menu open). |
| `trays` | Per deck key, optional. `items` (array or loader) + `unit` + optional `layout` (`cards` \| `rows`; default `cards` when any entry has a cover; cards show the title only, over a cover blurred at rest and sharp on hover); or a `cta` block. No tray → the pill navigates on first interaction. |
| tray entry | `id`, `title`, `meta` (short description), `accent`, `cover` (image URL or rendered node; desktop cards only), `href` (route/anchor → `<a>`), `onSelect(event)` (runs first; `preventDefault()` cancels the `href`). |
| `onSection` | Intercept a pill click; `event.preventDefault()` to replace the navigation (locale flip, modal). |
| `track` | `nav_click` (pills, `href` entries), `nav_modal_open` (`onSelect`-only entries), `cta_click` with payloads. |

Tray entries route with `href`; `onSelect` is where a site opens its own
modal or scrolls. The navbar never owns a modal. Desktop shows cover cards
stacked in one column (or 2×2 rows); mobile always shows single-column rows
(title only), plus the `sectionLink` to the pill's own `href`.

## Verification (do all of it before reporting done)

```bash
pnpm build                       # must be green
```

In the browser (agent-browser or browser-bridge), at the client dev URL:

1. **1440×900**: hover MENU → capsule unfolds right, wordmark does not move;
   the live pill is lit. Click a pill → route/anchor changes, menu closes,
   and it does **not** reopen under the still pointer. Hover each pill with
   a tray → tray slides in centred under it; covers fade in monochrome and
   take the entry accent on hover. An entry click fires its action or routes
   **without a full page reload**, and the menu closes. Keyboard: ↓ from a
   pill enters the tray, ↑/↓ step one card (two rows in a 2×2 tray).
2. **1024×800**: same; pills must not wrap, the unfolded capsule slides left
   to stay 16px inside the viewport, trays stay inside it too.
3. **390×844**: tap MENU → capsule unfolds down, pills slide in from their
   edges, MENU morphs smoothly to the close word (no snap at the end), page
   dims and does not scroll. CTA fills the last row. The live page's tile
   shows the stronger hairline and the short indicator bar, with
   `aria-current` (same pill as desktop). Tap a pill → navigates
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

`sync.sh plan <client> navbar` lists the changelog between the installed and
target version and the config template diff; apply the config changes by
hand, `sync.sh apply`, resolve conflicts / fill patch reasons, `sync.sh
verify`, then the verification above.
