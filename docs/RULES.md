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
| Where / state | Satoshi 700, UPPERCASE, tracking +.12 → +.20em, tabular | status, versions, compact labels |

Labels/controls: Overused 700 UPPERCASE +.05 → +.25em. Questions to the visitor
are sentence case; brand statements are uppercase.

**No small counting tags.** Never label items with position readouts such as
`01 / 04` or `02 / 03`. When an item's order matters, show the bare number
(`1`, `2`…, no padding, no total) in a round orb attached to the item.

**Stacked lists: the step gauge (norm).** When a vertical list carries its
order at the head of each row (steps, options, stages), the position is a
vertical battery, not `01`…`04`: one cell per item, filled from the bottom
up to the row's position (2 of 4 = half). `StepGauge` from `foundation`
(`.ev-gauge`, sized in the row's em); lit cells in the list's signal (or
the row's state colour, e.g. dim until selected), empty cells `--ev-fg-12`.
Authored values that are not order (times, codes) stay text. Inside an
`<ol>` it is decorative; elsewhere pass `srLabel`.

**No kicker tags.** No small state-voice labels over or before titles
(`01 — Sections de page`, `02 — Interactive`, a lone `01` index before a
heading), numbered or not. The title and its lead carry the section.

**Ordered cards: the orb-seam card (priority pattern).** Default for any
ordered set of cards; choose it before inventing another card. Reference:
`EntryCard` in `src/pages/library/Home.tsx`, `.lib-card*` in
`src/library/library.css`.
- Media well (`1em` radius) and caption ribbon (tonal tile a step off the
  environment, `1em` radius) as two surfaces split by a seam ≈ `.375em`.
- Orb Ø `2.5em`, centred on the seam, overlapping well and ribbon, aligned to
  the ribbon's text start. Bare number in the state voice; foreground plate
  (white on night, ink on paper), number in the environment colour, a `.3em`
  ring in the seam's colour so it reads as set into the gap. Decorative
  (`aria-hidden`); order stays in the DOM order.
- Hover/focus (from 768): the seam fills with the accent (`SeamFlow`,
  `src/library/SeamFlow.tsx`) — a plain bar from the left that fills the end
  notches to the corners' exact curves, splits top and bottom around the
  orb's ring, then runs on to the right; one eased ~1s timeline, drains back
  the same way.
- **An orb never switches colour by a cut or a fade.** Any orb colour change
  (rest ↔ accent, state, selection, anywhere an orb is used) is the liquid
  fill: the new colour rises from the bottom as a level with a moving wave
  surface that calms when full, the number turning to the new ink as it goes
  under, and drains back down on reversal. Use foundation's `OrbFill`
  (`on`, `hoverWithin` or a driving `controller`; colours via
  `--ev-orb-rest(-ink)` / `--ev-orb-lit(-ink)`), never a CSS
  `background`/`color` swap on the orb. Borders, rings and halos around the
  orb may still transition.
- **Text never switches colour by a cut or a fade either.** A label, title,
  index, caption or link text that changes colour (hover, focus, selection,
  state) takes the same liquid fill: the new colour rises through the
  glyphs, returning to the previous colour drains it, a third colour rises
  over whichever shows. Use foundation's `TextFill` (`on`, `ink` for a state
  colour, `hoverWithin` + `hoverInk`); inline icons in `currentColor` beside
  the label go in their own `TextFill` with the same trigger. Not covered:
  running text (never state-coloured), text whose content is replaced
  rather than recoloured, text riding a surface that itself changes under
  it (plate hover, selected calendar day: it follows that
  surface), and fixed states that never switch at runtime (disabled,
  outside-month days).
- **Buttons too.** A button whose surface changes colour on hover / press
  (primary plate, CTA, toast) pours its new surface in as the same liquid,
  label ink and inner orb switching under the one wave: foundation's
  `SurfaceFill` (a copy of the content in the filled state, last child of
  the button, colours `--ev-surface-lit` / `--ev-surface-lit-ink`), never a
  CSS `background` swap. Faint tonal hover tints of rows and tiles are not
  colour switches and keep their transition.
- **Toggles too.** A toggle that switches colour (segmented control option,
  switch track and knob) fills its new state as the same liquid and drains
  the old one; a sliding knob may keep sliding, a sliding highlight is
  replaced by per-option pills (controls `SegmentedControl`, `Switch`).
- Ribbon: optional status/version top-right, card title, one-line meta.
- Peers in an equal grid (2-up from 768), rows stretched to one height.
- Phone (< 768): one tonal row tile per card, thumbnail `.8` : caption `1.2`,
  `.5em` padding (thumbnail radius `.5em`, concentric); the seam turns
  vertical and the orb (Ø `2.1em`, ring in the tile colour) sits centred on
  it. Every card stays visible — no horizontal strip.

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
  100 (rendered desktop). **Spacing is the separator.** Then scale, alignment
  and tone shifts. Separating lines are cheap segmentation (architecture skill:
  "prefer clear spatial relationships over extra labels, borders and
  containers") — do not rule off rows, chapters, columns, results or captions.
  A hairline is allowed only when it is itself information (a progress track,
  a timeline, a seam that a reader must see, a chapter strip underline) — at
  most one per scene, and justify it. Boxes only for hit targets, media
  clipping and selection state.
- **Section bars (optional, situational).** A row of bars under a title, one
  per section of the page, only the current section's bar lit, the others a
  step off the ground. Never required; use it where the page's sections are
  worth locating. The row spans exactly the title's text width (title as a
  two-row grid sized by its text), thickness ≈ `.12em` of the title (finer
  on display words), rounded ends, gap ≈ `.06em`; the lit bar draws in once
  on screen. Lit colour: the accent by default; when the row serves as the
  separator between the title and its lead (air ≈ `.42em` above), the
  foreground instead (ink on paper, white on night), and it counts as the
  scene's one allowed separator. Reference: `SectionBars` in
  `src/pages/library/Home.tsx`, `.lib-bars*` in `src/library/library.css`.
- **Text lists are segmented by tone, not lines and not bare spacing.** A list
  of text items (steps, schedule, facts, results, practical info) must never
  render as a column of plain text. Each item sits on a surface a step off the
  environment (dark: e.g. `#141416` / `#18181a` on `#0e0e0e`; paper/light:
  e.g. `#f4f4f2` / `#e9e9e6` on `#fff` / `#efefef`) — either every item on its
  own tonal tile with a small gap, or alternating tonal rows. Surface radius
  follows role (`surface` for tiles, 0 for joined rows), no borders. The
  contrast between surface and environment is subtle (≈ 3–6 % lightness), the
  text ladder stays the same. Lists with media per item are exempt (the media
  segments them).
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
18 vs 6), progress fill, focus ring, number orbs on hover/focus, status dot, ≤10 % panel
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
**Preview screens: the channel switch (norm).** A screen that previews the
option under the pointer or keyboard focus (options beside a picture, a
selector beside its stage, a page list beside a player) changes by the
channel switch, `ChannelSwitch` from `foundation`, never by a cut, crossfade
or slide: the picture folds to a horizontal line (180 ms, ease-in), the new
one opens from that line with a sideways shudder (360 ms,
`cubic-bezier(.16,1,.3,1)`), faint signal lines flash over the screen (360 ms,
stepped). Copy belonging to the screen (its title, category) switches with
it, without the lines. Fast travel coalesces to the last option; pointing
away returns the screen to its rest content after ~140 ms, so moving between
neighbours never flashes it; incoming media is decoded before the screen
opens. The pointed option answers on its own side (tonal step, accent orb
fill). Reference: evoview contact application, question 1; the showcase
title strip (`src/library/ShowcasePage.tsx`).
**Pressed pills and buttons: the press jelly (norm).** Every clickable pill
or button (plates, chips, glass close / pager orbs, ghost actions, segmented
options, switch tracks, tab / dock / finder pills, small orb buttons) squashes
vertically and widens slightly while pressed (pointer of any kind, Enter /
Space), then springs back with one small elastic overshoot on release:
foundation's press jelly (`data-ev-jelly` on the host, `usePressJelly()` in
the component; `data-ev-jelly="<selector>"` deforms a descendant, e.g. a
switch's track). Never a CSS `:active` scale on those hosts, never on layout
properties. Not covered: cards, tiles, list rows and accordion headers
(large surfaces keep their own subtle `:active` scale), text links in
running text, invisible hit areas, controls whose press starts a drag
(scrubbers, sliders), and disabled / busy / locked hosts.
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
with square-against-round, numbered order as orbs and the orb-seam card (§1), state-as-frame,
paper-inversion active state, chapter strip with scroll progress, glass chrome,
media-gated reveals, timed sequences with the pause model.
Do **not** clone into neutral packages: eye artwork, REC dots, CRT/TV power-on,
scanlines/phosphor/grain, viewfinder brackets, Gaegu numerals, `méthode`
wordmark, `EVV` prefixes, red reset. Replace by role (see
`extraction/method.md` §8 table). One exception: the channel switch (§6),
whose signal lines exist only while a preview screen switches, never at rest.

