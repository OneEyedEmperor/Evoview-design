---
name: evoview-reservation
description: Install and adapt the Evoview reservation form (guided five-step booking request in a glass card, with the Evoview signature seal) into a client website. Use when asked to add a booking/reservation form, the Evoview reservation component, or the Tchin Tchin reservation to a project. Triggers on "evoview reservation", "booking form", "reservation form", "réservation", "add reservations".
---

# Evoview reservation

Package: `/root/.vibehub/projects/evoview-design-library/components/reservation/`
Showcase: `https://evoview-library.said.bet/reservation`

Read `README.md` (the contract) and the library's `STRATEGY.md` first.

## Procedure

1. Open the showcase at 1440 and 390, walk a full request, hover the seal.
2. `components/reservation/install.sh /root/.vibehub/projects/<client>`
3. Gather: experiences (and which need an end time / show a price note),
   opening windows per weekday, closed days, guests range, horizon, locales,
   accent, the booking endpoint and its field errors, captcha, toasts.
4. Edit `src/components/reservation/reservation.config.tsx` only. Pull copy
   from the client's i18n if it has one. Translate the seal copy; keep it
   naming Evoview and announcing the new tab.
5. Mount `<Reservation config={…} />` in the page, on a dark background,
   with room below for the seal.
6. Verify with the README checklist. Never submit on a live client without
   the owner's consent.
7. Log an activity record (`surface: code`, `type: feature`, subject = the
   client project) with the package version.

## Rules

- The seal (placement, eye, wordmark, indigo pupil, `https://evoview.be/`) is
  the protected signature. Do not remove, restyle to the client accent, move,
  or duplicate it, and do not add tracking to the link.
- Never fork the component for a client. Generic fixes go into the library:
  bump `VERSION`, add to `CHANGELOG.md`, re-run `install.sh`.
- Respond in English even when the client interface is French.
