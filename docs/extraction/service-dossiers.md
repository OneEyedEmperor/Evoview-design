# Extraction A — Service dossier modals

Source: `/root/.vibehub/projects/evoview` (working tree, read-only) rendered at `https://evoview.said.bet`, inspected 2026-10-22.
Authority: **measured render > working-tree source > `EVOVIEW-VISUAL-GRAMMAR.md`** (grammar treated as historical hints). Governing lens: `skills/evoview-architecture/SKILL.md`.
Markers: values are measured unless tagged `[code]` (read from source, not observed) or `[derived]`.

> **Desktop scaling caveat (read first).** At ≥1024px the root font is `clamp(85.96%, .9357vw, 91.23%)`. At 1440 it renders **13.754px**, so every rem token renders at **0.86×** (16→13.75, 12→10.3, 24→20.6). The token *ratios* are the system; absolute px are viewport-dependent. Mobile (390) renders at 16px root = nominal values. Library components should express sizes in rem against a host root, not hard px.

---

## 1. Scope

| Covered | Entry points inspected |
| --- | --- |
| Dossier shell (portal modal), desktop topbar + service pager, mobile glass topbar + bottom dock, overview **selection board**, media-ready loaders, desktop **chapter strip** + completion toast, all **16 deliverable screens** (13 specialised + 3 on generic fallback) | Navbar Services tray → service rows (desktop 1440×900); home Services card (mobile 390×844); service switching via pager/dock; deliverable switching via strip tabs / dock "Suivant"; return via "Sommaire" / dock "Service" |

Sources read: `ServiceModal.tsx`, `DeliverableDetail.tsx`, all `*Detail.tsx`, `BrandAuditScreens.tsx`, `VisualSystemDossier.tsx`, `serviceModals.ts`, `serviceDeliverables.ts`, `src/index.css` (dossier blocks, type roles, tokens), `lib/motion.ts`, `lib/selectionAccent.ts`. `MODAL-DOSSIER-SYSTEM-DESCRIPTION.md` (Sept) and `SERVICE_MODALS_*_REPORT.md` (June–July) are **superseded**: they describe a hero + carousel overview and an "intro-only" pivot that are no longer rendered.

Current structure (rendered):

```text
Portal (backdrop black/80 + blur)
└─ Shell (dark, 24-tier radius desktop / full-bleed square mobile)
   ├─ Topbar           desktop: opaque bar · identity | service pager | close
   │                   mobile: floating glass capsule · identity | close (hides on scroll-down in detail)
   ├─ Chapter strip    desktop + detail only: [Sommaire] [01 tab][02][03][04] with scroll-progress underline
   ├─ Scroll body      overview = 4-tile selection board (no hero, no copy)
   │                   detail   = deliverable story: intro → 2-4 proof chapters → payoff + CTA
   └─ Mobile dock      glass, 3 cols: prev|service-home · location n/N + bars · next
```

Accent per service `[code]` `serviceModals.ts`: Identité `#6B4F7E`, Direction `#C84A4A`, Design `#C8942E`, Stratégie `#A94F16`. One accent owns the whole shell at a time.

---

## 2. Typography

Families confirmed rendered: **Overused Grotesk** (display, control labels), **Montserrat** (body, strip labels), **Satoshi** (readouts, topbar meta). Local exceptions listed at the end.

