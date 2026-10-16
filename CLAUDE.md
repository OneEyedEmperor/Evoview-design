# Evoview design library

Portable Evoview components for client websites, plus a Vite showcase that
renders each one so an agent can see the reference before adapting it.

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

| Component | Status | Skill |
| --- | --- | --- |
| `navbar` — finder capsule, desktop + mobile | 1.0.0 | `evoview-navbar` |

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
