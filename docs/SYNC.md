# Package sync

Moves library packages into client repos without losing client work.
`./sync.sh <plan|apply|verify> <client-dir> [package[@ref]…] [flags]`
(`scripts/evoview-sync.mjs`, Node stdlib + the `git` CLI). Tests:
`node scripts/sync-test.mjs` (scratch clients and a library clone in /tmp).

`components/<name>/install.sh <client>` = `sync.sh apply <client> <name> --if-clean`:
applies a clean plan, otherwise prints it and exits 2.

Run `apply` in a client worktree / branch, never under another agent's uncommitted work.

## Commands

| | |
| --- | --- |
| `plan` | Read-only. Classifies every file, resolves dependencies, checks compatibility and the host. |
| `apply` | Plans, then writes. Refuses (exit 2, nothing written) on blockers, on `--if-clean` with a plan that needs review, and on uncommitted client changes under the target package dirs that the last sync did not write (`--force` overrides that check only). |
| `verify` | Structural only: files vs provenance checksums, conflict markers, patch reasons, `requires` across installed packages, relative imports resolve and named imports exist, legacy stamp. `--typecheck` adds the client's `tsc -b` (when `tsconfig.json` has references) or `tsc --noEmit`. Rendering, motion and responsiveness are not checked: that is the reviewer's pass at 1440 / 1024 / 390. |

Without packages: `plan` / `apply` take every installed package, `verify` checks all.
`name@ref` pins one package's target.

| Flag | |
| --- | --- |
| `--ref <rev>` | Library commit / tag / branch to install (default `HEAD`). |
| `--worktree` | Read the library working tree (library development only); provenance `dirty: true` when the package has uncommitted changes. |
| `--components-dir <dir>` | Default `src/components`. |
| `--json` | Machine-readable result (agents). |
| `--brief` | Plan: changelog highlights and template file names only. |
| `--force`, `--if-clean` | Apply only (above). |

## Source = git

Package code is `components/<name>/src` at the target commit, never the
working tree: installs are reproducible and an uncommitted library edit
never reaches a client.

## Package metadata: `components/<name>/evoview.json`

```json
{ "requires": { "foundation": ">=1.9.0 <2", "controls": ">=1.5.0 <2" },
  "clientOwned": ["<name>.config.tsx", "<name>.theme.css", "brand/"],
  "hostDeps": { "react": ">=19" } }
```

`VERSION` stays the only version number. `requires` floors: the CHANGELOG's
latest "Requires" line, else the dependency version the package first
shipped against; never below the oldest version exporting every symbol /
token the package uses. Ranges: comparators, `^`, `~`, x-ranges, `||`. Trees older than `evoview.json`: `requires` inferred as lockstep with
the dependency version in the same commit, `clientOwned` from today's policy.

`<name>.theme.css` (client-owned, every package but `foundation`): the
package's adaptable tokens, commented out with their defaults, imported by
`index.ts` after the package CSS so a client value wins at equal
specificity. `foundation` has none: its adaptable inputs are host tokens
(`--primary`, `--font-*`) and its own tokens are Signature.

## Client state

- `src/components/.evoview/<name>.json`: `package`, `version`, `commit` (full
  sha = merge base of the next sync), `ref`, `dirty`, `installedAt`,
  `requires`, `clientOwned`, `hostDeps`, `files` (sha256 of every file in the
  package dir, paths relative to it), `patches` (`{ file: reason }`),
  `pending` (conflicts left by the last apply), `adoptedFrom`.
- `src/components/.evoview/patches/<name>.diff`: every package file that
  differs from the library at `commit` (git-applicable to the library files).
  A new patch gets reason `"TODO: reason"`; `verify` fails until it is filled.
  Reasons survive later syncs. A patch is the candidate list for moving a
  client fix into the library.
- `src/components/<name>/.<name>-version`: legacy stamp, still written.

## File classes (`plan`)

base = library at the recorded commit, ours = client file, theirs = library at the target.

| Class | Case | `apply` |
| --- | --- | --- |
| unchanged | ours = base = theirs | — |
| fast-forward / added | ours = base, theirs changed / new | write theirs |
| removed | ours = base, gone upstream | delete |
| kept | ours changed, theirs = base (incl. a client deletion) | — (stays a patch) |
| client-added | only in the client | — (flagged) |
| merge-clean | both changed, `git merge-file` clean | write the merge |
| conflict | both changed with overlapping hunks; client-modified + removed upstream; client-deleted + changed upstream; binary on both sides | diff3 markers (text) / client file kept (removed upstream, binary) / theirs restored (deleted by client); `pending`, exit 2 |
| client-owned | `clientOwned` paths | never written; files created from the template when absent; dirs only on a first install; a changed template is shown as a diff |

A merge-clean (or conflict) where both sides introduce the same new
identifier (custom property, camelCase) is flagged: the patch may now
duplicate upstream. Plan also checks the named imports the target package
takes from client-owned modules (a config builder added upstream), and
lists CHANGELOG sections between the installed and target version
(`Unreleased` included) with "Config changes" / "Requires" / "breaking"
highlighted. Host: `hostDeps` + react ≥ 19 (missing react blocks), vite,
`@/*` alias, `--primary` in the host CSS (warnings).

Conflicts: resolve the files, run `apply` again (it records the resolutions
as patches and clears `pending`), then `verify`. `apply` refuses while
markers remain. Editing other files the last apply wrote (e.g. dropping a
flagged merge-clean patch) counts as uncommitted work: commit first, or
`--force` when the edits are yours.

## Adoption

A legacy install (`.<name>-version`, no provenance): base = the library
state whose `VERSION` equals the stamp and whose `src/` differs least from
the client copy (client-owned paths ignored); every difference is an
unrecorded change (exit 2). `apply <client> <name>@<base>` adopts in place
(records provenance and patches, writes no package file). An existing
package dir with neither file is a blocker.

## Compatibility, versioning

A client has one `foundation/` and one `controls/`. A dependency is installed
or upgraded only when a requested package's target does not accept the
installed version; then every installed package's `requires` (from its
provenance) is checked against the new version: compatible packages stay
untouched, incompatible ones are listed as required upgrades, a blocker if
the library's version of that package does not accept it either.

Policy: `foundation` and `controls` stay additive within a major; a breaking
change is a major bump. A breaking config or API change in any package is a
major bump (navbar 2.4.0's `cardMeta` removal as a minor is the historical
exception). Every package's `requires` caps dependencies below their next major.

## Exit codes

0 clean / applied · 2 needs review (conflicts, unrecorded changes,
incompatibilities, blockers, refusals, verify failures) · 1 error (usage,
unknown ref or package, git failure).

## Code-transfer classes

| | Class | Means |
| --- | --- | --- |
| V | verbatim shared code | library package source, byte-identical in the client except recorded patches |
| C | client uses the package | client config, theme, content, media around a V package |
| P | port the mechanism | re-implement a mechanism in a codebase that cannot take the package (the evoview site's own components) |
| X | never port | client Expression, other clients' code |

This tool implements V (package files, patch record) and C (client-owned
files, never overwritten). P and X stay manual.

## Downstream loop

What moves where between the library and its sites, in both directions:
`downstream/SKILL.md` (skill `evoview-downstream`). Map: `lineage.json`
(capability → library files, per site relation + files). Record:
`downstream/<site>.json` (reviewed commits, triaged items). Worklist:
`node scripts/triage.mjs <site>`; checks: `node scripts/lineage-check.mjs`,
`node scripts/triage-test.mjs`.
