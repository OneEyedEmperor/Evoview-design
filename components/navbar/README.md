# navbar

The Evoview finder navigation: one glass capsule (wordmark + reticle/MENU
pill) that unfolds into a deck of pills with a sliding tray under each.
Sideways on desktop, downward on mobile. Re-tones (light/dark glass) to the
section under it; the reticle's dot blinks in that section's accent.

Reference: `https://evoview.said.bet` (live site) · `https://evoview-library.said.bet` (this package, showcase).

```
desktop   [ logo  (◎ MENU) ]  →hover→  [ logo  (◎ SERVICES)(◎ PORTFOLIO)(◎ MÉTHODE)(✉ CONTACT) ]
                                                     └── tray: 2×2 numbered rows, or the CTA block
mobile    [ logo        (◎ MENU) ]  →tap→  [ logo (◎ FERMER) ]
                                           [ (◎ SERVICES)(◎ PORTFOLIO) ]
                                           [ (◎ MÉTHODE) (✉ CONTACT)  ]
                                           [ tray of the tapped pill   ]
```

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/navbar.config.tsx` | Every label, destination, colour and action. | **yes — the only one** |
| `src/brand/` | Reference logo + tray data (evoview.be). Replace or delete. | yes |
| `src/types.ts` | `NavbarConfig` contract. | no |
| `src/Navbar.tsx` | Root: tone/section probe, mounts both finders. | no |
| `src/NavFinder.tsx` | Desktop finder (hover state machine, tray positioning, keyboard). | no |
| `src/NavFinderMobile.tsx` | Mobile finder (fold, scroll lock, focus trap). | no |
| `src/finderShared.tsx` | Reticle, tray rows, action handlers. | no |
| `src/NavIcons.tsx` | Built-in marks: `services`, `portfolio`, `method`, `envelope`. | no |
| `src/useNavState.ts` | Scroll probe → `{ tone, section, color }`. | no |
| `src/useNavTrays.ts` | Idle loader + cache for lazy tray contents. | no |
| `src/navbar.css` | All styles, scoped under `.ev-navbar`. Tokens block at the top. | tokens only |

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/navbar/install.sh /root/.vibehub/projects/<client>
```

Copies `src/` to `<client>/src/components/navbar/`. Re-running upgrades the
components and preserves `navbar.config.tsx` + `brand/`.

Mount once in the page shell, before `<main>`:

```tsx
import { Navbar } from "@/components/navbar";
import { navbarConfig } from "@/components/navbar/navbar.config";

<Navbar config={navbarConfig} />
```

`Navbar.tsx` imports `navbar.css` itself; nothing to add to `index.css`.

## Host contract

- React 19 (uses the `inert` prop), Vite, TypeScript strict, Tailwind v4 (the
  JSX uses utility classes for layout; the breakpoint is **not** Tailwind's,
  see below).
- Every `config.sections[].id` exists as an element id in the page. Sections
  that are dark declare `data-nav-tone="dark"` on their own element.
  The bar renders light glass over anything else.
- `config.sections` and `config` itself are module-level constants (the scroll
  store and the tray cache are keyed by reference).
- Fonts: the bar reads `--font-heading`, `--font-body`, `--font-technical`
  from `:root` if present, else falls back to Overused Grotesk / Montserrat /
  Satoshi — which the host must then load (see `index.html` here for the
  links). A different brand font: set those `:root` variables.
- Anchors scroll natively. Add `html { scroll-behavior: smooth }` and
  `scroll-margin-top` on sections if the site has neither.
- Desktop/mobile swap at `768px`, defined twice: `navbar.css` (`@media`) and
  `DESKTOP_QUERY` in `NavFinderMobile.tsx`. Change both or neither.
- Server rendering works (`renderToString` / prerender). The bar renders
  `initialTone` until the first client probe; the deck is `<a href>` only, so
  a client-side router must intercept those clicks itself (see the
  resto-tchin adaptation: a document click listener scoped to `.ev-navbar`).
- Five entries where the last is the CTA: on mobile the CTA spans the whole
  last row of the 2-column deck.

## Config reference

See `src/types.ts` (every field is commented). Summary:

