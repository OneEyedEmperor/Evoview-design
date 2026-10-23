import { useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar, useNavbarLinks, type NavbarConfig } from "../../../components/navbar/src";
import { buildNavbarConfig, withRoute } from "../../../components/navbar/src/navbar.config";
import { useLibraryLocale } from "../../library/locale";

/* The package's reference config (multi-page shape), rendered full-screen
   without the library chrome. Its routes are rebased under BASE so every
   pill and tray entry stays inside the demo. */

const BASE = "/navbar/reference";

const PAGES: Record<string, { fr: string; en: string }> = {
  "/": { fr: "Accueil", en: "Home" },
  "/services": { fr: "Services", en: "Services" },
  "/portfolio": { fr: "Portfolio", en: "Portfolio" },
  "/methode": { fr: "Méthode", en: "Method" },
  "/contact": { fr: "Contact", en: "Contact" },
};

const rebase = (href: string) => (href.startsWith("/") ? (href === "/" ? BASE : BASE + href) : href);

function rebaseConfig(config: NavbarConfig): NavbarConfig {
  const trays: NavbarConfig["trays"] = {};
  for (const [key, tray] of Object.entries(config.trays)) {
    trays[key] =
      tray?.kind === "items" && Array.isArray(tray.items)
        ? { ...tray, items: tray.items.map((item) => (item.href ? { ...item, href: rebase(item.href) } : item)) }
        : tray;
  }
  return {
    ...config,
    homeHref: rebase(config.homeHref),
    deck: config.deck.map((entry) => (entry.href ? { ...entry, href: rebase(entry.href) } : entry)),
    trays,
  };
}

const COPY = {
  fr: {
    line: (page: string) => `La page « ${page} » de la démo. Changez de page avec la barre : la pilule de la page courante reste allumée.`,
    back: "Retour à la navbar",
    onePage: "Exemple une page",
  },
  en: {
    line: (page: string) => `The demo's "${page}" page. Move between pages with the bar: the current page's pill stays lit.`,
    back: "Back to the navbar",
    onePage: "One-page example",
  },
};

export default function NavbarReference() {
  const { locale, setLocale } = useLibraryLocale();
  const location = useLocation();
  const navigate = useNavigate();
  useNavbarLinks(useCallback((to: string) => navigate(to), [navigate]));

  const config = useMemo(() => withRoute(rebaseConfig(buildNavbarConfig(locale, setLocale)), location.pathname), [locale, setLocale, location.pathname]);
  const local = location.pathname.replace(/\/+$/, "").slice(BASE.length) || "/";
  const page = PAGES[local]?.[locale] ?? local;
  const copy = COPY[locale];
  // Inside the showcase's preview frame, leaving the demo leaves the frame.
  const framed = typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="ev-library lib-demo-page lib-toned" data-tone="dark" data-nav-tone="dark">
      <Navbar config={config} />
      <main className="lib-demo-page__section">
        <div className="lib-rail lib-demo-page__copy">
          <h1 className="lib-display">{page}</h1>
          <p className="lib-lead">{copy.line(page)}</p>
          <div className="lib-demo-page__links">
            {framed ? (
              <a href="/navbar" target="_top" className="lib-command lib-command--quiet">
                {copy.back}
              </a>
            ) : (
              <>
                <Link to="/navbar" className="lib-command lib-command--quiet">
                  {copy.back}
                </Link>
                <Link to="/navbar/one-page" className="lib-command lib-command--quiet">
                  {copy.onePage}
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
