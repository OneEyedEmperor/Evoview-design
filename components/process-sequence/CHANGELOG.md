# process-sequence changelog

## 1.1.1

- `chapter={false}` now also leaves the background and the top light spill
  to the host (transparent root, floor bloom only), so the board sits inside
  a host chapter without a tone seam. No config changes.
- Showcase: the board mounts with `chapter={false}`; the frame owns the
  header → board spacing (`--lib-lead`).

## 1.1.0

Refinement: every element now carries state or content once.

- Card: removed the "En cours…" status pill, the active `01 / 04` corner
  readout, the idle "À venir" label and "—" dash, the hover tilt + pointer
  glow and the completion shine. State is the frame, the ribbon and the
  mark; idle shows only the muted numeral. Hover = picture push (fine
  pointer). Status words remain in each card's accessible name.
- Phone index: status readouts replaced by a check on completed steps
  (spoken status kept); an odd step count closes the grid with one
  full-width control.
- Dossier: removed the "Étape 2 sur 4" kicker (desktop) and header readout
  (phone); phone progress row = cells only. Hairlines removed (stage seam,
  objective rule, header / footer rules, item borders) — spacing and tone
  separate instead.
- Fix: instrument captions no longer replay their lock animation on every
  jump (keyed by step, not cycle). Removed render-time ref mutation (shine
  queue).
- `StepCard` props: `total`, `statusLabels`, `shineDelay` removed;
  `statusLabel` added. No config changes (`copy.status` is now spoken only).
- Showcase: single dark demo; the three-step light variant and the note
  strips are gone. Light tone stays in the API (`tone="light"`).

## 1.0.1

- Requires `controls` 1.1.0: step dossier focuses its close button through the
  `GlassClose` ref; `index.ts` loads `../foundation`, `../controls`, then
  `process-sequence.css` (moved from `ProcessSequence.tsx`). No config changes.

## 1.0.0

- First release on `foundation` 1.0.0 + `controls` 1.0.0: `ProcessSequence`
  (split heading with `SegmentedProgress` + locking captions, 4/4/4/6 s clock
  under the pause model, neutral drain, Z-order column stacks with reserved
  height, three-state `StepCard`, phone index + monitor) and `StepDossier`
  (5/12 : 7/12 split, media gate, ←/→ / Esc, focus containment, phone full
  sheet, last-step CTA, Evoview mark in the stage strip).
- Config: `process-sequence.config.tsx` — `buildProcessSequenceConfig(locale,
  { media?, steps? })`; `steps[]`, `durations`, `completionMark`
  (`check` | `numeral` | `icon`), `copy` (FR / EN), `cta`, `attribution`.
