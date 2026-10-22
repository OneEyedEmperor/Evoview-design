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

const BACK = { fr: "← bibliothèque · navbar", en: "← library · navbar" };

export default function NavbarReference() {
  const { locale, setLocale } = useLibraryLocale();
  const location = useLocation();
  const navigate = useNavigate();
  useNavbarLinks(useCallback((to: string) => navigate(to), [navigate]));

  const config = useMemo(() => withRoute(rebaseConfig(buildNavbarConfig(locale, setLocale)), location.pathname), [locale, setLocale, location.pathname]);
  const local = location.pathname.replace(/\/+$/, "").slice(BASE.length) || "/";
  const page = PAGES[local];

  return (
    <div data-nav-tone="dark" className="min-h-screen" style={{ background: "#101011", color: "#fff" }}>
      <Navbar config={config} />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <span className="h-3 w-3 rounded-full" style={{ background: "#3f51b5" }} />
        <h1 className="text-4xl font-bold tracking-tight">{page ? page[locale] : local}</h1>
        <p className="text-sm opacity-60">
          {local} · {locale}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs uppercase tracking-widest">
          <Link to="/navbar" className="opacity-50 hover:opacity-100">
            {BACK[locale]}
          </Link>
          <Link to="/navbar/one-page" className="opacity-50 hover:opacity-100">
            one-page example →
          </Link>
        </div>
      </main>
    </div>
  );
}
