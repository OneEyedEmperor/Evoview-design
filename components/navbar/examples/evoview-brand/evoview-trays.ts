import type { NavTrayItem } from "../../src/types";
import serviceBranding from "./covers/service-branding.webp";
import serviceVision from "./covers/service-vision.webp";
import serviceDesign from "./covers/service-design.webp";
import serviceStrategie from "./covers/service-strategie.webp";
import partnerTchin from "./covers/partner-tchin-tchin.webp";
import partnerGentle from "./covers/partner-gentle-monster.webp";
import partnerBrico from "./covers/partner-brico-uno.webp";
import partnerVeil from "./covers/partner-veil-interface.webp";
import methodAnalyse from "./covers/method-analyse.webp";
import methodLangage from "./covers/method-langage.webp";
import methodCreation from "./covers/method-creation.webp";
import methodDeploiement from "./covers/method-deploiement.webp";

/* Tray contents of the evoview.be example. Loaded lazily by the config so
   this copy stays off the critical path. On the real site these arrays are
   projected from the data modules the sections themselves consume; keep that
   pattern on a client site so the navbar can never drift from the page.

   Covers are 900×216 banner crops of each entry's own artwork (a service's
   dossier art, a project's hero, a frame of a phase's card video). */

export function select(detail: Record<string, string | number>) {
  window.dispatchEvent(new CustomEvent("navbar:select", { detail }));
}

export const services: NavTrayItem[] = [
  { id: "identite-visuelle", title: "Identité visuelle", meta: "BRAND SYSTEM", accent: "#6b4f7e", cover: serviceBranding, onSelect: () => select({ type: "service", id: "identite-visuelle" }) },
  { id: "direction-artistique", title: "Direction artistique", meta: "IMAGE DIRECTION", accent: "#c84a4a", cover: serviceVision, onSelect: () => select({ type: "service", id: "direction-artistique" }) },
  { id: "design-creation", title: "Design & création", meta: "PRODUCTION", accent: "#C8942E", cover: serviceDesign, onSelect: () => select({ type: "service", id: "design-creation" }) },
  { id: "strategie-marketing", title: "Stratégie marketing", meta: "ACQUISITION", accent: "#A94F16", cover: serviceStrategie, onSelect: () => select({ type: "service", id: "strategie-marketing" }) },
];

export const portfolio: NavTrayItem[] = [
  { id: "tchin-tchin", title: "Tchin Tchin", meta: "Identité de restaurant", cover: partnerTchin, onSelect: () => select({ type: "partner", index: 0 }) },
  { id: "gentle-monster", title: "Gentle Monster", meta: "Éditorial mode", cover: partnerGentle, onSelect: () => select({ type: "partner", index: 1 }) },
  { id: "brico-uno", title: "Brico Uno", meta: "Showroom carrelage premium", cover: partnerBrico, onSelect: () => select({ type: "partner", index: 2 }) },
  { id: "veil-interface", title: "Veil Interface", meta: "Expérience digitale luxe", cover: partnerVeil, onSelect: () => select({ type: "partner", index: 3 }) },
];

export const method: NavTrayItem[] = [
  { id: "analyse", title: "Analyse", meta: "Phase 01", cover: methodAnalyse, onSelect: () => select({ type: "method", index: 0 }) },
  { id: "langage-visuel", title: "Langage Visuel", meta: "Phase 02", cover: methodLangage, onSelect: () => select({ type: "method", index: 1 }) },
  { id: "creation", title: "Création", meta: "Phase 03", cover: methodCreation, onSelect: () => select({ type: "method", index: 2 }) },
  { id: "deploiement", title: "Déploiement", meta: "Phase 04", cover: methodDeploiement, onSelect: () => select({ type: "method", index: 3 }) },
];