## 9. Attribution

One linked Evoview wordmark per component, in its header/chassis strip, `href`
from config (`https://evoview.be/`, new tab, accessible name), never inside or
next to a client CTA. Further marks decorative, `aria-hidden`, ≤ .12 opacity.
Configurable but on by default; README states it is the approved placement.

## 10. Package architecture

- `components/foundation` — tokens (`--ev-scale`, type roles, radius, rails,
  rhythm, motion, accent mapping), hooks (`useInViewPause`, `useSequenceClock`,
  `useMediaReady`), primitives used by every other package. Installed once;
  other packages import it relatively as `../foundation`; `sync.sh` installs
  or upgrades it when a package's `requires` needs it (`docs/SYNC.md`).
- Each package: `<name>.config.tsx` and `<name>.theme.css` are the only
  per-site (client-owned) files; demo content is
  neutral (no Evoview copy/imagery; generic client content in FR + EN via
  `build<Name>Config(locale)`); CSS scoped under `.ev-<name>`.
- Each package's showcase page uses the shared `ShowcasePage` frame (title,
  language toggle, live accent palette writing `--primary` /
  `--primary-foreground`). Clicking a swatch must recolour the live component
  instantly.

## 11. Library taxonomy (navbar)

| Pill | Entries |
| --- | --- |
| **Layouts** (page sections) | `chapter` — section shell + headings + tone cuts · `card` — media card + scroll-scrubbed track (and the card compositions extracted from Tchin) · `process-sequence` — timed step board · `story-blocks` — intro split, indexed rows, proof grid, payoff band |
| **Components** (interactive) | `reservation` (existing) · `dossier` — portal modal with selection board, chapter strip, mobile dock · `selector-stage` — selector ↔ stage + before/after compare · `controls` — buttons, chips, fields, segmented progress, switch |
| **Navbar** | `/navbar` (the navbar package itself) |

