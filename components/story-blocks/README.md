# story-blocks — the Evoview editorial blocks

The open compositions Evoview uses to tell a story inside a page chapter or
a dossier: a title / lead split over a hero proof, numbered rows, an
asymmetric proof grid, ruled pillars and a closing payoff band with one
action. Chapters are separated by spacing, a hairline and an alternating
band, never by cards around prose. Depends on `foundation` and `controls`.

Showcase: `https://evoview-library.said.bet/layouts/story-blocks` (a
fictional winery told twice: dark harvest story, paper visit story; live
accent palette; FR / EN).
Evidence: `docs/extraction/service-dossiers.md` A3, A6, A8, A10, §4.3,
rules 3–8, 13, 16–17; `foundations.md` A8; `portfolio-contact.md` A5, A8.

## What is Evoview (protected)

Read `STRATEGY.md`. These blocks are client content in an Evoview voice; the
following make them recognisably Evoview and must not be restyled:

- **Open chapters**: heading and copy unboxed; separation = spacing →
  1px hairline → alternating band (`#0c0c0d` / `#101011`, paper `#fff` /
  `#efefef`). Boxes only for media wells.
- **Asymmetric proportions**: title / copy `.72 / 1.28` with copy
  bottom-aligned; rows `48 / 132 / 1fr` (rendered at 1440); proof grid 7/5 ↔
  5/7 on 12 columns; pillars `1.1 / .95 / .95`; payoff `1.2 / .8`. Equal
  columns only for the results row (true peers).
- **Show, then explain**: the hero proof is 16:10 (4:3 tablet, 4:5 phone)
  and comes **first** on phones; its caption lives inside the media
  (readout kicker, caption title, accent status dot) on a dark scrim.
- **Indexed everything**: rows `01`, proof captions `01 / LABEL · qualifier`,
  pillars `01 / LABEL`, all in the Satoshi readout; indices take the accent.
- **Display ladder**: one title per story (`ev-t-title`), one heading per
  chapter (`ev-t-heading`), one payoff statement (`ev-t-display`), 2–3 short
  lines broken by meaning; never two display sizes in a chapter.
- **One exit**: exactly one primary plate per story (white / ink at rest,
  accent on hover), full width of its column, with its consequence label
  under it ("Ouvre la réservation").
- **Pillars**: the generous label → heading drop (64px desktop) is the
  "file card" air; do not tighten it.
- **Reveal**: once, y24 / 600ms for text, y45 / 900ms for media, 80ms
  stagger, cinematic easing.

**Accent = the client's** (`--primary`, `--primary-foreground`): indices,
caption dot + glow, hero border (44 %), note rule, the optional accent line
of the payoff statement, the bloom (22 %, payoff only), the plate hover and
focus rings. Never backgrounds, body copy or a resting plate. Strokes and
accent text go through `--ev-accent-signal`, so yellow and off-white still
read on paper.

**Client-adaptable**: all copy, media and ratios (chosen per artefact), the
CTA destination and consequence, tone per story (`dark` / `light` /
`paper`), rhythm (`page` / `dossier`), band overrides, which blocks to use
and their order, fonts via `--font-heading` / `--font-body` /
`--font-readout`.

