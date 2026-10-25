# selector-stage — compare one variable at a time

The most common Evoview chapter: a claim, a stage that demonstrates it and
one interpreting sentence. Three pieces:

- `SelectorStage`: joined selector rows (`.70`) drive a 4:3 stage (`1.30`);
  phone = chip strip above the stage. Optional autoplay under the pause model.
- `CompareToggle`: a transformation — before / after on the same frame
  (`Avant | Après`, clip-path wipe) — or `mode="pair"`: two alternatives the
  visitor weighs together (two proposals, two logos), two equal frames.
  Before/after belongs on the toggle, never the pair.
- `ProofAtlas`: main 4:3 frame (`1.22`) + 2×2 square thumbnails (`.78`),
  resting thumbs graded down; phone = main + snap strip. The pictures are
  the choice (vs `SelectorStage`, where words choose and the stage shows
  the consequence).

Depends on `foundation` and `controls`. Evidence: `docs/extraction/service-dossiers.md`
A4, A5, A7, §4.3, rules 4–6, 9–10, 13–14; `foundations.md` §5.4.
Showcase: `https://evoview-library.said.bet/components/selector-stage`.

## What is Evoview (protected)

Read `STRATEGY.md`. These make the chapter recognisably Evoview; do not
restyle them to a client's UI kit:

- **Show, then explain**: heading (two short display lines) → stage →
  one sentence (`aria-live`). Captions live inside the media: readout kicker
  (`VUE · 02`) + label. No free-floating kickers.
- **Asymmetric splits**: `.70 / 1.30` selector/stage, `.72 / 1.28`
  heading/copy, `1.22 / .78` atlas. Equal columns only for the pair (true peers).
- **Joined rows, radius 0**, ≥ 64px, segmented by tone (RULES §3): rows
  alternate `--ev-surface-list` / `--ev-surface-list-alt` inside one
  surface-radius panel (ends follow the radius), no rules. Selection is multi-signal: 22 % accent tint + 65 %
  border + indicator bar 22px vs 7px + text contrast + `aria-checked`
  (radio). Never colour alone. The only line in a scene is information
  (the autoplay progress on the stage edge).
- **Desktop rows ↔ phone chips**: below 1024 the rows become a horizontal
  `OptionChip` strip above the stage — a mechanism change, not stacking. The
  pair becomes a toggle on one frame below 768.
- **Stage**: 4:3, surface radius, `#080808` well, 44 % accent border, bottom
  scrim; changes fade the new layer in over the opaque previous ones (no
  dip to the well on fast clicks) / object-position 300ms; compare: the
  "after" sheet wipes in left → right and back out right → left, 600ms,
  reversing in place when toggled mid-wipe.
- **Grade carries state** in the atlas: resting thumbs `grayscale · brightness .5`,
  the active one releases colour inside a 70 % accent ring; no resting frame.
- **Media gate**: photographs reveal only once decoded (loader after 350ms,
  counter, retry).
- **Illustrative ≠ result**: when a chapter shows a demonstration rather
  than a delivered result, say so once in its `note` slot ("Rendus
  illustratifs"). Once per page, not under every chapter; real client
  results need none.

**Accent = the client's** (`--primary` → `--ss-accent`, `--primary-foreground`
→ `--ss-accent-ink`). It drives: row tint / border / bar / step gauge
(foundation `StepGauge`, lit when selected), chip
selection, segmented thumb, stage border, caption kicker, autoplay progress,
active thumb, the change drawn in a specimen, one heading word (`<em>`),
focus rings. Never
backgrounds, body text or the stage well. Strokes use `--ss-signal` (pulled to
the tone foreground) and marks over media use `--ss-on-media` (lifted to
white), so yellow, off-white and ink accents all stay visible.

**Attribution**: none. This is a chapter without a header / chassis strip;
the approved linked `EvoviewMark` belongs to the host page's chrome (navbar,
footer, dossier header). Do not add a mark inside the stage or next to a CTA.

**Motion / pause model**: one full-motion experience, no
`prefers-reduced-motion` branch. Every state is reachable by click / keys
(complete stable state). Autoplay (off by default) runs only while on-screen,
the document is visible, no modal suspends the page, media is ready and no
mouse hover (rows, chips, stage) / keyboard focus in the choices holds it
(`useInViewPause` + `useSequenceClock`); it resumes with the remaining dwell
and stops for good on a manual choice (the text toggle restarts it with a
full dwell; the toggle itself never holds it). Reveal: y 28 + fade 600ms, stagger 80, once.

