# Extraction C — Foundations and homepage sections

Source: `/root/.vibehub/projects/evoview` working tree (HEAD `9b07a79`, plus uncommitted work), rendered at `https://evoview.said.bet` on 2026-10-22, using Chrome at 1440×900, 1024×768 and 390×844 with the cookie banner dismissed. **M** = measured with `getComputedStyle`/`getBoundingClientRect`. **C** = current working-tree source only, not measured. `[A: …]` tags point to the `evoview-architecture` rule that an observation makes concrete.

**Authority order: rendered (M) > working-tree source (C) > `EVOVIEW-VISUAL-GRAMMAR.md`.** The grammar doc (2026-09-10) is historical. No value here comes from it alone. Its discrepancies are listed in §8.1.

---

## 1. Scope

| In scope | Files |
| --- | --- |
| Global tokens, root scale, rails, rhythm | `src/index.css:136-237, 345-519, 2498-2612`, `src/lib/motion.ts` |
| Section accent + tone | `src/data/sectionAccents.ts`, `nav/useNavState.ts`, `BelowFoldSection.tsx`, `pages/Home.tsx` |
| Section heading | `SectionHeading.tsx`, `.section-heading*` |
| Hero | `HeroSection.tsx` (desktop, `md+`), `MobileHero.tsx` (`<768`) |
| Process/features | `FeaturesSection.tsx` (pipeline strip, orbit card, collab media card) |
| Services entry track | `VideoCardSlider.tsx` (cards and track only, not modals) |
| Media plumbing | `SmartVideo.tsx`, `PhotoCampaign.tsx/.css` (dossier editorial grid, used here as grid evidence) |
| Footer, lazy-section shell | `SiteFooter.tsx`, `BelowFoldSection.tsx`, `HomePlaceholders.css` |

**Not mounted anywhere (do not use as precedent):** `ShowcaseCard.tsx`, `MediaCreationCarousel.tsx`, `PixelGridBackground.tsx` and `AnimateIn.tsx` have no importers (C). `ShowcaseCard`'s ribbon-with-tab idea survives in the live `CollabCard` ribbon (see A7).

### 1.1 The root-scale fact that governs every number below

`:root` font-size is **16px below 768**, **13.754px (85.96%) from 768 to about 1470**, then grows with `0.935673vw` to a cap of **14.596px (91.23%) from 1560** (C `index.css:217-237`; M: 13.7544px at both 1024 and 1440). Every `rem`-authored token therefore renders at **×0.86 on desktop** (×0.91 at ≥1560). Values authored in `px` do not scale. The grammar quotes *authored* values. This document gives both, and the rendered value is what the founder has approved visually.

> **Library rule F0:** Do not change a client's root font-size. Reproduce the scale locally with `--ev-scale: 1` below 768, `.8596` at 768 and above, and `clamp(.8596, 100vw/1710px, .9123)` at 1024 and above. Express every token as `calc(<authored px> * var(--ev-scale))`. This reproduces Evoview's rendered proportions on any host.

---

## 2. Typography

### 2.1 Families

| Family | Role | Status |
| --- | --- | --- |
| **Overused Grotesk** (`--font-heading`) | Display, section titles, card titles, labels/controls, pipeline stage label | CORE. This is the heading font. |
| **Montserrat** (`--font-body`, body default) | Body, ribbons, footer legal | CORE |
| **Satoshi** (`--font-mono` is mapped to Satoshi; `.font-mono` = Satoshi 700 uppercase) | HUD, REC, timecode, technical readouts | CORE. It is not a monospace font. |
| Bebas Neue 400 | Hero `CREATIVE / AGENCY` only | LOCAL |
| Gaegu 700 (+0.035em stroke) | Handwritten word in the orbit card hover state and the dossier photo title | LOCAL |

### 2.2 Scale (rendered)

Desktop values are given at 1440 (1024 where it differs). Mobile values are at 390.

