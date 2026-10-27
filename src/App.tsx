import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, type Location } from "react-router-dom";
import LibraryLayout from "./library/LibraryLayout";
import { AccentChoiceProvider } from "./library/accentChoice";
import { LocaleProvider } from "./library/locale";
import { usePageCurtain } from "./library/PageCurtain";
import { CHAPTER_ROUTES, RouteBoundary, RoutePending, ScrollManager, lazyPage, pagePath, usePreloadPages, type LazyPage } from "./library/routing";
import Home from "./pages/library/Home";

/* Library routes render inside LibraryLayout (library navbar + footer). The
   navbar demos mount their own <Navbar> full-screen, outside it. Route map:
   docs/SHOWCASE-CONTRACT.md. */

const Chapter = lazyPage(() => import("./pages/library/Chapter"));
const CardTrack = lazyPage(() => import("./pages/library/CardTrack"));
const ProcessSequence = lazyPage(() => import("./pages/library/ProcessSequence"));
const StoryBlocks = lazyPage(() => import("./pages/library/StoryBlocks"));
const Reservation = lazyPage(() => import("./pages/library/Reservation"));
const Dossier = lazyPage(() => import("./pages/library/Dossier"));
const SelectorStage = lazyPage(() => import("./pages/library/SelectorStage"));
const Controls = lazyPage(() => import("./pages/library/Controls"));
const NavbarPage = lazyPage(() => import("./pages/library/Navbar"));
const NavbarReference = lazyPage(() => import("./pages/library/NavbarReference"));
const NavbarOnePage = lazyPage(() => import("./pages/library/NavbarOnePage"));

const PAGES = [Chapter, CardTrack, ProcessSequence, StoryBlocks, Reservation, Dossier, SelectorStage, Controls, NavbarPage, NavbarReference, NavbarOnePage];

/* LibraryLayout pages (under the shared hero), keyed by path. */
const LAYOUT_PAGES: Record<string, LazyPage | null> = {
  "/": null,
  "/layouts/chapter": Chapter,
  "/layouts/card-track": CardTrack,
  "/layouts/process-sequence": ProcessSequence,
  "/layouts/story-blocks": StoryBlocks,
  "/components/reservation": Reservation,
  "/components/dossier": Dossier,
  "/components/selector-stage": SelectorStage,
  "/components/controls": Controls,
  "/navbar": NavbarPage,
};
const OUTSIDE_LAYOUT = /^\/(navbar\/(reference|one-page)|reservation|evoview)(\/|$)/;

const curtainKey = ({ pathname }: Location) => {
  const path = pagePath(pathname);
  if (OUTSIDE_LAYOUT.test(path)) return null;
  return path in CHAPTER_ROUTES ? "/" : path;
};
const categoryOf = ({ pathname }: Location) => /^\/(layouts|components)\/./.exec(pathname)?.[1];
const curtainSide = (from: Location, to: Location) => {
  const a = categoryOf(from);
  const b = categoryOf(to);
  return Boolean(a && b && a !== b);
};
const curtainPrepare = (location: Location) => LAYOUT_PAGES[curtainKey(location) ?? ""]?.preload();

function AppRoutes() {
  usePreloadPages(PAGES);
  const { location, layer } = usePageCurtain({
    pageKey: curtainKey,
    prepare: curtainPrepare,
    side: curtainSide,
  });
  const { pathname } = location;
  return (
    <>
      <ScrollManager location={location} />
      {layer}
      <RouteBoundary resetKey={pathname}>
        <Suspense fallback={<RoutePending />}>
          <Routes location={location}>
            <Route element={<LibraryLayout />}>
              <Route index element={<Home />} />
              <Route path="layouts" element={<Home />} />
              <Route path="components" element={<Home />} />
              <Route path="layouts/chapter" element={<Chapter />} />
              <Route path="layouts/card-track" element={<CardTrack />} />
              {/* Deep-link pages: `/*` = a modal view's URL (DEEP_LINK_PAGES). */}
              <Route path="layouts/process-sequence/*" element={<ProcessSequence />} />
              <Route path="layouts/story-blocks" element={<StoryBlocks />} />
              <Route path="components/reservation" element={<Reservation />} />
              <Route path="components/dossier/*" element={<Dossier />} />
              <Route path="components/selector-stage" element={<SelectorStage />} />
              <Route path="components/controls" element={<Controls />} />
              <Route path="navbar" element={<NavbarPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="navbar/reference/*" element={<NavbarReference />} />
            <Route path="navbar/one-page" element={<NavbarOnePage />} />
            <Route path="reservation" element={<Navigate to="/components/reservation" replace />} />
            <Route path="evoview" element={<Navigate to="/navbar/one-page" replace />} />
          </Routes>
        </Suspense>
      </RouteBoundary>
    </>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AccentChoiceProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AccentChoiceProvider>
    </LocaleProvider>
  );
}
