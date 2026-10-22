# Extraction B — La méthode Evoview (`#intro`)

Source: `/root/.vibehub/projects/evoview` working tree (HEAD `9b07a79` + uncommitted work), live dev `https://evoview.said.bet`, inspected 2026-10-22 with agent-browser at 1440×900, 1024×1024, 768×1024 and 390×844.

- **M** = measured on the rendered site (computed style / bounding box). **C** = current source only, not observed.
- Authority: rendered site > working-tree source > `EVOVIEW-VISUAL-GRAMMAR.md`. The grammar is used only as a list of hints. Its claims that disagree with reality are collected in §10.
- Governing lens: `skills/evoview-architecture/SKILL.md` (cited as **ARCH**).

> **Desktop composition scale (load-bearing, undocumented in the grammar).** At ≥768px `:root` font-size is `85.9649%` (13.754px). From 1024px it is `clamp(85.96%, .9357vw, 91.23%)`, reaching 14.6px at ≥1560px (`src/index.css:217-231`). Every rem value renders at ×0.86 at 1440. Examples: the 1rem card radius is 13.75px, the 9rem chapter padding is 123.8px, the 1360px rail is 1169px and the 1.5rem modal shell is 20.6px. Px-authored values do not scale: the card title (24px), the battery (16px), its labels (11px), the close button (40px/14px) and the index chips (9px). Values below are **as rendered at 1440**, with the authored token in brackets. The library must decide whether to adopt this scale.

---

## 1. Scope

| In | Files |
| --- | --- |
| Section shell, stage textures, heading + progress battery, 2×2 phase grid, mobile phase index, single mobile monitor | `src/components/IntroSection.tsx:873-2189`, `IntroSection.css:1-350` |
| Phase card (3 states, CRT/TV treatments, tilt, completion eye, shine) | `IntroSection.tsx:1009-1805`, `IntroSection.css:352-620, 977-1017` |
| Desktop step modal (split stage/sheet, channel switch) | `IntroSection.tsx:449-871`, `IntroSection.css:622-933` |
| Mobile step modal (full sheet) | `IntroSection.tsx:86-447`, `IntroSection.css:935-975`, `src/index.css:2240-2310` |
| Media-ready gate | `src/hooks/useMethodModalMedia.ts` |
| Eye completion mark (stroke-traced raster) | `MethodEye.tsx`, `MethodEye.css`, `public/method-icons/eye-{1..4}.png`, `methode-wordmark.svg` |
| Data | `src/data/methodSteps.ts` (+ `.en`). `method-modals-content.txt` is older copy, superseded by the data file |
| Decisions | `a127bbb` mobile simplification, `facb4d9` card-state normalisation, `bd7ee5f` status language, `979c00a` pause monitor under modal, `87e8545` focus containment, `71bb734` overlay radius hierarchy; `artifacts/visual-system/motion/m4, m6` |

`useProcessPlayback.ts` does **not** drive the method. It belongs to the 6-stage Process section (`FeaturesSection.tsx:857`). Only its `useProcessClock` idea transfers: only active, visible time counts, and suspension never resets it. The method re-implements the same semantics inline (`IntroSection.tsx:1984-2032`).

---

## 2. Typography (all **M** unless marked)

