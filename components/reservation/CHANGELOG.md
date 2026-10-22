# reservation changelog

## 2.2.1

- Recap ticket background: neutral `#121214` (same as the option rows)
  instead of the blue-black screen; only the accent glow remains. No config change.

## 2.2.0 — cleaner recap ticket

- Ticket: phosphor/scanline overlays and HUD corners removed; status and
  venue name stacked on the right edge (venue under the status).
- Reference/Tchin contact step titled "On confirme ?" / "Shall we confirm?".
- Config changes: `venue.place` removed (no longer displayed).

## 2.1.0 — client accent, single column

- Accent now comes from the host's `--primary` / `--primary-foreground`
  (Evoview indigo only as fallback): marks, selections, progress, glows, CTA
  hover and the confirmation emblem's iris all follow the client.
- Side dossier removed (rail, monitor, journey list): it is exclusive to
  evoview.be. Single column at every width; the recap ticket stays on the
  contact step and confirmation; the header progress is clickable to jump
  back to answered steps. Mount in a ~900px column.
- Config changes: removed `copy.dossier`, `copy.stepsWord`,
  `copy.remainingWord`, `copy.pending`; added `accentInk`. `accent` is now an
  override of the host token.

## 2.0.0 — rebuilt on the Evoview application chassis (breaking)

The 1.x form kept Tchin Tchin's look with an Evoview seal attached. 2.0.0
is an Evoview component end to end, modelled on evoview.be's candidature flow:
header strip with the wordmark, one question per screen with circled step
marks and auto-advance, eye-glyph experience rows, pill chips, Evoview
calendar and underline fields, white plate CTA, live dossier (segmented rail,
CRT ticket, journey list), ring-eye confirmation. Fonts bundled. The seal is
gone; the header wordmark is now the `https://evoview.be/` link.

Config changes:

- New required: `venue: { name, place? }`.
- `copy` reshaped: added `kicker`, `steps.{experience,date,guests,time,contact}.{title,hint,short}`,
  `guestsUnit`, `optional`, `next`, `back`, `chooseToContinue`, `dossier`,
  `stepsWord`, `remainingWord`, `pending`, `statusDraft`, `statusSent`,
  `confirmationKicker`. Removed `experienceLabel`, `dateLabel`, `guestsLabel`,
  `timeLabel`, `contactLabel`, `notesOptional` (→ `optional`),
  `signatureLead`.
- `experiences[].icon` optional (defaults to Evoview eye glyphs).
- `ReservationWindow.label` (optional) titles each slot group.
- `accent` defaults to Evoview indigo and no longer reads the host `--primary`;
  `accentForeground` removed. `--resa-*` tokens renamed.
- `install.sh` now removes files dropped from the package on upgrade.

## 1.0.0 — extracted from Tchin Tchin, Evoview signature added

- Portable version of Tchin Tchin's `UnifiedBookingForm` + its glass card:
  same five-step reveal, sizes and states, now on scoped CSS
  (`.evo-resa`, `--resa-*` tokens mapped from shadcn/Tailwind v4 host tokens)
  and an unstyled `react-day-picker` calendar. No shadcn/Tailwind/sonner
  dependency.
- New: Evoview signature seal on the card's bottom edge, linking to
  `https://evoview.be/` in a new tab.
- Site data behind `ReservationConfig`: copy, experiences (`requiresEndTime`,
  `timeNote`), `windows(date)`, `slotMinutes`, `guests`, `maxDaysAhead`,
  `submit`, `onMount`, `onResult`, `accent`, `accentForeground`, `vars`.
- Installed in Tchin Tchin (`test`), replacing `components/booking/UnifiedBookingForm.tsx`.
