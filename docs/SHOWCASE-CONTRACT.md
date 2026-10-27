# Showcase contract (library app ↔ packages)

Owned by the library shell (`src/library/`). Package agents consume it; they do
not edit `src/App.tsx`, `src/library/*` or `CLAUDE.md` (the orchestrator does).

## Routes and files

| Route | Page file (owned by the package agent) | Registry id |
| --- | --- | --- |
| `/layouts/chapter` | `src/pages/library/Chapter.tsx` | `chapter` |
| `/layouts/card-track` | `src/pages/library/CardTrack.tsx` | `card-track` |
| `/layouts/process-sequence` (+ `/*` view URLs) | `src/pages/library/ProcessSequence.tsx` | `process-sequence` |
| `/layouts/story-blocks` | `src/pages/library/StoryBlocks.tsx` | `story-blocks` |
| `/components/reservation` | `src/pages/library/Reservation.tsx` | `reservation` |
| `/components/dossier` (+ `/*` view URLs) | `src/pages/library/Dossier.tsx` | `dossier` |
| `/components/selector-stage` | `src/pages/library/SelectorStage.tsx` | `selector-stage` |
| `/components/controls` | `src/pages/library/Controls.tsx` | `controls` |
| `/navbar` (+ `/navbar/reference/*`, `/navbar/one-page`) | `src/pages/library/Navbar.tsx` | `navbar` |

Each page file default-exports a component. Placeholders exist until the
package agent replaces them.

Shell-owned (not package pages): `/` index (`Home.tsx`); `/layouts`,
`/components` render the index scrolled to that chapter (the pill hrefs);
`/navbar/reference/*` (`NavbarReference.tsx`) and `/navbar/one-page`
(`NavbarOnePage.tsx`) render full-screen without the library chrome;
`/reservation` → `/components/reservation`, `/evoview` → `/navbar/one-page`.
Pages are lazy-loaded inside `LibraryLayout` (library navbar + footer with
the evoview.be attribution); a page must not mount its own `<Navbar>`.

**Deep-linked modal views** (`docs/CRAWLABLE-MODALS.md`). Pages listed in
`DEEP_LINK_PAGES` (`src/library/routing.tsx`) also render on `<page>/*`:
the sub-path is a modal view key. The curtain, the navbar's current page
and the scroll manager treat every sub-path as its page (`pagePath`), so
moving between views never plays the curtain or scrolls. In the page:

```tsx
import { useShowcaseSubpath } from "../../library/routing";
const { base, path } = useShowcaseSubpath();     // "/components/dossier", "table/tasting" | ""
const hrefFor = useMemo(() => routeHrefs(base, dossierRoutes.key), [base]);
const [view, setView] = useState(() => (path ? dossierRoutes.parse(config, path) : null));
<Dossier config={config} view={view} onNavigate={setView} hrefFor={hrefFor} />
```

Seed the view from `path` once; the modal's `useRouteHistory` keeps the URL
in step (its `pushState` bypasses the router, Back / Forward reach both).
Launchers are links to `hrefFor(view)` with `followRouteLink`. Call
`useShowcaseViewOpen(view !== null)` (from `ShowcasePage`) where the view
state lives: while a view is open the page title renders as an `h2` with
the same class, so the view's `h1` is the only one (contract §4). A new
deep-link page: add it to `DEEP_LINK_PAGES` and give its route `/*` in
`App.tsx`.

Registry (`src/library/registry.ts`): `{ id, category, route, title, meta,
status: "ready" | "building", version? }`. `version` is read from
`components/<id>/VERSION` (glob, so new packages appear automatically);
`status` is set by hand in the registry when a showcase goes live.

## `ShowcasePage` (`src/library/ShowcasePage.tsx`)

```tsx
import ShowcasePage from "../../library/ShowcasePage";

<ShowcasePage
  entryId="selector-stage"                  // registry id → version, status
  title={(l) => <>Selector <em>Stage</em></>} // em = accent word
  tone="dark"                               // page environment: "dark" | "light"
  defaultAccent="#818cf8"                   // optional
  palette                                   // default true; false for non-colourable pages
>
  {({ locale, accent, ink }) => <SelectorStage config={buildSelectorStageConfig(locale)} />}
</ShowcasePage>
```

