# Tchin extraction — shared brief

Five agents extract sections from the Tchin Tchin restaurant site (Evoview
client work) into two library packages. Each agent owns one scope (its task
message names it). Per section: **extract** (measure + inventory),
**normalize** (to RULES), **adapt** (package component + config slice +
showcase scene).

## Source (read-only)

- Project `test`: `/root/.vibehub/projects/test`. Live dev:
  `https://resto-tchin.said.bet` (`/`, `/karaoke/`). **Never edit, stage,
  build or restart anything there.** Read its `CLAUDE.md` "Project knowledge"
  first: visual-QA tips (reveals need scroll + wait, cookie banner via eval)
  and the founder-approved behaviours (deck deal, mosaic drift, seamless
  loops, spacing rules) that explain *why* sections look the way they do.

| Scope (agent) | Source | Target |
| --- | --- | --- |
| chapter-story | Home "Un Goût du Vietnam au Cœur de Bruxelles" (`sections/AboutSection.tsx`, `.css`, `story-mosaic.ts`) | `chapter` package; scene `src/pages/library/chapter/StoryScene.tsx` |
| chapter-contact | Home contact (`sections/ContactSection.tsx`, `.css`, `data/restaurant-info.ts`) | `chapter`; `chapter/ContactScene.tsx` |
| chapter-faq-footer | Karaoke "Tout Ce Que Vous Devez Savoir" (`karaoke/FaqSection.tsx`, `data/karaoke-data.ts`) + site footer (`layout/Footer.tsx`, `.css`) | `chapter`; `chapter/FaqScene.tsx`, `chapter/FooterScene.tsx` |
| card-deck | Home "Un Voyage Culinaire" menu cards (`sections/MenuSection.tsx`, `.css`) | `card` package; `src/pages/library/card/DeckScene.tsx` |
| card-sequence | Home karaoke clip board (`sections/KaraokeSection.tsx`, `.css`) + karaoke "Vivez l'Expérience" (`karaoke/VideoGallery.tsx`, `.css`, `media/MediaWatermark.tsx`) | `card`; `card/SequenceScene.tsx` |

"Section pacing" = `chapter` (`/layouts/chapter`). "Card" = `card`
(`/layouts/card`, renamed from `card-track`; `CardTrack` and `MediaCard` stay
inside it).

## Read first

`CLAUDE.md`, `STRATEGY.md` (incl. "Reference: Tchin Tchin karaoke video
cards"), **`docs/RULES.md` (binding)**, `docs/SHOWCASE-CONTRACT.md`,
`docs/BUILD-BRIEF.md` + `docs/REFINE-BRIEF.md` (package shape, quality bar),
`components/foundation/README.md`, `components/controls/README.md`, your
target package README/CHANGELOG/src, the current showcase page
(`src/pages/library/Chapter.tsx` or `Card.tsx`), and
`/root/.vibehub/projects/evoview/skills/evoview-architecture/SKILL.md`
(mandatory lens).

## 1 · Extract

Look at the live section at 1440 and 390 (agent-browser; Read the PNGs),
then read its source. Write `docs/extraction/tchin-<scope>.md` (short,
measured): structure, rendered type/space/radius values, states, motion
(timings, easing, sequence, pause/visibility gates, hover vs touch), mobile
behaviour, media handling, a11y. Mark each trait **keep** (Evoview
authorship: choreography, composition, interaction quality), **map**
(Tchin skin → library token/control) or **drop** (Tchin-only or a RULES §8
motif). Flag source bugs instead of copying them.

## 2 · Normalize

- RULES §8: drop CRT/`dim-crt*` layers, noise, flicker, scanlines, gold
  text gradients, `stage-gradient` blobs, script/display fonts (Ninja),
  Tchin icons-as-decoration. The channel switch (RULES §6) is the one
  allowed signal effect: use foundation `ChannelSwitch`, not Tchin's copy.
- Type = foundation's three voices; colour = `--primary` → package accent
  tokens; radius by role; spacing bands; foundation clocks/pause hooks
  (`useSequenceClock`, `useInViewPause`, `useMediaReady`…) and controls
  (`SegmentedControl`, `PrimaryPlate`, `GhostAction`, chips, rows…). Never
  re-implement a control, token or clock that exists.
- Founder rules (binding, from memory): no monospace/technical-readout
  type; no separating lines/hairlines between content (spacing, scale,
  tone); text lists sit on subtle tonal surfaces (tiles or alternating
  rows, no borders); no counting tags or kickers (no `01 / 04`, no small
  labels above titles; order = bare number in a round orb); chained
  animations flow as one sequence with no dead gap; one hover entry point
  per navigation.
- Keep accessibility and crawlability: real headings, links, `aria-*`;
  content that is collapsed (FAQ answers, week hours) stays in the DOM and
  server-renderable.

## 3 · Adapt

- **Component** in the package `src/` (own file + CSS file, own root class
  `ev-<pkg>-<thing>` scoped under `.ev-root`, `--<pkg>-*` tokens mapped
  from host tokens with fallbacks), exported from the package `index.ts`.
- **Config slice** in `<pkg>.config.tsx` (the only per-site file): typed
  FR/EN content + media for your component, inside a clearly delimited
  block. Keep existing keys working.
- **Variants = real client choices**, switchable on the showcase with pill
  toggles (controls `SegmentedControl`, same desk pattern as the chapter
  specimen `chd-desk` so pages stay consistent). Showcase rule: every
  option must *visibly change the layout* in every combination with the
  other switches; a state that only nudges size/padding is cut. Ship the
  Tchin original as one of the variants (normalized).
- **Demo content**: the page's existing fictional client, adapted to your
  section's role — chapter page: studio **Halde** (Ghent, architecture);
  card page: **Atelier Sorel** (architecture & interiors). Content true to
  the section's role (no CTA where the section has none). FR + EN.
- **Media**: reuse `public/library/card/*` (5 mp4 loops, 10 webp),
  `public/library/{story-blocks,dossier}/*`; generate more only if needed
  (`nano-banana-pro` skill → small webp, short loops via ffmpeg, ≤ ~150 KB
  per image, ≤ ~1.5 MB per loop) into `public/library/<pkg>/`. **Never**
  copy Tchin's assets (logo, comic art, dish photos, cocktail/karaoke
  clips, fonts, copy).
