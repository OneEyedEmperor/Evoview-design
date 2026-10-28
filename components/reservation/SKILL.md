---
name: evoview-reservation
description: Install and adapt the Evoview booking application (one-question-per-screen reservation request on Evoview's candidature chassis, in the client's accent) into a client website. Use when asked to add a booking/reservation form, the Evoview reservation component, or the Tchin Tchin reservation to a project. Triggers on "evoview reservation", "booking form", "reservation form", "réservation", "add reservations".
---

# Evoview reservation

Package: `/root/.vibehub/projects/evoview-design-library/components/reservation/`
Showcase: `https://evoview-library.said.bet/reservation`

Read `README.md` (the contract, especially Signature / Variations /
Expression) and the library's `STRATEGY.md` first.

## Ownership (RULES §13)

- **Preserve** (README "Signature"): the chassis, header strip, type
  system, marks, choreography, the header wordmark link; the flow's controls
  voice. Changes go into the library, never the client.
- **Select** (README "Variations"): `Reservation` or `ReservationFlow`;
  durations as `hours` or `requiresEndTime`; "+max" guests; SMS opt-in.
- **Invent** (README "Expression"): venue, copy, experiences, windows,
  guests, horizon, submit wiring, accent.

## Procedure

1. Open the showcase at 1440 and 390, walk a full request to confirmation.
2. Install: `sync.sh plan /root/.vibehub/projects/<client> reservation`,
   then `apply`, then `verify` (library root, `docs/SYNC.md`); resolve
   conflicts, fill patch reasons.
3. Gather: venue name/city, experiences (which need an end time / a price
   note), opening windows per weekday and their labels, closed days, guests
   range, horizon, locales, booking endpoint and its field errors, captcha,
   toasts.
4. Edit `src/components/reservation/reservation.config.tsx` only. Pull
   existing labels from the client's i18n; write the question copy in the
   Evoview voice (short, direct questions).
5. Mount `<Reservation config={…} />` in a ~900px column on a dark page.
   Check the accent: it is the host's `--primary`; set `accent`/`accentInk`
   only if that token doesn't work on a dark chassis.
6. Verify with the README checklist. Never send on a live client without
   the owner's consent.
7. Log an activity record (`surface: code`, `type: feature`, subject = the
   client project) with the package version.

## Rules

- Orbs (choice check, pill number marks, compact guest orbs) change colour
  only through foundation `OrbFill`'s liquid rise (RULES §1).
- Do not add the evoview.be side dossier (rail/monitor/journey): it is
  exclusive to Evoview's site.
- Pick `ReservationFlow` (short form on paper: chip questions then an
  e-mail; README "ReservationFlow") when the booking needs no calendar,
  opening windows or contact details beyond an e-mail.
- The header wordmark is the only Evoview link (`https://evoview.be/`, new
  tab, no tracking). Do not add or move attribution.
- Never fork the component for a client. Generic fixes go into the library:
  bump `VERSION`, add to `CHANGELOG.md`, upgrade the client through
  `sync.sh`; a client-side edit is a recorded patch (`.evoview/patches/`).
- Respond in English even when the client interface is French.