| Role | Family / weight | Desktop | Mobile | Line height | Tracking | Case | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hero display (Bebas) | Bebas 400 | **127.9px** CREATIVE / **136.2px** AGENCY (112.6 / 119.8 @1024) | **62.4px**, both words stacked | .85 (mobile .88) | +.02em | UPPER | M. `clamp(3.8rem,11vw,9.3rem)` / `clamp(4rem,11.7vw,9.9rem)`; mobile `clamp(3.8rem,16vw,6rem)` |
| Hero "takes" | Overused **700** | 79.8px (66.6 @1024) | — (desktop only) | .85 | +.02em at rest. The scrub moves it to +.24em. | UPPER | M. `clamp(2.6rem,6.5vw,5.8rem)` |
| Immersive display `.type-immersive-display` | Overused 900 | 57.8px (47.1 @1024) | 33.6px | .85 | −.035em | — | C. `clamp(2.1rem,4.6vw,4.2rem)` |
| Poster title (orbit card) | Overused 900, gradient-clipped `#151515→#888→#ccc` | 55.0px (51.2 @1024) | hidden | .85 | −.025em (`tracking-tight`) | UPPER | M |
| Overlay heading `.type-overlay-heading` | Overused 900 | 39.9px (34.8 @1024) | 28px | .9 | −.02em | — | C |
| **Section title, feature** | Overused 900 | **34.4px** (32.8 @1024) | **28px** | 1.1 | −.025em | UPPER | M. `clamp(2.25rem,3.2vw,2.5rem)`; mobile `clamp(1.75rem,7vw,2rem)` |
| **Section title, standard** | Overused 900 | **29.2px** (27.5 @768) | **22.6px** | 1.1 | −.015em | UPPER | M. `clamp(2rem,2.9vw,2.125rem)`; mobile `clamp(1.375rem,5.8vw,1.5rem)` |
| Card title (service ribbon) | Overused 900 | 22.0px | 17.6px | .9 | 0 | UPPER | M. `clamp(1.1rem,2.5vw,1.6rem)` |
| `.type-card-heading` | Overused 900 | 17.2–20.6px | 20px | 1.02 | 0 | — | C |
| Pipeline stage label | Overused **400** | 20px (px) | 12px (px) | 1.15 | 0 | UPPER, typewritten | M. Named exception. |
| Ribbon caption (dark band) | Montserrat 400, white/.70 | 15px | 13px | 1.625 | 0 | — | M. px-authored |
| `.type-lead-body` | Montserrat 400 | 15.5px | 16px | 1.6 | 0 | — | C |
| `.type-body` | Montserrat 400 | 13.75px | 16px | 1.6 | 0 | — | C |
| Section subtitle | Montserrat 400, currentColor/.52 | **12.0px** | **13px** | 1.55 | 0 | — | M (desktop is *smaller* than mobile, DEBT) |
| `.type-compact-body` (service ribbon, footer) | Montserrat 400, `#555` / `#6b6b6b` | **11.2px** | 13px | 1.55 | 0 (footer +.025em) | — | M |
| Glass affordance label (`click`/`tap`) | Overused 700 | 12px (px) | 12px | 1.1 | **+.25em** | UPPER | M |
| Ribbon tab label | Overused 700 | 12px | 10px | 1.5 | +.05em | UPPER | M |
| Heading ticker (process) | Overused 500 | 10px (px) | hidden | 1.5 | +.20em | UPPER | M |
| `.type-control` (footer cookie link) | Overused 700 | 9.5px | 11px | 1.1 | +.12 to .14em | UPPER | M |
| Hero HUD (timecode, `swipe`) | Satoshi 600 | 13px (px) | — | 1.5 | +.18 to .22em, tabular | UPPER | M |
| Mobile hero HUD | Satoshi 700 | — | 9px / 8px | 1.5 | +.05 to .20em | UPPER | M |
| `.type-technical-label` | Satoshi 700 | 7.7px | 9px | 1.2 | +.20em | UPPER | C |
| `.type-micro-readout` | Satoshi 700 | **6.9px** | 8px | 1.3 | +.18em | UPPER | C (too small on desktop, DEBT) |

### 2.3 Ratios and clamp behaviour

- **Mobile to desktop:** section titles grow about ×1.29 (22.6→29.2) and feature titles ×1.23 (28→34.4). Display and hero type grow ×2.0–2.2 (62→128). Body text *shrinks* on desktop (16→13.75) because of the root scale. Evoview's desktop reads as **large display over small, dense copy**. This is intentional character [A: "one primary subject… quieting surroundings"].
- **Clamp anchors:** section titles are mobile-clamped between 22 and 24px (5.8vw). Desktop titles hit their rem maximum at about 1010px wide, so between 1024 and 1470 they are effectively **fixed**. Display roles keep growing with vw until their rem caps (hero is capped at about 1160 wide). Larger screens therefore add air, not type size [A: "larger screens add breathing room rather than unlimited enlargement"].
- **Hierarchy ratio within one scene:** display:title ≈ 4.4:1 (hero 128 / section 29). Title:body ≈ 2.1–2.6:1. Body:readout ≈ 1.4–1.6:1. Only one display level per scene.

### 2.4 Typography rules (for the library)

1. Display and titles use Overused 900, UPPERCASE, line height .85–1.1, and **negative** tracking (−.015 to −.035em). Two exceptions are local: the Bebas hero and Overused 700 +.02em takes.
2. Labels and controls use Overused 700 UPPERCASE with **positive** tracking (+.05 to +.25em). Readouts use Satoshi 600/700 with positive tracking and tabular numbers.
3. Body is Montserrat 400, sentence case, line height 1.55–1.6. Measures (C): 380 for a split subtitle, 590 for a centered subtitle, 400–460 for a ribbon caption, about 370 for an editorial side paragraph (`PhotoCampaign`). Measured: the centered partners subtitle renders 486px wide at 1440.
4. **Library floor:** keep text ≥11px and readouts ≥8px *after* `--ev-scale`. Author those roles in px, as the live site already does for its HUD (13px), ticker (10px) and pills (12px). Do not copy the desktop 6.9 / 7.7 / 11.2 px renders.
5. The brand wordmark can sit inline in a title at `height: 1.1em`, middle-aligned with a −1.5px nudge (process and services titles). In client work this slot belongs to the **client** mark. The Evoview wordmark there is Evoview-site-only.

---

## 3. Corner radius and object families

### 3.1 Radius scale