| Role (class) | Family | Desktop @1440 | Mobile @390 | Weight | LH | Tracking | Case | Where |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Payoff display (`type-immersive-display`) | Overused | **57.8** | **33.6** | 900 | .85 | −.035em | UPPER | final payoff, first-chapter of some stories |
| Deliverable title (`type-overlay-title`) | Overused | **46.8** | **33.6** | 900 | .88 | −.025em | UPPER | story intro H2 |
| Chapter heading (`type-overlay-heading`) | Overused | **39.9** | **28.0** | 900 | .90 | −.02em | UPPER | every chapter claim, 2 short lines |
| Board tile title | Overused | 24.1 (clamp 1–1.75rem) | 16.0 | 950 | .94 | **+1px** (debt) | UPPER | selection tiles, 2-line clamp mobile |
| Lead body (`type-lead-body`) | Montserrat | 15.5 | 16.0 | 600 (intro) / 400 (payoff) | 1.6 | 0 | sentence | first sentence after title |
| Body (`type-body`) | Montserrat | 13.8 | 16.0 | 400 | 1.6 | 0 | sentence | chapter copy, white/65 |
| Compact body (`type-compact-body`) | Montserrat | 11.2 | 13.0 | 400 (600–700 for item titles) | 1.55 | 0 | sentence | list detail, captions, results |
| Control label (`type-control`) | Overused | 9.5 | 11.0 | 700 | 1.1 | +.14em | UPPER | selectors, CTA text, row labels |
| Technical label (`type-technical-label`) | Satoshi | 7.7 | 9.0 | 700 | 1.2 | +.20em | UPPER | kicker over a module |
| Micro readout (`type-micro-readout`) | Satoshi | **6.9** | 8.0 | 700 | 1.3 | +.18em | UPPER | caption kicker, row index `01` |
| Topbar kicker / title | Satoshi | 7 / 9 (px, not scaled) | 7 / 9 | 700 | 1 / 1.1 | +.16 / +.105em | UPPER | `SERVICES CRÉATIFS` / `DOSSIER 01 · IDENTITÉ VISUELLE` |
| Strip tab label | Montserrat | 12.2 (clamp 10–13px) | — | 400 | 1.3 | +.015em | sentence | `Audit visuel` |
| Big metric | Overused | ~60–90 | ~40 | 900 | .9 | tight | — | `−18 %`, `+150%`, accent-coloured |

Ratios (desktop / mobile): payoff : title : heading = **1.45 : 1.17 : 1** / **1.2 : 1.2 : 1**. Heading : body ≈ **2.9×** / **1.75×**. Display compresses to ~0.6–0.7 of desktop on phone; body *grows* (13.8→16) because mobile has no root scaling.

Rules
- One display level per chapter: heading (39.9) **or** payoff (57.8), never both in a section. Title (46.8) appears once per story.
- Display = 2–3 short lines broken by meaning (`Quatre lois.` / `Un même imaginaire.`), period-terminated. The second line may take the accent colour in payoffs (Audit, Social).
- Body never uppercase; measures 342 (mobile full width) to 640–720px; standard chapter copy 405–560px.
- Opacity ladder on dark: display white, lead white/90, body white/65, compact white/55–60, readout white/35–55 or accent.
- Readouts sit **inside media captions and list indices**, not as free-floating section labels: section moment labels were removed (`MomentLabel` renders `null` in every story).

Local typography (art direction, not system): Direction photo/video use **Montserrat 800 at 115px, −.075em** for `DIRECTION` + **Gaegu** script `photo.` / `vidéo.`; board numerals use **Gaegu** at 45/32px, opacity .5; Audit site mock uses **DM Sans** (specimen of a client site).

---

## 3. Corner radius & object families

Rendered values; nominal rem tier in brackets.

