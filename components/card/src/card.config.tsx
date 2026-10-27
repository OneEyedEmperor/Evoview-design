import type { CardTrackConfig, CardTrackCopy, CardTrackItem, Locale } from "./types";

/* Reference config — the only per-site file. A neutral architecture and
   interiors studio ("Atelier Sorel"): its services (ribbon cards) and its
   portfolio (portrait cards). Replace the tracks,
   media and copy; keep the keys. Media paths point at the library showcase
   placeholders and must be replaced by the client's own media. */

export type { Locale };

const MEDIA = "/library/card";

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

  return {
    locale,
    copy: COPY[locale],
    tracks: {
      services: { label: locale === "fr" ? "Services de l'atelier" : "Studio services", variant: "ribbon", ribbon: "light", showIndex: true, items: services },
      portfolio: { label: locale === "fr" ? "Projets réalisés" : "Completed projects", variant: "portrait", items: portfolio },
    },
  };
}

/* ── CardDeck ─────────────────────────────────────────────────────────────
   The studio's work by category, dealt as a deck. The first category is the
   opening selection: one column per category, two rows (the first row alone
   when the deck shows one row). `more` points at the client's full catalogue. */

type DeckEntry = { id: string; title: L; meta: L; body: L; src: string; video?: string; position?: string };

const DECK_MEDIA = `${MEDIA}/deck`;