**Attribution**: none. These are content blocks without a header or chassis
strip, so they carry no Evoview mark (RULES §9: the one linked mark lives in
a component's header strip). Never add a mark next to the payoff CTA.

**Illustrative ≠ result**: if a story demonstrates rather than documents
(mock-ups, generated media), say so visibly near it (the showcase prints
"Exemple fictif · images générées"). Results in a payoff must be real.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/story-blocks.config.tsx` | Media status labels FR / EN; reference stories (`harvest`, `visit`). | **yes — the only one** |
| `src/Story.tsx` | `Story` root (tone, rhythm, copy, `chapters`), `renderChapter` | no |
| `src/blocks.tsx` | `StoryIntro`, `IndexedRows`, `ProofGrid`, `RuledPillars`, `PayoffBand` | no |
| `src/parts.tsx` | `StoryFigure` (media gate), `Reveal`, `renderLines` | no |
| `src/types.ts`, `src/copy.tsx`, `src/index.ts` | types, copy context, exports | no |
| `src/story-blocks.css` | `.ev-story-blocks` token block, `evsb-*` | no |

`showcase.css` is the library page's sheet; not installed.

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/story-blocks/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `foundation` and `controls` first, then copies `src/` to
`<client>/src/components/story-blocks/`; re-runs keep the config.

## Config and API

```ts
type StoryBlocksConfig = {
  locale: "fr" | "en";
  copy: { mediaLoading: string; mediaFailed: string; retry: string };
  stories: { harvest: StoryChapter[]; visit: StoryChapter[] }; // reference content
};
buildStoryBlocksConfig(locale): StoryBlocksConfig

type StoryMedia = { src; alt; position?; positionPhone?; fit?: "cover" | "contain" };
type StoryChapter =
  | { kind: "intro"; title: Lines; lead; body?; media: StoryMedia; caption: { kicker; title }; align?: "end" | "start"; band? }
  | { kind: "rows"; heading: Lines; body?; rows: { label; detail }[]; layout?: "split" | "full"; band? }
  | { kind: "proof"; heading?: Lines; body?; items: { media; ratio; ratioPhone?; label; qualifier? }[]; note?: Lines; band? }
  | { kind: "pillars"; heading?: Lines; body?; pillars: [Pillar, Pillar, Pillar]; band? }
  | { kind: "payoff"; lines: ReactNode[]; accentLine?: number; lead; results?: { title; detail }[];
      cta: { label; consequence; href?; target?; rel?; onClick? }; bloom?: boolean; band? };
// Lines = ReactNode | ReactNode[] (one entry per display line)
```

```tsx
const config = buildStoryBlocksConfig(locale);
<Story tone="dark" copy={config.copy} chapters={config.stories.harvest} />
// or compose:
<Story tone="paper" rhythm="dossier" copy={config.copy}>
  <StoryIntro … /> <IndexedRows … /> <ProofGrid … /> <PayoffBand … />
</Story>
```

Direct children of `Story` must be blocks (bands alternate by position;
override with `band`). Each block is a `<section aria-labelledby>` on the
wide rail; headings are `h2`, row labels / pillar headings / results `h3`.
`rhythm="page"` uses the chapter rhythm (80 / 120 authored), `"dossier"`
48 / 64 inside a portal.

Proof grid: items pair up 7/5 then 5/7 (vertically centred, so mixed
ratios stagger); a note sits beside an odd last item or on its own 5-col
row. Phone: one column, ratio relaxed toward 1 (`clamp(ratio, .88, 1.25)`)
unless `ratioPhone` is set.

## Desktop / tablet / phone

| | ≥ 1024 | 640–1023 | < 640 (phone) |
| --- | --- | --- | --- |
| Intro | `.72 / 1.28`, hero 16:10 under | stacked, media first, 4:3 | media first, 4:5, copy below |
| Rows | split `.72 / 1.28` or full; `48 / 132 / 1fr` | stacked head; 3-col rows | index + label line, detail under |
| Proof | 12 col, gaps 64 × 40 | 12 col from 768, else one column | one column, gap 36 |
| Pillars | 3 cols with verticals, 64px drop | stacked with top rules, 18px drop | same |
| Payoff | `1.2 / .8`, CTA bottom-aligned | stacked, results 3-up (≥ 640) | stacked, results stacked, CTA full width |

## Motion and pause model

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
   text under 9px (readouts), 11px (labels), 12px (compact), 13px (body).
2. 1440: intro columns ≈ 405 / 720, rows 48 / 132, hero 16:10, payoff
   ≈ 670 / 445; display 57.8, title 46.8, heading 39.9.
3. 390: hero first and 4:5, rows index + label then detail, CTA full width.
4. Palette: default, indigo, yellow, off-white — indices, dot, note rule,
   accent line, bloom recolour without remount; readable on paper.
5. Keyboard: the plate is reachable, focus ring visible, its consequence is
   its `aria-describedby`. Hover (fine pointer): plate fills with the accent.
6. Block an image (devtools / route abort): the well shows the failure text
   and retry; retry reveals the image.
7. Scroll fast past the story with the tab hidden / restored: parts reveal
   only once seen.