| Object | Desktop @1440 | Mobile | Padding | Stroke | Surface |
| --- | --- | --- | --- | --- | --- |
| Shell | **20.6** [1.5rem] | **0** full-bleed | — | 1px white/.08 | `#0C0C0D` |
| Selection tile | 13.75 [1rem] | 16 | caption 24/20/16 | 1px accent/30 → accent on hover/focus | `#090909` + media + scrim |
| Media well / figure | 13.75 [1rem] | 16 | caption inset 20–24 | 1px accent/44 (`${accent}70`) or none | `#080808` |
| Light specimen card (paper inside dark) | 13.75 | 16 | 24–40 | none, soft shadow | white / paper (not measured exactly) |
| Selector chip / segmented pill | 10.3 [.75rem], h 38 | 12, h 44 | 12–16 × 0 | 1px white/10 | transparent → accent 22% |
| Joined selector row (desktop) | **0** | (becomes chip) | py ≥ 16, min-h 64 | bottom 1px white/10 | transparent → accent 22% |
| CTA | 10.3, h 52 | 12, h 52 | 0 × 24 | 1px white/20 | **white** fill, ink text (outline variant on Territory) |
| Topbar close | 10.3 + label `FERMER`, h 38 | 14, 40×40 icon | 10 × 16 | 1px white/22 | glass + accent bloom |
| Service pager button | round 42 | — (dock) | — | 1px white/17 | glass + accent bloom |
| Mobile topbar capsule / dock | — | 16, h 52 / 54 | 5 5 5 14 | 1px white/18 | glass rgba(20,20,22,.62) blur 28 |
| Loader module | 8 | 8 | 9 | white/10 → accent/68 | white/2.5 → accent 13% |
| Completion toast | **8px literal** | — | 12 × 16 | accent/45 | white, shadow 0 8 28 /.3 |
| Strip tab number chip | 2.9 | — | 0 × 4 | — | accent/80 |
| Dots, bars, progress | round | round | — | — | accent / white/13–16 |

Nesting rule (confirmed): **shell 1.5 › surface 1 › control .75 › tag .5 › round**. Children never exceed parent. Joined rows and full-bleed sections drop to 0. Radius is set by **role**, not by size: a 1174px figure and a 220px thumbnail both use the surface tier.

---

## 4. Layout proportions & spacing

### 4.1 Shell and chrome

| Measure | Desktop 1440×900 | Mobile 390×844 |
| --- | --- | --- |
| Shell | **1272 × 791** (`92.5rem × min(57.5rem, 100vh−2rem)`), centered, 84 side / 55 top margin | 390 × 844 |
| Topbar | 77 tall, padding 14/32, grid `1fr auto 1fr`, opaque `#0C0C0D/.95`, bottom 1px white/.07 | floating capsule 358×52 at 6/16 inset, transparent behind |
| Chapter strip (detail) | 58 tall: `Sommaire` 144px + 4 equal tabs (282 each); 3px underline track | — |
| Content rail | **1174** = shell − 2×48.1 (`3.5rem`). The authored `max-w-[1360px]` never binds below ~1710px viewport | 342 = 390 − 2×24 |
| Mobile dock | — | 358×54 at bottom 8/16 inset, `grid 3` |
| Body offsets (detail) | — | top 60, bottom 76 (clear capsule + dock) |

### 4.2 Overview selection board

```text
desktop (12 col, gap 12)            tablet 600–1023 [code]   phone <600
┌──────── 7 ───────┐┌──── 5 ────┐   ┌──────┐┌──────┐        ┌──────────┐ 170
│ 1  621×387       ││ 2 440×387 │   │  1   ││  2   │        ├──────────┤ gap 8
└──────────────────┘└───────────┘   ├──────┤├──────┤        ├──────────┤
┌─── 4 ───┐┌─────── 8 ──────────┐   │  3   ││  4   │        ├──────────┤
│ 3 350×258││ 4  711×258         │   └──────┘└──────┘        └──────────┘
└─────────┘└────────────────────┘   equal 2×2, gap 12        4 equal rows
rows 1.2fr / .8fr  (387 : 258 = 1.5)                          fills viewport
```

Diagonal balance: wide-narrow over narrow-wide (58/42 then 33/67). Board fills the shell height (stage padding 27.5/48). No copy on the overview; the sr-only H1 carries "<Service> — choose a deliverable".

### 4.3 Deliverable story

