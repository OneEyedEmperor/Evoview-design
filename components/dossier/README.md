# dossier — Evoview portal modal

The Evoview portal — *isolate, demonstrate, explain* — as a neutral chassis
for any multi-part offering (services, projects, menus, rooms…). A header
strip with location and a reliable return, an asymmetric 4-tile selection
board, a reading body of open chapters, a chapter strip whose underline is the
reading progress, a glass dock on phones, an honest media loader. Extracted
from the service dossiers of evoview.be (`docs/extraction/service-dossiers.md`
A1/A2/A11, `portfolio-contact.md` A3) and decoupled. Depends on `foundation`
and `controls`.

Two compositions (Variation): **panorama**, the wide desktop shell below,
and **sheet**, the phone / tablet composition at every width (a narrow
portrait shell from 1024) for quick-glance content such as a menu. An
optional **opening screen** chooses between the items. An item can show a
**live feed** (news, posts) on the feed board instead of the selection board.

Showcase: `https://evoview-library.said.bet/components/dossier` (Maison
Ardoise, a fictional restaurant: three universes behind a pager with a deep
link and the per-universe accent switch; a single-universe dossier launched
from a light page; its menu behind an opening screen, the menu or the day's
specials (0 / 3 / 5 posted); its journal, a live feed behind a fake paginated
API; desks pick the composition (from 1024), the tiles' photos (graded | true
colour) and the specials count; FR/EN, live palette). Every view has a URL:
`/components/dossier/<key>/` addresses the three-universe dossier
(`table/tasting`), `/components/dossier/single/<key>/` the single one,
`/components/dossier/opening/<key>/` the menu (`choose`, `specials/amber`),
`/components/dossier/journal/<key>/` the feed (`journal`, `journal/page/3`,
`journal/huile-olive`). Test hooks (URL only, nothing visible): `?feed-cap=N`
lowers the batch cap; `?feed-network=down` fails every fetch, `down-from-2`
serves page 1 and fails later pages and single entries.

```
panorama ≥ 1024 (shell 92.5em × min(57.5em, 100vh − 2em), radius shell)
┌ CLIENT │ TITLE                 (‹) LABEL ▬▭▭ (›)        EVOVIEW │ [× FERMER] ┐ 77
├ ‹ SOMMAIRE │ 01 Tab ▔▔▔ │ 02 Tab │ 03 Tab │ 04 Tab ─────────────────────────┤ 58 (detail)
│ overview: 7/5 over 4/8 board (rows 1.2 / .8)  ·  detail: open chapters      │
└──────────────────────────────────────────────────────────────────────────────┘
phone (both): [glass capsule: CLIENT │ TITLE · EVOVIEW (×)] … body … [‹ | 01 / 04 ▬ | SUIVANT ›]
sheet ≥ 1024: the tablet dossier (capsule, 2×2 board, dock, tablet chapters) in a
centred shell max(40em, .9 × h) × h, h = min(57.5em, 100vh − 2em) (51.75em × 57.5em)
```

## Signature (preserve)

Read `STRATEGY.md`. These make the dossier recognisably Evoview; do not
restyle them to the client's UI kit. Changing them is a library change
(RULES §13).

- **Header strip (chassis signature)**: client identity · title readout
  (Satoshi 700 uppercase, centred in the bar) · item pager (glass orbs,
  label, location bars; only with two or more items) · the Evoview mark ·
  labelled glass close. Grouped by space, no divider rules. No kicker over a
  detail's title (RULES §1): the item is carried by the pager / chapter strip
  / dock and stays in the dialog's accessible name. An optional
  `config.kicker` may sit over the opening / overview title (≥ 600); omit it
  by default.
- **Selection board**: four tiles make the asymmetric mosaic, 7/5 over 4/8
  on 12 columns, rows 1.2fr / .8fr (panorama ≥ 1024); 2×2 from 600 (and in
  the sheet); four rows on phones. Any other count (live content) takes the
  symmetric grid: two equal columns from 600, one below, an odd count's
  first tile spanning the row; rows share the height down to a floor (7em
  phones, 10em from 600), then the body scrolls. No entries: one tonal panel
  with the item's sentence and a link to the next item. Graded media
  (desaturated, darkened) releasing colour on hover / focus / touch-cycle
  focus, or true-colour media with the state carried by the frame (a
  Variation, `tileMedia`); either way accent border + bottom edge + numeral,
  shine sweep, slight scale, caption scrim, title bottom-left. Numerals in
  the display face (not Gaegu).
- **Feed board** (`board: "feed"`): the board tile (frame, accent border and
  bottom edge, shine, scale, caption scrim, display title bottom-left, kicker
  in the state voice) in one grid of equal peers, 3 columns in the panorama,
  2 from 600 and in the sheet, 1 below, at a fixed ratio (4:3, 16:10 under
  600) so the grid only ever grows at the bottom. No numerals (the order is
  chronological, not a sequence). The view's first batch takes the board's
  one-time convergence; later batches are **append-only**: placeholder wells
  take their cells, their tiles are held until decoded (media-gated reveal
  per batch), then only their content pours in. Nothing placed moves,
  re-enters or waits. Error and end on a tonal panel; the live-updates
  control is glass chrome laid over the board, never pushing it.
