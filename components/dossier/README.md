# dossier — Evoview portal modal

The Evoview portal — *isolate, demonstrate, explain* — as a neutral chassis
for any multi-part offering (services, projects, menus, rooms…). A header
strip with location and a reliable return, an asymmetric 4-tile selection
board, a reading body of open chapters, a chapter strip whose underline is the
reading progress, a glass dock on phones, an honest media loader. Extracted
from the service dossiers of evoview.be (`docs/extraction/service-dossiers.md`
A1/A2/A11, `portfolio-contact.md` A3) and decoupled. Depends on `foundation`
and `controls`.

Showcase: `https://evoview-library.said.bet/components/dossier` (Maison
Ardoise, a fictional restaurant, in the two configurations a client chooses
between: three universes behind a pager with a deep link and the
per-universe accent switch, and a single-universe dossier launched from a
light page; FR/EN, live palette). Every view has a URL:
`/components/dossier/<key>/` addresses the three-universe dossier
(`table/tasting`), `/components/dossier/single/<key>/` the single one.

```
desktop ≥ 1024 (shell 92.5em × min(57.5em, 100vh − 2em), radius shell)
┌ CLIENT │ KICKER / TITLE        (‹) LABEL ▬▭▭ (›)        EVOVIEW │ [× FERMER] ┐ 77
├ ‹ SOMMAIRE │ 01 Tab ▔▔▔ │ 02 Tab │ 03 Tab │ 04 Tab ─────────────────────────┤ 58 (detail)
│ overview: 7/5 over 4/8 board (rows 1.2 / .8)  ·  detail: open chapters      │
└──────────────────────────────────────────────────────────────────────────────┘
phone: [glass capsule: CLIENT │ TITLE · EVOVIEW (×)] … body … [‹ | 01 / 04 ▬ | SUIVANT ›]
```

## What is Evoview (protected)

Read `STRATEGY.md`. These make the dossier recognisably Evoview; do not
restyle them to the client's UI kit:

- **Header strip (chassis signature)**: client identity · kicker / title
  readout (Satoshi 700 uppercase, kicker accent-mixed) · item pager (glass
  orbs, label, location bars; only with two or more items) · the Evoview
  mark · labelled glass close. Grouped by space, no divider rules.
- **Selection board**: exactly four tiles, 7/5 over 4/8 on 12 columns, rows
  1.2fr / .8fr; 2×2 at 600–1023; four rows on phones. Graded media
  (desaturated, darkened) releasing colour on hover / focus / touch-cycle
  focus, accent border + bottom edge + numeral, shine sweep, scrim, title
  bottom-left. Numerals in the display face (not Gaegu).
- **Chapter strip**: `Sommaire` + numbered tabs; the per-tab 3px track is the
  strip's one line and its fill is the reading progress (past tabs full);
  completion toast at ≥ 90 % under the tab it opens, with a 12px accent stem.
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
  and tiles, 0 for joined rows). Lists with media per item are exempt.
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

**Accent = the client's.** The dossier reads the host `--primary` /
`--primary-foreground`; an item may set its own (`item.accent`), applied as
`--primary` on the dossier while that item is shown. It drives: strip
underline and tab chip, tile border / edge / numeral / kicker, pager and dock
bars, dock location tint, capsule / orb / close glass tints, loader modules and
bar, caption dot, row indices, payoff accent line and bloom, toast hairline.
Never backgrounds, body text or the CTA at rest (white plate). Light accents
(yellow, off-white) stay legible through `--ev-accent-signal`.

**Client-adaptable** (config only): brand (logo node or name), kicker, items
(label, accent), entries (title, short label, kicker, media, detail chapters),
all copy, attribution label. Chapters are free composition inside
`DossierChapter`.

## Attribution (approved placement)