const DECK: { id: string; label: L; items: DeckEntry[] }[] = [
  {
    id: "houses",
    label: { fr: "Maisons", en: "Houses" },
    items: [
      { id: "cerisier", title: { fr: "Maison Cerisier", en: "Maison Cerisier" }, meta: { fr: "Construction neuve — Esneux", en: "New build — Esneux" }, body: { fr: "Une maison de pierre posée dans la pente, ouverte sur la vallée par trois baies profondes.", en: "A stone house set into the slope, opening onto the valley through three deep bays." }, src: `${MEDIA}/pf-maison.webp`, video: `${MEDIA}/pf-maison.mp4` },
      { id: "lac", title: { fr: "Pavillon du Lac", en: "Lake Pavilion" }, meta: { fr: "Pavillon — Robertville", en: "Pavilion — Robertville" }, body: { fr: "Un toit sur pilotis au bord de l'eau, pour lire et recevoir dans le paysage.", en: "A roof on stilts at the water's edge, for reading and hosting inside the landscape." }, src: `${MEDIA}/pf-pavillon.webp`, video: `${MEDIA}/pf-pavillon.mp4` },
      { id: "cours", title: { fr: "Maison des Cours", en: "Courtyard House" }, meta: { fr: "Construction neuve — Tongres", en: "New build — Tongeren" }, body: { fr: "De plain-pied autour de deux cours, en brique de récupération et toiture plate.", en: "Single-storey around two courtyards, in reclaimed brick under a flat roof." }, src: `${DECK_MEDIA}/arc-courtyard.webp` },
      { id: "grange", title: { fr: "Grange Haute", en: "High Barn" }, meta: { fr: "Conversion — Durbuy", en: "Conversion — Durbuy" }, body: { fr: "Une grange devenue maison, son pignon entièrement vitré tourné vers le pré.", en: "A barn turned house, its fully glazed gable facing the meadow." }, src: `${DECK_MEDIA}/arc-barn.webp`, position: "50% 60%" },
      { id: "etroite", title: { fr: "Maison Étroite", en: "Narrow House" }, meta: { fr: "Maison de ville — Liège", en: "Townhouse — Liège" }, body: { fr: "Quatre mètres de façade entre deux maisons anciennes, et la lumière jusqu'au rez.", en: "Four metres of frontage between two old houses, with daylight down to the ground floor." }, src: `${DECK_MEDIA}/arc-townhouse.webp` },
      { id: "olivier", title: { fr: "Maison Olivier", en: "Olive House" }, meta: { fr: "Extension — Spa", en: "Extension — Spa" }, body: { fr: "Une aile en enduit à la chaux, alignée sur le vieil olivier du jardin.", en: "A lime-rendered wing, aligned on the garden's old olive tree." }, src: `${MEDIA}/svc-architecture.webp`, position: "30% 50%" },
    ],
  },
  {
    id: "interiors",
    label: { fr: "Intérieurs", en: "Interiors" },
    items: [
      { id: "rive", title: { fr: "Loft Rive", en: "Loft Rive" }, meta: { fr: "Intérieur — Liège", en: "Interior — Liège" }, body: { fr: "Un ancien entrepôt sur la Meuse : une cuisine en chêne sous la verrière d'origine.", en: "A former warehouse on the Meuse: an oak kitchen under the original glass roof." }, src: `${MEDIA}/pf-loft.webp` },
      { id: "ardoise", title: { fr: "Café Ardoise", en: "Café Ardoise" }, meta: { fr: "Commerce — Namur", en: "Hospitality — Namur" }, body: { fr: "Un comptoir en terrazzo de onze mètres et des suspensions dessinées pour le lieu.", en: "An eleven-metre terrazzo counter and pendants designed for the room." }, src: `${MEDIA}/pf-cafe.webp`, video: `${MEDIA}/pf-cafe.mp4` },
      { id: "sauge", title: { fr: "Appartement Sauge", en: "Sage Apartment" }, meta: { fr: "Intérieur — Bruxelles", en: "Interior — Brussels" }, body: { fr: "Un séjour en enduit vert sauge, un canapé bas et rien de plus que nécessaire.", en: "A sage-green plastered living room, a low sofa and nothing more than needed." }, src: `${MEDIA}/svc-interior.webp`, video: `${MEDIA}/svc-interior.mp4`, position: "60% 50%" },
      { id: "calcaire", title: { fr: "Cuisine Calcaire", en: "Limestone Kitchen" }, meta: { fr: "Intérieur — Huy", en: "Interior — Huy" }, body: { fr: "Un îlot en chêne, un plan en pierre bleue adoucie et la fenêtre comme seul décor.", en: "An oak island, a honed bluestone top and the window as the only decoration." }, src: `${DECK_MEDIA}/int-kitchen.webp` },
      { id: "sheds", title: { fr: "Atelier Sheds", en: "Atelier Sheds" }, meta: { fr: "Rénovation — Verviers", en: "Renovation — Verviers" }, body: { fr: "Un atelier textile rendu à la lumière de ses sheds, pour une céramiste.", en: "A textile workshop given back the light of its sawtooth roof, for a ceramicist." }, src: `${MEDIA}/pf-atelier.webp`, position: "50% 40%" },
      { id: "hors-chateau", title: { fr: "Rue Hors-Château", en: "Rue Hors-Château" }, meta: { fr: "Rénovation — Liège", en: "Renovation — Liège" }, body: { fr: "Une maison du XVIIIᵉ remise à nu : poutres, brique et enduits refaits à la chaux.", en: "An 18th-century house stripped back: beams, brick and lime plaster redone." }, src: `${MEDIA}/svc-renovation.webp`, position: "40% 50%" },
    ],
  },
  {
    id: "furniture",
    label: { fr: "Mobilier", en: "Furniture" },
    items: [
      { id: "ferme", title: { fr: "Table de ferme", en: "Farm Table" }, meta: { fr: "Chêne massif — 2,8 m", en: "Solid oak — 2.8 m" }, body: { fr: "Un plateau d'un seul tenant et des tréteaux assemblés sans vis.", en: "A single-piece top on trestles joined without screws." }, src: `${MEDIA}/svc-furniture.webp`, video: `${MEDIA}/svc-furniture.mp4`, position: "45% 50%" },
      { id: "fauteuil", title: { fr: "Fauteuil Frêne", en: "Ash Chair" }, meta: { fr: "Frêne et corde de papier", en: "Ash and paper cord" }, body: { fr: "Un fauteuil bas, l'assise tressée à la main dans l'atelier.", en: "A low lounge chair, its seat woven by hand in the workshop." }, src: `${DECK_MEDIA}/fur-chair.webp` },
      { id: "bibliotheque", title: { fr: "Bibliothèque Échelle", en: "Ladder Bookcase" }, meta: { fr: "Chêne — sur mesure", en: "Oak — made to measure" }, body: { fr: "Du sol au plafond dans l'alcôve, avec son échelle coulissante.", en: "Floor to ceiling in the alcove, with its sliding ladder." }, src: `${DECK_MEDIA}/fur-bookcase.webp` },
      { id: "banc", title: { fr: "Banc d'entrée", en: "Hall Bench" }, meta: { fr: "Chêne massif", en: "Solid oak" }, body: { fr: "Un banc long et une table basse pour poser ce qu'on rapporte du dehors.", en: "A long bench and a low table for what comes in from outside." }, src: `${DECK_MEDIA}/fur-bench.webp` },
      { id: "buffet", title: { fr: "Buffet Cannelé", en: "Fluted Sideboard" }, meta: { fr: "Noyer", en: "Walnut" }, body: { fr: "Des portes cannelées taillées dans la masse, une poignée creusée.", en: "Fluted doors cut from the solid, a carved pull." }, src: `${DECK_MEDIA}/fur-cabinet.webp` },
      { id: "lampadaire", title: { fr: "Lampadaire Plissé", en: "Pleated Lamp" }, meta: { fr: "Tilleul et lin", en: "Lime wood and linen" }, body: { fr: "Un pied tourné et un abat-jour plissé à la main, pour la lumière du soir.", en: "A turned stem and a hand-pleated shade, for evening light." }, src: `${DECK_MEDIA}/fur-lamp.webp` },
    ],
  },
];

