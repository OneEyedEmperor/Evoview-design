---
name: evoview-navbar
description: Install and adapt the Evoview finder navbar (glass capsule that unfolds into pills, optional trays, desktop and mobile) into a client website. Use when asked to add the Evoview navbar, the finder navigation, or the Evoview header to a project, or to reuse/adapt the Evoview navigation component. Triggers on "evoview navbar", "finder nav", "add the navbar", "evoview header", "evoview component library".
---

# Evoview navbar

Package: `/root/.vibehub/projects/evoview-design-library/components/navbar/`
Showcase: `https://evoview-library.said.bet` (reference, multi-page) · `/evoview` (one-page with trays)

Read `README.md` in the package before touching anything. It is the contract;
this file is the procedure.

## Procedure

1. **Look at the reference first.** Open the showcase at 1440 and 390 wide
   and use the menu, so you know what "correct" looks like before adapting.
2. **Install** into the client project:
   `components/navbar/install.sh /root/.vibehub/projects/<client>`
3. **Gather the client's facts** before editing the config: one-page or
   multi-page; routes (or section ids and which sections are dark); 3–5
   destinations and which is the CTA; locales; brand accent; logo asset
   (SVG, its aspect ratio); fonts; whether any pill needs a tray and what a
   tray row does when selected.
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
   `vars` token. Only the README's "change with care" items justify a CSS
   edit, and they go in the client copy, noted in the handoff.
7. **Verify** with the README checklist — all eight points, both viewports,
   keyboard, reduced motion. Fix, re-verify.
8. **Log** an activity record (`surface: code`, `type: feature`, subject =
   the client project) stating the package version installed and any
   deviation from the reference.

## Rules

- Never copy files from `/root/.vibehub/projects/evoview/src/components/nav`
  or from another client; the package is the portable version.
- Never fork the component to fix a client issue. If the package is wrong or
  a refinement is generic, fix it in the library, bump `VERSION`, note it in
  `CHANGELOG.md`, re-run `install.sh` in the client. That is how the Tchin
  Tchin refinements became 2.0.0.
- Do not reintroduce a conventional full-width navbar, extra header accents,
  or labels revealed by resizing the capsule. The capsule, the eye, the
  unfold and the tiles are the component.
- Respond in English even when the client interface is French.
