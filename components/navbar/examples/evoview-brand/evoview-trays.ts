import type { NavTrayItem } from "../../src/types";

/* Tray contents of the evoview.be example. Loaded lazily by the config so
   this copy stays off the critical path. On the real site these arrays are
   projected from the data modules the sections themselves consume; keep that
   pattern on a client site so the navbar can never drift from the page. */

export function select(detail: Record<string, string | number>) {
  window.dispatchEvent(new CustomEvent("navbar:select", { detail }));
}

export const services: NavTrayItem[] = [
  { id: "identite-visuelle", title: "Identité visuelle", meta: "BRAND SYSTEM", accent: "#6b4f7e", onSelect: () => select({ type: "service", id: "identite-visuelle" }) },
  { id: "direction-artistique", title: "Direction artistique", meta: "IMAGE DIRECTION", accent: "#c84a4a", onSelect: () => select({ type: "service", id: "direction-artistique" }) },
  { id: "design-creation", title: "Design & création", meta: "PRODUCTION", accent: "#C8942E", onSelect: () => select({ type: "service", id: "design-creation" }) },
  { id: "strategie-marketing", title: "Stratégie marketing", meta: "ACQUISITION", accent: "#A94F16", onSelect: () => select({ type: "service", id: "strategie-marketing" }) },
];

export const portfolio: NavTrayItem[] = [
  { id: "tchin-tchin", title: "Tchin Tchin", meta: "Identité de restaurant", onSelect: () => select({ type: "partner", index: 0 }) },
  { id: "gentle-monster", title: "Gentle Monster", meta: "Éditorial mode", onSelect: () => select({ type: "partner", index: 1 }) },
  { id: "brico-uno", title: "Brico Uno", meta: "Showroom carrelage premium", onSelect: () => select({ type: "partner", index: 2 }) },
  { id: "veil-interface", title: "Veil Interface", meta: "Expérience digitale luxe", onSelect: () => select({ type: "partner", index: 3 }) },
];

export const method: NavTrayItem[] = [
  { id: "analyse", title: "Analyse", meta: "Phase 01", onSelect: () => select({ type: "method", index: 0 }) },
  { id: "langage-visuel", title: "Langage Visuel", meta: "Phase 02", onSelect: () => select({ type: "method", index: 1 }) },
  { id: "creation", title: "Création", meta: "Phase 03", onSelect: () => select({ type: "method", index: 2 }) },
  { id: "deploiement", title: "Déploiement", meta: "Phase 04", onSelect: () => select({ type: "method", index: 3 }) },
];
