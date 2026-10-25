import type { ReactNode } from "react";
import { House, Languages, type LucideIcon } from "lucide-react";
import EvoviewLogo from "./brand/EvoviewLogo";
import { NavLangSwitch } from "./NavLangSwitch";
import type { NavbarConfig, NavbarLabels, NavSection } from "./types";

/* THE ONE FILE TO EDIT PER SITE.

   Reference configuration, Evoview-branded: a multi-page site, five pills
   with a contact CTA, the Evoview eye marks, a language switch, and one
   route tray under Services.
   Change the values here (brand, copy, deck, actions) and leave every other
   file in this folder untouched. README.md → "Adapting" lists what each
   value controls.

   One-page sites: fill `sections` (ids present in the page, document order)
   and give each pill a `section`; drop `withRoute`. Trays: see
   ../examples/evoview.config.tsx. */

export type Locale = "fr" | "en";
export const LOCALES: readonly Locale[] = ["fr", "en"];

/* Evoview palette: brand indigo, Méthode purple, Portfolio orange, the
   lilac of the contact CTA. */
const ACCENT = "#3f51b5";
const METHOD = "#634b72";
const PORTFOLIO = "#a94f16";
const CONTACT = "#c8a6d9";

const mark = (Icon: LucideIcon): ReactNode => <Icon strokeWidth={1.6} aria-hidden="true" />;

type Copy = {
  labels: NavbarLabels;
  deck: { home: string; services: string; portfolio: string; method: string; contact: string; lang: string };
  servicesUnit: string;
  services: { id: string; title: string; meta: string; accent: string }[];
};

const COPY: Record<Locale, Copy> = {
  fr: {
    labels: {
      menu: "Menu",
      close: "Fermer",
      sectionLink: "Voir",
      navAria: "Navigation principale",
      openAria: "Ouvrir le menu",
      closeAria: "Fermer le menu",
      homeAria: "Evoview — accueil",
      loading: "Chargement de la navigation",
      currentItem: "Page active",
    },
    deck: { home: "Accueil", services: "Services", portfolio: "Portfolio", method: "Méthode", contact: "Contact", lang: "Langue : français. Passer en anglais" },
    servicesUnit: "dossiers",
    services: [
      { id: "identite-visuelle", title: "Identité visuelle", meta: "Brand system", accent: "#6b4f7e" },
      { id: "direction-artistique", title: "Direction artistique", meta: "Image direction", accent: "#c84a4a" },
      { id: "design-creation", title: "Design & création", meta: "Production", accent: "#c8942e" },
      { id: "strategie-marketing", title: "Stratégie marketing", meta: "Acquisition", accent: "#a94f16" },
    ],
  },
  en: {
    labels: {
      menu: "Menu",
      close: "Close",
      sectionLink: "View",
      navAria: "Main navigation",
      openAria: "Open menu",
      closeAria: "Close menu",
      homeAria: "Evoview — home",
      loading: "Loading navigation",
      currentItem: "Active page",
    },
    deck: { home: "Home", services: "Services", portfolio: "Portfolio", method: "Method", contact: "Contact", lang: "Language: English. Switch to French" },
    servicesUnit: "dossiers",
    services: [
      { id: "identite-visuelle", title: "Visual identity", meta: "Brand system", accent: "#6b4f7e" },
      { id: "direction-artistique", title: "Art direction", meta: "Image direction", accent: "#c84a4a" },
      { id: "design-creation", title: "Design & production", meta: "Production", accent: "#c8942e" },
      { id: "strategie-marketing", title: "Marketing strategy", meta: "Acquisition", accent: "#a94f16" },
    ],
  },
};

/* Multi-page site: no scroll-probed sections. Module-level so the scroll
   store is created once. */
const SECTIONS: NavSection[] = [];

export function buildNavbarConfig(locale: Locale, onLocaleChange: (locale: Locale) => void): NavbarConfig {
  const c = COPY[locale];
  const other: Locale = locale === "fr" ? "en" : "fr";

  return {
    /* Black wordmark; the dark tone inverts it (default --nav-logo-dark-filter). */
    logo: <EvoviewLogo alt="" />,
    homeHref: "/",
    labels: c.labels,
    accent: ACCENT,
    vars: {
      /* White type on the indigo language thumb. */
      "--nav-accent-ink": "#fff",
      "--nav-font-technical": '"Satoshi", sans-serif',
      "--nav-cta-hover-dark": CONTACT,
    },
    sections: SECTIONS,
    initialTone: "dark",

    /* Five pills: four destinations and the CTA. On mobile the CTA spans the
       last row. The language entry replaces its body with the switch and
       keeps the menu open. Marks are the built-in Evoview eyes. */
    deck: [
      { key: "home", label: c.deck.home, icon: mark(House), href: "/", accent: ACCENT },
      { key: "services", label: c.deck.services, icon: "services", href: "/services", accent: METHOD },
      { key: "portfolio", label: c.deck.portfolio, icon: "portfolio", href: "/portfolio", accent: PORTFOLIO },
      { key: "method", label: c.deck.method, icon: "method", href: "/methode", accent: METHOD },
      { key: "lang", label: c.deck.lang, icon: mark(Languages), content: <NavLangSwitch locale={locale} locales={LOCALES} icon={mark(Languages)} />, keepOpen: true, accent: ACCENT },
      { key: "contact", label: c.deck.contact, icon: "envelope", href: "/contact", accent: CONTACT, cta: true },
    ],

    /* A route tray: four internal pages under the Services pill, routed by
       `useNavbarLinks`. No covers, so desktop shows 2×2 numbered rows; add
       a `cover` per entry for the stacked card banners (see the example). */
    trays: {
      services: {
        kind: "items",
        unit: c.servicesUnit,
        items: c.services.map((service) => ({ ...service, href: `/services/${service.id}` })),
      },
    },

    onSection: (entry, event) => {
      if (entry.key === "lang") {
        event.preventDefault();
        onLocaleChange(other);
      }
    },
  };
}

/* Multi-page sites: the live pill is the one whose href is the current route
   or its closest parent (`/services/x` lights Services), and the tray entry
   whose href is the route is marked active. Call from the layout:
   `withRoute(config, location.pathname)`. */
export function withRoute(config: NavbarConfig, pathname: string): NavbarConfig {
  const path = pathname.replace(/\/+$/, "") || "/";
  const matches = (href: string) => href === path || (href !== "/" && path.startsWith(`${href}/`));
  const live = config.deck
    .filter((entry) => entry.href && matches(entry.href))
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0];
  return { ...config, activeKey: live?.key, currentPath: path };
}
