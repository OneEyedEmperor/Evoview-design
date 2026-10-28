# chapter — the Evoview page-section shell

Every Evoview page is a stack of chapters: near-white and near-black
environments with hard cuts, a fixed rhythm, two rails, one heading anatomy
and a footer that carries the Evoview attribution. This package is that
shell, neutral and accent-driven, plus the recurring section types built on
it (since 1.2.0, extracted from the Tchin Tchin client site): `ChapterStory`
(story beside drifting picture lanes), `ChapterFaq`, `ChapterContact`, and
the footer's `panel` layout. Depends on `foundation` and `controls`.

Showcase: `https://evoview-library.said.bet/layouts/chapter` — a specimen
chapter on a dark page with live tone / heading / instrument
(phase chooser, self-running ticker, step tiles in place of the image)
settings; the story chapter (text left / centre / right / above × picture
density); the FAQ chapter (image / side by side / stacked); the contact
chapter (columns / split / band × today / week); then a short page of a
fictional architect (dark → paper → footer, the footer's bar / panel
switch right under it).
Evidence: `docs/extraction/foundations.md` §2–5, A2 / A3 / A9 / A10;
`docs/extraction/tchin-chapter-{story,contact,faq-footer}.md`.

## What is Evoview (protected)

Read `STRATEGY.md`. These choices make a client page recognisably Evoview;
do not restyle them to the client's template:

