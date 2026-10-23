import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LibraryLayout from "./library/LibraryLayout";
import { LocaleProvider } from "./library/locale";
import { RouteBoundary, RoutePending, ScrollManager, lazyPage, usePreloadPages } from "./library/routing";
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

function AppRoutes() {
  const { pathname } = useLocation();
  usePreloadPages(PAGES);
  return (
    <RouteBoundary resetKey={pathname}>
      <Suspense fallback={<RoutePending />}>
        <Routes>
          <Route element={<LibraryLayout />}>
            <Route index element={<Home />} />
            <Route path="layouts" element={<Home />} />
            <Route path="components" element={<Home />} />
            <Route path="layouts/chapter" element={<Chapter />} />
            <Route path="layouts/card-track" element={<CardTrack />} />
            <Route path="layouts/process-sequence" element={<ProcessSequence />} />
            <Route path="layouts/story-blocks" element={<StoryBlocks />} />
            <Route path="components/reservation" element={<Reservation />} />
            <Route path="components/dossier" element={<Dossier />} />
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
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <BrowserRouter>
        <ScrollManager />
        <AppRoutes />
      </BrowserRouter>
    </LocaleProvider>
  );
}
