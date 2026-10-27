# Tchin home story section → `chapter` · `ChapterStory`

Source: `/root/.vibehub/projects/test` `src/components/sections/AboutSection.tsx`,
`AboutSection.css`, `story-mosaic.ts`, copy `src/i18n/fr.ts` `about`. Live
`https://resto-tchin.said.bet/#about`, measured 2026-10-27 at 1440×900 and
390×844 (root 14.67px at 1440). Shots: `~/.vibehub/documents/evoview-library/tchin/story-source-{1440,390,390-b}.png`.

## Structure

`section#about.home-story` (aria-labelledby the h2) › `__inner` grid ›
`__copy` (logo img, h2 with a heart SVG replacing "Cœur" + `aria-label`,
intro p, gradient rule, blockquote + footer "— founder, role") and
`.story-mosaic` (`aria-hidden`, 3 columns × track of the column's panels
twice). Columns are curated by kind: dishes · comic artwork · cocktail
clips (5 forward-only mp4 loops + 320w webp posters).

## Measured (1440)

| Item | Value |
| --- | --- |
| Section | padding 103 / 59; height 836 |
| Grid ≥ 1024 | `7fr 6fr`, gap `clamp(3rem,6vw,5rem)`, max 76rem, align center; copy 499 wide at x 199, mosaic 447 at x 794 |
| Logo | 161×55, centred in the copy column (while the copy is left-aligned) |
| h2 | Overused 700, 44 / 55px, −1.32px tracking, sentence case |
| Intro | Inter 16.5 / 26.8, fg 65 % |
| Rule | 235×1, gold gradient, 2.25rem air |
| Quote | Inter italic 14.7 / 23.8, fg 85 %; attribution 12.8 / 500 in gold |
| Mosaic | height `min(46rem, 82vh)` = 675; columns 128 / 164 / 128 (middle `flex-basis 8%`); gap 13.2; mask fade 14 % top / bottom; radius 16.1; panel `#090909`, 1.4px gold hairline, `0 18px 40px` shadow |
| Ratios | 4:5 and 1:1 dishes, 853:1844 / 3:2 / 1:1 / 4:3 art, 4:5 / 1:1 clips |

390: single column, copy centred (h2 30px), quote and rule `display:none`
below 1024, mosaic 342×352 under the copy (copy first), 3 columns 98 / 126 / 98.

## Motion

- **Reveal** `k-reveal`: y 18px + blur 4px + fade, 620 ms
  `cubic-bezier(.16,1,.3,1)`, once at 15 % in view; delays logo 0, h2 80,
  mosaic 120, intro 160, rule 220, quote 280.
- **Drift**: one Web Animation per column track, `translate3d` 0 → −50 %
  (two copies = seamless), linear, 0.014 px/ms; dir −1 / +1 / −1, phases
  0 / 160 / 70 px. **Scroll-linked**: each scroll delta adds
  `delta × 520 / (innerHeight + sectionHeight) × speed` (speeds 1 / .65 /
  1.3) to `currentTime`; no layout reads per frame.
- **Clips**: no autoplay; every 250 ms and on scroll the controller derives
  each clip's visible span from the track offset and plays only the **one**
  most visible (pauses before playing: never above the cap). Clips are
  fetched once as blobs and shared by both copies.
- **Gates**: media `src` only within 400px (IO); drift + clips only while the
  mosaic intersects (`-1px` margin); clips pause on `visibilitychange`.
  Reduced motion: no drift.

## Keep / map / drop

| Trait | Verdict |
| --- | --- |
| Story text beside a scroll-linked, slowly drifting mosaic (not a marquee); two-copy seamless tracks; per-lane speed / direction / phase | **keep** (values kept) |
| One clip playing at a time, chosen by visible span; offscreen / hidden pause; shared blob clip URLs; media only near the viewport | **keep** (pause model via foundation `useInViewPause`) |
| Staggered once-reveal | **map** → foundation reveal (y 28 + fade, 600 ms cinematic ease, stagger 80); blur dropped (RULES §6, settles on no filter) |
| Copy left `7fr` / mosaic `6fr` | **map** → layout `start`, `5fr / 7fr` (larger side holds the media, RULES §4) on the wide rail |
| h2 Overused 700 sentence case | **map** → `ChapterHeading` feature (Overused 900 uppercase, marker) |
| Heart SVG replacing a title word | **map** → `ChapterMark` (existing inline client-mark slot) |
| Logo above the h2 | **map** → optional `emblem` slot (replaces the marker) |
| Founder quote + attribution | **map** → optional `quote` (Montserrat 500, name in label voice, role fg 55); hidden on phones like the source |
| Gold gradient rule between intro and quote | **drop** (RULES §3: spacing separates) |
| Gold hairline, panel shadow, accent glow blob behind the mosaic, art house grade + gold `mix-blend: color` tint, video scrim | **drop** (Tchin skin / RULES §8); media stay true to colour on `--ev-well` |
| Comic art, dish photos, cocktail clips, logo, copy | **drop** (Tchin assets) |
| `prefers-reduced-motion` → no drift | **drop** (RULES §0: one motion experience + pause model) |

## Source bugs / gaps (not copied)

- No media gate: tiles render as empty dark boxes while images load (seen
  at 1440 on first scroll). Library: the lanes rise only once their stills
  and posters are decoded (`useMediaReady`), failure reveals what loaded.
- Desktop logo centred over left-aligned copy (alignment mismatch).
- Phones put the copy first; RULES §0 wants media first → lanes before the
  copy (except the `above` layout, whose point is text first).
- Phones keep three vertical columns in a 352px window; RULES §7 changes
  the mechanism instead → sideways rows below 1024.
- A column with few panels repeats its own pictures inside the window;
  library lanes extend from the lane across before repeating.
