# chapter — the Evoview page-section shell

Every Evoview page is a stack of chapters: near-white and near-black
environments with hard cuts, a fixed rhythm, two rails, one heading anatomy
and a footer bar that carries the Evoview attribution. This package is that
shell, neutral and accent-driven. Depends on `foundation`.

Showcase: `https://evoview-library.said.bet/layouts/chapter` (a fictional
architect's page: light → light compact → dark cinematic → paper → footer).
Evidence: `docs/extraction/foundations.md` §2–5, A2 / A3 / A9 / A10.

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
- **Footer bar** (A10): hairline on the wide rail, client logo left, legal +
  links right, Evoview credit at the end.

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
linked `EvoviewMark` (foundation) after a `SITE` readout, separated from the
legal links by a hairline, `https://evoview.be/` in a new tab with an
accessible name in the page language. Never inside or next to a client CTA
(keep CTAs in chapters, not in the footer). On by default
(`attribution.enabled`); turning it off is the founder's call. If the site
already shows the mark elsewhere (e.g. a navbar package strip), keep exactly
one linked mark per page and say so in the handoff. Chapters themselves carry
no mark.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/chapter.config.tsx` | Brand (name, inline mark, footer logo, home href), legal line, footer links, attribution, FR / EN via `buildChapterConfig(locale)` | **yes — the only one** |
| `src/Chapter.tsx` | `Chapter`, `ChapterHeading`, `ChapterMark`, `ChapterTicker`, `chapterNavSections` | no |
| `src/ChapterFooter.tsx` | `ChapterFooter` | no |
| `src/chapter.css` | `.ev-chapter` token block + heading / ticker / footer | no |
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
| `ChapterFooter` | `config`, `tone?` (light) |
| `chapterNavSections(chapters, accent)` | `[{ id, accent? }]` → navbar `sections` `[{ id, color }]` |

Rules: one `ChapterHeading` per `Chapter` (it becomes the section's
`aria-labelledby`); `<em>` in a title = the accent word. Split: column on
phones, row `space-between` from 768 (side `flex: 0 0 auto`). Centered: side
goes under the support line.

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
2. Hard cuts only; no horizontal overflow; nothing under 9px (readouts),
   12px (compact), 13px (subtitle).
3. Navbar: light over light / paper chapters, dark from the dark chapter's top
   edge, light again at the next light chapter.
4. Palette: default, indigo, yellow, off-white — marker, ticker dot, accent
   word, focus rings follow live; yellow / off-white still show state
   (bar width, ink, dot).
5. Keyboard: Tab reaches side controls, CTA, brand, footer links, Evoview
   mark; focus ring in the accent signal.
6. `live` marker pauses off-screen / hidden tab / `suspendBackground()`.
7. Footer: one linked Evoview mark, correct accessible name per locale, not
   adjacent to a client CTA.
