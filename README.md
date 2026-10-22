# Evoview design library

Reusable Evoview components packaged for agent-driven transfer into client
sites. Each `components/<name>/` folder is self-contained: source, config
contract, install script, agent skill, verification checklist.

Read [STRATEGY.md](STRATEGY.md) before packaging or adapting: these components
also serve as subtle Evoview publicity and referral assets across client sites.

Showcase: `https://evoview-library.said.bet`

Install any package with `components/<name>/install.sh <client-dir>`; it
installs `foundation` (and `controls` where used) first.

| Pill | Package | Version |
| --- | --- | --- |
| Layouts | [chapter](components/chapter/README.md) | 1.0.1 |
| Layouts | [card-track](components/card-track/README.md) | 1.0.1 |
| Layouts | [process-sequence](components/process-sequence/README.md) | 1.0.1 |
| Layouts | [story-blocks](components/story-blocks/README.md) | 1.0.1 |
| Components | [reservation](components/reservation/README.md) | 2.8.1 |
| Components | [dossier](components/dossier/README.md) | 1.0.2 |
| Components | [selector-stage](components/selector-stage/README.md) | 1.0.1 |
| Components | [controls](components/controls/README.md) | 1.1.0 |
| Navbar | [navbar](components/navbar/README.md) | 2.3.0 |
| — | [foundation](components/foundation/README.md) (base, not showcased) | 1.1.0 |

Design rules: [docs/RULES.md](docs/RULES.md).

Agents: the skill `evoview-<name>` in your skill list points at the package's
`SKILL.md`. Read it, then the package `README.md`, before installing.

See `CLAUDE.md` for the library conventions.
