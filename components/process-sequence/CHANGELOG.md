# process-sequence changelog

## 1.8.0

Additive. Requires `foundation` ≥ 1.14.0 (paused `EvoviewMark`).

Config changes: `attribution.href` accepts `null` to pause the step
dossier's stage-strip mark while evoview.be isn't live (foundation
`EvoviewMark` paused state); the mark stays, named "Evoview" instead of
`copy.attributionLabel` (no "new tab" announced). Omitted `href` still links
`https://evoview.be/`. Existing configs render unchanged (same server HTML).

## 1.7.2

Fix. No config change, no visual change. Requires `foundation` ≥ 1.12.1
(the attribution `::before` hit area).

- Step dossier on phones (the well): the stage's `overflow: hidden` clipped
  the attribution's hit area to 80 × 43.7. Its `::before` is 48px tall there:
  80 × 44.5 inside the clip. The wordmark is unchanged.

## 1.7.1

Fix. No config change. Requires `foundation` ≥ 1.12.0 (`restoreFocus`).

- Closing the step dossier returns focus through `restoreFocus`: a launcher
  that became inert or hidden meanwhile hands focus to its disclosure's
  trigger instead of dropping it on `<body>`.

## 1.7.0

Requires `foundation` ≥ 1.10.0 (`useScrollLock`). No config changes, no CSS
changes.

- Fix: the step dossier's page scroll lock is applied before paint (was a
  post-paint effect) and keeps a classic scrollbar's width, so the page no
  longer reflows on open (centred content shifted right; near the page bottom
  the reflow also moved the page vertically). Through foundation's shared lock: ref-counted
  with every other foundation lock, `--ev-scroll-lock-gap` set while locked.
  Still released on unmount, after the exit. Suspension and focus unchanged.

## 1.6.0

- Sync (`docs/SYNC.md`): `evoview.json` (`requires` foundation `>=1.9.0 <2`,
  controls `>=1.5.0 <2`); `install.sh` wraps `sync.sh` (clean plans only;
  local edits merged and recorded as patches, files removed upstream deleted).
- Config changes: new client-owned `src/process-sequence.theme.css` (accent
  tokens, `--ev-modal-reserve-bottom`), imported by `index.ts` after
  `process-sequence.css`; created by the next sync, never overwritten.
  Existing config untouched; built CSS unchanged.
- Docs: ownership sections (RULES §13).
- API (additive): exported variation array `COMPLETION_MARKS`;
  `CompletionMark` now derives from it (unchanged). No config change.

## 1.5.0

Requires `foundation` ≥ 1.9.0 and `controls` ≥ 1.5.0 (press jelly). No
config changes, no CSS changes.

- Behaviour: the step dossier's media retry button and its controls take
  the press jelly (RULES §6). Index rows and cards are unchanged.

## 1.4.0

Config change: `copy.kicker` is removed (delete it from client configs).

- Heading is the title alone: no kicker readout, no `SectionMarker`
  (blinking dot in a square is evoview.be-specific).

## 1.3.2

Requires `foundation` ≥ 1.7.0. No config changes. Dossier item pills paint
`--ev-accent-wash` (same gradient, now a foundation token).

## 1.3.1

Requires `controls` ≥ 1.3.0 and `foundation` ≥ 1.6.1 (`install.sh`
installs both). No config changes, no API changes, same markup.

- `StepDossier`: the step cells are controls `SegmentedProgress` with
  `hrefFor` (the local link copy is gone) and the phone's previous pager is
  controls `PagerOrb` with `href`.
- Through foundation 1.6.1: a step URL reached by Forward after the page
  was left and re-entered (no bfcache) opens its dossier again.

## 1.3.0

Crawlable views (`docs/CRAWLABLE-MODALS.md`). Requires `foundation` ≥ 1.6.0.
No config changes; existing usage (no `view`, no `hrefFor`) keeps working.

- API: `processSequenceRoutes: ModalRoutes<ProcessSequenceConfig,
  ProcessSequenceView>` (`views`, `parent`, `key`, `parse`, `head`) and
  `type ProcessSequenceView = { step: string }` exported. Only steps with
  `detail` are views; `step.id` is the URL key (keep it a slug).
- `ProcessSequenceProps` gains `Partial<RouteViewProps<ProcessSequenceView>>`:
  `view` (controlled; `undefined` = the board keeps its own state),
  `onNavigate`, `hrefFor`, `history` (default true).
- `StepDossier` props added: `hrefFor(index)`, `canOpen(index)`, `onUp`,
  `closing` (host-controlled exit); `STEP_DOSSIER_EXIT_MS` exported. Without
  them it behaves as before (`onClose` after its own exit).
- `StepCard`: `href` added; `onOpen` now receives the card element.
- Behaviour: opening, stepping and closing the dossier keep browser history
  in step (`useRouteHistory`): open pushes, steps replace, close / Escape /
  backdrop go Back, so Back closes and Forward reopens. Without `hrefFor` the
  entries keep the current URL.
- Links: with `hrefFor`, the cards, the dossier's previous / next and its
  step cells are `<a href>` (plain click in-page, modified click opens the
  URL). Controls without a target (first step's previous, current cell) stay
  disabled buttons.
- Server rendering: the open step's copy renders from the first render and
  stays mounted (held, `HeldCopy`, until its media is decoded — the entrance
  starts at the same moment as before); the dossier root carries
  `data-ev-route-layer`; its title is the view's `h1`; `inert` on held parts,
  the loader and video sources only after hydration. Server layout = desktop.
- Dossier paging (keys, previous / next, cells) skips steps without `detail`;
  the CTA replaces "next" on the last step that has one. Unchanged when every
  step has a detail (the reference config).
- Keys work when focus has dropped to the page (after Back / Forward); Tab
  is pulled back into the dialog; Alt+← is left to the browser. After a step
  swap that drops focus, the close button takes it again.
- CTA with a same-page `#anchor`: closes the dossier (history unwound), then
  jumps; other hrefs navigate natively.
- Showcase: `/layouts/process-sequence/<step>/` opens that step's dossier on
  load.

## 1.2.0

Requires `foundation` ≥ 1.5.0 (`TextFill`) and `controls` ≥ 1.2.0. No config
changes, no API changes.

- Behaviour: the phone index numbers take their state ink (active, complete)
  as a liquid fill (RULES §1). Titles riding the active ribbon / button
  surface keep following it.

## 1.1.2

- Step dossier, ≥ 768: the windowed shell keeps `--ev-modal-reserve-bottom`
  (host, default 0) free below itself — lifted and height-capped — for host
  chrome pinned bottom-right. Same variable as `dossier`. Client default
  unchanged. No config changes.

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