Title: the registry title (no article), accent word in `<em>`; a one-word
title is the accent word. `tone` defaults to `"dark"`. `children` is either a node or a render
function; omit it for the "in construction" state. Prefer a child component
that reads `useLibraryLocale()` over the render function when the component
is expensive: a node child is not re-rendered on colour change.
Default accent: `defaultAccent` ?? near-white (dark tone) / near-ink (light).

Every library page opens on the index hero (`LibraryHero`, `src/library/LibraryHero.tsx`):
the Evoview lockup over the method reel, rendered by `ShowcasePage` above its
header (lockup links to `/`; LIBRARY takes the picked accent, Evoview indigo
while on the page default). The index renders it with its h1, bars and palette.

Page changes inside `LibraryLayout` play the page curtain (`src/library/PageCurtain.tsx`,
wired in `App.tsx`): a night panel rises from the bottom (cover), then drops back down (reveal); between a `/layouts/*` and a `/components/*` page it is always one right-to-left swipe instead (in from the right, out to the left). Navbar and title-strip navigation play the same curtain; the strip has no transition of its own. Over everything below
`.lib-hero` (top follows the hero's bottom, 0 once scrolled past), routes render
the lagged location until it covers. The hero must read as shared: after its
first reveal, remounts start revealed (no card rise, shine or eye draw) and the
reel resumes on a shared clock. `lazyPage` renders preloaded modules directly so
the swap never flashes the Suspense fallback. Reduced motion, iframes and the
full-screen navbar demos swap instantly.

The frame renders the hero (palette slot left empty off the index) and the
header (`.lib-deck`, no band colour or shell of its own, on the strip's
"La méthode" stage grade; glass in a flat neutral tint, no gradient,
accent only in the white section bars' faint glow and the keys' liquid hover
fill): one module centred on the sections' rail, inset on each side
(`clamp(0px, 4vw − 16px, 48px)`, none on phones) and at most 980 px wide,
so each half keeps a picture's proportions (≈ 16:10 at 1440).
One shell (one radius, one surface, parts told apart by tone, no rule)
holds two equal parts side by side from 768, stacked below: the player
(the shown page's photograph, `src/library/art.tsx`, `public/library/art/
<id>-640|1280.webp` via srcset, warmed on idle, under a dark veil;
placeholders for the four layouts, also used for their list thumbnails
(`-192.webp`) and index cards; otherwise its glyph, `EntryIcon`, on an
accent bloom) and the page
list (every page of one category, always shown, in registry order:
thumbnail, title, meta line, bare number orb, this page's orb white; the
rows set the shell's height; two columns on small tablets, a sideways snap
strip scrolled to this page on phones). One glass pill straddles the
shell's lower edge, centred, its two equal halves meeting on the parts'
seam: the title over the player (h1, one line, over the category label,
linking to its index chapter, beside the section bars as the position
track, the shown page lit; a category of one keeps only the title and
label; no step keys, the list is the navigation) and the list's
Layouts | Composants switch over the list (white
plate slides to the listed category; it opens on the page's own, layouts
for the navbar). On phones the halves stack inside the one pill.
Linking: pointing at (hover / focus) a row previews that page on the
player, glyph, title, category and lit bar, by the channel switch
(RULES §6); the previewed row takes the accent orb fill. Pointing away returns after 140 ms; the h1 keeps this
page's title throughout (visually hidden while a preview shows). The
category switch retunes the list by the same switch. No controls float
outside the pill. No version, no intro sentence, no breadcrumb. The version sits small
over the top-left corner of the first captioned `ShowcaseVariant`; a page
whose demos are all `caption="none"` shows none. The accent picker is
the floating capsule bottom-right (`FloatingPalette`), always shown except
over the footer. It wraps children in an element that sets `--primary`,
`--primary-foreground` (contrast ink), `--foreground`, `--muted-foreground`,
`--font-heading`. The pick is shared across pages for the visit
(`src/library/accentChoice.tsx`, matched by colour, custom swatch when a page
lacks it). Clicking a swatch recolours the live component instantly
(CSS variables only — never remount on colour change). Locale comes from
`useLibraryLocale()` (`src/library/locale.tsx`), shared with the navbar.

Components read the host accent via `var(--primary)` / `var(--primary-foreground)`
mapped in their own token block, exactly like `components/reservation`.

### Variants and rhythm (`ShowcaseVariant`)

```tsx
import ShowcasePage, { ShowcaseVariant } from "../../library/ShowcasePage";

<ShowcaseVariant
  name="SelectorStage · paper"                  // component (· variant), set as a readout
  when={t({ fr: "…", en: "…" })}                // one sentence: when a client chooses it
  tone="paper"                                  // environment of the component below; omit on frame tone
  rhythm="standard"                             // top padding the component brings: flush | standard | compact | cinematic
  index={{ current: 2, total: 4 }}              // only when it indexes something real
  caption="readout"                             // "title": heading + lead stacked; "none": no caption, name/when omitted (chapter specimen)
>
  <CompareToggle … tone="paper" />
</ShowcaseVariant>
```

The frame owns all spacing between header and demos; pages add no outer
padding, strips or rules of their own.

- Header → first content and caption → component: `--lib-lead` (heading
  band, 48 / 64 authored, in `--lib-rem`, never `em`). The frame measures
  the component's first ink (layout boxes, re-measured on resize, media
  load and DOM change) and pulls the body into its own top padding, so
  this holds whatever padding the package brings; `rhythm` is only the
  pre-measure guess. A component opening on another ground (its own tone
  cut) is not pulled: the caption sits one lead above the cut.
- Between variants: a tone cut gets a chapter band (`--lib-chapter`, 80 /
  120) above the next caption; at least one chapter band always follows a
  variant's last ink (measured), so a same-tone continuation starts right
  after it.
- `tone` must match the component root's tone (the caption band takes the
  same foundation background); a component that switches tones internally
  is wrapped without `tone`.
- A page with one demo uses no `ShowcaseVariant` (the header already says
  what it is).

`data-lib-ready` is set on the frame once fonts are loaded and the stage's
eager images have settled (≤ 10 s); tooling waits for it (`scripts/covers/`).
Route chunks are retried once and preloaded on idle; a page that still fails
shows a retry state inside the layout, never a blank app.

- **Floating palette**: same state, glass capsule bottom-right (phone: an orb
  that unfolds), shown once the hero palette reaches the navbar band (the
  hero palette fades there instead of showing through the bar's glass)
  and, from 768 px, while a modal suspends the page. On a phone it hides
  while a modal is open (the modal owns the screen, its dock and CTA) and
  while the navbar's mobile menu is open. It carries
  `data-ev-keep-interactive`, which modal packages skip when applying
  `inert` (documented in `dossier` / `process-sequence` READMEs); pointer
  only while a modal is open. It steps aside while the library footer is
  in view. From 768 px the frame sets `--ev-modal-reserve-bottom` (its
  footprint) for modal packages to keep free under their window.
- **Nav tone**: the frame marks only its header (and bottom spacer) dark; the
  stage is marked dark only while its content declares no tone. A dark
  `ShowcaseVariant` without `tone` is marked itself (only its caption when
  the component holds light grounds). Content tone
  = `data-nav-tone` or foundation `ev-tone-*` on outermost section roots
  (dark roots without `data-nav-tone` are bridged automatically). Nested tone
  elements (cards, modals) are ignored.
- **Text accent on light frames** goes through `--lib-signal` (62 % accent
  toward ink, as foundation's `--ev-accent-signal`).
- **Covers** (`covers.tsx`): screenshot crops in `public/library/covers/
  <id>-banner.webp` (900×216, navbar trays, passed as URLs) and
  `<id>-card.webp` (index wells, graded at rest: 1280×800 for 7-column
  entries, 1280×1135 for the 2nd/3rd of a category, whose well shares the
  row height); the SVG drawing is the fallback after one retry. Regenerate
  with `scripts/covers/shoot.sh [id…]` then `scripts/covers/crop.sh`, which
  also stamps `covers.rev.ts` (cache key). Banners carry the tray title on
  top: crop imagery or structure, not display type.