| Role | Family | Desktop (1440) | Mobile (390) | Wt | LH | Tracking | Case | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Section title (`SectionHeading` split/dark) | Overused Grotesk | 29.2px [2.125rem] | 22.6px | 900 | 1.1 | −.015em | upper | shared component |
| Title inserts | `méthode` handwritten wordmark SVG with eye + Evoview logo, 1.456em / 1.1em | — | — | — | — | — | — | **SIGNATURE, do not clone** |
| Battery caption (completed phase) | Satoshi | 11px | hidden | 700 | 1.5 | +.14em | upper | local |
| Card title | Overused | 24px (px, unscaled) | 16px | 900 | 1.0 | 0 | upper | family |
| Card description | Montserrat | 13px | 11px | 400 | 1.5 | 0 | sentence | 11px is too small for body text (see rule 12) |
| Status pill "En cours…" | Satoshi | 10px | 9px | 700 | 1 | +.05em | upper | family |
| Idle placeholder "PHASE N" | Satoshi | 11px | 11px | 700 | — | +.30em | upper | family |
| Reset pill "Réinitialisation…" | Satoshi | 15px **C** | 13px **C** | 700 | 1 | wider | upper | local |
| Mobile index number | Satoshi (`type-file-index`) | — | 15px | 700 | 1 | 0 | — | family |
| Mobile index title / status | Overused / Satoshi | — | 10px +.08em / 8px +.12em | 600 / 700 | 1.1 / 1.5 | + | upper | family |
| Modal heading | Overused `type-overlay-heading` | 39.9px; 34.8 @1024; 20.6 @768 | 24px (`type-card-heading text-2xl`) | 900 | .90 / 1.05 | −.02em / **+.025em** | upper | desktop/mobile tracking disagree |
| Modal intro | Montserrat `type-body` | 13.75px [1rem] | 13.5px | 400 | 1.6 | 0 | sentence | — |
| Numbered item label | Montserrat `type-compact-body` | 11.2px | 13px | 500 | 1.55 | 0 | sentence | 11.2 is small because of the desktop scale |
| Item index chip | Satoshi | 9px | 9px | 700 | — | +.06em | — | family |
| Progress readout "02 / 04" | Satoshi `type-micro-readout` | **6.9px** | 10px | 700 | 1.3 | +.18em | upper | illegible at 1440, do not inherit |
| Prev/next labels | Overused `type-control` | 9.5px, +.14em, upper | Montserrat 13px 500, sentence | 700 | 1.1 | — | — | desktop/mobile mismatch |
| Objective (mobile only) | Satoshi label 9px +.25em + Montserrat 12px / 1.625 | not rendered | rendered | — | — | — | — | data has it; desktop omits it |
| Stage numeral + label | **Gaegu** 117px [8.5rem] + 24px [1.75rem] | — | header 34px; stage 20/36px | 400 | 1 | −.04em | — | **SIGNATURE** |

Observed ratios and rules (concretizing ARCH "one primary subject"):
- In the modal, one display level dominates. The heading-to-intro ratio is ≈2.9:1 at 1440 (39.9/13.75) and 1.8:1 on mobile (24/13.5).
- On the card, title to description is 24:13 (1.85) desktop and 16:11 (1.45) mobile.
- Satoshi text only ever carries *state* (status, index, caption, count) and never explanation. Explanations are Montserrat. Headings are Overused 900, uppercase and tight.
- Card titles reveal with a 15-step typewriter (0.8s). The battery caption tightens its tracking from .42em to .14em as it appears. These are the only typographic animations.

---

## 3. Corner radius & object families

| Object | Radius (authored → @1440) | Padding / size | Stroke | Surface |
| --- | --- | --- | --- | --- |
| Section | 0, full-bleed | [9rem/7.5rem] → 124/103 desktop; 96/80 mobile **M** | — | stage gradient + 5 layers (§5) |
| Progress battery shell | 4px **M** | h16, inner inset 5/11/5/5 | inset 1px white/.28 **M** | black/.5 + `blur(16px)`, glow `rgba(99,75,114,.3)` |
| Battery cell | 1.5px **M** | 4 cols, gap 3px, ~177×6 **M** | inset 1px white/.045 | white/.055; hover white/.16 |
| Battery terminal | 0 1.5 1.5 0 | 3×8 | — | currentColor .5 |
| Phase card (outer frame) | [1rem] → 13.75px; 16px mobile **M** | frame padding: active 2.5 / complete 1 / idle 0 px **M** | conic spin ring (active) / `rgba(99,75,114,.4)` fill (complete) **M** | — |
| Phase card (inner) | `calc(1rem − frame)`, **concentric** | — | — | `linear-gradient(135deg,#1a1a22,#111117,#09090d)` + 4% sheen |
| Card media | inherits | aspect **2.15:1** desktop, **1.79:1** mobile **M** | — | `#0b0b10` |
| Card content band | inherits | [1.5rem] → 20.6 desktop / 16 mobile; min-h 120/100px **M** | 6px top shade | active: pearl ribbon; else card |
| Status pill | 4px outer / 2px inner | h 18–22 **M**, 2px conic ring | spinning conic | `#17161b` |
| Mobile phase control | 12px **M** | 47px tall, pad 10/12, 2-col gap 8 **M** | 1px | idle white/.04; complete indigo/.22; current `#fff` |
| Desktop modal shell | [1.5rem] → 20.6px **M**; 0 below 768 **C** | max-w 64rem / 1200 (xl) / 1360 (2xl); h `min(85vh,720)` / `min(85vh,780)` xl → 765 **M** | ring 1px white/.12 **M** | `#0c0c0d` **M**; shadow 0 40 100 −28 black/.9 + indigo bloom |
| Modal stage | none (clipped by shell) | — | 1px white/.06 right rule | black + video .8 opacity |
| Close | 14px **M** | 40px desktop / 44px mobile **M** | 1px white/.22 | glass `blur(12px)` + accent radial |
| Numbered item | **999px stadium** **M** | 48–51px tall, pad 7/18/7/7 **M** | 1px accent-deep @40% | accent-deep gradient from the left + glass |
| Item index chip | round | 32px | inset 1px white/.16 | `#19171d→#0c0b0f` |
| Prev/next button | [.75rem] → 10.3px; 14px mobile **M** | 46px tall **M**; pad 8/8/8/18 | 1px white/.2 (ghost) | solid `#fff` / ghost transparent |
| Button icon well | 8px | 28px | — | ink/.08 on solid |
| Modal progress cells | 999px | 4 × 3px, w104 (88 mobile), gap 4 **M** | — | idle white/.13, complete accent, current white + glow |
| Mobile video well | 16px **M** | 16:9, 350×197 **M** | inset 1px white/.08 | black |

