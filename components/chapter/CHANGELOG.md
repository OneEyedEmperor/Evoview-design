# chapter changelog

## 1.1.0

- Footer bar: no rules (RULES §3). The top hairline and the hairline before
  the Evoview credit are gone; the tone cut / chapter rhythm above separates
  the bar, a wider gap (56 authored) sets the credit off the legal group.
- Split heading: from 768 the row wraps — the heading keeps at least the
  split subtitle measure (380) and a side instrument too wide to sit beside
  it drops underneath instead of crushing the title to a word per line.
- Config: `ChapterFooterLink.onSelect` now receives the click event
  (`(event) => void`, backward compatible); call `preventDefault()` to keep
  an `href` from navigating. No other config changes.
- Showcase rebuilt: an interactive specimen (tone, rhythm, heading, client
  mark on one chapter between two dark neighbours, padding bands flash on a
  rhythm change), then a short page (dark cinematic with a paused-when-hidden
  sun sequence and live marker → dark compact continuation → paper → footer).

## 1.0.1

- Requires `foundation` 1.1.0: removed the local live-marker pause workaround
  (foundation now pauses `.ev-ambient` pseudo-element loops); `index.ts` loads
  `../foundation` before `chapter.css`. No config changes.

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