One linked `EvoviewMark` in the header strip, right side, before the close
(`attribution.href` = `https://evoview.be/`, new tab, `rel="noopener"`,
accessible name in the page language naming Evoview and the new tab). Never
inside or next to the client's CTA (the payoff plate lives in the body). On
by default (`attribution.enabled`); turning it off is the founder's call. No
other marks.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/dossier.config.tsx` | Brand, kicker, items, entries + detail chapters, copy FR/EN, attribution | **yes — the only one** |
| `src/Dossier.tsx` | Modal, header strip, pager, chapter strip, toast, dock, history, focus, gate | no |
| `src/routes.ts` | `dossierRoutes` (views, keys, parents, head data), `DossierView` | no |
| `src/Board.tsx` | `SelectionBoard` (mosaic, grade, touch cycle) | no |
| `src/Loader.tsx` | `DossierLoader` | no |
| `src/Chapters.tsx` | `DossierChapter`, `ChapterHead`, `ChapterFigure`, `ChapterSplit`, `ChapterRows`, `ChapterSpecimen`, `ChapterPayoff` | no |
| `src/types.ts`, `src/hooks.ts`, `src/index.ts`, `src/dossier.css` | Types, media helpers, exports, styles (`.ev-dossier`, `evd-*`) | no |

`showcase.css` is the library page's sheet; not installed. Placeholder media:
`public/library/dossier/*.webp` (library only).

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/dossier/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `controls` and `foundation` first, then copies `src/` to
`<client>/src/components/dossier/`; re-runs keep `dossier.config.tsx`.

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
  brand: { name: string; logo?: ReactNode };      // logo ≈ 18px tall, currentColor
  kicker: string;                                  // overview kicker
  items: {
    id: string; label: string;
    accent?: string; accentInk?: string;           // per-item accent; omit to follow the host
    description?: string;                          // overview meta description (default: label + entry titles)
    entries: {                                     // exactly 4 (the board)
      id: string; title: string; label?: string; kicker?: string;
      media: { src; type?: "image" | "video"; poster?; srcSet?; sizes?; position?; fit?; alt? };  // alt: head image only
      sources?: MediaSource[];                     // further detail media to decode first
      description?: string;                        // entry meta description, from its own copy
      content: (ctx: { item, entry, index, total, close, toOverview }) => ReactNode;
    }[];
  }[];
  attribution: { enabled: boolean; href: string; label: string };
  copy: DossierCopy;                               // dossierCopy(locale) gives the FR/EN defaults
};
```

Ids (items, entries) are URL slugs: `[a-z0-9-]`.

`<Dossier>` props: `config`, `view` (`DossierView | null`, null = closed),
`onNavigate(view | null)` (every navigation the dossier asks for and every
Back / Forward; set `view` to it), `hrefFor?(view | null)` (URL of a view,
null = the page; without it no URLs and controls stay buttons), `history?`
(default true; false when a host router owns history), `preload?` (default
`true`: once the page is idle, decode every item's board images with
foundation `preloadMedia`, first tile of each item first, so a preloaded
open or switch is ready on the gate's first render), `className?`. Keep
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
  sibling up the ancestor chain is `inert` while open, page scroll locked,
  `useSuspendBackground` pauses the page's loops and clocks; the dialog carries
  `data-ev-modal` so its own loops keep running.
- **Exemption**: elements carrying `data-ev-keep-interactive` are skipped by
  the inert walk (stay clickable; stack them above `--dossier-z`). They are
  outside the Tab trap, so pointer only while open. For host dev/showcase
  tools (the library's floating accent palette); client sites never render it.
- Focus to the close on open; Tab trapped; a view swap that removes the
  focused control returns focus to the dialog; returning to the overview
  focuses the tile you came from.
- **Close**: the page is released as soon as the exit starts (inert, scroll
  lock and suspension lifted, focus back on the launcher, the fading layer
  lets clicks through); the content stays on screen through the 340 ms exit;
  the layer is removed on `animationend` or after 700 ms at most.
- **Escape = one level** (detail → overview → close), handled at document
  level. Backdrop click = one level. The close button closes everything.
- **History** (foundation `useRouteHistory`): the overview and the detail
  each own an entry (URL `hrefFor(view)`); deeper = push, sideways (another
  entry of the item; another item from an overview) = replace, up
  (`Sommaire`, Escape, the pager from a detail) = Back; browser / OS Back
  follows the same one-level model; closing goes Back past every level, so
  Back never reopens it, Forward does.
- Live region announces location (`Expérience 2 sur 4 : …`, `Univers 3 sur 3 : …`).
- Host requirement: no `transform` / `filter` / `contain` on an ancestor of
  `<Dossier>` (it would trap the fixed layer), and no ancestor stacking context
  below the site header's z-index. Mount it near the page root if unsure.

## Crawlable views

Binding contract: `docs/CRAWLABLE-MODALS.md` (library repo); client wiring
is its §7. What the package gives:

- **Views**: `DossierView = { item; entry? }`; `dossierRoutes.views(config)`
  lists every overview and entry in on-screen order, `key` → `table`,
  `table/tasting`, `parse(config, key)` is its inverse, `parent` of an entry
  is its overview.
- **Server HTML** of `<Dossier view={v} … />` (`react-dom/static`
  `prerender`): the modal root with `data-ev-route-layer`, one h1 (the
  header title), the view's full copy (board titles and kickers; the
  entry's chapters), `<a href>` to the parent, children and siblings, no
  `inert` / loader. Desktop layout on the server; a phone swaps after
  hydration.
- **Head data**: `dossierRoutes.head(config, view)` → `{ title, description,
  breadcrumb, image }` (data only). Overview title = `copy.overviewTitle`;
  entry title = `<entry title> — <item label>` (contains the h1); set
  `description` on items / entries from their own copy.

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

## Desktop / mobile

- ≥ 1024: opaque header strip (77px), item pager, chapter strip + toast in
  detail, hover grade on fine pointers.
- 768–1023: windowed shell; glass capsule + dock; board 2×2 (from 600).
- < 768: full-bleed, square; < 600: four board rows, capsule shows one line
  (the full title stays spoken), media leads every split (intro hero first).
- Touch / no-hover (≤ 1023 or coarse pointer): the board's touch cycle gives
  each tile the focus look for 2000 ms in turn, with a dwell bar.

## Motion and pause model

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
4. Keyboard: open → focus on close; Tab cycles inside; Enter on a tile opens
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
