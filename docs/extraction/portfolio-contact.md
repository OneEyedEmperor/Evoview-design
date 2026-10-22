# Extraction D — Portfolio (partners) + Contact / qualification

Governing lens: `evoview/skills/evoview-architecture/SKILL.md` (AS). Authority: rendered site (measured) > working-tree source > `EVOVIEW-VISUAL-GRAMMAR.md` (historical hints only; see §10).

Evidence tags: **[M]** measured on `https://evoview.said.bet` (2026-10-22, agent-browser, 1440×900 and 390×844, computed styles); **[S]** source-only (not rendered/confirmed); **[L]** library `components/reservation` (measured on `evoview-library.said.bet/reservation` or its CSS).

**Read this first: desktop composition scale.** From 768px the root font-size is `clamp(85.96%, 0.9357vw, 91.23%)` → **13.75px at 1440** (×0.86), 14.6px max at ≥1560; mobile <768 = 16px. Everything authored in `rem` (radius/space/control tokens, Tailwind, `.type-*` roles, modal shell) renders ×0.86 at 1440; everything authored in `px` (partner card CSS, `capp-*` fonts, contact invitation) does not. Desktop values below are rendered@1440 with authored value in brackets when they differ. A neutral library must pick **one** scaling model (recommend: px/clamp authored, no root scale — the reservation precedent) and not inherit this mix (§10 #6).

---

## 1. Scope

| Surface | Source | Inspected states |
| --- | --- | --- |
| Partner archive (white chapter) | `PartnersSection.tsx/.css`, `PartnerCarousel.tsx/.css`, `data/partners.ts` | desktop sticky scrub at card 1, mobile snap track |
| Partner case-study dossier (modal) | `PartnerWorkModal.tsx/.css`, shell CSS `index.css:551-1019` (shared `service-modal-*`) | hero, pillars, web/device, gallery, closing; mobile top/bottom glass |
| Contact invitation (dark chapter) | `ContactQualificationSection.tsx/.css`, `ContactDeliverableRibbon.tsx/.css` | desktop + mobile |
| Application / qualification flow (modal) | `ContactApplication.tsx/.css`, `ContactJourney.tsx`, `ContactDossierScreen.tsx`, `features/qualification/*` | intro, steps 1–5 (no submit), mobile intro + step 1 |
| Cookie consent | `CookieConsent.tsx` | summary state desktop |
| Watermark | `PartnerWatermark.tsx` | (client logo, not Evoview — see §5.3) |
| Library comparison | `components/reservation` | showcase 1440 |

Not inspected: success screen render (needs real submit — code only), partner "pending" view (no pending partner reachable without data change), consent settings view, error states.

---

## 2. Typography

### 2.1 Roles (rendered)

| Role | Family / weight | Desktop @1440 | Mobile 390 | LH | Tracking | Case | Where |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Immersive display | Grotesk 900 | 57.8 [67.2] | 35.1 | .85 | −.035em | UPPER | partner h1, closing statement [M] |
| Chapter statement | Grotesk 800 | 63.4 (clamp 36–64, 4.4vw, px) | 36 | .97 | **−.065em** | UPPER, centred | contact title [M] |
| Flow display | Grotesk 900 + Gaegu 400 line at 1.12em | 63.3 (clamp 2.6rem, min(4.4vw,8vh), 4.6rem) | 41.6 | .98 | −.045em | UPPER + lowercase script | application intro/success [M] |
| Overlay title | Grotesk 900 | 46.8 [54.4] | 33.6 | .88 | −.025em | UPPER | partner web h2 [M] |
| Overlay heading | Grotesk 900 | 39.9 [46.4] | 28 | .9 | −.02em | UPPER | gallery h2 / statement [M] |
| Question heading | Grotesk 900 | 45.4 (clamp 1.9–3.3rem, 3.4vw) | 30.4 | .95 | −.035em | **Sentence** | flow steps [M]; [L] 48px |
| Section heading (feature) | Grotesk 900 | 34.4 [40] | 28 | 1.1 | −.025em | UPPER, centred + 20px marker | partners [M] |
| Archive name (outer) | Grotesk 800 | 33.1 (clamp 21–34, 2.3vw) | hidden | 1 | −.045em | UPPER | partner track [M] |
| Card title on media | Grotesk 850 | 37.4 (clamp 25–40, 2.6vw) | 31.2 | .92 | −.055em | UPPER | partner card [M] |
| Card heading | Grotesk 900 | 20.6 [24] | 20 | 1.02 | 0 | UPPER | pillars [M] |
| Option label | Grotesk 800 | 19 (clamp 15–19) | ~15–16 | 1.05 | −.01em | Sentence | choice rows, scale cards 16 [M] |
| Group title | Grotesk 800 | 18 | 18 | 1.5 | 0 | Sentence | grouped question [M] |
| Tile caption | Grotesk 800 | 15 | 15 | 1 | −.01em | UPPER | mosaic tiles [M] |
| Proof figure | Grotesk 900 | 26 accent | 26 | .9 | −.04em | — | "+40%" [M] |
| File index | Satoshi 700 | 35.8 [41.6] white/.42 | 22.4 | 1 | 0 | — | "01" beside h1 [M] |
| Lead | Montserrat 500 | 15.5–19 | 16 | 1.6–1.65 | 0/−.01em | Sentence | partner lead, manifesto (max 560 / 43ch) [M] |
| Body | Montserrat 400 | 14 | 14–16 | 1.55–1.8 | 0 | Sentence | question support, manifesto body (53ch) [M] |
| Compact body | Montserrat 400 | **11.2** [13] | 13 | 1.55 | 0 | Sentence | pillars, cookie desc [M] — below 13 floor (scale artefact) |
| Field value | Montserrat 400 | 16 | 16 | 1.5 | 0 | — | inputs (16 = no iOS zoom) [M][L] |
| Chip text | Montserrat 500 | 14 / 15 (lg) | same | 1.25 | 0 | Sentence | option chips [M][L] |
| Control label (dossier) | Grotesk 700 | 9.46 [11] | 11 | 1.1 | +.14em | UPPER | `type-control`: CTA, link, cookie buttons [M] |
| Control label (flow) | Montserrat 700 | 14 (13 in bar) | 14 | 1.5 | 0 | Sentence | `capp-primary` [M]; [L] 14 |
| Control label (contact) | Satoshi 700 | 13 | 12 | 1.3 | 0 | Sentence | invitation launcher [M] |
| Technical label | Satoshi 700 | 9 | 9 | 1.2 | +.2em | UPPER | eyebrows, field labels, `pwm-label` (accent) [M] |
| Readout | Satoshi 700 | 8 | 7–8 | 1.3 | +.12–.18em | UPPER | hints, meta, dt, counters [M] |
| Micro tag | Satoshi 700 | 7–8 | 7 | 1 | +.14–.18em | UPPER | tags, Click/Tap pill, topbar kicker 7 [M] |
| Topbar title | Satoshi 700 | 9 | 9 | 1.1 | +.105em | UPPER | chassis header [M][L] |
| Instrument readout (large) | Satoshi 700 | 12–14 | same | 1 | +.12–.16em | UPPER | archive "01 / 04" 12, REC 14 [M] |
| Percent | Grotesk 900 tabular | 18 | — | .8 | −.04em | — | journey rail [M] |

### 2.2 Ratios and rules
- Display:body ≈ **4:1** desktop (57.8/14), ≈ **2.2–2.6:1** mobile (35/16). Display compresses to ~0.6 of desktop on phone; body rises (14→16). Labels do not shrink (9→9).
- Hierarchy is three-voice: **Grotesk = what it is**, **Montserrat = why/how**, **Satoshi = where/state** (index, step, channel, status). Every surface measured follows this split.
- One dominant display per scene: hero h1 vs file index (index at 0.62× in Satoshi, 42% white) — the secondary number is a readout, not a second heading.
- Statement/marketing headings = UPPERCASE; **interaction questions = sentence case** (flow, reservation). Keep this split: questions are spoken to the visitor, statements are the brand's claims.
- Script line (Gaegu) is a flow-local signature (intro/success only), always after an uppercase line, white, 1.12em. Not for clients unless the flow chassis is the Evoview one (AS "repeat meaning, not decoration").
- Measures: lead 560px / 43ch, body 53ch, question 760px, support 560px [M/S].

---

## 3. Corner radius & object families

| Object | Radius desk@1440 [authored] / mobile | Padding | Stroke | Surface |
| --- | --- | --- | --- | --- |
| Modal shell (dossier, application) | 20.6 [24 = `--vs-radius-2xl`] / **0, full-bleed** | sections own padding | 1px white/.08 | #0c0c0d |
| Consent sheet | 20.6 [24] | 20–28 | 1px white/.10 | #0c0c0d/.98 + blur-xl |
| Partner portrait card | 17.2 [20] / 20 | identity inset 24 (18 mob) | 1px ink/.82 outer + 1px white/.16 inner edge | #171618 + media |
| Media well (stage, browser, figure, tile, ribbon frame) | 13.75 [16] / 16 | 0 | 1px white/.08–.14 (stage: accent 30% mix) | #080808 |
| Selection object (choice row, scale card, monitor) | 13.75 [16] / 16 | row 12/52/12/92; card 16 | 1px white/.10 → accent | #121214 / #141416 |
| Glass bar (topbar mobile, bottom nav) | 16 | 5/5/5/14 | 1px white/.18 | rgba(20,20,22,.62) blur 28 sat 1.6 |
| Control: CTA, link, tag, chip-label, close (desk) | 10.3 [12] / 12 | 0 18–24; tag 9/12 | 1px white/.14–.22 | white / glass / white .03 |
| Close (mobile), nav item | 14 / 14 (px, optical) | — | 1px white/.22 | glass |
| Pager button | 50% (42px) | — | 1px white/.17 | glass + accent radial |
| Option chip, journey tick, URL capsule, Click pill | 999 (pill) | 10/18/10/12 (lg 12/22/12/14) | 1px white/.14 | white/.03 → accent 14% |
| Step mark / chip mark / check orb | circle 34 / 22 / 24 | — | 1–1.5px | transparent → accent fill |
| Index badge (chip `b`) | 4 | 0 4 | — | accent 80% |
| Inset figure on stage | 13.75 outer, **inner = outer − padding** (16−7) | 7 | 1px white/.14 | #101011/.9 + blur 18 |
| Phone mockup | 28 outer / 20 inner (pad 8) | 8 | 1px white/.14 | #0a0a0b |
| Contact monitor (device) | 30 / 22 screen (mob 24 / 18) | 10 (7) | inset 1px white/.07 | metallic gradient #323440→#1b1c20 |
| Progress bar, segments, level ticks | 999 / 2 | — | — | white/.12–.13 → accent |

**Nesting rule (confirmed):** shell 24 → open sections (no box) → media well/selection 16 → control 12 → badge 4 → dot/orb round. Inner radius of a padded frame = outer − padding (inset, phone, monitor). Device mockups (phone 28, monitor 30) may exceed the shell tier because they *depict hardware*; never for content surfaces.
**Pill rule:** pills are for **choosable tokens and status** (option chips, ticks, URL, Click/Tap, consent status); rectangular 12px for **commands** (CTA, link, close desk, tags-as-metadata). [M][L both agree]

---

## 4. Layout proportions & spacing

### 4.1 Rails
| Rail | Rendered@1440 [authored] | Use |
| --- | --- | --- |
| Shell | 1272×791 [1480×920 rem; `min(57.5rem, 100vh−2rem)`] | dossier + application [M] |
| Inner content | 1169 + 55 gutter [85rem + `--site-gutter` 4rem] | partner modal sections [M] |
| Flow gutter | 49 [clamp(20px, 3.4vw, 56px)] / 20 | application [M] |
| Section heading | 1169 wide rail; title centred | partners, contact [M] |
| Archive progress | 680 max / rail−2×20 | partners [M] |
| Contact device | 580 max / 350 | invitation [M] |
| Consent | 1120 max | [M] |
| Reservation chassis | ~900 column (host) [L] | |

### 4.2 Split ratios (measured)
| Composition | Ratio | Rendered px | Dominant side |
| --- | --- | --- | --- |
| Case hero copy / media | .92fr / .70fr (min 360) | 574 / 437 (≈57/43), gap 48 | media by visual weight (4:5 tall), copy by width |
| Web intro title / copy | 1fr / .68fr (min 300) | ≈60/40, gap 48 | title |
| Web details menu / phone / journey | 1fr / 200–236px / .78fr | 435 / 226 / ~350 | menu image |
| Gallery heading / copy | 1fr / 280–380px | gap 40 | heading |
| Closing statement / CTA | 1.22fr / .78fr (min 280) | gap 40, CTA full-width of col | statement |
| Pillars | 1.1 / .95 / .95 | 388 / ~335 / ~335 | first pillar |
| Application intro copy / mosaic | 1fr / 1fr | 630 / 630 | — (mosaic carries proof) |
| Flow question / dossier panel | 1fr / .62fr (min 320) | 784 / 486 (62/38) | question |
| Success copy / media | 1.05 / .95 | — [S] | copy |
| Consent text / actions | 1fr / auto (≤430) | — | text |

### 4.3 Media aspect ratios
Partner card .90 desk (430×477; w clamp(320,31vw,430), h clamp(440,53vh,590)) / **.70 mobile** (82vw × min(118vw,470)); case stage **4:5**; inset 1.15:1; browser 16:9; menu 16:10 (stretches ≥1181); phone native; gallery panorama **2.2:1** (16:9 ≤1023); portraits **4:5**; closing **21:9** → 4:3 tablet → 3:4 phone; ribbon frames 4:3 / 1:1 alternating (320×240 / 240×240 base); mosaic grid-derived.

### 4.4 Spacing (rendered)
| Band | Values | Examples |
| --- | --- | --- |
| Internal | 4–12 | label→title 16–18, chip gap 8–10, tick gap 6, meta dt→dd 8, chip-mark gap 10 |
| Neighbour | 14–28 | mosaic gap 8, gallery gap 16 (12 mob), track gap 28.8 (2vw) / 14 mob, field gap 22×24, choice gap 10, pillar padding 28–36 |
| Group (rule-separated) | 26–40 | question groups 30 + 26 with 1px rule, hero meta 36 + rule + 22, web intro → browser 44 |
| Chapter | 48–80 desk / 48–52 mob | modal sections 64/72/80; contact 100.8/72 (clamp) → 64/48; partners mobile 80 |
| Label→heading drop | **64** | pillar label → h3 (desk only; 18 mob) — signature "file card" air |

### 4.5 Responsive recomposition
| Surface | Desktop | Tablet (768–1023) | Phone |
| --- | --- | --- | --- |
| Partner archive | 260vh (min 1900) sticky stage; vertical scroll drives horizontal track; outer typewriter name at rail-left | same mechanism | natural height; native x-snap (proximity) track, 9vw padding; outer name hidden; HUD removed; inactive identity hidden |
| Case dossier | shell 1480×920, topbar row: identity · pager(name+progress) · close | full-bleed (<768), topbar glass floats | full-bleed; floating glass topbar 52 + bottom 3-col nav 52 (prev / count+progress / next); both hide on scroll-down; **copy before media** (§10 #19) |
| Case sections | splits per 4.2 | ≤1180 hero .1fr/.72, journey wraps; ≤1023 single column, pillars stack with top rules | ≤639 hero title stacks, meta 2-col, inset hidden, portraits 6/6 + full 16:10 |
| Contact | centred title, 580 device over ribbon | same | device 350, ribbon behind at .4, frames 280×240 |
| Application intro | 2-col copy/mosaic, 5 tiles on 6×6 grid | (<1024) stacked: copy → CTA → mosaic of 3 | same, CTA full-width |
| Application steps | question + dossier panel | (<1024) panel removed; 5-segment strip under topbar | same; bar bottom: ghost + primary |
| Consent | 1120 bottom sheet, text/actions side by side (lg) | stacked actions | full-width, 12px from edges, safe-area |

Mechanism changes, not just stacking (AS "recompose deliberately"): scrub → native snap; topbar pager → bottom glass nav; live dossier panel → progress strip.

---

## 5. Colour & surface roles

### 5.1 Roles (measured)
| Role | Light chapter (partners) | Dark chapter / modal |
| --- | --- | --- |
| Environment | #fff + grain .36 multiply, blue-dither dots (5px, masked), edge vignette | #101011 contact; #0c0c0d shell, #101011 alternate section; flow stage #0e0e11→#09090b, dossier #0a0a0f→#060608; grain/scan/phosphor layers |
| Object | card #171618, soft shadow 0 12 28 ink/.14 | wells #080808; selection #121214/#141416; glass rgba(20,20,22,.62)+blur; device metallic gradient |
| Information | ink #121113 / #151416; muted ink .48–.52; faint .32–.38 | #fff / #eeeee9; muted .56–.62; faint .34–.42; lines .08–.09, strong .14–.20 |
| Signal | section accent only on heading marker (#a94f16 @25% border); REC red #d12424 | per-context accent (partner `accentColor`, e.g. #d99c35; contact/flow #818cf8 + iris #3f51b5); REC reds #ef4444/#e65b59; error #f3a6a6 / #f08a8a |

### 5.2 Accent applications seen (signal only)
Eyebrow/label text and blinking dot · topbar kicker (52% mix) · progress current segment (2–3px; current segment scaleY 1.5) · step mark ring + 16% halo + glow · selected chip: 1px border + 14% fill + filled mark · selected row/card: 1px border + 1px ring + accent-tinted shadow · check orb fill · input focus = bottom border · counter/level ticks · index badge 80% · link icon colour · stage border 30% mix + shadow bloom 40% · section radial bloom 7–9% · large blurred circle ~10% · scrollbar thumb 42–55% · OSD dot · **primary plate hover = full accent fill** (the only solid-accent area; it is the action). Selection is never colour-only: check icon, filled mark, border, position, aria state [M/S].

### 5.3 What a client accent may drive
Everything in 5.2. Never: environment (#0c0c0d / #fff chapters), object surfaces, white primary plate at rest, text body colour. Text on accent fills uses contrast-picked ink (`--primary-foreground` / library `inkFor()`). Keep a separate **iris** (deep accent, `color-mix(accent 62%, #000)` [L]) for glows/blooms so light accents (yellow, white) still read. REC/status red and error red are system colours, not accent.

### 5.4 Attribution / watermark inventory
| Placement | Form | Link? | Where |
| --- | --- | --- | --- |
| Brand-in-heading | wordmark inline in title at .95em, `brightness(0)` | no | "Les partenaires EVOVIEW" [M] |
| Chassis header | wordmark 75–92px white + 1px divider + kicker/title readout | no on evoview.be; **yes on clients** ([L] → `https://evoview.be/`, new tab, named) | dossier, application, consent [M]; reservation [L] |
| Device head | wordmark 92/75px top-left + status dot readout | no | contact monitor [M] |
| Live-screen watermark | wordmark, opacity .12, ~18% width, centred or bottom-right corner | no, decorative | flow dossier screen [S/M visible] ; [L] ticket .07, 70px bottom-right |
| Instrument prefix | "EVV / CH 02", "EVV / WORK", "EVV—26XXXXX" | no | no-signal, stage meta, dossier ref [M] |
| `PartnerWatermark` | **client** logo SVG inline | no | client mark on Evoview surfaces — not Evoview attribution |
Rule derived: **one linked Evoview mark per component, in the chassis header; any further marks are aria-hidden, ≤.12 opacity, corner-placed, never inside or adjacent to a client CTA.** Instrument prefixes ("EVV") are Evoview's own vocabulary — on client sites replace with the client's short code unless the authorised signature says otherwise (no new branding placements without authorisation — STRATEGY).

---

## 6. Motion

Shared constants (source `lib/motion.ts`, `index.css:209-214`, used throughout): fast 180 · control 280 · reveal 600 · cinematic 900 ms; standard `cubic-bezier(.2,.8,.2,1)`; cinematic `(.23,1,.32,1)`; stagger 80ms. Local variant `(.22,1,.36,1)` for layout/height.

| Motion | Duration / easing | Job (AS) | Scope |
| --- | --- | --- | --- |
| Section/heading reveal | y24→0 + fade, 600–700 cinematic, once | reveal | all |
| Archive card focus | opacity .4→1 360 ease; scale .94→1 500 cinematic; media 1.01→1.035 700 | compare/select | archive |
| Name typewriter | clip-path `steps(n)` in 210 (+45 delay), out 150 | acknowledge change | archive (signature) |
| HUD acquire / breathe | 420 (.22,1,.36,1) scale 1.035→1; 3.8s ±2px loop | establish focus | active card only, desktop |
| Progress fill | scroll-timeline, linear (compositor) | progress | archive |
| No-signal → acquired | 320 steps burst once video has a frame | reveal when ready | archive |
| Video settle | src assigned after 160ms dwell | perf | archive |
| Shell power-on | scaleY .012→1, scaleX .9→1, 480–500 cinematic + white flash .45→0 450 | open | dossier + application (local CRT) |
| Shell close | 420: scaleY→.012 by 58%, then scaleX→.5 | close | same |
| Loader | grace 120ms, min 700ms, count + module cells + 1px bar | progress (honest) | dossier, application |
| Content in | stagger 80, sections y16→0 600 cinematic | reveal | dossier |
| Project switch "zap" | dark overlay 240 + OSD badge 1.5s | compare/direction | dossier |
| Mobile bars hide | translateY ±100% 280 cinematic on scroll-down | calm | dossier mobile |
| Step change | x 24→0 in / x −16 out, 340 cinematic | direction/progress | flow |
| Auto-advance | 420ms after single choice ([L] 340) | progress | flow |
| Tile reveal | y18 scale .985 blur 6→0, 600 cinematic, 120 + i×80 | reveal when media ready | flow intro |
| Journey rows | height 0→auto 360 (.22,1,.36,1); cursor layout slide 420; fill width 520 | progress | flow panel |
| Channel switch on preview screen | scaleY .018→1 with jitter 360 / out 180 | compare | flow panel (local CRT) |
| Ribbon drift | 64s linear loop; camera-focus HUD dwell 3.6s, exp. blend τ145ms | atmosphere (ambient) | contact |
| Device lift | −4px on CTA hover, 650 cinematic; arrow rotate −35° 250 | acknowledge | contact |
| Press | scale .97–.985, 140 | acknowledge | all controls |
| Hover | border/colour 180–220; primary bg → accent 300 cinematic; orb x+3 | acknowledge | all controls |
| Consent | y28→0 460 (.22,1,.36,1); panel swap x ±8 200 | reveal | consent |
| Blink dots | REC 1s; status 1.4s (`redBlink`); current-segment pulse 2.2s | status | instrument only |

Choreography rules observed: media-gated reveals (never time out into an empty state; loader floor 700ms for readability); ambient loops pause off-screen, on hidden document, when a modal suspends the page, and when the section has focus (ribbon); only the active archive card mounts its video.
**Reduced motion:** none in current site source (AS: intentional single full-motion experience). The library reservation *does* implement `prefers-reduced-motion` [L], and STRATEGY asks packages to document it. → **Decision needed** from the orchestrator (§10 #16).

---

## 7. Layout archetypes

**A1 Archive track (scroll-scrubbed carousel)** — signature
```
           SECTION HEADING (centred, marker + brand wordmark)
NAME (typewriter, rail-left)
 ┌┐                                       ┌┐
   ╭──────────╮   ╭────────╮  ╭────────╮
   │ media    │   │ dim .4 │  │ dim    │      track translates with page scroll
   │  REC ●   │   │ ×.94   │  │        │
   │ 01/04 ⦿  │   ╰────────╯  ╰────────╯
   │ TITLE    │
   ╰──────────╯
 └┘                                       └┘
        01 / 04  ▬▬▬▬▬▬▬|────|────|────   (680, 3px, ticks)
```
260vh section, sticky stage; card .90 portrait @ 31vw; active centred; mobile = native snap 82vw, .70 portrait. Job: browse evidence one at a time. Signature: scrub mechanism, typewriter name, active-only HUD corners, REC, ticked progress. Adaptable: card count, media, identity lines, accent, light/dark chapter.

**A2 Portrait evidence card** — media full-bleed + bottom scrim (52%→88% black) + left wash; identity block bottom-left (readout 9 → title 37 → meta 8); status top-right; whole card is one button. Job: single hit target, media clipping.

**A3 Immersive dossier shell (modal)**
```
╭───────────────────────────────────────────────────────────╮ 24 r
│ LOGO │ KICKER/TITLE        (⟲) NAME ▬▭▭▭ (⟳)      [× FERMER]│ 77h, rule
├───────────────────────────────────────────────────────────┤
│  scrolling body, sections alternate #0c0c0d / #101011      │
╰───────────────────────────────────────────────────────────╯
mobile: [glass topbar 52]  …body…  [glass ‹ PRÉC | 01/04 ▬ | SUIV ›]
```
1480×920 max, full-bleed <768, owns scroll, backdrop black/.80 + blur, focus trap, Escape + history Back close, pager arrows ←/→. Signature: header strip vocabulary, power-on/close, OSD/zap. Adaptable: kicker, title, accent, sections.

**A4 Case hero split** — `[eyebrow ● / index+H1 / lead / tags / ruled 3-col meta] .92 | .70 [4:5 stage, HUD, REC, frame meta, overlapping inset −22px]`. Job: name the subject, show it. Mobile: copy then media (debt) → recommend media-first.

**A5 Ruled pillars** — 3 columns 1.1/.95/.95, hairline top/bottom + verticals, `NN / LABEL` → 64px → heading → compact copy (40ch). Job: three facts without cards. Mobile: stacked with top rules.

**A6 Device showcase** — title/copy+link split; 16:9 browser (bar 48h: dots · URL capsule · page readout); row: menu figure / phone 226 / ordered journey list with numbered hairline rows.

**A7 Proof gallery** — 12-col: panorama 2.2:1 full → 3 × 4:5 (span 4) → closing 21:9 with left/bottom scrim and statement overlay; every figure carries an indexed glass chip top-left. Mobile: 6/6 pair + full 16:10, closing 3:4.

**A8 Closing statement + action** — immersive display (2 lines) 1.22 | .78 full-width white CTA 52h, rule above.

**A9 Invitation device over proof ribbon** — centred chapter statement; behind: ribbon (opacity .66, edges masked 5%); front: 580 device (head: wordmark · status; body: emblem 74×56, eyebrow, 2-line h3, intro; 64h launcher). Footnote 2 lines below. Job: invite. Signature: the device + camera-focus ribbon; eye emblem is Evoview-only.

**A10 Proof ribbon** — infinite track, alternating landscape/square 16r frames, gap 20 (12 mob), camera-focus brackets follow the real frame bounds + REC + "AF-C • 4K" label. Ambient.

**A11 Flow intro split**
```
│ DISPLAY. script line        │ ╭──╮╭────────╮ │
│ lead (43ch)                 │ │B ││   A    │ │  6×6 grid, gap 8
│ ▏body with accent rule      │ │  │╰────────╯ │
│                             │ ╰──╯╭───╮╭───╮ │
│ [Commencer ……… (→)]         │ ╭──╮│ C ││ D │ │
│ ≈ 2 MIN · 5 ÉTAPES          │ │E │╰───╯╰───╯ │
```
Mobile: copy → CTA → 3 tiles. Proof chip on one tile (figure + label).

**A12 Stepper with live dossier**
```
│ (01) Question heading?            │ ╭ DOSSIER EN COURS ··· 39% ╮│
│ support text                      │ │ ▬▬ ▬▬ ▭▭ ▭▭ ▭▭  (cursor)  ││
│ ╭01─────────────────────────────╮ │ │ live preview of hovered / ││
│ │ ◎  Option label           ○  │ │ │ chosen answer             ││
│ │    HINT READOUT               │ │ ╰────────────────────────────╯│
│ ╰───────────────────────────────╯ │ ✓ AMBITION                    │
│ …                                 │ (02) CONSTAT [✓ chip][○ chip] │
│        ← RETOUR   [Continuer (→)] │                    ↺ RESET    │
```
62/38. Panel = progress rail + preview screen + journey list (done rows collapse to mark+label; current row shows answer ticks; reachable rows jump back). Mobile: panel removed, 5-segment strip under header. [L] reservation keeps the left column only, progress in header.

**A13 Question patterns** (inside A12): option rows (88h, icon 44 at x24, index top-left, check orb right) · chip cloud (single/multi, max-N with counter ticks) · scale cards (4-level, level ticks, 2→4 col ≥1280) · grouped questions A/B separated by rule · underline field grid (2-col ≥768, wide fields span).

**A14 Result screen** — emblem reveal → status readout `● DOSSIER REF · TRANSMIS` → display + script → lead → numbered next-steps (hairline rows) → primary + ghost; media column right ≥1024 [S].

**A15 Media loader** — kicker + name (display) ⟷ count `03/08`; module cells; 1px bar in accent; retry on failure. Honest progress, text status.

**A16 Consent sheet** — bottom-docked 1120 panel; header strip (logo · divider · kicker); body text/actions split; secondary view with switch rows in faint bordered modules.

**A17 Pending dossier card** — centred 760 card (24r, glass, HUD), modules shimmer; for "content coming" states.

---

## 8. Coherence rules

1. **Header strip is the chassis signature**: `wordmark │ KICKER / TITLE readout … [state] … [close]`; kicker 7px accent-mixed, title 9px. Same in dossier, application, consent, reservation. (A3, [L]; AS "preserve location, reliable return")
2. **One primary subject per scene**: hero = name + one 4:5 stage; archive = one active card (others .4/×.94); flow = one question. (AS core rule 2)
3. **Show, then explain**: media leads on desktop splits and must lead on phones too; do not copy the current mobile case-hero order (§10 #19). (AS "show, then explain")
4. **Split ratios are asymmetric** (.92/.70, 1/.68, 1.22/.78, 1/.62, 1.1/.95/.95); 50/50 only for the intro mosaic where both halves are peers.
5. **Separate with rules before boxes**: meta rows, pillars, journey lists, question groups, next-steps all use 1px white/.08–.09 hairlines; cards only for hit targets, media clipping, selection state. (AS "spacing communicates")
6. **Radius tiers by role** (§3): 24 shell / 16 well+selection / 12 command / pill token / 4 badge / round dot; inner = outer − padding; device mockups are the only >24 exception.
7. **Commands rectangular, tokens pill**: CTA/link/close 12r; options/ticks/status pills. Never a pill for a container of copy.
8. **Two button weights only**: primary = white plate, dark text, 40px dark orb with arrow at right (48–56h; 64 launcher), hover → accent fill, press .985; ghost = text-only readout with icon, 44h. Pick one primary label voice for the library (recommend flow voice: Montserrat 700 14, sentence case — §10 #20).
9. **Selected = border + fill + mark + aria**, never colour alone: 1px accent border, 14% tint, filled check orb, `aria-checked`/`aria-current`.
10. **Inputs are underlines**: no box, 1px white/.20 bottom, focus → accent, error → #f08a8a + message `aria-describedby`; label = 9px Satoshi readout above; value 16px.
11. **Every repeated object carries an index** (`01`, `01 / 04`, `A/B`, chip `01` badges) in Satoshi — this numbering is part of the Evoview voice, applies to client content too.
12. **Accent is signal only** (§5.2–5.3); one accent per context; client accent drives it, iris derived for glows.
13. **Motion has a job** and pauses when unseen; ambient loops (ribbon, HUD breathe, blink) stay quieter than state changes; media reveals only when decoded, with a ≥700ms readable loader when shown. (AS "give motion a job", "reveal media when ready")
14. **Mobile changes mechanism**: scrub → snap; topbar pager → bottom glass nav; side panel → strip; hide chrome on scroll-down, reveal on up/focus. (AS responsive)
15. **Modal contract**: backdrop black/.80 blur, focus to close/heading, trap Tab, Escape closes one level, history Back closes, page behind inert + ambient paused, restore focus to launcher.
16. **Labels never shrink below 7px; remove decoration first** (HUD, inset, browser page readout, endpoint markers vanish on phone).
17. **Instrumentation relates to the subject** (camera REC on video/photo work, channel OSD on switching, dossier ref on applications). For clients, keep the grammar (index, status dot, progress) and drop camera/CRT/eye motifs unless the client's subject is visual production. (AS "repeat meaning, not decoration")
18. **Attribution**: one linked wordmark in the chassis header; extra marks decorative ≤.12 opacity; never inside a client CTA (§5.4; STRATEGY).
19. **Draft persistence + resumability** for multi-step flows (sessionStorage draft, resume label "Reprendre · étape 03/05"), auto-advance only for single-choice steps.
20. **Live region for every step/slide change** ("Projet 2 sur 4 : X", "Étape 2 sur 5 : Constat").

---

## 9. Candidates for neutral library components (ranked)

| # | Name | Archetype | Props / slots | Accent palette | Desktop / mobile |
| --- | --- | --- | --- | --- | --- |
| 1 | **`evo-controls`** (foundation kit) | rules 6–10 | `PrimaryPlate{label, icon, busy}`, `Ghost`, `GlassClose`, `PagerOrb`, `OptionChip{index, selected, disabled}`, `Tag`, `GlassLink{external}`, `UnderlineField{label, optional, error}`, `Switch`, `SegmentProgress{count, current, done, onJump}`, `StepMark`, `IndexBadge`, `Readout` | `--evo-accent`, `--evo-accent-ink`, derived `--evo-iris`; all selected/focus/progress states | 44px touch floor everywhere; `(hover:hover)` gating |
| 2 | **`evo-flow`** (multi-step form chassis) | A11, A12 (left column), A13, A14, A15 | `config.steps[]` of `{type: rows\|chips\|multi(max)\|scale\|group\|fields, question, support, options[{label, hint, icon}]}`, `intro{display, lead, media[]}`, `result{title, nextSteps[]}`, `submit()`, `onResult`, `signature{href,label}` | step marks, selections, progress strip, focus underline, CTA hover, emblem/iris | Desktop: single column ≤900 (reservation shape) with optional intro mosaic split; Mobile: header strip progress, bottom bar, auto-advance. Generalises `reservation` (which becomes a preset). Live dossier panel stays Evoview-only (per reservation README). |
| 3 | **`evo-dossier`** (project/case-study modal) | A3 + A4–A8 slots | `items[]`, `initialIndex`, header `{kicker, title}`, sections as slots: `Hero{eyebrow, index, title, lead, tags, meta[], media(4:5), inset?}`, `Pillars[3]`, `Device{url, desktop, detail, phone, steps[]}`, `Gallery{panorama, portraits[3], closing{statement}}`, `Closing{statement, cta}`; loader; pager | per-item accent (`item.accent`) like `--service-accent`: labels, progress, blooms, stage edge | Desktop 1480×920 shell; Mobile full-bleed + glass top/bottom nav, **media-first** hero |
| 4 | **`evo-archive-track`** | A1 + A2 | `items[{title, media(video\|image), poster, meta, status}]`, `heading`, `onOpen(i)`, `tone: light\|dark`, `scrub: boolean` | active progress fill, focus ring, optional status dot; card stays neutral | Desktop sticky scrub (CSS scroll-timeline + rAF fallback), Mobile native snap 82vw; keyboard ←/→/Home/End; video only on active + 160ms settle |
| 5 | **`evo-proof-gallery`** | A7 (+ A6 browser/phone frames) | `panorama`, `portraits[]`, `closing{image, kicker, statement}`, figure chips `{index,label}` | chip index badge, statement kicker | 12-col → 6/6 + full; ratios per §4.3 |
| 6 | **`evo-invitation`** (closing CTA chapter) | A9 + A10 | `title`, `device{status, eyebrow, heading, intro, cta}`, `ribbon{images[]}`, `footnote`, emblem slot (client mark, not the Evoview eye) | status dot, eyebrow, CTA hover, ribbon focus HUD tint | Desktop device 580 over ribbon; Mobile 350 device, ribbon dimmed; ribbon pauses off-screen/focus-within/hidden |
| 7 | **`evo-consent`** | A16 | `categories[{id, title, copy, storage, locked}]`, `onSave`, `reopenEvent` | status chip, switch on-state, accept hover | Bottom sheet 1120 → full-width; focus trap; Escape only in review mode |
| 8 | **`evo-media-loader`** | A15 | `title, kicker, loaded, total, failed, onRetry` | bar + ready modules | Centered 460 card; text status; min 700ms when shown |

Accent-palette demo for each showcase page: reuse `src/pages/AccentPicker.tsx` (`inkFor()` contrast ink); verify light accents (yellow #d99c35-ish, white) still show selection via border+mark, not fill only.

---

## 10. Grammar doc vs reality

| # | Grammar says | Rendered / current source |
| --- | --- | --- |
| 1 | §9.6 Contact = open dark composition, 64px white launcher on 1360 rail | Centred 580px **device/monitor** (30r frame, 22r screen, CRT layers, eye emblem) containing a 64px pale `#eef0fa` launcher; ribbon behind |
| 2 | §8.4 dark chapters left-aligned | Contact title and device centred |
| 3 | §9.6 ribbon frames 320/240, 224/168 mobile | Overridden in contact to 360×290 / 290×290; mobile 280×240 with even frames still 290 (override not reset) |
| 4 | §9.6 ribbon pauses under reduced motion | No reduced-motion check in source; pauses off-screen, hidden, suspended, focus-within |
| 5 | §9.5 partner modal full-bleed at 820, gallery 84vw snap, 3-col pillar selector, CSS 928–1267 | Full-bleed <768; breakpoints 1180/1023/639; static 12-col gallery; pillars are static ruled columns; CSS is 890 lines |
| 6 | Radii/type given in px as rendered | rem tokens render ×0.86 at 1440 (24→20.6, 16→13.75, 12→10.3, 20→17.2); px-authored partner/flow values unscaled → mixed |
| 7 | §5.4 body 13–18px | `type-compact-body` renders 11.2px on desktop 768–1470 (pillars, consent); contact intro 12/11px |
| 8 | §5.1 Gaegu process-only | Also application intro + success (`capp-script`) |
| 9 | §5.4 display uppercase | Questions, option labels sentence case; contact device h3 is Montserrat 500 sentence case |
| 10 | §12 selector button 12px | Option chips 999px pills 48/58h (site and library) |
| 11 | §17.2 qualification shell 28px renders 16 | Now `--vs-radius-2xl` (20.6 rendered @1440) |
| 12 | §6.2 contact accent violet #634B72 | Rendered contact/flow signal = indigo #818cf8 + iris #3f51b5 |
| 13 | §6.2 partners accent #A94F16 | Only on heading marker border (25%); case dossier uses per-partner accent (#d99c35); focus ring #8b689e, click-pulse #4a5ab8 legacy |
| 14 | §11.4 desktop prev/next = two equal peer controls | Partner dossier uses centred 42px pager orbs + name + progress in the topbar |
| 15 | §17.3 monospace debt | Still present: no-signal readouts, chip index badge, stage REC (`ui-monospace`) |
| 16 | §13 wire reduced motion | AS forbids adding it on the site; site source has none; library reservation has it → **conflict to resolve for client packages** |
| 17 | §4.4 primary CTA 52px, launcher 64 | Confirmed (pwm-cta 52, launcher 64); flow primary 56 intro / 48 bar; consent buttons 41px desktop (3rem×.86) |
| 18 | §9.5 HUD 14px REC / 18px dot | Confirmed |
| 19 | §14 primary media remains large on mobile | Case hero on phone: copy (≈500px) before the 4:5 stage, media starts below the fold |
| 20 | §5.2 `type-control` = control voice | Three primary label voices: Grotesk 9.5 UPPER (dossier CTA, consent), Montserrat 700 14 sentence (flow, reservation), Satoshi 700 13 sentence (contact launcher) |
| 21 | — | Flow desktop bar `translateY(-20px)` overlaps the last option row at 1440×900 (step 1) |
| 22 | — | Three REC reds (#d12424, #ef4444, #e65b59) |

---

## 11. `components/reservation` vs site form language

| Aspect | Site (application) | Reservation [L] | Verdict |
| --- | --- | --- | --- |
| Chassis | modal 1480×920, 24r (20.6 rendered), header strip | inline ~900 column, 24r px, header strip with linked wordmark | consistent; library correctly px-authored |
| Progress | desktop: rail in side panel; mobile: strip under header | 5-segment progress in header at all widths, jump-back buttons | consistent with site mobile; good neutral default |
| Question | Grotesk 900 45.4 sentence, 34px mark with halo | Grotesk 900 48, same mark | consistent |
| Option row | 88h, 16r, pad 12/52/12/92, eye glyph, index, check orb | 84h (76 mob), same anatomy, client icons allowed | consistent |
| Chips | pill 48/58, numbered mark → check | pill 48, numbered orb | consistent |
| Primary | white plate 56/48, Montserrat 700 14, 40 orb, hover accent | 54, same | consistent |
| Fields | underline, 16px value, 9px label | same (46h) | consistent |
| Live dossier panel | yes (Evoview-only) | deliberately omitted | correct per STRATEGY |
| Recap | journey list / screen | recap ticket with watermark .07 | library-local, consistent with watermark rule |
| Attribution | wordmark not linked (own site) | wordmark → evoview.be, new tab, named | correct client form |
| Reduced motion | none | implemented | diverges (see §10 #16) |
| Accent | fixed indigo | host `--primary`, iris derived, ink override | library model is the one to generalise |
| Scale | root composition scale | container queries, no root scale | library model preferred |
