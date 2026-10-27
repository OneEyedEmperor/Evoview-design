# Tchin extraction — refinement and optimisation pass

The Tchin extraction landed (`15e9d25` card 2.0.0: `CardDeck`, `CardSequence`;
`726814b` chapter 1.2.0: `ChapterStory`, `ChapterFaq`, `ChapterContact`,
`ChapterFooter` panel). Founder verdict: amazing job overall; now a refinement
and optimisation pass. Founder's main complaint:

> the inter section spacing in the new added sections in section pacing needs
> to be looked at, the segmentation of sections do not make sense, sometimes
> the description and the pills of a section stand on the bg of a section
> above.

Pages: Section pacing = `chapter` (`/layouts/chapter`, `src/pages/library/
Chapter.tsx` + `chapter/*`); Card = `card` (`/layouts/card`, `Card.tsx` +
`card/*`). Phases run in order, each starts from the previous one's result:

| Phase | Agent | Scope |
| --- | --- | --- |
| 1 | spacing · segmentation · clarity | both pages, every scene |
| 2 | section order | both pages: scene sequence + default toggle of every switch |
| 3 | optimisation (3 in parallel) | `ChapterStory` · `ChapterFaq`+`ChapterContact`+`ChapterFooter` · `CardDeck`+`CardSequence`+`MediaCard`/`CardTrack` |

## Read first

`CLAUDE.md`, `STRATEGY.md`, **`docs/RULES.md` (binding; §3 space, §12
showcase)**, `docs/SHOWCASE-CONTRACT.md` (frame owns spacing; `ShowcaseVariant`
tone/rhythm/caption), `docs/TCHIN-EXTRACTION-BRIEF.md` (how the scenes were
built, founder rules), `docs/extraction/tchin-*.md`, the package READMEs, and
`/root/.vibehub/projects/evoview/skills/evoview-architecture/SKILL.md`.
Orchestrator's before-shots (1440):
`~/.vibehub/documents/evoview-library/tchin-refine/orchestrator/*.png`.

## Evidence (orchestrator, 1440, current HEAD)

- Root cause: scenes put their desk (setting pills + sentence) in the
  `ShowcaseVariant` body *above* a component that brings its own tone, with
  the variant left without `tone`. The desk therefore renders on the previous
  scene's ground and the tone cut falls between a desk and the component it
  drives.
- Chapter page: FAQ desk ("Mise en page" + sentence) sits on the dark tail of
  the story scene, and the FAQ has no caption at all; contact desk labels touch
  the light→dark cut (no air), contact has no caption, its sentence floats
  right; the story scene ends on ~300 px of dead dark air; the specimen hint
  line reads as the top of the story scene.
- Card page: caption voices differ per scene (readout names `CARDTRACK ·
  RIBBON`, `CARDDECK`, `CARDSEQUENCE` vs the chapter page's title captions vs
  none); the deck desk starts on a different left edge (≈170) than its caption
  (135); each scene has its own desk copy (`chd-desk`, `chs-desk`, `cdk-desk`,
  faq/contact/sequence variants) with different spacing; `CardTrack` still
  shows a `01 / 04` counter (forbidden counting tag).

## Rules for every agent

- Founder rules (binding): no monospace/technical-readout type; no separating
  lines between content (spacing, scale, tone); text lists on subtle tonal
  surfaces; no counting tags or kickers; chained animations as one continuous
  sequence; every showcase switch option must visibly change the layout in
  every combination, else cut it; demo content true to the section's role.
- Edit only, never Write over a file you did not create. `src/library/
  ShowcasePage.tsx`, `art.tsx`, `library.css` and `docs/SHOWCASE-CONTRACT.md`
  carry **another session's uncommitted work** (player video + veil): never
  revert, reformat or overwrite it; touch those files only when the fix is
  genuinely a frame-contract fix, with minimal hunks, and list the hunks in
  your reply.
- Do not edit the Tchin project, `components/foundation|controls/**` (report
  needs; trivial local workarounds allowed), other packages.
