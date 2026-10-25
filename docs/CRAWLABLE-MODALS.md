# Crawlable modals — contract

Binding for every library package that has a modal (`dossier`, the step
dossier of `process-sequence`, any later one). Every view of the modal has a
URL, and that URL's server HTML carries the view's full copy. Taken from what
Evoview shipped on `fix/evoview-visual-system` (b2d2567, ce089b0, 5e9a989,
9263f5a; `src/data/routes.ts`, `src/lib/routeHistory.ts`, `src/islands/*`,
`src/entry-server.tsx`, `scripts/prerender.mjs`,
`scripts/verify-crawlability.mjs`). The shared pieces live in `foundation`
(≥ 1.6.0). Checked by `pnpm verify:ssr` (§8).

## 1. Views

A view is a state of the modal a visitor can land on: a JSON-serialisable
object of config ids. Its level is the length of its ancestry (`parent`
chain). Fixed shapes (the harness and clients rely on them):

| Package | View | `key` | Level / parent |
| --- | --- | --- | --- |
| `dossier` | `type DossierView = { item: string; entry?: string }` | `item`, `item/entry` | overview 1 → `null`; entry 2 → its item's overview |
| `process-sequence` | `type ProcessSequenceView = { step: string }` | `step` | 1 → `null`; only steps with `detail` |

## 2. Package API

```ts
import type { ModalRoutes, RouteViewProps, ViewHead } from "../foundation";

type ModalRoutes<C, V> = {
  views(config: C): V[];                  // every view, on-screen order (prerender, sitemap, directory)
  parent(view: V): V | null;              // one level up; null = top level
  key(view: V): string;                   // URL-safe, "/"-separated ids; default slug path + equality
  parse(config: C, key: string): V | null;
  head(config: C, view: V): ViewHead;     // §6
};

type RouteViewProps<V> = {
  view: V | null;                         // controlled; null = closed
  onNavigate(view: V | null): void;       // every navigation the modal asks for, every Back/Forward it reports
  hrefFor?(view: V | null): string;       // URL of a view; null = the page under the modal
  history?: boolean;                      // default true (§5)
};

// package index
export const dossierRoutes: ModalRoutes<DossierConfig, DossierView>;
export type DossierProps = RouteViewProps<DossierView> & { config: DossierConfig; /* … */ };
export const processSequenceRoutes: ModalRoutes<ProcessSequenceConfig, ProcessSequenceView>;
export type ProcessSequenceProps = Partial<RouteViewProps<ProcessSequenceView>> & { config: ProcessSequenceConfig; /* … */ };
```

- `ModalRoutes` are pure functions of the config: no React, no DOM.
- The package never sets its own view: tile, tab, pager, step, up, Escape,
  backdrop and close all call `onNavigate` (close = `null`), the host sets
  `view`. A board that is itself page content (the process board) may stay
  uncontrolled when `view` is `undefined` and keep working without URLs.
- `view === null` renders no modal markup.
- Without `hrefFor` the package works as before (buttons, history entries on
  the current URL). Legacy props may stay for one minor version, mapped onto
  `view`; list them in the CHANGELOG.

## 3. Server rendering

1. **SSR-safe render.** No `window`, `document`, `matchMedia`, storage,
   `crypto`, `Date.now()` or `Math.random()` in render or state
   initialisers; ids from `useId`. Environment through `useSyncExternalStore`
   with a server snapshot (foundation: `useMediaQuery(query, serverValue)`,
   `useHydrated`, `useBackgroundSuspended`, `useInViewPause`). No
   `createPortal`: render in place. Same props → same HTML (hydration).
2. **Server layout = desktop.** Width queries take the desktop value on the
   server (`useMediaQuery("(min-width: 1024px)", true)`); a phone swaps
   right after hydration, while the view is still entering.
3. **Hydration-only markup.** `inert`, `aria-hidden` on content, loaders,
   scroll lock, the page inert walk, focus moves: only once `useHydrated()`
   is true or in effects. Server HTML carries none of them.
4. **Copy mounted, media gated.** The open view's copy renders from the
   first render and stays mounted; only media wait (`useMediaReady` is never
   ready on the server). After hydration the gate may hide copy (opacity,
   `inert`, `aria-hidden`), never by not rendering it.
5. **Held copy.** Wrap the view's copy in `<HeldCopy live={gate.ready}>`;
   a video takes `src={useHeldSrc(src)}` (poster stays). Until `live`, CSS
   animations are paused and no video source is set; when `live` turns true
   the copy remounts, so its entrance starts at the moment the view used to
   mount. A client-side switch mounts the incoming view held at once.
6. **Resting look.** Entrances are CSS animations whose rest is visible
   (fill backwards) or classes added after hydration; never inline
   `opacity: 0` / `visibility: hidden` / `display: none` on copy in server
   HTML. The modal root carries `data-ev-route-layer`; clients put
   `ROUTE_LAYER_NOSCRIPT_CSS` in a `<noscript><style>`.

## 4. Semantics

- **One h1 per view**: the view's title (its text is contained in
  `head.title`); everything else `h2`+. The dialog is `aria-labelledby` the
  h1. On a view URL the modal's h1 is the page's h1: a page shell
  server-rendered under it renders its own title as `h2` while a view is open.
- **Real links.** Every control that changes the view is `<a href={hrefFor(v)}>`
  with the in-page handler on a plain click (`RouteLink`, or
  `followRouteLink` in your own `onClick`); modified clicks open the URL.
  Each view links its parent, its children and its previous / next sibling.
  Close, Escape and backdrop stay buttons. Disabled link: `aria-disabled`,
  out of the Tab order (style `[aria-disabled="true"]` like `:disabled`).