| Token | Authored | Rendered desktop (×.86) | Rendered mobile | Used on (M where measured) |
| --- | --- | --- | --- | --- |
| `--vs-radius-0` | 0 | 0 | 0 | Section chapters, full-bleed hero, ribbon top edges, ribbon tab (square) |
| XS `0.25rem` | 4 | 3.4 | 4 | Hero REC box (`rounded` = 4px) |
| marker (px) | 6 | **6** | 6 | Section-heading REC marker 20×20 (M) |
| SM `0.5rem` | 8 | **6.9** | 8 | Glass affordance pill (M 6.88 / 8) |
| MD `0.75rem` | 12 | 10.3 | 12 | Mobile pipeline tiles (M 12), mobile hero media card (`rounded-xl` = 12, M) |
| **LG `1rem`** | 16 | **13.75** | **16** | Process cards, service card faces, pipeline tiles on desktop (M 13.75) |
| LG (px) | 16 | **16** | — | Desktop hero media card (px-authored, M 16). It animates to 0 when full-screen. |
| XL `1.25rem` | 20 | 17.2 | 20 | Token exists (C). Not used in the sections measured here; outside scope. |
| 2XL `1.5rem` | 24 | 20.6 | 24 | Token exists (C). Not used on the homepage sections; modal shells belong to other extractions. |
| round | 999 | 999 | 999 | Dots, progress bars, orbit icons, nav capsule |

The compatibility override (`index.css:2507-2518`) still forces `rounded-3xl` and `rounded-[22–28px]` to `1rem`. Do not inherit it.

### 3.2 Object families on the homepage

| Object | Radius | Padding (desktop / mobile) | Stroke | Surface |
| --- | --- | --- | --- | --- |
| Chapter (section) | 0 | Section rhythm (§4) | none, hard tone cut | Environment tone |
| Frosted light panel (process cards) | LG | 34.4 (`2.5rem`) / 24 | 1px white/.30 | `linear-gradient(160deg, #fff/.55, #fff/.30 40%, accent/.10)`, inset 0 .5px white/.8 highlight, `0 12px 40px -8px #000/.08`, `0 2px 10px -3px accent/.06` |
| Media card + white ribbon (service) | LG, clipping both parts | Ribbon 27.5 / 24 | none | Media + `#fff` ribbon on `#EFEFEF` |
| Media card + dark ribbon (collab) | LG; ribbon `0 0 LG LG` | Ribbon 34/31 / 28/24 | none | Media + `#0a0a0a`/.90 (+blur-sm) desktop, /.95 mobile |
| Ribbon tab | 0 | h 34 / 28, px 16 / 12 | none | `#fff`, overlapping the ribbon top edge by half its height |
| Glass affordance pill | SM | h 31 (36 control-sm) / 36, px 17 / 20 | 1px white/.20 | `#000/.45` + blur 16, `pill-shine` sweep |
| Stage tile (pipeline) | LG / MD | 92px square / 56px square | 1px white/.30 when idle | Idle: frosted. Past: `#fff` + `shadow-sm`. Active: `#151515` + 2px accent underline inset 12/8px. |
| Hero media card | 16px literal (desktop), 12 (mobile) | — | inset 1px white/.08 + 1px top highlight gradient | `#1d1d1f→#0a0a0b`, shadow `0 15px 50px -12px #000/.6`, accent bloom `0 20px 40px -10px accent/.35` |
| Section REC marker | 6px | 20px box, 8px dot | 1px accent/.25 | Transparent |
| Progress hairline | round | 2px high | — | Track ink/.08–.10, fill ink |
| Viewfinder frame (hero) | 0 (open corners) | 835×450 @1440 | 2px white/.28 corner brackets, 24–38px arms | Transparent |

### 3.3 Nesting rule

```
chapter (0) ─▶ panel / card / media well (LG 16|13.75)
                 ├─ ribbon: shares the card's bottom radius, square top
                 ├─ tile / nested control (MD 12)
                 │    └─ pill / tag (SM 8)  ─▶ dot / bar (round)
                 └─ tab label: SQUARE (0) on purpose, contrasting with the rounded parent
```

- A child radius is ≤ its parent's. A ribbon inherits its parent's outer corners and stays square where it meets the media.
- **Square inside round is a signature move.** The white ribbon tab and the dark ribbon's flat top deliberately contrast with the 16px shell [A: "coherent object families… keep roles and nesting recognizable"].
- Siblings in one track or grid share one radius. A track never mixes LG and MD cards.
- The media card moves 16→0 radius only when it *becomes* the environment (hero scrub to full screen). Radius change signals a role change.

---

## 4. Layout proportions and spacing

### 4.1 Rails and gutters

| Rail | Authored | Rendered @1024 | @1440 | ≥1560 | Mobile | Use |
| --- | --- | --- | --- | --- | --- | --- |
| Nav (C) | 62.5rem / 1000 | 860 max | 860 | 912 | — | Header dock (navbar package owns it) |
| **Reading** `.site-container-reading` | 70rem / 1120 | **941** (gutter-bound) | **963** | 1022 | 350 | Light sections (process), centered headings |
| **Wide** `.site-container-wide` | 85rem / 1360 | 941 | **1169** | 1241 | 350 | Progress hairline, dark chapters (method, contact), footer |
| Track gutters `.site-wide-gutters` | `max(gutter, (100vw−wide)/2)` | 41 | **135** | — | — | Carousel track. Its first card aligns to the wide rail; the track bleeds right. |
| Immersive (C) | 92.5rem / 1480 | — | 1272 | 1350 | — | Modal shell (computed from the token, not measured) |
| **Gutter** `--site-gutter` | 20 / 32 / 48 / 64 | **41.3** (3rem) | **55** (4rem) | 58.4 | **20** | — |

