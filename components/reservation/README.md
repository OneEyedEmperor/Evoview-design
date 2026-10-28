# reservation — Evoview booking application

A booking request built on Evoview's own application chassis (the
candidature flow of evoview.be): one question per screen in Evoview's
typography, marks and grading, coloured with the client's accent. Origin:
Tchin Tchin (`/root/.vibehub/projects/test`, `/reservation`).

Showcase: `https://evoview-library.said.bet/reservation` (reference config,
FR/EN, live accent picker standing in for the host `--primary`, mocked
submit). Live client: Tchin Tchin, `/root/.vibehub/projects/test`
(`src/components/reservation/reservation.config.tsx` is the worked example of
an adaptation: i18n labels, API mapping of `hours`/`guestsOverflow`).

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

Narrow containers (≤ 520px) keep the same signature, re-laid for phones:
wordmark + step readout on one row with the 5-segment progress as the strip's
bottom edge (44px tap targets); calendar tile widened to the chassis edge
with days filling it; start times in an even grid; `← RETOUR` above a
full-width white plate. The bar is deliberately not sticky (auto-advance
covers steps 1–4; a fixed bar would fight the on-screen keyboard and host
fixed UI, and the chassis clips overflow).

The side dossier of evoview.be's own flow (rail, monitor, journey list) is
deliberately not part of this package: it is exclusive to Evoview's site and
adds clutter on client sites.

## Signature (preserve)

