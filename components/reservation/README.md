# reservation — Evoview booking application

A booking request built on Evoview's own application chassis (the
candidature flow of evoview.be): one question per screen, a live **dossier**
that composes the booking ticket as the guest answers, and Evoview's
typography, marks and grading throughout. Origin: Tchin Tchin
(`/root/.vibehub/projects/test`, `/reservation`).

Showcase: `https://evoview-library.said.bet/reservation` (Tchin Tchin example
and reference, FR/EN, mocked submit).

```
wide (container ≥ 900px)
┌ EVOVIEW │ RÉSERVATION · VENUE / 01 / 05 · EXPÉRIENCE ───────────────────┐
│ (01) Question heading                   │ DOSSIER · 01/05 ÉTAPES   20%  │
│ hint                                    │ ▬▬ ▬▬ ▬▬ ▬▬ ▬▬                 │
│ ┌01 ◉ Option ───────────── ○┐           │ ┌ ● DEMANDE EN COURS  VENUE ┐  │
│ │   META · READOUT          │           │ │ MAR 27 OCT 2026           │  │
│ └───────────────────────────┘           │ │ EXPÉRIENCE  PERSONNES ... │  │
│                                         │ └───────────── EVOVIEW ─────┘  │
│ ← RETOUR              [ Continuer  (→) ] │ ✓ Expérience / (02) Date / ... │
└─────────────────────────────────────────┴───────────────────────────────┘
narrow: single column, 5-segment progress in the header, ticket shown above
the contact fields and on the confirmation.
```

## What is Evoview (protected)

Read `STRATEGY.md`. These are the component, not decoration — never restyle
them to the client's palette or swap them for client equivalents:

- **Chassis**: `#0c0c0d` panel, 1.5rem radius, grain, stage/dossier grades
  (silver spill top-left, plum floor, indigo floor on the dossier).
- **Header strip**: Evoview wordmark (the attribution link, see below),
  divider, accent kicker `RÉSERVATION · VENUE`, step readout `01 / 05 · STEP`.
- **Type system**: Overused Grotesk 900 questions, Montserrat body, Satoshi
  700 uppercase readouts. Fonts ship in `brand/fonts/` (no host fonts needed).
- **Marks**: circled step mark with accent halo, Evoview eye glyphs on the
  experience rows (index `01…`, check orb), pill chips with numbered orbs,
  white primary plate with dark arrow orb, `← RETOUR` ghost, HUD corners,
  REC dots, ring-eye emblem on the confirmation.
- **Dossier**: segmented rail + percentage, CRT ticket (phosphor dots,
  scanlines, Evoview watermark), journey list with check orbs.
- **Choreography**: auto-advance 340 ms after a choice, blur-rise step
  entrance, emblem reveal; rail and journey jump back to answered steps.
- **Accent**: Evoview indigo `#818cf8` (iris `#3f51b5`).

Client-adaptable (config only): venue, all copy, experiences (label, meta,
end time, note), opening windows and their labels, guests range, horizon,
submit/toast wiring. `accent` exists but changing it dilutes the signature;
keep indigo unless the founder decides otherwise.

**Attribution**: the header wordmark links to `https://evoview.be/`
(`EVOVIEW_URL`, Evoview's verified site), new tab, `rel="noopener"`, no
tracking parameters. Its accessible name (`signatureAriaLabel`) must name
Evoview and say it opens a new tab. No other Evoview link inside the form.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/reservation.config.tsx` | Venue, copy, experiences, windows, guests, `submit`. | **yes — the only one** |
| `src/types.ts` | `ReservationConfig` contract (fields commented). | no |
| `src/Reservation.tsx` | Chassis, steps, dossier, validation, confirmation; `EVOVIEW_URL`. | no |
| `src/marks.tsx` | Evoview eye glyphs, arrows, check, HUD. | no |
| `src/brand/` | Wordmark, ring-eye emblem, fonts. Refreshed on upgrade. | no |
| `src/reservation.css` | All styles under `.evo-resa`, container-query responsive. | no |
| `examples/tchin.config.tsx` | Tchin Tchin (showcase). Not installed. | — |

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/reservation/install.sh /root/.vibehub/projects/<client>
```

Copies `src/` to `<client>/src/components/reservation/`; re-runs replace
everything but `reservation.config.tsx`.

```tsx
import { Reservation } from "@/components/reservation";
import { buildReservationConfig } from "@/components/reservation/reservation.config";
const config = useMemo(() => buildReservationConfig(locale, t), [locale, t]);
<Reservation config={config} />
```

Give it ~1100px (`max-w-6xl`) on desktop so the dossier column shows; the
page keeps its own section heading and background.

## Host contract

- React 19, Vite (asset imports for SVG/fonts, `?raw` for the wordmark),
  TypeScript strict. `react-day-picker` ^9, `date-fns` ^4. No Tailwind,
  shadcn, lucide or toast dependency; toasts go through `onResult`.
- Independent of host tokens. Resets use zero-specificity `:where()`, so
  host base styles in `@layer base` cannot leak in.
- CSP: fonts/SVG are same-origin assets; grain/scan textures are `data:`
  images (`img-src data:`).

## Behaviour

- Step complete → auto-advance; "Continuer" on an unanswered step shows
  `chooseToContinue`. `requiresEndTime` adds an end-time group bounded by the
  start's window; `timeNote` shows under the times.
- Calendar: past days, days beyond `maxDaysAhead` and days where `windows()`
  is `[]` are disabled. Changing experience clears the end time; changing
  date clears both times (later steps reopen).
- Validation on send: name, phone, email required, email format. Server
  `fieldErrors` map onto fields; other errors show next to the button.
  `submit` throwing → `errorGeneric`.
- After a user-driven step change the chassis is scrolled into view (96px
  offset for a fixed navbar) and focus moves to the question heading.
- Reduced motion: no entrance, emblem or transition animation.

## Verification

1. 1440 and 390: chassis, header readout untruncated, dossier visible on
   wide only, compact ticket on narrow contact/confirmation.
2. Walk every experience; end time only where configured; closed days
   disabled; rail/journey jump back to answered steps.
3. Empty send shows three field errors; valid send reaches the confirmation;
   ticket turns "transmise" with a green REC dot. Never send on a live
   client without the owner's consent (real request).
4. Wordmark link: keyboard-focusable, accessible name in the page language,
   opens `https://evoview.be/` in a new tab.
5. `prefers-reduced-motion: reduce`: no animation.
6. Host `tsc`, build and SSR prerender (if any) pass; CSP allows the assets.
