---
name: evoview-card
description: Evoview card package (was card-track) — media cards (ribbon or portrait) in three compositions, accent-driven from the host --primary. CardTrack: desktop scroll-scrubbed track / phone snap strip, for services or a portfolio browsed one card at a time. CardDeck: category switch over a dealt hand of 3 or 6 cards, for a menu, collection or work by category. CardSequence: timed focus over video cards (one loop plays, hover/keyboard hold), for rooms, venues or experiences on video, as a gallery row or a board with facts and a price. Triggers on "evoview card", "card track", "services slider", "portfolio track", "menu cards", "card deck", "category tabs cards", "video cards", "clip board", "video gallery".
---

# Evoview card

Package: `/root/.vibehub/projects/evoview-design-library/components/card/`
Showcase: `https://evoview-library.said.bet/layouts/card`

Read `README.md` ("What is Evoview", decisions, behaviour) and the library's
`STRATEGY.md` first; the foundation README covers tokens and the pause model.

## Procedure

1. Open the showcase at 1440 and 390; set the palette to the client's accent
   and to yellow / off-white.
2. Pick the variant from the content: `ribbon` when each card needs a
   sentence (services, offers), `portrait` when the image is the argument
   (projects, rooms, dishes). One variant per track. No counters: the
   hairline and dots are the position (`showIndex` is ignored, RULES §1).
3. `components/card/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades controls and foundation first).
4. Edit only `src/components/card/card.config.tsx`: the client's
   tracks, items, copy FR / EN (reuse the client's wording). Replace every
   reference media path with the client's own stills (webp, ~2× card
   width) and optional short muted loops; a card with a loop takes the
   loop's first frame as poster, at the loop's size and ratio
   (`ffmpeg -i clip.mp4 -frames:v 1 -c:v libwebp -quality 80 clip-<w>.webp`).
5. Mount one `<CardTrack>` per chapter with the chapter's `tone` and
   `rhythm`; pass the chapter heading as `heading` so it stays in the sticky
   stage, and `cardHeadingLevel` one below it (default 3 under an h2).
   Wire `onOpen` to the client's real destination (dossier, page);
   omit it if cards open nothing.
6. Check the host `--primary` / `--primary-foreground`; fix tokens rather than
   restyling the cards. Make sure no ancestor is a scroll container.
7. Verify with the README checklist at 1440, 1024, 390, then log an activity
   record (`surface: code`, `type: feature`, subject = the client project)
   with the package version.

## Rules

- Keep the mechanism (scrub on desktop, snap on phone), the card anatomy,
  square tab / seam against round cards, spoken positions and the
  graded-at-rest media. No counting readouts, no `prefers-reduced-motion`
  branch (stable state + pause model).
- No Evoview mark on the track or its cards; attribution belongs to a
  chassis strip (dossier) or the footer, never next to a client CTA.
- Track: no arrow buttons, autoplay timers or third-party slider libraries.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients re-run `install.sh`.
- Respond in English even when the client interface is French.

## CardDeck (catalogue by category, dealt as a deck)

Use when the client's offer sorts into a few categories with a curated
opening selection (restaurant menu, collections, work by discipline).
README "CardDeck" holds the protected choreography and the API.

1. Same install. In the client's `card.config.tsx` add / adapt
   `buildCardDeckConfig(locale)`: categories (short labels, 3 or 6 items
   each, the first one = the selection, one column per category), the
   client's posters, `more` → their full catalogue page (menu, portfolio).
2. Pick `variant` from the content (`portrait`: the image is the argument;
   `ribbon`: each item needs its sentence, e.g. dish descriptions) and
   `rows` (2 = six cards and the full deal; 1 = three).
3. Mount `<CardDeck deck copy tone rhythm heading onOpen />` in the
   section; `heading` takes the client's chapter heading (`cardHeadingLevel`
   one below it). Wire `onOpen` to the client's detail view; never to a
   booking CTA inside the card.
4. Do not retime the deal or the switch sequence (founder-approved, zero
   dead time) and do not add a counting readout, watermarks or a reduced
   motion branch. Verify with the README CardDeck checklist at 1440, 1024,
   390, including rapid category clicks.

## CardSequence (video cards under a timed focus)

Use when a client has a few short loops worth seeing one at a time (rooms,
events, places, an experience). README "CardSequence" holds the protected
timing and the API.

1. Same install. In the client's `card.config.tsx` add / adapt
   `buildCardSequenceConfig(locale)`: one `sequences` entry per placement.
   Home teaser → `layout="board"`: 2 clips, 3 facts, the offer (price +
   one action to the client's booking page). Own page section →
   `layout="gallery"`: 3–5 clips. Posters = first frames; `ratio` from the
   footage ("9 / 16" phone clips).
2. Card `href`s are the client's destinations (detail pages, their social
   profile with `external: true`). Never link a card to Evoview; the
   watermark stays decorative (`watermark` on by default).
3. One accent display word per scene: `accent` on a gallery title, none on
   a board title whose offer shows the price.
4. Mount `<CardSequence sequence copy layout tone headingLevel />` in the
   section (`headingLevel={3}` when it sits under the page's own h2). Keep
   the 2,000 ms dwell, the hold / remaining-dwell behaviour and the channel
   switch; no CRT, noise or flicker layers, no kicker above the titles, no
   reduced-motion branch. Verify with the README CardSequence checklist at
   1440, 1024, 390.
