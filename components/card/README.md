# card — Evoview media cards

The library's card compositions, one `MediaCard` anatomy (`ribbon` or
`portrait`) and three ways to present it. Depends on `foundation` and
`controls`. (Renamed from `card-track` in 2.0.0.)

| Component | Job | Source |
| --- | --- | --- |
| `CardTrack` | Browse services or work one card at a time: desktop scroll-scrubbed track under a sticky stage, phone snap strip | Evoview Services slider + Portfolio archive |
| `CardDeck` | A catalogue by category: category switch over a dealt hand of 3 or 6 cards | Tchin Tchin home menu ("Un Voyage Culinaire") |
| `CardSequence` | Moving pictures shown in turn: timed focus over video cards, one loop playing, hover/keyboard hold | Tchin Tchin karaoke board + "Vivez l'Expérience" |

Showcase: `https://evoview-library.said.bet/layouts/card` (one studio,
Atelier Sorel: portfolio track, services track, deck, sequence; live accent
palette, FR / EN).

**Watermark rule (package-wide).** Only `CardSequence` carries the Evoview
wordmark as a decorative watermark (unlinked, `aria-hidden`, ≤ .12, on by
default, `watermark: false` removes it): its few large video cards are the
inventoried source placement (`STRATEGY.md`). `CardTrack` and `CardDeck`
cards carry none — a mark repeated across a grid of peers is noise. No
card links to Evoview; the approved linked mark lives in a chassis strip or
the site footer (`chapter`'s `ChapterFooter`).

## CardTrack — what is Evoview (protected)

Read `STRATEGY.md`. The track is a client utility (browse services or work
one at a time) and a recognisable Evoview piece. Keep:

- **Scrub, not carousel arrows.** Desktop: the stage pins with its content
  centred in the viewport, vertical scroll → horizontal translate, lerped
  (.25 per 60 Hz frame, time-based), first card on the wide rail, track
  bleeding right, 2px progress hairline on the wide rail **under the card
  row** (the chapter's only line: it is information; above the cards, under
  a heading, it would read as an underline). Phone changes the mechanism:
  native snap at 82vw, dots (18 vs 6) under the strip replace the hairline.
  Do not replace with arrow buttons, autoplay or a slider lib.
- **Media first.** Ribbon cards: media ~70 %, information ribbon below with
  the title (Overused 900, uppercase) and ≤ 3 clamped lines; ribbons are equal
  height across siblings. Portrait cards: full-bleed media, bottom scrim,
  identity bottom-left: (affordance) → title → meta.
- **Square against round.** 16 (`--ev-radius-surface`) cards; the ribbon
  seam and the optional tab are square. Affordance label is glass on media.
- **One subject at a time** (portrait): the current card is undimmed (others
  .4 × .94 desktop, .5 × .97 phone), its title wipes in, it carries the
  accent bloom and is the only one whose video plays.
- **Graded media at rest, released on focus** (hover, keyboard focus,
  current card).
- **Positions are spoken, never counted on screen** (RULES §1): the hairline
  and the dots show where the reader is; "2 sur 5 : Title" is announced. No
  `01 / 04` readout on the rail or the cards (`showIndex` is ignored).

Client-adaptable: items, media, copy, accent, tone per chapter, variant,
ribbon colour, track length, card count.

**Accent = the client's**, read from the host `--primary` /
`--primary-foreground` (`--card-track-accent`, `-ink`, `-signal`, `-deep`
map the foundation tokens). It drives the progress fill, active dot,
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
| `src/card.config.tsx` | `buildCardTrackConfig(locale)`: copy FR / EN and the site's tracks (items, media). | **yes — the only one** |
| `src/CardTrack.tsx` | Track: mechanism, geometry, progress, dots, keyboard, pause model | no |
| `src/MediaCard.tsx` | Card (both variants), media gate, video, affordance, tap slop | no |
| `src/types.ts` | Types | no |
| `src/card-track.css` | Token block + `.ctr-*` / `.ctc-*` | no |
| `src/CardDeck.tsx` | Deck: category switch, deal choreography, strip, `more` link | no |
| `src/card-deck.css` | `.ev-card-deck` token block + `.cdk-*` (places `MediaCard`) | no |
| `src/CardSequence.tsx` | Sequence: timed focus, hold, channel switch, board / gallery | no |
| `src/card-sequence.css` | `.ev-card-sequence` token block + `.csq-*` | no |
| `src/strip.ts` | Snap strips (track phone mode, deck below 1024): the centred card | no |

`showcase.css` is the library page's sheet; not installed.

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/card/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `controls` and `foundation` first, then copies `src/` to
`<client>/src/components/card/`; re-runs keep `card.config.tsx`.

## Host requirements

React 19, Vite, TypeScript strict; no other dependency. Browsers with CSS
subgrid, container query units, `:has()` and `overflow: clip` (all evergreen
since 2023). No ancestor of the track may be a scroll container
(`overflow: hidden/auto`), or the sticky stage stops sticking. The pinned
stage keeps its content height and its chapter rhythm and pins with that
content centred in the viewport, never closer than 5em to the top, so a
fixed host header up to ~5em always clears it. The cut to the next chapter
is the stage's own bottom rhythm, never spare viewport.

## API

```tsx
import { CardTrack, buildCardTrackConfig } from "@/components/card";

const config = buildCardTrackConfig(locale);
<CardTrack
  track={config.tracks.portfolio}
  copy={config.copy}
  tone="dark"                    // "dark" | "light" | "paper"; omit to inherit
  rhythm="cinematic"             // "standard" (default) | "compact" | "cinematic"
  heading={<MyChapterHeading />} // inside the sticky stage, above the cards
  cardHeadingLevel={3}           // card titles; one below the chapter heading (default 3)
  onOpen={(item, index) => openDossier(item.id)}
  length="260vh"                 // optional wrapper height; default the stage's height + n × 35vh of scrub
/>
```

```ts
type CardTrackConfig = { locale: "fr" | "en"; copy: CardTrackCopy; tracks: Record<string, CardTrackDefinition> };
type CardTrackDefinition = {
  label: string;                         // carousel name
  variant: "ribbon" | "portrait";
  ribbon?: "light" | "dark";             // ribbon variant, default light
  showIndex?: boolean;                   // deprecated, ignored (RULES §1: no counting readouts)
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
track passes; `headingLevel` sets its title level, default 3). Its accent
comes from `--ctc-accent / -ink / -signal / -deep` on `.ctc`: the track's or
the deck's tokens inside them, foundation's `--ev-accent*` elsewhere.

Media: a still `src` sized ~2× the card width (≈1100px ribbon, ≈860px
portrait), webp. A card with a loop: muted, short, ≤ 300 KB, and its `src`
is **the loop's first frame at the loop's own size and ratio** (cards crop
both with the same `object-fit: cover`, so a poster cut to another ratio or
taken from another still jumps when the loop starts). A paused loop rewinds
to that frame. No `srcSet` (the media gate decodes `src`).

## Behaviour

| | Desktop ≥ 768 | Phone < 768 |
| --- | --- | --- |
| Mechanism | `scrub` when the track overflows; `static` row when it fits; `snap` when the stage is taller than the viewport | `snap`, centred, 82vw cards (portrait min(82vw, 350px)) |
| Card | ribbon `min(78vw, 40em)` × `clamp(340px, 50vh, 600px)`; portrait `min(clamp(20em, 31vw, 31.25em), 46vh)` at .90 | ribbon 82vw × same height; portrait .70 |
| Progress | hairline — scrub and snap | dots only |
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
scroll events only (no running loop) and writes transforms only, skipping
unchanged frames; its geometry (scrub span, overflow, pin offset, page
offset) is read on mount and on every resize of the track, its stage or the
page body, never inside a frame; it stops while a modal suspends the page
and re-syncs on resume. Videos play only when the track is on-screen,
the document is visible and no modal suspends the page
(`useInViewPause`), only on the allowed card, after a 160ms settle; they are
revealed only once frames play and rewind when paused. Posters go through
`useMediaReady` (loading readout after 350ms, failure + retry). The
portrait bloom stays a `box-shadow` transition on the frame: a separately
faded bloom layer measured fewer paints but more dropped frames on the
scrub.

## Verification

1. `pnpm build`. Showcase at 1440, 1024 and 390: no horizontal overflow,
   nothing below 9px (readouts) / 13px (body).
2. Desktop scrub: the pinned content sits centred in the viewport; first card
   on the wide rail at progress 0, last card ends on the rail's right edge at
   1; the hairline follows; portrait focus moves; under the rail only the
   chapter's bottom rhythm before the next chapter. No counter anywhere.
3. Phone: snap centres each card, dots follow (no hairline), inactive
   portrait identities hidden.
4. Palette: default, indigo, yellow, off-white — fill, dot, tab, focus
   ring, bloom readable on light and dark chapters.
5. Keyboard: Tab lands on the current card, arrows / Home / End move (three
   quick presses move three cards), Enter calls `onOpen`.
6. Video: plays only on the current portrait card / hovered ribbon card;
   pauses when scrolled away or the tab is hidden; starting a loop never
   jumps (poster = first frame).
7. A track whose cards fit the rail renders static (no hairline, no scrub);
   check it with the client's own card count at their widest breakpoint.

## CardDeck

A catalogue sorted into categories (a menu, collections, work), dealt as a
hand of cards: a curated selection first, each category on a switch.
Extracted from the Tchin Tchin home menu ("Un Voyage Culinaire",
evidence `docs/extraction/tchin-card-deck.md`). Showcase: the `CardDeck`
scene on `/layouts/card` (Atelier Sorel, card anatomy and rows on the desk).

### What is Evoview (protected)

- **The deck deal** (desktop ≥ 1024, founder-approved): centre column
  first, side cards slide diagonally from under the opposite row's centre
  card (one row: from under the centre card), top centre on top, bottom
  centre under it. Initial deal: centre 950ms, sides 1200ms, delays
  580 / 0 / 580 · 400 / 180 / 400, ease `(.16,1,.3,1)`.
- **The switch sequence, zero dead time:** undeal 600ms (`(.7,0,.84,0)`,
  opacity held to 65 %, bottom row 110 / 270 / 110 later) → the top centre
  card turns edge-on (300ms) → content swaps → it turns back as the new
  category's card (450ms) while the others re-deal (950ms, 650 / 0 / 650 ·
  510 / 430 / 510). Any click reverses cards from the frame they are on
  (back to the shown category: mirror; a third category: retargets the
  flip). The new hand mounts in the same task that ends the flip-out, so
  the flip-in starts on the next frame. Change timings in small steps only;
  the founder tunes them.
- **One hand:** 3 or 6 peer cards (no counting readout), the rest behind
  `more`. Media decoded before the flip (posters preloaded on idle once the
  deck is near), so no card turns over blank.
- `MediaCard` anatomy, graded media released on hover / focus, accent bloom
  on the pointed card, square-against-round, three voices.

Client-adaptable: categories, items, media, copy, `more` destination,
accent, tone, `variant` (`portrait` when the image is the argument, `ribbon`
when each card needs a sentence), `rows` (1 or 2).

**Attribution: none.** The deck has no chassis strip; the approved mark
lives in the site footer. Do not put marks on the cards (the Tchin source
repeated a watermark on every card; dropped).

### API

```tsx
import { CardDeck, buildCardDeckConfig } from "@/components/card";

const { deck, copy } = buildCardDeckConfig(locale);
<CardDeck
  deck={deck} copy={copy}
  variant="portrait"            // "portrait" (default) | "ribbon"
  ribbon="light"                // ribbon colour
  rows={2}                      // 2 (six cards, default) | 1 (three)
  tone="dark" rhythm="standard" // chapter paint and padding
  heading={<MyChapterHeading />}
  cardHeadingLevel={3}          // card titles; one below the chapter heading (default 3)
  onOpen={(item, category) => openDetail(item.id)}  // omit: cards are not buttons
  onMore={(e) => …}             // optional; the link follows deck.more.href by default
/>
```

```ts
type CardDeckConfig = { locale; copy: CardDeckCopy; deck: CardDeckDefinition };
type CardDeckDefinition = {
  label: string;                  // panel name
  switchLabel: string;            // category switch name
  categories: { id; label; items: CardTrackItem[] }[];  // first = opening selection
  more?: { label: string; href: string };               // full catalogue
};
type CardDeckCopy = CardTrackCopy & { showing(category, count): string };
```

Items are `CardTrackItem`: `portrait` shows `title` + `meta` (one line),
`ribbon` shows `title` + `body` (3 lines). Labels: one or two short words,
four categories fit a 390 phone. Each category should fill the hand (3 or
6 items). Stills ~860px wide webp; optional short muted loops with their
first frame as poster (as `CardTrack`).

### Behaviour

| | Desktop ≥ 1024 | Below 1024 |
| --- | --- | --- |
| Layout | grid of 3 columns, max 80em, 3:4 portrait / 4:3 media + ribbon | snap strip (phone `min(82vw, 350px)` centred, tablet `min(42vw, 22em)`), dots |
| Entry | deck deal, once, when 15 % is on screen | staggered rise (y 3em, 950ms, 140ms stagger) |
| Switch | undeal → flip → re-deal | swap + rise, strip back to the start |
| Video | hover preview on fine pointers | none (posters) |
| Affordance | on hover / focus | always (touch) |

Keyboard: the switch is a radiogroup (arrows / Home / End select and deal);
Tab reaches each card (`onOpen`), focus ring in the accent; the switch
announces "Category: n projects" politely.

### Motion and pause model

No reduced-motion branch. Server HTML and a deck that never reaches the
viewport show every card at rest (cards are hidden only on the client until
the deal starts). The deal starts only while the deck is on screen and the
document visible; videos play only on the hovered card while on screen,
visible and not suspended (`useInViewPause`), and rewind on leave. Deal,
undeal and flips are Web Animations on transform and opacity only; the
pointed card's bloom is a fading layer. Leaving the desktop breakpoint
mid-sequence settles at rest on the selected category.

### Verification

1. 1440 / 1024: deal order and diagonal entry; a switch runs ≈ 2.8s with no
   idle frame; rapid clicks (back, third category, during flip-in) always
   settle at rest on the selected category.
2. 390: strip with every dealt card, dots follow, four labels fit.
3. Every `variant` × `rows` combination; palette yellow / near-white / indigo
   (switch thumb, focus ring, dots, bloom).
4. Keyboard: arrows on the switch, Tab to a card, Enter calls `onOpen`.

## CardSequence

Video cards under a timed focus: one card holds the focus for a dwell,
plays its loop and hands over; the others recede. Extracted from the Tchin
Tchin karaoke clip board (home) and "Vivez l'Expérience" gallery (karaoke
page), evidence `docs/extraction/tchin-card-sequence.md`. Showcase: the
`CardSequence` scene on `/layouts/card` (Atelier Sorel; Placement and Tone
switches).

### What is Evoview (protected)

- **The timed focus**: 2,000 ms dwell per card (approved), wraps, one card
  plays, the others recede (black veil .46 at rest, .79 while the sequence
  runs on dark, .64 on light and paper so each picture still reads, 0 on
  the focused card, 700ms). Only enabled time counts
  (`useSequenceClock`); the remaining dwell is carried across every pause.
- **The hold**: a mouse (≥ 768) or keyboard focus takes the focus and holds
  the clock; moving to a neighbour hands over without resuming (release
  after 140ms, RULES §6); leaving returns to the sequence's own card with
  its remaining dwell. Window blur releases.
- **Tune-in**: each time a card goes live it changes by foundation
  `ChannelSwitch` (poster folds to a line, opens on the decoded loop with
  the sideways shudder and signal lines). No other signal effect.
- **State as frame**: focused card = accent edge (1px) + bloom (deep accent
  on dark; on light and paper a softer accent halo over a neutral ground
  shadow every well carries), title lifts 2px, the arrow orb fills with the
  accent as liquid (`OrbFill`), the 2px dwell line at the card's foot fills
  with the clock (`sequenceFillStyle`), freezes with it, and wipes full
  while a card is held (the scene's one line). Edge and bloom are layers
  that fade (opacity only); the bloom's blur exists only while it shows.
- Pointer tilt on mouse (±10° / ±12°, 1200px perspective, white glare),
  reveal rise y 32 + fade, 600ms cinematic, 80ms stagger (cards → facts →
  offer), three voices, surface radius on the wells.

Client-adaptable: clips (poster, loop, title, meta, destination), `ratio`
from the footage, `dwellMs` (default and recommendation 2000), facts,
offer and action, `layout`, `tone`, accent, `watermark`.

**Accent = the client's** (`--card-sequence-accent`, `-ink`, `-signal`,
`-deep`, `-well-signal` for lines on the dark wells): focus edge, bloom,
orb fill, dwell line, the title's accent word or the price (one accent
display word per scene: set `accent` on gallery titles, leave it off when an
offer shows the price). Never a card surface or body text.

**Attribution: decorative only.** No linked mark (the section has no
chassis strip; the approved link is in the site footer). Each card carries
the Evoview wordmark as an unlinked watermark, centred, `aria-hidden`,
opacity .12, no filter (`watermark: false` removes it; that is the
founder's call). Card links go to the client's own destinations (pages,
the client's profile with `external`), never to an Evoview referral.

### API

```tsx
import { CardSequence, buildCardSequenceConfig } from "@/components/card";

const { sequences, copy } = buildCardSequenceConfig(locale);
<CardSequence
  sequence={sequences.page} copy={copy}
  layout="gallery"            // "gallery" (default): all clips in one row | "board": clips + facts + offer
  tone="dark"                 // "dark" (default) | "light" | "paper"; cards stay dark wells
  headingLevel={2}            // section title; fact tiles take the next level (3 → facts h4)
  onOpen={(clip, e) => …}     // optional; e.preventDefault() keeps the page
/>
```

```ts
type CardSequenceConfig = { locale; copy: CardSequenceCopy; sequences: Record<string, CardSequenceDefinition> };
type CardSequenceDefinition = {
  title: string; accent?: string;       // a word of the title set in the accent
  lead?: string;
  clips: { id; title; meta?; poster; video?; position?; href?; external? }[];
  facts?: { title; body }[];            // board: tonal tiles beside the clips (3; phones keep 2)
  offer?: { value; unit?; note?; action?: { label; href } };  // board: price row + PrimaryPlate
  dwellMs?: number;                     // 2000
  ratio?: string;                       // "9 / 16" (phone footage); demo "2 / 3"
  watermark?: boolean;                  // true
};
type CardSequenceCopy = { newTab; loading; failed; retry };
```

Media: poster = the loop's first frame at the loop's own size and ratio,
webp; loops muted, short, seamless, ≤ ~300 KB at the card's size. The
loop's source attaches the first time its card goes live and stays
attached (no reload or decode when the focus comes back).

### Behaviour

| | Desktop ≥ 1024 | 768–1023 | Phone < 768 |
| --- | --- | --- | --- |
| Gallery | one row of n cards on the wide rail | 2 columns | 2 columns, orb hidden < 600 |
| Board | clips 1.55 : facts 1, offer 1.2 : .8 | clips 1.4 : facts 1 | clips 2-up, facts stacked (first 2), offer stacked, plate full width |
| Heading | title .72 : lead 1.28 | same | stacked |
| Hold | mouse + keyboard focus | mouse + keyboard focus | none (touch follows the link); sequence runs |
| Tilt | mouse | mouse | none |

Keyboard: every card with a destination is a link (name = title + meta,
"(nouvel onglet)" when external); focus-visible holds it like hover, Tab
to the next card hands over, leaving the board resumes.

### Motion and pause model

No reduced-motion branch. Stable state: every poster visible, every card
reachable and linked; server HTML renders the cards without media. The
clock and the loops run only while the board is on screen, the document
visible and no modal suspends the page (`useInViewPause`); the clock also
stops while a card is held. Posters load from 400px before the viewport
through `useMediaReady` (loading readout after 350ms, failure + retry); the
loop is revealed only once frames play.

### Verification

1. 1440 / 1024 / 390: both layouts × both tones; no horizontal overflow,
   meta ≥ 13px, labels ≥ 11px.
2. Sequence: focus moves every 2s, exactly one loop plays; scroll away or
   hide the tab → no advance, resumes with the remainder.
3. Hover a card past the dwell: held; slide to its neighbour across the gap:
   still held; leave: back to the sequence's card ~140ms later, which
   advances after its remaining dwell. Same with Tab.
4. Palette yellow / near-white / indigo on dark and paper: focus edge,
   dwell line, orb fill, accent word / price readable.
5. Card links: client destinations only; watermark unlinked, `aria-hidden`.