- **Do not commit, do not bump `VERSION`.** Add CHANGELOG lines under
  `## Unreleased` (config changes listed explicitly). The orchestrator reviews,
  commits and versions per phase.
- Build under concurrency: typecheck `pnpm exec tsc -b`; production check
  `pnpm exec vite build --outDir /tmp/<agent>-dist` (+ `vite preview --outDir
  … --port <free>` when needed, stop only your PID); `pnpm verify:chapter`
  for chapter changes (`verify:ssr` covers modal packages only). Never
  `pnpm build`/`pnpm dev`. Showcase
  `https://evoview-library.said.bet` (vhdev; `vhdev up` if 502). HMR remounts
  under concurrent edits: confirm intermittent bugs on your preview build.
- Verify at 1440, 1024, 390: every switch combination, FR/EN, palette swatches
  (yellow, near-white, indigo) recolour live, no horizontal overflow,
  keyboard/focus, hover vs touch, pause model, 10 cold reloads. Reveals need
  scroll + wait. Screenshots to
  `~/.vibehub/documents/evoview-library/tchin-refine/<agent>/` and Read them;
  never claim a visual check you did not do.

## Phase 1 · spacing, segmentation, clarity

Own: `Chapter.tsx`, `Card.tsx`, every scene file and scene CSS under
`src/pages/library/{chapter,card}/`, `components/{chapter,card}/showcase.css`;
package CSS only where a component's own outer spacing is the cause.

- Each scene reads as one unit: caption (what it is, when a client picks it)
  → desk (settings + one sentence) → component, all on the component's ground.
  The tone cut sits *between scenes*, never between a desk and its component
  or between a caption and its component. Spacing bands per RULES §3
  (internal / neighbour / chapter) and the frame's lead/chapter bands.
- One caption voice and one desk pattern for every scene on both pages
  (factor a shared showcase desk; same rail, same left edge, same air).
- Make each scene self-contained so phase 2 can reorder scenes and change
  default toggles (component tone) without breaking a seam: the ground of a
  scene must follow its component's tone whatever the neighbours are.
- Kill dead air and orphaned lines; check phones (desk stacking, pill wrap).
- Do not reorder scenes or change defaults; note what you would order.

## Phase 2 · section order and defaults

Own: same files as phase 1. Decide the sequence of every scene on both pages
and the default value of every switch, for a smooth delivery: the first
viewport teaches the package (RULES §12); the order follows how a real client
page unfolds (opening chapter → story → content → contact → footer, cards from
the simplest track to the richest composition); tones alternate or continue
deliberately so every seam is a clean cut or an intended continuation; the
default state of each scene is its strongest, most representative setting and
suits its neighbours. Keep phase 1's spacing contract intact at every seam
(re-shoot every seam). Removing a scene is out of scope: propose it.

## Phase 3 · optimisation

Own your component files (+ CSS) in the package, your config slice, your
scene's behaviour wiring; shared package files (`index.ts`, config, `types.ts`,
README, SKILL, CHANGELOG) Edit-only in your own block. Keep phase 1–2 page
layout, order and defaults; report disagreements instead of changing them.

- Performance: scroll/rAF work gated by visibility, passive listeners,
  transforms only, no layout thrash; media `sizes`/`srcset`, decoding, lazy
  below the fold, one playing video at a time, preload by need, no CLS;
  measure (Performance trace or rAF timing) before and after.
- Correctness: cold reloads, StrictMode double effects, resize, locale and
  palette changes, reduced motion, hidden tab, SSR/crawlability
  (`verify:chapter`), a11y names and focus.
- Code: reuse foundation/controls instead of local copies, dead code and
  duplicated CSS removed, types tight, README/SKILL accurate to behaviour.

## Reply

What you changed and why (short), before/after screenshot paths per width,
files touched (list any `src/library/*` hunks), CHANGELOG lines added, checks
run with results, anything unverified or deferred, recommendations for the next
phase.
