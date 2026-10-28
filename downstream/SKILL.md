---
name: evoview-downstream
description: Two-way loop between the Evoview design library and its downstream sites (evoview.be, Tchin). Triage what moved on either side since the last review, classify each item (up / down, V / C / P / X, Signature / Variations / Expression), get the founder's gate, up-merge first, down-merge in lanes, review, record in the ledger. Triggers on "downstream triage", "triage evoview", "triage tchin", "what moved between the library and the site", "port to the site", "port from the site", "up-merge", "down-merge", "lineage", "downstream ledger".
---

# Evoview downstream loop

Library: `/root/.vibehub/projects/evoview-design-library`. Respond in English.
Read first: `CLAUDE.md`, `STRATEGY.md`, `docs/SYNC.md` (sync tool, classes
V / C / P / X), `docs/RULES.md` §13 (ownership), and the downstream site's
`CLAUDE.md` (its rules govern its repo).

## Records

The records live in the library because the evoview site forbids status files.
They don't duplicate anything: versions and texts stay in the CHANGELOGs, and
ledger items point to them.

| File | Holds |
| --- | --- |
| `lineage.json` | The stable map: one entry per capability, its library files, and per site the relation and files |
| `downstream/<site>.json` | The moving record: reviewed commits per side, one item per triaged change |

Capability: `id`, `title`, `class`, `source` (`library` / `evoview` /
`tchin` / `split-by-design`), `library { package, files }`,
`downstream.<site> { relation, files, origin?, class?, version?, note? }`.
- `relation`: `installed` (runs the package, V / C) · `counterpart` (its own
  implementation; ports flow both ways, P) · `origin` (extraction source whose
  code is its Expression; library changes are not triaged down, X) · `none`.
- `files` exist at the ledger's `siteReviewed`; `origin { ref, files }` is
  where the library took the capability from.

Ledger: `site`, `repo`, `branch`, `fork { tag, commit, snapshot, library }`,
`libraryReviewed`, `siteReviewed`, `items[]`. Item: `id`, `capability`,
`direction` (`up` site → library, `down`), `class`, `source` (one or many:
`package@heading`, exact heading else prefix, e.g. `navbar@2.8.0`; or a site
sha), `incorporatedIn` (`package@version` once landed), `status`
(`candidate` / `approved` / `applied` / `declined` / `n/a`), `reason`,
`evidence[]`, `date`. Open items also carry `layer` (Signature / Variations /
Expression / Constraints), `targets`, `adaptation`, `risk`, `verify`, `size`
(xs–xl), `value`, `signoff`, `recommendation`, and optionally `dependsOn` and
`hold` (founder hold: the item is listed but not planned).

Checks: `node scripts/lineage-check.mjs` (enums, sources resolve, every path
exists at its ref); `node scripts/triage-test.mjs` (fixture run).

## The loop

1. **Triage.** Run `node scripts/triage.mjs <site>` (`--json`; `--from-fork`
   replays from the fork). It is read-only and lists, by capability:
   - new CHANGELOG sections and commits in the packages the site installs or
     has a counterpart of;
   - site commits on mapped files;
   - `sync.sh verify` drift;
   - open items.

   For every UNTRIAGED entry, first read the site code and confirm the site
   really has the same mechanism (cite `file:line`). Then record the
   direction, class, layer, targets, adaptation, risk, verify, size, value and
   sign-off as a `candidate`; n/a and X items get a one-line reason. Advance
   `libraryReviewed` / `siteReviewed` to the HEADs you triaged, update
   `lineage.json` when files move, and run lineage-check. Commit on a branch
   in a library worktree.
2. **Founder gate.** Present one decision-ready table, sorted by value / risk:
   id, direction, class, layer, targets, size, sign-off, recommendation.
   Visual or Signature items always need explicit sign-off. Mark each item
   `approved`, or `declined` with the reason.
3. **Up-merge first.** Site-ahead items land in the library: package change,
   version bump, CHANGELOG entry (config changes, "Requires"), RULES /
   `animations/SKILL.md` when the item is a rule. Commit, then set
   `incorporatedIn`.
4. **Down-merge in lanes**, one worktree per lane:
   - V / C: `./sync.sh plan → apply → verify <site worktree> <pkg>` (installs
     from git HEAD).
   - P: one agent per file area, Opus 5.5 selected explicitly, briefed per
     the template below.
   - X: never.
5. **Review.** A separate reviewer agent in a fresh context checks each lane
   on a production preview (build + preview on a spare port, never the shared
   dev server) at 1440 / 1024 / 390. Plus:
   - the site's verifiers (evoview: `pnpm build`, `pnpm verify:crawlability`,
     `pnpm test`, `node scripts/i18n-check.mjs`);
   - an HTML identity diff of the prerendered routes for no-visual-change
     items;
   - `animations/tools/scrollbench.js` against a baseline worktree for
     performance claims;
   - `animations/tools/hover-mq.js` for hovers.

   Visual changes go to the founder with captures.
6. **Record.** In the ledger: `applied` with evidence (commits, measurements)
   and `incorporatedIn`; advance the reviewed commits. Write one activity
   record per landed lane. Use project knowledge only for durable decisions.

## Rules

- A fix can be discovered anywhere. Once validated as reusable, it lands in
  the library first (versioned), then flows down. Never port site → site.
- P ports carry the mechanism, not the look: the site's Expression and the
  library's neutralisation never cross (RULES §13).
- Downstream repos are read-only during triage. Lanes work in their own
  worktree and branch. Measurement builds go in a throwaway `/tmp` worktree
  with `node_modules` symlinked, removed afterwards.
- Lane agents never merge, push or deploy.

## Brief for a delegated port

Restate in the prompt:
- The ledger item(s): id, targets, adaptation, verify, and the source
  mechanism (library `file:line` or site sha).
- The site's `CLAUDE.md` rules. For evoview:
  - no reports, status or changelog files in the repo; evidence goes to
    `.generated/`;
  - read `skills/evoview-architecture/SKILL.md` before interface work;
  - never align the site to the library;
  - `src/components/foundation/` changes only through `sync.sh`, imported per
    module;
  - no reduced-motion branches; i18n rules (EN ≤ FR);
  - dev server only through vhdev (no `pnpm dev`, no `pkill vite`).
- The worktree path and branch; commit there; no merge, push or deploy.
- Activity logging: a meaningful change gets one entry in
  `POST /api/activity/records` (surface `code`, subjects = the affected
  project paths). A production change is always logged; the orchestrator logs
  merged lanes.
- Reply with: files, commit, verification output, anything unverified.
