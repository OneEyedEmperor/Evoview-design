# process-sequence — timed step board + step dossier

The neutral version of "La méthode Evoview": a chapter that shows a client's
process by *playing* it. One step is live at a time, completed steps stay as
evidence, future steps are visibly pending; each step opens a split dossier
that explains it and leads to the client's main action. Depends on
`foundation` and `controls`.

Showcase: `https://evoview-library.said.bet/layouts/process-sequence` (one
dark chapter: four steps, client icons, dossier; live accent palette;
`…/process-sequence/<step>/` opens that step's dossier).

## Signature (preserve)

Read `STRATEGY.md`. These make the board recognisably Evoview and must not be
restyled away; changing them is a library change (RULES §13).

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
  a muted ring orb carrying the bare step number ("2", never "02"; the size
  of the completion mark), title at low contrast; active: 2.5px frame, live
  media (opens from its centre line, then drifts with the clock), **paper
  inversion ribbon** wiped in L → R 700 ms, title typed in 800 ms, 2px
  progress (desktop), description at +800 ms; complete: 1px accent frame,
  band collapses (350 ms) to a full-bleed dimmed media tile, centred
  `completionMark` drawn in ≈ 1 s. No status pills, corner readouts, tilt or
  shine: state words live in the accessible names only.
- **Active = contrast, not accent** (paper on dark, ink on light); the accent
  encodes completion only.
- **Phone changes the mechanism**: 2 × 2 index of ≥ 52px controls (orb with
  the bare number + title wrapping to two lines, never an ellipsis;
  completion fills the orb with the accent and a check; an odd last control
  spans the row) + one monitor (the active card); no instrument, no card bar.
- **No counting tags or kickers on the board** (RULES §1): order is a bare
  number in an orb (idle card, phone index, `numeral` mark, dossier items);
  step titles and captions wrap, never truncate.
- **Dossier**: stage / sheet 5/12 : 7/12 at every desktop width (never
  50/50), heading → progress cells + `02 / 04` → intro → numbered stadium
  items (bare number orbs, 2 columns ≥ 1024) → objective (its own `h2`
  heading, not a label) → footer; last step's "next" becomes
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

**Accent roles**: completed segment fills (ramp .4 / .6 / .8 / 1, oldest
dimmest), complete frame, mark ring, mobile complete tint, ribbon progress,
focus rings, indices, dossier item tints and chips, close radial, backdrop
and floor bloom. Never the active state, body text, surfaces or the resting
plate.

**Attribution** (approved placement): one linked `EvoviewMark` in the
dossier's **stage strip** (top-left of the media, phone: top-left of the
media well), `https://evoview.be/`, new tab, accessible name from
`copy.attributionLabel`; far from the footer CTA. The board itself carries
no mark (it has no chassis strip). `attribution.enabled` is on by default;
turning it off is the founder's call. If the host uses `onOpen` instead of the
built-in dossier, the package shows no mark. `attribution.href: null` pauses
the link while evoview.be isn't live (the mark stays, unlinked, named
"Evoview" instead of `attributionLabel`); restore the URL to relink.

## Variations (select)

- `completionMark`: `COMPLETION_MARKS` — `check` · `numeral` · `icon`
  (`step.mark`, falls back to check).
