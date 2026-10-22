---
name: evoview-story-blocks
description: Evoview editorial story blocks for client pages and dossiers — title/lead split over a 16:10 hero proof with in-media caption, numbered rows (48/132/1fr), asymmetric 7/5 ↔ 5/7 proof grid, ruled pillars, payoff band with one CTA — open chapters separated by spacing, hairlines and alternating bands, accent-driven from the host --primary. Use when a client page needs to tell a story, a case, a process or a closing call to action in the Evoview style. Triggers on "evoview story", "story blocks", "story intro", "indexed rows", "proof grid", "payoff band", "ruled pillars".
---

# Evoview story blocks

Package: `/root/.vibehub/projects/evoview-design-library/components/story-blocks/`
Showcase: `https://evoview-library.said.bet/layouts/story-blocks`

Read `README.md` ("What is Evoview", API, verification) and the library's
`STRATEGY.md` first; the foundation README covers tokens and the pause model.

## Procedure

1. Open the showcase at 1440 and 390 with the client's accent, then yellow
   and off-white, in both stories (dark, paper).
2. Write the story before choosing blocks: one subject, the proof media,
   the single next action. Typical order: intro → rows or proof → pillars →
   payoff. Drop blocks the content cannot fill; do not pad.
3. `components/story-blocks/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades `foundation` and `controls` first).
4. Edit only `src/components/story-blocks/story-blocks.config.tsx`: media
   labels in the site languages and the client's stories (or pass props
   from the page). Real media in `public/`, ratios chosen per artefact,
   `positionPhone` checked for the 4:5 crop.
5. Mount `<Story tone=… copy={config.copy} chapters={…} />` per story. Check
   the host `--primary` / `--primary-foreground`; fix those tokens rather
   than restyling the blocks.
6. Verify with the README checklist at 1440, 1024, 390, then log an
   activity record (`surface: code`, `type: feature`, subject = the client
   project) with the package version.

## Rules

- One title per story, one heading per chapter, 2–3 meaning-broken lines.
- Exactly one CTA per story (the payoff plate) with an honest consequence
  label; it points to the client's main action, never to Evoview.
- No Evoview mark in these blocks (no chassis); never beside the CTA.
- Payoff results must be true; demonstrations say "exemple fictif" visibly.
- Keep the protected proportions, open chapters, indices, media-first phone
  order and reveal timings; adapt content, media, accent, tone, rhythm.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients re-run `install.sh`.
- Respond in English even when the client interface is French.
