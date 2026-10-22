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

Shell-owned (not package pages): `/` index (`Home.tsx`); `/layouts`,
`/components` render the index scrolled to that chapter (the pill hrefs);
`/navbar/reference/*` (`NavbarReference.tsx`) and `/navbar/one-page`
(`NavbarOnePage.tsx`) render full-screen without the library chrome;
`/reservation` → `/components/reservation`, `/evoview` → `/navbar/one-page`.
Pages are lazy-loaded inside `LibraryLayout` (library navbar + footer with
the evoview.be attribution); a page must not mount its own `<Navbar>`.

Registry (`src/library/registry.ts`): `{ id, category, route, title, meta,
status: "ready" | "building", version? }`. `version` is read from
`components/<id>/VERSION` (glob, so new packages appear automatically);
`status` is set by hand in the registry when a showcase goes live.

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

`tone` defaults to `"dark"`. `children` is either a node or a render
function; omit it for the "in construction" state. Prefer a child component
that reads `useLibraryLocale()` over the render function when the component
is expensive: a node child is not re-rendered on colour change.
Default accent: `defaultAccent` ?? near-white (dark tone) / near-ink (light).

The frame renders the header (kicker, title, intro, FR/EN toggle, accent
palette) and wraps children in an element that sets `--primary`,
`--primary-foreground` (contrast ink), `--foreground`, `--muted-foreground`,
`--font-heading`. Clicking a swatch recolours the live component instantly
(CSS variables only — never remount on colour change). Locale comes from
`useLibraryLocale()` (`src/library/locale.tsx`), shared with the navbar.

Components read the host accent via `var(--primary)` / `var(--primary-foreground)`
mapped in their own token block, exactly like `components/reservation`.
