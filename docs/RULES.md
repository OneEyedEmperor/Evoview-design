# Evoview library — canonical build rules

Binding for every component in `components/`. Synthesised from the four
extractions in `docs/extraction/` (measured on evoview.said.bet, 2026-10-22),
read through `/root/.vibehub/projects/evoview/skills/evoview-architecture/SKILL.md`.
Where this file and an extraction disagree, this file wins; the extractions
remain the evidence and the source of exact values.
`EVOVIEW-VISUAL-GRAMMAR.md` on the site is historical — do not cite it.

## 0. Decisions that resolve extraction conflicts

| Topic | Decision |
| --- | --- |
| Scale | Never touch the host root font-size. Every new package's root class sets `font-size: calc(16px * var(--ev-scale))` and authors structure (radius, spacing, rails, display type) in `em`. `--ev-scale`: `1` below 768, `.86` from 768, `clamp(.86, 100vw / 1710px, .9123)` from 1024 (reproduces the rendered Evoview proportions). Defined once in `foundation`. |
| Legibility floors | Small roles do **not** scale below floors: body ≥ 13px, compact/labels ≥ 11px, readouts/indices ≥ 9px (author as `max(<em>, <px floor>)`). Never ship the site's 6.9 / 7.7 / 11.2px renders. |
| Reduced motion | Follow the architecture skill: one full-motion experience, no `prefers-reduced-motion` branch in new packages. Instead every sequence has a complete stable state (final frame / poster / every step reachable by click) and obeys the pause model (§6). Document this in each README. `navbar` and `reservation` keep their existing handling. |
| Accent family | One accent per component instance, from the host: `--primary` → `--<name>-accent`, `--primary-foreground` → `--<name>-accent-ink`, derived `--<name>-accent-deep: color-mix(in oklab, accent 62%, #000)` for glows/blooms. No second hue. |
| Modal split | Asymmetric at every width (5/12 : 7/12 or .7/1.3). Do not copy the method modal's 50/50 at 1280–1535. |
| Mobile media order | Media first, then copy (do not copy the partner case hero's copy-first phone order). |
| Primary button voice | Montserrat 700, 14px, sentence case (flow/reservation voice). |
| Unmounted site code | `ShowcaseCard`, `MediaCreationCarousel`, `PixelGridBackground`, `AnimateIn` are not precedent. |

## 1. Type (three voices)

| Voice | Family | Use |
| --- | --- | --- |
| What it is | Overused Grotesk 900, UPPERCASE, tracking −.015 → −.035em, LH .85–1.1 | display, titles, headings, card titles |
| Why / how | Montserrat 400 (lead 500–600), sentence case, LH 1.55–1.6 | body, lead, captions, option labels |
| Where / state | Satoshi 700, UPPERCASE, tracking +.12 → +.20em, tabular | indices `01`, `01 / 04`, status, counters, kickers inside captions |

Labels/controls: Overused 700 UPPERCASE +.05 → +.25em. Questions to the visitor
are sentence case; brand statements are uppercase.

Scale at 390 → 1440 (rendered): immersive display 33.6 → 57.8 · overlay title
33.6 → 46.8 · overlay heading 28 → 39.9 · section title feature 28 → 34.4 ·
section title 22.6 → 29.2 · card title 17.6 → 22 · lead 16 → 15.5 · body 16 →
13.8 (floor 13). One display level per scene; display:body ≈ 4:1 desktop.
Fonts are already loaded in `index.html` (Overused Grotesk, Montserrat,
Satoshi). Gaegu, Bebas, Montserrat-115 display are Evoview art direction —
not for neutral packages.

## 2. Radius by role (authored em @16; × scale)

`shell 1.5em (24)` › `surface / media well / selectable card 1em (16)` ›
`control / command .75em (12)` › `tag .5em (8)` › `badge .25em (4)` › `round`.
Child ≤ parent; inner = outer − padding (concentric frames). Mobile shells are
full-bleed with 0 radius. Joined desktop selector rows are 0. Ribbons and tabs
stay **square where they meet media** (signature). Pills only for choosable
tokens and status, never for containers of copy. Commands are rectangular 12.

## 3. Space, rails, rhythm

- Rails: reading `70em` (1120), wide `85em` (1360), gutters 20 / 32 / 48 / 64
  authored. Tracks start on the wide rail and bleed right.
- Three bands that must stay distinct: internal ≈ 8, neighbour ≈ 20, chapter ≈
  100 (rendered desktop). Separation order: spacing → hairline (1px white/.08 or
  ink/.10) → tone shift → bordered module. Prefer the earliest that works.
- Chapter rhythm (authored, mobile / desktop): standard 80 / 120, compact 64 /
  96 (same-tone continuation), cinematic 96–80 / 144–120 (dark entry). Heading
  → content 48 / 64.
- Tone: near-white (`#EFEFEF`, paper `#fff`) and near-black (`#0c0c0d`,
  `#101011`, `#0e0e0e`) chapters, hard cuts, no mid-grey, no gradient bands.

## 4. Proportions

Asymmetric by default; equal columns only for true peers.
Heading/copy `.72 / 1.28` · selector/stage `.7 / 1.3` · atlas `1.22 / .78` ·
payoff text/CTA `1.2 / .8` · proof grid 7/5 ↔ 5/7 on 12 cols · question/side
`1 / .62` · title/instrument `.37 / .63` · stage/sheet `5/12 : 7/12`.
The larger side holds the proof (media/stage), except payoffs where the
statement is the proof.
Media ratios: hero 16:10 → 4:5 phone · stage 4:3 · card media ≥ 60–70 % of the
card · portrait cards .90 → .70 phone · panorama 2.2:1 · step media 2.15:1 →
1.79:1. Choose the ratio from the artefact.

## 5. Colour roles

Environment (tone) · Object (surfaces: `#080808` wells, `#121214` selection,
white ribbon, glass for chrome only) · Information (white ladder 100/90/65/55/35
or ink ladder) · **Signal = the accent**. The accent drives: selection (1px
border + 14–22 % tint + mark + aria), active indicator (22 vs 7 px bar, dots
18 vs 6), progress fill, focus ring, indices/kickers, status dot, ≤10 % panel
wash, bloom shadows (deep accent), primary-button **hover** fill, one display
word. Never: backgrounds, body text, surfaces, primary button at rest (white
plate / ink). Selection is never colour-only. Light accents (yellow, white) must
still read — test them in the palette.

## 6. Motion

Tokens: fast 180 · control 280 · reveal 600 · cinematic 900 ms; standard
`cubic-bezier(.2,.8,.2,1)`, cinematic `cubic-bezier(.23,1,.32,1)`; stagger 80.
Reveal = y 24–45 + fade, once. State = clip-path wipes, frame/fill changes,
progress. Ambient stays quieter than state. Every motion has a job (acknowledge,
reveal, compare, progress, atmosphere).
**Pause model (mandatory):** loops and clocks run only while the component is
on-screen, the document is visible and no modal suspends the page; resume with
remaining time; never advance because time passed while unavailable. Media is
revealed only when decoded (loader after 350 ms grace, shown ≥ 500–700 ms, text
status, retry).

## 7. Responsive

Mobile changes the mechanism, not just the stacking: scrub → native snap
(82vw cards), joined rows → chip strip, side panel → progress strip, desktop
pager → bottom glass dock, N monitors → index + one monitor. Remove secondary
objects before shrinking legibility. Touch targets ≥ 44. Check 1440, 1024, 390.

## 8. Signature vs motif

Keep (Evoview authorship): asymmetric splits, three-voice type, radius-by-role
with square-against-round, indexed everything (`01 / 04`), state-as-frame,
paper-inversion active state, chapter strip with scroll progress, glass chrome,
media-gated reveals, timed sequences with the pause model.
Do **not** clone into neutral packages: eye artwork, REC dots, CRT/TV power-on,
scanlines/phosphor/grain, viewfinder brackets, Gaegu numerals, `méthode`
wordmark, `EVV` prefixes, red reset. Replace by role (see
`extraction/method.md` §8 table).

## 9. Attribution

One linked Evoview wordmark per component, in its header/chassis strip, `href`
from config (`https://evoview.be/`, new tab, accessible name), never inside or
next to a client CTA. Further marks decorative, `aria-hidden`, ≤ .12 opacity.
Configurable but on by default; README states it is the approved placement.

## 10. Package architecture

- `components/foundation` — tokens (`--ev-scale`, type roles, radius, rails,
  rhythm, motion, accent mapping), hooks (`useInViewPause`, `useSequenceClock`,
  `useMediaReady`), primitives used by every other package. Installed once;
  other packages import it relatively as `../foundation` and their
  `install.sh` installs/upgrades foundation first.
- Each package: `<name>.config.tsx` is the only per-site file; demo content is
  neutral (no Evoview copy/imagery; generic client content in FR + EN via
  `build<Name>Config(locale)`); CSS scoped under `.ev-<name>`.
- Each package's showcase page uses the shared `ShowcasePage` frame (title,
  language toggle, live accent palette writing `--primary` /
  `--primary-foreground`). Clicking a swatch must recolour the live component
  instantly.

## 11. Library taxonomy (navbar)

| Pill | Entries |
| --- | --- |
| **Layouts** (page sections) | `chapter` — section shell + headings + tone cuts · `card-track` — media card + scroll-scrubbed track · `process-sequence` — timed step board · `story-blocks` — intro split, indexed rows, proof grid, payoff band |
| **Components** (interactive) | `reservation` (existing) · `dossier` — portal modal with selection board, chapter strip, mobile dock · `selector-stage` — selector ↔ stage + before/after compare · `controls` — buttons, chips, fields, segmented progress, switch |
| **Navbar** | `/navbar` (the navbar package itself) |
