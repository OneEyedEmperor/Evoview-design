---
name: evoview-chapter
description: Evoview page-section shell as React components — Chapter (tone light / paper / dark with hard cuts, rhythm standard / compact / cinematic, reading / wide rail, data-nav-tone for the navbar), ChapterHeading (centered / split, standard / feature, accent marker, inline client mark, subtitle, ticker, side instrument) and ChapterFooter (logo, legal, links, the approved Evoview attribution). Use when building or restructuring the sections of an Evoview client page. Triggers on "evoview chapter", "section shell", "chapter heading", "tone cut", "evoview footer".
---

# Evoview chapter

Package: `/root/.vibehub/projects/evoview-design-library/components/chapter/`
Showcase: `https://evoview-library.said.bet/layouts/chapter`

Read `README.md` ("What is Evoview", attribution, API) and the library's
`STRATEGY.md` first; the foundation README covers tokens and the pause model.

## Procedure

1. Open the showcase at 1440 and 390; switch the palette to the client's
   accent and to yellow / off-white. Use the specimen to try each planned
   section's tone / heading / heading instrument (phases, ticker, steps)
   on a dark page; rhythm is shown on the page scene below.
2. Plan the page as chapters before writing markup: for each section pick
   tone (alternate near-white / near-black; same-tone neighbour → `compact`),
   rhythm (`cinematic` for a dark entry), rail, heading layout. One
   `feature` heading per region, one accent word at most.
3. `components/chapter/install.sh /root/.vibehub/projects/<client>`
   (installs / upgrades `foundation` first).
4. Edit only `src/components/chapter/chapter.config.tsx`: client name, inline
   mark (currentColor SVG), footer logo, legal line, links (FR / EN). Leave
   `attribution` as delivered (on, `https://evoview.be/`).
5. Wrap each section in `<Chapter id tone rhythm rail>` with one
   `<ChapterHeading>`; put `<ChapterFooter config>` last. Remove any
   `data-nav-tone="dark"` page wrapper; feed the navbar
   `sections: chapterNavSections(…, clientAccent)`.
6. Check the host `--primary` / `--primary-foreground`; fix those tokens
   rather than restyling headings.
7. Verify with the README checklist, then log an activity record
   (`surface: code`, `type: feature`, subject = the client project) with the
   package version.

## Rules

- No custom paddings, mid-grey chapters, divider rules or gradient bands
  between chapters, nor rules inside the footer: tone + rhythm + spacing
  separate.
- The inline title mark is the client's; the Evoview wordmark appears once,
  linked, in the footer credit. Never place it next to a client CTA; keep
  CTAs inside chapters.
- Client copy, media and accent change freely; marker, heading anatomy,
  rhythm, rails and tone values do not.
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients re-run `install.sh`.
- Respond in English even when the client interface is French.