Grammar §4.3 says 1120/1360 and a 64px gutter. Those are authored values; the measured rails are about 14% narrower (§1.1).

### 4.2 Section rhythm (block padding)

| Class | Mobile | Desktop authored | Desktop rendered | Used by |
| --- | --- | --- | --- | --- |
| `.section-space-standard` | 80 / 80 | 120 / 120 | **103 / 103** | Process |
| `.section-space-compact` | 64 / 64 | 96 / 96 | **82.5 / 82.5** | Services (a continuation of process on the same tone) |
| `.section-space-cinematic-standard` | 96 / 80 | 144 / 120 | **124 / 103** | Method (dark chapter entry) |
| Contact (local) | 64 / 48 | — | 100.8 / 72 | Contact |
| Footer | 24 / 24 | 32 | 27.5 | Footer |
| `.section-heading-gap` | 48 | 64 | **55** | Heading → content |

Desktop rhythm ÷ mobile rhythm = 1.29 (rendered). The grammar's "≈ two-thirds" applies to authored values.

### 4.3 Spacing bands in practice

| Relation | Values (rendered desktop / mobile) | Example |
| --- | --- | --- |
| Internal (icon/label, label/title) | 4–12 | Marker → title 0.16em + 0.26em gap. Ribbon title → copy 12 (`mb-3`). |
| Inside an object | 24–34 | Card padding 34.4 / 24. Ribbon padding 27.5 / 24. |
| Neighbour objects | **17–20 / 12–16** | Process grid gap 17.2 / 16. Track gap 17.2 / 16. Stage tiles on mobile 12. |
| Heading → its stage | 17 + 55 (process: tighter, the strip belongs to the heading) / 16 + 24 | `mb-5` + pipeline `pt-16` |
| Heading → progress → track | 55 → 2px rule → 27.5 | Services |
| Chapter → chapter | 103 + 103 (light→light runs: 103 + 82.5) | Tone change does the separating; no rules or bands are added. |

[A: "Make spacing communicate. Distinguish internal grouping, neighboring objects and separate chapters."] The ladder above is the concrete version: about 8 / about 20 / about 100.

### 4.4 Grids, splits and media ratios

| Composition | Desktop | Mobile |
| --- | --- | --- |
| Process peer cards | `1fr 1fr`, gap 17. The cards are **peers**, so symmetry is allowed (473×451 each @1440). | One column. The orbit card is **removed**; only the media card stays (350×280). |
| Process stage strip | 6 equal slots (1/6 each), 92px tiles centered, 2px track from the first tile center to the last | Native horizontal snap strip, 68px slots, 56px tiles, 12px gap, bleeding to the gutter |
| Service card | **560 × clamp(340, 50vh, 600)**, i.e. 560×450 @900h. Media flex-1 (313, ≈16:9, ~70%) over ribbon 137 (~30%) | **82vw** (320) × 50vh (422). Media 286 (≈1.12:1) over ribbon 136. |
| Hero media card | 275×193 (min(320·scale, 30vw), **10:7**) inside an 835×450 viewfinder (`clamp(45rem,58vw,61.25rem)` × `clamp(26.25rem,50vh,38.75rem)`) | Full width, **4:5** |
| Editorial proof grid (`PhotoCampaign`, dossier) | 12-col, gap 64×40: **7/5 then 5/7** alternating. Heading `1.8fr / 1fr` or `1.2fr / 1fr`. Aspects .94, 1.08, 1, 1.2, 2.25. | One column, gap 36. Aspects relaxed toward 1 (.88–1.25). |
| Footer | Logo left, legal right (`space-between`) on the wide rail, 1px ink/.10 rule on top | Stacked and centered, gap 12 |

### 4.5 Tablet and phone recomposition (observed)

