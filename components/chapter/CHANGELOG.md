# chapter changelog

## Unreleased

- Docs: ownership sections (RULES §13).
- API (additive): exported variation arrays `CHAPTER_HEADING_LAYOUTS`,
  `CHAPTER_HEADING_VARIANTS` (new types `ChapterHeadingLayout`,
  `ChapterHeadingVariant`), `CHAPTER_STORY_LAYOUTS`, `CHAPTER_STORY_DENSITIES`,
  `CHAPTER_FAQ_LAYOUTS`, `CHAPTER_CONTACT_LAYOUTS`,
  `CHAPTER_CONTACT_HOURS_VIEWS`, `CHAPTER_FOOTER_LAYOUTS`; existing types now
  derive from them (unchanged). No config change.

## 1.4.0

No config changes.

- **API (additive):** `ChapterStory` takes `still?: boolean` (default false):
  clips render as their posters and the lanes hold their starting phase (no
  drift, no scroll coupling, no video). The showcase story scene passes it
  to keep the library page cheap; client sites keep the default.

## 1.3.0

Requires `foundation` ≥ 1.9.0 (press jelly). Config change for
`ChapterStory` media that set `sizes` (see below); otherwise none. The
Tchin refine pass (phase 3) and showcase notes below were committed before
the press-jelly bump and shipped in the 1.3.0 tree.

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
- **API (additive):** `ChapterContact` takes `level?: 2 | 3` (default 2), like
  `ChapterFaq` / `ChapterStory`; at 3 the title is h3 and the hours title h4.
  The showcase FAQ and contact scenes pass `level={3}` under their h2
  captions.
- **Config:** `ChapterContactConfig.picture.sizes` is now an override; when
  absent the picture gets a per-layout default (`columns` `50vw`, `split`
  `(min-width: 1024px) 50vw, 100vw`). The reference config drops its
  `sizes` (was `(min-width: 1024px) 60vw, 100vw`, which picked the 1200w
  file at 1440 for a 640px picture). Existing client configs keep theirs.
- ChapterContact: the venue clock re-reads just after each minute turns (one
  timeout, was a 30 s interval), only on screen with the tab visible, and
  re-reads at once on return. The weekday comes from the venue's calendar
  date (no locale day-name matching); an unknown `timeZone` leaves today /
  the state unresolved instead of throwing. Today's dot is rendered only on
  today's row / tile; duplicate week-row rules removed (no visual change).
- ChapterFaq: once hydrated, closed answers are `hidden="until-found"` where
  supported, so find-in-page reaches them and opens that question
  (`beforematch`); server HTML is unchanged (no `hidden`), the open / close
  animation is kept. Without support, `visibility: hidden` as before.
- ChapterFooter panel: no behaviour change (phone link typed without a
  non-null assertion).
- **ChapterStory · config (breaking for configs that set it):**
  `ChapterStoryMedia` image `sizes` removed (it was never applied: the reveal
  gate decoded `src` while the tile picked from `srcSet`, fetching twice);
  delete the key. Video media take `posterSrcSet?`. `srcSet` /
  `posterSrcSet` now drive a per-tile pick: one file per picture from the
  measured tile × device pixel ratio (capped at 2), decoded by the gate,
  stepped up only after decoding, never down.
- ChapterStory · config: the reference media are cut to their tile ratio at
  400w + 540–800w (`public/library/chapter/story-*-{400,540,640,800}.webp`,
  was five 640w stills plus the card package's 860–1100w posters); clip
  posters are now each clip's first frame (the card posters are other
  frames, which jumped when a clip started). Story media at 1440 × 1: 1668 →
  388 KB; 1440 × 2: 689 KB; 390 × 3: 477 KB.
- ChapterStory: a clip is fetched the first time it is the one to play (was:
  all clips once the chapter came near; 849 → 143 KB in the first seconds);
  the scroll offset is read in the passive scroll listener, the frame
  callback only writes; `will-change` dropped from the tracks (the running
  Web Animation promotes them).
- ChapterStory · CSS: column lanes fade out over the chapter's block padding
  (`--chapter-story-fade`: 12 % of the window, capped at the compact rhythm),
  so the copy centres against the opaque part: desk → copy 183 → 104 px at
  1440 in the showcase, and the faded foot sits in the bottom padding (was
  above it, adding ~80 px of dark before the next cut). Rows unchanged.
- Showcase: the story heading is `level={3}` under its h2 caption; the frame's
  ink measure stops a masked clip box at its content edge
  (`src/library/ShowcasePage.tsx`).
- Showcase only: the scene desks drop their sentence (the hint at rest, every
  per-option line and the reserved tallest-sentence cell); settings and their
  labels stay, as does each caption's description. Under its desk a story in
  columns (≥ 1024) keeps one heading band and the footer one group gap, so
  pictures and the footer line never touch the pills. Every scene caption
  carries the dummy client's eye (`EveilMark`) at the rail's right edge, on
  the title's cap line (0.7em, white 30 % / ink 22 %, decorative). No package,
  config or API change.
- Behaviour: footer social orbs and the mobile FAQ "more" button take the
  press jelly (RULES §6). FAQ question headers and text links are unchanged.

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
