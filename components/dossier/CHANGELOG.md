# dossier changelog

## 1.16.4

Fix. No config, API or markup change (CSS only). Requires nothing new (foundation ≥ 1.16.0, controls ≥ 1.5.0). Server
HTML, head answers, view media and parse results are byte-identical to 1.16.3 (`scripts/ssr-snapshot.mjs`, 2,326
renders).

- **Signature motion now runs as declared** (the emperor, 2026-11-01): hover / dim grade transitions ease instead of
  snapping; no retiming.
  - The cause: CSS interpolates `filter` only between lists of the same functions in the same order. A rest grade
    (`grayscale saturate contrast brightness`) and the released one (`saturate sepia contrast brightness`) didn't match,
    so every declared transition between them flipped at once.
  - Affected, all graded: board tiles (selection boards, opening tiles, editions standard cards) on own hover in / out,
    hover to a neighbour, keyboard focus in / out and touch-cycle focus in / out; row thumbnails (rows with media) on
    row hover in / out.
  - The fix: every graded state is written as one list, `grayscale saturate sepia contrast brightness`, with identity
    values (`grayscale(0)`, `sepia(0)`) filling the unused steps. The values, durations and curves are unchanged.
  - True colour stays `filter: none` in every state (the emperor's 2026-10-29 rule); the board's one-time entrance
    blur is unchanged.
- **A tier card's own-hover release keeps the board's 260ms** (1.16.3 review N1).
  - In 1.16.3 the 600ms in-out curve sat on the tier card's rest state, so it governed every change landing at rest:
    the release took 579ms.
  - The curve now sits on the dimmed state only. Going into the dim still pours over 600ms; the release and the return
    from the dim take 260ms.
- Measured on the showcase (production preview, Chrome, computed `filter` every animation frame at 5× slowed playback,
  times in real ms; before = 1.16.3, after = this release):

  | Transition | Before | After |
  | --- | --- | --- |
  | Board tile: own hover in / out, own hover → neighbour | 0 intermediate values (flip) | 16–18 values over 253–262ms |
  | Board tile: keyboard focus in / out | 0 (flip) | 17 over 264–270ms |
  | Board tile: touch-cycle focus in / out | 0 (flip) | 49 over 694–714ms |
  | Board tile: neighbour dim in / out | 15–18 (already one list) | 15–16 over 253ms |
  | Row thumbnail: row hover in / out | 0 (flip) | 36–39 over 415ms |
  | Editions standard card: own hover in / out | 0 (flip) | 9 over 251–281ms |
  | Editions top card: own hover release | 19 over 579ms (600ms curve) | 7 over 233ms |
  | Editions top card: neighbour dim in | 18 over 599ms | 20 over 587ms (unchanged) |
  | True colour: own hover, neighbour dim | `none` throughout | `none` throughout |
- Rest unchanged: base vs fix screenshots, pixel by pixel, at 1440 and 390, on the board, the opening screen, the
  editions board, the menu rows and true colour. All are identical apart from header-chrome noise of a few pixels (the
  base-vs-base floor). On phones the touch cycle's current and previous tiles differ: their 700ms transitions now run.
  The tiles at rest are identical (0 pixels).
- Audit of the other packages: no change needed. Their transitioned grades already share one list, or meet `none`,
  which CSS replaces by the matching identity list:
  - card: track `.ctc__img`, index `.cix-cover`;
  - selector-stage: `.ss-thumb img`;
  - navbar: `.nav-tray-card-media`;
  - process-sequence: `.ps-card__img`.

  Each was sampled easing over its declared duration (89–210 intermediate values). Keyframed blurs (entrances) don't
  depend on this.

## 1.16.3

Fix. No config, API or markup change (CSS only). Requires nothing new (foundation ≥ 1.16.0, controls ≥ 1.5.0).

- **A top / major card no longer snaps grey when another card is pointed** (the emperor, on the editions board: "the
  immediate change of overlays on the bigger card gives it an illusion of clipping").
  - The cause: CSS interpolates `filter` only between lists of the same functions in the same order.
    - The top tier's rest (`saturate sepia contrast brightness`) and the neighbours' dim (`grayscale saturate contrast
      brightness`) didn't match, so the change was discrete.
    - Sampled every ~25ms in Chrome while the pointer moved onto another card: the top card was already fully dimmed in
      the first sample, 6ms in. The major card, whose lists matched, eased.
  - The fix:
    - Every state of a tier card's picture (major / top rest, hover, focus, dimmed) is written as `grayscale saturate
      sepia contrast brightness`, so each change interpolates.
    - The dim caused by another card, and its return, is ambient: it pours in-out (`cubic-bezier(.65, 0, .35, 1)`) over
      the reveal duration (600ms). The card's own hover keeps the board's 260ms.
  - Measured after the fix:
    - the top lead passes 21 intermediate values on its way to the dim, over about 450ms;
    - its own hover eases in 260ms;
    - frame strip at 10× slowed playback: `dossier-1.16.3/strip-after.png`.
- Known, not changed (the board's Signature, every graded board, selection boards included): a tile's own hover
  release also crosses mismatched lists (rest `grayscale saturate contrast brightness`, hover `saturate sepia contrast
  brightness`), so it flips at once rather than easing over its 260ms. Sampled on the editions board: 1 value in 18
  samples. The same one-list fix would make it pour; it changes the hover feel of every client, so it waits for the
  emperor's call.

## 1.16.2

Fix. No config, API or markup change (CSS only). Requires nothing new (foundation ≥ 1.16.0, controls ≥ 1.5.0). Server
HTML, head answers, view media and parse results are byte-identical to 1.16.1 for every reference config
(`scripts/ssr-snapshot.mjs`, 2,326 renders).

- **A long text brand no longer runs into the readout or the Evoview mark** (1.16.1 review F1, pre-existing).
  - The cause: `.evd-header__brand` gave a text name a fixed `8.5em` box, `nowrap`, with visible overflow.
  - Measured in 1.16.1 on the universes dossier, gap from the name's ink to the next element:
    - 28 characters ("Boulangerie des Trois Frères"): readout −89px at 1440 and 1024, −50px at 390 and 320; the Evoview mark
      +23px at 390 and −47px at 320 (RULES §9);
    - 19 characters: readout −14px at 1440.
  - The fix, a layout one with nothing cut (no ellipsis, no `title`; markup unchanged):
    - a text brand (`.evd-header__brand:has(> .ev-t-readout-lg)`) is content-sized up to `max(60%, 7em)` of the
      identity;
    - a longer name wraps onto balanced lines inside its box (`overflow-wrap: anywhere` only as the last resort);
    - the item readout keeps the rest and its existing ellipsis.
  - The box stays inside the identity column, so it never reaches the pager or the mark. A logo keeps its 8.5em box,
    untouched.
  - Checked with the new `scripts/header-brand-check.mjs`: 14, 19 and 28 characters at 1440, 1024, 390 and 320, on the
    universes (with pager), the journal and the sheet menu (choose, specials). That's 48 combinations, all passing:
    - never cut, inside the box and the bar;
    - ≥ 12px from the readout, ≥ 168px from the pager, ≥ 41px from the mark;
    - the phone capsule stays 56px (two lines at most for these names).
  - Limit, measured with a 46-character name ("Brasserie et Comptoir des Trois Frères du Port"):
    - 3 lines at 1024 (beside the pager) and at 390, the bar unchanged;
    - 4 lines at 320, where the capsule grows 56 → 60px.
    - Never cut and never overlapping (readout +34px, mark +61px). The README advises a logo over ~20 characters.
  - Wrapping: 19 characters wrap onto 2 lines on phones; 28 characters wrap onto 2 lines on phones and at 1024 beside
    the pager. 1440 keeps one line.
  - Short names: "Maison Ardoise" (14) is one line at every width, as before. On phones the box and gaps are unchanged
    (103px). From 1024 it measured 119px, already 2px past the old 117px box, so the readout now starts 2px further
    right.
  - At 320 the readout keeps its existing ellipsis ("LA T…" with the short name, as in 1.16.1; "LA …" beside a
    28-character name). The dock carries the location on phones.
  - `:has()` is required (Chrome 105, Safari 15.4, Firefox 121); older engines keep 1.16.1's layout.

## 1.16.1

Fixes. No config or API change. Requires nothing new (foundation ≥ 1.16.0, controls ≥ 1.5.0). Configs without
`item.copy` render byte-identical server HTML, head answers, view media and parse results against 1.16.0
(`scripts/ssr-snapshot.mjs`, 2,326 renders, FR + EN, every view + closed).

- **Cross-item labels speak the target item's words** (Evoview Gaming site review r6 N2). Some labels name another
  item: the pager's previous / next, the items strip's tabs, the dock's previous / next, the end-of-story next item,
  the empty panel's next link and the opening screen's tiles. They are now built from that item's own copy (`item.copy`,
  1.15.0), not from the view's.
  - From a desk, Latest was "Desk 1 of 5: Latest" / "Previous desk: Latest"; it is now spoken as Latest names itself.
  - `verify:ssr` adds `item-copy-cross` on every multi-item reference config. With the target's cross-item words
    marked, every marked label must name the target, and the views beside it (pager / dock neighbours, items strip,
    opening screen) must carry its words. With the fix reverted, 64 checks fail.
- **A top / major story's frame holds on touch** (1.16.0 review N1). The tier frame was dropped under any `:hover`. On
  `hover: none` a tap's sticky `:hover` took a top card from 68 % back to the standard 30 % until navigation. The frame
  now yields to focus, and to hover only under `(hover: hover) and (min-width: 1024px)`, where the board has its hover
  frame. Checked in Chrome with the pointer over a top card:
  - hover-none: 68 % at rest and under `:hover`;
  - hover-capable: 68 % at rest, the full signal on hover.
- Showcase (review N3, N4):
  - `?feed-demo=newsroom` is now a fictional city paper (FR + EN), not a client's real-world headlines (RULES §10). It
    keeps the same shape: 16 stories, headlines of 40–75 characters, sections, days, one top and two majors on page 1,
    and a top lead on page 2.
  - The journal's "Cards" desk now shows at every width (Composition stays from 1024). At 390, Editions shows the sheet,
    the 4:5 lead with its dek and `Section · day` (0 readouts over titles); Tiles shows equal tiles with the readout
    over each title (9).
- Known, not changed: a text brand longer than the header's `8.5em` brand box (`.evd-header__brand`: `nowrap`, overflow
  visible) runs into the item readout. A 20-character name overlapped "Latest" by about 25px at 1440. Logos and short
  names (Maison Ardoise) are unaffected. The demo paper's name is short for that reason. Reported for a later release.

## 1.16.0

Additive. Requires nothing new (foundation ≥ 1.16.0, controls ≥ 1.5.0). Configs without `feedCards` (or with
`feedCards: "tiles"`) render byte-identical server HTML, head answers, view media and parse results against 1.15.1
(`scripts/ssr-snapshot.mjs`, now with the reference feed: 2,326 renders, FR + EN, every view + closed).

Config changes, all optional:

- `item.feedCards`: `DOSSIER_FEED_CARDS` (`"tiles"` default, `"editions"`), exported type `DossierFeedCards`.
- Entry fields `section`, `published: { iso, label }`, `importance`: `DOSSIER_IMPORTANCE` (`"standard"` default,
  `"major"`, `"top"`), exported type `DossierImportance`. All three are also on `DossierFeedArticle` and passed through
  by `feedEntry`.
- Reference template (client-owned `dossier.config.tsx`): `buildDossierFeedConfig(locale, feed, { feedCards })`. It is
  output-identical without the option; clients apply the template diff by hand if they want it.

Changes:

- **Feed editions** (`feedCards: "editions"`): a news layout of the feed board. The Evoview Gaming review asked for
  visual segmentation; the emperor picked variation B of three.
  - Each batch is an edition on its own tonal sheet, two steps alternating.
  - The edition's first story leads at double scale with its complete dek. The lead switches side from one edition to
    the next.
  - Every story shows its complete headline, then `Section · <time datetime>` (the tile's `aria-describedby`). There is
    never a label above a headline, and no counter or line.
  - Headlines have no clamp at any width (site review r5 N2). Ratios are minimums (a ratio spacer shares the card's
    grid cell with the caption), so a card grows for its headline and its row grows with it. Append-only holds: a new
    edition only adds rows below.
  - The tiles board is unchanged.
- **Importance tiers** (editions only): a surface shift at rest, in the tile's own language.
  - `major`: grade half released, shallower scrim, frame 46 %, type × 1.08.
  - `top`: picture released, deeper scrim at the foot, frame 68 % plus deep-accent shadow, a 16 % accent bloom
    (`.evd-tile__bloom`), type × 1.16.
  - Hover, focus and the neighbours' dimming are unchanged. No badge, label or animation loop.
  - Independent of the lead (recency): importance never reorders the feed or picks the lead.
  - Set by the client's data. Automatic importance is a later task.
- **Fix (both feed boards, since 1.14.0): the live-updates control no longer pushes the board.** Its zero-height
  wrapper still took `.evd-feed`'s 12px flex gap, so every tile moved 12px down when "N new" appeared, against "nothing
  reflows until the visitor taps it". The wrapper now takes the gap back (`margin-bottom: calc(-1 * var(--evd-feed-gap))`).
  CSS only, so server HTML is unchanged. Found by `feed-editions-check` on the showcase journal (all first-edition cards:
  dy 12.0 with the control shown; 0 after the fix, 3 of 3 runs at 320 and 390).
- **Feed entry ids** (docs; 1.15.1 reviewer note): ids are lowercase slugs (`[a-z0-9][a-z0-9-]*`) and `page` is
  reserved on feeds. `dossierRoutes.views` now names each feed entry id that `parse` would reject, once, in a console
  warning.
- Showcase:
  - the journal desk has "Cards: Editions | Tiles", editions by default;
  - the journal carries sections, days and importance;
  - test hook `?feed-demo=newsroom`: Evoview Gaming's real-length headlines with importance tiers, no live updates.
- Checks:
  - `verify:ssr` has a `feed-editions` reference config. It checks, on every page view: the edition sheet, the single
    lead with its complete dek, each tile's complete headline, section, `<time datetime>` after the headline, its
    description link and `data-importance`; and that a tiles board renders none of it. A mutation (no `<time>`, no
    importance) fails 74 checks.
  - New `scripts/feed-editions-check.mjs <URL> [--widths]` (client-agnostic, headless Chrome) checks the rendered board.
  - `ssr-snapshot.mjs` adds the reference feed, with and without `feedCards: "tiles"`.
- Known, not changed (pre-existing in 1.15.1's tiles board): at 768 × 5000 in headless Chrome, a single jump of the
  body's scroll to its end doesn't append the next batch; a second scroll event does. Found while writing the editions
  check, which then appends through the older link.

## 1.15.1

Fix. No config or API change. Requires nothing new (foundation ≥ 1.16.0). Server HTML, head titles and view media of
the reference configs are byte-identical to 1.15.0.

- **`parse` accepts exactly the keys that can name a view** (review F1; CRAWLABLE-MODALS §2, §7.4), so a host's shell
  patterns and 404s can follow it:
  - feed and `pending` entry slugs are lowercase only (`[a-z0-9][a-z0-9-]*`): every id is a lowercase slug, and an
    uppercase key (`journal/Brand-New`) is now rejected, not fetched;
  - `page` is reserved on feed items (it is the page URLs' segment): `journal/page` is rejected;
  - a page number past a known last page (any cached page with `next: null`, not only the last + 1) is `missing`, so
    `parse` rejects it: a 404, as on Evoview Gaming (`d24e476`). While a feed's end is not known (its last cached
    page has a `next`) page numbers stay open, fetched on demand (§2's shell rule, unchanged).
  - `pageStatus` and `loadPage` use the same rule, so nothing past a known end is ever requested.
  - `verify:ssr` rejects the forms on every reference config (uppercase, `-bad`, `page`, `page/1`, `PAGE/2`,
    `page/02`, `page/2/x`, last + 1, last + 2, `page/99`) and accepts lowercase slugs, the last page and an open
    end's `page/99`. The 1.14.0 check that a page past the known ones is accepted now runs on a feed whose end is
    open.
  - Patch: it only narrows forms that could name no view under the id contract (ids are lowercase slugs; past the
    last page nothing exists), which §7.4 already promised hosts. A client deep link of such a form now resolves
    to nothing (the host's 404 or its page) instead of settling on page 1.
- Docs:
  - an un-keyed inline source stays pinned for the hook's lifetime (a locale switch keeps the first locale's
    entries; review F2);
  - with `key`, `toEntry` is captured when the cache resets (review F3);
  - §2 / §7.4 and README "Feed" state what `parse` accepts, with the site's shell pattern.

## 1.15.0

Additive. Requires nothing new (foundation ≥ 1.16.0, controls ≥ 1.5.0).
Configs without the new options render byte-identical server HTML, head
titles and view media against 1.14.0 (reference, sheet, menu, menu at rest,
feed, pending menu; FR + EN; every view + closed).

Config changes, all optional: `item.copy`; `useDossierFeed` option `key`.

- **Item copy** (`item.copy?: DossierItemCopy`, exported type). The item's
  own words over `config.copy` on its views only: header, strip, toast,
  dock, loader, spoken names and `dossierRoutes.head`. `dock`, `loader` and
  `feed` merge key by key. For a feed among desks ("‹ Latest", "Latest 01 /
  05", "Back to Latest", not the desks' words).
  - The reference journal now carries its feed copy on its item (new
    `buildDossierFeedItem(locale, feed)` in the client-owned template;
    `buildDossierFeedConfig` uses it, same output).
  - `verify:ssr`: the override shows on every view of its item and on no
    other; that item's views pass the whole contract with it.
- **`useDossierFeed` no longer loops on an inline source** (feed review N7).
  - 1.14.0 reset its cache during render whenever the `source` object
    changed. An unmemoised inline source changed on every render and threw
    "Too many re-renders" (React #301), reproduced in a production build.
  - The cache now belongs to `options.key` when given, else to the source's
    functions (`fetchPage`, `fetchEntry`, `toEntry`), not to the object.
  - The latest source is always called (with `key`, an inline literal works).
  - In-flight requests are aborted on a real reset only, not on every render.
  - Functions rebuilt on every render without a `key` are detected within the
    render pass: the cache is kept and a console warning names the fix.
  - Checked in production and dev with StrictMode:
    - an inline source loads its batches and survives re-renders;
    - with `key` there is no warning;
    - a memoised source per locale still empties on a locale switch.
- **`head` answers a pending item's unknown entry key** (feed review N8).
  - `parse` accepted it (`item.pending`) but `head` threw. It now gets the
    item board's answer, as a feed's awaited view does: overview title,
    description and picture, one crumb per level.
  - CRAWLABLE-MODALS §2 keeps "head answers every view parse accepts". The
    contract was extended rather than narrowed, because a static host builds
    the §7.4 shell from `head`.
  - `verify:ssr` checks it on every non-feed item of each reference config.
- `scripts/feed-fetch-check.mjs` is client-agnostic.
  - It fails page ≥ 2 requests by CDP `Fetch` interception and counts them
    itself. Usage: `<feed board URL> [--page-request <regex>] [--tile <selector>]`.
  - It no longer needs the showcase's `window.__journalFetches`, which was
    removed.
  - The showcase journal's fake API now makes one real request per page
    (`/library/dossier/journal.json?page=N`); `?feed-network` stays.
- Docs:
  - README: opening screen for 2–5 items, five being a full-row lead tile
    over a 2×2 from 600 and five rows on phones (approved on Evoview Gaming);
    item copy; the feed cache owner.
  - CRAWLABLE-MODALS §7.1: a host that stores view keys keeps the `page`
    reported with entries opened from a page view.
  - CRAWLABLE-MODALS §7.4: the static-host shell recipe (`_shells.json`,
    server order, rewrite-rule hosts, checks).
  - SKILL procedure.

## 1.14.0

Additive. Requires nothing new (foundation ≥ 1.16.0, controls ≥ 1.5.0, as
1.13.x). Existing configs render byte-identical server HTML against 1.13.1
(1,298 renders of the reference configs, every view, at rest, without URLs,
legacy API, head and preload data: before / after diff, `node
scripts/ssr-snapshot.mjs`).

**Feed board** (README "Feed"): an item can show a live feed of entries
(news, posts) instead of the selection board.

API (all new)
- `DOSSIER_ITEM_BOARDS` (`"selection" | "feed"`), `DossierItemBoard`.
- `useDossierFeed(source, options)` → `DossierFeed`; `dossierFeed(snapshot,
  toEntry, options)` for data known up front (build time, prerender).
- `DossierFeedSource<T>`: `fetchPage(page, cursor, signal)` → `{ items, next }`,
  optional `fetchEntry(id, signal)`, `toEntry(record)`. Records are the
  source's own; one fetcher per site, any shape (articles, posts).
- `DossierFeedSnapshot<T>`, `DossierFeedOptions<T>` (`initial`, `pageSize` 9,
  `batchCap` 8, `refreshMs`), `DossierFeedPageData<T>`, `DossierFeed`,
  `DossierFeedStatus`, `DossierFeedCopy`, `FEED_PAGE_SIZE`, `FEED_BATCH_CAP`.
- `feedEntry(article)` / `DossierFeedArticle`: a normalised record (title,
  label, kicker, media, excerpt, body paragraphs, `heading`, optional own
  chapters + `sources` / closing) as an entry with a default article detail.
  The detail's h1 is the intro title by default (`heading: "content"`,
  headlines run long); with `"header"` the bar carries it and the intro opens
  on the excerpt (one heading per title). A `srcSet` media is listed in
  `sources` as the hero renders it.
- `DossierView` gains `page?: number`: feed page views `<item>/page/<n>/`
  (n ≥ 2) and the entries opened from them. Keys of other views unchanged.

Config changes (additive)
- `item.board?` (default `"selection"`, `"feed"` when `item.feed` is set),
  `item.feed?` (set `entries: feed.entries`).
- `copy.feed?` (partial `DossierFeedCopy`, defaults per locale).
- Template (client-owned `dossier.config.tsx`, not synced to existing
  clients): `buildDossierFeedConfig(locale, feed, { composition })`.

Behaviour (feed items only)
- Board: batches of one page each in one grid, 3 columns from a 900px body
  (panorama), 2 from 600 (tablet, sheet), 1 below; fixed-ratio tiles (4:3,
  16:10 under 600), no numerals, three-line titles. Append-only: placeholders
  take the next batch's cells, its tiles are held until their media decode,
  then their content pours in; existing tiles never move, re-enter or wait.
  The overview's media gate covers its first batch only.
- Next batch: a sentinel in the modal body (600px ahead) and a real link to
  the next page's URL (loads in place on a plain click). Past `batchCap`
  batches the link opens the next page's view. Error panel with retry, end
  panel. Page views link the newer page.
- Deep links: unknown entry keys are accepted and fetched (`fetchEntry`); a
  missing one settles on its page. Unloaded page views fetch their page.
  While an entry is fetched nothing is decoded for the overview standing in.
- `head` answers every view `parse` accepts: an awaited entry or page gets
  its board's answer. Server rule (CRAWLABLE-MODALS §2, "Live content"): a
  key `parse` rejects is a real 404, a parsed key the build has no data for
  gets the page shell with `noindex`.
- A failed page or entry is fetched again only on an explicit retry
  (`loadPage(n, true)` / `loadEntry(id, true)`: the board's and the loader's
  retry, appending past it); renders and effects never re-fetch it.
- The cache belongs to one `source`: a new source object (another locale's
  API) empties it and aborts what is in flight; `initial` seeds the first
  source only. Memoise the source.
- Detail: strip tabs (no numerals) and dock bars show a window of four
  entries; positions spoken without a total and continued across pages (tiles
  too); dock count `n / loaded+` while more pages exist; from the last loaded
  entry the next page is fetched when idle.
- Copy: `copy.feed.unavailable` for a view whose page or entry failed to load
  (the loader); the reference feed config names the item in the live region.
- A board view keeps its batches and scroll through a detail and back.
- Live updates (`refreshMs`): page 1 checked on a clock under the pause model;
  new entries wait behind a glass "N new" control (zero layout height).
- Idle preload warms a feed's first page only.
- Media (1.13.x model): feed tiles render at the feed grid's `sizes`; the
  overview gate, the per-batch gates, the idle preload, `dossierViewImages`
  and a detail without `sources` (a deep-linked single entry included) all
  fetch that same candidate.

`verify:ssr`: feed reference config (4 pages): page views, page links, first
batch eager, no client-only state, deep link held; sibling / chain link rules
per kind (`group`, `chained`); the `heading: "content"` pass keeps entries
that already render their h1; `head` on parsed-but-unknown views (unknown
slug, page past the known ones, a page of duplicates only); no tab numerals;
positions continued on page views. `node scripts/feed-fetch-check.mjs
<preview>`: a failed page is fetched once, never again without a retry
(showcase test hook `?feed-network=down | down-from-2`).

## 1.13.1

Fix. No config change, no API change. Requires nothing new (foundation ≥ 1.16.0).

- **A cold detail URL no longer fetches the unshown tile image at 100vw.**
  - On a detail, the media gate, `dossierViewImages` and `dossierViewMedia` take
    the entry's `sources` when it lists them; otherwise its `media` at the
    tile's `sizes`.
  - They used to take `media` at its own `sizes`, default 100vw, plus
    `sources`. At 1280–1366 that fetched the 1600w file besides the 1120w the
    detail shows.
  - Measured on a cold detail (srcset harness, hero listed in `sources`): two
    files → one at 1366 / 1440, one file at 390 either way.
  - Clients whose detail shows `media` itself: without `sources`, nothing
    changes (no `srcSet`). With `sources`, the detail no longer waits for
    `media`; add `media` to `sources` (as rendered) to keep waiting on it.
  - `verify:ssr` checks it on a srcset copy of the reference configs.
- Docs (no code change): in `heading: "header"` mode (the default) a detail's
  visible desktop h1 is the full title on one line, cut with an ellipsis past
  the bar's width (since 1.13.0; it was the `label` before). Long titles take
  `heading: "content"`; otherwise keep header-mode titles to the bar's width.
  Clients that set a distinct `label` on header-mode entries: check the header
  at 1366 / 1440 when syncing.

## 1.13.0

Additive API, visible header change on details. Requires `foundation` ≥ 1.16.0.

Config changes, all optional: entry `heading?: "header" | "content"`;
`ChapterFigure` `caption.kicker` optional. Existing configs render unchanged
except the detail header below.

- **A detail's h1 is its entry `title`** (CRAWLABLE-MODALS §4); it was the
  short `label`.
  - With a distinct `label`: desktop's header shows the title, and phones show
    the label with the h1 spoken, as on the opening and overviews.
  - The duplicate sr-only `<h2>` with the title in the detail is gone; the
    detail is labelled by the h1.
  - Entry `head.title` = `<title> — <item label>`. It was `<label> · <title> — …`
    when the title didn't contain the label.
  - New `heading: "content"`, for details that show their title themselves:
    the content renders the h1 with `ChapterHead as="h1" id={ctx.headingId}`
    (new `DossierEntryContext.headingId`; `ChapterHead` takes `as: "h1"` and
    `id`), and the header keeps the label as an `aria-hidden` readout.
  - `verify:ssr` checks on every reference detail:
    - the h1 is the title;
    - exactly one heading carries it;
    - the dialog is labelled by it;
    - the `heading: "content"` variant passes the full contract.
- **Board images fetched once, at the tile's size.**
  - The media gate and the idle preload decoded each board image's bare `src`
    (the largest file). They now pass the tile's `srcSet` and `sizes`
    (foundation 1.16.0), so they fetch the candidate the tile shows.
  - `SelectionBoard`'s `sizes` logic moved into `tileSizes`, shared by the
    tile, the gate and the preloads. The rendered `sizes` are unchanged.
  - New `dossierViewImages(config, view)` → `{ src, srcSet?, sizes? }[]`, for
    head preloads with `imagesrcset` / `imagesizes`. `dossierViewMedia` is
    unchanged.
- **Cold view URL: no focus ring on Close.**
  - Focus on open goes to the dialog itself (no outline) when the page has had
    no input yet (`navigator.userActivation.hasBeenActive` false).
  - The first Tab reaches the controls with their ring.
  - In-page opens still focus Close: no ring after a mouse open, a ring after
    a keyboard open.
  - Chrome 144 ignores `focus({ focusVisible: false })`, hence the dialog.
- `ChapterFigure` `caption.kicker` optional. Omitted or empty: no kicker
  element (an empty span before); the dot centres on the title. Set kickers
  render as before.

## 1.12.0

Additive. Requires `foundation` ≥ 1.14.0.

Config changes: `attribution.href` accepts `null` to pause the header mark's
link while evoview.be isn't live (foundation `EvoviewMark` paused state); the
mark stays. Existing configs render unchanged.

## 1.11.2

Template change. No API change. Requires nothing new.

- The client-owned reference templates (`dossier.config.tsx`:
  `buildDossierConfig`, `buildDossierMenuConfig`) no longer set the header
  `kicker` ("Expériences" / "À table"), so new clients start without one
  (RULES §1).
- **Existing clients are unaffected:** `sync.sh` never writes a client-owned
  file. A client that wants its kicker gone deletes the line from its own
  config.
- `kicker` stays an optional field. `verify:ssr` keeps a fixture proving a
  set kicker still renders one node.

## 1.11.1

Fix. No config change. Requires nothing new (foundation ≥ 1.13.0).

- `directLoad: "at-rest"` was keyed on "the dossier mounted already holding a
  view". A client that mounts the dossier lazily, on intent (Tchin, inside
  `startTransition`), mounts it already holding the in-page view when the
  visitor's first interaction is a launcher. That open was treated as a
  direct load: no entrance, and the CSS first-paint lock hid the scrollbar
  before the script's lock could measure it, so there was no compensation
  (at 1440, `main` 1425 → 1440 and the navbar moved 7.5 px).
- At rest now applies only to the view the document was served on:
  - the server render, or the render that hydrates its HTML (`useHydrated()`
    false);
  - or, in a client-rendered page, a mount on the view whose URL the
    document was loaded at (the navigation entry's URL, not
    `location`).
- Any other mount is an in-page open: full entrance, normal lock.
- The first-paint CSS lock moved to `data-rest-lock`. Server HTML carries it
  only until hydration, then the script's lock takes over. A client mount
  never carries it, so a scrollbar present at mount is always compensated.
- `verify:ssr`: at-rest server HTML must carry `data-rest-lock`.

## 1.11.0

Requires nothing new (foundation ≥ 1.13.0, unchanged).

Config changes (additive: existing configs keep compiling)
- `kicker` is optional. When it is omitted, empty or blank, no kicker
  element is rendered, so no gap and no empty node. The opening / overview
  title then sits centred in the header bar at every width. Before, a
  `kicker: ""` left an empty span whose 4px gap put the title 2px below the
  bar's centre (≥ 600). Omit it rather than set `""`.

Visual change for every client (RULES §1, no kicker tags)
- A detail view no longer shows its item's label as a kicker over the entry
  title; the title sits alone, centred in the bar (≥ 600; phones already
  showed one line).
  - The item stays on screen through the pager label (panorama), the
    chapter strip's way up and the dock's location glass.
  - For screen readers, it stays as a visually hidden label right after the
    h1, and the dialog's accessible name is now "<entry> <item>".
- Opening and overview views show `config.kicker` only when it is set,
  as before.

Measured on the showcase (title box centre minus bar centre):
- No kicker, ≥ 600: Δ 2.0 → 0.0.
- Details at 1440 / 1024: Δ 6.0–6.5 (two-line stack) → 0.0.
- Phones: Δ 0.0, unchanged.
- Cap-height ink within ±0.5px everywhere.

`verify:ssr`: the opening / first overview renders one kicker node when
`kicker` is set and none when it is omitted, `""` or blank. Every detail
renders none, even with `kicker` set, and keeps its item in the dialog's
`aria-labelledby`.

## 1.10.0

Requires `foundation` ≥ 1.13.0 (`HeldCopy rest`).

Config changes (additive, opt-in; nothing changes without them)
- `directLoad?: "entrance" | "at-rest"` (`DOSSIER_DIRECT_LOADS`, default
  `"entrance"`), a Variation. With `"at-rest"`, the layer the dossier mounts
  with (a page loaded or hydrated on a view URL) shows its first view
  settled from the first paint and hydrates in place:
  - no hold, no media gate, no loader, no remount;
  - that view's entrances run in zero time, ending on their end state;
  - its chapters start revealed;
  - videos get their source after hydration;
  - `<html>` has `overflow: hidden` from the first paint, so the scroll
    lock shifts nothing at hydration.

  Not affected: in-page opens, reopening after a close, every later view,
  and a first view waiting on a `pending` item. These keep the gated
  entrance. README "Direct load at rest".
- New `dossierViewMedia(config, view)`: the images a view shows first, in
  order, for the head preloads of a prerendered view page.

Measured in Tchin (`/menu/`, Lighthouse mobile, devtools throttling, median
of 3): LCP 4.65 s → 2.45 s (= FCP), score 0.78 → 0.93. No hydration warnings
(development React).

`pnpm verify:ssr` renders every reference view with `at-rest` too: the full
per-view contract, plus `data-rest`, no held copy, no waiting / locked /
pending markup, and enabled tiles. A pending item must keep the held path.

## 1.9.2

Fix. No config change. Requires `foundation` ≥ 1.12.0 (`restoreFocus`).

- Close returns focus through `restoreFocus`: a launcher made inert while the
  dossier was open (the navbar finder's pill, its deck closed on launch)
  hands focus to the finder trigger instead of dropping it on `<body>`.

## 1.9.1

Fix. No config change; requires unchanged.

- Opening screen on phones (< 600): the choice tiles stack one per row
  instead of sharing a row. Two tiles side by side on a phone came out
  around 1:4.5, too narrow for any photo's aspect; stacked, two tiles are
  about square. From 600 unchanged. Sheet tile `sizes` now always
  `(max-width: 599px) 100vw`.

## 1.9.0

Additive. Requires `foundation` ≥ 1.10.0 and `controls` ≥ 1.5.0 (unchanged).
Existing configs render as in 1.8.0.

Chapter kit:
- `ChapterRow.media?: DossierMedia`: a thumbnail beside the row's text (a
  dish, a product). Flush with the row's leading edge over its full height
  (5.5em phones, 7em from 768), clipped by the tile's or panel's radius, so
  concentric with no inset radius; beside the text at every width. Takes the
  config's `tileMedia` through the dossier body (graded at rest and released
  on row hover; true-colour: no filter). `<img>` always `loading="lazy"`,
  `decoding="async"`, `srcSet` / `sizes` honoured (default sizes
  `(min-width: 768px) 112px, 88px`), `alt` from `media.alt` else `""`
  (decorative: the label names the row); a video shows its poster. Outside the
  media gate: list the first rows' media in `entry.sources` when rows open the
  entry.
- `ChapterRow.marks?: ReactNode`: small marks after the label (dietary icons,
  a short tag), sized to the label, `--ev-fg-65`; each node names itself.

Markup / CSS:
- `.evd-rows[data-media="graded" | "true-colour"]` when any row has media;
  `.evd-rows__row[data-has-media]`, `.evd-rows__media`, `.evd-rows__marks`.

Reference: Maison Ardoise's menu sections carry a thumbnail per dish and
vegetarian / spicy marks (inline glyphs). `verify:ssr`: every row thumbnail is
an `<img>` with src, alt, lazy, async, and a view carries as many as its
content (the menu's sections must have some).

## 1.8.0

Additive. Requires `foundation` ≥ 1.10.0 and `controls` ≥ 1.5.0 (unchanged).
Existing configs render as in 1.7.0 except the two fixes below. Browsers:
container queries (Chrome 105, Safari 16, Firefox 110); without them the
panorama's chapters keep their tablet layout.

Config (all optional):
- `composition?: "panorama" | "sheet"` (new Variation, `DOSSIER_COMPOSITIONS`;
  default `"panorama"`). `sheet` = the phone / tablet composition at every
  width; from 1024 a centred portrait shell `max(40em, .9 × h) × h`, h = the
  panorama's height.
- `tileMedia?: "graded" | "true-colour"` (new Variation, `DOSSIER_TILE_MEDIA`;
  default `"graded"` = 1.7). `true-colour`: board and opening tiles show the
  photo as shot in every state (no filter, no filter transition, no accent
  wash, neighbours undimmed); border, edge, numeral, shine and scale carry
  the state; the caption scrim stays. `SelectionBoard` takes it as
  `tileMedia` (`data-tile-media` on `.evd-board`).
- `opening?: { id, title, label?, description? }`: an opening screen above
  the items (own view, URL and head).
- Items: `cover?`, `kicker?` (opening tile), `empty?: { title, body? }`
  (board without entries), `pending?` (live content loading).
- Entry counts: any count from 0 (was exactly four). Four keep the
  panorama's mosaic (2×2 in the sheet); other counts take the symmetric
  grid (two columns from 600, one below, an odd count's first tile spans
  the row); none shows the empty panel.
- Copy (optional, defaults per locale): `openItem`, `chooseItem`, `up`,
  `empty`, `loader.pending`. The reference config adds them, plus
  `buildDossierMenuConfig(locale, { specials?, composition? })` (Maison
  Ardoise's menu behind an opening screen; not exported by `index.ts`, so an
  older client-owned config keeps compiling).

API:
- `DossierView` = `{ item: string; entry?: string; opening?: string } |
  { opening: string }`: with `config.opening`, the opening view (key =
  its id) is level 1 and item / entry views carry `opening` (levels 2 / 3);
  without it, views, keys and levels are unchanged
  (`docs/CRAWLABLE-MODALS.md` §1). Code reading `view.item` now gets
  `string | undefined`.
- `dossierRoutes.parse` accepts the entry keys of a pending item.
- Live content: a requested view the config no longer holds settles on its
  ancestor (unknown entry → overview, unknown item → top level) and the
  dossier reports it through `onNavigate`; the body follows entries by id
  (reorders keep the open entry) and keeps the previous board until changed
  media are decoded.
- `SelectionBoard`: `entries` accepts `SelectionTile` (`{ id, title, kicker?,
  media? }`, entries still fit); new `layout?` (`SELECTION_BOARD_LAYOUTS`:
  `mosaic` · `grid` · `choice`; default mosaic for four, grid otherwise; was
  the first four in the mosaic), `numbered?`, `sizes?`.
- New exports: `DOSSIER_COMPOSITIONS`, `DossierComposition`,
  `DOSSIER_TILE_MEDIA`, `DossierTileMedia`, `DossierOpening`,
  `SELECTION_BOARD_LAYOUTS`, `SelectionBoardLayout`, `SelectionTile`.

Markup / CSS:
- Root: `data-composition`; `data-view` gains `opening`; `data-board`
  (`mosaic` · `grid` · `choice` · `empty`) on overviews.
- `.evd-body` is a size container (`evd-body`): the desktop rules of the
  atmosphere, tile text and chapters apply from 1024 *and* a body ≥ 900px
  (the panorama always is; the sheet is not). Measured identical to 1.7.0 at
  390, 834 and 1024 / 1440 (detail).
- New: `.evd-empty*`, `.evd-strip[data-level="items"]`,
  `.evd-board[data-layout]` grid rules, the sheet block (`[data-composition="sheet"]`
  from 1024).

Fixes (visible in 1.7 configs, panorama ≥ 1024):
- Without a header pager (one item) the Evoview mark and the close sat in
  the middle column; they are back on the right edge (`.evd-header__end`
  `grid-column: 3`).
- Every overview scrolled by ~76px (the atmosphere's box hung past the
  body): the glow is drawn inside the body, the board gains the scrollbar's
  10px; rows unchanged (387 / 258 at 1440).

## 1.7.0

Requires `foundation` ≥ 1.10.0 (`lockScroll`). No config changes, no CSS
changes.

- Behaviour: the page scroll lock goes through foundation's shared
  `lockScroll()`, same timing (before paint, released when the exit
  starts). Changes: ref-counted with every other foundation lock (a modal or
  the mobile navbar closing out of order no longer unlocks the page under
  another one); the overflow moves from `<html>` to the element that reaches
  the viewport (body unless the host styles `<html>` overflow); the
  scrollbar compensation adds to the host's body padding instead of
  replacing it; `--ev-scroll-lock-gap` is set while locked; closing near the
  bottom of a page no longer jumps it by a few pixels (Chrome clamp).
  Inert walk, suspension and focus unchanged.

## 1.6.0

- Sync (`docs/SYNC.md`): `evoview.json` (`requires` foundation `>=1.9.0 <2`,
  controls `>=1.5.0 <2`); `install.sh` wraps `sync.sh` (clean plans only;
  local edits merged and recorded as patches, files removed upstream deleted).
- Config changes: new client-owned `src/dossier.theme.css` (accent tokens,
  `--dossier-z`, `--dossier-reserve-bottom`), imported by `index.ts` after
  `dossier.css`; created by the next sync, never overwritten. Existing config
  untouched; built CSS unchanged.
- Docs: ownership sections (RULES §13).
- API (additive): exported variation arrays `DOSSIER_CHAPTER_VARIANTS`,
  `CHAPTER_ROWS_SURFACES` (new types `DossierChapterVariant`,
  `ChapterRowsSurface`). No config change.

## 1.5.0

Requires `foundation` ≥ 1.9.0 and `controls` ≥ 1.5.0 (press jelly). No
config changes.

- Behaviour: mobile dock items and the toast action take the press jelly
  (RULES §6); close / pager / plates through controls. Board tiles and the
  strip's flat cells are unchanged.
- CSS: `.evd-dock__item:active` keeps only its tint (the
  `translate3d(0, 1px, 0) scale(.965)` and the springy `transform`
  transition are gone); `.evd-toast__action` lost its `:active` translate.

## 1.4.0

Crawlable views (`docs/CRAWLABLE-MODALS.md`): every view has a URL and its
server HTML carries the view's copy. Requires `foundation` ≥ 1.6.1 and
`controls` ≥ 1.3.0. The look is unchanged (before/after screenshots at 1440
and 390 are pixel-identical except timing frames).

API:
- New `dossierRoutes: ModalRoutes<DossierConfig, DossierView>`, `type
  DossierView = { item: string; entry?: string }` (keys `item`,
  `item/entry`; ids are URL slugs).
- `<Dossier>` is controlled (`DossierRouteProps`): `view` (null = closed),
  `onNavigate`, `hrefFor?`, `history?`. Tiles, strip, pager, dock, toast,
  Escape, backdrop, close and Back / Forward all call `onNavigate`; history
  is foundation `useRouteHistory` (one entry per level). Keep it mounted
  while closed.
- Legacy props `open` / `onClose` / `initialItemId` / `initialEntryId`
  (`DossierLegacyProps`, used when `view` is omitted) keep working, mapped
  onto an internal view, no URLs. Deprecated; removed in 2.0.
- `SelectionBoard`: new `hrefFor?(index)` (tiles become `<a href>`);
  `registerTile` now receives `HTMLElement | null` (was
  `HTMLButtonElement | null`).
- New exports: `dossierRoutes`, `DossierView`, `DossierRouteProps`,
  `DossierLegacyProps`.

Config (optional, additive): `DossierItem.description?`,
`DossierEntry.description?` (head description, cut to 160 characters),
`DossierMedia.alt?` (head image alt; the board tile stays decorative). The
reference config sets entry descriptions (story lead + body) and media alt.

Markup and behaviour:
- Server-renderable: no environment read in render (server layout =
  desktop), `data-ev-route-layer` on the root; `inert`, `aria-hidden`, the
  loader and the body lock only after hydration.
- Copy mounted, media gated: on a first open the target view's copy mounts
  at once in `HeldCopy` (animations paused, no video source), not shown once
  hydrated, and remounts live when its media are decoded, so the body looks
  and enters exactly as before. Switches still keep the previous view until
  the next one's media are decoded.
- One h1 per view: the header title (overview `copy.overviewTitle`, entry
  label). `.evd-header__meta` is a `div`; the overview's phone readout is an
  aria-hidden sibling of the h1. The detail carries an sr-only h2 with the
  entry title (it names the detail region). Tile captions are no longer
  aria-hidden (the tile's name is still `copy.openEntry`).
- Real links: with `hrefFor`, tiles, `Sommaire`, strip tabs, pager orbs
  (controls `PagerOrb href`), dock buttons and the completion toast are
  `<a href>` with the in-page handler on a plain click; modified clicks open
  the URL. Close stays a button. Without `hrefFor`: buttons, as before.
- Chapters below the intro hide while pending only once hydrated
  (`data-pending`; was the absence of `data-revealed`).
- Focus: closing returns focus to the launcher (React's commit-phase focus
  restore used to take it back to the close button, then it fell to
  `body`); going back to an overview (Escape, `Sommaire`, browser Back)
  refocuses the tile you came from.
- CSS: `.evd-toast button` → `.evd-toast .evd-toast__action`;
  `.evd-tile[aria-disabled="true"]`; `.evd-body [data-waiting]`;
  `.evd-chapter[data-pending]`; link resets for the view links.

## 1.3.0

Requires `foundation` ≥ 1.5.0 (`TextFill`) and `controls` ≥ 1.2.0. No config
changes, no API changes.

- Behaviour: text colour switches take the liquid fill (RULES §1): strip tab
  labels (rest → past → active, hover), the overview link (label and arrow),
  tile index and kicker (hover from 1024 with hover, cycle focus on touch),
  dock icon and label (touch press). The active tab's number keeps following
  its accent badge.
- Behaviour: the completion toast's hover plate pours in (foundation
  `SurfaceFill`).
- CSS: those rules no longer set `color`; backgrounds and opacity still
  transition.

## 1.2.0

Text lists on tonal surfaces (RULES §3; uses foundation 1.3.0
`--ev-surface-list*`, with fallbacks):
- `ChapterRows`: one rounded panel, rows alternating a step, label · detail
  on one line from 768; placed straight on a chapter rail it sits under the
  heading's copy column from 1024. New `surface` prop: `"rows"` (default) or
  `"tiles"` (one rounded tile per item).
- `ChapterSpecimen` with rows: the paper card is the panel — rows edge to
  edge, banding a step down; the example note closes the card.
- `ChapterPayoff` results: peer tiles; on phones one joined panel, value ·
  label on one line, rows alternating.
- Surfaces resolve per chapter tone (`--dossier-list` / `--dossier-list-alt`
  on `.evd-chapter`: a, b and paper each step off their own ground). No
  borders, same text ladder.

Config / API changes: `ChapterRows` gains `surface?: "rows" | "tiles"`
(default `"rows"`); `ChapterRowsProps` exported. The reference config is
unchanged (practical info and specimens use the default).

## 1.1.2

- `--dossier-reserve-bottom` now defaults to the generic
  `--ev-modal-reserve-bottom` (shared with the `process-sequence` step
  dossier), then 0. A host sets one variable for both modals; an explicit
  `--dossier-reserve-bottom` still wins. Client default unchanged (0). No
  config changes.

## 1.1.1

- Requires `foundation` 1.2.0. The idle preload uses `preloadMedia`, so
  preloaded universes open and switch with the gate ready on its first
  render (no hold, no grace gap). No config changes.

## 1.1.0

Fixes (the "loads only half of the time" report):
- A universe's first visit (open, pager, dock) cut to an empty body for the
  350 ms grace, then a loader until its media arrived; revisits were
  instant. The body now keeps the previous view (inert, dimmed after 140 ms)
  until the next one is decoded, the dark cut plays when the board actually
  changes, and `<Dossier>` warms every item's board images on idle
  (`preload`, default on).
- Every entry open faded up from nothing for 0.15–0.5 s (detail entrance ×
  intro-chapter reveal). The intro chapter now enters with the detail; the
  detail fades from .35.
- Chapters skipped by a jump (End, scrollbar drag, the toast) stayed at
  opacity 0. The reveal is driven by the body's scroll position (top past
  90 % of the body), and every pending chapter above that line reveals too;
  no IntersectionObserver against the viewport.
- Reopening during the exit animation resumed the closing layer (previous
  item/entry, `initialItemId` ignored, no history entry, Back left the
  route). Every open now mounts a fresh layer.
- The page stayed inert and scroll-locked for the whole exit animation; it
  is released when the exit starts (the fading layer lets clicks through),
  and the layer is removed after 700 ms even without `animationend`.
- The content vanished as the shell left (the gate reset on close); it stays
  through the exit.
- Entrances fill backwards only (tiles, detail, chapters): content is
  visible even if an animation never runs.
- The completion toast sat under the current tab; it now sits under the tab
  it opens (under the last tab when it leaves for the next universe).

Visual (RULES §3):
- No rules: chapter seams, row hairlines, results top rule, loader head rule,
  header bottom border, strip bottom border, `Sommaire` and tab separators,
  header and dock dividers removed. The strip's per-tab track is its one line.
- Specimen without the `Exemple` label (the note says it); rows unnumbered
  unless they are a sequence.

Config / API changes:
- `ChapterRows`: `numbered` now defaults to `false`; pass `numbered` for a
  real sequence. The `evd-rows--plain` class is gone (`evd-rows--numbered`
  marks the numbered variant).
- `ChapterSpecimen`: `label` prop removed — delete it from configs; keep
  `note`.
- Reference config: overview `kicker` no longer repeats the brand
  (`"Expériences"` / `"Experiences"`); specimen and facts rows unnumbered.
- New `<Dossier preload>` prop (default `true`); new CSS knob
  `--dossier-reserve-bottom` (default 0).
- `DossierChapter` outside a dossier body renders revealed (no choreography).

## 1.0.2

- The inert walk skips elements carrying `data-ev-keep-interactive` (host
  dev/showcase chrome, e.g. the library's floating accent palette). Client
  behaviour unchanged. No config changes.

## 1.0.1

- Requires `controls` 1.1.0: initial focus goes to the close button through
  its `ref` (no `querySelector`). No config changes.

## 1.0.0

- First release on `foundation` 1.0.0 + `controls` 1.0.0: `Dossier` (portal
  modal), `SelectionBoard`, `DossierLoader`, open chapters (`DossierChapter`,
  `ChapterHead`, `ChapterFigure`, `ChapterSplit`, `ChapterRows`,
  `ChapterSpecimen`, `ChapterPayoff`).
- Config: `dossier.config.tsx` — `brand`, `kicker`, `items[] { id, label,
  accent?, accentInk?, entries[4] { id, title, label?, kicker?, media,
  sources?, content(ctx) } }`, `attribution { enabled, href, label }`,
  `copy` (FR / EN). `buildDossierConfig(locale)`, `dossierCopy(locale)`.
- Reference content: Maison Ardoise (fictional restaurant), 3 × 4 entries.
