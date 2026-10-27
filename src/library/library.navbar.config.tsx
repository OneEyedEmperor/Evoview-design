import type { ReactNode } from "react";
import { Blocks, Languages, LayoutTemplate, type LucideIcon } from "lucide-react";
import { NavLangSwitch } from "../../components/navbar/src";
import EvoviewLogo from "../../components/navbar/src/brand/EvoviewLogo";
import type { NavbarConfig, NavbarLabels, NavSection, NavTray } from "../../components/navbar/src/types";
import { entryPhotoSrc } from "./art";
import { coverSrc } from "./covers";
import { LOCALES, type Locale } from "./locale";
import { CATEGORY_LABEL, CATEGORY_ROUTE, entriesOf, type Category } from "./registry";

/* The library site's own navigation (not the package's reference config):
   three pills, two cover-card trays fed by the registry. Covers go in as
   URLs so the navbar's own decode gate handles them. */

const ACCENT = "#3f51b5";
const REC_RED = "#ef3b2d";
/* The live dot of each category pill, reused on the index's section bars. */
export const CATEGORY_DOT = { layouts: ACCENT, components: REC_RED } as const;
const PILL_ACCENT: Record<Category, string> = { layouts: "#8a6aa0", components: "#818cf8", navbar: "#c8a6d9" };

const SECTIONS: NavSection[] = [];

/* The home page reads as one page: the bar follows its category sections.
   `library-top` (the <main>) covers the hero, which has no pill. Module-level:
   the scroll store is keyed by this array. */
export const HOME_SECTIONS: NavSection[] = [
  { id: "library-top", color: ACCENT },
  { id: "layouts", color: ACCENT },
  { id: "components", color: REC_RED },
  { id: "navbar", color: ACCENT },
];

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
    currentItem: "Page active",
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
    currentItem: "Active page",
  },
};

const LANG: Record<Locale, string> = {
  fr: "Langue : français. Passer en anglais",
  en: "Language: English. Switch to French",
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
    items: entriesOf(category).map((entry) => ({
      id: entry.id,
      title: entry.title[locale],
      meta: entry.meta[locale],
      href: entry.route,
      accent: PILL_ACCENT[category],
      cover: entryPhotoSrc(entry.id) ?? coverSrc(entry.id, "banner"),
    })),
  };
}

export function buildLibraryNavbarConfig(locale: Locale, onLocaleChange: (locale: Locale) => void): NavbarConfig {
  const other: Locale = locale === "fr" ? "en" : "fr";
  return {
    logo: <EvoviewLogo alt="" />,
    homeHref: "/",
    labels: LABELS[locale],
    accent: ACCENT,
    vars: {
      "--nav-accent-ink": "#fff",
      "--nav-font-technical": '"Satoshi", sans-serif',
    },
    sections: SECTIONS,
    initialTone: "dark",
    deck: [
      { key: "layouts", label: CATEGORY_LABEL.layouts[locale], icon: mark(LayoutTemplate), href: CATEGORY_ROUTE.layouts, section: "layouts", accent: PILL_ACCENT.layouts, dot: ACCENT },
      { key: "components", label: CATEGORY_LABEL.components[locale], icon: mark(Blocks), href: CATEGORY_ROUTE.components, section: "components", accent: PILL_ACCENT.components, dot: REC_RED },
      { key: "lang", label: LANG[locale], icon: mark(Languages), content: <NavLangSwitch locale={locale} locales={LOCALES} icon={mark(Languages)} />, keepOpen: true, accent: ACCENT },
    ],
    trays: {
      layouts: trayFor("layouts", locale),
      components: trayFor("components", locale),
    },
    onSection: (entry, event) => {
      if (entry.key === "lang") {
        event.preventDefault();
        onLocaleChange(other);
      }
    },
  };
}