| Element | Desktop | Mobile |
| --- | --- | --- |
| Intro section padding | 27.5 top / 55 bottom | 24 / 48 |
| Chapter padding | **55** (`4rem`) vertical; Print 68.8 (`5rem`) | 48; Print 64 |
| Chapter separation | 1px white/.08 top rule + alternating bg `#0C0C0D` / `#101011` | same |
| Title/copy split (intro & chapter head) | **405 / 721** gap 48 ≈ `.72fr / 1.28fr`; copy often bottom-aligned | stacked, gap 32 |
| Selector / stage | **394 / 732** (`.7 / 1.3`) or 372/754; `.36/.64` visual system | chips row above stage |
| Payoff | **676–704 / 422–450** (`1.2–1.25 / .75–.8`); results 3-col below, CTA right | stacked, CTA full width |
| Media hero | 1174×734 (**16:10**) | 342×428 (**4:5**) |
| Stage media | 732×549 (**4:3**) | 342×257 (4:3) |
| Atlas (main + thumbs) | `1.22 / .78` → 706 + 2×2 squares (220) | main 4:3 + horizontal snap of squares (58vw) |
| Numbered row list | `48 / 132 / 1fr` (index · label · detail), rows py 20, hairlines | stacked inside row |
| Results row | 3 equal cols, gap 17, top hairline, pt 16 | stacked, hairline between |
| Proof collage (Print) | 12-col asymmetric: 678×370 (1.83) + 281×240; 479/274/387 triplet; 1174×881 (4:3) hero | single col, 4:3 / 1:1 / 4:5 |
| Story length | 2.3k–7k px desktop (2–5 chapters + payoff) | 2.6k–8.5k |

Spacing bands (rendered @1440, 0.86×): internal 6–17 (label→title 4–8, caption lines 4, chips 10); neighbour 20–48 (title→lead 24, copy→media 32, grid gaps 17–48); chapter 55–69 padding + rule. Mobile: 8 / 16–32 / 48–64. The three bands are always distinct; separation order is spacing → hairline → bg shift → bordered module.

Tablet: board 2×2 equal; topbar/dock stay glass (58 tall) up to 1023; stories use mobile stacking until `lg` (1024) `[code]`.

---

## 5. Colour & surface roles

| Role | Value (rendered) | Notes |
| --- | --- | --- |
| Environment: backdrop | black/80 + blur-sm | page suspended |
| Environment: shell / chapter A | `#0C0C0D` | |
| Environment: chapter B | `#101011` (Audit: `#121113`) | alternates with A |
| Environment: paper chapter | `#EEECEF` / `#EAE8EB` | Identité only (Audit map, Social proof). Dark ink type, same rail |
| Atmosphere | accent radial: desktop 1084px disc top-right ≈ accent 7–10% alpha; mobile top wash 68vh at accent 19% | only after shell has entered |
| Object: media well | `#080808`/`#090909` | |
| Object: specimen | white / paper cards with ink | demonstrations of client artefacts |
| Information | white ladder 100/90/65/55/35 | |
| Signal (accent) | see below | |

Accent may drive (all confirmed): strip progress underline (3px), active tab chip (80%), selected row/chip (bg 22% + border 65%, `activeSelectionAccent`), active indicator bar (22×4 vs 7×4 white/16), media border (44%), caption status dot (10px + 16px glow), list indices and kickers, big metrics, second line of payoff display, board tile border (30% → 100%), touch-cycle progress fill, loader modules + hairline, topbar kicker (accent 52% mixed into white/58), mobile dock location tint (7%) and current bar, glass tints (8–34% in gradients), payoff bloom (accent, blur-3xl, opacity .2).
Accent never drives: chapter backgrounds, body copy, CTA fill (CTA is white/ink), shell border.
Client-palette risk: accent used as *text* on `#0C0C0D` (indices, metrics) needs a lightness floor; `#6B4F7E` and `#A94F16` are already near the limit.

---

## 6. Motion