const DECK_COPY: Record<Locale, Pick<import("./types").CardDeckCopy, "instructions" | "showing">> = {
  fr: {
    instructions: "Balayez la rangée pour parcourir les cartes de la catégorie.",
    showing: (category, count) => `${category} : ${count} projets`,
  },
  en: {
    instructions: "Swipe the row to browse the category's cards.",
    showing: (category, count) => `${category}: ${count} projects`,
  },
};

export function buildCardDeckConfig(locale: Locale): import("./types").CardDeckConfig {
  const toItem = (e: DeckEntry): CardTrackItem => ({
    id: e.id,
    title: pick(locale, e.title),
    meta: pick(locale, e.meta),
    body: pick(locale, e.body),
    media: { src: e.src, video: e.video, position: e.position },
  });
  const categories = DECK.map((c) => ({ id: c.id, label: pick(locale, c.label), items: c.items.map(toItem) }));
  // Opening selection: row 1 = each category's first item, row 2 = each one's second.
  const selection = [0, 1].flatMap((row) => categories.map((c) => c.items[row]).filter((item): item is CardTrackItem => !!item));

  return {
    locale,
    copy: { ...COPY[locale], ...DECK_COPY[locale] },
    deck: {
      label: locale === "fr" ? "Travaux de l'atelier" : "Studio work",
      switchLabel: locale === "fr" ? "Catégorie" : "Category",
      categories: [{ id: "selection", label: locale === "fr" ? "Sélection" : "Selection", items: selection }, ...categories],
      more: { label: locale === "fr" ? "Tous les projets" : "Every project", href: "/projets" },
    },
  };
}
/* ── /CardDeck ────────────────────────────────────────────────────────── */

/* ── CardSequence (card-sequence block) ─────────────────────────────────
   Timed focus over video cards. `home`: the studio's consultation visit as a
   board (two clips, facts, price, one action). `page`: its delivered places
   as a gallery row. Card links are the client's own destinations. */

import type { CardSequenceClip, CardSequenceConfig, CardSequenceCopy } from "./types";

