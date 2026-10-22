import { Suspense, useCallback, useLayoutEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar, useNavbarLinks } from "../../components/navbar/src";
import EvoviewLogo from "../../components/navbar/src/brand/EvoviewLogo";
import { withRoute } from "../../components/navbar/src/navbar.config";
import { buildLibraryNavbarConfig } from "./library.navbar.config";
import LocaleToggle from "./LocaleToggle";
import { useLibraryLocale } from "./locale";
import "./library.css";

export const EVOVIEW_URL = "https://evoview.be/";

/* Category routes land on the index, scrolled to their chapter. */
const CHAPTER_ROUTES: Record<string, string> = { "/layouts": "layouts", "/components": "components" };

export default function LibraryLayout() {
  const { locale } = useLibraryLocale();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  useNavbarLinks(useCallback((to: string) => navigate(to), [navigate]));

  const config = useMemo(() => withRoute(buildLibraryNavbarConfig(locale), pathname), [locale, pathname]);

  useLayoutEffect(() => {
    const chapter = CHAPTER_ROUTES[pathname.replace(/\/+$/, "")];
    const target = chapter ? document.getElementById(chapter) : hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView({ block: "start" });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="ev-library lib-shell">
      <Navbar config={config} />
      <main>
        <Suspense fallback={<div className="lib-pending" data-nav-tone="dark" />}>
          <Outlet />
        </Suspense>
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
        <LocaleToggle />
      </div>
    </footer>
  );
}