| Event | Spec | Job |
| --- | --- | --- |
| Shell open | transform `scaleX(.9) scaleY(.012)` → 1, 500ms `cubic-bezier(.23,1,.32,1)`, opacity 120ms; white screen-blend flash .45→0 / 450ms `[code]` | establish (CRT power-on, local) |
| Shell close | scaleY → .012 by 58%, then scaleX → .5, opacity → 0; 420ms easeInOut; flash rises to .95; backdrop exits after 180ms over 300ms `[code]` | acknowledge exit |
| Channel badge | glass chip top-right `CH 01 · label`, 1.5–1.6s, on open (450ms delay) and service switch | orient |
| Service switch | dark cover 70% 240ms; overview fades 100ms out / 160ms in | progress |
| Deliverable switch | dark cover 140ms; detail enters opacity + y 10 → 0, 300ms, delay 50 | progress |
| Board reveal | tiles converge from ±34px offsets, blur 5→0, scale .985→1; 520ms, stagger 100ms cinematic `[code]` | reveal |
| Chapter reveal | opacity + translateY 16→0, 600ms cinematic, stagger 80 | reveal |
| Tile hover / focus | border → accent, media grade release (grey → colour), scale 1.018 (260ms), shine sweep 900ms `(.16,1,.3,1)`, bottom edge scaleX, title −2px | select |
| Touch cycle (≤1023 / coarse) | one tile at a time takes the hover look; **2000ms dwell**, progress fill 300ms then hold; paused on `document.hidden`; transitions 700ms | demonstrate without hover |
| Media gate | overview/detail stay hidden behind a loader until every manifest asset is decoded (min 700ms once shown, 120ms grace, 45s timeout + retry) | reveal when ready |
| Strip progress | active tab underline = scroll progress; ≥90% shows completion toast pointing at next tab | progress |
| Mobile chrome | topbar + dock hide on scroll-down >6px (translate ±100%+8, 280ms cinematic), show on scroll-up / ≤24px / focus | quiet surroundings |
| Mobile dock tap | spring `(.22,1.55,.36,1)` 420–480ms: press .965, touch bloom at pointer, specular sweep | acknowledge |
| Selector change | indicator width 7→22, 300ms; stage image crossfade / object-position 300ms | compare |

Core constants (code `lib/motion.ts`): 180 / 280 / 600 / 900ms, standard `(.2,.8,.2,1)`, cinematic `(.23,1,.32,1)`, stagger 80ms. No reduced-motion branch in the dossier (consistent with the architecture skill).

---

## 7. Layout archetypes

### A1 Portal shell (repeats everywhere — **signature**)
```text
┌───────────────────────────────────────────────────────────┐ r1.5rem
│ LOGO │ kicker/title     (‹)  LABEL ▬▬▬▬  (›)      [× FERMER]│ 77
├───────────────────────────────────────────────────────────┤
│ ‹ SOMMAIRE │ 01 Tab ▔▔▔ │ 02 Tab │ 03 Tab │ 04 Tab       │ 58 (detail)
├───────────────────────────────────────────────────────────┤
│                      scroll body                          │
└───────────────────────────────────────────────────────────┘
mobile: [glass capsule: LOGO | meta      (×)]  …body…  [‹ SERVICE | 01/04 ▬ | SUIVANT ›]
```
Job: isolate, keep location + reliable return (Escape/backdrop/OS back = one level; close button = whole dossier). Signature: CRT open/close, channel badge, chapter strip with scroll-scrubbed progress, glass dock. Adaptable: logo, labels, accent, number of chapters/services.

### A2 Selection board (overview — **signature**)
4-tile 7/5 + 4/8 mosaic (§4.2). Full media + bottom scrim (black .92→.08), compact uppercase title bottom-left, numeral top-left, grey-graded media releasing colour on focus. Job: choose one of N destinations. Adaptable: media, titles, numeral face, grade strength. Only for selection (N=4).

### A3 Story intro — title / lead split + hero proof
```text
TITLE TITLE          │ Lead sentence, white/90 semibold.
TITLE                │ Body, white/65, ≤640.
──── .72 ────────────┼──────────── 1.28 ──────────────
┌──────────────── hero media 16:10 (4:5 mobile) ───────┐
│                                                      │
│ ▸ READOUT · CONTEXT                              ●   │ caption + accent dot
│ Caption title                                        │
└──────────────────────────────────────────────────────┘
```
Variants: media right of a sticky text column `.92/1.08` (generic, legacy); comparison specimen instead of media (Audit `≠`, Signature 2 logos 529/529); cinematic black title card (Photo/Video).

