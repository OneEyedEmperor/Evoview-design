# reservation changelog

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