| Field | What it controls |
| --- | --- |
| `logo` | Wordmark node. Black artwork; the dark tone applies `--nav-logo-dark-filter` (`invert(1)`; set `none` for coloured artwork). Sized by `--nav-logo-*` tokens. |
| `homeHref` | Wordmark link. |
| `labels` | `menu`, `close` (mobile morph), `sectionLink`, aria strings, `loading`. |
| `sections` | `{ id, color }[]` in document order. `color` = REC dot colour. |
| `initialTone` | Tone before the first scroll probe (server render / hydration). `"dark"` for a dark first screen. |
| `deck` | Pills. `key` also keys `trays`. `section` marks the live pill. `href` → `<a>`, no `href` → `<button>`. `cta: true` on at most one. `icon` is a built-in key or any 1em node. |
| `trays` | Per deck key. `items` (static array or `() => Promise<…>`) with `unit` for the "04 dossiers" counter, or `cta` with `copy`/`label`/`note`. A deck entry without a tray navigates on first interaction. |
| `onSection` | Intercept a pill click (`event.preventDefault()` to replace the anchor jump with a modal etc.). |
| `track` | Receives `nav_click`, `nav_modal_open`, `cta_click` with payloads. |

Tray `onSelect` is where a client site opens its own modal, routes, or
scrolls. The navbar never owns a modal. On evoview.be the handlers dispatch
cancelable `CustomEvent`s that the owning sections answer
(`src/lib/navIntents.ts` there); replicate that if sections are lazy-loaded.

## Adapting

**Change freely** (config + the tokens block at the top of `navbar.css`):

- Labels, language, anchors, section list and accents, deck count (3–5 fit;
  4 is the designed count), which pill is the CTA, tray contents, icons.
- `--nav-focus-ring`, `--nav-cta-glow`, `--nav-cta-hover-dark` (brand accents).
- `--nav-font-*`, `--nav-radius-*`, `--nav-max-width`, `--nav-tray-w`,
  `--nav-logo-*` (incl. `--nav-logo-dark-filter`), `--nav-font-cap` (desktop
  finder size ceiling).
- Ink scale (`#151515`, the `rgba(21,21,21,…)` ramp) — a global replace in
  `navbar.css` if the client's ink is not near-black. Keep the light/dark
  pairs symmetrical.

**Change with care** (the pieces that make it feel like this component):

- Timings in `.nav-finder` (`460ms` open / `380ms` close, `35ms` stagger)
  and the `OPEN/CLOSE/TRAY_DELAY` constants in `NavFinder.tsx`. Keep the
  open faster-out than the close eases-in-out.
- The blink keyframes. They are the signature; retune rather than replace.
- Gloss gradients (`--nav-gloss-*`). Adjust lightness, keep the single
  specular sweep.

**Do not change** (structural; breaking any of these needs a redesign, not an
edit):

- The 0fr⇄1fr grid-track morph and the mask feathering: the only way the
  capsule animates between intrinsic widths without measuring.
- The resting-width anchor (desktop) and the measured tray height (mobile).
- Panels stay mounted and are hidden with `visibility`/`inert`; never
  conditionally render them.
- Mouse click never closes a hover-opened menu (`pointerType` branches).
- Scroll lock + focus trap + Escape + focus restore on mobile; Escape/blur/
  scroll/resize dismissal on desktop; arrow-key navigation in deck and tray.
- Reduced motion resolves to the same end states with no slide or stagger.
- Tone detection by DOM probe, not by a list of section ids in the header.

## Verification (do all of it before reporting done)

```bash
pnpm build                       # tsc -b && vite build, must be green
```

In the browser (agent-browser or browser-bridge), at the client dev URL:

1. **1440×900**: hover MENU → capsule unfolds right, wordmark does not move.
   Hover each pill → tray slides under it and stays inside the capsule span.
   Click a tray row → the site's own action fires, menu closes.
2. **1024×800**: same; pills must not wrap.
3. **390×844**: tap MENU → capsule unfolds down, MENU morphs to the close
   word, page dims and does not scroll. Tap a pill → tray unfolds; tap again
   or the section link → navigates. Escape/backdrop closes.
4. Scroll through every section: glass flips exactly when a dark section
   reaches the bar; the reticle dot takes each section's `color`; the live
   pill is the lit one.
5. Keyboard: Tab to MENU, Enter → focus lands on first pill; ←/→ cycle; ↓
   enters the tray; Esc closes the tray then the menu, focus returns.
6. `prefers-reduced-motion: reduce`: everything still opens/closes, nothing
   slides.
7. If the client's brand fonts differ: check the pill labels (0.75em, 700,
   0.14em tracking) still fit at the deck's natural width.

## Upgrading a client

Re-run `install.sh`. Read `CHANGELOG.md` for the versions between
`<client>/src/components/navbar/.navbar-version` and `VERSION`; apply any
config changes it lists; run the verification.
