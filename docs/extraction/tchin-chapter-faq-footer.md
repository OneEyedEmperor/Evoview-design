# Tchin — FAQ "Tout Ce Que Vous Devez Savoir" + site footer

Source: `/root/.vibehub/projects/test` (read-only), measured on
`https://resto-tchin.said.bet/karaoke/` 2026-10-27 at 1440 × 900 and 390 × 844.
Shots: `~/.vibehub/documents/evoview-library/tchin/src-{faq,faq-open,footer}-{1440,390}.png`.
Files: `karaoke/FaqSection.tsx`, `karaoke/KaraokePoster.css` (`.faq-layout`),
`index.css` (`.k-reveal`, `.k-row`, `.k-faq-*`, `.faq-*`), `data/karaoke-data.ts`
(`FAQ_ITEMS`), `seo/JsonLd.tsx` (`FAQ_KARAOKE`), `layout/Footer.tsx`, `Footer.css`.

## FAQ

**Structure.** Section `pt 80/96 · pb 48/64`, `max-w-6xl` (1152). Head row:
h2 (Overused 700, 44px @1440, −.03em, title case) left, "Une autre question ? →"
text link (14px, fg/.70) right, bottom-aligned; phone: link under h2. Body
`.faq-layout`: poster (comic art, `1 / 2`, 11px radius, gold hairline, sticky
`top 6rem`) `0.62fr` : list `1.38fr`, gap 48 (list 698px @1440). Phone: poster
first at `4 / 3`, list under.

**Rows.** Radix accordion, `type="single" collapsible`. Tiles 57px closed,
radius 11, `padding-inline 14.7`, gap 7.3, alternating fg 2 % / 4 %
(no borders). Trigger: `01`…`10` index (11px, fg/.35, padded) · question
(Overused 700 16.5px, LH 22.7, sentence case) · 28px ring with +.
Open: tile `primary 10 %`, question + index → primary, ring → primary border +
10 % fill, + rotates 180° into −. Answer Inter 12.8px / 20.9 fg-muted, inset 36 / 40;
optional accent link "Réserver une session →". Open/close: Radix height
keyframes 200ms ease-out.

**States / motion.** Reveal: `k-reveal` y 18 + blur 4 + fade, 620ms
`(.16,1,.3,1)`, stagger 40ms from 120ms, once on 10 % in view. Hover (all
pointers): siblings drop to opacity .45 (320ms), hovered index/question → primary,
ring fills. Phone: first 4 rows, then a full-width "Voir les 6 autres questions"
tile (48px, gold hairline, chevron flips).

**Crawlability.** FAQPage JSON-LD on the page (separate hand-written copy).
**Source bug:** Radix unmounts closed `Content` — measured: the answers are not in
the DOM until opened (`textContent` lacks "12€"), so the visible FAQ copy is not
server-rendered; the JSON-LD answers also drift from the visible ones (price
"8€ avec dîner" exists only in JSON-LD).
**Floor bug:** answer 12.8px < 13 body floor.

| Trait | Verdict |
| --- | --- |
| Heading row: title left, "another question" link right; phone stacked | **keep** → `ChapterHeading layout="split"` + side `GhostAction` |
| Sticky media column beside the list, list larger side, phone media first | **keep** → `layout="media"`, RULES question/side `1 / .62` |
| Rounded alternating tonal rows with a small gap, no dividers | **keep** → `--ev-surface-list` / `-alt`, surface radius, gap internal |
| Single-open accordion, open row tinted, ring + → − | **keep**; ring → orb with `OrbFill` (RULES §1), open tint ≤ 10 % accent |
| Phone shows 4 then "show N more" tile | **keep** (mechanism change, RULES §7); hidden rows stay in the DOM |
| Answer link to the booking page | **keep** → optional `link` per item, `GhostAction` |
| FAQPage JSON-LD | **keep**, generated from the same config (no drift) |
| `01`…`10` padded index | **drop** (counting tag; questions are not ordered) |
| Question/index turn primary on hover/open | **drop** (orb + surface carry state; text colour cut forbidden) |
| Sibling dim to .45 on hover | **drop** (text fade); hovered row takes one tonal step instead |
| Blur reveal + stagger | **drop** (chapters are static per package; blur is a Tchin skin) |
| Comic poster, gold hairline/glow, Inter body | **map** → client media in a `--ev-well`, Montserrat body ≥ 13px |
| Radix height keyframes, answers unmounted | **map** → CSS `grid-template-rows` 0fr↔1fr (control 280ms), answers always rendered |

## Footer

**Structure.** `padding 56 24 32` (phone `32 16 20+safe`), `max-w-72rem`,
vertical gradient to near-black. Panel grid `1fr auto auto`, gap 32:
brand (logo 40px + tagline 12.5px fg-muted, hidden < 1024) · nav (4 tiles
Accueil / Carte / Karaoké / Réserver: icon + Overused 600 13.9px, 44px, radius 11,
alternating fg 2 / 4 %) · socials (3 × 44px round, primary 35 % ring, primary
icon). Meta row (11.7px, fg-muted, `space-between`, top 20): address (maps,
new tab) + phone (`tel:`) with primary pin/phone icons · legal
"2026 Tchin Tchin. · BCE …" 11px + "Politique des cookies" link + "Gérer mes
cookies" button (re-opens the consent banner). Then centred: Evoview
visual-rights paragraph (11px), "Conçu et développé par Evoview…", Evoview logo
image 112px (unlinked, inverted).
Phone: brand + socials in one row, nav as a 4-column grid of icon-over-label
tiles (56px), meta stacked centred.

**States.** Nav hover: colour → primary (200ms) + 2px primary bar wipes in
from the left (420ms `(.16,1,.3,1)`); `aria-current` page: primary text + 10 %
primary tile. Socials hover: border primary + 10 % fill. Meta links hover → fg.
Focus: 2px primary outline. Reduced-motion branch kills transitions.

**Attribution gap:** the Evoview logo is an `<img>`, not a link; the credit
names Evoview but nothing leads to evoview.be (cf. STRATEGY reference note).

| Trait | Verdict |
| --- | --- |
| Panel (brand + tagline · nav tiles · socials) over a meta row (contact · legal) | **keep** → `ChapterFooter layout="panel"` |
| Nav as alternating tonal tiles, 44px | **keep** (founder rule: text lists on tonal surfaces) |
| Accent bar wiping in from the left on hover, current page marked | **keep**; label ink via `TextFill`, current page = tile step + full bar |
| Round 44px social targets | **keep**; hover fill via `OrbFill` (RULES §1) |
| Contact in `<address>` (maps, tel), cookie policy + cookie-settings action | **keep** → `footer.contact`, `footer.links` (`onSelect`) |
| Phone: brand + socials row, nav grid, meta centred | **keep** |
| Evoview credit centred at the end | **keep** as the one linked `EvoviewMark` (RULES §9) — fixes the unlinked logo |
| Lucide icons on nav, address, phone | **drop** (icons as decoration); social glyphs stay (they name the destination) |
| Background gradient | **drop** (tone, no gradient bands) |
| Evoview visual-rights paragraph | **drop** (Tchin contract clause, not a component trait) |
| Gold rings/text, Overused 600 | **map** → accent signal roles, Overused 700 label voice |
| Hover colour fades (nav, meta, socials) | **map** → `TextFill` / `OrbFill` liquid |
