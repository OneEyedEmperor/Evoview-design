# chapter changelog

## Unreleased

- Showcase only (`/layouts/chapter`, not installed): every scene is caption →
  desk → component on the component's own ground (shared `Scene` /
  `SceneDesk`, `src/pages/library/scene/`). The specimen, FAQ, contact and
  page scenes gain title captions; the footer becomes its own scene with its
  desk above it (was below, on another ground); one desk pattern replaces the
  four per-scene desks. No package, config or API change.
- Showcase only: scene order follows a client page and alternates grounds,
  so every seam is a hard cut: Chapitre → Récit → Page → FAQ → Contact →
  Pied de page (Page moved up from after Contact). Inside Page the projects
  chapter (paper) now comes before the visit band (dark). Defaults unchanged.
  The frame's stage grade now also covers a dark chapter inside a pale scene
  (`src/library/trial-grade.css`). No package, config or API change.

## 1.2.0

- Depends on `controls` (install.sh installs controls + foundation first).
- **ChapterFaq** (from Tchin "Tout ce que vous devez savoir"): a FAQ chapter,
  single-open accordion on alternating tonal tiles, toggle orb with
  `OrbFill`, layouts `media` (sticky portrait beside the list) / `split`
  (heading column) / `stacked`; answers always rendered (collapsed by height,
  crawlable); phones show `phoneVisible` questions then a "show more" row;
  optional FAQPage JSON-LD from the same strings (`chapterFaqJsonLd`).
  Files `ChapterFaq.tsx`, `chapter-faq.css`.
- **ChapterFooter `layout="panel"`** (from the Tchin footer): brand + tagline ·
  page tiles · social orbs, over contact · legal, the Evoview credit centred.
  `layout="bar"` (default) unchanged. File `chapter-footer-panel.css`.
- Config (additive, existing keys unchanged): `ChapterFooterLink.current?`;
  `footer.tagline?`, `footer.nav?`, `footer.navLabel?`, `footer.socials?`
  (`ChapterFooterSocial { label, href, icon }`), `footer.socialsLabel?`,
  `footer.contact?` (`ChapterFooterContact { address, mapsHref?, phone?,
  phoneHref?, email? }`); new `ChapterFaqConfig` + `buildChapterFaqConfig(locale)`
  (`title`, `subtitle?`, `items[{ question, answer, link? }]`, `more?`,
  `media?`, `phoneVisible`, `showMore(n)`, `showLess`, `structuredData`).
  Re-installs keep the old config: the panel needs the new footer keys
  copied in; the FAQ needs the `buildChapterFaqConfig` block.
- **ChapterContact** (from the Tchin home contact): booking action, place,
  channels and hours with today + open state computed live in the business's
  time zone (30 s tick, paused off-screen), the week folded in `<details>`
  (in flow, no nested scroll) or laid out; layouts `columns` / `split` /
  `band`, hours `today` / `week`. Files `ChapterContact.tsx`,
  `chapter-contact.css`; demo picture `public/library/chapter/contact-studio-{720,1200}.webp`
  (showcase only, not installed).
- Config (additive): new `ChapterContactConfig` + `buildChapterContactConfig(locale)`
  (`title`, `lead?`, `action?`, `place[]`, `channels[]`
  (`{ label, value, href?, external? }`), `hours { title, timeZone, services,
  week, note?, labels }`, `picture?`, `newTab`). Re-installs keep the old
  config: copy the `CONTACT` block in to use it.
- **ChapterStory** (from the Tchin home story section): the client's story
  with lanes of its pictures drifting slowly (Web Animations) and travelling
  with the scroll; one clip playing at a time; lanes revealed once their
  stills / posters are decoded; layouts `start` (original) / `end` /
  `center` / `above`, density `ample` / `dense`; columns from 1024, sideways
  rows below (media first on phones, except `above`). Files
  `ChapterStory.tsx`, `ChapterStory.css`; demo pictures
  `public/library/chapter/story-*.webp` (showcase only, not installed).
- Config (additive): new `ChapterStoryConfig` + `buildChapterStoryConfig(locale)`
  (`title`, `emblem?`, `story[]`, `quote? { text, name, role? }`, `media[]`
  of `{ kind: "image", src, srcSet?, sizes?, ratio }` |
  `{ kind: "video", src, poster, ratio }`); types `ChapterStoryContent` /
  `ChapterStoryMedia` live in `ChapterStory.tsx`. Re-installs keep the old
  config: copy the `STORY` block in to use it.

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
