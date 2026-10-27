# Tchin — home contact section (extraction)

Source: `test` `src/components/sections/ContactSection.tsx` + `.css`,
`src/data/restaurant-info.ts`, `src/i18n/*` `contact`, `.spec-strip*` in
`src/index.css`. Live `https://resto-tchin.said.bet/#contact`, measured
2026-10-27 at 1440 and 390 (shots: `~/.vibehub/documents/evoview-library/tchin/contact-source-*.png`).
No map is rendered (a `googleMapsEmbed` URL and map-consent copy exist in data/i18n, unused).

## Structure

1. Head, centred: comic logo (h 208 desktop / 160 phone), h2 "Visitez Tchin
   Tchin", line "Faites votre réservation", gold `Button` → `/reservation`.
2. Grid (desktop ≥ 640): contact rows `1fr` | hours `1.1fr` (508 : 559 px at
   1440, gap 26), both columns stretched to one height.
   - Rows: address (text), phone `tel:`, e-mail `mailto:`, WhatsApp (value
     "Écrivez-nous en 1 clic" + ↗), Instagram handle + ↗. Each a tile: gold
     ring icon Ø40, label 12px Inter +.14em uppercase fg/45, value Overused
     600 17.6px; padding 18 / 13, radius 11, 5px gap, alternating fg 2 % / 4 %.
   - Hours: h3 (clock icon + label, centred) → **today card** (Brussels
     weekday, lunch | dinner in two columns, Overused 600 ~22px, gold 1.4px
     border + gold 7 % on #090909, radius 16, h 142) → `<details>` "Toute la
     semaine" (52px summary, chevron) → three comic artworks filling the rest
     → "Heure de Bruxelles" note (11px).
3. Phone (< 640): one column, `zoom: .85`; hours block becomes the second
   row, right after the address; rows lose the timezone note.

## States and motion

- Today: resolved after mount via `useSyncExternalStore` (server snapshot
  `null`, so prerender never mismatches); weekday in `Europe/Brussels`.
  Closed day → "Fermé / On se retrouve bientôt". Today row in the week table:
  gold 10 % wash + gold ink + sr-only "— Aujourd'hui".
- Week opened: table (Jour / Midi / Soir, alternating rows, radius 12) inside
  the summary panel; the art fades out (opacity 280 ms, translate 8 + scale
  .94 350 ms). Chevron rotates 200 ms.
- Reveal: `k-reveal` y 18 + blur 4 + fade, 620 ms `cubic-bezier(.16,1,.3,1)`,
  delays head 0, rows 100 + 60·i, hours 240; once, IntersectionObserver .1.
- Links: hover colour cut to gold (200 ms), focus 2px gold outline.

## Source bugs (flagged, not copied)

- Desktop week table scrolls **inside** a fixed-height clipped panel: ~2.5
  of 7 rows visible, nested scroll, sticky summary. The hours column height
  is forced by a duplicate, `visibility:hidden` `<dl>` of the whole week.
- Address is not a link (no route to a map); WhatsApp value is a slogan,
  not what the visitor reaches.
- "Today" shows the day but not whether the place is open now.
- Booking CTA is 121 × 44 px, smaller than the rows it heads.
- Reveal settles a `filter` animation (blur) on every row.

## Keep / map / drop

| Trait | Verdict |
| --- | --- |
| Head: title + one line + one booking action, then practical info | **keep** (one primary action) |
| Rows as tonal tiles, alternating, no borders | **keep** → `--ev-surface-list` / `-alt`, radius surface |
| Label + value anatomy | **map** → label = state voice (Satoshi 700 +.14em, ≥ 11px), value = Montserrat 600 |
| Today computed live in the business time zone, after hydration | **keep**, extend with open-now status (minute tick under the pause model) |
| Week collapsed in `<details>`, in the DOM, today row marked (not colour only) | **keep**; expands in flow (no nested scroll) |
| Picture yields its space when the week opens | **keep** (one continuous sequence), with the client's photo |
| Phone order: address → hours → other channels | **keep** |
| Rows 1 : hours 1.1, stretched | **map** → asymmetric .44 / .56 |
| Gold button | **map** → `PrimaryPlate` (`href` from config), no Evoview mark beside it |
| Gold border/tint today card | **map** → `--ev-surface` card, accent only as the status dot / today marker |
| Hover colour cut on links, ↗ on external | **map** → `TextFill` liquid; ↗ kept (means "leaves the site") |
| Ring icons per row, clock icon, comic logo + comic art | **drop** (icons-as-decoration, Tchin artwork) |
| `stage-gradient` blobs, blur reveal | **drop** (RULES §8, reveal = y + fade) |
| `zoom: .85` on phones | **drop** (foundation scale) |
| Timezone note | **keep** as config text, shown only when set |