Read `STRATEGY.md`. These are the component, not decoration — never restyle
the surfaces to the client's palette or swap them for client equivalents
(only the accent is the client's). Changing them is a library change
(RULES §13).

### Reservation

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
- **Accent roles**: step marks, selections, progress, kicker, ticket labels,
  glows, CTA hover and the emblem's iris.
- **Attribution**: the header wordmark links to `https://evoview.be/`
  (`EVOVIEW_URL`, Evoview's verified site), new tab, `rel="noopener"`, no
  tracking parameters. Its accessible name (`signatureAriaLabel`) must name
  Evoview and say it opens a new tab. No other Evoview link inside the form.

### ReservationFlow

- The controls voice (Satoshi captions, Overused question, plate + ghost
  pair), one question per step.
- **Attribution**: the linked Evoview wordmark above the progress (approved
  placement, `https://evoview.be/`, new tab); `attribution: false` only with
  Evoview's consent.

## Variations (select)

- **Version:** the full `Reservation` when the booking needs experiences, a
  calendar, opening windows or contact details; the short `ReservationFlow`
  (below) for simple requests.
- `Reservation` durations: `hours` (preferred) or `requiresEndTime` (see
  Behaviour); `guests.overflow` adds "+max".
- `ReservationFlow`: 3–5 chip steps then the contact step; `contact.sms`
  opt-in.

## Expression (adapt)

- **Reservation** (config only): venue, all copy, experiences (label, meta,
  icon(s) — reuse the client's navbar marks and colours, eye glyph by
  default — duration, note), opening windows and their labels, guests range,
  horizon, submit/toast wiring.
- **ReservationFlow:** steps, options, copy, accent, `tone` (`"paper"`
  default, `"light"`).
- **Accent = the client's.** The chassis reads the host's `--primary` (and
  `--primary-foreground` for text on accent fills), so each site gets its
  own accent with no config. Evoview indigo `#818cf8` is only the fallback
  when the host defines no `--primary`. `config.accent` / `accentInk`
  override it when the host token is unsuitable (e.g. a light-UI black
  primary).

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/reservation.config.tsx` | Venue, copy, experiences, windows, guests, `submit`. | **yes — the only one** |
| `src/types.ts` | `ReservationConfig` contract (fields commented). | no |
| `src/Reservation.tsx` | Chassis, steps, recap ticket, validation, confirmation; `EVOVIEW_URL`. | no |
| `src/marks.tsx` | Evoview eye glyphs, arrows, check, HUD. | no |
| `src/brand/` | Wordmark, ring-eye emblem, fonts. Refreshed on upgrade. | no |
| `src/reservation.css` | All styles under `.evo-resa`, container-query responsive. | no |
| `src/ReservationFlow.tsx`, `src/reservation-flow.css` | The short form (below), built on `controls`. | no |

## ReservationFlow — the short form

A second booking version for simple requests (a bar, an evening, a
tasting): three to five chip questions, then an e-mail (optional SMS
opt-in), on a white paper module in the shared controls language —
segmented progress with captions (answered steps can be revisited), large
chips (full slots stay visible, disabled), underline e-mail field, white →
ink plate with `Retour` beside it, a one-line confirmation and
`Recommencer`. Use the full `Reservation` when the booking needs
experiences, a calendar, opening windows or contact details.

```tsx
import { ReservationFlow } from "@/components/reservation";
import { buildReservationFlowConfig } from "@/components/reservation/reservation.config";
<ReservationFlow config={buildReservationFlowConfig(locale)} />
```

- Config (`ReservationFlowConfig`, in the same `reservation.config.tsx`):
  `locale`, `copy`, `steps` (`{ kind: "choice", id, short, question,
  options[] }` …, then one `{ kind: "contact" }` last), `contact.sms?`,
  `submit(request)` → `{ answers: { [stepId]: value }, email, sms? }`,
  `onResult?`, `tone` (`"paper"` default, `"light"`), `attribution`.
- Clients installed before 2.9.0 keep their config on upgrade: copy
  `buildReservationFlowConfig` (and its imports) from the reference file.
- Host: a light section, a column ≈ 48em (or the 1.28 side of a .72 / 1.28
  split). Accent from `--primary`; on paper it deepens for legibility, even
  in yellow. Requires `controls` (installed by `install.sh`, with
  `foundation`).
- Signature, variations, expression: above.

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

- Pills, the primary plate, ghost actions and calendar days squash and
  spring back when pressed (foundation's press jelly, RULES §6); experience
  tiles keep their `:active` scale.
- Guests: pills on wide layouts, a grid of number orbs on narrow ones.
  `guests.overflow` adds "+max", submitted as `guests: max` +
  `guestsOverflow: true`; map it in `submit` (e.g. a notes prefix) if the API
  caps the party size.
- Mobile (≤ 520px container): no "Continuer" on steps 1–4, a small "Retour"
  pill only; re-tapping the current answer moves forward.
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
  offset for a fixed navbar; also when its header sits under that navbar)
  and focus moves to the question heading. Picking a start time scrolls the
  revealed duration / end-time group into view on short screens. The root
  sets `overflow-anchor: none` so browser scroll anchoring doesn't add a
  second nudge.
- Contact: `autocomplete`/`inputmode`/`enterkeyhint` per field; Enter on name
  and phone moves to the next field, Enter on email sends. A failed send
  focuses the first invalid field (scroll margins keep its label clear of a
  fixed navbar and the keyboard).
- Headings use `text-wrap: balance`, never split a hyphenated word, and keep
  French `? ! : ;` attached (hints and confirmation text too).
- Touch: hover styles only apply on `(hover: hover)` so a tap never leaves the
  white plate stuck in the accent; `(pointer: coarse)` enlarges the wide
  layout's progress and calendar arrows to 44px.
- Short landscape (`max-height: 520px`): tighter header, heading and spacing.
- Safe areas: the component never touches the viewport edge; the host page's
  padding must include `env(safe-area-inset-*)` if it uses `viewport-fit=cover`.
- Reduced motion: no entrance, emblem or transition animation; programmatic
  scrolls are instant.

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
6. Mobile (320, 390, 430 and 844×390 landscape): no horizontal overflow,
   readout untruncated, no orphaned/split heading words, tap targets ≥ 44px
   (calendar days are width-bound at 320: ≈ 35px), the chassis lands below the
   host navbar on each step, the duration group comes into view, errors focus
   the first field. Mock `fetch` for the submit on a live client.
7. Host `tsc`, build and SSR prerender (if any) pass; CSP allows the assets.
8. ReservationFlow (1440, 390): `Continuer` stays disabled until the step
   is answered; disabled options can't be picked; the progress jumps back
   only to answered steps; an invalid e-mail is spelled out; send reaches
   the confirmation, `Recommencer` resets every answer.