- **Attribution** (RULES §9, STRATEGY): at most one linked Evoview mark per
  component, from config, in a header/chassis strip, never beside a client
  CTA; extra marks (e.g. Tchin's media watermark) decorative, `aria-hidden`,
  ≤ .12 opacity. Keep the existing `ChapterFooter` credit working.
- **Docs**: add your component's section to the package `README.md`
  (files, config, adaptation levers, protected signature vs client-changeable,
  desktop/mobile, pause model, verification) and `SKILL.md` (install/adapt
  steps); add your entry under `## Unreleased` in `CHANGELOG.md` (list
  config changes explicitly). Do not touch `VERSION`.

## File ownership (concurrent agents — read carefully)

- **Exclusive** (yours): your component files and CSS in the package
  `src/`, your scene file under `src/pages/library/{chapter,card}/`, your
  extraction doc, your new media folder/files.
- **Shared within your package** — `index.ts`, `<pkg>.config.tsx`,
  `types.ts`, `README.md`, `SKILL.md`, `CHANGELOG.md`: **Edit only, never
  Write over them**, small additive edits in your own block, re-read right
  before each edit, never reformat or reorder others' lines.
- **Page files** `Chapter.tsx` / `Card.tsx` are orchestrator-owned; they
  already mount your scene. Exception: chapter-faq-footer may change the
  `<ChapterFooter …/>` line inside the `chd-page` variant. If you need
  another change there (order, removal of an existing scene), ask.
- **Do not edit**: `src/App.tsx`, `src/library/*` (another session is
  redesigning the shell right now), `docs/*` other than your extraction
  file, `components/foundation|controls/**`, other packages, the Tchin
  project. Need a foundation/controls change? Work around locally if
  trivial and report it.
- Your scene renders its own `ShowcaseVariant`(s) (see contract) and
  reads `useLibraryLocale()`; colour from the frame's `--primary` only.

## Build & verify under concurrency

- Don't run `pnpm build` (it writes the shared `dist/`). Typecheck with
  `pnpm exec tsc -b`; a production preview, when needed, with
  `pnpm exec vite build --outDir /tmp/<scope>-dist` + `pnpm exec vite
  preview --outDir /tmp/<scope>-dist --port <free port>` (stop only your PID).
- Errors in files you don't own: don't fix them; wait and retry, or report.
- Showcase: `https://evoview-library.said.bet` (vhdev; `vhdev up` if 502,
  never `pnpm dev`). Concurrent edits cause HMR full reloads/remounts —
  confirm intermittent bugs on your preview build before chasing them.
- Verify at 1440, 1024, 390: layout per RULES, every pill combination,
  keyboard/focus, hover vs touch, pause model (scroll away, hidden tab),
  palette swatches recolour live (yellow, near-white, indigo), FR/EN, no
  horizontal overflow, type floors, 10 cold reloads. Screenshots:
  `~/.vibehub/documents/evoview-library/tchin/<scope>-<state>-<width>.png`
  — Read them; never claim visual checks you did not do.

## Commit & reply

**Do not commit** (shared files across agents); the orchestrator reviews
and commits per package. Reply with: extraction doc path; keep/map/drop
summary; component API (type snippet) and config slice; variants and what
each changes; verification per width with screenshot paths; foundation /
controls issues; anything unverified or deferred.