| Desktop mechanism | Phone replacement |
| --- | --- |
| Hero: 250vh sticky scroll scrub (headline split around a card, three takes, card grows to full screen) | 679px static stack: headline → 4:5 HUD card. Short CSS entrance; no scrub. |
| Process: 6-tile strip + ticker + two cards | Snap strip of tiles; ticker and orbit card removed; media card kept |
| Services: 240vh sticky; vertical scroll translates the track; progress hairline | Native `scroll-snap-type: x mandatory`, 82vw cards with 9vw side padding, plus dot indicators (18 active / 6 idle) |
| Hover video preview on a service card; click shows `click` | No hover; tap shows `tap` (6px tap-vs-swipe threshold) |
| 1024: the desktop mechanism stays (root scale = 1440's), reading and wide rails collapse to one 941px rail, hero type ≈ −12% | — |

[A: "Reduce simultaneous content before reducing legibility"] Mobile removes the orbit card, ticker and HUD frame instead of shrinking them.

---

## 5. Colour and surface roles

### 5.1 Environment (chapter tones), measured in document order

| # | Chapter | Background (M) | Tone (`data-nav-tone`) | Accent (`sectionAccents.ts`, M on the marker) |
| --- | --- | --- | --- | --- |
| 1 | Hero | `#0e0e0e`. Atmosphere: 135° accent wash 5–6%, dashed lens ring accent/.12, grain .045 overlay, edge vignettes .32–.42 | dark | `#c84a4a` red (REC) |
| 2 | Process | page `#EFEFEF` | light (default) | `#151515` ink |
| 3 | Services | page `#EFEFEF` (continuation) | light | **`#3f51b5` indigo** |
| 4 | Method | `linear-gradient(#0a0a0f, #08080c 45%, #060608)` | dark | `#ffffff` |
| 5 | Partners | `#ffffff` | light | `#a94f16` orange |
| 6 | Contact | `#101011` | dark | `#3f51b5` (marked WIP in code) |
| 7 | Footer | page `#EFEFEF` | light | — |

**Tone changes are hard cuts.** At every boundary the screenshots show no gradient band, rule or overlap. Spacing on both sides (≈100px) and the tone flip do the work [A: "Prefer clear spatial relationships over extra labels, borders and containers"]. Two adjacent light chapters (process → services) do not change tone; the second one uses *compact* rhythm and a new accent marker instead.

### 5.2 How a section accent is introduced

1. One section owns one accent (`SECTION_ACCENTS`, in document order).
2. The accent appears in exactly **two** places: the 20px heading REC marker (1px border at 25% accent, 8px dot at 100% blinking `redBlink` 1s) and the **navbar reticle dot**. The nav probes the section under its top edge on every frame and also switches light/dark glass from `data-nav-tone`.
3. Inside the section the accent stays a **signal**: the active stage underline (2px), a 10% corner wash in frosted panels, the accent bloom shadow under a media card, the selected indicator (22px vs 7px), and focus. Never a fill.
4. The neutral ink accent (`#151515`, process) and white (`#fff`, method) are valid accents. "Accent" means *owned signal colour*, not necessarily a hue.

### 5.3 Role model

| Role | Light environment | Dark environment | Client-adaptable? |
| --- | --- | --- | --- |
| Environment | `#EFEFEF` page, `#FFF` paper chapter | `#0e0e0e` / `#101011` / `#08080c` gradient | Tone order: yes. The near-white / near-black family stays, without inserting mid-grays. |
| Object | `#fff` ribbon, frosted panel, `#151515` active tile | `#0a0a0a`/.90 ribbon, `#1d1d1f→#0a0a0b` media well | Values: no. These are the Evoview surface family. |
| Information | ink `#151515`, `#555` / `#6b6b6b` secondary, ink/.52 subtitle, ink/.30 idle ticker | white, white/.70 body, white/.50 HUD | No |
| Signal | **section accent** + ink progress | **section accent** + white | **Yes. This is what a client accent drives.** |
| Imagery | Grayscale/halftone service posters (Evoview art direction) | Graded media (`saturate .72–.82, contrast 1.08, brightness .72–.91`) | Client imagery keeps its own identity [A: "allow client imagery its own identity"] |

### 5.4 What a client accent palette may drive (library contract)

Map the host accent the same way `/reservation` does: `--primary` → `--<name>-accent`, `--primary-foreground` → `--<name>-accent-ink` (luminance-picked via `inkFor`).

| Allowed | Values |
| --- | --- |
| REC marker border + dot, nav reticle dot | border 25%, dot 100% |
| Active indicator (underline, progress segment, dot) | 2px underline; 22×4 vs 7×4 pill; 18×6 vs 6×6 dot |
| Panel wash | ≤10% at the 160° gradient end |
| Media bloom shadow | `0 20px 40px -10px accent/.30–.35` |
| Ambient environment wash on dark chapters | ≤6% diagonal, ≤12% hairline ring |
| Focus ring | 2px |
| Inline emphasis word in a display line | 100% (dossier `h2 span` pattern) |
| **Forbidden:** large solid accent cards, accent body text, multi-hue gradients, an accent on more than one owning section at once |

Contrast check: indigo `#3f51b5` passes as a 2px signal on `#EFEFEF` but not as small text. The library must keep `--accent-ink` for any filled accent (button or tab) and never put small accent text on dark backgrounds below 4.5:1.

---

## 6. Motion

### 6.1 Tokens (`lib/motion.ts`, `:root`)

`fast 180 · control 280 · reveal 600 · cinematic 900 ms` · `standard cubic-bezier(.2,.8,.2,1)` · `cinematic cubic-bezier(.23,1,.32,1)` · `stagger 80ms`. The dossier editorial grid uses `(.22,1,.36,1)`, which is near-identical to cinematic.

### 6.2 Inventory

| Job | Where | Spec |
| --- | --- | --- |
| **Reveal** | Service cards | opacity 0→1, y 30→0, 600ms cinematic, stagger 80ms, `once`, viewport margin −20px |
| Reveal | Mobile hero | headline y20, 900ms, delay 300. Card y24 + scale .97→1, 1000ms, delay 500. |
| Reveal | Editorial grid (dossier) | y45, 900ms, `amount .12`, `once` |
| **Establish (scrub)** | Desktop hero, 250vh | Damped progress (lerp .16/frame). A 0–.16: headline racks out (blur 0→12px, tracking +.02→+.32em, ±110px). B .14–.66: three takes punch in (scale 1.14→1, blur 16→0, tracking converges) and rack out. C .72–1: card grows to full screen, radius 16→0, dolly 1→1.08; bottom ticks double as the progress meter. |
| **Progress** | Services track, 240vh | Vertical scroll maps to translateX (lerp .25); the 2px hairline `scaleX(progress)` sits on the wide rail |
| Progress | Process | Auto-advance when the stage video **ends** (not a timer). Track `scaleX` 700ms ease-out. Stage title typewriter 55ms/char. Icon→eye swap clip-path 500ms. Tile state 700ms. |
| **Reveal (state)** | Process media | Curtain wipe `clip-path inset(0 0 100% 0)→0`, 1.2s cinematic. Intro still fades 700ms. Ribbon copy crossfades 500ms. |
| **Acknowledge** | Service card click/tap | rotateY 180° 600ms cinematic. Back face: eye, then title rising from a clip (400ms, delay 120), then indicator pills (delay 240). Dossier opens after 600ms (desktop waits for the eye draw, +150ms grace). |
| Compare / reveal on hover | Orbit card (desktop) | Light curtain bottom→top 700ms. Eye morph 1.4s. Orbit radius 700ms. Typewriter letters 80ms stagger. |
| Hover preview | Service card (desktop) | Muted loop video fades in 200ms on hover, at 1.7–2× playback; it resets to 0 on leave |
| **Atmosphere (ambient)** | Global | `redBlink` 1s on markers and REC. `pill-shine` sweep 22% of a 4s cycle, offset 700ms per card. Grain `steps(1)` .9s. Lens ring 160s. Mobile scanline 4s. Orbit spin. |

### 6.3 Choreography and gating rules

- **Order:** heading (static) → strip/track → objects staggered 80ms. Inside one object: frame → subject → label → indicator at 120 / 180 / 240ms.
- **Gating:** any section off-screen gets `.section-anims-paused`. Modals set `body[data-background-suspended]`, which pauses every main/header animation. `SmartVideo` plays only when intersecting, the document is visible and nothing is suspended, and it keeps the user's play intent. The process clock and transitions *pause* rather than advance while not permitted [A: "never advance a narrative because unavailable or suspended time elapsed"].
- **Reduced motion:** the code has **none** (0 `prefers-reduced-motion` hits). This matches the architecture skill ("Do not add `prefers-reduced-motion` handling") and **contradicts grammar §13**. For the library: follow the skill, but every sequence must have a complete, meaningful stable state (a final frame, poster, or all stages reachable by click).
- Ambient motion stays quieter than state motion: ambient effects are opacity or slow transforms, while state changes use clip, scale and position.

---

## 7. Layout archetypes

### A1 · Cinematic viewfinder hero, **signature (Evoview-local)**

```
desktop 250vh, sticky 100dvh, #0e0e0e + atmosphere
┌──────────────────────────────── viewport ────────────────────────────────┐
│        ┌ ─ ─ ticks ─ ┬ ─ ─ ┐  58vw × 50vh viewfinder (2px corner arms)    │
│        │●REC 00:00:01:13       SWIPE↓                                     │
│        │        C R E A T I V E      ← Bebas 128, centered at 50%−3.9rem   │
│        │           ┌──────┐                                               │
│        │           │ 10:7 │  275px media card, radius 16, accent bloom    │
│        │           └──────┘                                               │
│        │         A G E N C Y         ← Bebas 136, centered at 50%+4.25rem  │
│        └ ─ ─ ticks (= progress) ─ ┘                                       │
└───────────────────────────────────────────────────────────────────────────┘
mobile: pt-80 px-20 | headline 62px 2 lines | 20 | 4:5 HUD card (12px)
```

**Job:** establish the world, then hand off to the first light chapter. **Adaptable:** the headline words, media, accent (REC, center tick, bloom), and the number of takes (1–3). **Signature:** the split headline around a framed media card, the viewfinder brackets and ticks, the scrub that grows the card to full screen, and the hard cut to light.

### A2 · Centered chapter heading, **core**

```
          [▣] TITLE IN OVERUSED 900  (+ inline mark @1.1em)
              subtitle ≤590, ink/.52, balanced
              TICKER · TICKER · ACTIVE · TICKER   (optional support slot)
                          ↓ 48 / 55
```

The title is 29.2 / 22.6, or 34.4 / 28 for the feature variant. The marker is 20px with a 6px radius and an accent dot. It is unboxed and has no reveal.

### A3 · Split chapter heading, **core (dark chapters)**

```
[▣] TITLE ……………………………………………… side content (controls, index)
subtitle ≤380
```

Column on mobile; at 768+ it becomes a row (`space-between`) on the wide rail.

### A4 · Stage strip + paired evidence (process), **signature mechanism, neutral shape**

```
reading rail 963
            A2 heading + ticker
 ┌──┐────┌──┐────┌──┐────┌──┐────┌──┐────┌──┐    92px tiles, 2px track
 │◉ │    │  │    │  │    │  │    │  │    │  │    active = ink + accent underline
 └──┘    └──┘    └──┘    └──┘    └──┘    └──┘
 BRAND   AUDIT     (labels typewrite in when reached)
 ┌──────── frosted panel ───────┐ ┌──────── media panel ─────────┐
 │  illustration / diagram      │ │  stage video (curtain wipe)  │
 │                              │ │        ┌─TAB─┐               │
 │  POSTER TITLE                │ │ ▓▓▓▓ dark ribbon caption ▓▓▓  │
 └──────────── 1fr ─────────────┘ └──────────── 1fr ─────────────┘   gap 17
```

**Job:** progress through a sequence, advancing when the media ends. **Mobile:** snap strip and the media panel only.

### A5 · Media card with information ribbon, **core object**

```
┌──────────────── 560 ────────────────┐ r16 (13.75)
│        media ~70% (16:9 desk)        │  poster contain/cover; hover video
│            [ CLICK ]  glass pill      │
├──────────────────────────────────────┤ square seam
│ CARD TITLE  Overused 900 22           │ white ribbon ~30%, pad 27.5
│ 3-line clamp body (min-h 3lh)         │ equal height across siblings
└──────────────────────────────────────┘
```

### A6 · Scroll-scrubbed card track, **signature mechanism**

```
desktop: wrapper 240vh ─ sticky ─┐
  A2 heading (reading rail)      │
  ──────── 2px progress (wide rail) ──────── fill = scroll progress
  |gutter=(100vw−wide)/2|[card][card][card][card]→ bleeds right, translateX
mobile: dots ● ● ● ●   9vw|[ 82vw card ]|[ next … snap center
```

### A7 · Ribbon with tab, **core detail**

A dark (`#0a0a0a`/.9) or white band closes the bottom of a media object. A **square** label tab overlaps its top edge, centered, by half its height (28/34px). The copy below is centered and limited to 400–460px. The shape is the live `CollabCard` ribbon (`ShowcaseCard` is an unused prototype of it).

### A8 · Asymmetric editorial proof grid, **family (dossier) but neutral**

```
12 cols, gap 64×40
[ media 7 cols .94 ][ study 5 cols ]
[ study 5 cols    ][ media 7 cols, spans 2 rows ]
[ note: 38px accent rule + 2–3 short lines ]
captions: micro readout, "01 / LABEL" left · qualifier right
```

### A9 · Hard tone cut, **core composition**

```
…light chapter (#EFEFEF) pad-bottom 103
════════════ hard edge, no rule or gradient ════════════
dark chapter (#08080c–#101011) pad-top 124 (cinematic) …
```

### A10 · Footer bar, **core, attribution slot**

```
──────────── 1px ink/.10 on wide rail ────────────
[LOGO h24–28]                     legal · compact body
                                  COOKIE SETTINGS (type-control, underline)
```

Mobile: stacked and centered.

---

## 8. Coherence rules (numbered, traceable)

1. **F0 scale.** Use `--ev-scale` (§1.1). Never set the host's root font-size. (`index.css:217-237`)
2. **Rails.** Content sits on the reading rail (70u) or the wide rail (85u) with gutters 20 / 32u / 48u / 64u. Tracks start on the wide rail and bleed right. *Don't* invent a fifth rail (`ShowcaseCard`'s 1200 is not one).
3. **Rhythm.** Use only standard (80/120u), compact (64/96u, continuation on the same tone) and cinematic (96–80 / 144–120u, dark entry). Heading gap is 48/64u. *Don't* add rules or bands between chapters. [A: spacing]
4. **Tone.** Alternate near-white and near-black with hard cuts. Two same-tone neighbours change accent and rhythm, not background. *Don't* insert mid-gray chapters. (§5.1)
5. **One accent per section.** It appears on the marker and nav, and inside the section only as signal (§5.4). *Don't* use solid accent surfaces or two accents in one section. [A: colour relationally]
6. **One display level per scene.** Title 900 with negative tracking. Labels positive tracking. Body sentence case 1.55–1.6. *Don't* use uppercase paragraphs or positively tracked titles (except hero takes).
7. **Object family.** A surface is 16u. Nested controls are 12u. Tags are 8u. Dots and bars are round. Ribbons and tabs are square where they meet media. Siblings share a radius. *Don't* use pills for content.
8. **Peer vs proof.** `1fr 1fr` is only for true peers (process cards). Proof/explanation pairs use 7/5, 5/7 or `1.8fr/1fr`. [A: stable structure, changing emphasis]
9. **Media first.** Media keeps ≥60–70% of a card. The ribbon carries title plus ≤3 lines. Grade imagery down at rest and release it on focus. [A: show, then explain]
10. **Motion has a job.** Reveal is y24–45 at 600–900ms with an 80ms stagger. State changes use clip-path wipes, flips or progress. Ambient is blink, shine or grain only. *Don't* scale-in or side-fly ordinary content. [A: give motion a job]
11. **Gate everything.** Pause off-screen, under modal and when the document is hidden. Advance sequences on media `ended` or visible time only. (`SmartVideo`, `.section-anims-paused`, `useProcessClock`)
12. **Mobile changes mechanism.** Sticky/scrub becomes native snap or a static stack. Remove secondary objects (orbit card, ticker, HUD frame) rather than shrinking them. Touch targets are ≥44 (C: `--control-md`, photo-study buttons; measured mobile stage tiles are 56). Tap and swipe are separated by a 6px threshold.
13. **Readable floors.** After scaling, text is ≥11px and readouts ≥8px. Author those roles in px (§2.4).
14. **Repeat meaning, not decoration.** The REC/viewfinder/eye/scanline language is Evoview's own subject (a camera, "the view"). For a client, keep the *structure* (marker, framed media, progress instrument) and draw the motif from the client's subject, or omit it. [A: repeat meaning]
15. **Attribution.** The footer legal line is the natural Evoview attribution slot. The live site's line is a personal credit with no link. A client build needs an explicitly supplied, verified Evoview destination (STRATEGY.md).

