# dossier changelog

## 1.0.2

- The inert walk skips elements carrying `data-ev-keep-interactive` (host
  dev/showcase chrome, e.g. the library's floating accent palette). Client
  behaviour unchanged. No config changes.

## 1.0.1

- Requires `controls` 1.1.0: initial focus goes to the close button through
  its `ref` (no `querySelector`). No config changes.

## 1.0.0

- First release on `foundation` 1.0.0 + `controls` 1.0.0: `Dossier` (portal
  modal), `SelectionBoard`, `DossierLoader`, open chapters (`DossierChapter`,
  `ChapterHead`, `ChapterFigure`, `ChapterSplit`, `ChapterRows`,
  `ChapterSpecimen`, `ChapterPayoff`).
- Config: `dossier.config.tsx` — `brand`, `kicker`, `items[] { id, label,
  accent?, accentInk?, entries[4] { id, title, label?, kicker?, media,
  sources?, content(ctx) } }`, `attribution { enabled, href, label }`,
  `copy` (FR / EN). `buildDossierConfig(locale)`, `dossierCopy(locale)`.
- Reference content: Maison Ardoise (fictional restaurant), 3 × 4 entries.
