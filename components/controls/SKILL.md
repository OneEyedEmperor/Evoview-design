---
name: evoview-controls
description: Evoview control language as React components — primary plate with arrow orb, text action, glass close / pager, option chips and rows (single / multi with max), tags, badges, step marks, underline fields, switch, segmented control, segmented progress — accent-driven from the host --primary. Use when a client page or an Evoview library package needs buttons, choices, form fields or progress in the Evoview style. Triggers on "evoview controls", "evoview button", "primary plate", "option chips", "underline field", "segmented progress".
---

# Evoview controls

Package: `/root/.vibehub/projects/evoview-design-library/components/controls/`
Showcase: `https://evoview-library.said.bet/components/controls`

Read `README.md` ("What is Evoview", API) and the library's `STRATEGY.md`
first; the foundation README covers tokens and the pause model.

## Procedure

1. Open the showcase at 1440 and 390; switch the palette to the client's
   accent and to a yellow / off-white to see the light-accent behaviour.
2. `components/controls/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades `foundation` first).
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
- Keep the anatomy (marks, indices, orb, underline, equal segments); do not
  swap in the client's UI-kit buttons or boxes around fields.
- Selection must stay multi-signal; never ship a colour-only state.
- No Evoview mark inside controls or next to a client CTA; the one linked
  mark belongs to the host component's header strip.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients re-run `install.sh`.
- Respond in English even when the client interface is French.
