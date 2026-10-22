# reservation — Evoview booking application

A booking request built on Evoview's own application chassis (the
candidature flow of evoview.be): one question per screen in Evoview's
typography, marks and grading, coloured with the client's accent. Origin:
Tchin Tchin (`/root/.vibehub/projects/test`, `/reservation`).

Showcase: `https://evoview-library.said.bet/reservation` (reference by
default, Tchin Tchin example, FR/EN, mocked submit).

The reference config is a neutral copy of the Tchin Tchin setup, the
first client: same flow and choices (table / by-the-hour room / both, icons
on every row, duration in hours instead of end times, "+max" guests, "On
confirme ?"). Start every client from it and swap in their venue, copy,
navbar icons and rules.

```
┌ EVOVIEW │ RÉSERVATION · VENUE / 01 / 05 · EXPÉRIENCE          ▬ ▬ ▬ ▬ ▬ ┐
│ (01) Question heading                                                   │
│ hint                                                                    │
│ ┌01 ◉ Option ─────────────────────────────────────────────────────── ○┐ │
│ │   META · READOUT                                                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ← RETOUR                                             [ Continuer  (→) ] │
└─────────────────────────────────────────────────────────────────────────┘
Single column at every width. The recap ticket appears above the contact
fields and on the confirmation. The header progress jumps back to answered steps.
```

The side dossier of evoview.be's own flow (rail, monitor, journey list) is
deliberately not part of this package: it is exclusive to Evoview's site and
adds clutter on client sites.

## What is Evoview (protected)

Read `STRATEGY.md`. These are the component, not decoration — never restyle
the surfaces to the client's palette or swap them for client equivalents
(only the accent is the client's, below):

- **Chassis**: `#0c0c0d` panel, 1.5rem radius, grain, stage grading (silver
  spill top-left, plum floor, accent-tinted glow).
- **Header strip**: Evoview wordmark (the attribution link, see below),
  divider, kicker `RÉSERVATION · VENUE`, step readout `01 / 05 · STEP`,
  5-segment progress.
- **Type system**: Overused Grotesk 900 questions, Montserrat body, Satoshi
  700 uppercase readouts. Fonts ship in `brand/fonts/` (no host fonts needed).
- **Marks**: circled step mark with halo, Evoview eye glyphs on the
  experience rows (index `01…`, check orb), pill chips with numbered orbs,
  white primary plate with dark arrow orb, `← RETOUR` ghost, REC dots,
  ring-eye emblem on the confirmation, recap ticket (status + venue on the
  right edge, big date, four fields, Evoview watermark; no texture overlay
  or HUD corners).
- **Choreography**: auto-advance 340 ms after a choice, blur-rise step
  entrance, emblem reveal.

**Accent = the client's.** The chassis reads the host's `--primary` (and
`--primary-foreground` for text on accent fills), so each site gets its own
accent with no config: step marks, selections, progress, kicker, ticket
labels, glows, CTA hover and the emblem's iris. Evoview indigo `#818cf8` is
only the fallback when the host defines no `--primary`. `config.accent` /
`accentInk` override it when the host token is unsuitable (e.g. a light-UI
black primary).

Client-adaptable (config only): venue, all copy, experiences (label, meta,
icon(s) — reuse the client's navbar marks and colours, eye glyph by default —
duration, note), opening windows and their labels, guests range, horizon,
submit/toast wiring.

**Attribution**: the header wordmark links to `https://evoview.be/`
(`EVOVIEW_URL`, Evoview's verified site), new tab, `rel="noopener"`, no
tracking parameters. Its accessible name (`signatureAriaLabel`) must name
Evoview and say it opens a new tab. No other Evoview link inside the form.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/reservation.config.tsx` | Venue, copy, experiences, windows, guests, `submit`. | **yes — the only one** |
| `src/types.ts` | `ReservationConfig` contract (fields commented). | no |
| `src/Reservation.tsx` | Chassis, steps, recap ticket, validation, confirmation; `EVOVIEW_URL`. | no |
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

Mount it in a ~900px column (`max-w-4xl`); the page keeps its own section
heading and background.

## Host contract

- React 19, Vite (asset imports for SVG/fonts, `?raw` for the wordmark),
  TypeScript strict. `react-day-picker` ^9, `date-fns` ^4. No Tailwind,
  shadcn or toast dependency; toasts go through `onResult`. Only the
  reference config imports `lucide-react` (row icons) — any icon element works.
- Reads only `--primary` / `--primary-foreground` from the host (accent).
  Resets use zero-specificity `:where()`, so host base styles in
  `@layer base` cannot leak in.
- CSP: fonts/SVG are same-origin assets; grain/scan textures are `data:`
  images (`img-src data:`).

## Behaviour

- Guests: pills on wide layouts, a grid of number orbs on narrow ones.
  `guests.overflow` adds "+max", submitted as `guests: max` +
  `guestsOverflow: true`; map it in `submit` (e.g. a notes prefix) if the API
  caps the party size.
- Step complete → auto-advance; "Continuer" on an unanswered step shows
  `chooseToContinue`. `timeNote` shows under the times.
- Durations: `hours: { options, withinWindow }` asks how many hours after the
  start time (preferred over end times: guests found end times confusing at
  Tchin Tchin). `withinWindow` keeps start + hours inside the opening window.
  `requiresEndTime` (end-time list) remains for clients that want it.
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

1. 1440 and 390: chassis, header readout untruncated, recap ticket on the
   contact step and confirmation; the accent is the client's (`--primary`).
2. Walk every experience; durations only where configured; closed days
   disabled; header progress jumps back to answered steps.
3. Empty send shows three field errors; valid send reaches the confirmation;
   ticket turns "transmise" with a green REC dot. Never send on a live
   client without the owner's consent (real request).
4. Wordmark link: keyboard-focusable, accessible name in the page language,
   opens `https://evoview.be/` in a new tab.
5. `prefers-reduced-motion: reduce`: no animation.
6. Host `tsc`, build and SSR prerender (if any) pass; CSP allows the assets.
