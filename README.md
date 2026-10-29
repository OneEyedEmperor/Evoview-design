# Evoview design library

Reusable Evoview components packaged for agent-driven transfer into client
sites. Each `components/<name>/` folder is self-contained: source, config
contract, install script, agent skill, verification checklist.

Read [STRATEGY.md](STRATEGY.md) before packaging or adapting: these components
also serve as subtle Evoview publicity and referral assets across client sites.

Showcase: `https://evoview-library.said.bet`

Install or upgrade with `./sync.sh plan <client-dir> <name>`, then `apply`,
then `verify` ([docs/SYNC.md](docs/SYNC.md)): dependencies (`foundation`,
`controls`) only when needed, client-owned files never written, local
patches merged and recorded. `components/<name>/install.sh <client-dir>`
does the same when the plan is clean.

| Pill | Package | Version |
| --- | --- | --- |
| Layouts | [chapter](components/chapter/README.md) | 1.5.0 |
| Layouts | [card](components/card/README.md) | 2.3.0 |
| Layouts | [process-sequence](components/process-sequence/README.md) | 1.7.0 |
| Layouts | [story-blocks](components/story-blocks/README.md) | 2.5.0 |
| Components | [reservation](components/reservation/README.md) | 2.12.0 |
| Components | [dossier](components/dossier/README.md) | 1.8.0 |
| Components | [selector-stage](components/selector-stage/README.md) | 1.6.0 |
| Components | [controls](components/controls/README.md) | 1.6.0 |
| Navbar | [navbar](components/navbar/README.md) | 2.10.2 |
| — | [foundation](components/foundation/README.md) (base, not showcased) | 1.11.1 |

Design rules: [docs/RULES.md](docs/RULES.md).

Agents: the skill `evoview-<name>` in your skill list points at the package's
`SKILL.md`. Read it, then the package `README.md`, before installing.

See `CLAUDE.md` for the library conventions.