- **Tone as separation.** Chapters alternate near-white (`light` #EFEFEF,
  `paper` #FFF) and near-black (`dark` #0E0E0E) with a **hard cut**: no rule,
  gradient band, overlap or mid-grey chapter. Two same-tone neighbours change
  rhythm (`compact`) and content, not background.
- **Rhythm.** Only `standard` 80 / 120, `compact` 64 / 96 (same-tone
  continuation), `cinematic` 96–80 / 144–120 (dark entry); heading → content
  48 / 64 (authored, × `--ev-scale`). Never ad-hoc paddings.
- **Rails.** `reading` 70em, `wide` 85em; never a third width.
- **Heading anatomy.** The 20px marker carrying the accent dot, Overused 900
  uppercase title with negative tracking (standard 22.6 → 29.2, feature 28 →
  34.4), Montserrat subtitle at fg/.55 with measure 590 (centered) / 380
  (split), optional support line, unboxed, no reveal. One feature heading per
  page region; one accent word at most.
- **Inline client mark** at 1.1em inside the title (replaces a word). This
  slot belongs to the **client** mark; the Evoview wordmark never goes there.
- **Footer bar** (A10): on the wide rail, client logo left, legal + links
  right, Evoview credit at the end. No rule above it or between its groups
  (RULES §3 overrides the site's measured hairline): the tone cut or the
  chapter rhythm above separates it, spacing separates the credit.

**Client-adaptable:** content, tone order (within the alternation rule),
rhythm per chapter, rail per chapter, accent (`--primary`, or `accent` per
chapter), fonts via `--font-heading/-body/-readout`, brand mark / logo,
legal line and links (`chapter.config.tsx`).

**Accent** = the client's, from host `--primary` / `--primary-foreground`;
drives the marker, ticker dot, the accent word, focus rings and whatever the
chapter's children use as signal. Never backgrounds or body text. Light
accents (yellow, off-white) read through `--chapter-signal` (pulled toward
the tone foreground); state is never carried by colour alone.

## Attribution (approved placement)

The footer bar is the page's natural chassis: `ChapterFooter` renders the one
linked `EvoviewMark` (foundation) after a `SITE` readout, set off the legal
links by a group gap (no rule), `https://evoview.be/` in a new tab with an
accessible name in the page language. Never inside or next to a client CTA
(keep CTAs in chapters, not in the footer). On by default
(`attribution.enabled`); turning it off is the founder's call. If the site
already shows the mark elsewhere (e.g. a navbar package strip), keep exactly
one linked mark per page and say so in the handoff. Chapters themselves carry
no mark. Both footer layouts render the same credit: `bar` at the end of the
row, `panel` centred under the meta row (it replaces the Tchin footer's
unlinked logo image with the linked mark).

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/chapter.config.tsx` | Brand (name, inline mark, footer logo, home href), legal line, footer links, attribution, FR / EN via `buildChapterConfig(locale)` | **yes — the only one** |
| `src/Chapter.tsx` | `Chapter`, `ChapterHeading`, `ChapterMark`, `ChapterTicker`, `chapterNavSections` | no |
| `src/ChapterFooter.tsx` | `ChapterFooter` (bar / panel) | no |
| `src/chapter.css` | `.ev-chapter` token block + heading / ticker / footer bar | no |
| `src/chapter-footer-panel.css` | footer `layout="panel"` | no |
| `src/ChapterFaq.tsx`, `src/chapter-faq.css` | `ChapterFaq`, `chapterFaqJsonLd` (`.ev-chapter-faq`, `--chapter-faq-*`) | no |
| `src/ChapterContact.tsx`, `src/chapter-contact.css` | `ChapterContact` (`.ev-chapter-contact`, `--chapter-contact-*`) | no |
| `src/ChapterStory.tsx`, `src/ChapterStory.css` | `ChapterStory` (`.ev-chapter-story`, `--chapter-story-*`) | no |
| `src/index.ts` | exports, loads the CSS | no |

`showcase.css` is the library page's sheet; not installed.

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/chapter/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `foundation` first, then copies `src/` to
`<client>/src/components/chapter/`; re-runs keep `chapter.config.tsx`.
Host: React 19, Vite, TypeScript strict (foundation's contract).

## API

```tsx
import { Chapter, ChapterHeading, ChapterMark, ChapterTicker, ChapterFooter, buildChapterConfig } from "@/components/chapter";

const config = buildChapterConfig(locale);

<Chapter id="studio" tone="light" rhythm="standard" rail="reading">
  <ChapterHeading
    title={<>The <ChapterMark label={config.brand.name}>{config.brand.mark}</ChapterMark> studio</>}
    subtitle="…"
    support={<ChapterTicker label="Phases" items={["Survey", "Sketch", "Build"]} active={1} />}
  />
  {content}
</Chapter>
<Chapter id="light" tone="dark" rhythm="cinematic" rail="wide">
  <ChapterHeading variant="feature" layout="split" title={<>Light <em>first</em></>} side={<SegmentedControl … />} />
</Chapter>
<ChapterFooter config={config} />
```

| Export | Props |
| --- | --- |
| `Chapter` | `id?`, `tone?: "light" \| "paper" \| "dark"` (light), `rhythm?: "standard" \| "compact" \| "cinematic"` (standard), `rail?: "reading" \| "wide" \| "none"` (reading; `none` = children place themselves, e.g. a track bleeding right with `.ev-track-gutters`), `accent?` (per-chapter `--primary` + auto ink), `navTone?` (true), `as?: "section" \| "article" \| "div"`, native attributes |
| `ChapterHeading` | `title`, `subtitle?`, `support?`, `side?`, `layout?: "centered" \| "split"`, `variant?: "standard" \| "feature"`, `level?: 2 \| 3`, `marker?` (true), `live?` (marker pulse) |
| `ChapterMark` | `label?` (the word it replaces; empty = decorative), `children` (svg / img, currentColor) |
| `ChapterTicker` | `items`, `active?` (0-based; dot + ink + `aria-current`), `label`, `phone?: "hide" \| "show"` (hide) |
| `ChapterFooter` | `config`, `tone?` (light), `layout?: "bar" \| "panel"` (bar) |
| `ChapterFaq` | `config: ChapterFaqConfig`, `layout?: "media" \| "split" \| "stacked"` (media if `config.media`, else split), `id?` ("faq"), `tone?` (dark), `rhythm?`, `defaultOpen?: number \| null` (null), `level?: 2 \| 3` |
| `chapterFaqJsonLd(config)` | FAQPage object from `config.items` (for a `<head>` script when `structuredData` is off) |
| `ChapterContact` | `config: ChapterContactConfig`, `layout?: "columns" \| "split" \| "band"` (columns), `hours?: "today" \| "week"` (today), `id?`, `tone?` (dark), `rhythm?`, `level?: 2 \| 3` (2), `className?` — see [ChapterContact](#chaptercontact) |
| `ChapterStory` | `content: ChapterStoryContent`, `layout?: "start" \| "center" \| "end" \| "above"` (start), `density?: "ample" \| "dense"` (dense), `id?`, `tone?` (dark), `rhythm?`, `accent?`, `headingVariant?` (feature), `level?`, `className?`, `still?` (false: frozen lanes, posters instead of clips) — see [ChapterStory](#chapterstory) |
| `chapterNavSections(chapters, accent)` | `[{ id, accent? }]` → navbar `sections` `[{ id, color }]` |

Rules: one `ChapterHeading` per `Chapter` (it becomes the section's
`aria-labelledby`); `<em>` in a title = the accent word. Split: column on
phones, row `space-between` from 768 (side `flex: 0 0 auto`); the heading
keeps ≥ 380 authored, so a side too wide for the container wraps under it.
Centered: side goes under the support line. Footer links: `onSelect(event)`
runs on click; `event.preventDefault()` keeps an `href` from navigating.

Text lists (RULES §3): `ChapterFaq` rows and the panel's page links sit on
`--ev-surface-list` / `--ev-surface-list-alt` tiles. `ChapterTicker` is one
inline state line (where / state voice, active item marked), not a column of
items. The bar's legal links are navigation, carried by their underline.
Lists that a chapter *hosts* (steps, schedule, facts) are content: put them
on the same tiles or alternating rows, never bare.

## ChapterFaq

Source: Tchin Tchin karaoke "Tout ce que vous devez savoir"
(`docs/extraction/tchin-chapter-faq-footer.md`). A whole chapter: heading
(`ChapterHeading`, no marker), the questions, optional JSON-LD.

```tsx
<ChapterFaq config={buildChapterFaqConfig(locale)} layout="media" tone="dark" />
```

- **Protected (Evoview):** questions on alternating tonal tiles with a small
  gap, no rules, no counting index; single-open accordion; the toggle orb
  (+ at rest, the accent rises as liquid with − on it, `OrbFill`); open row
  = ≤ 10 % accent wash, the answer under the question (Montserrat ≥ 13px,
  fg/.65); pointed row one tonal step up (no sibling dimming); sticky column
  (media or heading) holding still while answers open; phones = media first,
  then `phoneVisible` questions and one "show more" row (mechanism change,
  RULES §7). Layout proportions: media `.62 / 1` (list larger), split
  heading `.72 / 1.28`, stacked centred column ≤ 46em on the reading rail.
- **Client-adaptable:** questions/answers/follow-up links, title and accent
  word, the "another question" link (a text link, never a CTA plate), the
  portrait, `phoneVisible`, layout, tone, `--chapter-faq-sticky-top` (host
  navbar clearance, default 6rem).
- **Crawlable:** every answer is rendered (server too, never `hidden` in
  server HTML) and collapsed by height (`grid-template-rows`, control
  280ms); closed panels are out of the tab order and the accessibility tree.
  Once hydrated, where the browser supports it, closed panels carry
  `hidden="until-found"`: find-in-page reaches a closed answer and opens its
  question (`beforematch`); otherwise `visibility: hidden`. Phone rows behind
  "show more" are `display: none` (not findable until shown).
  `structuredData` emits FAQPage JSON-LD from the same strings, so visible
  and structured answers never drift; one FAQPage per page.
- **A11y / keys:** questions are `h3` (`h4` at `level={3}`) buttons with
  `aria-expanded` / `aria-controls`, answers `role="region"`; Enter / Space
  toggle, ↑ / ↓ / Home / End move between questions; focus ring in the
  accent signal.
- **Attribution:** none (the page's one linked mark lives in the footer).

## Footer panel

`<ChapterFooter config layout="panel" />` (source: the Tchin site footer).
Reads `footer.tagline`, `nav`, `socials`, `contact` (plus `legal`, `links`);
the bar ignores them.

- **Protected:** brand + tagline · page links as alternating tonal tiles
  (current page = surface step + full accent bar; pointed = the bar wipes in
  from the left, ink via `TextFill`) · 44px social orbs (accent fill via
  `OrbFill`), over contact (`<address>`: maps link, `tel:`, `mailto:`) ·
  legal line + links; the Evoview credit centred last, set off by the group
  gap. No rules, no gradient, no decorative icons. One row from 1024; 768–1023
  brand + socials over the tiles; phones: brand + socials, tiles two by two,
  meta centred, tagline dropped.
- **Client-adaptable:** logo, tagline, pages, networks + glyphs, contact,
  legal, tone. Mark the shown page with `current: true` per route.
- Choose **bar** for a one-page site, **panel** for a multi-page site.

## ChapterContact

Source: Tchin Tchin home contact (`docs/extraction/tchin-chapter-contact.md`).
A whole chapter: heading + the one booking action, place, channels, hours.
Files `ChapterContact.tsx`, `chapter-contact.css`; config block `CONTACT`
(`buildChapterContactConfig(locale)`).

```tsx
<ChapterContact config={buildChapterContactConfig(locale)} layout="columns" hours="today" tone="dark" />
```

| Prop | Values |
| --- | --- |
| `layout` | `columns` (the original: centred heading + action over channels `.44` · hours `.56`, the place's picture filling the hours column) · `split` (heading, action, hours `.37` beside the picture 16:10 and channels two across `.63`, from 1024) · `band` (compact closing band: split heading, the five details on one row from 1280, the hours as a head + today row or a seven-day strip) |
| `hours` | `today` (live state line, today's slots on the selection surface, the week folded in `<details>`) · `week` (all seven days laid out: table rows, or day tiles in `band`) |
| `level` | `2` (default) · `3`: section heading level; the hours title is one level below |
| `tone`, `rhythm`, `id`, `className` | as `Chapter` (rail is always `wide`) |

Config (`ChapterContactConfig`): `title` (one `<em>` accent word), `lead?`,
`action? { label, href, external? }`, `place[]` and `channels[]`
(`{ label, value, href?, external? }` — `value` is what the visitor reaches,
never a slogan), `hours { title, timeZone (IANA), services[], week[7][services]
("HH:MM–HH:MM" | null; past-midnight slots allowed), note?, labels }`,
`picture? { src, srcSet?, sizes?, alt, width, height }` (`sizes` defaults per
layout: `columns` `50vw`, `split` `(min-width: 1024px) 50vw, 100vw`; set it
only to override), `newTab`.

- **Protected (Evoview):** one primary action (`PrimaryPlate`, no Evoview
  mark beside it); details and hours as tonal tiles / alternating rows, no
  rules, no decorative icons (↗ stays: it means "leaves the site"); today
  computed live in the business's zone with an open / closed line (accent dot
  + halo when open; text carries the state); today's row marked by a wash, a
  dot, weight and screen-reader text, never colour alone; the week folded but
  in the DOM; opening it is one sequence (the fold grows while the picture
  fades and yields its height, the channel tiles release their stretch);
  phones read where → when → how (place, hours, channels), `split` puts the
  picture first, `columns` drops it, `band` turns the details into one-line
  label | value rows. Whole tile = hit area, value + ↗ take the accent by
  `TextFill`.
- **Client-adaptable:** all copy and destinations, services (lunch / dinner,
  morning / afternoon…), hours, time zone, note, picture, layout, hours view,
  tone.
- **Crawlable / SSR:** everything renders on the server; "today" and the state
  resolve after hydration (`useSyncExternalStore` server snapshot `null`; a
  reserved line and dashes meanwhile), so a prerender built on another day
  never mismatches. The week is a real `<table>` (`th scope`), `aria-current`
  on today. Today and the state come from the venue's wall clock in
  `timeZone` (DST included), whatever the visitor's zone; an unknown zone
  leaves them unresolved instead of throwing.
- **Pause model:** one timeout re-reads the clock just after each minute
  turns, only while the chapter is on screen and the tab visible
  (`useInViewPause`); off-screen or hidden it is cleared, and it re-reads at
  once when the chapter returns. No other motion loop.
- **Attribution:** none (the page's one linked mark lives in the footer).
- Choose **columns** when the place has a photo and the hours matter as much
  as the details, **split** for a place worth showing large, **band** for a
  compact end-of-page block; **week** when hours vary from day to day.

## ChapterStory

Source: Tchin Tchin home "Un Goût du Vietnam au Cœur de Bruxelles"
(`docs/extraction/tchin-chapter-story.md`). The chapter after the hero: the
client's story with lanes of its pictures that drift slowly and travel with
the scroll. A whole chapter (`Chapter` rail `none`, own wide rail); config
block `STORY` (`buildChapterStoryConfig(locale)`).

```tsx
<ChapterStory content={buildChapterStoryConfig(locale)} layout="start" density="dense" tone="dark" />
```

| Prop | Values (desktop ≥ 1024 · below 1024 the lanes turn into sideways rows) |
| --- | --- |
| `layout` | `start` (the original: text `5fr` left, columns `7fr` right) · `end` (mirror; alternate with `start` to pace several stories) · `center` (text on a 30em column between two groups of columns drifting in opposite directions — a page opener; phones: rows above and, when dense, below the text) · `above` (title `.72` beside story `1.28`, the pictures as an edge-to-edge band underneath — landscape photography; phones: text then rows) |
| `density` | `ample` (start/end 2 columns, center 1 + 1, rows 1) · `dense` (3, 2 + 2, rows 2) |
| `tone`, `rhythm`, `id`, `accent`, `level` | as `Chapter` / `ChapterHeading`; `headingVariant` (feature) |

Config (`ChapterStoryConfig`): `title` (one `<em>` accent word; a
`<ChapterMark>` may replace a word), `emblem?` (client mark above the title,
decorative, replaces the heading marker), `story[]` (paragraphs), `quote?
{ text, name, role? }`, `media[]` — `{ kind: "image", src, srcSet?, ratio }`
or `{ kind: "video", src, poster, posterSrcSet?, ratio }` (`ratio` as CSS
`"4 / 5"`). Media are dealt round-robin into the lanes; a short lane borrows
from the lane across before repeating. Give ≥ 9 items (≥ 18 for `center` +
`dense` to avoid the same picture on both sides).

Media files: cut each still and poster to its `ratio` (centre crop) and give
two widths, `400w` and ~2× the widest tile (640–800w; tiles are ≤ 330 px at
1440, ≤ 280 px on phones), webp, as `srcSet` / `posterSrcSet`
(`"a-400.webp 400w, a-800.webp 800w"`, `src` / `poster` = the largest). The
lanes pick one file per picture from the measured tile × device pixel ratio
(capped at 2), so the reveal gate decodes exactly the file the tile shows;
no `sizes`. A poster **is** the clip's first frame (extract it from the clip,
e.g. `ffmpeg -i clip.mp4 -frames:v 1`): any other still jumps when the clip
starts. Clips: short **forward** seamless loops, ≤ ~300 KB, about the poster's
larger width.

- **Protected (Evoview):** the drift is a Web Animation per lane (two-copy
  track, 0 → −50 %, 0.014 px/ms, linear) nudged by the scroll (520 px of
  travel per full pass × lane speed 1 / .65 / 1.3 / .85, directions
  alternate, phases 0 / 160 / 70 / 230) — never a CSS marquee, never
  scroll-jacking; **one clip plays at a time** (the one most in view, derived
  from the track offset), the others hold their poster / last frame; lanes
  rise only once their stills and posters are decoded (media-gated reveal,
  `useMediaReady`); copy rises once in view (y 28 + fade, 600 ms, stagger
  80: emblem, title, story, quote; lanes from 120 ms); media true to colour
  on `--ev-well` wells (surface radius), soft fades at the lane ends, no
  rules, glows, tints or scrims; columns fade out over the chapter's block
  padding (12 % of the window, capped at the compact rhythm), so the copy
  centres against the opaque part and the foot is clear before the next
  tone cut; phones change the mechanism (rows) and put media first (except
  `above`); the quote drops on phones.
- **Client-adaptable:** all copy, emblem / inline mark, media and ratios,
  layout, density, tone, accent.
- **Pause model:** drift, scroll link and clip playback run only while the
  chapter is on screen, the tab visible and no modal suspends the page
  (`useInViewPause`); paused they keep their offset and resume from it. The
  scroll offset is read in a passive scroll listener, the frame callback only
  writes `currentTime`; layout is read in a `ResizeObserver`, never per
  frame; no React render per frame. Stills and posters load within 400 px of
  the viewport; a clip is fetched (once per session, a blob shared by both
  track copies) the first time it is the one to play, its poster holding
  until then. A larger tile (resize, `dense` → `ample`) steps a file up only
  after decoding it; files never step down. No reduced-motion branch; the
  stable state is the paused frame.
- **A11y / SSR:** the heading labels the section, the story and quote are
  real text rendered on the server; the lanes are decorative
  (`aria-hidden`, `alt=""`) — put information pictures elsewhere. Nothing
  focusable inside the lanes.
- **Attribution:** none (the page's one linked mark lives in the footer).

## Navbar package

Each chapter writes `data-nav-tone="dark" | "light"` on its own element; the
navbar re-tones when a dark chapter reaches its pills. Do not put
`data-nav-tone="dark"` on a page wrapper around light chapters (it wins over
them). For the reticle accent, pass
`sections: chapterNavSections([{ id: "studio" }, { id: "light" }, …], clientAccent)`
in the navbar config.

## Desktop / mobile

Scale from `--ev-scale` (13.76px root at 1024–1470, 16px phones); rails and
gutters collapse to one column below 768. Phones: split headings stack (side
full width under the subtitle), the ticker is dropped (secondary object), the
footer stacks centred (logo, legal, links, credit). Hit areas ≥ 44px on
footer links, brand and the mark.

## Motion and pause model

Footer social orbs and the mobile FAQ "more" button take foundation's press
jelly (RULES §6); FAQ question headers and text links don't.

No `prefers-reduced-motion` branch (architecture skill): one full-motion
experience. Chapters and headings are static (no reveal, per the source). The
only loop is the optional `live` marker pulse: it runs only while the chapter
is on-screen, the document visible and no modal suspends the page
(`useInViewPause` → `data-ev-paused`; `html[data-ev-suspended]`). Children
with sequences use foundation's hooks themselves.

## Verification

1. Showcase at 1440 / 1024 / 390: padding 103 / 82.5 / 124–103 (desktop),
   80 / 64 / 96 (phone); titles 29.2 / 34.4 (32.8 at 1024) and 22.6 / 28;
   heading gap 55 / 48; centered subtitle ≈ 507px, split ≈ 327px.
2. Hard cuts only, no rules between or inside chapters / the footer; no
   horizontal overflow; nothing under 9px (readouts), 12px (compact), 13px
   (subtitle). Split heading in a narrow column: side wraps, title intact.
3. Navbar: light over light / paper chapters, dark from the dark chapter's top
   edge, light again at the next light chapter.
4. Palette: default, indigo, yellow, off-white — marker, ticker dot, accent
   word, focus rings follow live; yellow / off-white still show state
   (bar width, ink, dot).
5. Keyboard: Tab reaches side controls, CTA, brand, footer links, Evoview
   mark; focus ring in the accent signal.
6. `live` marker pauses off-screen / hidden tab / `suspendBackground()`.
7. Footer: one linked Evoview mark, correct accessible name per locale, not
   adjacent to a client CTA — in both `bar` and `panel`.
8. FAQ: each layout at 1440 / 1024 / 390 (media first on phones, 4 questions
   + "show more"); one question open at a time; ↑ ↓ Home End; Tab skips
   closed answers; view-source / SSR output holds every answer and the
   FAQPage JSON-LD (once per page); open orb readable with yellow and
   off-white accents on light and dark tones.
9. Panel: tiles / socials / meta at 1440 (one row), 1024 (two rows), 390
   (two-by-two tiles, centred meta); current page marked without colour
   alone (surface + bar + `aria-current`).
10. Contact: each layout × hours view at 1440 / 1024 / 390; with a mocked
    clock (venue zone ≠ visitor zone) the state flips at opening and closing
    minutes and at the venue's midnight; no timer while off-screen or hidden;
    the week toggle opens with Enter / Space and the picture yields; SSR
    output holds every day and slot but no today / state.
11. Story: each layout × density at 1440 / 1024 / 390, lanes risen with
    every tile filled, one animation per track, at most one clip playing;
    column fades end inside the chapter padding (no dark band under them);
    off-screen / hidden tab → animations paused, no clip playing; network:
    one file per picture (the `400w` set at 1440 × 1), clips only once
    played; production preview, no CPU work while off-screen.
12. `pnpm verify:chapter` (library repo): the venue clock at fixed instants
    and the FAQ / contact / footer server HTML (items 8 and 10, the mark of
    item 7) against the reference config.
