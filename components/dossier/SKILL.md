---
name: evoview-dossier
description: Evoview portal modal (dossier) for client sites — panorama or sheet composition, optional opening screen, live entry counts, header strip with the approved Evoview mark, selection board, open chapters with a reading-progress chapter strip, glass capsule + dock on phones, media-gated loader, full modal contract (focus, Escape one level, history Back), every view a crawlable, prerenderable URL (dossierRoutes). Use when a client page needs to present a multi-part offer (services, projects, menus, rooms) as an Evoview dossier. Triggers on "evoview dossier", "portal modal", "selection board", "service dossier", "dossier modal".
---

# Evoview dossier

Package: `/root/.vibehub/projects/evoview-design-library/components/dossier/`
Showcase: `https://evoview-library.said.bet/components/dossier`

Read the package `README.md` (Signature / Variations / Expression, modal
contract) and the library's `STRATEGY.md` first; the foundation README covers
tokens and the pause model.

## Ownership (RULES §13)

- **Preserve** (README "Signature"): header strip, board mosaic, chapter
  strip, phone chrome, open chapters, media gate, modal contract, motion,
  the header mark. Changes go into the library, never the client.
- **Select** (README "Variations"): the composition (`DOSSIER_COMPOSITIONS`:
  `panorama` default, `sheet` for quick-glance dossiers such as a menu); the
  tile media (`DOSSIER_TILE_MEDIA`: `graded` default, `true-colour` when the
  client's photos must stay true to colour, e.g. food); the direct load
  (`DOSSIER_DIRECT_LOADS`: `entrance` default, `at-rest` when the dossier is a
  page of its own reached from search, e.g. a menu: its URL paints the
  settled view and hydrates in place; preload `dossierViewMedia(config, view)`
  in the prerendered head; in-page opens keep the entrance); an opening
  screen or not; one or several universes; the chapter kit,
  `DOSSIER_CHAPTER_VARIANTS`, `CHAPTER_ROWS_SURFACES`. Nothing else.
- **Invent** (README "Expression"): brand, opening title / label, items
  (cover, readout, empty-day sentence), entries, copy, media, accent (per
  item too).

## Procedure

1. Open the showcase at 1440 and 390; open a universe, enter an experience,
   scroll to the toast, press Escape twice; open the single-universe variant
   (no pager); open the menu (opening screen), try specials 0 / 3 / 5 and
   both compositions (desk, from 1024) and both tile photos (graded | true
   colour); switch the palette to the client's
   accent and to yellow / off-white.
2. Map the client's offer to items: several families → several items
   (pager), or an opening screen choosing between 2–4 of them; one offer →
   one item. Four entries make the panorama's mosaic; other counts take the
   symmetric grid, so do not pad an item to four. Content the client edits
   live (promotions, specials) is an item built from fetched data
   (README "Live content": `pending`, `empty`, stable entry ids).
3. Install: `sync.sh plan /root/.vibehub/projects/<client> dossier`, then
   `apply`, then `verify` (library root, `docs/SYNC.md`); resolve conflicts,
   fill patch reasons. Client tokens go in `dossier.theme.css`.
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
   Dishes / products with a picture: rows with `media` (+ `marks` for
   dietary icons), best as `tiles`; when they open the entry, list the
   first screenful's media in `entry.sources`.
   Demonstrations carry their "example" note (`ChapterSpecimen note`).
5. Mount `<Dossier config view onNavigate hrefFor>` near the page root (no
   transformed ancestor), open or not: the host keeps `view` in state
   (seeded once from the URL with `viewFromPath`), `hrefFor =
   routeHrefs(base, dossierRoutes.key)`; launchers are `<a href={hrefFor(v)}>`
   with `followRouteLink`. It preloads the board media on idle (`preload`,
   default on). If the host pins chrome bottom-right, set
   `--dossier-reserve-bottom`. Fixed host chrome anchored right adds
   `var(--ev-scroll-lock-gap, 0px)` to its `right`; a host modal locks scroll
   with foundation `useScrollLock`, never its own `overflow` write.
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

- Accent is signal only; the CTA stays a white plate at rest.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`); clients upgrade through `sync.sh`; a client-side edit is
  a recorded patch (`.evoview/patches/`), a candidate for the library.
- Respond in English even when the client interface is French.
