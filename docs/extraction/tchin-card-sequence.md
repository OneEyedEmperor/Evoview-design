# Tchin — card sequence (clip board + "Vivez l'Expérience")

Sources (read-only, `/root/.vibehub/projects/test`): home `sections/KaraokeSection.tsx` + `.css`;
karaoke page `karaoke/VideoGallery.tsx` + `.css`, `media/MediaWatermark.tsx` + `.css`,
`data/karaoke-data.ts`; shared `.clip-board` / `.clip-tile` / `.spec-strip` / `.dim-channel`
rules in `src/index.css` (l. 639–836, 954–1004, 1492–1547). Measured on
`resto-tchin.said.bet` 2026-10-27. Screenshots: `~/.vibehub/documents/evoview-library/tchin/src-{board,gallery}-{1440,390}.png`.

One mechanism in two layouts: a timed focus that walks a row of portrait video
cards; only the focused card plays, the others recede.

## Structure (rendered)

| | Home board (`#karaoke`) | Karaoke gallery (`#videos`) |
| --- | --- | --- |
| Heading | logo art + h2 "5D KARAOKE" 79px gold gradient, centred lead | h2 "Vivez l'**Expérience**" 44px centred (Ninja on the accent word), description `sr-only` |
| Cards | 2 of the 4 clips, 268×477 @1440 (9:16), gap 28 | 4 clips 337×599 @1440, gap 16, board breaks out to 1396px (wider than the 6xl column) |
| Beside | 3 feature tiles (363×144, stretched to card height): icon circle + gold label 11.5px +.18em + body 14px/1.7 | — |
| After | hairline, price "12€" 72px accent + "par personne / par heure" + one line, CTA (gold `Button`) right | — |
| Grid | clips `1.55fr` : features `1fr` (≥1024; 1.4 : 1 below) | 4 cols ≥1024, 2 cols below |
| Card anatomy | `<Link>` to `/karaoke`; video + poster, dimmer, CRT layers, bottom scrim, watermark, 2px edge, foot (kicker 9–10px over title 24.6–27.4px Overused 700, arrow orb 40px) | same, `<a target=_blank>` to the restaurant Instagram, raised (extruded) watermark, glare layer |
| Radius | 14.5px (1.1 × composition unit) | 1.1rem |

390: both boards are 2-up grids (167×296 / 175×311, gap 8–10), arrow orb hidden,
home features stack under the clips with the 3rd removed, closing stacks (CTA full width).

## Motion and states

- **Sequence**: dwell 2,000 ms per card, wraps. Home: `setInterval` while the board is
  ≥10 % visible. Gallery: `setTimeout` chain carrying the **remaining** dwell across pauses
  (gate = intersecting && `!document.hidden` && not reduced-motion && not hovering).
- **Focus look**: accent 1px border + bloom (gallery: 16/42/72px accent glows), media
  scale 1.04 → 1.10 authored but never rendered (see bugs), dimmer .46 rest → .79 for the others while
  sequencing → 0 on focus, 2px accent edge wipes in from the left (700ms
  `(.16,1,.3,1)`), title lifts 2px, kicker turns accent, arrow orb accent + 3px slide.
- **Channel signal**: on focus a `.dim-channel__signal` (stepped scanlines, 360ms) mounts
  over the focused picture only — no fold.
- **Playback**: only the focused card plays; `preload="none"` until it plays; home posters
  deferred until 400px from the viewport; "deco" clip rewinds to 0 on focus and does not loop
  unless hovered.
- **Hover (gallery only)**: `(min-width:768px) and (hover:hover) and (pointer:fine)` +
  `pointerType === "mouse"`: entering a card displays it and suspends the clock; moving to an
  adjacent card hands over without resuming (`relatedTarget` inside the same board);
  leaving resumes the auto card with its remaining dwell; window blur / query change clears
  the hover. Home board: no hover (CSS comment "No hover").
- **Tilt (gallery)**: mouse move → `rotateX ±10° / rotateY ±12°` on a 1200px perspective,
  media counter-shifts 0.4×, radial glare follows the pointer (white 16 % → gold 7 %);
  100ms while tilting, 700ms settle on leave.
- **Reveal**: cards rise 26px + scale .985 + blur 6px → none, 560ms, stagger 110ms.
- **Reduced motion**: no sequence, no focus, dimmer .3, transitions off.

## a11y

Cards are links named `title — kicker`; videos `aria-hidden`; board `role=group` labelled by
the title (gallery). Hover is the only way to pick a card on desktop; keyboard focus does not
select (no `:focus` → focus); focus ring = inset white 2px.

## Keep / map / drop

| Trait | Verdict |
| --- | --- |
| Timed focus walking the cards, 2,000 ms dwell, one card plays | **keep** (Evoview choreography) → `useSequenceClock` |
| Remaining dwell carried across pauses; off-screen / hidden tab pause | **keep** → `useInViewPause` + clock (adds modal suspension) |
| Hover selects + holds, adjacent handoff, leave resumes | **keep**, extended to the board and to keyboard focus (RULES §6: the pointed option answers) |
| Recede by dimmer, focused undimmed + scale | **keep** (state as frame) |
| Accent border + bloom on the focused card | **map** → `--card-sequence-signal` 1px + deep-accent bloom |
| 2px edge wipe | **map** → the dwell progress (`sequenceFillStyle`, pauses with the clock; full while held) — the one hairline, information |
| Channel signal on focus | **map** → foundation `ChannelSwitch` (fold → open → signal lines, awaits the decoded video) |
| Arrow orb, accent on focus | **map** → orb with `OrbFill` (liquid, RULES §1) |
| Kicker above title, kicker turning accent | **drop** (no kickers, no colour cut) → one meta line under the title |
| Pointer tilt + glare | **keep** on fine pointers (acknowledge), glare white only (gold tint dropped) |
| Reveal rise | **map** → foundation reveal (y 32 + fade, 600ms cinematic, stagger 80), blur dropped (filters over video) |
| CRT layers, noise, flicker, static, raised extruded watermark, gold gradient h2, Ninja font, `stage-gradient` blobs, lucide icon circles | **drop** (RULES §8, Tchin skin) |
| Watermark | **map** → decorative `EvoviewLogo`, `aria-hidden`, opacity .12, configurable |
| Feature tiles | **map** → tonal list tiles (`--ev-surface-list`), label in the foreground, no icon |
| Hairline above the price row | **drop** (spacing separates) |
| Price in accent display | **keep** as the scene's one accent display word |
| Gold `Button` CTA | **map** → controls `PrimaryPlate` |
| Reduced-motion branch | **drop** (RULES §0); stable state = posters, every card reachable |

## Source bugs / gaps (not copied)

- `.clip-tile__media` transform is `scale(…) translate(calc(var(--ry) * -0.4), …)` with
  `--ry` in `deg`: invalid in `translate`, so the computed transform is `none` (measured on
  all four cards). The focus scale and tilt counter-shift never render; the approved look
  is the unscaled picture, so the package keeps it unscaled.
- Home board: `setInterval` restarts the dwell from 0 after every pause (scroll away,
  re-enter) and never pauses for a hidden tab — fixed by the shared clock.
- Gallery: keyboard users cannot select a card or hold the sequence; focus ring only.
- Gallery: the link destination of every card is the restaurant's Instagram while the
  watermark is a non-linked Evoview logo — kept as is in meaning: card links are client
  destinations from config; no Evoview referral link added (STRATEGY).
- Home `reducedMotion` starts `true` and both boards render unfocused until hydration.
- Home tiles: kicker 9.07px renders below the 11px label floor.