### 8.1 Grammar doc vs reality (grammar is historical; do not "fix" Evoview to match either)

| # | Grammar says | Rendered / code |
| --- | --- | --- |
| 1 | Services and contact accent `#634B72` (§6.2) | `#3f51b5` indigo (M marker `rgb(63,81,181)`) |
| 2 | Rails 1120 / 1360, gutter 64 @1440 (§4.3) | 963 / 1169, gutter 55 (root ×.86) |
| 3 | Surfaces "resolve at 16px" (§4.1) | 13.75 on desktop for rem tokens; 16 only for px-authored (hero card) |
| 4 | Section title 34 / feature 40 desktop (§5.3) | 29.2 / 34.4 |
| 5 | Body 13–18, technical 8–11 (§5.4) | Desktop compact body 11.2, control 9.5, technical 7.7, micro 6.9 |
| 6 | Wire reduced motion (§13) | No reduced-motion code; the architecture skill forbids adding it |
| 7 | Hero ink `#0E0E0F` | `#0e0e0e` |
| 8 | Method "black" | Gradient `#0a0a0f→#08080c→#060608` |
| 9 | Glass is not a content card (§6.3) | Process uses frosted translucent light panels as content cards (LOCAL, light-tone variant) |
| 10 | Progress segment 22 vs 7 (§6.2) | Services mobile dots 18 vs 6; the 22/7 pills exist on the flip back |
| 11 | — | Desktop subtitle (12.0) is smaller than mobile (13) |
| 12 | — | Idle pipeline tiles still carry old violet `rgba(99,75,114,.06–.12)` washes (DEBT) |
| 13 | Spacing "two-thirds" mobile compression (§14) | Rendered desktop/mobile rhythm ratio is 1.29 (mobile ≈ 78% of desktop) |
| 14 | Services mobile at `82vw` with `240vh` desktop (§9.3) | Confirmed (M), no discrepancy |
| 15 | `ShowcaseCard` "appears legacy" (§17) | Confirmed unmounted. `MediaCreationCarousel`, `PixelGridBackground` and `AnimateIn` are also unmounted. |

