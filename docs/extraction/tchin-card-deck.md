# Tchin extraction · card-deck — "Un Voyage Culinaire"

Source: `test` `src/components/sections/MenuSection.tsx` / `.css`,
`menu/SignatureCard.tsx`, `menu/CategoryTabs.tsx`, `menu/LogoCursor.*`,
`index.css` (`.tilt-*`, `.flip-*`), i18n `menuSection`. Live
`https://resto-tchin.said.bet/#menu`, measured 2026-10-27 at 1440 × 900 and
390 × 844 (working tree = live dev; it differs from `HEAD`).
Screens: `~/.vibehub/documents/evoview-library/tchin/card-deck-source-{1440,390}.png`.

## Structure

Centred heading (logo art above, h2 with one accent word, one-line lead) →
category tabs (pill tablist, icon + label) → card grid → (nothing: see
"Full-menu action"). Opening view is a curated mix ("default", no tab
selected): columns left → right cocktail · main · starter, two rows. A tab
shows that category's first six items.

## Rendered values (1440)

| Element | Value |
| --- | --- |
| h2 | Overused Grotesk 700, 46.2px / 57.75 (390: 36.8px) |
| Lead | 13.2px, muted |
| Tabs | pill, 296 × 45, buttons 33px high, 11.55px, sliding gold thumb 500ms `(.22,1,.36,1)`; 390: full width 342 × 49 |
| Grid | 1093px wide (115 % of the 6xl rail, children `zoom: 1.15`), 3 cols, gaps 19.8 col / 25.7 row (rendered) |
| Card | 347 × 463 (3:4), radius 19.8, full-bleed media, bottom scrim, title 19.8px 700, description 11.55px 60 % white, 3-line clamp, gold "Découvrir ↗" on hover |
| Badges | "Signature" gold pill, diet pills (red / green), top-left |
| Watermark | Evoview wordmark top-right on **every** card (6 per view), white, high opacity |
| Back face | click / Enter flips the card (800ms rotateY): name, description, gold "Réserver" button, badges |

## Motion (desktop ≥ 1024, Web Animations; source = live trace)

Stacking: top centre z 2, bottom centre z 1, sides 0. Offsets: side cards
start one column + gap toward the centre and one row + gap toward the
**opposite** row (diagonal, from under that row's centre card), scale .92;
centre cards start ±3.5rem vertically, scale .97. Keyframes: opacity 0 →
1 by 35 %, transform → rest.

| Phase | Timing |
| --- | --- |
| Initial deal (in view, once) | centre 950ms, sides 1200ms; delays [580, 0, 580 / 400, 180, 400]; ease `(.16,1,.3,1)` |
| Undeal (tab click) | 600ms (bottom centre 550, tucked behind the top centre); delays [0, 0, 0 / 110, 270, 110]; opacity held to 65 %; ease `(.7,0,.84,0)`; top centre stays |
| Flip out | top centre `perspective(1600px) rotateY(0 → 90deg) scale(.97)`, 300ms `(.55,0,1,.45)` |
| Swap | content replaced while edge-on (React remount by key) |
| Flip in + re-deal | top centre −90 → 0deg 450ms `(0,.55,.45,1)`; others 950ms, delays [650, 0, 650 / 510, 430, 510], bottom centre from behind the top centre |

Live trace (Cocktail mix → Plats): side fade-out ends ≈ 650ms, bottom row
≈ 850ms, new title at ≈ 1170ms, bottom centre visible ≈ 1700ms, sides ≈
1940ms, all settled ≈ 2830ms. No idle gap between phases (founder rule).
Interruptions: a click mid-retract back to the shown tab mirrors every card
from its current frame (`restore`); a click on a third tab retargets the
flip; a click during flip-in mirrors it edge-on and swaps directly;
mid-initial-deal retracts are captured from the current frame
(`currentFrame`) and capped at 600ms (`MAX_RETRACT_MS`).

Phone / tablet (< 1024): CSS deal per card (opacity + y ±3rem, 950ms,
stagger 140ms), tab switch = instant remount (the CSS deal replays).
Reduced motion: everything static.

## Other behaviour

- Card: 3D pointer tilt (±10 / 12deg) + glare + inner parallax; Android
  gyroscope tilt; drink cards play a muted loop on mouse hover only.
- `LogoCursor`: the Tchin logo replaces the cursor over cards.
- `useInView(0.15)` once; no pause model needed (one-shot animations).
- Phone (390): one column, 342 × 456 cards, **cards 4–6 `display: none`**.

## Full-menu action

`HEAD` closes the section with an outline "Voir tout nos délices" → `/menu`
button (and per-card "Plus d'infos"). The working tree (live) removed it;
`menuSection.viewFullMenu` remains unused. Combined with the phone rule
above, phone visitors see 3 items per category and no route to the rest.

## Source issues (flagged, not copied)

1. Phone hides half of every category with no way to reach it, and the
   full-menu link is gone.
2. Tablist opens with no selected tab; the panel has no
   `aria-labelledby`, tabs no `aria-controls`.
3. The card is `role="button"` and its back face holds a second button
   (nested interactive controls).
4. Six linked-looking Evoview watermarks per view at full opacity (RULES §9:
   one linked mark per component, extras ≤ .12, `aria-hidden`).
5. Grid widened with `zoom: 1.15` (offset maths divides by it).

## Keep / map / drop

| Trait | Verdict |
| --- | --- |
| Deck deal: centre first, sides from under the opposite row's centre, stacking order | **keep** (exact timings, eases, offsets) |
| Tab switch: undeal → top-centre flip → swap edge-on → flip in + re-deal, zero dead time, interruptible from the current frame | **keep** |
| Curated opening mix | **keep** as a first, selected "Selection" tab (fixes issue 2) |
| Category tabs | **map** → controls `SegmentedControl` (radiogroup, roving keys, accent thumb) |
| Card: full-bleed media, scrim, title + line, hover affordance | **map** → `MediaCard` portrait (identity bottom-left, graded at rest, glass affordance) |
| Description sentence per card | **map** → `MediaCard` ribbon variant ("Phrase" cards) |
| Hover loop on fine pointers | **map** → `MediaCard` `play` on hover, under the pause model |
| Back face with description + "Réserver" | **map** → `onOpen` (host opens its detail / dossier; no nested CTA) |
| Full-menu link | **map** → optional `more` link under the deck (`GhostAction`), fixes issue 1 |
| Phone: stacked column, 3 cards | **map** → native snap strip with every card + dots (RULES §7), staggered rise |
| Gold, pill badges, Overused 700 mixed case, 115 % zoom | **map** → accent tokens, three voices, wide rail |
| Tilt / glare / gyroscope, logo cursor, per-card watermarks, ambient light blob | **drop** (Tchin skin / RULES §8; attribution stays in the footer) |
| `prefers-reduced-motion` branch | **drop** (RULES §0: stable state + pause model) |
