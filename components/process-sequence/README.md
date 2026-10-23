# process-sequence — timed step board + step dossier

The neutral version of "La méthode Evoview": a chapter that shows a client's
process by *playing* it. One step is live at a time, completed steps stay as
evidence, future steps are visibly pending; each step opens a split dossier
that explains it and leads to the client's main action. Depends on
`foundation` and `controls`.

Showcase: `https://evoview-library.said.bet/layouts/process-sequence` (one
dark chapter: four steps, client icons, dossier; live accent palette).

## What is Evoview (protected)

Read `STRATEGY.md`. These make the board recognisably Evoview and must not be
restyled away:

- **Split heading** title ≈ .37 / instrument ≈ .63; the instrument is the
  controls `SegmentedProgress` (lg) with captions that *lock onto* completed
  segments (650 ms, tracking .42 → .14em, blur 4 → 0).
- **One active step, timed**: default 4 / 4 / 4 / 6 s (last step longest),
  only visible, unsuspended time counts, remainder carried, never restarts a
  step. Cycle boundary = neutral right → left drain (≤ 420 ms), then all
  steps return to pending.
- **Two independent column stacks in Z order** (01 02 / 03 04); the grid
  reserves the tallest state, so the chapter never resizes during the cycle.
- **State as frame, nothing else** — idle: no frame, dimmed grey media with
  the muted step numeral, title at low contrast; active: 2.5px frame, live
  media (opens from its centre line, then drifts with the clock), **paper
  inversion ribbon** wiped in L → R 700 ms, title typed in 800 ms, 2px
  progress (desktop), description at +800 ms; complete: 1px accent frame,
  band collapses (350 ms) to a full-bleed dimmed media tile, centred
  `completionMark` drawn in ≈ 1 s. No status pills, corner readouts, tilt or
  shine: state words live in the accessible names only.
- **Active = contrast, not accent** (paper on dark, ink on light); the accent
  encodes completion only.
- **Phone changes the mechanism**: 2 × 2 index of 52px controls (number +
  title; a check on completed steps; an odd last control spans the row) +
  one monitor (the active card); no instrument, no card bar.
- **Dossier**: stage / sheet 5/12 : 7/12 at every desktop width (never
  50/50), heading → progress cells + `02 / 04` → intro → numbered stadium
  items (2 columns ≥ 1024) → objective → footer; last step's "next" becomes
  the client CTA. Phone: full sheet, sticky header (numeral, title, close),
  cells under the media well, footer (pager + block plate). Sections are
  separated by spacing and tone, never rules.

Do **not** reintroduce the site's motifs (RULES §8, method extraction §8):
eye artwork, TV power-on / snow / CRT / scanlines / grain, REC dot, Gaegu
numerals, `méthode` wordmark, battery terminal, red "Réinitialisation"
blink/shake. Their roles are re-expressed as: `completionMark` slot (client
icon, check or numeral) · centre-line clip reveal · 180 / 360 ms crossfade ·
neutral drain · muted index + "À venir" · Overused 900 numeral clipped up ·
neutral field + one accent floor bloom.

**Accent = the client's** (`--primary` / `--primary-foreground`), driving:
completed segment fills (ramp .4 / .6 / .8 / 1, oldest dimmest), complete
frame, mark ring, mobile complete tint, ribbon progress, focus rings,
kicker / indices, dossier item tints and chips, close radial, backdrop and
floor bloom. Never the active state, body text, surfaces or the resting plate.

**Attribution** (approved placement): one linked `EvoviewMark` in the
dossier's **stage strip** (top-left of the media, phone: top-left of the
media well), `https://evoview.be/`, new tab, accessible name from
`copy.attributionLabel`; far from the footer CTA. The board itself carries
no mark (it has no chassis strip). `attribution.enabled` is on by default;
turning it off is the founder's call. If the host uses `onOpen` instead of the
built-in dossier, the package shows no mark.