Client-adaptable: all copy, media, specimens (`render` nodes), number of
options (2–6 reads well; atlas 4), accent, tone per chapter, dwell.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/selector-stage.config.tsx` | Labels FR / EN + the site's chapters (`buildSelectorStageConfig(locale)`). Reference: fictional renovation studio. | **yes — the only one** |
| `src/media/` | Reference photographs (≤ 62 KB webp, generated placeholders). Replace with client media. | yes (content) |
| `src/SelectorStage.tsx`, `CompareToggle.tsx`, `ProofAtlas.tsx` | Components | no |
| `src/stage.tsx` | Stage frame, media gate, radio keys, heading | no |
| `src/types.ts` | Content / copy types | no |
| `src/selector-stage.css` | Token block `.ev-selector-stage`, `ss-*` classes | no |

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/selector-stage/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `controls` and `foundation` first, then copies `src/` to
`<client>/src/components/selector-stage/`; re-runs keep the config and `media/`.

```tsx
import { SelectorStage, CompareToggle, ProofAtlas, buildSelectorStageConfig } from "@/components/selector-stage";
const { copy, chapters } = buildSelectorStageConfig(locale);
<SelectorStage {...chapters.finishes} copy={copy} tone="dark" />
<CompareToggle {...chapters.renovation} copy={copy} tone="paper" />
<CompareToggle {...chapters.plans} copy={copy} tone="light" mode="pair" />
<ProofAtlas {...chapters.atlas} copy={copy} tone="dark" />
```

## Config / API

```ts
type StageMedia = { src: string; alt: string; position?: string; scale?: number };
type StageVisual = { media?: StageMedia; render?: ReactNode };   // photo or any node
type ChapterCopy = { heading: ReactNode[]; body?: ReactNode; label: string; note?: ReactNode };

SelectorStageContent = ChapterCopy & { options: (StageVisual & { id; label; caption?; detail })[] }
CompareContent       = ChapterCopy & { states: [CompareState, CompareState] }   // { id; label; caption?; detail? } & StageVisual
AtlasContent         = ChapterCopy & { items: { id; label; note?; media: StageMedia }[] }
SelectorStageCopy    = { view; frame; loading; failed; retry; autoplayPause; autoplayResume; versus }
```

Common props: `copy?` (default: FR labels), `tone?: "dark" | "light" | "paper"`
(default dark), `chapter?` (chapter padding + wide rail, default true; false
inside a host chapter), `defaultValue?`, `onChange?(id)`, `headingLevel?: 2 | 3`,
`id?`, `className?`. `SelectorStage`: `autoplay?: boolean | { dwellMs }`
(default off, 4200ms). `CompareToggle`: `mode?: "toggle" | "pair"`.

Options sharing one `media.src` become one layer: `position` / `scale`
animate a crop of the same photograph (the Territory "laws" pattern).

## Desktop / mobile

| | ≥ 1024 | < 1024 |
| --- | --- | --- |
| SelectorStage | rows `.70` / stage `1.30` | heading → chip strip (bleeds to the gutter, scrolls the active chip into view) → stage → detail |
| CompareToggle | heading + segmented + detail `.70` / frame `1.30` | heading → frame → segmented (full width) → detail |
| Pair | two equal frames (≥ 768) | segmented + one frame (< 768) |
| ProofAtlas | main `1.22` / 2×2 squares `.78` | main → snap strip (58vw, 38vw from 640) |

Keyboard: every group is a radiogroup (one tab stop; arrows / Home / End move
and select). Hover styles only on `(hover: hover)`. Touch targets ≥ 44px.

## Verification

1. `pnpm build`; showcase at 1440, 1024, 390: no horizontal overflow, no text
   under the floors (readouts 9px, labels 11px, body 13px).
2. Proportions: rows/stage `.7/1.3`, stage 4:3, rows ≥ 64px, chips ≥ 44px.
3. Palette: default, indigo, yellow, off-white — selection, bar, kicker,
   segmented thumb and active thumb visible on dark, paper and light.
4. Keyboard: Tab reaches each group once; arrows change the stage and the
   live detail; focus ring visible; Enter on the autoplay toggle resumes it.
5. Autoplay: advances only on screen; scroll away / hide the tab / open a
   modal → holds; hover holds and resumes with the remainder; a click stops it.
6. Click options fast: the stage never darkens between photographs.
   Compare: toggle mid-wipe → the seam turns around where it is.
7. FR/EN and palette switches keep the current selection and do not replay
   reveals (never key chapters by locale).
8. Throttle the network / disable the cache, reload ≥ 10×: loader after
   350ms with a counter, every stage reveals; failure → retry.
