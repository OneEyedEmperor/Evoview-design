# reservation changelog

## 2.9.0 — ReservationFlow, the short form

- New `ReservationFlow` export: a few chip questions then an e-mail, on a
  paper module in the controls language (the controls page "Flow · paper"
  scene, made real). For simple bookings; `Reservation` is unchanged.
- Now depends on `controls` (and `foundation`): `install.sh` installs them
  first.
- Config changes: `reservation.config.tsx` gains `buildReservationFlowConfig`
  (`ReservationFlowConfig` in `types.ts`). Existing clients keep their
  config on upgrade; copy the builder from the reference to use the flow.

## 2.8.1

- Reference config: one continuous service (12:00–22:30, closed Sundays), so
  the time step shows a single list instead of Midi / Soir groups. Split
  services remain supported (several labelled windows). Config changes: none.

## 2.8.0 — tap-to-validate on mobile

- Narrow containers (≤ 520px): steps 1–4 validate on tap, so the bar drops
  "Continuer" and shows only a small neutral "Retour" pill (no bar on step 1).
  The contact step keeps the full-width send plate.
- Re-tapping the current answer (experience, calendar day, start time) keeps
  it and moves forward, so going back never traps the guest. Calendar is
  `required` (a tap can't deselect the day).
- Showcase: the accent picker wraps into centred rows on mobile (no overflow).
- Config changes: none.

## 2.7.1 — showcase cleanup

- Showcase shows the reference only: the Tchin Tchin toggle and
  `examples/tchin.config.tsx` are removed (the live install in `test` is the
  adaptation example). The accent picker sits in the page flow under the
  header subtitle instead of a fixed bottom bar (it covered the CTA on mobile).
- Config changes: none.

## 2.7.0 — mobile pass

Tested at 320×568, 360×740, 375×667, 390×844, 412×915, 430×932 and 844×390
on the showcase and the live Tchin page, every experience, to confirmation.

- Narrow header: progress moved to the strip's bottom edge, full width, 44px
  segments (were 7×18); step readout no longer truncates at 320.
- Calendar on narrow: tile widened to 8px from the chassis edge, days fill it
  (≈ 44px at 390, were 32px), centred weekdays, 44px month arrows.
- Start / end times on narrow: even grid filling the row.
- Bar on narrow: `← RETOUR` (hidden on step 1) + message above a full-width
  white plate; no more wrapped, left-stranded "Envoyer la demande". Not sticky
  (see README).
- Revealed duration / end-time group scrolls into view on short screens.
- Step scroll also fires when the header sits under the host navbar;
  `overflow-anchor: none` removes anchoring drift.
- Contact: `inputmode`, `autocapitalize`, `enterkeyhint`, Enter → next field,
  failed send focuses the first invalid field, scroll margins for navbar and
  keyboard.
- Recap ticket values wrap instead of ellipsis ("Restaurant puis karaoké",
  "+15 personnes", long names).
- Headings balanced, hyphenated words kept whole ("serez-vous"); FR
  punctuation spacing also in hints and the confirmation text.
- Hover styles only on hover-capable pointers (no stuck accent plate after a
  tap); coarse pointers get 44px progress / calendar arrows on the wide
  layout; `touch-action: manipulation`; wordmark hit area 44px tall.
- Short landscape: tighter header, heading and spacing.
- Config changes: none.

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
