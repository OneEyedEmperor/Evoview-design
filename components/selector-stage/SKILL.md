---
name: evoview-selector-stage
description: Evoview selector-stage chapter for client sites — joined selector rows driving a 4:3 stage (chip strip on phone, optional paused autoplay), before/after CompareToggle (same-frame wipe, or two alternatives side by side), ProofAtlas (main frame + graded thumbnails). Use when a client page must compare or demonstrate one variable at a time (finishes, menus, formulas, before/after renovation or plating, views of a project). Triggers on "evoview selector stage", "before after", "compare toggle", "proof atlas", "selector stage".
---

# Evoview selector stage

Package: `/root/.vibehub/projects/evoview-design-library/components/selector-stage/`
Showcase: `https://evoview-library.said.bet/components/selector-stage`

Read `README.md` ("What is Evoview", API) and the library's `STRATEGY.md`
first; `foundation` and `controls` READMEs cover tokens, the pause model and
the control language.

## Procedure

1. Open the showcase at 1440 and 390 with the client's accent, then yellow
   and off-white. Pick the piece that fits the claim: one variable among N →
   `SelectorStage`; a transformation (before / after, same camera) →
   `CompareToggle`; two alternatives the visitor weighs together (two
   proposals, two logos, two offers) → `mode="pair"` — not for before/after;
   several frames of one world, where the pictures are the choice →
   `ProofAtlas`.
2. `components/selector-stage/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades `controls` and `foundation` first).
3. Edit only `src/components/selector-stage/selector-stage.config.tsx`:
   the client's chapters in FR / EN (heading = two short lines, body ≤ 2
   sentences, one `detail` sentence per option), its media in `media/`
   (4:3 for stages, ≥ 1200px wide webp, matched framing for compares —
   same camera, one variable changed), specimens as `render` nodes. Delete
   unused reference media. If content is illustrative (renders, fictional
   case), say so once on the page via one chapter's `note`; never repeat it
   under every chapter.
4. Mount each chapter with `tone` matching the page's chapter sequence (hard
   tone cuts, no mid-grey). Use `chapter={false}` inside an existing section.
   Autoplay only when the options form a sequence worth watching.
5. Verify with the README checklist, then log an activity record
   (`surface: code`, `type: feature`, subject = the client project) with the
   package version.

## Rules

- One display level per chapter; captions inside the media; selection stays
  multi-signal. Do not box the heading or swap rows for the client's tabs.
- No rules between rows, columns or captions: spacing separates; the only
  line in a scene is information (autoplay progress). No `≠` or other
  ornament on the pair seam.
- Keep the splits (`.70/1.30`, `1.22/.78`) and the phone mechanism change.
- No Evoview mark in this chapter; the one linked mark lives in the host's
  chrome, never next to a client CTA.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`); clients re-run `install.sh`.
- Respond in English even when the client interface is French.
