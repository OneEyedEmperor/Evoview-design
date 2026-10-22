import type { Localized } from "./locale";

export type Category = "layouts" | "components" | "navbar";
export type Status = "ready" | "building";

export type RegistryEntry = {
  /** Also the package folder name under `components/`. */
  id: string;
  category: Category;
  route: string;
  title: Localized;
  /** One line: what the entry is. */
  meta: Localized;
  status: Status;
  /** From `components/<id>/VERSION` once the package exists. */
  version?: string;
};

const VERSIONS = import.meta.glob<string>("../../components/*/VERSION", { query: "?raw", import: "default", eager: true });
const versionOf = (id: string) => VERSIONS[`../../components/${id}/VERSION`]?.trim() || undefined;

type Draft = Omit<RegistryEntry, "version">;

const DRAFTS: Draft[] = [
  {
    id: "chapter",
    category: "layouts",
    route: "/layouts/chapter",
    title: { fr: "Chapitre", en: "Chapter" },
    meta: { fr: "Coque de section, titres et coupes de ton", en: "Section shell, headings and tone cuts" },
    status: "ready",
  },
  {
    id: "card-track",
    category: "layouts",
    route: "/layouts/card-track",
    title: { fr: "Piste de cartes", en: "Card track" },
    meta: { fr: "Carte média et piste pilotée au défilement", en: "Media card and scroll-scrubbed track" },
    status: "ready",
  },
  {
    id: "process-sequence",
    category: "layouts",
    route: "/layouts/process-sequence",
    title: { fr: "Séquence de processus", en: "Process sequence" },
    meta: { fr: "Tableau d'étapes minuté", en: "Timed step board" },
    status: "building",
  },
  {
    id: "story-blocks",
    category: "layouts",
    route: "/layouts/story-blocks",
    title: { fr: "Blocs de récit", en: "Story blocks" },
    meta: { fr: "Intro, rangs indexés, preuves, bandeau final", en: "Intro split, indexed rows, proof grid, payoff" },
    status: "building",
  },
  {
    id: "reservation",
    category: "components",
    route: "/components/reservation",
    title: { fr: "Réservation", en: "Reservation" },
    meta: { fr: "Réservation en étapes, à l'accent du client", en: "Stepped booking in the client's accent" },
    status: "ready",
  },
  {
    id: "dossier",
    category: "components",
    route: "/components/dossier",
    title: { fr: "Dossier", en: "Dossier" },
    meta: { fr: "Modale portail, sélection, bande de chapitres", en: "Portal modal, board, chapter strip" },
    status: "building",
  },
  {
    id: "selector-stage",
    category: "components",
    route: "/components/selector-stage",
    title: { fr: "Sélecteur et scène", en: "Selector stage" },
    meta: { fr: "Sélecteur ↔ scène, comparaison avant/après", en: "Selector ↔ stage, before/after compare" },
    status: "ready",
  },
  {
    id: "controls",
    category: "components",
    route: "/components/controls",
    title: { fr: "Contrôles", en: "Controls" },
    meta: { fr: "Boutons, puces, champs, progression, interrupteur", en: "Buttons, chips, fields, progress, switch" },
    status: "ready",
  },
  {
    id: "navbar",
    category: "navbar",
    route: "/navbar",
    title: { fr: "Navbar", en: "Navbar" },
    meta: { fr: "Capsule finder, bureau et mobile, plateaux de cartes", en: "Finder capsule, desktop and mobile, cover-card trays" },
    status: "ready",
  },
];

export const REGISTRY: RegistryEntry[] = DRAFTS.map((d) => ({ ...d, version: versionOf(d.id) }));

export const CATEGORY_LABEL: Record<Category, Localized> = {
  layouts: { fr: "Layouts", en: "Layouts" },
  components: { fr: "Composants", en: "Components" },
  navbar: { fr: "Navbar", en: "Navbar" },
};

export const CATEGORY_ROUTE: Record<Category, string> = {
  layouts: "/layouts",
  components: "/components",
  navbar: "/navbar",
};

export const entriesOf = (category: Category) => REGISTRY.filter((e) => e.category === category);

export function getEntry(id: string): RegistryEntry {
  const entry = REGISTRY.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown library entry "${id}"`);
  return entry;
}

/** 1-based position inside its category and the category size. */
export function positionOf(entry: RegistryEntry): { index: number; total: number } {
  const siblings = entriesOf(entry.category);
  return { index: siblings.indexOf(entry) + 1, total: siblings.length };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
