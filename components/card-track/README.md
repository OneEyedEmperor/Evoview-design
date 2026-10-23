# card-track — media cards on a scroll-scrubbed track

The mechanism shared by Evoview's Services slider and Portfolio archive,
made neutral: a media card (`ribbon` or `portrait`) and its track. On
desktop the page's vertical scroll drives the track sideways under a sticky
stage; on phones the track is a native snap strip. Depends on `foundation`
and `controls`.

Showcase: `https://evoview-library.said.bet/layouts/card-track` (one studio,
the two variants: the portfolio as portrait cards on a dark chapter, services
as ribbon cards on a light one; live accent palette, FR / EN).

## What is Evoview (protected)

Read `STRATEGY.md`. The track is a client utility (browse services or work
one at a time) and a recognisable Evoview piece. Keep:

- **Scrub, not carousel arrows.** Desktop: sticky stage, vertical scroll →
  horizontal translate, lerped (.25 per 60 Hz frame, time-based), first card
  on the wide rail, track bleeding right, 2px progress hairline on the wide
  rail (the chapter's only line: it is information), optional `01 / 04`
  index. Phone changes the mechanism: native snap at 82vw, dots (18 vs 6)
  replace the hairline. Do not replace with arrow buttons, autoplay or a
  slider lib.
- **Media first.** Ribbon cards: media ~70 %, information ribbon below with
  the title (Overused 900, uppercase) and ≤ 3 clamped lines; ribbons are equal
  height across siblings. Portrait cards: full-bleed media, bottom scrim,
  identity bottom-left `01 / 05` → title → meta.
- **Square against round.** 16 (`--ev-radius-surface`) cards; the ribbon
  seam and the optional tab are square. Affordance label is glass on media.
- **One subject at a time** (portrait): the current card is undimmed (others
  .4 × .94 desktop, .5 × .97 phone), its title wipes in, it carries the
  accent bloom and is the only one whose video plays.
- **Graded media at rest, released on focus** (hover, keyboard focus,
  current card).
- **Indexed everything**: card index, `01 / 04` readout, spoken positions.

Client-adaptable: items, media, copy, accent, tone per chapter, variant,
ribbon colour, track length, card count.

**Accent = the client's**, read from the host `--primary` /
`--primary-foreground` (`--card-track-accent`, `-ink`, `-signal`, `-deep`
map the foundation tokens). It drives the progress fill, index, active dot,
focus ring, tab fill (with contrast ink) and the portrait bloom. Never a
background, card surface or body text.

**Attribution: none.** The track has no header / chassis strip, so it carries
no Evoview mark (`docs/RULES.md` §9). The approved linked mark lives in the
chassis of what `onOpen` opens (dossier) or the site footer; never put it on a
card or next to the affordance.

## Decisions vs the source

- Dropped (Evoview motifs): REC dot, HUD corner brackets, "no signal" idle
  screen, `EVV / CH` channel, pill shine, the flip-to-back "Opening" face
  (it is the Evoview services → dossier hand-off; here `onOpen` hands over to
  the host immediately).
- Typewriter name: the outer rail-left name is dropped (it duplicated the
  card title and competed with the one subject); the in-card stepped
  typewriter becomes a smooth clip-path wipe (same job — acknowledge focus —
  without the terminal flavour, and it survives two-line titles).
- Desktop mapping is rail-to-rail (progress 0: first card on the wide rail;
  1: last card ends on the rail's right edge) instead of the source's
  centre-to-centre mapping, so the first card sits on the rail at rest.
- Affordance label is `Toucher` / `Tap` when the primary pointer is coarse,
  `Voir` / `View` otherwise, keyboard-only included (source: `click` / `tap`).

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/card-track.config.tsx` | `buildCardTrackConfig(locale)`: copy FR / EN and the site's tracks (items, media). | **yes — the only one** |
| `src/CardTrack.tsx` | Track: mechanism, geometry, progress, dots, keyboard, pause model | no |
| `src/MediaCard.tsx` | Card (both variants), media gate, video, affordance, tap slop | no |
| `src/types.ts` | Types | no |
| `src/card-track.css` | Token block + `.ctr-*` / `.ctc-*` | no |

`showcase.css` is the library page's sheet; not installed.

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/card-track/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `controls` and `foundation` first, then copies `src/` to
`<client>/src/components/card-track/`; re-runs keep `card-track.config.tsx`.

## Host requirements

React 19, Vite, TypeScript strict; no other dependency. Browsers with CSS
subgrid, container query units, `:has()` and `overflow: clip` (all evergreen
since 2023). No ancestor of the track may be a scroll container
(`overflow: hidden/auto`), or the sticky stage stops sticking. The pinned
scene is centred with the space above it capped at the chapter's top rhythm
(never under 5em), so a fixed host header up to ~5em always clears it.

## API

```tsx
import { CardTrack, buildCardTrackConfig } from "@/components/card-track";

const config = buildCardTrackConfig(locale);
<CardTrack
  track={config.tracks.portfolio}
  copy={config.copy}
  tone="dark"                    // "dark" | "light" | "paper"; omit to inherit
  rhythm="cinematic"             // "standard" (default) | "compact" | "cinematic"
  heading={<MyChapterHeading />} // inside the sticky stage, above the hairline
  onOpen={(item, index) => openDossier(item.id)}
  length="260vh"                 // optional; default calc(100vh + n × 35vh)
/>
```

```ts
type CardTrackConfig = { locale: "fr" | "en"; copy: CardTrackCopy; tracks: Record<string, CardTrackDefinition> };
type CardTrackDefinition = {
  label: string;                         // carousel name
  variant: "ribbon" | "portrait";
  ribbon?: "light" | "dark";             // ribbon variant, default light
  showIndex?: boolean;                   // 01 / 04 at the hairline's end (ribbon; portrait cards carry their own)
  items: {
    id: string; title: string;
    body?: string;                       // ribbon, 3-line clamp
    meta?: string;                       // portrait, one line
    tab?: string;                        // ribbon, square tab
    media: { src: string; alt?: string; video?: string; playbackRate?: number; fit?: "cover" | "contain"; position?: string };
  }[];
};
type CardTrackCopy = { carousel; slide; instructions; position(current, total, title); open(title);
  affordance: { pointer; touch }; loading; failed; retry };
```

`MediaCard` is exported for a single card outside a track (same props the
track passes).

Media: poster `src` sized ~2× the card width (≈1100px ribbon, ≈860px
portrait), webp; loops muted, short, ≤ 300 KB, poster-matched first frame.
No `srcSet` (the media gate decodes `src`).

## Behaviour

| | Desktop ≥ 768 | Phone < 768 |
| --- | --- | --- |
| Mechanism | `scrub` when the track overflows; `static` row when it fits; `snap` when the stage is taller than the viewport | `snap`, centred, 82vw cards (portrait min(82vw, 350px)) |
| Card | ribbon `min(78vw, 40em)` × `clamp(340px, 50vh, 600px)`; portrait `min(clamp(20em, 31vw, 31.25em), 46vh)` at .90 | ribbon 82vw × same height; portrait .70 |
| Progress | hairline (+ index) — scrub and snap | dots only |
| Focus (portrait) | current card per scroll progress | card nearest the centre |
| Video | ribbon: hover preview on fine pointers only (resets on leave); portrait: current card | portrait: current card; ribbon: none |
| Affordance | `Voir` / `View` | `Toucher` / `Tap` (coarse pointer); tap vs swipe by a 6px slop |

Keyboard: one tab stop (the current card); ←/→ / Home / End move it (desktop
scrub scrolls the page to that card's position, snap scrolls the strip) and
focus follows; presses during that smooth scroll chain from its target.
Enter / Space open. Without `onOpen` the region itself is the tab stop. Live
region announces "2 sur 4 : Title".

Reveal: cards y 30 → 0 + fade, 600ms cinematic, 80ms stagger, once.

## Motion and pause model

One full-motion experience, no `prefers-reduced-motion` branch (architecture
skill). Every state is complete at rest: posters are the stable state, all
cards are reachable by scroll, swipe or keyboard. The scrub is driven by
scroll events only (no running loop); its geometry (sticky span, overflow)
is read on each frame it runs, never cached; it stops while a modal
suspends the page and re-syncs on resume. Videos play only when the track is on-screen,
the document is visible and no modal suspends the page
(`useInViewPause`), only on the allowed card, after a 160ms settle; they are
revealed only once frames play. Posters go through `useMediaReady`
(loading readout after 350ms, failure + retry).

## Verification

1. `pnpm build`. Showcase at 1440, 1024 and 390: no horizontal overflow,
   nothing below 9px (readouts) / 13px (body).
2. Desktop scrub: first card on the wide rail at progress 0, last card ends on
   the rail's right edge at 1; hairline and index follow; portrait focus moves.
3. Phone: snap centres each card, dots follow (no hairline), inactive
   portrait identities hidden.
4. Palette: default, indigo, yellow, off-white — fill, index, dot, tab, focus
   ring, bloom readable on light and dark chapters.
5. Keyboard: Tab lands on the current card, arrows / Home / End move (three
   quick presses move three cards), Enter calls `onOpen`.
6. Video: plays only on the current portrait card / hovered ribbon card;
   pauses when scrolled away or the tab is hidden.
7. A track whose cards fit the rail renders static (no hairline, no scrub);
   check it with the client's own card count at their widest breakpoint.
