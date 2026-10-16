import EvoviewLogo from "./brand/EvoviewLogo";
import type { NavbarConfig, NavSection } from "./types";

/* THE ONE FILE TO EDIT PER SITE.

   This is the reference configuration: it reproduces the evoview.be navbar.
   To adapt the bar to a client site, change the values here (logo, labels,
   sections, deck, trays, actions) and leave every other file in this folder
   untouched. See README.md → "Adapting" for which values are safe to change
   and what each one controls. */

/* Sections in document order. `id` must match the section element's id in
   the page; `color` is the REC dot colour while the reader is inside it.
   Module-level constant: the scroll store is cached by this reference. */
const sections: NavSection[] = [
  { id: "hero", color: "#c84a4a" },
  { id: "processus", color: "#151515" },
  { id: "services", color: "#3f51b5" },
  { id: "intro", color: "#ffffff" },
  { id: "partners", color: "#a94f16" },
  { id: "contact", color: "#3f51b5" },
];

/* Tray contents are loaded on idle (see useNavTrays.ts). Static arrays are
   fine for short lists: `items: [...]`. */
const trays = () => import("./brand/evoview-trays");

export const navbarConfig: NavbarConfig = {
  logo: <EvoviewLogo alt="" />,
  homeHref: "#hero",

  labels: {
    menu: "Menu",
    close: "Fermer",
    sectionLink: "Aller à la section",
    navAria: "Navigation principale",
    openAria: "Ouvrir le menu",
    closeAria: "Fermer le menu",
    homeAria: "Evoview — accueil",
    loading: "Chargement de la navigation",
  },

  sections,

  /* Four pills is the designed count; three to five fit the capsule. One
     entry may be the CTA (filled inverse pill); it needs no href when its
     action is a modal. */
  deck: [
    { key: "services", label: "Services", icon: "services", href: "#services", section: "services", accent: "#634b72" },
    { key: "portfolio", label: "Portfolio", icon: "portfolio", href: "#partners", section: "partners", accent: "#a94f16" },
    { key: "method", label: "Méthode", icon: "method", href: "#intro", section: "intro", accent: "#634b72" },
    { key: "contact", label: "Contact", icon: "envelope", href: "#contact", section: "contact", accent: "#c8a6d9", cta: true },
  ],

  trays: {
    services: { kind: "items", unit: "dossiers", items: () => trays().then((m) => m.services) },
    portfolio: { kind: "items", unit: "projets", items: () => trays().then((m) => m.portfolio) },
    method: { kind: "items", unit: "phases", items: () => trays().then((m) => m.method) },
    contact: {
      kind: "cta",
      copy: "Un nombre volontairement limité de partenaires. Chaque candidature est étudiée par notre équipe.",
      label: "Soumettre votre candidature",
      note: "Environ 2 minutes · Sans engagement",
      onSelect: () => window.dispatchEvent(new CustomEvent("navbar:select", { detail: { type: "qualification" } })),
    },
  },

  /* On evoview.be the Contact pill opens the qualification modal instead of
     scrolling. Delete this if every pill should simply follow its anchor. */
  onSection: (entry, event) => {
    if (entry.key === "contact") {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("navbar:select", { detail: { type: "qualification" } }));
    }
  },

  /* Wire to the site's analytics (`trackEvent`), or delete. */
  track: (name, payload) => {
    if (import.meta.env.DEV) console.info(`[navbar] ${name}`, payload);
  },
};
