---
name: evoview-dossier
description: Evoview portal modal (dossier) for client sites — header strip with the approved Evoview mark, 4-tile selection board, open chapters with a reading-progress chapter strip, glass capsule + dock on phones, media-gated loader, full modal contract (focus, Escape one level, history Back), every view a crawlable, prerenderable URL (dossierRoutes). Use when a client page needs to present a multi-part offer (services, projects, menus, rooms) as an Evoview dossier. Triggers on "evoview dossier", "portal modal", "selection board", "service dossier", "dossier modal".
---

# Evoview dossier

Package: `/root/.vibehub/projects/evoview-design-library/components/dossier/`
Showcase: `https://evoview-library.said.bet/components/dossier`

Read the package `README.md` ("What is Evoview", modal contract) and the
library's `STRATEGY.md` first; the foundation README covers tokens and the
pause model.

## Procedure

1. Open the showcase at 1440 and 390; open a universe, enter an experience,
   scroll to the toast, press Escape twice; open the single-universe variant
   (no pager); switch the palette to the client's accent and to yellow /
   off-white.
2. Map the client's offer to items × 4 entries: several families → several
   items (pager); one offer → one item. The board is for choosing between
   exactly four destinations; if an item has fewer, do not pad it — ask, or
   use another component.
3. `components/dossier/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades `controls` and `foundation` first).
4. Edit only `src/components/dossier/dossier.config.tsx`: brand (client logo
   node), kicker, items (labels, optional per-item accent), entries (title,
   short label, kicker, the client's own media), detail chapters built from
   `DossierChapter` + `ChapterHead` / `ChapterFigure` / `ChapterSplit` /
   `ChapterRows` / `ChapterSpecimen` / `ChapterPayoff` (or story-blocks), one
   exit CTA per story (the client's action, `PrimaryPlate`), copy FR/EN from
   the client's wording. Separate with space and the a / b tone alternation,
   never rules. Every text list goes on tonal surfaces, never bare text:
   `ChapterRows` (one panel, alternating rows — info sheets, programmes) or
   `surface="tiles"` (peers); number rows only when they are a sequence.
   Demonstrations carry their "example" note (`ChapterSpecimen note`).
5. Mount `<Dossier config view onNavigate hrefFor>` near the page root (no
   transformed ancestor), open or not: the host keeps `view` in state
   (seeded once from the URL with `viewFromPath`), `hrefFor =
   routeHrefs(base, dossierRoutes.key)`; launchers are `<a href={hrefFor(v)}>`
   with `followRouteLink`. It preloads the board media on idle (`preload`,
   default on). If the host pins chrome bottom-right, set
   `--dossier-reserve-bottom`.
6. Crawlable views (README "Crawlable views", contract
   `docs/CRAWLABLE-MODALS.md` §7): a splat route per page and locale so every
   view URL renders the same page; the page title becomes h2 while a view is
   open; prerender `[null, ...dossierRoutes.views(config)]` with
   `dossierRoutes.head` (title, description, canonical, hreflang, JSON-LD)
   and the `ROUTE_LAYER_NOSCRIPT_CSS` noscript sheet; sitemap / llms list
   the views; verify the built HTML without JavaScript.
7. Keep `attribution.enabled = true`, `href` = `https://evoview.be/`; never
   move the mark next to the client CTA or add other marks.
8. Verify with the README checklist at 1440 / 1024 / 390 (URLs, Back /
   Forward level by level, Ctrl-click, cold view URLs), then log an
   activity record (`surface: code`, `type: feature`, subject = the client
   project) with the package version.

## Rules

- The header strip, board mosaic, chapter strip, dock, media gate and modal
  contract are the protected signature; only content, media, accent and copy
  change per client.
- Accent is signal only; the CTA stays a white plate at rest.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`); clients re-run `install.sh`.
- Respond in English even when the client interface is French.
