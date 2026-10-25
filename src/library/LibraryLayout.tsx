import { Suspense, useCallback, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar, useNavbarLinks } from "../../components/navbar/src";
import EvoviewLogo from "../../components/navbar/src/brand/EvoviewLogo";
import { withRoute } from "../../components/navbar/src/navbar.config";
import { buildLibraryNavbarConfig, HOME_SECTIONS } from "./library.navbar.config";
import { useLibraryLocale } from "./locale";
import { CHAPTER_ROUTES, RouteBoundary, RoutePending, pagePath } from "./routing";
import "./library.css";

export const EVOVIEW_URL = "https://evoview.be/";

export default function LibraryLayout() {
  const { locale, setLocale } = useLibraryLocale();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useNavbarLinks(useCallback((to: string) => navigate(to), [navigate]));

  const config = useMemo(() => {
    // A modal view's URL (`/components/dossier/table/`) is its page for the navbar.
    const routed = withRoute(buildLibraryNavbarConfig(locale, setLocale), pagePath(pathname));
    // Home is one page, also when reached by a category route (`/components`
    // renders the index scrolled to its chapter): the pill follows the
    // section in view instead of pinning the route's category.
    const onIndex = pathname.replace(/\/+$/, "") === "" || pathname.replace(/\/+$/, "") in CHAPTER_ROUTES;
    return onIndex ? { ...routed, activeKey: undefined, sections: HOME_SECTIONS, sectionPill: true } : routed;
  }, [locale, setLocale, pathname]);

  return (
    <div className="ev-library lib-shell">
      <Navbar config={config} />
      <main id="library-top">
        <RouteBoundary resetKey={pathname}>
          <Suspense fallback={<RoutePending />}>
            <Outlet />
          </Suspense>
        </RouteBoundary>
      </main>
      <LibraryFooter />
    </div>
  );
}

const FOOTER = {
  fr: { line: "Bibliothèque de composants Evoview", aria: "Evoview — evoview.be (nouvel onglet)" },
  en: { line: "Evoview component library", aria: "Evoview — evoview.be (new tab)" },
};

function LibraryFooter() {
  const { locale } = useLibraryLocale();
  const copy = FOOTER[locale];
  return (
    <footer className="lib-footer" data-nav-tone="dark">
      <div className="lib-rail lib-footer__row">
        <a href={EVOVIEW_URL} target="_blank" rel="noopener" aria-label={copy.aria} className="lib-footer__mark">
          <EvoviewLogo alt="" />
        </a>
        <p className="lib-body lib-footer__line">{copy.line}</p>
      </div>
    </footer>
  );
}
