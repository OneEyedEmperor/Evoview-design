---
name: evoview-navbar
description: Install and adapt the Evoview finder navbar (glass capsule that unfolds into pills, optional trays, desktop and mobile) into a client website. Use when asked to add the Evoview navbar, the finder navigation, or the Evoview header to a project, or to reuse/adapt the Evoview navigation component. Triggers on "evoview navbar", "finder nav", "add the navbar", "evoview header", "evoview component library".
---

# Evoview navbar

Package: `/root/.vibehub/projects/evoview-design-library/components/navbar/`
Showcase: `https://evoview-library.said.bet` (reference, multi-page, route tray under Services) · `/evoview` (one-page with cover-card trays)

Read `README.md` in the package before touching anything. It is the contract;
this file is the procedure.

Before adapting, read `/root/.vibehub/projects/evoview-design-library/STRATEGY.md`.
The library combines client utility with recognizable Evoview authorship and
approved referral opportunities. Preserve existing signatures; this strategy
alone does not authorize adding attribution or changing client link destinations.

## Ownership (RULES §13)

- **Preserve** (README "Signature"): capsule, eye, unfold, tiles, pill
  typography, tray cards, their tuning and the structural behaviour; no
  Evoview mark. Changes go into the library, never the client.
- **Select** (README "Variations"): one-page or multi-page shape,
  `NAV_RETICLES`, per-pill tray (`NAV_TRAY_LAYOUTS`) / CTA block / none.
- **Invent** (README "Expression"): logo, accent, copy, destinations, deck,
  icons, covers, `vars`, the ink scale.

## Procedure

1. **Look at the reference first.** Open the showcase at 1440 and 390 wide
   and use the menu, so you know what "correct" looks like before adapting.
2. **Install** into the client project: `sync.sh plan
   /root/.vibehub/projects/<client> navbar`, then `apply`, then `verify`
   (library root, `docs/SYNC.md`); resolve conflicts, fill patch reasons.
3. **Gather the client's facts** before editing the config: one-page or
   multi-page; routes (or section ids and which sections are dark); 3–5
   destinations and which is the CTA; locales; brand accent; logo asset
   (SVG, its aspect ratio); fonts; whether any pill needs a tray, what each
   entry does (`href` route/anchor or `onSelect` action), its one-line
   description, and its cover (900×216 crop of the entry's own artwork, or
   a rendered preview node). Never invent covers from unrelated imagery.
4. **Edit `src/components/navbar/navbar.config.tsx` only.** Put the client
   logo in `brand/`, set `accent` and the `vars` the README lists (logo box,
   `--nav-logo-dark-filter`, `--nav-eye-pupil`), rewrite copy and deck.
   Multi-page: keep `withRoute` + `useNavbarLinks(navigate)` in the layout.
   One-page: fill `sections`, give pills a `section`, start from
   `examples/evoview.config.tsx` if trays are wanted.
5. **Wire the page**: mount `<Navbar config={…} />` in the shell; dark first
   screen → `initialTone: "dark"` + `data-nav-tone="dark"` on the wrapper;
   make fonts resolve.
6. **Never edit `navbar.css` for brand values** — everything brand-level is a
   `vars` token or an override in the client-owned `navbar.theme.css` (every
   `--nav-*` token, commented with its default; sync never overwrites it).
   Only the ink scale (README "Expression") justifies a CSS edit: sync
   records it as a local patch (give it a reason), noted in the handoff.
7. **Verify** with the README checklist — all eight points, both viewports,
   keyboard, reduced motion. Fix, re-verify.
8. **Log** an activity record (`surface: code`, `type: feature`, subject =
   the client project) stating the package version installed and any
   deviation from the reference.

## Rules

- The menu number orbs change colour only through foundation `OrbFill`'s
  liquid rise (RULES §1); restyle them via `--ev-orb-*`, never a
  `background` swap. Sync installs `foundation` when it is absent or too old.
- Never copy files from `/root/.vibehub/projects/evoview/src/components/nav`
  or from another client; the package is the portable version.
- Never fork the component to fix a client issue. If the package is wrong or
  a refinement is generic, fix it in the library, bump `VERSION`, note it in
  `CHANGELOG.md`, upgrade the client through `sync.sh`. Client refinements
  flow back into the library as generic behaviour; client branding never
  does — the reference stays Evoview-branded.
- Do not reintroduce a conventional full-width navbar, extra header accents,
  or labels revealed by resizing the capsule.
- Adding an Evoview credit or referral link here needs explicit approval and
  a supplied destination.
- Respond in English even when the client interface is French.
