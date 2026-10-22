import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LibraryLayout from "./library/LibraryLayout";
import { LocaleProvider } from "./library/locale";
import Home from "./pages/library/Home";

/* Library routes render inside LibraryLayout (library navbar + footer). The
   navbar demos mount their own <Navbar> full-screen, outside it. Route map:
   docs/SHOWCASE-CONTRACT.md. */

const Chapter = lazy(() => import("./pages/library/Chapter"));
const CardTrack = lazy(() => import("./pages/library/CardTrack"));
const ProcessSequence = lazy(() => import("./pages/library/ProcessSequence"));
const StoryBlocks = lazy(() => import("./pages/library/StoryBlocks"));
const Reservation = lazy(() => import("./pages/library/Reservation"));
const Dossier = lazy(() => import("./pages/library/Dossier"));
const SelectorStage = lazy(() => import("./pages/library/SelectorStage"));
const Controls = lazy(() => import("./pages/library/Controls"));
const NavbarPage = lazy(() => import("./pages/library/Navbar"));
const NavbarReference = lazy(() => import("./pages/library/NavbarReference"));
const NavbarOnePage = lazy(() => import("./pages/library/NavbarOnePage"));

export default function App() {
  return (
    <LocaleProvider>
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0c0c0d" }} />}>
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
      </BrowserRouter>
    </LocaleProvider>
  );
}
