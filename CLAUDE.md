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
  VERSION        the only version number
  evoview.json   requires (semver ranges), clientOwned paths, hostDeps (docs/SYNC.md)
  install.sh     thin wrapper: sync.sh apply <client> <name> --if-clean
  src/           portable source; client-owned: `<name>.config.tsx` (site data) and
                 `<name>.theme.css` (adaptable tokens, commented defaults, imported last by index.ts)
src/pages/       showcase pages, one per component, importing from ../../components/<name>/src
sync.sh          plan | apply | verify into a client (docs/SYNC.md; tests: node scripts/sync-test.mjs)
```

## Components

Binding design rules: `docs/RULES.md` (evidence: `docs/extraction/*`).
Ownership (Signature preserve / Variations select / Expression adapt): RULES §13.
Showcase contract (routes, `ShowcasePage`, registry): `docs/SHOWCASE-CONTRACT.md`.
Packages with a modal: `docs/CRAWLABLE-MODALS.md` (binding: view URLs,
server-renderable copy, history), checked by `pnpm verify:ssr`.
New packages build on `foundation` (tokens, `--ev-scale`, pause-model hooks)
and `controls`; follow `docs/BUILD-BRIEF.md`.
Reusable animations (engine / binding / shells, performance rules, the
liquid fill as reference): `animations/SKILL.md` (skill
`evoview-reusable-animation`).

| Component | Status | Skill |
| --- | --- | --- |
| `foundation` — tokens, scale, tones, type voices, pause-model hooks, attribution mark, step gauge, orb + text liquid fill, channel switch (hover-preview screens, RULES §6), press jelly (pills / buttons, RULES §6), shared page scroll lock, media gate (probe or mounted player), SSR + crawlable-modal routing | 1.11.2 | `evoview-foundation` |
| `controls` — plate, ghost, glass close/pager, chips, rows, fields, switch, segmented control/progress, view links (`/components/controls`) | 1.6.0 | `evoview-controls` |
| `chapter` — section shell, headings, tone cuts; story, FAQ and contact chapters; footer bar / panel with attribution (`/layouts/chapter`) | 1.5.0 | `evoview-chapter` |
| `card` — media card in three compositions: scroll-scrubbed track, dealt category deck, timed video sequence (`/layouts/card`; was `card-track`) | 2.3.0 | `evoview-card` |
| `process-sequence` — timed step board + step dossier, crawlable step views (`/layouts/process-sequence`) | 1.7.0 | `evoview-process-sequence` |
| `story-blocks` — intro split, indexed sequence, proof collage, payoff (`/layouts/story-blocks`) | 2.5.0 | `evoview-story-blocks` |
| `dossier` — portal modal, selection board, chapter strip, mobile dock, crawlable views; panorama / sheet compositions, optional opening screen, live entry counts, rows with media (`/components/dossier`) | 1.9.1 | `evoview-dossier` |
| `selector-stage` — selector ↔ stage, before/after, atlas (`/components/selector-stage`) | 1.6.0 | `evoview-selector-stage` |
| `navbar` — finder capsule, desktop + mobile, cover-card trays (`/navbar`) | 2.10.2 | `evoview-navbar` |
| `reservation` — Evoview booking application + short paper flow, client accent (`/components/reservation`) | 2.12.0 | `evoview-reservation` |

## Rules for changing a component here

1. Edit `components/<name>/src`, run `pnpm build`, verify in the showcase at
   1440 and 390 wide.
2. Bump `VERSION`, add a `CHANGELOG.md` entry (list config changes and
   "Requires" explicitly), update `evoview.json` `requires` when the package
   needs a newer foundation / controls. Breaking config or API = major bump
   (`foundation` / `controls`: additive within a major). Commit: clients
   install from git, never from the working tree.
3. Clients upgrade with `sync.sh plan → apply → verify` (`install.sh` applies
   clean plans only); client-owned files are never written, local patches are
   merged and recorded (`docs/SYNC.md`).
4. What moves between the library and its sites, in both directions, is
   triaged and recorded per `downstream/SKILL.md` (`lineage.json`,
   `downstream/<site>.json`, `node scripts/triage.mjs <site>`).

## Adding a component

Copy the `navbar` folder shape. Decouple all site data behind a single
`<name>.config.tsx`, scope CSS under one root class with a `--<name>-*` token
block that maps host tokens with fallbacks, list the adaptable tokens in
`src/<name>.theme.css` (commented, imported by `index.ts` after the package
CSS), write `evoview.json` and an `install.sh` wrapper, the SKILL/README pair,
add a showcase page, symlink the skill:
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
- Showcase specimen switches (the emperor's bar): every option must visibly change the layout in every combination; size/padding-only states (e.g. chapter rhythm) are cut; demo content true to the section's role; scene desks (`scene/Scene.tsx`) show pills + labels only, no explanatory sentence. The emperor rejected a tsc guard tying desk labels to package variation types: desks keep their own label records. <!--vh:5e8b1ce7-->
- Showcase hero (`LibraryHero`) opens every library page with the index's stage geometry (on showcase pages the lockup is rendered invisible, `data-ghost`, and the stage sits 30px lower than on `/`, emperor-tuned, moving reel + deck together); the EVOVIEW LIBRARY lockup is visible on `/` only (the emperor preferred showcase pages without it). Accent palette: in the hero on `/` only, on showcase pages only the bottom-right `FloatingPalette`; LIBRARY takes the accent on `/`; the eye iris follows the accent everywhere. <!--vh:570793a5-->
- Showcase page navigation (`.lib-deck`: one shell = player + page list, one glass pill on the seam) lives in the hero as its `deck` prop, pulled by `useDeckPull` to 44px (phones) / 56px (≥768) above the hidden lockup row (emperor-tuned); PageCurtain covers from the deck's top. Player media (src/library/art.tsx): boomerang loops (art/<id>-720|1280.mp4 + poster; bump VIDEO_REV on replace; EntryVideo keyed by id), else photos/glyphs, under one flat dark veil (no complex filters). Row hover previews via ChannelSwitch. <!--vh:b7834828-->
- `pnpm verify:ssr` only covers modal packages (dossier, process-sequence) — `verify:ssr chapter` checks nothing; for chapter changes run `pnpm verify:chapter` (venue clock + FAQ/contact/footer server HTML). <!--vh:452538cf-->
- Install/upgrade packages in clients only with `./sync.sh plan → apply → verify <client> [pkg]` (docs/SYNC.md; install.sh is a wrapper). It installs from git HEAD, never the working tree: commit library changes before syncing. Client-owned: <name>.config.tsx, <name>.theme.css (+ navbar brand/, selector-stage media/); local edits become recorded patches. <!--vh:07136b1a-->
- agent-browser hides scrollbars by default (gap = 0), so scroll-lock gap compensation and fixed-chrome shift can't be verified there; check them in an own headless Chrome with classic 15px scrollbars on a production preview. <!--vh:82ccfc0b-->
- The Evoview owner (the user here) is addressed and referred to as "the emperor" in this project; "founder" in older docs and records means him. Félix is not involved in Evoview projects. <!--vh:705a4f25-->
- Dossier `tileMedia: "true-colour"` means no filter at rest or in any state, but the board's one-time Signature entrance (tiles converge with filter: blur 5px → 0) stays in both modes: the emperor's decision, 2026-10-29. <!--vh:1896e5fc-->
<!-- vibehub:knowledge:end -->
