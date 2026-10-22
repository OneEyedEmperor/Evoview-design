import type { ReactNode } from "react";
import { Blocks, LayoutTemplate, PanelTop, type LucideIcon } from "lucide-react";
import EvoviewLogo from "../../components/navbar/src/brand/EvoviewLogo";
import type { NavbarConfig, NavbarLabels, NavSection, NavTray } from "../../components/navbar/src/types";
import { Cover } from "./covers";
import type { Locale } from "./locale";
import { CATEGORY_LABEL, CATEGORY_ROUTE, entriesOf, type Category } from "./registry";

/* The library site's own navigation (not the package's reference config):
   three pills, two cover-card trays fed by the registry. */

const ACCENT = "#3f51b5";
const PILL_ACCENT: Record<Category, string> = { layouts: "#8a6aa0", components: "#818cf8", navbar: "#c8a6d9" };

const SECTIONS: NavSection[] = [];

const mark = (Icon: LucideIcon): ReactNode => <Icon strokeWidth={1.6} aria-hidden="true" />;

const LABELS: Record<Locale, NavbarLabels> = {
  fr: {
    menu: "Menu",
    close: "Fermer",
    sectionLink: "Tout voir",
    navAria: "Navigation de la bibliothèque",
    openAria: "Ouvrir le menu",
    closeAria: "Fermer le menu",
    homeAria: "Evoview — bibliothèque, accueil",
    loading: "Chargement de la navigation",
  },
  en: {
    menu: "Menu",
    close: "Close",
    sectionLink: "View all",
    navAria: "Library navigation",
    openAria: "Open menu",
    closeAria: "Close menu",
    homeAria: "Evoview — library, home",
    loading: "Loading navigation",
  },
};

const UNIT: Record<"layouts" | "components", Record<Locale, string>> = {
  layouts: { fr: "layouts", en: "layouts" },
  components: { fr: "composants", en: "components" },
};

function trayFor(category: "layouts" | "components", locale: Locale): NavTray {
  return {
    kind: "items",
    unit: UNIT[category][locale],
    layout: "cards",
    cardMeta: true,
    items: entriesOf(category).map((entry) => ({
      id: entry.id,
      title: entry.title[locale],
      meta: entry.meta[locale],
      href: entry.route,
      accent: PILL_ACCENT[category],
      cover: <Cover id={entry.id} variant="banner" />,
    })),
  };
}

export function buildLibraryNavbarConfig(locale: Locale): NavbarConfig {
  return {
    logo: <EvoviewLogo alt="" />,
    homeHref: "/",
    labels: LABELS[locale],
    accent: ACCENT,
    vars: {
      "--nav-accent-ink": "#fff",
      "--nav-font-technical": '"Satoshi", sans-serif',
      "--nav-font-numeral": '"Gaegu", cursive',
    },
    sections: SECTIONS,
    initialTone: "dark",
    deck: [
      { key: "layouts", label: CATEGORY_LABEL.layouts[locale], icon: mark(LayoutTemplate), href: CATEGORY_ROUTE.layouts, accent: PILL_ACCENT.layouts },
      { key: "components", label: CATEGORY_LABEL.components[locale], icon: mark(Blocks), href: CATEGORY_ROUTE.components, accent: PILL_ACCENT.components },
      { key: "navbar", label: CATEGORY_LABEL.navbar[locale], icon: mark(PanelTop), href: CATEGORY_ROUTE.navbar, accent: PILL_ACCENT.navbar },
    ],
    trays: {
      layouts: trayFor("layouts", locale),
      components: trayFor("components", locale),
    },
  };
}
