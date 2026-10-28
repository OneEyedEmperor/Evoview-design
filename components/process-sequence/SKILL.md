---
name: evoview-process-sequence
description: Evoview process-sequence — a timed step board (split heading with segmented instrument, three-state step cards drawn by frame + paper inversion, Z-order column stacks, phone index + monitor) and its step dossier modal, accent-driven from the host --primary. Use when a client page needs to present a method, process, timeline or "how we work" section in the Evoview style. Triggers on "evoview process", "process sequence", "méthode", "how we work section", "step board", "timed steps".
---

# Evoview process-sequence

Package: `/root/.vibehub/projects/evoview-design-library/components/process-sequence/`
Showcase: `https://evoview-library.said.bet/layouts/process-sequence`

Read `README.md` (Signature / Variations / Expression, behaviour) and the
library's `STRATEGY.md` first. The component serves the client (explain the
process, lead to its CTA) and is an Evoview publicity asset (signature
choreography + the approved mark in the dossier stage). Keep both.

## Ownership (RULES §13)

- **Preserve** (README "Signature"): split heading + locking captions, one
  timed active step, Z stacks, state as frame (active = contrast), phone
  index + monitor, the 5/12 : 7/12 dossier, motif replacements, the stage
  mark. Changes go into the library, never the client.
- **Select** (README "Variations"): `COMPLETION_MARKS`, `autoplay`,
  built-in dossier or `onOpen`.
- **Invent** (README "Expression"): steps (3–6), copy, media, marks,
  durations, CTA, tone, accent.

## Procedure

1. Open the showcase at 1440 and 390; switch the palette to the client's
   accent, then yellow / off-white, to see light-accent behaviour.
2. Install: `sync.sh plan /root/.vibehub/projects/<client> process-sequence`,
   then `apply`, then `verify` (library root, `docs/SYNC.md`); resolve
   conflicts, fill patch reasons. Client tokens go in `process-sequence.theme.css`.
3. Edit only `src/components/process-sequence/process-sequence.config.tsx`:
   the client's 3–6 real steps (titles ≈ 20 chars, one-to-two-sentence
   summaries, dossier items ≤ 42 chars), real media per step (webp ≤ 150 KB
   or short muted video + poster, ≥ 1200px wide, the same visual family),
   completion marks (client icons as stroke SVG, or `check` / `numeral`),
   the CTA destination (verified, the site's main action), FR / EN copy.
   Keep `durations` at 4 / 4 / 4 / 6 s unless the client asks; keep
   `attribution.enabled: true`.
4. Mount `<ProcessSequence config={…} tone="dark" | "light" />` as its own
   chapter (it pads itself; `chapter={false}` inside a padded section). Check
   the host `--primary` / `--primary-foreground`; fix tokens rather than
   restyling the board.
5. Crawlable views (README "Crawlable views", library
   `docs/CRAWLABLE-MODALS.md` §7): give each step dossier a URL. One route
   renders the page on its base and `<base>/<step id>/`; the page holds
   `view` (seeded once with `viewFromPath`) and passes `view`, `onNavigate`,
   `hrefFor = routeHrefs(base, processSequenceRoutes.key)`. Prerender
   `[null, ...processSequenceRoutes.views(config)]` per locale with
   `head(config, view)` for title / description / canonical / hreflang /
   JSON-LD and `ROUTE_LAYER_NOSCRIPT_CSS`; the page's own h1 becomes h2 on
   view URLs. Step ids must be URL slugs.
6. Verify with the README checklist (1440 / 1024 / 390, one full cycle,
   pause on scroll-away and dossier, keyboard, palette, and the crawlable
   checks: no-JS crawl of every view URL, Back / Forward / Escape, Ctrl-click,
   deep link), then log an activity record (`surface: code`, `type: feature`,
   subject = the client project) with the package version.

## Rules

- Do not convert to equal-height rows, a 50/50 modal, or four stacked cards on
  phone; do not let hover change the phase.
- One board per method. A shorter process is a different config, not a
  second board on the same page.
- One linked Evoview mark, in the dossier stage strip; never next to the CTA,
  never invent another destination or add tracking.
- Never mount the dossier's copy behind its media gate or re-add `inert`,
  loaders or video sources to server HTML; the dossier heading stays the
  view's only h1.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients upgrade through `sync.sh`; a client-side edit is
  a recorded patch (`.evoview/patches/`), a candidate for the library.
- Respond in English even when the client interface is French.
