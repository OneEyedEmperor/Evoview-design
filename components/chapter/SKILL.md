---
name: evoview-chapter
description: Evoview page-section shell as React components — Chapter (tone light / paper / dark with hard cuts, rhythm standard / compact / cinematic, reading / wide rail, data-nav-tone for the navbar), ChapterHeading (centered / split, standard / feature, accent marker, inline client mark, subtitle, ticker, side instrument), ChapterFaq (crawlable FAQ accordion with JSON-LD), ChapterStory (story beside scroll-linked drifting picture lanes), ChapterContact (booking action, place, channels, hours with live open state) and ChapterFooter (bar or panel: logo, pages, socials, contact, legal, the approved Evoview attribution). Use when building or restructuring the sections of an Evoview client page. Triggers on "evoview chapter", "section shell", "chapter heading", "tone cut", "evoview footer", "evoview faq", "evoview contact section", "opening hours", "story section", "about section".
---

# Evoview chapter

Package: `/root/.vibehub/projects/evoview-design-library/components/chapter/`
Showcase: `https://evoview-library.said.bet/layouts/chapter`

Read `README.md` (Signature / Variations / Expression, API) and the library's
`STRATEGY.md` first; the foundation README covers tokens and the pause model.

## Ownership (RULES §13)

- **Preserve** (README "Signature"): tone cuts, rhythm, rails, heading
  anatomy, FAQ / footer panel / contact / story signatures, the footer
  credit. Changes go into the library, never the client.
- **Select** (README "Variations"): `CHAPTER_HEADING_LAYOUTS`,
  `CHAPTER_HEADING_VARIANTS`, `CHAPTER_STORY_LAYOUTS`,
  `CHAPTER_STORY_DENSITIES`, `CHAPTER_FAQ_LAYOUTS`, `CHAPTER_CONTACT_LAYOUTS`,
  `CHAPTER_CONTACT_HOURS_VIEWS`, `CHAPTER_FOOTER_LAYOUTS`. Nothing else.
- **Invent** (README "Expression"): copy, media, accent, tone order, marks.

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
   - FAQ: fill `buildChapterFaqConfig` (plain-text answers, optional
     `link` per answer, `more` = text link to contact, portrait for
     `layout="media"`), render `<ChapterFaq config layout tone />`. Keep
     `structuredData` on unless the page head already carries a FAQPage;
     one FAQ chapter with JSON-LD per page. Set `--chapter-faq-sticky-top`
     to the host navbar's height + gap if it differs from 6rem. Pass
     `level={3}` when the FAQ sits under another h2 (questions become h4).
   - Footer: `layout="bar"` for a one-page site, `layout="panel"` for a
     multi-page site (fill `footer.tagline`, `nav` with `current` per route,
     `socials` with currentColor glyphs, `contact`; cookie settings as a
     `links` entry with `onSelect`).
   - Contact: fill `buildChapterContactConfig` with the client's real
     destinations (maps link for the address, `tel:`, `mailto:`, messaging,
     socials; values are what the visitor reaches), services and the week in
     the business's IANA zone, the booking `action.href`; render
     `<ChapterContact config layout hours tone />`. Pick `layout`
     (columns with a place photo · split for a place worth showing · band
     for a compact closing block) and `hours` (`week` if hours vary by day).
     `timeZone` is the venue's, never the visitor's; give the picture a
     `srcSet` and leave `sizes` to the per-layout default; `level={3}` under
     another h2. Never place an Evoview mark beside the action.
   - Story (the chapter after the hero): fill `buildChapterStoryConfig`
     with the client's story (title with one `<em>`, 1–2 paragraphs,
     optional signed `quote`, optional `emblem`) and ≥ 9 of its own pictures
     (`ratio` per item; each still and poster cut to that ratio at 400w and
     640–800w as `srcSet` / `posterSrcSet`; clips as short forward seamless
     loops whose poster is frame 0 extracted from the clip itself, never a
     separate still). Try `layout` / `density` on the showcase's story
     scene first: `start` / `end` beside the text (alternate them for
     several stories), `center` to open a page, `above` for landscape
     photos; `ample` for few strong pictures, `dense` for a rich library.
     Render `<ChapterStory content layout density tone />`. Keep the drift,
     the one-clip-at-a-time playback and the media-gated reveal as shipped.
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
- Never fork for a client: fixes go into the library (`VERSION`,
  `CHANGELOG.md`), clients re-run `install.sh`.
- Respond in English even when the client interface is French.
