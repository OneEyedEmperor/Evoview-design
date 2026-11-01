# story-blocks — the Evoview editorial blocks

Four open compositions that carry a client's offer to its action, inside a
page chapter or a dossier: a title / lead split over a hero proof, an
indexed sequence (beside its proof or its heading), an asymmetric proof
collage, and a payoff band with one action. Chapters are told apart by
space, scale, alignment and tone — no rules, no boxes around prose, no
zebra bands; lists of text sit on quiet tonal surfaces. Depends on
`foundation` (≥ 1.3.0 for the list surfaces) and `controls`.

Showcase: `https://evoview-library.said.bet/layouts/story-blocks` (a
fictional winery: the full story on a dark page, then the short close a
light page would use; live accent palette; FR / EN).
Evidence: `docs/extraction/service-dossiers.md` A3, A6, A8, A10, §4.3,
rules 5–8, 13, 16; `docs/RULES.md` §3 (spacing is the separator; text
lists segmented by tone).

## Signature (preserve)

Read `STRATEGY.md`. These blocks are client content in an Evoview voice; the
following make them recognisably Evoview and must not be restyled. Changing
them is a library change (RULES §13).

- **Spacing is the separator**: one chapter band between chapters
  (96 / 144 authored, 124 rendered at 1440), heading → content 48 / 64,
  neighbours 20–48, internal ≈ 8. Never add hairlines, rules, cards or
  alternating backgrounds to segment; a tone cut (dark ↔ paper) is the
  strongest separator and is made by starting a new `<Story>`.
- **Text lists on tone, never bare**: every list of text sits on the
  foundation list surfaces (`--ev-surface-list` / `-alt`, ≈ 3–6 % off the
  environment, no borders, same text ladder). Steps beside their image are
  **tiles** (radius `surface`, 8px gap); a schedule is **joined rows** in
  one rounded surface, alternating a step, time · label · detail on one line
  from 768; payoff results are three peer **tiles** that join into one
  alternating surface on phones. Lists with media per item (proof collage)
  are exempt.
- **Asymmetric proportions on a shared edge**: title / copy `.72 / 1.28`;
  the 1.28 column's left edge is shared by the intro lead, the sequence
  media and the heading-split copy. Proof collage 7/5 ↔ 5/7 on 12 columns;
  payoff `1.2 / .8`. Equal columns only for payoff results (true peers).
- **One primary subject per chapter, show then explain**: the hero proof
  (16:10 → 4:3 tablet → 4:5 phone, first on phones, caption inside the
  media with an accent status dot); the sequence's single image on the
  larger side; the collage leads and its claim follows (`headingAt="end"`);
  the payoff statement.
- **Display ladder**: one title per story (`ev-t-title`), one heading per
  chapter (`ev-t-heading`), one payoff statement (`ev-t-display`), 2–3 short
  lines broken by meaning. Inside lists, row labels in the card voice
  (Overused 900) over body-size detail.
- **Indices only where they index**: sequence rows carry their position as
  a step gauge (foundation `StepGauge`, filled from the bottom, accent) or a
  real value (`14:00`) in the accent readout; proof images carry no numbers.
- **One exit**: exactly one primary plate per story (white / ink at rest,
  accent on hover), full width of its column, labelled with the action
  itself. A consequence readout under it only when the click does
  something the label doesn't say (in a dossier: "Quitte le dossier").
- **Reveal**: once, y24 / 600ms for text, y45 / 900ms for media, 80ms
  stagger, cinematic easing.
- **Accent roles**: row indices, caption dot + glow, the optional accent
  line of the payoff statement, the payoff bloom (20 %), plate hover and
  focus rings. Never backgrounds, body copy, frames or a resting plate.
  Accent text goes through `--ev-accent-signal`, so yellow and off-white
  still read on paper.