Client-adaptable: steps (3–6), copy, media, marks, durations, CTA, tone,
accent, fonts via the foundation host tokens. `tone="light"` is for a client
whose method chapter sits on a near-white page: the ribbon inverts to ink,
complete frames and marks keep the accent; everything else is identical.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/process-sequence.config.tsx` | Steps (title, summary, media, mark, detail), durations, mark kind, copy FR / EN, CTA, attribution. `buildProcessSequenceConfig(locale, { media?, steps? })`. Media defaults to inline placeholders. | **yes — the only one** |
| `src/ProcessSequence.tsx` | Board: clock, heading + instrument, Z stacks, phone index + monitor | no |
| `src/StepCard.tsx` | Three-state card + completion mark | no |
| `src/StepDossier.tsx` | Split modal (also usable on its own) | no |
| `src/types.ts`, `src/index.ts` | Types, exports | no |
| `src/process-sequence.css` | `.ev-process` token block, `ps-*` board, `psd*` dossier | no |

`examples/*.webp` (demo media) belong to the library page; not installed.

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/process-sequence/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `foundation` and `controls` first, then copies `src/` to
`<client>/src/components/process-sequence/`; re-runs keep the config.

```tsx
import { ProcessSequence, buildProcessSequenceConfig } from "@/components/process-sequence";
import survey from "@/assets/method/survey.webp"; // …

<ProcessSequence config={buildProcessSequenceConfig(locale, { media: { survey: { src: survey } } })} tone="dark" />
```

## API

```ts
type ProcessSequenceProps = {
  config: ProcessSequenceConfig;
  tone?: "dark" | "light";           // chapter environment; the ribbon inverts it
  autoplay?: boolean;                 // default true; false = click-driven still board
  onOpen?: (step, index) => void;     // replaces the built-in dossier
  dossier?: boolean;                  // default true (steps with `detail`)
  chapter?: boolean;                  // default true: cinematic padding + tone background + top spill;
                                      // false: the host chapter owns padding and background (floor bloom kept)
  id?: string; className?: string;
};

type ProcessSequenceConfig = {
  locale: "fr" | "en";
  steps: { id; title; caption?; summary; media: { src; poster?; type?; alt? };
           durationMs?; mark?: ReactNode;
           detail?: { heading: string[]; intro; items: string[] /* ≤ 42 chars */; objective? } }[];
  durations?: number[];               // used only if length === steps.length
  completionMark?: "check" | "numeral" | "icon";   // icon = step.mark (falls back to check)
  copy: { kicker?; title; instrumentLabel; status: { idle; active; complete };
          stepOf(c, t); openHint; dossier: { label; close; previous; next; progress; objective; loading; failed; retry };
          attributionLabel };
  cta?: { label; href?; onClick? };   // last dossier step
  attribution?: { enabled: boolean; href? };
};
```

`StepDossier` can be mounted alone: `steps`, `index`, `onIndexChange`,
`onClose`, `copy`, `cta?`, `attribution?`, `tone?`. The host restores focus
(the board does).

## Behaviour

- **Desktop ≥ 768**: heading split + instrument (segments are buttons: jump
  to a step); 2-col Z stacks, card media 2.15:1. Hover (fine pointer only):
  media push 1.04 — never changes the phase or pauses the clock. Cards with a dossier are
  `role="button"` (Enter / Space), `aria-current="step"` on the active one.
- **Phone < 768**: index controls (jump), one monitor (media 1.79:1, height
  reserved for the tallest step), tap opens the dossier.
- **Dossier**: opens behind a media gate (loader after 350 ms, ≥ 500 ms,
  text status, retry at 20 s); stage curtain 400 ms + media 1.15 → 1, heading
  wipe, cells, intro, items (+40 ms each), footer stagger; step change = 180 ms
  out, hold until the next media is decoded, replay. ←/→, Esc, Tab contained,
  focus on close, returns to the launching card, page scroll locked, background
  suspended (`useSuspendBackground`). It sets no `inert` on the page, so host
  chrome marked `data-ev-keep-interactive` (see `dossier` README) stays
  clickable when stacked above its z-index 1000; it is outside the Tab trap
  (pointer only while open). ≥ 768 the windowed shell keeps
  `--ev-modal-reserve-bottom` (host CSS variable, default 0, shared with
  `dossier`) free below itself for such chrome.
- **Pause model**: the clock runs only while the section is on screen (12 %),
  revealed, the tab visible, no modal open, and the active step's media
  decoded (`useInViewPause` + `useSequenceClock` + `useMediaReady`); resumes
  with the remainder. The marker pulse carries `.ev-ambient`.
- **Motion policy**: no `prefers-reduced-motion` branch (architecture skill).
  Stable states instead: every step reachable by click (instrument, index,
  dossier), the dossier is static once revealed, `autoplay={false}` gives a
  still board.

## Verification

1. `pnpm build`; showcase at 1440, 1024, 390: heading .37 / .63, no
   horizontal overflow, nothing below 9px (body ≥ 13px).
2. Watch one full cycle: captions lock on, ramp, drain, wrap; the chapter
   height never changes; columns move independently.
3. Scroll away mid-step / hide the tab / open the dossier: the step does not
   advance; back: it resumes with the remaining time.
4. Palette: default, indigo, yellow, off-white — completed frames, marks,
   fills and the phone complete tint stay readable; the active state stays
   paper / ink.
5. Keyboard: Tab to a card → Enter opens; ←/→ steps; last step shows the CTA;
   Esc closes and focus returns to the card. Phone: index jumps, full sheet.
6. The Evoview mark appears once, in the dossier stage, opens evoview.be in a
   new tab.
