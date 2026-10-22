# Showcase contract (library app ↔ packages)

Owned by the library shell (`src/library/`). Package agents consume it; they do
not edit `src/App.tsx`, `src/library/*` or `CLAUDE.md` (the orchestrator does).

## Routes and files

| Route | Page file (owned by the package agent) | Registry id |
| --- | --- | --- |
| `/layouts/chapter` | `src/pages/library/Chapter.tsx` | `chapter` |
| `/layouts/card-track` | `src/pages/library/CardTrack.tsx` | `card-track` |
| `/layouts/process-sequence` | `src/pages/library/ProcessSequence.tsx` | `process-sequence` |
| `/layouts/story-blocks` | `src/pages/library/StoryBlocks.tsx` | `story-blocks` |
| `/components/reservation` | `src/pages/library/Reservation.tsx` | `reservation` |
| `/components/dossier` | `src/pages/library/Dossier.tsx` | `dossier` |
| `/components/selector-stage` | `src/pages/library/SelectorStage.tsx` | `selector-stage` |
| `/components/controls` | `src/pages/library/Controls.tsx` | `controls` |
| `/navbar` (+ `/navbar/reference/*`, `/navbar/one-page`) | `src/pages/library/Navbar.tsx` | `navbar` |

Each page file default-exports a component. Placeholders exist until the
package agent replaces them.

## `ShowcasePage` (`src/library/ShowcasePage.tsx`)

```tsx
import ShowcasePage from "../../library/ShowcasePage";

<ShowcasePage
  entryId="selector-stage"                  // registry id → kicker, breadcrumb, version
  title={(l) => <>Selector <em>Stage</em></>} // em = accent word
  intro={{ fr: "…", en: "…" }}              // one sentence
  tone="dark"                               // page environment: "dark" | "light"
  defaultAccent="#818cf8"                   // optional
  palette                                   // default true; false for non-colourable pages
>
  {({ locale, accent, ink }) => <SelectorStage config={buildSelectorStageConfig(locale)} />}
</ShowcasePage>
```

The frame renders the header (kicker, title, intro, FR/EN toggle, accent
palette) and wraps children in an element that sets `--primary`,
`--primary-foreground` (contrast ink), `--foreground`, `--muted-foreground`,
`--font-heading`. Clicking a swatch recolours the live component instantly
(CSS variables only — never remount on colour change). Locale comes from
`useLibraryLocale()` (`src/library/locale.tsx`), shared with the navbar.

Components read the host accent via `var(--primary)` / `var(--primary-foreground)`
mapped in their own token block, exactly like `components/reservation`.
