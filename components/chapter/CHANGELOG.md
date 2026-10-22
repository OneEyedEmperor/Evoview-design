# chapter changelog

## 1.0.0

- First release on `foundation` 1.0.0: `Chapter` (tone light / paper / dark,
  rhythm standard / compact / cinematic, rail reading / wide / none,
  per-chapter `accent`, `data-nav-tone`), `ChapterHeading` (centered / split,
  standard / feature, accent marker with optional live pulse, subtitle
  measures 590 / 380, support and side slots), `ChapterMark`,
  `ChapterTicker`, `ChapterFooter` (logo, legal, links, Evoview credit),
  `chapterNavSections`.
- Config: `chapter.config.tsx` — `brand { name, mark, logo, href? }`,
  `footer { legal, links[], linksLabel, newTab }`,
  `attribution { enabled, href, credit, label }`, FR / EN.
- Pauses the live marker's `::after` pulse locally (foundation 1.0.0's
  `.ev-ambient` rule does not reach the pseudo-element).
