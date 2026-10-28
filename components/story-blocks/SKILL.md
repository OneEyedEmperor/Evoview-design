---
name: evoview-story-blocks
description: Evoview editorial story blocks for client pages and dossiers — title/lead split over a 16:10 hero proof with in-media caption, an indexed sequence beside its image or its heading, an asymmetric 7/5 ↔ 5/7 proof collage that can lead before its claim, a payoff band with one CTA — open chapters separated by space, scale, alignment and tone only (no rules, no zebra bands), text lists on quiet tonal tiles or joined rows, accent-driven from the host --primary. Use when a client page needs to tell an offer, a process, a place or a closing call to action in the Evoview style. Triggers on "evoview story", "story blocks", "story intro", "indexed rows", "proof grid", "proof collage", "payoff band".
---

# Evoview story blocks

Package: `/root/.vibehub/projects/evoview-design-library/components/story-blocks/`
Showcase: `https://evoview-library.said.bet/layouts/story-blocks`

Read `README.md` (Signature / Variations / Expression, API, verification)
and the library's `STRATEGY.md` first; the foundation README covers tokens
and the pause model.

## Ownership (RULES §13)

- **Preserve** (README "Signature"): spacing as separator, text lists on
  tone, the proportions, one subject per chapter, display ladder, one exit,
  reveal timings, no mark. Changes go into the library, never the client.
- **Select** (README "Variations"): which blocks in what order,
  `STORY_INTRO_ALIGNS`, `INDEXED_ROWS_SURFACES`,
  `PROOF_GRID_HEADING_POSITIONS`.
- **Invent** (README "Expression"): copy, media, ratios, spans, CTA
  destination, accent, tone.

## Procedure

1. Open the showcase at 1440 and 390 with the client's accent, then yellow
   and off-white: the dark story and the light-page close.
2. Write the story before choosing blocks: one subject, the proof media,
   the single next action. For each chapter name its primary subject (an
   image, a sequence, a statement); a chapter without one is cut. Typical
   order: intro → sequence → proof → payoff. Vary the shapes (sequence with
   its image, collage with the claim after it); do not stack the same
   composition twice. Drop blocks the content cannot fill; do not pad.
3. `components/story-blocks/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades `foundation` and `controls` first).
4. Edit only `src/components/story-blocks/story-blocks.config.tsx`: media
   labels in the site languages and the client's stories (or pass props
   from the page). Real media in `public/`, ratios chosen per artefact,
   `positionPhone` checked for the 4:5 crop. Captions say what the image
   proves, in one sentence; row `index` only when it is a real value.
5. Mount `<Story tone=… copy={config.copy} chapters={…} />` per story; a
   tone cut is a second `<Story>`. Check the host `--primary` /
   `--primary-foreground`; fix those tokens rather than restyling the blocks.
6. Verify with the README checklist at 1440, 1024, 390, then log an
   activity record (`surface: code`, `type: feature`, subject = the client
   project) with the package version.

## Rules

- Never add lines, cards or alternating backgrounds to separate chapters;
  space, scale, alignment and tone do it.
- Lists of text are never bare: they sit on the foundation list surfaces
  (built in). Pick `surface` per list: `"tiles"` for steps (default beside
  media), `"rows"` for schedules / timetables (default without media).
  Results are tiles. Never restyle the surfaces with borders or stronger
  contrast; if a list is short of content, cut it rather than pad it.
- One title per story, one heading per chapter, 2–3 meaning-broken lines.
- Exactly one CTA per story (the payoff plate), labelled with the action;
  it points to the client's main action, never to Evoview. Set a
  `consequence` only when the click does something the label doesn't say
  (leaves a dossier, opens another site); never restate the label.
- No Evoview mark in these blocks (no chassis); never beside the CTA.
- Payoff results must be true; client demonstrations say so visibly.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients re-run `install.sh`.
- Respond in English even when the client interface is French.
