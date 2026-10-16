# Evoview design library

Reusable Evoview components packaged for agent-driven transfer into client
sites. Each `components/<name>/` folder is self-contained: source, config
contract, install script, agent skill, verification checklist.

Showcase: `https://evoview-library.said.bet`

| Component | Version | Install |
| --- | --- | --- |
| [navbar](components/navbar/README.md) | 1.0.0 | `components/navbar/install.sh <client-dir>` |

Agents: the skill `evoview-<name>` in your skill list points at the package's
`SKILL.md`. Read it, then the package `README.md`, before installing.

See `CLAUDE.md` for the library conventions.
