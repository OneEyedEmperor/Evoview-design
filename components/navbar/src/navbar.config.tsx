import type { ReactNode } from "react";
import { CalendarDays, House, Languages, Mic, Soup, type LucideIcon } from "lucide-react";
import logoUrl from "./brand/tchin-logo.svg";
import { NavLangSwitch } from "./NavLangSwitch";
import type { NavbarConfig, NavbarLabels, NavSection } from "./types";

/* THE ONE FILE TO EDIT PER SITE.

   Reference configuration: the Tchin Tchin restaurant (resto-tchin), a
   typical client shape — a multi-page site, five pills with a booking CTA,
   lucide marks, a language switch, no trays. Change the values here (brand,
   copy, deck, actions) and leave every other file in this folder untouched.
   README.md → "Adapting" lists what each value controls.

   One-page sites: fill `sections` (ids present in the page, document order)
   and give each pill a `section`; drop `withRoute`. Trays: see
   ../examples/evoview.config.tsx. */

export type Locale = "fr" | "en";
export const LOCALES: readonly Locale[] = ["fr", "en"];

const ACCENT = "#f6c60a";
const CHILI = "#d8573f";
const VIOLET = "#c08cf0";

/* Marks are always in the brand accent; the per-entry accent still drives
   the rest of the pill (desktop tray rows, hairlines). */
const mark = (Icon: LucideIcon): ReactNode => <Icon strokeWidth={1.6} aria-hidden="true" style={{ color: ACCENT }} />;

type Copy = {
  labels: NavbarLabels;
  deck: { home: string; dining: string; karaoke: string; book: string; lang: string };
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
      homeAria: "Tchin Tchin — accueil",
      loading: "Chargement de la navigation",
    },
    deck: { home: "Accueil", dining: "Carte", karaoke: "Karaoké", book: "Réserver", lang: "Langue : français. Passer en anglais" },
  },
  en: {
    labels: {
      menu: "Menu",
      close: "Close",
      sectionLink: "View",
      navAria: "Main navigation",
      openAria: "Open menu",
      closeAria: "Close menu",
      homeAria: "Tchin Tchin — home",
      loading: "Loading navigation",
    },
    deck: { home: "Home", dining: "Dining", karaoke: "Karaoke", book: "Book", lang: "Language: English. Switch to French" },
  },
};

/* Multi-page site: no scroll-probed sections. Module-level so the scroll
   store is created once. */
const SECTIONS: NavSection[] = [];

export function buildNavbarConfig(locale: Locale, onLocaleChange: (locale: Locale) => void): NavbarConfig {
  const c = COPY[locale];
  const other: Locale = locale === "fr" ? "en" : "fr";

  return {
    logo: <img src={logoUrl} alt="" width={898} height={567} />,
    homeHref: "/",
    labels: c.labels,
    accent: ACCENT,
    vars: {
      /* Two-line wordmark (≈1.58:1): sized by height, shown as is on dark. */
      "--nav-logo-h-desktop": "2.1em",
      "--nav-logo-w-desktop": "4em",
      "--nav-logo-h-mobile": "1.9em",
      "--nav-logo-w-mobile": "3.6em",
      "--nav-logo-dark-filter": "none",
      /* Red pupil in the gold eye. */
      "--nav-eye-pupil": "#e5252a",
    },
    sections: SECTIONS,
    initialTone: "dark",

    /* Five pills: four destinations and the CTA. On mobile the CTA spans the
       last row. The language entry replaces its body with the switch and
       keeps the menu open. */
    deck: [
      { key: "home", label: c.deck.home, icon: mark(House), href: "/", accent: ACCENT },
      { key: "dining", label: c.deck.dining, icon: mark(Soup), href: "/menu", accent: CHILI },
      { key: "karaoke", label: c.deck.karaoke, icon: mark(Mic), href: "/karaoke", accent: VIOLET },
      { key: "lang", label: c.deck.lang, icon: mark(Languages), content: <NavLangSwitch locale={locale} locales={LOCALES} icon={mark(Languages)} />, keepOpen: true, accent: ACCENT },
      { key: "book", label: c.deck.book, icon: mark(CalendarDays), href: "/reservation", accent: ACCENT, cta: true },
    ],

    trays: {},

    onSection: (entry, event) => {
      if (entry.key === "lang") {
        event.preventDefault();
        onLocaleChange(other);
      }
    },
  };
}

/* Multi-page sites: the live pill is the one whose href is the current route.
   Call from the layout: `withRoute(config, location.pathname)`. */
export function withRoute(config: NavbarConfig, pathname: string): NavbarConfig {
  const path = pathname.replace(/\/+$/, "") || "/";
  return { ...config, activeKey: config.deck.find((entry) => entry.href === path)?.key };
}
