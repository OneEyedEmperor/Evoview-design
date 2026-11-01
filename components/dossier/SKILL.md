---
name: evoview-dossier
description: Evoview portal modal (dossier) for client sites — panorama or sheet composition, optional opening screen, live entry counts, live feed board (batches of fetched entries, page URLs, deep links, live updates), header strip with the approved Evoview mark, selection board, open chapters with a reading-progress chapter strip, glass capsule + dock on phones, media-gated loader, full modal contract (focus, Escape one level, history Back), every view a crawlable, prerenderable URL (dossierRoutes). Use when a client page needs to present a multi-part offer (services, projects, menus, rooms) as an Evoview dossier. Triggers on "evoview dossier", "portal modal", "selection board", "service dossier", "dossier modal".
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
  in the prerendered head, `dossierViewImages` with `imagesrcset` /
  `imagesizes` when media carry a `srcSet`; in-page opens keep the entrance);
  where a detail's h1 sits (entry `heading`: the header, default, or the
  content when the detail shows its title itself, e.g. an article
  headline; `feedEntry` defaults to content); the board per item
  (`DOSSIER_ITEM_BOARDS`: `selection` default, `feed` for content that keeps
  growing, news / journal / posts: README "Feed"); a feed's cards
  (`DOSSIER_FEED_CARDS`: `tiles` default for journals and posts, `editions`
  for news: sheets per batch, a lead, section · day, importance tiers);
  an opening screen or not;
  one or several universes; the chapter kit,
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
   (README "Live content": `pending`, `empty`, stable entry ids). A list that
   keeps growing (news, a journal, posts) is a feed item instead (README
   "Feed"): write one `DossierFeedSource` for the client's API
   (`fetchPage(page, cursor)` → `{ items, next }`, `fetchEntry(id)` for deep
   links, `toEntry` with `feedEntry` or your own chapters), call
   `useDossierFeed(source, { initial, refreshMs, key: locale })`, set the item to
   `{ board: "feed", feed, entries: feed.entries }`; prerender the
   build-time pages with `dossierFeed(snapshot, toEntry)` and pass the same
   snapshot as `initial`. Keep the page size (9) unless the client's API
   cannot. Entry ids are lowercase slugs, never `page` (a console warning
   names any that `parse` would reject). For news set `feedCards: "editions"`
   and give each entry `section`, `published` ({ iso, label }, formatted
   without Intl) and, sparingly, `importance` (about one `top`, two `major` a
   page; the client's editorial call, never derived here); check it with
   `node <library>/scripts/feed-editions-check.mjs <feed board URL>`. An item of another kind than the rest (a feed among desks) keeps
   its own words with `item.copy` ("‹ Latest", not "‹ Desk"; README "Item
   copy"). Five items on an opening screen: the leading one first (a full-row
   lead tile over a 2×2). Check the feed with `node <library>/scripts/feed-fetch-check.mjs
   <feed board URL> --page-request '<regex of the page requests>'`.
3. Install: `sync.sh plan /root/.vibehub/projects/<client> dossier`, then
   `apply`, then `verify` (library root, `docs/SYNC.md`); resolve conflicts,
   fill patch reasons. Client tokens go in `dossier.theme.css`.
4. Edit only `src/components/dossier/dossier.config.tsx`: brand (client logo
   node), no header kicker by default (RULES §1; `kicker` is optional, omit
   it rather than set `""`), items (labels, optional per-item accent), entries (title,
   short label, kicker, the client's own media; in the default
   `heading: "header"` the desktop header shows the full title as the h1 on
   one line, so long titles take `heading: "content"`, otherwise keep them to
   the bar's width), detail chapters built from
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
   the views; verify the built HTML without JavaScript. A feed adds
   `<item>/page/<n>/` views (one per build-time page) and entry URLs that
   resolve client-side when newer than the build. Server rule (contract §2,
   "Live content"): a key `parse` rejects is a real 404; a key it accepts but
   the build has no data for (an entry slug or page under the feed item, a
   pending item's entry) gets the page shell with `noindex`, so `fetchEntry` /
   the page fetch can open it; on a static host, `_shells.json` + the server
   rules of contract §7.4. A host that stores view keys keeps the `page` the
   dossier reports with an entry opened from a feed page view (§7.1).
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
