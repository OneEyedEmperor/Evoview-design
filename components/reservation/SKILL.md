---
name: evoview-reservation
description: Install and adapt the Evoview booking application (one-question-per-screen reservation request on Evoview's candidature chassis, in the client's accent) into a client website. Use when asked to add a booking/reservation form, the Evoview reservation component, or the Tchin Tchin reservation to a project. Triggers on "evoview reservation", "booking form", "reservation form", "réservation", "add reservations".
---

# Evoview reservation

Package: `/root/.vibehub/projects/evoview-design-library/components/reservation/`
Showcase: `https://evoview-library.said.bet/reservation`

Read `README.md` (the contract, especially "What is Evoview") and the
library's `STRATEGY.md` first.

## Procedure

1. Open the showcase at 1440 and 390, walk a full request to confirmation.
2. `components/reservation/install.sh /root/.vibehub/projects/<client>`
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

- The chassis is the Evoview signature: do not re-theme its surfaces, swap
  fonts or marks. The client shows up through its accent, venue, copy and
  choices.
- Do not add the evoview.be side dossier (rail/monitor/journey): it is
  exclusive to Evoview's site.
- Two versions: `Reservation` (full application, dark chassis) and
  `ReservationFlow` (short form on paper: chip questions then an e-mail; see
  README "ReservationFlow"). Pick the flow when the booking needs no
  calendar, opening windows or contact details beyond an e-mail.
- The header wordmark is the only Evoview link (`https://evoview.be/`, new
  tab, no tracking). Do not add or move attribution.
- Never fork the component for a client. Generic fixes go into the library:
  bump `VERSION`, add to `CHANGELOG.md`, re-run `install.sh`.
- Respond in English even when the client interface is French.
