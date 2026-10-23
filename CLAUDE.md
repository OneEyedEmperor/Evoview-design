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
New packages build on `foundation` (tokens, `--ev-scale`, pause-model hooks)
and `controls`; follow `docs/BUILD-BRIEF.md`.

| Component | Status | Skill |
| --- | --- | --- |
| `foundation` — tokens, scale, tones, type voices, pause-model hooks, attribution mark | 1.1.1 | `evoview-foundation` |
| `controls` — plate, ghost, glass close/pager, chips, rows, fields, switch, segmented control/progress (`/components/controls`) | 1.1.1 | `evoview-controls` |
| `chapter` — section shell, headings, tone cuts, footer with attribution (`/layouts/chapter`) | 1.1.0 | `evoview-chapter` |
| `card-track` — media card + scroll-scrubbed track (`/layouts/card-track`) | 1.2.0 | `evoview-card-track` |
| `process-sequence` — timed step board + step dossier (`/layouts/process-sequence`) | 1.1.1 | `evoview-process-sequence` |
| `story-blocks` — intro split, indexed sequence, proof collage, payoff (`/layouts/story-blocks`) | 2.0.1 | `evoview-story-blocks` |
| `dossier` — portal modal, selection board, chapter strip, mobile dock (`/components/dossier`) | 1.1.0 | `evoview-dossier` |
| `selector-stage` — selector ↔ stage, before/after, atlas (`/components/selector-stage`) | 1.1.1 | `evoview-selector-stage` |
| `navbar` — finder capsule, desktop + mobile, cover-card trays (`/navbar`) | 2.3.1 | `evoview-navbar` |
| `reservation` — Evoview booking application, client accent (`/components/reservation`) | 2.8.1 | `evoview-reservation` |

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
<!-- vibehub:knowledge:end -->
