/* Per-site file: labels of the story blocks and the reference stories.
   The reference is a fictional winery (Domaine Valcourt) told twice: a dark
   harvest story and a paper visit story. Replace copy, media and the CTA
   destination; keep the shapes (one title per story, 2–3 line statements,
   three pillars, one CTA). Media URLs point to the library's public folder. */

import type { StoryChapter } from "./types";

export type Locale = "fr" | "en";

export type StoryBlocksCopy = {
  /** Shown in a media well when the image is still decoding after 350ms. */
  mediaLoading: string;
  mediaFailed: string;
  retry: string;
};

export type StoryBlocksConfig = {
  locale: Locale;
  copy: StoryBlocksCopy;
  stories: { harvest: StoryChapter[]; visit: StoryChapter[] };
};

const MEDIA = "/library/story-blocks";

const COPY: Record<Locale, StoryBlocksCopy> = {
  fr: { mediaLoading: "Chargement de l'image…", mediaFailed: "Image indisponible", retry: "Réessayer" },
  en: { mediaLoading: "Loading image…", mediaFailed: "Image unavailable", retry: "Retry" },
};

const STORIES: Record<Locale, StoryBlocksConfig["stories"]> = {
  fr: {
    harvest: [
      {
        kind: "intro",
        title: ["Une parcelle.", "Un millésime."],
        lead: "Au Domaine Valcourt, chaque bouteille commence sur le même coteau calcaire, taillé à la main depuis trois générations.",
        body: "Le millésime 2026 a mûri lentement : un été sec, des nuits fraîches, une vendange début octobre.",
        media: { src: `${MEDIA}/hero.webp`, alt: "Rangs de vigne sur un coteau au coucher du soleil, une ferme en pierre au loin", position: "50% 60%", positionPhone: "38% 50%" },
        caption: { kicker: "Coteau nord · parcelle 03", title: "Les vieilles vignes, une heure avant la récolte" },
      },
      {
        kind: "rows",
        heading: ["De la vigne", "au verre."],
        body: "Quatre gestes, toujours dans le même ordre. Aucun n'est confié à une machine.",
        rows: [
          { label: "Taille", detail: "En hiver, un bourgeon par sarment, pour des grappes rares et concentrées." },
          { label: "Vendange", detail: "À la main, en cagettes de 12 kg, triées au bout du rang." },
          { label: "Élevage", detail: "Dix-huit mois en fûts de chêne déjà utilisés, pour garder le fruit." },
          { label: "Mise", detail: "Sans filtration, puis un an de repos en cave avant la vente." },
        ],
      },
      {
        kind: "proof",
        heading: ["Ce qui reste", "de l'année."],
        body: "Quatre traces d'un millésime, de la terre au verre.",
        items: [
          { media: { src: `${MEDIA}/hands.webp`, alt: "Mains tenant une grappe de raisin noir au-dessus d'une cagette", position: "50% 45%" }, ratio: 1.08, label: "La récolte", qualifier: "Cagette 12 kg" },
          { media: { src: `${MEDIA}/soil.webp`, alt: "Sol calcaire caillouteux au pied d'un vieux cep" }, ratio: 0.8, label: "Le sol", qualifier: "Calcaire" },
          { media: { src: `${MEDIA}/bottle.webp`, alt: "Bouteille sans étiquette et verre de vin rouge sur une table en bois", position: "50% 60%" }, ratio: 0.8, label: "Le verre", qualifier: "Sans filtration" },
          { media: { src: `${MEDIA}/cellar.webp`, alt: "Fûts de chêne alignés dans une cave voûtée" }, ratio: 1.33, label: "Le chai", qualifier: "18 mois" },
        ],
        note: ["Une année tient", "en quatre images."],
      },
      {
        kind: "payoff",
        lines: ["Venez goûter.", "Le millésime attend."],
        accentLine: 1,
        lead: "Une visite du coteau et du chai, puis six cuvées dégustées avec le vigneron.",
        results: [
          { title: "90 minutes", detail: "Coteau, chai et dégustation." },
          { title: "6 cuvées", detail: "Dont deux tirées du fût." },
          { title: "12 personnes", detail: "Au plus, par groupe." },
        ],
        cta: { label: "Réserver une dégustation", consequence: "Ouvre la réservation", href: "/reservation" },
      },
    ],
    visit: [
      {
        kind: "intro",
        title: ["La visite", "du domaine."],
        lead: "Un après-midi au rythme de la maison : le coteau, la cave, puis la table.",
        body: "Du jeudi au samedi, sur réservation, en français ou en anglais.",
        media: { src: `${MEDIA}/tasting.webp`, alt: "Longue table de dégustation avec six verres vides dans une salle en pierre", position: "50% 55%", positionPhone: "62% 50%" },
        caption: { kicker: "Salle de dégustation · 14 h", title: "La table est dressée pour six" },
        align: "start",
      },
      {
        kind: "rows",
        layout: "full",
        heading: ["Un après-midi,", "quatre temps."],
        body: "La visite suit le chemin du raisin. Comptez une heure et demie.",
        rows: [
          { label: "Accueil", detail: "Au chai, avec un verre de blanc de l'année." },
          { label: "Coteau", detail: "Vingt minutes à pied entre les rangs ; chaussures fermées conseillées." },
          { label: "Cave", detail: "Les fûts, la mise et la bibliothèque des anciens millésimes." },
          { label: "Table", detail: "Six cuvées, du pain et le fromage de la ferme voisine." },
        ],
      },
      {
        kind: "pillars",
        heading: ["Trois choses", "qui restent."],
        pillars: [
          { label: "Sol", heading: "Un seul coteau", copy: "Toutes les cuvées viennent des onze hectares qui entourent la maison." },
          { label: "Climat", heading: "Une maturité lente", copy: "Des journées chaudes et des nuits fraîches gardent l'acidité du raisin." },
          { label: "Main", heading: "Rien à la machine", copy: "Taille, vendange et tri se font à la main depuis trois générations." },
        ],
      },
      {
        kind: "payoff",
        lines: ["Une table pour six.", "Un jeudi, peut-être."],
        lead: "Choisissez un créneau ; le domaine confirme dans la journée.",
        results: [
          { title: "Jeudi au samedi", detail: "Départs à 14 h et 16 h 30." },
          { title: "25 € par personne", detail: "Déduits de tout achat." },
          { title: "Français · anglais", detail: "Visite dans les deux langues." },
        ],
        cta: { label: "Réserver la visite", consequence: "Ouvre la réservation", href: "/reservation" },
      },
    ],
  },
  en: {
    harvest: [
      {
        kind: "intro",
        title: ["One plot.", "One vintage."],
        lead: "At Domaine Valcourt, every bottle starts on the same limestone slope, pruned by hand for three generations.",
        body: "The 2026 vintage ripened slowly: a dry summer, cool nights, a harvest in early October.",
        media: { src: `${MEDIA}/hero.webp`, alt: "Rows of vines on a hillside at sunset, a stone farmhouse in the distance", position: "50% 60%", positionPhone: "38% 50%" },
        caption: { kicker: "North slope · plot 03", title: "The old vines, an hour before picking" },
      },
      {
        kind: "rows",
        heading: ["From the vine", "to the glass."],
        body: "Four gestures, always in the same order. None of them is left to a machine.",
        rows: [
          { label: "Pruning", detail: "In winter, one bud per cane, for scarce and concentrated bunches." },
          { label: "Harvest", detail: "By hand, in 12 kg crates, sorted at the end of the row." },
          { label: "Ageing", detail: "Eighteen months in seasoned oak barrels, to keep the fruit." },
          { label: "Bottling", detail: "Unfiltered, then a year of rest in the cellar before release." },
        ],
      },
      {
        kind: "proof",
        heading: ["What the year", "leaves behind."],
        body: "Four traces of a vintage, from the soil to the glass.",
        items: [
          { media: { src: `${MEDIA}/hands.webp`, alt: "Hands holding a bunch of black grapes over a crate", position: "50% 45%" }, ratio: 1.08, label: "The harvest", qualifier: "12 kg crate" },
          { media: { src: `${MEDIA}/soil.webp`, alt: "Stony limestone soil at the foot of an old vine" }, ratio: 0.8, label: "The soil", qualifier: "Limestone" },
          { media: { src: `${MEDIA}/bottle.webp`, alt: "Unlabelled bottle and a glass of red wine on a wooden table", position: "50% 60%" }, ratio: 0.8, label: "The glass", qualifier: "Unfiltered" },
          { media: { src: `${MEDIA}/cellar.webp`, alt: "Oak barrels lined up in a vaulted cellar" }, ratio: 1.33, label: "The cellar", qualifier: "18 months" },
        ],
        note: ["A year fits", "in four pictures."],
      },
      {
        kind: "payoff",
        lines: ["Come and taste.", "The vintage is waiting."],
        accentLine: 1,
        lead: "A walk through the slope and the cellar, then six wines tasted with the winemaker.",
        results: [
          { title: "90 minutes", detail: "Slope, cellar and tasting." },
          { title: "6 wines", detail: "Two of them drawn from the barrel." },
          { title: "12 guests", detail: "At most, per group." },
        ],
        cta: { label: "Book a tasting", consequence: "Opens the booking", href: "/reservation" },
      },
    ],
    visit: [
      {
        kind: "intro",
        title: ["Visiting", "the estate."],
        lead: "An afternoon at the pace of the house: the slope, the cellar, then the table.",
        body: "Thursday to Saturday, by booking, in French or English.",
        media: { src: `${MEDIA}/tasting.webp`, alt: "Long tasting table with six empty glasses in a stone room", position: "50% 55%", positionPhone: "62% 50%" },
        caption: { kicker: "Tasting room · 2 pm", title: "The table is set for six" },
        align: "start",
      },
      {
        kind: "rows",
        layout: "full",
        heading: ["One afternoon,", "four moments."],
        body: "The visit follows the path of the grape. Allow an hour and a half.",
        rows: [
          { label: "Welcome", detail: "In the winery, with a glass of this year's white." },
          { label: "Slope", detail: "Twenty minutes on foot between the rows; closed shoes advised." },
          { label: "Cellar", detail: "The barrels, the bottling line and the library of old vintages." },
          { label: "Table", detail: "Six wines, bread and cheese from the neighbouring farm." },
        ],
      },
      {
        kind: "pillars",
        heading: ["Three things", "that stay."],
        pillars: [
          { label: "Soil", heading: "A single slope", copy: "Every wine comes from the eleven hectares around the house." },
          { label: "Climate", heading: "Slow ripening", copy: "Warm days and cool nights keep the grapes' acidity." },
          { label: "Hand", heading: "Nothing by machine", copy: "Pruning, picking and sorting have been done by hand for three generations." },
        ],
      },
      {
        kind: "payoff",
        lines: ["A table for six.", "A Thursday, perhaps."],
        lead: "Pick a slot; the estate confirms the same day.",
        results: [
          { title: "Thursday to Saturday", detail: "Departures at 2 pm and 4:30 pm." },
          { title: "€25 per guest", detail: "Deducted from any purchase." },
          { title: "French · English", detail: "Tours in both languages." },
        ],
        cta: { label: "Book the visit", consequence: "Opens the booking", href: "/reservation" },
      },
    ],
  },
};

/** Language used when no copy is passed to <Story>. */
export const defaultStoryBlocksLocale: Locale = "fr";

export function buildStoryBlocksConfig(locale: Locale): StoryBlocksConfig {
  return { locale, copy: COPY[locale], stories: STORIES[locale] };
}