- **Attribution**: none. These are content blocks without a header or
  chassis strip, so they carry no Evoview mark (RULES §9: the one linked
  mark lives in a component's header strip). Never add a mark next to the
  payoff CTA.

Constraints: **illustrative ≠ result** — on a client site, a story that
demonstrates rather than documents (mock-ups, generated media) must say so
visibly near it. Payoff results must be true.

## Variations (select)

- **Which blocks and in what order:** `StoryIntro`, `IndexedRows`,
  `ProofGrid`, `PayoffBand` (`chapters` kinds `intro` · `rows` · `proof` ·
  `payoff`); a tone cut = a new `<Story>`.
- `StoryIntro` `align`: `STORY_INTRO_ALIGNS` — `end` (default; copy
  bottom-aligned against the title) · `start`.
- `IndexedRows` `surface`: `INDEXED_ROWS_SURFACES` — `tiles` (steps) ·
  `rows` (schedules, timetables); default tiles beside media, rows without.
  With or without `media`.
- `ProofGrid` `headingAt`: `PROOF_GRID_HEADING_POSITIONS` — `start`
  (default) · `end` (the images lead, the claim follows).
- `PayoffBand`: with or without `results`, `bloom`.

## Expression (adapt)

All copy, media, ratios (per artefact) and spans, the CTA destination (and
an optional consequence), tone per story (`dark` / `light` / `paper`),
accent (`--primary`, `--primary-foreground`), fonts via `--font-heading` /
`--font-body` / `--font-readout`.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/story-blocks.config.tsx` | Media status labels FR / EN; reference stories (`harvest`, `visit`). | **yes** (client-owned, like the theme file) |
| `src/Story.tsx` | `Story` root (tone, rhythm, copy, `chapters`), `renderChapter` | no |
| `src/blocks.tsx` | `StoryIntro`, `IndexedRows`, `ProofGrid`, `PayoffBand` | no |
| `src/parts.tsx` | `StoryFigure` (media gate), `Reveal`, `renderLines` | no |
| `src/types.ts`, `src/copy.tsx`, `src/index.ts` | types, copy context, exports | no |
| `src/story-blocks.css` | `.ev-story-blocks` token block, `evsb-*` | no |

## Install

```bash
L=/root/.vibehub/projects/evoview-design-library
$L/sync.sh plan /root/.vibehub/projects/<client> story-blocks   # read-only: files, deps, compat, changelog
$L/sync.sh apply /root/.vibehub/projects/<client> story-blocks  # then resolve conflicts, fill patch reasons
$L/sync.sh verify /root/.vibehub/projects/<client>
```

Writes `src/` to `<client>/src/components/story-blocks/`, plus `controls` /
`foundation` when absent or too old; `story-blocks.config.tsx` and
`story-blocks.theme.css` (tokens) are client-owned, never overwritten.
`install.sh <client>` applies clean plans only. Contract: `docs/SYNC.md`.

## Config and API

```ts
type StoryBlocksConfig = {
  locale: "fr" | "en";
  copy: { mediaLoading: string; mediaFailed: string; retry: string };
  stories: { harvest: StoryChapter[]; visit: StoryChapter[] }; // reference content
};
buildStoryBlocksConfig(locale): StoryBlocksConfig

type StoryMedia = { src; srcSet?; sizes?; alt; position?; positionPhone?; fit?: "cover" | "contain" };
type StoryChapter =
  | { kind: "intro"; title: Lines; lead; body?; media: StoryMedia; caption?: { kicker?; title }; align?: "end" | "start"; level?: 1 | 2 }
  | { kind: "rows"; heading: Lines; body?; rows: { label; detail; index? }[];
      media?: StoryMedia & { ratio?; ratioPhone? };
      surface?: "tiles" | "rows" }   // default: tiles beside media, rows without
  | { kind: "proof"; heading?: Lines; body?; headingAt?: "start" | "end";
      items: { media; ratio; ratioPhone?; span?; caption? }[] }
  | { kind: "payoff"; lines: ReactNode[]; accentLine?: number; lead?; results?: { title; detail }[];
      cta: { label; consequence?; href?; target?; rel?; onClick? }; bloom?: boolean };
// Lines = ReactNode | ReactNode[] (one entry per display line)
```

```tsx
const config = buildStoryBlocksConfig(locale);
<Story tone="dark" copy={config.copy} chapters={config.stories.harvest} />
// a tone cut = a second root:
<Story tone="paper" copy={config.copy} chapters={config.stories.visit} />
// or compose:
<Story tone="paper" rhythm="dossier" copy={config.copy}>
  <StoryIntro … /> <IndexedRows … /> <ProofGrid … /> <PayoffBand … />
</Story>
```

Each block is a `<section aria-labelledby>` on the wide rail; headings are
`h2`, row labels / results `h3`. Automatic row indices are `aria-hidden`
(the `ol` carries order); a custom `index` is read.

Page title: a page that opens on a `StoryIntro` makes its title the h1 with
`level={1}` (default 2); only the element changes, never the voice, size or
markup, and the blocks after it stay `h2` / `h3`. On a page that hosts a
crawlable modal (`docs/CRAWLABLE-MODALS.md` §4) the host passes `1` on the
page URL and `2` while a view is open (the view's title is the h1 then).
One h1 per page; never a visually hidden h1 beside it.

Sequence: with `media`, text `.72` | media `1.28`; the heading tops the
media and the last tile ends on its baseline. From 1024 the ratio (default
1) is a minimum: when the tiles run taller (narrow columns, long details)
the image grows with them. Without media, heading (+ body) `.72` | joined
rows `1.28`. `surface` overrides the default per list: tiles for steps,
rows for schedules and timetables. Tiles reveal one by one; joined rows and
the results reveal as one surface.
Proof collage: items flow on 12 columns, default spans 7/5 then 5/7
(vertically centred, so mixed ratios stagger); `span` overrides. Phone: one
column; two consecutive portrait items (`ratio < 1`) share a row.

### Media

Give every image width-described renditions in `srcSet`, with `src` as the
largest (fallback). The `<img>` and its media gate fetch the same single
candidate (foundation ≥ 1.16.0 gate). A client passes `srcSet` only: each
block supplies its `sizes` from its page-rhythm layout. `media.sizes`
overrides it, e.g. inside a dossier, where the rail is narrower than these
upper bounds.

| Block | Default `sizes` (exported constant) | Rendered at 390 / 1024 / 1440 |
| --- | --- | --- |
| Intro hero | `STORY_INTRO_SIZES`: full rail, `calc(100vw − 40px)` phone … `1240px` from 1280 | 350 / 926 / 1170 |
| Sequence media | `STORY_SEQUENCE_SIZES`: full rail below 1024, the `1.28` side from 1024 (`calc(64vw − 84px)`, `761px` from 1280) | 350 / 562 / 718 |
| Proof item | `storyProofSizes(span, half)`: `span` / 12 columns from 768; full rail or half (paired portraits) below | 350 or 169 / 524 or 363 / 666 or 464 |

Renditions that cover them at 1×–3×: about 480, 800, 1200 and the
1400–1600 original. Without `srcSet`, the markup is unchanged: no `sizes`
or `srcset` attributes.

## Desktop / tablet / phone

| | ≥ 1024 | 640–1023 | < 640 (phone) |
| --- | --- | --- | --- |
| Intro | `.72 / 1.28`, hero 16:10 under | stacked, media first, 4:3 | media first, 4:5, copy below |
| Sequence + media | `.72 / 1.28`, tiles end on the media baseline (media grows if needed) | media first (ratio), then tiles | media first (`ratioPhone`), then tiles; detail 14px under a 17.6px label |
| Sequence, text only | heading `.72` / joined rows `1.28`, one line per row | stacked, one line per row from 768 | stacked; label over detail inside each row |
| Proof | 12 col, gaps 64 × 40 | 12 col from 768 | 2 col: portraits pair, others full |
| Payoff | `1.2 / .8`, CTA bottom-aligned, results 3 tiles | stacked, results 3 tiles | stacked, results one joined surface (title · detail per row), CTA full width |

## Motion and pause model

The media retry button takes foundation's press jelly (RULES §6).

One full-motion experience, no `prefers-reduced-motion` branch. Every block
has a complete stable state: content is only hidden after mount when
`IntersectionObserver` exists, and each part reveals once when ≥ 12 % is
on-screen **and** the document is visible (`useInViewPause`); nothing loops,
nothing advances on time. Media is requested 600px before the viewport and
revealed only when decoded (`useMediaReady`: text status after 350ms, shown
≥ 500ms, failure → "Image indisponible" + retry); hero captions appear with
their image. Proof images zoom 1.045 on hover (fine pointers only).

## Verification

1. `pnpm build`; showcase at 1440, 1024, 390: no horizontal overflow, no
   text under 9px (readouts), 12px (compact), 13px (body).
2. No segmenting lines anywhere: `getComputedStyle` borders on `.evsb-*`
   are 0; chapters share one background per story; every `.evsb-row` and
   `.evsb-result` paints `--ev-surface-list` (or `-alt` on even joined rows).
   1440 / 1024: last sequence tile bottom = media bottom.
3. 1440: intro columns ≈ 405 / 720, hero 16:10, chapter band ≈ 124px,
   payoff ≈ 670 / 445; display 57.8, title 46.8, heading 39.9.
4. 390: hero and sequence media first, portrait proofs 2-up, CTA full width.
5. Palette: default, indigo, yellow, off-white — indices, dot, accent line,
   bloom recolour without remount; readable on paper.
6. Keyboard: the plate is reachable, focus ring visible; a set consequence
   is its `aria-describedby`. Hover (fine pointer): plate fills with the accent.
7. Block an image (devtools / route abort): the well shows the failure text
   and retry; retry reveals the image.
8. Scroll fast past the story with the tab hidden / restored: parts reveal
   only once seen.
9. With `srcSet`: at 390 (1× / 3×) and 1440, the network log fetches each
   image once, as the candidate ≥ its rendered width × DPR (`currentSrc`);
   never `src` beside it.
