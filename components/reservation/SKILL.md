---
name: evoview-reservation
description: Install and adapt the Evoview booking application (one-question-per-screen reservation request on Evoview's candidature chassis, with a live dossier/ticket) into a client website. Use when asked to add a booking/reservation form, the Evoview reservation component, or the Tchin Tchin reservation to a project. Triggers on "evoview reservation", "booking form", "reservation form", "réservation", "add reservations".
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
5. Mount `<Reservation config={…} />` in a ~1100px container on a dark page.
6. Verify with the README checklist. Never send on a live client without
   the owner's consent.
7. Log an activity record (`surface: code`, `type: feature`, subject = the
   client project) with the package version.

## Rules

- The whole chassis is the Evoview signature: do not re-theme it to the
  client palette, swap fonts or marks, or change the accent without the
  founder's decision. The client shows up through venue, copy and choices.
- The header wordmark is the only Evoview link (`https://evoview.be/`, new
  tab, no tracking). Do not add or move attribution.
- Never fork the component for a client. Generic fixes go into the library:
  bump `VERSION`, add to `CHANGELOG.md`, re-run `install.sh`.
- Respond in English even when the client interface is French.
