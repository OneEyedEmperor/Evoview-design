import EvoviewLogo from "../src/brand/EvoviewLogo";
import type { NavbarConfig, NavSection } from "../src/types";

/* Example: the evoview.be navbar — a one-page site with scroll-probed
   sections, four pills with lazy trays (2×2 numbered rows) and a CTA tray,
   the outlined "hud" reticle. Rendered at /evoview in the showcase.

   Copy into src/navbar.config.tsx (fixing the import paths) to start from
   this shape instead of the default reference. */

/* Sections in document order. `id` must match the section element's id in
   the page; `color` is the reticle pupil colour while the reader is inside it. */
const sections: NavSection[] = [
  { id: "hero", color: "#c84a4a" },
  { id: "processus", color: "#151515" },
  { id: "services", color: "#3f51b5" },
  { id: "intro", color: "#ffffff" },
  { id: "partners", color: "#a94f16" },
  { id: "contact", color: "#3f51b5" },
];

/* Tray contents are loaded on idle (see useNavTrays.ts). */
const trays = () => import("./evoview-brand/evoview-trays");

export const navbarConfig: NavbarConfig = {
  logo: <EvoviewLogo alt="" />,
  homeHref: "#hero",
  accent: "#3f51b5",
  reticle: "hud",
  vars: {
    "--nav-font-technical": '"Satoshi", sans-serif',
    "--nav-cta-hover-dark": "#c8a6d9",
  },

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

  /* The Contact pill opens the qualification modal instead of scrolling. */
  onSection: (entry, event) => {
    if (entry.key === "contact") {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("navbar:select", { detail: { type: "qualification" } }));
    }
  },

  track: (name, payload) => {
    if (import.meta.env.DEV) console.info(`[navbar] ${name}`, payload);
  },
};
