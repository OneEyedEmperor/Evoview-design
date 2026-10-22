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
Ardoise, a fictional restaurant: 3 universes × 4 experiences, FR/EN, live
palette, per-universe accent switch, loader specimen).

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

- **Header strip (chassis signature)**: client identity │ kicker / title
  readout (Satoshi 700 uppercase, kicker accent-mixed) · item pager (glass
  orbs, label, location bars) · the Evoview mark · labelled glass close.
- **Selection board**: exactly four tiles, 7/5 over 4/8 on 12 columns, rows
  1.2fr / .8fr; 2×2 at 600–1023; four rows on phones. Graded media
  (desaturated, darkened) releasing colour on hover / focus / touch-cycle
  focus, accent border + bottom edge + numeral, shine sweep, scrim, title
  bottom-left. Numerals in the display face (not Gaegu).
- **Chapter strip**: `Sommaire` + numbered tabs, active underline = reading
  progress, past tabs full, completion toast at ≥ 90 % pointing at the next tab.
- **Phone chrome**: floating glass capsule + 3-column glass dock
  (`prev/home · 01 / 04 + bars · next`), both leaving on scroll-down and
  returning on scroll-up, near the top or on focus; spring press + touch bloom.
- **Open chapters**: unboxed, separated by spacing + 1px rule + alternating
  `#0c0c0d / #101011`; claim → artefact → one sentence; `.72 / 1.28` heading /
  copy, `.7 / 1.3` side / stage, `1.2 / .8` payoff; captions inside media;
  one display level per chapter; one exit CTA per story.
- **Media gate**: a view is revealed only once its media is decoded; loader
  after 350 ms, count `02 / 04`, one module per medium, 1px accent bar, retry.
- **Modal contract**: below.
- **Motion**: open = opacity + scale .965 + clip inset, 620 ms cinematic;
  close 340 ms; board tiles converge (±34px, blur 5 → 0) staggered 100 ms;
  detail enters y 10 → 0; chapters reveal y 16 → 0 once, stagger 80; item
  switch = 260 ms dark cut. Not the CRT power-on, channel OSD or scan grid
  (Evoview's own art direction).

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
import { Dossier, buildDossierConfig } from "@/components/dossier";
const [open, setOpen] = useState<string | null>(null);
<button onClick={() => setOpen("table")}>…</button>
<Dossier config={buildDossierConfig(locale)} open={open !== null} onClose={() => setOpen(null)} initialItemId={open ?? undefined} />
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
    entries: {                                     // exactly 4 (the board)
      id: string; title: string; label?: string; kicker?: string;
      media: { src; type?: "image" | "video"; poster?; srcSet?; sizes?; position?; fit? };
      sources?: MediaSource[];                     // further detail media to decode first
      content: (ctx: { item, entry, index, total, close, toOverview }) => ReactNode;
    }[];
  }[];
  attribution: { enabled: boolean; href: string; label: string };
  copy: DossierCopy;                               // dossierCopy(locale) gives the FR/EN defaults
};
```

`<Dossier>` props: `config`, `open`, `onClose` (every close path calls it; set
`open` false), `initialItemId?`, `initialEntryId?` (deep link), `className?`.
`--dossier-z` sets the layer's z-index (default 1000).

## Modal contract

- Renders in place as a fixed layer (inherits the host `--primary`); every
  sibling up the ancestor chain is `inert` while open, page scroll locked,
  `useSuspendBackground` pauses the page's loops and clocks; the dialog carries
  `data-ev-modal` so its own loops keep running.
- **Exemption**: elements carrying `data-ev-keep-interactive` are skipped by
  the inert walk (stay clickable; stack them above `--dossier-z`). They are
  outside the Tab trap, so pointer only while open. For host dev/showcase
  tools (the library's floating accent palette); client sites never render it.
- Focus to the close on open; Tab trapped; focus restored to the launcher on
  close; a view swap that removes the focused control returns focus to the
  dialog; returning to the overview focuses the tile you came from.
- **Escape = one level** (detail → overview → close), handled at document
  level. Backdrop click = one level. The close button closes everything.
- **History**: the overview and the detail each own an entry; browser / OS
  Back follows the same one-level model; closing removes the entries.
- Live region announces location (`Expérience 2 sur 4 : …`, `Univers 3 sur 3 : …`).
- Host requirement: no `transform` / `filter` / `contain` on an ancestor of
  `<Dossier>` (it would trap the fixed layer), and no ancestor stacking context
  below the site header's z-index. Mount it near the page root if unsure.

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
   9px (readouts) / 11px (labels) / 13px (body).
2. Palette: indigo, yellow, off-white — strip underline, tab chip, tile
   border/edge, bars, loader modules, caption dot all readable. Per-item
   accent switch recolours per universe.
3. Keyboard: open → focus on close; Tab cycles inside; Enter on a tile opens
   the detail (focus moves into it); Escape → overview (tile refocused) →
   closed (launcher refocused).
4. Back button: detail → overview → closed; URL unchanged; deep link opens
   on the detail and Back returns to its overview.
5. Desktop: scroll a detail to the end → toast to the next tab; pager switches
   items with a dark cut. Phone: capsule + dock leave on scroll-down and
   return on scroll-up; dock next goes through entries then items.
6. Touch cycle on a phone: 2 s per tile, pauses while touched / tab hidden.
7. Attribution: one linked mark in the header strip, named, new tab.