### A4 Selector → stage (most common chapter)
```text
HEADING.              ┌──────────── stage 4:3 ───────────┐
Heading.              │  image / specimen / mock         │
body ≤480             │  ▸ VIEW · 0n   label             │
───────────────────── └──────────────────────────────────┘
LABEL A        ▬▬▬    detail text (aria-live) ≤600
LABEL B        ▬
LABEL C        ▬
──── .70 ──────────────────── 1.30 ───────────────────────
mobile: chips row (44h, r12, horizontal scroll or 2×2) above the stage
```
Job: compare/demonstrate one variable at a time. Selection = accent tint + border + 22px bar + text contrast (never colour alone). Used by Territory laws, Strategy content, Funnel, Budget, Visual System, Signature intents.

### A5 Atlas — main frame + thumbnail grid
Main 4:3 (`1.22fr`) + 2×2 square thumbs (`.78fr`); inactive thumbs grayscale/brightness .5, active border accent/70. Mobile: main + horizontal snap strip. Job: same world, different frames.

### A6 Numbered row list
```text
──────────────────────────────────────────────
01   LABEL          detail sentence ≤520
──────────────────────────────────────────────
02   LABEL          detail sentence
```
`48 / 132 / 1fr` (range 34–96 / 90–170 / 1fr), index in accent micro-readout, label `type-control`. Job: sequence or deliverable contents without cards.

### A7 Before / after comparison
Segmented `Avant | Après` (38h r.75rem; active = accent fill) switching the same frame, or side-by-side specimen pair with a `≠` glyph, or blurred-then-revealed "3-second test". Job: compare.

### A8 Proof collage
12-col asymmetric gallery of real applications, mixed ratios chosen by artefact (1.83, 1.5, 1.33, 1, .8, .48), captions under media `NN / LABEL` micro readout. Job: physical evidence. Only when media is the content.

### A9 Instrument panel
Dark module (`#111113`, r1rem, white/.08) holding a diagram/app mock: big accent metric, timeline hairlines, sliders, status chips. Strategy family. Must be labelled illustrative ("Démonstration interactive…").

### A10 Payoff band (repeats everywhere — **signature closing**)
```text
PAYOFF LINE ONE.                          │
PAYOFF LINE TWO (accent opt.)             │
lead ≤720                                 │  [ CTA LABEL          › ]  52h white
─────────┬─────────┬─────────             │        QUITTE LE DOSSIER  (micro, right)
Result 1 │Result 2 │Result 3              │
──────── 1.2–1.25 ───────────────────────────── .75–.8 ────
```
Alternate bg, optional accent bloom top-right. Exactly one CTA per story; it leaves the portal toward contact.

### A11 Media-ready loader
Centred 460px panel: technical label `DOSSIER 01`, display `Préparation…` (clamp 1.45–2.35rem), counter `02/04`, N modules (54h r8) turning accent when ready, accent hairline progress, faint 42px grid + accent scan. Job: honest wait state.

### Per-service art direction (not system)

| Service | Signature move | Do not generalise |
| --- | --- | --- |
| Identité (violet) | Paper specimen cards and paper chapters inside the dark shell; interactive builders (support/format/message/grid toggles) | `≠` comparison and positioning map content |
| Direction (red) | Cinematic title sequence: black splash mark → full-bleed video + Montserrat 115 `DIRECTION` + Gaegu `photo.` → brand wordmark + struck-through claim → editorial collages, face/back garment toggle | eye motif, Gaegu, Montserrat display |
| Design (gold) | Proof collages of physical applications; 3 deliverables still on the generic boxed template | the generic template (legacy) |
| Stratégie (orange) | Instrument panels, metrics, funnels, radial diagrams, app UI mocks | HUD diagram decoration |

---

## 8. Coherence rules