---

## 9. Candidates for neutral library components (ranked)

| Rank | Component | Archetype | Props / slots | Accent palette applies to | Desktop / mobile |
| --- | --- | --- | --- | --- | --- |
| **1** | **`ev-chapter` + `ev-section-heading`** (foundation shell) | A2, A3, A9, §4.2 | `tone: light \| paper \| dark`, `rhythm: standard \| compact \| cinematic`, `rail: reading \| wide`, `heading: {title, inlineMark?, subtitle?, support?, side?}`, `layout: centered \| split`, `variant: standard \| feature`, `accent` | Marker border/dot; exposes `--ev-accent` to children; optional `data-nav-tone` + accent for the navbar package | Tokens via `--ev-scale`; split becomes a column below 768; rhythm 80/64/96 on mobile |
| **2** | **`ev-media-card`** (media + ribbon + affordance) | A5, A7 | `media {poster, video?, fit, alt}`, `title`, `body` (3-line clamp), `ribbon: light \| dark`, `tab?`, `affordanceLabel` (`click`/`tap`), `onActivate`, optional `confirmBack {title, steps, index}` (600ms flip) | Focus ring, back-face indicator (22/7), optional bloom shadow, tab ink | Hover preview video on desktop only; tap threshold on touch; equal ribbon height across siblings |
| **3** | **`ev-card-track`** (scroll-scrubbed track) | A6 | `items` (renders `ev-media-card`), `heading`, `scrub: auto \| off`, `wrapperHeight` (240vh), `progress: hairline \| dots` | Progress fill (defaults to ink, accent optional), active dot | Desktop: sticky translate with lerp .25 and a 2px hairline on the wide rail. Mobile: native snap at 82vw with dots. Falls back to static when there is no overflow. |
| 4 | `ev-stage-sequence` (process stepper + evidence pair) | A4 | `stages[{label, icon, media, caption, ticker?}]`, `advance: media-ended \| manual`, `companion?` (left panel slot) | Active underline, track fill, ticker active colour, panel 10% wash | Desktop: 6-slot strip and two peer panels. Mobile: snap strip and the media panel only. Gated clock. |
| 5 | `ev-viewfinder-hero` | A1 | `headline [top, bottom]`, `takes[]` (0–3), `media`, `hud {left, right}`, `scrubLength` (250vh) | REC dot, center tick, media bloom, ambient wash ≤6% | Desktop scrub (the three phases); mobile 4:5 static card with entrance. **Signature: protect choreography; client swaps words, media and accent only.** |
| 6 | `ev-proof-grid` (editorial asymmetric grid) | A8 | `items[{media, aspect, span: 7 \| 5, caption [left, right]}]`, `note?` | Note rule (38px), caption emphasis, inline display emphasis | 12-col 7/5 ↔ 5/7. One column on mobile with aspects relaxed toward 1. Reveal y45 at 900ms. |
| 7 | `ev-footer` (with attribution slot) | A10 | `logo`, `legal`, `links[]`, `attribution {label, href}` (**required href, supplied**) | Link hover/focus only | Row / centered stack |
| 8 | `ev-frosted-panel` + `ev-ribbon-tab` (primitives) | §3.2 | `tone`, `padding`, `children` / `label` | 10% wash, bloom | Static |

**Build order:** build 1 first, because every other component consumes its tokens (`--ev-scale`, rails, rhythm, `--ev-accent`, `--ev-accent-ink`). Components 2 and 3 ship together. Component 5 is the highest-risk signature; package it like `navbar`, with protected choreography values listed in its README.
