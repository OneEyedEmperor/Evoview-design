# Evoview design library

Portable Evoview components for client websites, plus a Vite showcase that
renders each one so an agent can see the reference before adapting it.

## Purpose — read before packaging or adapting

Read `STRATEGY.md` for the business model and brand obligations. This is not
just a code-reuse library: its signature components are premium, useful client
experiences and long-lived Evoview publicity assets. Preserve both roles.

- Showcase URL: `https://evoview-library.said.bet` (vhdev-managed; `vhdev up`
  from this dir if it 502s, never `pnpm dev` directly).
- Source of the originals: `/root/.vibehub/projects/evoview` (the live site).
  Components here are *extracted and decoupled* versions; never copy from the
  site directly into a client.

## Layout

```
components/<name>/
  SKILL.md       agent procedure (symlinked into ~/.vibehub/skills/evoview-<name>)
  README.md      contract: files, host requirements, config, adaptation levers, verification
  CHANGELOG.md   per-version notes; breaking config changes go here
  VERSION
  install.sh     copies src/ into <client>/src/components/<name>/, preserves the config on re-run
  src/           portable source; `<name>.config.tsx` is the only per-site file
src/pages/       showcase pages, one per component, importing from ../../components/<name>/src
```

## Components

Binding design rules: `docs/RULES.md` (evidence: `docs/extraction/*`).
Showcase contract (routes, `ShowcasePage`, registry): `docs/SHOWCASE-CONTRACT.md`.
Packages with a modal: `docs/CRAWLABLE-MODALS.md` (binding: view URLs,
server-renderable copy, history), checked by `pnpm verify:ssr`.
New packages build on `foundation` (tokens, `--ev-scale`, pause-model hooks)
and `controls`; follow `docs/BUILD-BRIEF.md`.

| Component | Status | Skill |
| --- | --- | --- |
| `foundation` — tokens, scale, tones, type voices, pause-model hooks, attribution mark, step gauge, orb + text liquid fill, SSR + crawlable-modal routing | 1.6.1 | `evoview-foundation` |
| `controls` — plate, ghost, glass close/pager, chips, rows, fields, switch, segmented control/progress, view links (`/components/controls`) | 1.3.0 | `evoview-controls` |
| `chapter` — section shell, headings, tone cuts, footer with attribution (`/layouts/chapter`) | 1.1.0 | `evoview-chapter` |
| `card-track` — media card + scroll-scrubbed track (`/layouts/card-track`) | 1.2.1 | `evoview-card-track` |
| `process-sequence` — timed step board + step dossier, crawlable step views (`/layouts/process-sequence`) | 1.3.1 | `evoview-process-sequence` |
| `story-blocks` — intro split, indexed sequence, proof collage, payoff (`/layouts/story-blocks`) | 2.2.0 | `evoview-story-blocks` |
| `dossier` — portal modal, selection board, chapter strip, mobile dock (`/components/dossier`) | 1.3.0 | `evoview-dossier` |
| `selector-stage` — selector ↔ stage, before/after, atlas (`/components/selector-stage`) | 1.4.0 | `evoview-selector-stage` |
| `navbar` — finder capsule, desktop + mobile, cover-card trays (`/navbar`) | 2.7.0 | `evoview-navbar` |
| `reservation` — Evoview booking application + short paper flow, client accent (`/components/reservation`) | 2.10.0 | `evoview-reservation` |

## Rules for changing a component here

1. Edit `components/<name>/src`, run `pnpm build`, verify in the showcase at
   1440 and 390 wide.
2. Bump `VERSION`, add a `CHANGELOG.md` entry (list config changes explicitly).
3. Clients upgrade by re-running `install.sh`; it never touches their config.

## Adding a component

Copy the `navbar` folder shape. Decouple all site data behind a single
`<name>.config.tsx`, scope CSS under one root class with a `--<name>-*` token
block that maps host tokens with fallbacks, write the SKILL/README pair, add
a showcase page, symlink the skill:
`ln -sfn $PWD/components/<name>/SKILL.md ~/.vibehub/skills/evoview-<name>/SKILL.md`.

Each package's README and SKILL must carry the relevant strategy requirements
into client handoffs: what makes the component recognizably Evoview, which
client-facing values are adaptable, and how its approved Evoview attribution
and destination work. Do not leave this context only in the library repo.

<!-- vibehub:knowledge:start -->
## Project knowledge

Facts learned about this codebase, maintained by Vibehub. Everything from this heading to the end of the list below is regenerated on every write: add to it with POST /api/memory (destination=project), never by editing here, because a hand edit inside it is refused as drift. Prose elsewhere in this file is hand-written and yours to edit.

- docs/RULES.md is binding for every package (evidence in docs/extraction/*); the evoview site's EVOVIEW-VISUAL-GRAMMAR.md is outdated — authority is rendered site (measured) > working-tree source > grammar doc. <!--vh:b3d83440-->
- Concurrent agent edits make the vhdev showcase full-reload/remount pages (fake blank views, stuck reveals); confirm intermittent bugs on a production preview (pnpm build && pnpm preview on a spare port, stop only that PID). <!--vh:a8750c48-->
- Showcase navbar: home (`/`) runs one-page with `sectionPill` via HOME_SECTIONS (ids `library-top` on <main>, `layouts`, `components`, `navbar` in Home.tsx — renaming them breaks the pill); library.css intentionally pins the menu eye to the page accent, not the live dot. <!--vh:72f01e84-->
- Showcase specimen switches (Félix's bar): every option must visibly change the layout in every combination with the other switches — a state that only nudges size/padding (e.g. chapter rhythm) is cut; keep demo content true to the section's role (no CTA in the presentation/intro specimen). <!--vh:5e8b1ce7-->
- Showcase hero (`LibraryHero`) opens every library page and its lockup must sit at the exact coordinates it has on `/` across page changes (non-index pages keep invisible bars + palette slots; `.lib-hero__palette` min-height 42px = compact capsule height); the accent palette lives only in the hero (no header palette, no breadcrumb); LIBRARY takes the accent on `/` only, white elsewhere; the eye iris follows the accent everywhere. <!--vh:570793a5-->
<!-- vibehub:knowledge:end -->