1. **One accent per portal.** It marks selection, progress and status; it never fills a chapter or a body module larger than a chip. CTA is white/ink, not accent. (Skill: colour relational.)
2. **Radius by role, 4 tiers:** shell 1.5rem › surface 1rem › control .75rem › tag .5rem › round. Mobile shell = 0. Joined rows = 0.
3. **Chapters are open.** Heading and copy are unboxed; a chapter is separated by 55px (desktop) / 48px padding + 1px white/.08 rule + alternating `#0C0C0D/#101011`. Box only stages, specimens, instruments.
4. **Asymmetric splits only:** `.72/1.28` heading/copy, `.7/1.3` selector/stage, `1.22/.78` atlas, `1.2–1.25/.75–.8` payoff. Equal columns only for true peers (two specimens, results row, board tablet 2×2).
5. **Larger side = proof.** Media/stage takes the 1.28–1.3 side; payoff text takes the larger side because the statement is the proof.
6. **Show, then explain:** each chapter = claim (heading) → artefact (media/stage) → one interpreting sentence. Captions live inside the media.
7. **Display ladder:** one title per story, one heading per chapter, one payoff per story. Never two display sizes in a chapter.
8. **Readouts are evidence labels**, not decoration: inside captions, indices, counters. No free-floating section kickers (removed in source).
9. **Selection is multi-signal:** tint + border + bar length (22 vs 7) + text contrast + `aria-pressed`/`aria-current`.
10. **Desktop rows ↔ mobile chips.** Joined vertical rows (r0, 64h) on desktop become 44h r12 chips (scroll strip or 2×2) above the stage on phone. Mobile changes the mechanism; never stack the desktop UI.
11. **Location is always visible:** desktop strip (Sommaire + numbered tabs + scroll progress), mobile dock (`01 / 04` + bars). Return is one level at a time; close is explicit and labelled.
12. **Media gates content:** do not reveal a view before its media is decoded; show a loader with a counter and retry.
13. **Media ratio from the artefact:** hero 16:10 desktop → 4:5 phone; stage 4:3; specimens 1:1/4:5; physical proofs keep native ratio. `object-contain` for strategy/UI captures.
14. **Grade carries state:** resting tiles/thumbs desaturated and darkened; the focused one releases colour. Not a universal filter on finished proofs.
15. **Glass belongs to chrome** (mobile capsule, dock, pager, close, badge), never to reading content.
16. **One exit CTA per story**, 52px, at the end, labelled with its consequence ("Quitte le dossier").
17. **Illustrative ≠ result:** demonstrations carry a visible "exemple fictif / démonstration" line.
18. Don't: copy CRT shell motion into page sections; reuse Gaegu numerals, eyes, scan grids or Montserrat 115 display in neutral components; use the 4-tile mosaic for non-selection content; resurrect the boxed generic template.

---

## 9. Candidates for neutral library components (ranked)

