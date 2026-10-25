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
| Layouts | [chapter](components/chapter/README.md) | 1.1.0 |
| Layouts | [card-track](components/card-track/README.md) | 1.2.1 |
| Layouts | [process-sequence](components/process-sequence/README.md) | 1.3.1 |
| Layouts | [story-blocks](components/story-blocks/README.md) | 2.2.0 |
| Components | [reservation](components/reservation/README.md) | 2.10.0 |
| Components | [dossier](components/dossier/README.md) | 1.4.0 |
| Components | [selector-stage](components/selector-stage/README.md) | 1.4.0 |
| Components | [controls](components/controls/README.md) | 1.3.0 |
| Navbar | [navbar](components/navbar/README.md) | 2.7.0 |
| — | [foundation](components/foundation/README.md) (base, not showcased) | 1.6.1 |

Design rules: [docs/RULES.md](docs/RULES.md).

Agents: the skill `evoview-<name>` in your skill list points at the package's
`SKILL.md`. Read it, then the package `README.md`, before installing.

See `CLAUDE.md` for the library conventions.