Rendered nesting (concretizes ARCH "coherent object families"; the parent radius is never smaller than the child's):
```
20.6 modal shell ─┬ stage (flush, no radius)
                  └ 10.3 button ─ 8 icon well ─ round chip/cell
13.75 card ─ (13.75 − frame) inner, concentric ─ 4 status pill ─ round dot
4 battery ─ 1.5 cells
mobile: 16 card / 16 video well / 12 controls / 14 sheet buttons / 0 sheet
```
- The card's state is drawn in its **frame thickness**: 2.5px when active, 1px when complete, 0 when idle. The inner radius subtracts the frame so the corners stay concentric. This is reusable: state as frame, not as a badge.
- The numbered items are stadium pills holding copy. Their text is capped at ≤5 words / 42 chars (`methodSteps.ts:26`), which keeps them label-like. Treat them as **labels**, not as a container precedent for prose.

---

## 4. Layout proportions & spacing (**M** unless marked)

### Section (desktop ≥768)
| Element | Value |
| --- | --- |
| Rail | `site-container-wide` [1360] → 1169 @1440, 941 @1024, 713 @768; left/right gutter ≈135 @1440 |
| Heading row | Split: title at its intrinsic width (399px) + `column-gap clamp(20,2.5vw,36)` + battery `flex 1 0 200px` (734px). Title:instrument ≈ **.37 / .63** |
| Battery captions | Sit 5px above the cells, centred per cell (the same 4-col grid) |
| Heading → grid | [2.75rem] → 37.8px |
| Grid | 2 equal columns, gap [1.5rem] → 20.6px. Each column is an **independent flex stack**: col A = 01, 03; col B = 02, 04. Reading order is a Z. The active card grows by ~60px and only pushes its own column |
| Card sizes @1440 | 574×336 complete · 574×396 active · 574×387 idle |
| Height stability **C** | `useStableGridHeight` models the tallest of the 4 phase layouts and reserves it as `min-height` on a wrapper. The chapter never resizes during the cycle |
| Section height | 1111px @1440×900: taller than one viewport, so the whole grid is not visible at once |
| Tablet 768 | Same 2-col grid with 346px cards. The 24px px-titles stay full size, which is the tightest width observed |

### Section (mobile <768)
| Element | Value |
| --- | --- |
| Padding / rail | 96 top / 80 bottom; rail 350 (20px gutters) |
| Heading → index | 36px |
| Phase index | 2×2 grid of 47px controls, gap 8; then 16px to the monitor |
| Monitor | **one** card only (the active phase), 350×298, media 1.79:1 |
| Total | 685px: one chapter fits inside one 844px viewport |

### Desktop modal
| Viewport | Shell | Stage : sheet | Items |
| --- | --- | --- | --- |
| 768 | 741×720, rounded, 14px viewport inset **M** | 309 : 432 = **5/12 : 7/12** **M** | 1 col **M** |
| 1024 | 880×720 **M** | 367 : 513 = 5/12 : 7/12 **M** | 2 col **M** |
| 1440 | 1200×765 **M** | **600 : 600** (`xl:w-1/2`) **M** | 2 col, gap 6.9 **M** |
| ≥1536 | 1360/zoom **C** | 54 : 46 **C** | 2 col **C** |

- Sheet padding **M** @1440: 34 top / 41 sides; padding grows at xl **C**.
- Content is **vertically centred** in the sheet (`my-auto`).
- The footer is sticky, with a 1px white/.08 rule on top and an 18px fade shadow.
- Vertical rhythm @1440: heading → 13 → progress row (54) → 21 → intro → 20 → list → 24 → footer (99 incl. padding).
- The stage numeral sits bottom-left with a 24/32px inset. REC is top-left.

### Mobile modal (full sheet, 100dvh, 0 radius) **M**
`header 72` (Gaegu number + phase label + truncated title + 44px close) → scroll body (pad 20): 16:9 video well (350×197) → 20 → progress row 46 → 8 → heading → 16 → intro → 20 → items stacked (gap 10, 48px each) → 20 → objective → `footer 74` sticky (46px square back + flex-1 primary). The body scrolls 949px of content inside 698px.

Observed spacing bands (concretizes ARCH "spacing communicates internal / neighbour / chapter"):

| Band | Use |
| --- | --- |
| 3–5px | instrument optics (battery insets and gaps, cell gaps) |
| 8–16px | internal grouping (index grid, chip/label, list gap) |
| 20–24px | sibling objects (grid gap, sheet sections) |
| 36–38px | heading → stage |
| 80–124px (96–144 authored) | chapter |

---

## 5. Colour & surface roles

| Role | Values | Notes |
| --- | --- | --- |
| **Environment** | `#0a0a0f → #08080c → #060608` **M** stage + layers **C**: silver top spill `rgba(178,172,216,.09)`, indigo floor `rgba(63,81,181,.22)` bottom-right, red ember `rgba(196,42,52,.03)` left, 3px phosphor dot field, 3px scanlines masked to the top, screen-blend grain, 220px top/bottom vignettes | Textures stay under the content. **Phosphor and scanlines are Evoview motifs** |
| **Object** | card `#1a1a22→#09090d`; modal `#0c0c0d` **M**; media `#0b0b10`; modal backdrop `rgba(6,6,9,.78)` + indigo radial + `blur-xl` | Dark-on-dark objects are separated by shadow and frame, not borders |
| **Active object inversion** | Pearl ribbon `#fbfafc→#f1f0f4` with key light and grain; title ink `#17161b` **M**, description ink/.72 **M** | **The primary active signal is inversion**: a paper band inside a black chapter, wiped in like a lower third. It survives any palette (ARCH "preserve contrast hierarchy across palettes") |
| **Information** | white .85 / .80 / .70 / .60 / .45 / .30 / .20 ladder **M**; ink `#17161b` on paper | idle title at white/.30 reads as "not yet" |
| **Signal: current** | White: charging battery fill, modal current cell + 10px glow, mobile current control (white bg, ink text, indigo number) **M** | The section marker accent renders `#ffffff` **M** (`sectionAccents.ts` `intro`) |
| **Signal: complete** | Purple `#634b72`: battery fill at opacity .4/.6/.8 by order (oldest dimmest), card frame `rgba(99,75,114,.4)` **M**. Indigo `#3f51b5`/`#5b6cd1`: mobile index complete **M**, modal cells, item tint, pointer glow | **Inconsistent**: 8 violet/indigo values (`#634b72 #3f51b5 #5b6cd1 #303f8f #33408f #121858 #c4a0d6 #9fa8da`) within one section |
| **Signal: progress** | Ribbon bar `#121858` on ink/.10, 2px | Linear over the phase duration |
| **Signal: warning/REC** | `#ef4444` reset pill + battery reset; red-500 REC dot, 1s blink | Camera motif = Evoview |

**What a client accent may drive.** Map these to `--<name>-accent` / `--<name>-accent-deep`; one component owns the accent at a time (ARCH "use colour relationally"):
- complete-state fills (battery cells and their opacity ramp, card frame tint, mobile index complete);
- modal current/complete cells;
- numbered-item gradient and border;
- close-button radial and backdrop bloom;
- pointer glow;
- ribbon progress bar;
- focus ring.

**Must not be accent-driven:**
- The current state stays white/paper inversion, so selection never relies on colour alone.
- Body text stays on the neutral ladder.
- The environment stays neutral dark, with at most one accent-tinted floor bloom.
- Red is reserved for an explicit alert. Clients get a neutral drain, not a red alarm (§8 table).

---

## 6. Motion (source timings; sequencing observed live: wrap/power-on, ribbon wipe, loader state, channel switch)

Easings: cinematic `cubic-bezier(.23,1,.32,1)` for almost everything; card tilt release `(.16,1,.3,1)`; channel-in `(.16,1,.3,1)`; shine `(.45,0,.25,1)`.

### Section
| Event | Duration / easing | Choreography | Job (ARCH) |
| --- | --- | --- | --- |
| Section reveal | 700ms cinematic; heading translateY 30; cards translateY 40 staggered `150 + 120·i` ms | One-shot at 50% visible (desktop), or on approach with a 200px margin (mobile) | reveal |
| Auto-cycle | **4000 / 4000 / 4000 / 6000 ms** | Only active, visible, unsuspended time counts; the remainder carries over. Pauses when off-screen (200px margin), on `document.hidden`, while a modal is open, and before reveal | progress |
| Battery charge | linear over the phase; `scaleX 0→1`, opacity .55→1 | Current cell only; completed cells snap full | progress |
| Battery caption | 650ms; rise 7px, tracking .42→.14em, blur 4→0 | Appears only when its phase completes, "locking onto" its cell | acknowledge |
| Phase → complete | 350ms `ease-in-out` grid-row collapse (`1fr→0fr`) + opacity; 700ms dim (black/.72 + radial focus); eye stroke-draw ~1s; **foil shine** 1260ms after 350ms, consecutive cards queued 600ms apart | The card shrinks to a full-bleed media tile with a centred mark | acknowledge / compare |
| Phase → active | **TV power-on 900ms** (`scale(.04,.006)` → line → 1.06 overshoot → settle; brightness 8→1) + 8×120ms snow; ribbon clip wipe L→R 700ms; title typewriter 800ms `steps(15)`; description fade 800ms after 800ms; status pill conic spin 2s linear; card glow pulse 2s | Picture first, label second, explanation third | reveal |
| Last-phase reset | At 4/6 of 6000ms: bar turns red, video pauses, red "Réinitialisation…" pill (350ms fade), battery red blink (.72↔1), ±0.8px shake, right→left drain clip over 88–98% | Then wraps: all complete cards return to idle | progress (cycle boundary) |
| Idle rewind | videos rewind 1200ms after the wrap | Keeps seeks out of the choreography frames | performance |
| Hover (fine pointer) | tilt rx ±4°, ry ±5° (100ms linear tracking, 500ms release), scale 1.015; media scale 1.05 / 700ms; pointer shine + indigo glow (300/400ms) | Hover never changes the phase or pauses the clock. It prefetches the modal video | acknowledge |
| Idle textures | CRT sweep 3s loop, REC blink 1s | Ambient; quieter than any state change | atmosphere |

### Desktop modal (opens only once the media is fully buffered)
| t (ms) | Element | Motion |
| --- | --- | --- |
| gate | loader | Appears if not ready after **350ms** and stays ≥**500ms**; fails at 20s with Retry; text status + `aria-live` (loader observed **M**) |
| 80 | stage | clip `inset(0 0 100% 0)→0` 400ms (top-down curtain); video `scale 1.15→1` 800ms |
| 100 | heading | clip wipe (left inset 100%→0) 350ms |
| 150 | eye + cells + readout | clip wipe 300ms |
| 200 | intro / stage numeral + label | opacity + 8px rise 350ms / clip up 350ms |
| 260 + 40·i | items | opacity + 6px rise 300ms |
| 300 | footer | opacity + 10px rise 300ms |
| 350 | REC HUD | fade 350ms |
| 600 | watermark eye | stroke draw |
| prev / next | channel switch | `methodChannelOut` 180ms (collapse to a scan line) → navigate at 200ms → hold until the next media is buffered → `methodChannelIn` 360ms + interference lines; the text replays its stagger. `←`/`→` keys work **M** |
| close | exit | 350ms; focus returns to the launcher; body scroll restored |

### Mobile modal
- Backdrop opacity 300ms. The sheet moves translateY 24→0 in 320ms cinematic.
- `--msm-d` stagger: header 80 · close/video 140 (video soft-scale 580ms from .985) · progress 220 · heading 280 · intro + HUD 360 · items `440 + 60·i` (fade-left 6px, 300ms) · objective after the items + 80 · footer 700.
- One 820ms scan sweep at 220ms.
- No channel switch: steps swap through a re-keyed reveal.

### Reduced motion
The method has **no** `prefers-reduced-motion` handling (0 hits in its sources). This matches ARCH: "one full-motion experience; do not add reduced-motion handling". The library should copy the **pause model** (visibility, page-hidden, modal suspension), not a reduced-motion branch.

---

## 7. Layout archetypes

### A. Sequence board ("process monitor"): signature composition
```
┌ wide rail ─────────────────────────────────────────────────────────┐
│ ● TITLE (≈.37)        ── caption1 ── caption2 ──                   │
│                       [████|████|██▌ |    ]▐  segmented progress   │
│                                                     (≈.63)         │
│ ↕ ~38                                                              │
│ ┌──── col A ─────────┐ gap ~21 ┌──── col B ─────────┐              │
│ │ 01 complete (tile) │         │ 02 ACTIVE          │              │
│ │   media + mark     │         │ media 2.15:1       │              │
│ └────────────────────┘         │▓ paper ribbon ▓▓▓▓▓│              │
│ ┌────────────────────┐         └────────────────────┘              │
│ │ 03 idle            │         ┌────────────────────┐              │
│ │  • PHASE 3         │         │ 04 idle            │              │
│ │ title/30  —        │         └────────────────────┘              │
│ └────────────────────┘                                             │
└────────────────────────────────────────────────────────────────────┘
```
- **Job:** show a sequence by playing it. One step is active, completed steps stay as compared evidence, future steps are visibly pending.
- **Adaptable:** step count (3–6, keeping 2-col Z order), durations, media, copy, completion mark, accent.
- **Signature:** one-active-at-a-time timed playback, the paper-ribbon inversion, state-as-frame cards, captions that lock onto completed segments, and the completion shine.

### B. Segmented progress instrument
`[ cell | cell | cell | cell ]▐` with captions above. It comes as a 16px header bar or a 3px inline cell row. Cells are clickable, each with an ~70px-tall invisible hit area. **Job:** progress plus direct navigation. The battery *terminal nub and red reset drain* are Evoview flavour. Equal segments with a charging fill are the reusable pattern.

### C. Three-state step card
```
idle      → frame 0, dark media + "● PHASE N", title white/30, "—"
active    → frame 2.5 spin ring, live media, paper ribbon: TITLE · [EN COURS…] / 2px progress / description
complete  → frame 1 accent, media full-bleed, dim .72 + radial focus, centred mark, no text
```
**Job:** one object carries the whole lifecycle. The column stack and the reserved grid height absorb its height changes.

### D. Step dossier (split modal)
```
┌ shell ───────────────────────────────────────────────────┐
│ ● REC                     │ HEADING LINE 1          [×]  │
│                           │ HEADING LINE 2               │
│   media (cover, .8)       │ (mark) ▬ ━ ▬ ▬  02 / 04      │
│   grade + monitor layers  │ intro paragraph (~518px)     │
│                           │ (01 item)(02 item)           │
│  logo / label             │ (03 item)(04 item)           │
│  02  ← giant numeral      │ ───────────────────────────  │
│                           │ [← Précédent]  [Suivant →]   │
└ stage 5/12 (→1/2 xl) ─────┴ sheet 7/12 ──────────────────┘
```
**Job:** isolate one step, show its proof, explain it and move to the neighbour. The last step swaps "Next" for the primary CTA (`#contact`). Concretizes ARCH "Portal: isolate, demonstrate, explain; reliable return".

### E. Mobile: index + single monitor
```
[01 ANALYSE · EN COURS ][02 LANGAGE · À VENIR]
[03 CRÉATION · À VENIR][04 DÉPLOIEMENT · …   ]
┌ the one active card ┐
```
Concretizes ARCH "reduce simultaneous content before reducing legibility". Four 47px controls replace both the battery and three monitors.

### F. Mobile step sheet
A full-screen sheet with three parts:
- sticky header: index + title + close;
- scroll body: 16:9 well, progress, heading, intro, items, objective;
- sticky footer: square back button + flex primary.

The desktop split is not reused.

---

## 8. Coherence rules

1. **Exactly one active step.** It alone has live media, the inversion surface and the charging cell. Everything else is idle or complete. *(ARCH one primary subject; `IntroSection.tsx:2115-2136`)*
2. **Signal the active step by contrast first.** Use the paper band, the white current cell and the white mobile control. Accent colour only encodes *completion*. Never carry state by colour alone. *(ARCH responsive/accessible; §5)*
3. **Show, then explain, in time.** Media powers on first (0ms), the title types in (≤800ms) and the description follows at +800ms. In the modal, the stage leads the text by 20–220ms. *(ARCH show-then-explain)*
4. **Only active, visible time advances the sequence.** Pause off-screen, on page-hidden and under a modal. Resume with the remaining time and never restart a step. Do not advance while media is unavailable. *(ARCH "never advance a narrative because unavailable or suspended time elapsed"; `979c00a`)*
5. **Gate media reveal on readiness.** Show the loader only after 350ms, keep it ≥500ms with a text status, and offer Retry on failure. Never flash it on cached switches. *(ARCH "reveal media when ready"; `useMethodModalMedia`)*
6. **Asymmetric split.** Stage/sheet should be 5/12 : 7/12 (rendered at 768–1279) and title/instrument ≈ .37/.63 (rendered). The 50/50 at 1280–1535 is the one symmetric state; do not copy `xl:w-1/2`. *(ARCH "stable structure, changing emphasis… asymmetry through scale")*
7. **Draw state with the frame, not extra chrome.** Use 0 / 1 / 2.5px frames and concentric inner radii; add no "done" badges. *(`facb4d9` removed duplicate status chrome)*
8. **Height changes must not move the chapter.** Each column is an independent stack, and the grid reserves its tallest height. *(`useStableGridHeight`)*
9. **Mobile changes the mechanism.** Use 2×2 compact controls plus one monitor. Never stack four monitors, and drop the battery below 768. *(ARCH responsive; `a127bbb`; M4 evidence)*
10. **Content pills are label-only.** Numbered stadium items stay ≤5 words / 42 chars; longer copy goes into prose. *(`methodSteps.ts:26`)*
11. **Use the shared heading.** `SectionHeading` split/dark with the 20px REC marker in the section accent (measured 20px, 6px radius). The side slot holds the instrument.
12. **Legibility floors after scaling.** Body copy ≥13px rendered and readouts ≥9px rendered. Do not inherit the observed 11px mobile card copy, 11.2px desktop items or the 6.9px "02 / 04" readout. *(ARCH "reduce simultaneous content before reducing legibility")*
13. **Keyboard parity.** Cards are `role=button` (Enter/Space). Cells use `aria-current="step"` with labels giving phase, title and status. The modal traps Tab, focuses close on open, restores focus to the launcher, and supports Esc, ←/→. *(`87e8545`; ←/→ and Esc verified **M**)*
14. **Repeat meaning, not decoration.** The eye, CRT/TV power-on, noir grade, phosphor/scanlines, REC dot, Gaegu numerals, `méthode` wordmark and red "Réinitialisation" are **Evoview's own subject matter**: a brand about *seeing*. Do not ship them to clients. Re-express each one's *role* (table below). *(ARCH final rule)*
15. **Attribution is not implied.** The modal stage carries an Evoview logo above the step label. In client components this is a *candidate* attribution slot only. Do not add it, or a link, without an approved mark and destination. *(STRATEGY "Make attribution intentional")*

| Evoview motif (do not clone) | Its role | Neutral library replacement |
| --- | --- | --- |
| Eye artwork stroke-drawn on completion (`MethodEye`) | completion mark / phase identity | `completionMark` slot: client icon, check or step numeral, revealed by SVG stroke or clip (keep the ~1s draw) |
| TV power-on + snow, CRT stack, noir | "this step is now live" | clip/opacity reveal of the media (400–700ms cinematic), optional single light sweep |
| Channel switch in the modal | step change | 180ms out / 360ms in crossfade + 8px vertical shift; hold until ready |
| Battery terminal, red reset blink/shake/drain | cycle boundary | neutral right→left drain of the segments (≤400ms), no red, no shake |
| REC dot, "PHASE N" placeholder | pending | muted index + "À venir" label |
| Gaegu numerals | step identity on the stage | Overused 900 / `type-file-index` numeral, clipped up |
| Phosphor/scanline/grain stage | atmosphere | neutral dark field + one accent floor bloom (optional client texture) |

---

## 9. Candidates for neutral library components (ranked)

| # | Name | Archetype | Props / slots | Accent palette | Desktop | Mobile |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **`process-sequence`** (section) | A + B + C + E | `steps[{id,title,summary,media{src,poster,ratio},detail}]`, `durations[]` (default 4/4/4/6s), `autoplay`, `heading` node, `completionMark(step)` slot, `onOpen(i)`, `theme` dark/light | `--process-accent` → complete cells (opacity ramp .4/.6/.8/1), complete frame, ribbon progress, pointer glow, focus. Current = paper inversion, fixed | Split heading with a segmented bar; 2-col independent Z stacks; reserved height; hover tilt ≤1.015 | 2×2 47px index + one active card; auto-cycle continues |
| 2 | **`step-dossier`** (modal) | D + F | `step`, `index`, `total`, `media` (video/img, ready-gated), `headingLines[]`, `intro`, `items[]` (≤42 chars), `objective`, `onPrev/onNext`, `finalCta{label,href}`, `stageLabel` | `--dossier-accent` / `-deep` → item tint and border, current/complete cells, close radial, backdrop bloom | Rounded shell, stage 5/12, sheet centred with sticky footer, ←/→, staggered reveal, ready-gated crossfade | Full sheet, sticky header/footer, 16:9 well, stagger 80→700ms |
| 3 | **`segmented-progress`** | B | `count`, `active`, `complete:Set`, `duration`, `paused`, `labels[]`, `onSelect(i)`, `size: bar16 \| cells3` | Fill = accent for complete, white for charging; caption tracking-lock 650ms | Header instrument with captions | Hidden or `cells3` inside sheets |
| 4 | **`step-card`** (3-state) | C | `state: idle\|active\|complete`, `media`, `title`, `description`, `status` label, `progress` (0–1 or duration), `mark` slot, `ratio` (2.15 / 1.79) | Complete frame tint + mark; active progress bar | Ribbon wipe, typewriter title, shine on complete | Same object, 16px content padding, description ≥13px |
| 5 | **`numbered-items`** | list in D | `items[]`, `columns: 1\|2` (2 at ≥1024), `startIndex` | Gradient tint from `--accent-deep` at 36→10%, border at 40% | Stadium 48px rows, 32px index chip | Stacked, no backdrop-filter |
| 6 | **`use-sequence-clock`** + **`use-media-ready`** (hooks) | behaviour | clock: `(key, enabled, duration, onElapsed)` with remaining-time carry; media: `(open, src) → {ready, slow, failed, retry}` with 350/500/20000ms | — | Shared by 1, 2 and any carousel | Same |

**Top 3:** `process-sequence`, `step-dossier`, `segmented-progress`. Each ships with a showcase page using the accent picker, like `/reservation`. Each README/SKILL must carry three things:
- the rule 14 replacement table;
- the rule 15 attribution caveat;
- the 4/4/4/6s pacing and pause model, as the protected signature.

### Open questions for wave 2
- Should the library adopt the ×0.86 desktop composition scale? If yes, recheck rule 12 floors after scaling.
- Should the desktop modal keep an `objective` block? The data has one and only mobile renders it.
- Pick one accent family. The site mixes purple `#634b72` and indigo `#3f51b5` within one section.

---

## 10. Grammar doc vs reality (method scope)

| # | `EVOVIEW-VISUAL-GRAMMAR.md` says | Rendered / current source |
| --- | --- | --- |
| 1 | Audit base commit `8195b1f`, 2026-09-10 | HEAD `9b07a79` + a large uncommitted tree |
| 2 | Surfaces resolve at 16px, modal shell 24px, rail 1360, chapter 144px, controls 12px (§4) | Desktop root scale ×0.86: 13.75 / 20.6 / 1169 / 124 / 10.3px @1440. Mobile matches the nominal values. The scale is undocumented |
| 3 | Section heading ≈34px desktop (§5.3) | 29.2px @1440 |
| 4 | Type-role sizes, e.g. micro-readout 8px, compact body 13px, overlay heading 46.4px (§5.2) | 6.9 / 11.2 / 39.9px @1440 |
| 5 | Gaegu = process annotation only (§5.1, §16) | Method stage numerals, labels and the mobile header use Gaegu |
| 6 | Display type has negative tracking (§5.4) | Mobile modal heading +.025em; card titles 0 |
| 7 | Accent table: Services/Contact `#634B72` (§6.2) | `sectionAccents.ts`: services/contact `#3f51b5`; method `#ffffff` (marker measured white) |
| 8 | Active progress segment is 22px against a 7px inactive one (§6.2, §11.4) | Method segments are equal width (battery 4×177px; modal cells 4×~23px). State is shown by fill, not by width |
| 9 | Rectangular content pills are an anti-pattern (§4.1, §16) | Modal items are 999px stadium rows holding copy (label-capped) |
| 10 | Reduced motion must be wired; CSS needs `prefers-reduced-motion` (§13) | None in the method; ARCH forbids adding it |
| 11 | Asymmetric splits by default (§8.2) | The method modal renders 5/12 : 7/12 at 768–1279 but 50 : 50 at 1280–1535 (measured 600:600 @1440) |
| 12 | Heading → primary visual 64px desktop / 48px mobile (M6 evidence, §9) | 37.8px desktop @1440 [2.75rem]; 36px mobile |
| 13 | Body copy 13–18px (§5.4) | Mobile card description 11px; desktop items 11.2px |
| 14 | §9.4 "Mobile shows a single active card and compact phase controls" | Confirmed (one card mounted; 4 × 47px controls) |
