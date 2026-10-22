import type { CardTrackConfig, CardTrackCopy, CardTrackItem, Locale } from "./types";

/* Reference config — the only per-site file. A neutral architecture and
   interiors studio ("Atelier Sorel"): its services (ribbon cards), its
   portfolio (portrait cards) and two visit formats. Replace the tracks,
   media and copy; keep the keys. Media paths point at the library showcase
   placeholders and must be replaced by the client's own media. */

export type { Locale };

const MEDIA = "/library/card-track";

const COPY: Record<Locale, CardTrackCopy> = {
  fr: {
    carousel: "carrousel",
    slide: "carte",
    instructions:
      "Faites défiler la page pour parcourir les cartes ; sur écran tactile, balayez la piste. Les flèches gauche et droite, Début et Fin passent d'une carte à l'autre.",
    position: (current, total, title) => `${current} sur ${total} : ${title}`,
    open: (title) => `Voir ${title}`,
    affordance: { pointer: "Voir", touch: "Toucher" },
    loading: "Chargement",
    failed: "Média indisponible",
    retry: "Réessayer",
  },
  en: {
    carousel: "carousel",
    slide: "card",
    instructions:
      "Scroll the page to browse the cards; on touch screens, swipe the track. Left and right arrows, Home and End move between cards.",
    position: (current, total, title) => `${current} of ${total}: ${title}`,
    open: (title) => `View ${title}`,
    affordance: { pointer: "View", touch: "Tap" },
    loading: "Loading",
    failed: "Media unavailable",
    retry: "Retry",
  },
};

type L = Record<Locale, string>;
const pick = (locale: Locale, v: L) => v[locale];

const SERVICES: { id: string; title: L; body: L; tab?: L; src: string; video?: string; position?: string }[] = [
  {
    id: "architecture",
    title: { fr: "Architecture", en: "Architecture" },
    body: {
      fr: "Maisons et extensions dessinées pour leur terrain : implantation, lumière, matières, du premier croquis au permis.",
      en: "Houses and extensions drawn for their site: placement, light, materials, from the first sketch to the permit.",
    },
    src: `${MEDIA}/svc-architecture.webp`,
  },
  {
    id: "interior",
    title: { fr: "Intérieur", en: "Interiors" },
    body: {
      fr: "Des pièces pensées à l'usage : circulation, rangements, éclairage et une palette de matières qui vieillit bien.",
      en: "Rooms shaped around use: circulation, storage, lighting and a palette of materials that ages well.",
    },
    tab: { fr: "Nouveau", en: "New" },
    src: `${MEDIA}/svc-interior.webp`,
    video: `${MEDIA}/svc-interior.mp4`,
  },
  {
    id: "renovation",
    title: { fr: "Rénovation", en: "Renovation" },
    body: {
      fr: "Garder ce qui fait le caractère d'un bâtiment ancien, reprendre le reste : structure, isolation, techniques.",
      en: "Keep what gives an old building its character, rework the rest: structure, insulation, services.",
    },
    src: `${MEDIA}/svc-renovation.webp`,
  },
  {
    id: "furniture",
    title: { fr: "Mobilier sur mesure", en: "Bespoke furniture" },
    body: {
      fr: "Tables, bibliothèques et cuisines dessinées pour le lieu, fabriquées par des ateliers de la région.",
      en: "Tables, bookcases and kitchens designed for the place, made by workshops from the region.",
    },
    src: `${MEDIA}/svc-furniture.webp`,
    video: `${MEDIA}/svc-furniture.mp4`,
  },
];

const PORTFOLIO: { id: string; title: string; meta: L; src: string; video?: string; position?: string }[] = [
  { id: "cerisier", title: "Maison Cerisier", meta: { fr: "Construction neuve — Esneux — 2025", en: "New build — Esneux — 2025" }, src: `${MEDIA}/pf-maison.webp`, video: `${MEDIA}/pf-maison.mp4` },
  { id: "rive", title: "Loft Rive", meta: { fr: "Intérieur — Liège — 2024", en: "Interior — Liège — 2024" }, src: `${MEDIA}/pf-loft.webp` },
  { id: "lac", title: "Pavillon du Lac", meta: { fr: "Pavillon — Robertville — 2024", en: "Pavilion — Robertville — 2024" }, src: `${MEDIA}/pf-pavillon.webp`, video: `${MEDIA}/pf-pavillon.mp4` },
  { id: "ardoise", title: "Café Ardoise", meta: { fr: "Commerce — Namur — 2023", en: "Hospitality — Namur — 2023" }, src: `${MEDIA}/pf-cafe.webp`, video: `${MEDIA}/pf-cafe.mp4` },
  { id: "sheds", title: "Atelier Sheds", meta: { fr: "Rénovation — Verviers — 2023", en: "Renovation — Verviers — 2023" }, src: `${MEDIA}/pf-atelier.webp`, position: "50% 40%" },
];

const VISITS: { id: string; title: L; body: L; tab?: L; src: string }[] = [
  {
    id: "materials",
    title: { fr: "Matériauthèque", en: "Material library" },
    body: {
      fr: "Une heure à l'atelier pour toucher les pierres, bois et enduits avant de choisir.",
      en: "An hour at the studio to handle stones, woods and plasters before choosing.",
    },
    tab: { fr: "Sur rendez-vous", en: "By appointment" },
    src: `${MEDIA}/rv-materials.webp`,
  },
  {
    id: "site",
    title: { fr: "Visite de chantier", en: "Site visit" },
    body: {
      fr: "Un chantier en cours, expliqué sur place : ce qui se décide, quand, et pourquoi.",
      en: "A building site in progress, explained on the spot: what gets decided, when, and why.",
    },
    src: `${MEDIA}/rv-site.webp`,
  },
];

export function buildCardTrackConfig(locale: Locale): CardTrackConfig {
  const services: CardTrackItem[] = SERVICES.map((s) => ({
    id: s.id,
    title: pick(locale, s.title),
    body: pick(locale, s.body),
    tab: s.tab && pick(locale, s.tab),
    media: { src: s.src, video: s.video, playbackRate: 1, position: s.position },
  }));
  const portfolio: CardTrackItem[] = PORTFOLIO.map((p) => ({
    id: p.id,
    title: p.title,
    meta: pick(locale, p.meta),
    media: { src: p.src, video: p.video, position: p.position },
  }));
  const visits: CardTrackItem[] = VISITS.map((v) => ({
    id: v.id,
    title: pick(locale, v.title),
    body: pick(locale, v.body),
    tab: v.tab && pick(locale, v.tab),
    media: { src: v.src },
  }));

  return {
    locale,
    copy: COPY[locale],
    tracks: {
      services: { label: locale === "fr" ? "Services de l'atelier" : "Studio services", variant: "ribbon", ribbon: "light", showIndex: true, items: services },
      portfolio: { label: locale === "fr" ? "Projets réalisés" : "Completed projects", variant: "portrait", showIndex: true, items: portfolio },
      visits: { label: locale === "fr" ? "Formats de visite" : "Visit formats", variant: "ribbon", ribbon: "dark", items: visits },
    },
  };
}