- **Opening screen** (optional): the items as equal choice tiles, stacked
  one per row on phones, then one row from 600 (up to 3, 4 in the panorama
  ≥ 1024, then the grid's rule), the board tile without numeral, a larger title, the item's
  readout above it.
- **Chapter strip**: `Sommaire` + numbered tabs; the per-tab 3px track is the
  strip's one line and its fill is the reading progress (past tabs full);
  completion toast at ≥ 90 % under the tab it opens, with a 12px accent stem.
  Under an opening screen the panorama's overview gets the same strip one
  level up: `‹ <opening label>` + the items as tabs (the current one's track
  full), and the header pager steps aside.
- **Phone chrome**: floating glass capsule + 3-column glass dock
  (`prev/home · 01 / 04 + bars · next`), both leaving on scroll-down and
  returning on scroll-up, near the top or on focus; spring press + touch bloom.
- **Open chapters**: unboxed, separated by space and the alternating
  `#0c0c0d / #101011` — no rules between chapters, rows, results or columns
  (RULES §3); claim → artefact → one sentence; `.72 / 1.28` heading / copy,
  `.7 / 1.3` side / stage, `1.2 / .8` payoff; captions inside media; one
  display level per chapter; one exit CTA per story. Row indices only for a
  real sequence (`ChapterRows numbered`).
- **Text lists on tonal surfaces** (RULES §3): never bare text, never lines.
  `ChapterRows` defaults to one rounded panel whose rows alternate a step
  (`--dossier-list` / `--dossier-list-alt`, resolved per chapter tone from
  foundation's `--ev-surface-list*`), label · detail on one line from 768,
  under the heading's copy column from 1024; `surface="tiles"` gives one
  rounded tile per item for peers. In a `ChapterSpecimen` the paper card is
  the panel: rows run edge to edge and band a step down, the example note
  closes it. Payoff results are peer tiles (one joined alternating panel on
  phones). No borders; same text ladder; radius by role (surface for panels
  and tiles, 0 for joined rows).
- **Rows with media** (`ChapterRow.media`, 1.9.0): a thumbnail flush with the
  row's leading edge over its full height (5.5em phones, 7em from 768), so the
  tile's or panel's radius rounds its outer corners — concentric by
  construction, never an inset radius. Beside the text at every width (a list
  stays scannable on a phone; above would turn each row into a card). The text
  keeps its tonal surface, grid and floors; the thumbnail is a tonal well
  (`--ev-well`) until decoded and takes the config's `tileMedia` (graded at
  rest, released on row hover; true-colour: no filter). `marks` (dietary
  icons, a short tag) follow the label, each node naming itself.
- **Media gate**: a view is revealed only once its media is decoded. The body
  keeps the previous view (inert, dimmed after 140 ms) until the next one is
  ready, so a switch never cuts to an empty body; loader after 350 ms over
  it, count `02 / 04`, one module per medium, 1px accent bar, retry. The only
  empty moment is a first open on a cold cache, inside the shell's entrance:
  the view's copy is already mounted there (held, not shown), so server HTML
  and crawlers have it; it enters when its media are ready.
- **Modal contract**: below.
- **Motion**: open = opacity + scale .965 + clip inset, 620 ms cinematic;
  close 340 ms; board tiles converge (±34px, blur 5 → 0) staggered 100 ms;
  detail enters y 10 → 0 from opacity .35; chapters below the intro reveal
  y 16 → 0 once, stagger 80, when their top passes 90 % of the body (every
  chapter above that line reveals too, so jumps never leave one hidden);
  item switch = 260 ms dark cut at the moment the board changes. Entrances
  fill backwards only: if an animation does not run, the content is visible.
  Not the CRT power-on, channel OSD or scan grid (Evoview's own art
  direction).
- **Accent roles**: strip underline and tab chip, tile border / edge /
  numeral / kicker, pager and dock bars, dock location tint, capsule / orb /
  close glass tints, loader modules and bar, caption dot, row indices, payoff
  accent line and bloom, toast hairline. Never backgrounds, body text or the
  CTA at rest (white plate). Light accents (yellow, off-white) stay legible
  through `--ev-accent-signal`.

### Attribution (approved placement)

One linked `EvoviewMark` in the header strip, right side, before the close
(`attribution.href` = `https://evoview.be/`, new tab, `rel="noopener"`,
accessible name in the page language naming Evoview and the new tab). Never
inside or next to the client's CTA (the payoff plate lives in the body). On
by default (`attribution.enabled`); turning it off is the founder's call. No
other marks. `attribution.href: null` pauses the link while evoview.be isn't
live (the mark stays, unlinked); restore the URL to relink.

## Variations (select)

- **Composition** (`config.composition`, `DOSSIER_COMPOSITIONS`):
  - `panorama` (default): the wide shell from 1024 (header strip, chapter
    strip, mosaic, desktop chapters); below 1024 the phone / tablet chrome.
  - `sheet`: that phone / tablet composition at every width (glass capsule,
    glass dock, 2×2 / symmetric board, tablet chapters). Below 1024 it is
    identical to the panorama. From 1024 the shell is centred and portrait:
    height = the panorama's, `min(57.5em, 100dvh − 2em − reserve)`, so both
    share the window's top and bottom; width = `.9 ×` that height (RULES §4
    portrait card ratio), 51.75em at full height (712px at 1440), never under
    40em (the narrowest width the tablet's two-column board was built for);
    radius shell (1.5em), capsule / dock 16px as on tablets. For quick-glance,
    single-purpose dossiers (a menu); it overwhelms less than the panorama.
- **Tile media** (`config.tileMedia`, `DOSSIER_TILE_MEDIA`), board and
  opening tiles alike:
  - `graded` (default): desaturated and dimmed at rest, neighbours of a
    hovered tile dim further, the focused tile releases its colour (still
    softened, with the accent wash `.evd-tile__grade`).
  - `true-colour`: the photo as shot at rest, hover, focus and touch-cycle
    focus, neighbours undimmed, no accent wash, no filter (so no filter
    transition). The frame carries the state: accent border, bottom edge,
    numeral liquid fill, shine sweep, slight scale; the touch cycle frames its
    tile the same way. The caption scrim stays. For clients whose photos must
    stay true to colour (food).
- **Direct load** (`config.directLoad`, `DOSSIER_DIRECT_LOADS`): the first
  view of a page loaded on a view URL (the view the document was served on).
  - `entrance` (default): that view waits for its media and hydration, then
    plays the same entrance as an in-page open.
  - `at-rest`: that view is the settled view from the first paint and
    hydrates in place, for dossiers that are a page of their own (a menu
    reached from search). For details see "Direct load at rest" below.
    In-page opens and every later view keep the full entrance.
- **Board** (`item.board`, `DOSSIER_ITEM_BOARDS`), per item:
  - `selection` (default): the mosaic / symmetric grid of the item's entries.
  - `feed` (the default when `item.feed` is set): a live feed in batches, one
    page each, page URLs, deep links to entries not loaded yet, optional live
    updates (README "Feed"). For news, journals, social posts. A feed board
    without `feed` shows its static entries as one batch.
- **Opening screen** (`config.opening`): an optional top level choosing
  between the items (Tchin: `Carte | Promotions`); selecting opens that
  item's overview, Escape / Back / `‹ <label>` return to it. Its own view
  and URL (`opening.id`), h1 `opening.title`. Meant for 2–5 items. Five
  (approved on Evoview Gaming: Latest + four desks): a lead tile on a full
  row over a 2×2 from 600, five rows on phones; put the item that leads
  (a feed, the main one) first.
- **Universes:** one item (no pager; the last entry's next returns to the
  overview) or several (pager in the header, dock steps through items).
- **Entry counts:** four entries make the mosaic (panorama) / 2×2 (sheet);
  any other count, 1 to n, the symmetric grid (both compositions); none,
  the empty panel (`item.empty`, else `copy.empty`). Counts may change while
  open (live content, below).
- **Detail chapters**, composed from the chapter kit (`Chapters.tsx`):
  `DossierChapter` `variant` from `DOSSIER_CHAPTER_VARIANTS` (`intro` ·
  `standard` · `payoff`, default standard; intro opens the story, payoff
  closes it), `ChapterHead`, `ChapterFigure`, `ChapterSplit`, `ChapterRows`
  (`surface` from `CHAPTER_ROWS_SURFACES`: `rows` for info sheets and
  programmes, default · `tiles` for peers; `numbered` only for a real
  sequence; per row optional `media` and `marks`, below), `ChapterSpecimen`,
  `ChapterPayoff`. `ChapterHead` `as` takes `"h1"` and an `id` for an entry
  whose content renders the view's h1 (`heading: "content"`, below);
  `ChapterFigure` `caption.kicker` is optional (omitted or empty: no kicker
  element, RULES §1).
- **Rows with media** (a menu, a product list): `{ label, detail, media?,
  marks? }`. `media` is a `DossierMedia` image (a video shows its `poster`),
  decorative unless `alt` is set; `srcSet` / `sizes` honoured (default sizes
  `(min-width: 768px) 112px, 88px`); always `loading="lazy"`, `decoding="async"`.
  Thumbnails stay **outside the media gate**: a long list must not hold the
  entry's reveal, and rows usually sit below the intro. When rows open the
  entry (visible at reveal), list the first screenful's media in
  `entry.sources`: the gate decodes them, the lazy images then come from the
  cache. `tiles` suit dishes / products (one card per row); in `rows` and a
  `ChapterSpecimen` the thumbnails form one column.

## Expression (adapt)

Config only: brand (logo node or name), opening (title, label),
items (label, accent, cover and readout for the opening tile, empty-day
sentence), entries (title, short label, kicker, media, detail chapters'
content), a feed's source and records (the fetcher, `toEntry`, page size,
refresh period), all copy (`copy.feed` included), attribution label. Accent = the client's: the host `--primary` /
`--primary-foreground`; an item may set its own (`item.accent`), applied as
`--primary` on the dossier while that item is shown.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/dossier.config.tsx` | Brand, kicker, items, entries + detail chapters, copy FR/EN, attribution; reference: `buildDossierConfig` (universes), `buildDossierMenuConfig` (opening screen + live specials) | **yes** (client-owned, like the theme file) |
| `src/Dossier.tsx` | Modal, header strip, pager, chapter strip, toast, dock, history, focus, gate, live content | no |
| `src/routes.ts` | `dossierRoutes` (views, keys, parents, head data), `DossierView` | no |
| `src/Board.tsx` | `SelectionBoard` (mosaic, grid, choice, grade, touch cycle) | no |
| `src/feed.ts` | `useDossierFeed`, `dossierFeed`, feed source contract, cache and load states | no |
| `src/FeedBoard.tsx` | `FeedBoard` (batches, placeholders, sentinel, page links, error / end, live control), `feedEntry` | no |
| `src/copy.ts` | Defaults for the 1.8.0 copy keys (configs that predate them) | no |
| `src/Loader.tsx` | `DossierLoader` | no |
| `src/Chapters.tsx` | `DossierChapter`, `ChapterHead`, `ChapterFigure`, `ChapterSplit`, `ChapterRows`, `ChapterSpecimen`, `ChapterPayoff` | no |
| `src/types.ts`, `src/hooks.ts`, `src/index.ts`, `src/dossier.css` | Types, media helpers, exports, styles (`.ev-dossier`, `evd-*`) | no |

`showcase.css` is the library page's sheet; not installed. Placeholder media:
`public/library/dossier/*.webp` (library only).

## Install

```bash
L=/root/.vibehub/projects/evoview-design-library
$L/sync.sh plan /root/.vibehub/projects/<client> dossier   # read-only: files, deps, compat, changelog
$L/sync.sh apply /root/.vibehub/projects/<client> dossier  # then resolve conflicts, fill patch reasons
$L/sync.sh verify /root/.vibehub/projects/<client>
```

Writes `src/` to `<client>/src/components/dossier/`, plus `controls` /
`foundation` when absent or too old; `dossier.config.tsx` and
`dossier.theme.css` (tokens, `--dossier-z`, `--dossier-reserve-bottom`) are
client-owned, never overwritten. `install.sh <client>` applies clean plans
only. Contract: `docs/SYNC.md`.

```tsx
import { Dossier, buildDossierConfig, dossierRoutes, type DossierView } from "@/components/dossier";
import { followRouteLink, routeHrefs, viewFromPath } from "@/components/foundation";
const base = "/carte/";                                   // this page's route, per locale
const config = buildDossierConfig(locale);
const hrefFor = routeHrefs(base, dossierRoutes.key);      // "/carte/table/", "/carte/table/tasting/"
const [view, setView] = useState<DossierView | null>(() => viewFromPath(location.pathname, base, dossierRoutes, config) ?? null);
const open = (v: DossierView) => ({ href: hrefFor(v), onClick: (e: MouseEvent) => followRouteLink(e, () => setView(v)) });
<a {...open({ item: "table" })}>…</a>
<Dossier config={config} view={view} onNavigate={setView} hrefFor={hrefFor} />
```

## Config

```ts
type DossierConfig = {
  locale: "fr" | "en";
  composition?: "panorama" | "sheet";              // DOSSIER_COMPOSITIONS; default "panorama"
  tileMedia?: "graded" | "true-colour";            // DOSSIER_TILE_MEDIA; default "graded"
  directLoad?: "entrance" | "at-rest";             // DOSSIER_DIRECT_LOADS; default "entrance"
  brand: { name: string; logo?: ReactNode };      // logo ≈ 18px tall, currentColor
  kicker?: string;                                 // opening / overview header kicker (≥ 600); omit: none, title centred (RULES §1)
  opening?: {                                      // optional top level choosing between the items
    id: string;                                    // its URL slug, distinct from every item id
    title: string;                                 // h1 + head title
    label?: string;                                // phone readout, "‹ label", breadcrumb (default: title)
    description?: string;
  };
  items: {
    id: string; label: string;
    accent?: string; accentInk?: string;           // per-item accent; omit to follow the host
    description?: string;                          // overview meta description (default: label + entry titles)
    cover?: DossierMedia; kicker?: string;         // opening tile (default media: first entry's)
    empty?: { title: string; body?: string };      // board without entries (default copy.empty)
    pending?: boolean;                             // live content still loading
    board?: "selection" | "feed";                  // DOSSIER_ITEM_BOARDS; default "selection" ("feed" with `feed`)
    feed?: DossierFeed;                            // useDossierFeed / dossierFeed; then entries: feed.entries
    copy?: DossierItemCopy;                        // (1.15.0) this item's views in its own words, over `copy` (below)
    entries: {                                     // 4 = mosaic; any other count, 0..n = symmetric grid
      id: string; title: string;                   // title: the view's h1 and head title
      label?: string;                              // short name: tabs, dock, phone header readout (default: title)
      heading?: "header" | "content";              // where the h1 is (default header; content: the detail renders it)
      kicker?: string;
      media: { src; type?: "image" | "video"; poster?; srcSet?; sizes?; position?; fit?; alt? };  // alt: head image only
      sources?: MediaSource[];                     // the detail's media to decode first, as rendered ({ src, srcSet?, sizes? });
                                                   // given: the detail waits on these, not on `media`; omitted: `media` at the tile's sizes
      description?: string;                        // entry meta description, from its own copy
      content: (ctx: { item, entry, index, total, close, toOverview, headingId }) => ReactNode;
    }[];
  }[];
  attribution: { enabled: boolean; href: string; label: string };
  copy: DossierCopy;                               // dossierCopy(locale) gives the FR/EN defaults; copy.feed? (1.14.0) partial, per-locale defaults
};
```

**A detail's h1 is its entry `title`** (CRAWLABLE-MODALS §4). Default
(`heading: "header"`): the h1 is in the header; with a distinct `label`,
desktop shows the title and phones the label (the h1 stays spoken there,
as on the opening and overviews). `heading: "content"`, for a detail that
shows its title itself (an article's headline): the content renders it as
the h1, `<ChapterHead level="title" as="h1" id={ctx.headingId} title={entry.title} …>`,
and the header keeps the `label` as a readout. Never render the title twice
as headings.

In `heading: "header"` mode the desktop header's visible h1 is the **full
title** (one line, cut with an ellipsis past the bar's width, about 300px at
1440). Long titles (headlines) take `heading: "content"`; otherwise keep
header-mode titles to the bar's width.

Ids (opening, items, entries) are URL slugs: `[a-z0-9-]`. Copy keys added in
1.8.0 are optional (`openItem`, `chooseItem`, `up`, `empty`,
`loader.pending`); omitted, they take the locale's defaults.

**Item copy** (`item.copy`, 1.15.0): `copy` names the items' shared kind
("Desk", "Univers"); an item of another kind keeps its own words with
`item.copy`, any `DossierCopy` key, `dock` / `loader` / `feed` key by key
(`DossierItemCopy`). It applies to that item's views only: header (the
overview's `overviewTitle` is its h1 and head title), strip, toast, dock,
loader, spoken names. A feed among desks: `{ overview: "Latest",
toastBack: "Back to Latest", dock: { item: "Latest" }, loader: {
overviewKicker: () => "Latest" } }`. The reference journal carries its feed
copy this way (`buildDossierFeedItem`). Without `item.copy` nothing changes.

### Live content

A config is data: build an item's entries from fetched content (an
admin-edited list) and rebuild the config when it changes.

```tsx
const [promos, setPromos] = useState<Promo[] | null>(null);       // null: loading
useEffect(() => { fetchPromos().then(setPromos, () => setPromos([])); }, []);
const config = useMemo(() => buildConfig(locale, promos), [locale, promos]);
// item: { id: "promotions", pending: promos === null, entries: (promos ?? []).map(toEntry), empty: { title, body } }
```

- `pending: true` while loading: the item's views wait behind the loader
  (status `loader.pending`) and `parse` accepts its entry keys (any
  lowercase slug, `[a-z0-9][a-z0-9-]*`), so a deep
  link (`/menu/promotions/<id>/`) seeds a view that opens once the entry
  arrives; `head` answers such a key with its item board's data (served as
  a `noindex` shell, CRAWLABLE-MODALS §7.4). Set it false once the data is
  in, whatever it holds.
- Entries may change while the dossier is open: the board re-lays out (the
  previous one stays until the new media are decoded); an open entry that
  disappears, or a pending key that never arrives, settles on its item's
  overview, history steps Back to it and the host hears it through
  `onNavigate`; an unknown item settles on the top level. Entry ids must be
  stable across fetches (they are URLs).
- Prerender the views of the data available at build time; entries added
  later render client-side (their URLs work once the data has them).

### Feed (`board: "feed"`, 1.14.0)

For content that keeps growing (news, a journal, social posts): pages of
entries from any fetcher, shown in batches, each page also a URL.

```ts
type DossierFeedSource<T extends object> = {
  fetchPage(page: number, cursor: string | null, signal: AbortSignal): Promise<{ items: T[]; next: string | null }>;
  fetchEntry?(id: string, signal: AbortSignal): Promise<T | null>;   // deep links to entries not in a loaded page
  toEntry(record: T): DossierEntry;                                  // id = stable URL slug
};
useDossierFeed(source, { initial?: DossierFeedSnapshot<T>, pageSize = 9, batchCap = 8, refreshMs?, key? }): DossierFeed;
dossierFeed(snapshot, toEntry, { pageSize, batchCap }): DossierFeed;   // data only: build time, prerender
feedEntry({ id, title, label?, kicker?, media, excerpt?, body?: string[], content?, closing? }): DossierEntry;
```

- **Source.** `page` is 1-based; `cursor` is the previous page's `next` when
  known, null for a page requested directly (a page URL): a cursor-only API
  (Instagram) walks from page 1 inside `fetchPage`. `next: null` = last page;
  past the end resolve `{ items: [] }`; reject on failure (retry offered).
  Records stay the source's own shape, serialisable for the snapshot;
  `toEntry` maps them (a new locale needs a new cache: `key`, below).
  `feedEntry` gives a default article detail: title and lead over the hero
  picture, then the text in the reading column; pass `content` (with its
  `sources`, as rendered) for your own chapters, `closing` for the story's one
  exit CTA. Its h1 is the intro title (`heading: "content"`, the default:
  headlines run long); `heading: "header"` puts it in the bar and the intro
  opens on the excerpt, so one heading carries the title either way. A
  `srcSet` media is listed in `sources` as the hero renders it.
- **Media.** Feed tiles render at the feed grid's `sizes` (1 / 2 / 3
  columns) unless the media sets its own; the overview gate, each batch's
  gate, the idle preload, `dossierViewImages` and a detail without `sources`
  (a deep-linked entry included) fetch that same candidate.
- **State** (package side, `DossierFeed`): cached pages (an entry already on
  an earlier page is left out of a later one: boundaries move when entries
  are published), single entries, `pageStatus(n)` / `entryStatus(id)`
  (`idle | loading | ready | error | missing`), loaders, live updates. A
  failed page or entry is fetched again only on an explicit retry
  (`loadPage(n, true)`: the board's and the loader's retry, appending past it);
  renders never re-fetch it.
- **Cache owner** (1.15.0). With `key` (e.g. the locale) the cache belongs
  to it: a new `key` empties it and aborts what is in flight, and the source
  may be an inline literal rebuilt on every render (the latest is always
  called). Its `toEntry` is captured when the cache resets: one that reads
  anything besides the key (a label, copy) takes the new value at the next
  `key` change only, so put what it reads in the key or keep it stable.
  Without `key` the cache belongs to the source's functions (`fetchPage`,
  `fetchEntry`, `toEntry`): keep them stable (module functions, `useMemo` /
  `useCallback`), a change resets as above. Functions rebuilt on every
  render without a `key` no longer loop ("Too many re-renders", 1.14.0):
  the cache is pinned for the hook's lifetime (it never resets again, so a
  locale switch keeps the first locale's entries) and a console warning
  names the fix, `key`. `initial` seeds the first owner only.
- **Wiring:**
  ```tsx
  const source = useMemo(() => newsSource(locale), [locale]);         // fetchPage / fetchEntry / toEntry
  const feed = useDossierFeed(source, { initial: snapshot, refreshMs: 60_000, key: locale });
  const config = useMemo(() => buildConfig(locale, feed), [locale, feed]);
  // item: { id: "news", label, board: "feed", feed, entries: feed.entries, empty }
  ```
  Routing and launchers as for any dossier; `viewFromPath` resolves page and
  entry URLs (`/news/page/3/`, `/news/<slug>/`).
- **Views.** `{ item }` is page 1; `{ item, page: n }` (n ≥ 2) is
  `<item>/page/<n>/`, one level below page 1 (h1 and head title carry
  "Page n"); entries opened from a page view carry its `page` (not in the
  key), so Escape / Back return to that board. `<item>/page/1` names nothing.
  `parse` accepts any lowercase entry slug of a feed (`[a-z0-9][a-z0-9-]*`,
  never `page`, reserved for page URLs; fetched by `fetchEntry`; one it
  cannot find settles on its page) and any page number from 2 (`[1-9]\d*`)
  up to the last page when it is known (a cached page with `next: null`;
  past it `parse` rejects: a 404), any one while the end is not known
  (fetched; past the end it settles on page 1). Feed entry ids are
  lowercase slugs other than `page`. `views` lists page 1, each loaded page from 2
  (one whose entries all came on earlier pages too, with no tiles) and their
  entries; single entries fetched later are not listed. `head` answers every
  parsed view: an awaited entry or page gets its board's answer (page title,
  item description and picture). **Server rule:** a key `parse` rejects is a
  real 404; a parsed key the build has no data for gets the page shell with
  `noindex` and the client brings the view (contract §2, "Live content"; a
  static host's recipe, `_shells.json`: §7.4). A host that stores view keys
  keeps the `page` reported with an entry opened from a page view (§7.1).
- **Server HTML** of a page view: that page's batch only (eager images), a
  link to the newer page (n ≥ 2) and to the older one (or the end panel). No
  placeholders, held tiles, live control or error state.
- **Prerender** with the build-time pages: `dossierFeed(snapshot, toEntry)`
  in the config, `[null, ...dossierRoutes.views(config)]` as usual, the
  snapshot serialised into the HTML and passed as `initial` so hydration
  matches. Pages and entries newer than the build render client-side.
- **Board, client side.** The view's page is its first batch, gated with the
  overview. Reaching the end (a sentinel in the modal's own scroll body, 600px
  ahead, or a plain click on the older link) appends the next page: its
  placeholders, then its tiles held until decoded (their own gate, never the
  board's), then revealed. After `batchCap` batches the older link opens the
  next page's view instead. A board keeps its batches and scroll through a
  detail and back while the dossier is open.
- **DOM growth: a cap, not a window.** One board view holds at most
  `batchCap` × `pageSize` tiles (8 × 9 = 72; measured ≈ 12 nodes per tile, so
  ≈ 900 nodes plus chrome, under the 2,100 measured on the site home,
  `animations/SKILL.md` §3). Beyond it the visitor continues on the next
  page's URL (a fresh board). Windowing or recycling would move or rebuild
  tiles under the reader, break find-in-page and the tile refocus, and add
  scroll-time work; the cap adds none. Images past the first batch are
  `loading="lazy"`, decoded per batch; the idle preload warms page 1 only.
- **Detail.** Strip tabs (no numerals, as the board) and dock bars show a
  window of four entries around the open one; positions are spoken without a
  total and continue across pages (page 3's first entry is 19 with nine a
  page; `copy.feed.location`, tiles `copy.feed.open`);
  the dock count reads `n / loaded+` while more pages exist. From the last
  loaded entry the next page is fetched, so the next link has somewhere to go.
- **Live updates** (`refreshMs`): page 1 is re-fetched on a clock that runs
  only while the feed's first page is on screen and the document visible
  (pause model, resumes with the remaining time). New entries wait behind a
  glass "N new" control laid over the board; nothing reflows until the
  visitor taps it, which makes the fresh page 1 the start (older pages are
  dropped, boundaries moved) and returns to the top.

`<Dossier>` props: `config`, `view` (`DossierView | null`, null = closed),
`onNavigate(view | null)` (every navigation the dossier asks for and every
Back / Forward; set `view` to it), `hrefFor?(view | null)` (URL of a view,
null = the page; without it no URLs and controls stay buttons), `history?`
(default true; false when a host router owns history), `preload?` (default
`true`: once the page is idle, decode every item's board images with
foundation `preloadMedia`, first tile of each item first, so a preloaded
open or switch is ready on the gate's first render; with a `srcSet` it and
the gate fetch the candidate the tile renders, at the tile's `sizes`: give
board media the `sizes` of the board, or none for the default),
`className?`. Keep
`<Dossier>` mounted while closed (preload, Forward after a close). Every
open mounts a fresh layer, so reopening during the exit animation starts
from the new view. Deprecated until 2.0: `open` / `onClose` /
`initialItemId?` / `initialEntryId?` instead of `view` (uncontrolled, no
URLs).
CSS knobs on the host (or via `className`): `--dossier-z` (z-index, default
1000); `--dossier-reserve-bottom` (default `--ev-modal-reserve-bottom`, then
0; ≥ 768 the windowed shell keeps this much extra space below it, for host
chrome pinned bottom-right). Set `--ev-modal-reserve-bottom` once on the host
to cover this and the `process-sequence` step dossier.

## Modal contract

- Renders in place as a fixed layer (inherits the host `--primary`); every
  sibling up the ancestor chain is `inert` while open, page scroll locked
  (foundation `lockScroll`, shared with every other lock; released when the
  exit starts), `useSuspendBackground` pauses the page's loops and clocks; the
  dialog carries `data-ev-modal` so its own loops keep running. Fixed host
  chrome anchored right adds `var(--ev-scroll-lock-gap, 0px)` to its `right`
  so a classic scrollbar's removal doesn't move it; host modals lock through
  foundation too, never their own `overflow` write.
- **Exemption**: elements carrying `data-ev-keep-interactive` are skipped by
  the inert walk (stay clickable; stack them above `--dossier-z`). They are
  outside the Tab trap, so pointer only while open. For host dev/showcase
  tools (the library's floating accent palette); client sites never render it.
- Focus to the close on open (a page loaded on a view URL, before any input:
  to the dialog itself, so no focus ring sits on Close through the read; the
  first Tab reaches the controls, ringed); Tab trapped; a view swap that removes the
  focused control returns focus to the dialog; returning up a level (overview,
  opening screen) focuses the tile you came from; entering an item from the
  opening screen focuses its board.
- **Close**: the page is released as soon as the exit starts (inert, scroll
  lock and suspension lifted, focus back on the launcher through foundation
  `restoreFocus`: a launcher inside a disclosure that closed meanwhile (a
  navbar finder pill) hands it to that disclosure's `aria-controls`
  trigger; the fading layer
  lets clicks through); the content stays on screen through the 340 ms exit;
  the layer is removed on `animationend` or after 700 ms at most.
- **Escape = one level** (detail → overview → opening screen → close),
  handled at document level. Backdrop click = one level. The close button
  closes everything.
- **History** (foundation `useRouteHistory`): the opening screen, the
  overview and the detail each own an entry (URL `hrefFor(view)`); deeper =
  push, sideways (another entry of the item; another item from an overview)
  = replace, up (`Sommaire`, `‹ <opening label>`, Escape, the pager from a
  detail) = Back; browser / OS Back follows the same one-level model;
  closing goes Back past every level, so Back never reopens it, Forward does.
- Live region announces location (`Expérience 2 sur 4 : …`, `Univers 3 sur 3 : …`).
- Host requirement: no `transform` / `filter` / `contain` on an ancestor of
  `<Dossier>` (it would trap the fixed layer), and no ancestor stacking context
  below the site header's z-index. Mount it near the page root if unsure.

## Crawlable views

Binding contract: `docs/CRAWLABLE-MODALS.md` (library repo); client wiring
is its §7. What the package gives:

- **Views**: `DossierView = { item; entry?; opening? } | { opening }`;
  `dossierRoutes.views(config)` lists the opening screen (with
  `config.opening`), then every overview and entry in on-screen order;
  `key` → `choose`, `table`, `table/tasting`; `parse(config, key)` is its
  inverse (unknown keys → null, a pending item's entry keys accepted);
  `parent` of an entry is its overview, of an overview the opening screen
  (item and entry views carry `opening`; `parse` and the dossier add it, a
  host may pass `{ item }` alone). Without an opening: as in 1.7. A feed
  item adds page views `item/page/<n>` (README "Feed").
- **Server HTML** of `<Dossier view={v} … />` (`react-dom/static`
  `prerender`): the modal root with `data-ev-route-layer`, one h1 (the
  header title), the view's full copy (board titles and kickers; the
  entry's chapters), `<a href>` to the parent, children and siblings, no
  `inert` / loader. Desktop layout on the server; a phone swaps after
  hydration.
- **Head data**: `dossierRoutes.head(config, view)` → `{ title, description,
  breadcrumb, image }` (data only). Opening title = `opening.title`;
  overview title = `copy.overviewTitle`; entry title = `<entry title> —
  <item label>` (contains the h1, the entry title); the breadcrumb starts with the opening's
  label when there is one; set `description` on the opening, items and
  entries from their own copy.

Client steps (§7):
1. **Route table**: one route per page and locale with a splat
   (`/carte/*`), so the page and every `hrefFor(view)` render the same page
   component (no remount). Seed `view` once from `viewFromPath(location.pathname,
   base, dossierRoutes, config)`; mount `<Dossier>` open or not; launchers are
   `<a href={hrefFor(v)}>` with `followRouteLink`. Localised slugs: a custom
   `hrefFor` and parser.
2. **Page h1**: on a view URL the dossier's h1 is the page's h1; render the
   page title as h2 while `view !== null`.
3. **Prerender** `[null, ...dossierRoutes.views(config)]` per locale into
   `dist<hrefFor(view)>index.html` with the head (title + site suffix,
   description, canonical, hreflang on the same key, `og:*`, JSON-LD
   `WebPage` + `BreadcrumbList`) and `<noscript><style>{ROUTE_LAYER_NOSCRIPT_CSS}</style></noscript>`.
   List the views in `sitemap.xml` / `llms.txt`.
4. **Verify** as a crawler without JavaScript (contract §7.3): each view URL
   has its title, one h1, the copy, canonical / hreflang, no `inert`. In the
   library: `pnpm verify:ssr dossier`.

### Direct load at rest (`directLoad: "at-rest"`)

Only for the view the document was served on, mounted with the dossier. That
means one of two things:
- the server render, or the render that hydrates that server HTML;
- in a client-rendered page, a dossier mounting on the view whose URL the
  document was loaded at (the navigation entry, not the current location,
  which a router or a launcher may already have moved).

A dossier a client mounts later, on intent, even its first mount from an
in-page launcher, is an in-page open: full entrance, normal scroll lock.

That first view is never held. It renders live and settled from the first
render, server included, so hydration keeps the server DOM. Its entrances
run in zero time and land on their end state: shell (rounded clip),
backdrop, atmosphere, board tiles (the blur convergence), detail, empty
panel, dock count. Its chapters start revealed, with no scroll reveal.
Videos keep their poster until hydration.

Scroll lock:
- Server HTML carries `data-rest-lock` until hydration, so `<html>` has
  `overflow: hidden` from the first paint and no scrollbar exists. At
  hydration the script's lock takes over, so nothing shifts. On such a
  direct load the page under the modal is laid out without a scrollbar.
- A client-rendered mount never carries `data-rest-lock`: foundation's lock
  measures any scrollbar and compensates it, as for an in-page open.

The next view the visitor opens, and every later open, takes the usual gate
and entrance. A first view waiting on live content (a `pending` item's
overview, or an entry not brought yet) keeps the held path.

The images load like any page's, so the client must:
- preload them in the head: `dossierViewMedia(config, view)` lists them in
  order, with `fetchpriority="high"` on the first ones. Media with a
  `srcSet`: use `dossierViewImages(config, view)` (`{ src, srcSet?, sizes? }`,
  same order) and `imagesrcset` / `imagesizes` on the `<link rel="preload">`;
  a bare `href` beside an `<img srcset>` downloads the image twice;
- render the first client view from the same live state as the server, e.g.
  a fetched list seeded from a snapshot in the HTML. A `pending` flag that
  differs at hydration changes the markup.

Measured in Tchin (`/menu/`, Lighthouse mobile, devtools throttling, median
of 3): LCP 4.65 s → 2.45 s, now equal to FCP. The view is identical at first
paint and after hydration.

## Desktop / mobile

- ≥ 1024, panorama: opaque header strip (77px), item pager, chapter strip +
  toast in detail (and on an overview under an opening screen), desktop
  chapters, hover grade on fine pointers.
- ≥ 1024, sheet: the 768–1023 dossier below in the portrait shell (no
  header strip, pager or chapter strip; capsule and dock leave on
  scroll-down); hover grade on fine pointers. Chapters take their desktop
  layouts from the body's width (`@container evd-body`, ≥ 900px), so the
  sheet keeps the tablet's.
- 768–1023 (both): windowed shell; glass capsule + dock; board 2×2 (from 600).
- < 768: full-bleed, square; < 600: four board rows, capsule shows one line
  (the full title stays spoken), media leads every split (intro hero first).
- Touch / no-hover (≤ 1023 or coarse pointer): the board's touch cycle gives
  each tile the focus look for 2000 ms in turn, with a dwell bar.

## Motion and pause model

Dock items, the toast action and the controls (close, pager, plates) squash
and spring back when pressed (foundation's press jelly, RULES §6); board
tiles and strip cells don't.

One full-motion experience, no `prefers-reduced-motion` branch (architecture
skill). Every state is complete without motion: board tiles are reachable by
Tab / tap, every chapter is readable once revealed (reveal is once, on entry).
The touch cycle runs on `useSequenceClock` gated by `useInViewPause`
(`ignoreSuspension`, modal content): it stops off-screen, on a hidden tab and
while a finger is down, and resumes with the remaining dwell. The page behind
is suspended while open.

## Verification

1. `pnpm build`; showcase at 1440, 1024, 390: shell 1272 × 791 and header 77
   at 1440×900; board rows 387 / 258; no horizontal overflow; no text under
   9px (readouts) / 11px (labels) / 13px (body); no rule lines inside the
   detail (only the strip track, the toast stem, loader count and bar).
2. Repeated opens never show an empty body: cold reload → open each universe,
   enter an entry, jump-scroll (End / scrollbar), switch tabs, pager / dock,
   Escape / Back, reopen during the exit animation (must open the clicked
   universe), deep link. Check in a production build (`vite build` +
   `vite preview`), not only the dev server (HMR reloads).
3. Palette: indigo, yellow, off-white — strip underline, tab chip, tile
   border/edge, bars, loader modules, caption dot all readable. Per-item
   accent switch recolours per universe.
4. Keyboard: open → focus on close (a cold view URL: no ring until the
   first Tab); Tab cycles inside; Enter on a tile opens
   the detail (focus moves into it); Escape → overview (tile refocused) →
   closed (launcher refocused).
5. URLs and history: each open / tile / tab / pager / dock step shows the
   view's URL; Back: detail → overview (tile refocused) → closed (page URL);
   Forward reopens level by level; a view URL loaded cold opens that view
   and Back returns to its overview, then the page; Ctrl / Cmd-click on any
   view link opens it in a new tab and leaves the dossier as it was.
   `pnpm verify:ssr dossier` passes.
6. Desktop: scroll a detail to the end → toast under the next tab; pager
   switches items with a dark cut. Phone: capsule + dock leave on scroll-down
   and return on scroll-up; dock next goes through entries then items. One
   item: no pager; the last entry's next returns to the overview.
7. Touch cycle on a phone: 2 s per tile, pauses while touched / tab hidden.
8. Attribution: one linked mark in the header strip, named, new tab.
9. Sheet (desk "Composition", from 1024): shell 711 × 790 at 1440×900 in the
   showcase (`.9 ×` the panorama's height), capsule + dock, 2×2 board, tablet chapters; below 1024
   layout identical to the panorama. Opening screen (menu demo): opening →
   item → entry → Escape ×3 (tile refocused at each level) → closed; Back /
   Forward per level; deep links on `opening/choose/`, `opening/specials/`,
   `opening/specials/amber/`. Specials 0 / 3 / 5: empty panel with a link to
   the menu, odd lead spanning the row, three rows. Panorama with an opening:
   header end on the right, overview strip `‹ Au menu` + items.
10. Live content (a host harness): a pending deep link waits behind the
    loader and opens once the entry arrives; an entry removed while open, or
    never arriving, settles on its overview (URL and host follow); reordered
    entries keep the open one.
11. True colour (desk "Photos"): every `.evd-tile__media` computes `filter:
    none` and transitions `transform` only, at rest, hover (neighbours
    included), keyboard focus and touch-cycle focus; `.evd-tile__grade` is
    not displayed; the scrim stays; the hovered / focused / cycled tile shows
    the accent border, edge and scale. Graded unchanged. Headless Chrome has
    no hover pointer: test hover with
    `--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`
    and without touch emulation.
12. Feed (showcase journal, production preview): 3 / 2 / 1 columns at 1440
    (panorama) / sheet and 768–1023 / 390; scrolling to the end appends a
    batch with no existing tile moving (sample every tile's rect per frame);
    placeholders, then the batch's reveal; `?feed-network=down-from-2`:
    error panel + retry, and `node scripts/feed-fetch-check.mjs <feed board URL>
    [--page-request <regex>]` (any client, or the showcase journal by default:
    it fails page ≥ 2 requests by interception and checks a failed page is
    requested once, never again without a retry); end panel after the last page; a detail opened from a late batch
    and Escape return to the same scroll and refocus the tile; cold
    `journal/page/3/` and `journal/<entry of an unloaded page>/` open, Back
    steps out level by level; `?feed-cap=2`: the older link opens
    `page/3/`; the "N new" control appears ~8 s after opening (not while the
    document is hidden) and taps back to the top. `pnpm verify:ssr dossier`.
