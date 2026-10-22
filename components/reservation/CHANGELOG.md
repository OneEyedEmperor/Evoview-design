# reservation changelog

## 2.6.0 — neutral reference = Tchin setup

- Reference config rewritten as a neutral copy of the Tchin Tchin setup:
  "Maison Exemple", table / private room / table then room, icons on every
  row (lucide `UtensilsCrossed`, `DoorOpen`, both together for the combo,
  inheriting the row colour), room duration in hours (no end times), guests
  1–12 with "+12", Tchin's copy tone ("Table, salon, ou les deux ?",
  "On confirme ?").
- Showcase opens on "Référence": same page as Tchin's, neutral (plain dark
  background, off-white accent standing in for the client colour).
- Tchin example: own guests/contact copy (+15) on top of the reference.
- Config changes: none in the contract. The reference config now imports
  `lucide-react` (replace the icons with the client's navbar marks).

## 2.5.0 — client icons on experience rows

- `experiences[].icon` is now a `ReactNode` (was a component): one or more
  icons in their own colours, side by side, replacing the Evoview eye glyph.
  Use the client's navbar marks so the form speaks the site's language.
- Tchin: Carte (`Soup`, #f97316), Karaoké (`Mic`, #c08cf0), combo shows both.
- Config changes: `icon` type `ComponentType` → `ReactNode` (breaking for
  configs that passed a component: pass `<Icon />` instead).

## 2.4.0 — durations instead of end times

- New `experiences[].hours: { options, withinWindow? }`: after the start
  time, asks "how many hours" (pills `01 heure`, `02 heures`…) instead of an
  end time. `withinWindow` drops durations past the window's close and hides
  start times that can't fit the shortest one. Submitted as `request.hours`;
  recap shows `20:00 · 2 h`.
- Reference private room and the Tchin example use `hours`; Tchin asks no end
  time anywhere (owner request: end times generated too many questions).
  Tchin's `submit` derives `preferredEndTime` = start + hours for karaoke_only
  (API requires it) and puts the hours in `notes` for restaurant_then_karaoke.
- Config changes: `experiences[].hours`, `copy.hoursLabel`, `copy.hoursUnit`
  (optional), `ReservationRequest.hours`. `requiresEndTime` still exists;
  prefer `hours` for client-facing forms.

## 2.3.0 — compact guests, "+max" option

- Narrow containers (≤ 520px): the guests step is a grid of number orbs
  (`01`…`15`, `+15`) instead of a list of labelled pills; wide layouts keep
  the pills.
- New `guests.overflow`: adds a final "+max" choice. It submits
  `guests: max` with `guestsOverflow: true` (APIs that cap the party size keep
  validating); recap shows "+max …". Tchin maps it to a "Groupe de plus de 15
  personnes" prefix in `notes`.
- Question and confirmation titles keep `? ! : ;` on the previous word (nbsp).
- Config changes: `guests.overflow` (optional), `ReservationRequest.guestsOverflow`.

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