| # | Name | Archetype | Props / slots | Accent palette applies to | Desktop → mobile |
| --- | --- | --- | --- | --- | --- |
| 1 | **PortalShell** | A1 + A11 | `brand` (logo slot + approved Evoview attribution slot), `kicker`, `title`, `chapters[] {id,label}`, `activeChapter`, `onClose`, `onBack`, `pager?` (prev/next groups), `loading {loaded,total}`, children | strip underline + tab chip, kicker mix, glass tints, close bloom, dock location tint + bars, loader modules, atmosphere wash | 1.5rem shell, opaque topbar + chapter strip with scroll progress + completion toast → full-bleed, glass capsule + 3-col dock, hide-on-scroll; Escape one level, focus trap, history entry |
| 2 | **SelectionBoard** | A2 | `items[4] {title, media, poster?, href/onSelect}`, `numeral` style, `grade` strength, `cycleDwellMs=2000` | tile border 30%→100%, bottom edge line, hover grade tint, cycle progress | 12-col 7/5 + 4/8, rows 1.2/.8 → 2×2 (600–1023) → 4 equal rows gap 8 + touch cycle |
| 3 | **SelectorStage** | A4 | `heading`, `body`, `options[] {label, detail, media|render}`, `stageRatio='4/3'`, `orientation` | selected row bg 22% + border 65%, indicator bar, caption kicker | joined rows `.7/1.3`, r0, 64h → horizontal chip strip (44h r12) or 2×2 above stage |
| 4 | **StoryIntro** | A3 | `title`, `lead`, `body`, `media` (+ `mediaMobile`), `caption {kicker, title}` | media border 44%, caption dot + glow | `.72/1.28` + 16:10 hero → stacked + 4:5 hero |
| 5 | **PayoffBand** | A10 (+ results row) | `lines[]` (+ `accentLine` index), `lead`, `results[3]`, `cta {label, consequence, onClick}` | accent line, bloom, CTA focus ring only (CTA stays white/ink) | `1.2/.8` text/CTA, 3-col results → stacked, CTA full width 52h |
| 6 | **IndexedRows** | A6 | `rows[] {index?, label, detail}`, `columns=[48,132,'1fr']` | index colour | 3-col rows with hairlines → label/detail stacked |
| 7 | **CompareToggle** | A7 | `states [before, after] {label, render}`, `mode: toggle | pair` | active segment fill, `≠` marker | segmented 38h r.75rem → 44h r12, full width |
| 8 | **ProofAtlas** | A5 (A8 as `layout="collage"`) | `items[] {media, label, note, ratio}`, `layout: atlas | collage` | active thumb border, caption kicker | `1.22/.78` main + 2×2 / 12-col collage → main + snap strip / single column |

Recommended wave-2 order: 1 → 3 → 2 → 5 (together they make a complete demonstrable portal); 4/6/7/8 are chapter fillers.

---

## Grammar doc vs reality

| Grammar claim | Rendered / source reality |
| --- | --- |
| Shell 1480 × min(920, 100vh−32), radius 24 | 1272 × 791, radius 20.6 at 1440 (rem tokens × 0.86); 1480 only at ≥1710 |
| Surfaces 16, controls 12 | 13.75 / 10.3 desktop; 16 / 12 only on mobile |
| Dossier rail 1360, padding 24/40/56 | Rail never binds at 1440; width = shell − 2×48 = 1174; padding 24 / 48.1 |
| Section padding 48 mobile, 64–80 desktop | 48 mobile, 55 desktop (Print 64/69) |
| Body 16, technical 8–11, readouts ≥8 | Desktop body 13.8, compact 11.2, micro readout **6.9px**, control 9.5 |
| Overview: hero + deliverable carousel + contact (MODAL doc) | Overview is only the 4-tile board; no copy, no carousel |
| Tiles have a 44px circular arrow | No arrow rendered (CSS hooks only) |
| Selection tile 1.4px accent border | Renders 1px (accent/30 resting) |
| Gaegu only for process annotation | Board numerals and Direction `photo.`/`vidéo.` use Gaegu |
| Display tracking always negative | Board tile titles render +1px (`.font-heading` utility overrides `tracking-[-.02em]`) |
| Desktop previous/next as two equal peer controls at story end | Not rendered; replaced by the chapter strip + completion toast; mobile dock "Suivant" |
| Dossier is a dark family | Identité stories embed paper chapters `#EEECEF` / `#EAE8EB` |
| Topbar and mobile nav are dense glass | Desktop topbar is an opaque bar; glass only on mobile/tablet capsule and dock |
| Supply `prefers-reduced-motion` handling (§13) | Dossier has none, matching the architecture skill (one full-motion experience) |
| DM Sans unused | Used inside the Audit client-site mock (specimen) |
| Generic deliverable on 1360 rail | Generic template uses `max-w-[1280px]`, sticky `.92/1.08` column and boxed modules; still serves 3 Design deliverables |

Not verified visually: tablet 600–1023 board/chrome (code only), keyboard focus order and Escape layering (code only), close/open animation frames (code only).
