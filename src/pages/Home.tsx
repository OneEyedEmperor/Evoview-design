import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar, useNavbarLinks } from "../../components/navbar/src";
import { buildNavbarConfig, withRoute, type Locale } from "../../components/navbar/src/navbar.config";

/* Showcase of the reference navbar (multi-page shape): the deck's routes all
   render this page, the live pill follows the route, the language pill flips
   the copy in place, and internal links go through react-router. */

const PAGES: Record<string, { fr: string; en: string }> = {
  "/": { fr: "Accueil", en: "Home" },
  "/menu": { fr: "Carte", en: "Dining" },
  "/karaoke": { fr: "Karaoké", en: "Karaoke" },
  "/reservation": { fr: "Réserver", en: "Book" },
};

export default function Home() {
  const [locale, setLocale] = useState<Locale>("fr");
  const location = useLocation();
  const navigate = useNavigate();
  useNavbarLinks(useCallback((to: string) => navigate(to), [navigate]));

  const config = useMemo(() => withRoute(buildNavbarConfig(locale, setLocale), location.pathname), [locale, location.pathname]);
  const page = PAGES[location.pathname.replace(/\/+$/, "") || "/"];

  return (
    <div data-nav-tone="dark" className="min-h-screen" style={{ background: "#141210", color: "#fff" }}>
      <Navbar config={config} />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <span className="h-3 w-3 rounded-full" style={{ background: "#f6c60a" }} />
        <h1 className="text-4xl font-bold tracking-tight">{page ? page[locale] : location.pathname}</h1>
        <p className="text-sm opacity-60">{location.pathname} · {locale}</p>
        <Link to="/evoview" className="mt-8 text-xs uppercase tracking-widest opacity-50 hover:opacity-100">
          one-page example with trays →
        </Link>
      </main>
    </div>
  );
}