- **Media.** `<img>` with a static `src` and an `alt` (`""` when
  decorative) in server HTML. `<video>`: `poster`, no `src` / `<source>`
  until live (§3.5).

## 5. History

Default: the package keeps history itself with foundation
`useRouteHistory({ view, routes, hrefFor, onNavigate, history })`, called
once with its own props; it never calls `pushState` directly.

- One entry per level. Open: push the view's ancestry. Deeper: push.
  Same level: replace. Up (Escape, backdrop, `Sommaire`): Back, landing on
  the ancestor of the view on screen. Close: Back past every level, so
  Back can never reopen it.
- Escape and backdrop go one level (`onNavigate(routes.parent(view))`);
  the close button closes (`onNavigate(null)`).
- Deep link: a page loaded (or routed) on a view URL rewrites its entry to
  `hrefFor(null)` and pushes the ancestry, so Back steps out one level at a
  time. Reload or Forward onto an entry the modal made adopts it; Forward
  after a close reopens it (keep the package mounted while closed).
- `history={false}`: the host's router owns history and must implement the
  same model from `onNavigate`.
- URLs are the host's (`hrefFor`). Default scheme
  `routeHrefs(base, routes.key)` → `<base>/<key>/` (trailing slash: each
  route is prerendered as `<path>/index.html`); `viewFromPath(pathname,
  base, routes, config)` is its inverse. Localised slugs: a custom `hrefFor`
  plus its own parser.

## 6. Head data

`head(config, view): ViewHead` is data only; the package emits no tags and
asserts no schema.org type.

```ts
type ViewHead = {
  title: string;                          // contains the h1 text; no site suffix
  description: string;                    // from the view's copy, ≤ 160 chars, cut on a word
  breadcrumb: string[];                   // top-level view → this view (length = level)
  image?: { src: string; alt: string };   // og:image / JSON-LD image
};
```

The client renders: `<title>` (`head.title` + its site suffix),
description, canonical `origin + hrefFor(view)`, reciprocal hreflang (same
`key` in each locale), robots, `og:*`; JSON-LD `WebPage` (name,
description, image, inLanguage), `BreadcrumbList` (its page crumbs, then
`head.breadcrumb` with URLs from the ancestry), and, if it can state one
from config facts, its own domain node (Evoview: `Service` +
`OfferCatalog` for an overview, `Service` for an entry).

## 7. Client wiring

1. **Route table.** Per package instance and locale: a `base` (`/carte/`,
   `/en/menu/`). `base` and every `hrefFor(view)` render the same page
   component (no remount between them: one route with a splat or optional
   segments). The page keeps `view` in state, seeded once from
   `viewFromPath(location.pathname, base, routes, config)`, and mounts
   `<Dossier view={view} onNavigate={setView} hrefFor={routeHrefs(base, dossierRoutes.key)} />`
   whether open or not. Launchers are links:
   `<a href={hrefFor(v)} onClick={(e) => followRouteLink(e, () => setView(v))}>`.
2. **Prerender** (`vite build --ssr src/entry-server.tsx` then a script;
   `react-dom/static` `prerender(node, { progressiveChunkSize:
   Number.MAX_SAFE_INTEGER })` so every boundary is inlined). For each page,
   locale and `[null, ...routes.views(config)]`, render with that locale and
   view, write `dist<hrefFor(view)>index.html` with its head (§6) and the
   noscript sheet (§3.6). Two reference integrations:
   - *Full app* — Tchin Tchin (`/root/.vibehub/projects/test`):
     `src/entry-server.tsx` renders the router (`createMemoryRouter`,
     `initialEntries: [path]`), `scripts/prerender.ts` writes each route
     into `#root`; `src/main.tsx` hydrates (`hasChildNodes()` →
     `hydrateRoot`, after preloading the route's lazy chunk). Add every
     view path to its route list. The page's own h1 becomes h2 on view
     routes (§4).
   - *Islands* — Evoview: the page stays client-rendered; the view's modal
     is server-rendered into `#dossier-root` (`data-view` = the view) and
     hydrated by its own root (`src/islands/dossierClient.tsx`); islands are
     `display: none` while `#root:empty`. `scripts/prerender.mjs` also
     writes `404.html`, `sitemap.xml` (alternates, git lastmod),
     `robots.txt`, `llms.txt` / `llms-full.txt`, all from the same view
     list.
   Hosting: serve `<path>/index.html`, redirect `/x` → `/x/`, a real 404
   (`404.html` turns off the Cloudflare Pages SPA fallback; nginx
   `try_files $uri $uri/ =404`).
3. **Verify** the built site as a crawler without JavaScript: per view URL
   the title, one h1, the copy (computed from config, not from the output),
   canonical / hreflang / robots, valid JSON-LD, no `inert`; sitemap and
   llms list every indexable view. Templates: Evoview
   `scripts/verify-crawlability.mjs` (complete), Tchin Tchin
   `scripts/verify-crawlability.mjs` (minimal).

## 8. `pnpm verify:ssr`

`scripts/verify-ssr.mjs` loads each routable package through Vite's SSR
loader and renders its reference config (`build<Name>Config`, FR and EN)
with `react-dom/static`, the way a client prerender does. Per package:
`<name>Routes` exported, `views` covering every view (§1), key ↔ parse
round trip, `head` well-formed (§6), the closed render (no modal markup;
a page section links every top-level view). Per view: renders without
throwing, deterministic, one `data-ev-route-layer`, exactly one h1
contained in `head.title`, no `inert`, the view's copy present and not
hidden (`aria-hidden`, `hidden`, inline style), `<a href>` to parent,
children and adjacent siblings, `<img>` with `src` + `alt`, no video
source. It also renders the foundation hooks and primitives on the server.
A package without `<name>Routes` is probed through its current API, so SSR
hazards show before the port. Add a package: one entry in `PACKAGES`.
