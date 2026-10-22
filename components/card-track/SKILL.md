---
name: evoview-card-track
description: Evoview card track — media cards (ribbon with information band, or portrait with scrim and identity) on a desktop scroll-scrubbed track that becomes a native snap strip on phones; accent-driven from the host --primary. Use when a client page needs services, offers, projects or a portfolio browsed one card at a time in the Evoview style. Triggers on "evoview card track", "services slider", "portfolio track", "scroll-scrubbed cards", "media card ribbon".
---

# Evoview card track

Package: `/root/.vibehub/projects/evoview-design-library/components/card-track/`
Showcase: `https://evoview-library.said.bet/layouts/card-track`

Read `README.md` ("What is Evoview", decisions, behaviour) and the library's
`STRATEGY.md` first; the foundation README covers tokens and the pause model.

## Procedure

1. Open the showcase at 1440 and 390; set the palette to the client's accent
   and to yellow / off-white.
2. Pick the variant from the content: `ribbon` when each card needs a
   sentence (services, offers), `portrait` when the image is the argument
   (projects, rooms, dishes). One variant per track.
3. `components/card-track/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades controls and foundation first).
4. Edit only `src/components/card-track/card-track.config.tsx`: the client's
   tracks, items, copy FR / EN (reuse the client's wording). Replace every
   reference media path with the client's own posters (webp, ~2× card
   width) and optional short muted loops.
5. Mount one `<CardTrack>` per chapter with the chapter's `tone` and
   `rhythm`; pass the chapter heading as `heading` so it stays in the sticky
   stage. Wire `onOpen` to the client's real destination (dossier, page);
   omit it if cards open nothing.
6. Check the host `--primary` / `--primary-foreground`; fix tokens rather than
   restyling the cards. Make sure no ancestor is a scroll container.
7. Verify with the README checklist at 1440, 1024, 390, then log an activity
   record (`surface: code`, `type: feature`, subject = the client project)
   with the package version.

## Rules

- Keep the mechanism (scrub on desktop, snap on phone), the card anatomy,
  square tab / seam against round cards, indices and the graded-at-rest media.
- No Evoview mark on the track or its cards; attribution belongs to a
  chassis strip (dossier) or the footer, never next to a client CTA.
- No arrow buttons, autoplay timers or third-party slider libraries.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients re-run `install.sh`.
- Respond in English even when the client interface is French.