## 12. Showcase pages

A showcase page teaches one package. Within the first viewport a reader must
understand what the component is, what job it does on a client site, and what
to look at. Every variant shown must demonstrate a real configuration
difference a client would choose; drop variants that repeat the same thing
with less content. Annotation stays minimal and in the page's own voice — no
spec readouts sprinkled over the demo. Demo media must load reliably every
time (no flaky gates, no race with the palette or locale).

## 13. Ownership

Who decides what, in every package. Each README carries the package's three
lists under the fixed headings `## Signature (preserve)`, `## Variations
(select)`, `## Expression (adapt)`.

| Layer | Owns | Agents |
| --- | --- | --- |
| **Signature** | Evoview's design DNA: proportions and asymmetric splits (§4), radius by role (§2), the three voices' roles (§1), rhythm (§3), motion physics and choreography (§6), interaction principles (liquid fill, orb-seam card §1; press jelly, channel switch §6; state as frame, media-gated reveals §8), the attribution placement (§9) | Preserve. Changing it is a library change, never a client-side edit |
| **Variations** | Compositions, layouts, sequences and choreography alternatives a package exports as props / config: a `const` array per option set (`CHAPTER_STORY_LAYOUTS`…), its type derived from it | Select and configure. Only exported options exist; a new one is added in the library, never improvised in a client |
| **Expression** | Client content, media, copy, accent (§5), typography (`--font-*`), tone choice per section, the client's marks | Invent freely within the constraints |
| **Constraints** (every layer) | Legibility floors and reduced motion (§0), accessibility (keyboard, focus, aria, touch ≥ 44, §7), pause model and media gating (§6), performance (`animations/SKILL.md` §3), attribution rules (§9; turning it off is the founder's call), SSR / crawlable modals (`docs/CRAWLABLE-MODALS.md`) | Non-negotiable. Creatively free is not technically free: a client font may change, floors, overflow and a11y still hold |

- **evoview.be is a client in this model.** Its eyes, CRT, scanlines, Gaegu
  numerals and root-scale model are its own Expression: hence §8 keeps them
  out of neutral packages, and the library's neutralisation is never applied
  back to the site.
- Technical props (ids, heading levels, `still`, callbacks, `onNavigate`,
  `chapter`, `history`) are neither Variation nor Expression.
- Code transfer (verbatim / package / port / never) is a separate axis:
  `docs/SYNC.md`.