- `autoplay`: timed board (default) or `false`, a click-driven still board.
- Step detail: the built-in step dossier (default, steps with `detail`) or
  `onOpen` (host's own view; no mark then).

## Expression (adapt)

Steps (3–6), copy, media, marks, durations, CTA, tone, accent
(`--primary` / `--primary-foreground`), fonts via the foundation host
tokens. `tone="light"` is for a client whose method chapter sits on a
near-white page: the ribbon inverts to ink, complete frames and marks keep
the accent; everything else is identical.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/process-sequence.config.tsx` | Steps (title, summary, media, mark, detail), durations, mark kind, copy FR / EN, CTA, attribution. `buildProcessSequenceConfig(locale, { media?, steps? })`. Media defaults to inline placeholders. | **yes** (client-owned, like the theme file) |
| `src/ProcessSequence.tsx` | Board: clock, heading + instrument, Z stacks, phone index + monitor | no |
| `src/StepCard.tsx` | Three-state card + completion mark | no |
| `src/StepDossier.tsx` | Split modal (also usable on its own) | no |
| `src/routes.ts` | `processSequenceRoutes` (views, keys, head data) | no |
| `src/types.ts`, `src/media.ts`, `src/index.ts` | Types, media helper, exports | no |
| `src/process-sequence.css` | `.ev-process` token block, `ps-*` board, `psd*` dossier | no |

`examples/*.webp` (demo media) belong to the library page; not installed.

## Install

```bash
L=/root/.vibehub/projects/evoview-design-library
$L/sync.sh plan /root/.vibehub/projects/<client> process-sequence   # read-only: files, deps, compat, changelog
$L/sync.sh apply /root/.vibehub/projects/<client> process-sequence  # then resolve conflicts, fill patch reasons
$L/sync.sh verify /root/.vibehub/projects/<client>
```

Writes `src/` to `<client>/src/components/process-sequence/`, plus `controls`
/ `foundation` when absent or too old; `process-sequence.config.tsx` and
`process-sequence.theme.css` (tokens) are client-owned, never overwritten.
`install.sh <client>` applies clean plans only. Contract: `docs/SYNC.md`.

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
  // Crawlable views (below). All optional: without `view` the board keeps the dossier state itself.
  view?: ProcessSequenceView | null;  // { step: id } | null (closed); controlled when defined
  onNavigate?: (view) => void;        // every open / step / close the dossier asks for, every Back / Forward
  hrefFor?: (view | null) => string;  // view URLs: cards and dossier controls become links
  history?: boolean;                  // default true; false = the host router owns history
};

type ProcessSequenceConfig = {
  locale: "fr" | "en";
  steps: { id; title; caption?; summary; media: { src; poster?; type?; alt? };
           durationMs?; mark?: ReactNode;
           detail?: { heading: string[]; intro; items: string[] /* ≤ 42 chars */; objective? } }[];
  durations?: number[];               // used only if length === steps.length
  completionMark?: "check" | "numeral" | "icon";   // icon = step.mark (falls back to check)
  copy: { title; instrumentLabel; status: { idle; active; complete };
          stepOf(c, t); openHint; dossier: { label; close; previous; next; progress; objective; loading; failed; retry };
          attributionLabel };
  cta?: { label; href?; onClick? };   // last dossier step
  attribution?: { enabled: boolean; href?: string | null };   // null = paused link
};
```

`StepDossier` can be mounted alone: `steps`, `index`, `onIndexChange`,
`onClose`, `copy`, `cta?`, `attribution?`, `tone?`, plus `hrefFor?(index)`
(links), `canOpen?(index)`, `onUp?` (Escape / backdrop), `closing?`
(host-controlled exit: requests call `onClose` at once, keep it mounted
`STEP_DOSSIER_EXIT_MS`). The host restores focus (the board does).

## Crawlable views

Contract: `docs/CRAWLABLE-MODALS.md` in the library (client wiring: §7).
Every step with `detail` is a view `{ step: id }` (level 1) with its own URL
whose server HTML carries the step's full copy.

- **Routes**: `processSequenceRoutes.views(config)` lists the views (prerender,
  sitemap), `key` = `step.id` (keep ids URL-safe slugs), `parse(config, key)`,
  `head(config, view)` → `{ title: "<heading> — <step title>", description
  (intro, ≤ 160), breadcrumb: [step title], image? (poster / image, not
  inline data URIs) }`. Data only: the client renders `<title>`, meta,
  canonical, hreflang and JSON-LD.
- **Wiring**: one route renders the page on `base` and every
  `hrefFor(view)` (no remount). Keep `view` in page state, seeded once:
  ```tsx
  const hrefFor = routeHrefs(base, processSequenceRoutes.key);            // "<base>/<id>/"
  const [view, setView] = useState(() => viewFromPath(location.pathname, base, processSequenceRoutes, config) ?? null);
  <ProcessSequence config={config} view={view} onNavigate={setView} hrefFor={hrefFor} />
  ```
  The board stays mounted while closed (Forward reopens). The cards are the
  launchers (`<a href>`); history is the package's (`useRouteHistory`: open
  pushes, steps replace, close / Escape / backdrop go Back). With a host
  router owning history, pass `history={false}` and map `onNavigate`.
- **Server render**: desktop layout; the open step's copy is in the HTML from
  the first render (media held, video sources withheld), one `h1` (the
  dossier heading), the dossier root carries `data-ev-route-layer` (put
  `ROUTE_LAYER_NOSCRIPT_CSS` in a `<noscript><style>`), no `inert` / loader
  until hydration. The page's own `h1` steps down to `h2` on view URLs.
- **Prerender**: for each locale and `[null, ...views]` render the page with
  that `view`, write `dist<hrefFor(view)>index.html` with its head.
- **Verify**: library `pnpm verify:ssr process-sequence`; client: the built
  site crawled without JavaScript (per view URL: title, one h1, copy,
  canonical / hreflang, no `inert`), then in a browser: every view by click
  and by URL, Back / Forward / Escape, Ctrl-click opens the URL in a new tab,
  the board clock stays paused under a deep-linked dossier.

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
  out, hold until the next media is decoded, replay. ←/→, Esc (one level up =
  close), Tab contained, focus on close once the sheet is up, returns to the
  launching card, page scroll locked before paint (foundation
  `useScrollLock`: shared, scrollbar width kept, fixed host chrome reads
  `--ev-scroll-lock-gap`), background suspended
  (`useSuspendBackground`); Back closes, Forward reopens. It sets no `inert` on the page, so host
  chrome marked `data-ev-keep-interactive` (see `dossier` README) stays
  clickable when stacked above its z-index 1000; it is outside the Tab trap
  (pointer only while open). ≥ 768 the windowed shell keeps
  `--ev-modal-reserve-bottom` (host CSS variable, default 0, shared with
  `dossier`) free below itself for such chrome.
- **Pause model**: the clock runs only while the section is on screen (12 %),
  revealed, the tab visible, no modal open, and the active step's media
  decoded (`useInViewPause` + `useSequenceClock` + `useMediaReady`); resumes
  with the remainder.
- **Motion policy**: no `prefers-reduced-motion` branch (architecture skill).
  Stable states instead: every step reachable by click (instrument, index,
  dossier), the dossier is static once revealed, `autoplay={false}` gives a
  still board. Dossier buttons (controls, media retry) take foundation's
  press jelly (RULES §6); index rows and cards don't.

## Verification

1. `pnpm build`; showcase at 1440, 1024, 390: heading .37 / .63, no
   horizontal overflow, nothing below 9px (body ≥ 13px). No padded numbers
   on the board (`01`, `02 / 04`): orbs carry bare numbers. With ≈ 20-char
   titles, phone index titles (360 / 390) and instrument captions (1024)
   wrap to two lines, no ellipsis.
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
7. With URLs: the "Crawlable views" checks above (`pnpm verify:ssr` in the
   library).
