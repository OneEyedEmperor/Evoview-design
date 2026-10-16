---
name: evoview-navbar
description: Install and adapt the Evoview finder navbar (glass capsule that unfolds into pills + trays, desktop and mobile) into a client website. Use when asked to add the Evoview navbar, the finder navigation, or the Evoview header to a project, or to reuse/adapt the Evoview navigation component. Triggers on "evoview navbar", "finder nav", "add the navbar", "evoview header", "evoview component library".
---

# Evoview navbar

Package: `/root/.vibehub/projects/evoview-design-library/components/navbar/`
Showcase: `https://evoview-library.said.bet` · Original: `https://evoview.said.bet`

Read `README.md` in the package before touching anything. It is the contract;
this file is the procedure.

## Procedure

1. **Look at the reference first.** Open the showcase at 1440 and 390 wide
   and use the menu, so you know what "correct" looks like before adapting.
2. **Install** into the client project:
   `components/navbar/install.sh /root/.vibehub/projects/<client>`
3. **Gather the client's facts** before editing the config: section ids
   and which are dark, brand accent per section, 3–5 destinations, which one
   is the CTA, what each tray should list (or that a pill has no tray), what
   a tray row does when selected (modal / route / scroll), logo asset
   (black artwork, SVG preferred), fonts, language of labels.
4. **Edit `src/components/navbar/navbar.config.tsx` only.** Replace
   `brand/EvoviewLogo` with the client logo; put tray data in the client's
   own data modules (derive it from the data the sections already use, never
   a second copy). Delete `brand/` when nothing imports it.
5. **Wire the page**: mount `<Navbar config={navbarConfig} />` in the shell;
   give sections the configured ids; add `data-nav-tone="dark"` to dark
   sections; make sure fonts resolve (`--font-heading` / `--font-body` /
   `--font-technical` on `:root`, or load the fallbacks).
6. **Brand tokens**: adjust only the `--nav-*` block at the top of
   `navbar.css` (focus ring, CTA accents, radii, logo size). Do not edit the
   choreography rules below it unless README → "Change with care" says so.
7. **Verify** with the README checklist — all seven points, both viewports,
   keyboard, reduced motion. Fix, re-verify.
8. **Log** an activity record (`surface: code`, `type: feature`, subject =
   the client project) stating the package version installed and any
   deviation from the reference.

## Rules

- Never copy files from `/root/.vibehub/projects/evoview/src/components/nav`
  directly; the package is the portable version.
- Never fork the component to fix a client issue. If the package is wrong,
  fix it in the library, bump `VERSION`, note it in `CHANGELOG.md`, re-run
  `install.sh` in the client.
- Do not reintroduce a conventional full-width navbar, extra header accents,
  or labels revealed by resizing the capsule. The capsule, the reticle, the
  unfold and the blink are the component.
- Respond in English even when the client interface is French.
