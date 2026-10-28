---
name: evoview-controls
description: Evoview control language as React components — primary plate with arrow orb, text action, glass close / pager, option chips and rows (single / multi with max), tags, badges, step marks, underline fields, switch, segmented control, segmented progress — accent-driven from the host --primary. Use when a client page or an Evoview library package needs buttons, choices, form fields or progress in the Evoview style. Triggers on "evoview controls", "evoview button", "primary plate", "option chips", "underline field", "segmented progress".
---

# Evoview controls

Package: `/root/.vibehub/projects/evoview-design-library/components/controls/`
Showcase: `https://evoview-library.said.bet/components/controls`

Read `README.md` (Signature / Variations / Expression, API) and the
library's `STRATEGY.md` first; the foundation README covers tokens and the
pause model.

## Ownership (RULES §13)

- **Preserve** (README "Signature"): two action weights, radius by role,
  multi-signal selection, underline fields, segmented progress, glass for
  chrome only, liquid orbs, press jelly. Changes go into the library.
- **Select** (README "Variations"): which piece does the job and its size;
  no option arrays.
- **Invent** (README "Expression"): labels, accent, tone, content.

## Procedure

1. Open the showcase at 1440 and 390; switch the palette to the client's
   accent and to a yellow / off-white to see the light-accent behaviour.
2. Install: `sync.sh plan /root/.vibehub/projects/<client> controls`, then
   `apply`, then `verify` (library root, `docs/SYNC.md`); resolve conflicts,
   fill patch reasons. Client tokens go in `controls.theme.css`.
3. Edit only `src/components/controls/controls.config.tsx` (labels; reuse the
   client's i18n wording). Mount `ControlsProvider` once if the site is
   multilingual.
4. Wrap the area in a tone class (`ev-tone-dark` / `-light` / `-paper`).
   Check the host `--primary` / `--primary-foreground`; fix those tokens
   rather than restyling the controls.
5. Verify with the README checklist, then log an activity record
   (`surface: code`, `type: feature`, subject = the client project) with the
   package version.

## Rules

- One primary plate per screen; secondary actions are `GhostAction`.
- Do not swap in the client's UI-kit buttons or boxes around fields.
- Orbs (plate orb, check orb, chip mark, done step) change colour only
  through foundation `OrbFill`'s liquid rise; restyle them via the
  `--ev-orb-*` tokens, never with a `background` swap.
- No Evoview mark inside controls or next to a client CTA; the one linked
  mark belongs to the host component's header strip.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients upgrade through `sync.sh`; a client-side edit is
  a recorded patch (`.evoview/patches/`), a candidate for the library.
- Respond in English even when the client interface is French.
