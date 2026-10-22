# reservation — Evoview guided booking request

Five-step request form in a glass card (experience → date → guests → time →
contact), each step revealed once the previous one is answered, with the
**Evoview signature seal** on the card's bottom edge. Origin: Tchin Tchin
(`/root/.vibehub/projects/test`, `/reservation`), designed by Evoview.

Showcase: `https://evoview-library.said.bet/reservation` — toggles for the
Tchin Tchin example (gold, as shipped) and the Evoview reference (indigo), FR/EN.
Submissions are mocked there.

## Evoview signature (protected)

Read `STRATEGY.md`. What stays on every client:

- **The seal**: a glass capsule centred on the card's bottom edge (half on,
  half below) — Evoview eye (HUD corners, almond, indigo `#3f51b5` pupil with
  a white iris), lead text, divider, Evoview wordmark, outbound arrow. Visible
  in every state (all steps, confirmation). Hover/focus: indigo halo, double
  blink of the eye (the navbar's timing), arrow nudge.
- **Destination**: `https://evoview.be/` (`EVOVIEW_URL`, Evoview's verified
  site), new tab, `rel="noopener"`, no tracking parameters. Not a config value.
- **The guided reveal**: one question at a time, smooth scroll to the new
  step, rise-in animation; chips for guests and hours instead of selects.

Client-adaptable (config only): copy, experiences and icons, opening windows,
guests range, horizon, accent, `--resa-*` tokens, submit/toast wiring. The
seal wording is translatable (`signatureLead`, `signatureAriaLabel`) but must
keep naming Evoview and stating that the link opens a new tab.

Do not move the seal into the form flow, put it before the submit button,
recolour it to the client accent, or add a second Evoview placement around
the form.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/reservation.config.tsx` | Copy, experiences, windows, guests, accent, `submit`. | **yes — the only one** |
| `src/types.ts` | `ReservationConfig` contract (fields commented). | no |
| `src/Reservation.tsx` | Card, steps, calendar, validation, confirmation. | no |
| `src/EvoviewSignature.tsx` | The seal + `EVOVIEW_URL`. | no |
| `src/brand/` | Evoview wordmark (signature asset, refreshed on upgrade). | no |
| `src/reservation.css` | All styles under `.evo-resa`; token block at the top. | no (use `config.vars`) |
| `examples/tchin.config.tsx` | Tchin Tchin as shipped (showcase). Not installed. | — |

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/reservation/install.sh /root/.vibehub/projects/<client>
```

Copies `src/` to `<client>/src/components/reservation/`; re-runs keep
`reservation.config.tsx`.

```tsx
import { Reservation } from "@/components/reservation";
import { buildReservationConfig } from "@/components/reservation/reservation.config";
const config = useMemo(() => buildReservationConfig(locale, t), [locale, t]);
<Reservation config={config} />
```

The page owns the section heading and background; the component owns the card.

## Host contract

- React 19, Vite (`?raw` import for the wordmark), TypeScript strict.
- `react-day-picker` ^9, `date-fns` ^4, `lucide-react`. No Tailwind, shadcn
  or toast dependency; toasts go through `onResult`.
- Dark background behind the card (glass surface, white text). Light hosts
  need `--resa-surface`, `--resa-line`, `--foreground` overrides; the seal
  stays dark.
- Tokens read from the host with fallbacks: `--primary`, `--primary-foreground`,
  `--foreground`, `--muted-foreground`, `--font-heading`, `--spacing`,
  `--text-*`, `--radius-*` (shadcn / Tailwind v4 names). `config.accent`
  overrides `--primary`.
- Leave ≥1.5rem below the component for the hanging half of the seal.

## Behaviour

- Experiences: radio group; `requiresEndTime` adds an end-time list bounded by
  the start's window; `timeNote` shows under the time step.
- Calendar: past days, days beyond `maxDaysAhead` and days where `windows()`
  returns `[]` are disabled.
- Start slots every `slotMinutes` from `open` to `close - slotMinutes`.
- Changing experience clears the end time; changing date clears both times.
- Validation: name, phone, email required, email format. Server `fieldErrors`
  map onto the fields. `submit` throwing → `errorGeneric`.
- Reduced motion: no step rise-in, no eye blink, no arrow transition.
- Mobile < 360px: the seal drops the lead text and divider (eye + wordmark + arrow).

## Verification

1. 1440 and 390: card, steps and seal match the showcase; the seal is centred
   on the card's bottom edge and does not overlap the submit button.
2. Walk all experiences; end time only where configured; closed days disabled.
3. Empty submit shows three errors; a valid submit reaches the confirmation
   and the seal is still there. On a live client, do not submit without the
   owner's consent (it sends a real request).
4. Seal: Tab reaches it after the form, focus ring visible, accessible name
   in the page language, opens `https://evoview.be/` in a new tab.
5. `prefers-reduced-motion: reduce`: no animation.
6. Host `tsc` and build (including SSR prerender if the host has one) pass.