const SEQUENCE_COPY: Record<Locale, CardSequenceCopy> = {
  fr: { newTab: "(nouvel onglet)", loading: "Chargement", failed: "Média indisponible", retry: "Réessayer" },
  en: { newTab: "(new tab)", loading: "Loading", failed: "Media unavailable", retry: "Retry" },
};

type SequenceClipSource = Omit<CardSequenceClip, "meta"> & { meta: L };

const SEQUENCE_CLIPS: Record<string, SequenceClipSource> = {
  cerisier: { id: "cerisier", title: "Maison Cerisier", meta: { fr: "Construction neuve, Esneux", en: "New build, Esneux" }, poster: `${MEDIA}/pf-maison.webp`, video: `${MEDIA}/pf-maison.mp4`, href: "/projets/maison-cerisier" },
  lac: { id: "lac", title: "Pavillon du Lac", meta: { fr: "Pavillon, Robertville", en: "Pavilion, Robertville" }, poster: `${MEDIA}/pf-pavillon.webp`, video: `${MEDIA}/pf-pavillon.mp4`, href: "/projets/pavillon-du-lac" },
  ardoise: { id: "ardoise", title: "Café Ardoise", meta: { fr: "Commerce, Namur", en: "Hospitality, Namur" }, poster: `${MEDIA}/pf-cafe.webp`, video: `${MEDIA}/pf-cafe.mp4`, href: "/projets/cafe-ardoise" },
  rive: { id: "rive", title: "Loft Rive", meta: { fr: "Intérieur, Liège", en: "Interior, Liège" }, poster: `${MEDIA}/svc-interior.webp`, video: `${MEDIA}/svc-interior.mp4`, position: "62% 50%", href: "/projets/loft-rive" },
};

const sequenceClip = (locale: Locale, id: string): CardSequenceClip => {
  const c = SEQUENCE_CLIPS[id];
  return { ...c, meta: pick(locale, c.meta) };
};

export function buildCardSequenceConfig(locale: Locale): CardSequenceConfig {
  const fr = locale === "fr";
  return {
    locale,
    copy: SEQUENCE_COPY[locale],
    sequences: {
      home: {
        title: fr ? "La visite conseil" : "The site visit",
        lead: fr
          ? "Deux heures sur place avec un architecte de l'atelier : on lit le lieu, on parle usage et budget."
          : "Two hours on site with one of the studio's architects: we read the place, then talk use and budget.",
        clips: [sequenceClip(locale, "cerisier"), sequenceClip(locale, "rive")],
        facts: fr
          ? [
              { title: "Sur place", body: "Lumière, structure et contraintes se lisent mieux sur le terrain que sur un plan." },
              { title: "Esquisse remise", body: "Un premier plan dessiné à la main et une fourchette de budget, sous huit jours." },
              { title: "Toute la province", body: "Liège, Namur, Ardennes : l'atelier se déplace dans toute la province." },
            ]
          : [
              { title: "On site", body: "Light, structure and constraints read better on the ground than on a drawing." },
              { title: "Sketch delivered", body: "A first hand-drawn plan and a budget range, within eight days." },
              { title: "Across the province", body: "Liège, Namur, the Ardennes: the studio travels across the province." },
            ],
        offer: {
          value: "240 €",
          unit: fr ? "la visite de deux heures" : "for the two-hour visit",
          note: fr ? "Déduite des honoraires si le projet se poursuit." : "Deducted from the fee if the project goes ahead.",
          action: { label: fr ? "Réserver une visite" : "Book a visit", href: "/rendez-vous" },
        },
        ratio: "2 / 3",
      },
      page: {
        title: fr ? "Habiter nos lieux" : "Living in our places",
        accent: fr ? "lieux" : "places",
        lead: fr ? "Quatre lieux livrés, filmés tels qu'on les vit." : "Four delivered places, filmed as they are lived in.",
        clips: ["cerisier", "lac", "ardoise", "rive"].map((id) => sequenceClip(locale, id)),
        ratio: "2 / 3",
      },
    },
  };
}
/* ── end CardSequence ─────────────────────────────────────────────────── */
