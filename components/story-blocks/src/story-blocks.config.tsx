/* Per-site file: labels of the story blocks and the reference stories.
   The reference is a fictional winery (Domaine Valcourt): a full story on a
   dark page (`harvest`: intro → sequence beside its proof → proof collage →
   payoff) and a short close for a light page (`visit`: timed sequence →
   payoff). Replace copy, media and the CTA destination; keep the shapes
   (one title per story, 2–3 line statements, one CTA). Media URLs point to
   the library's public folder. */

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
        lead: "Chaque bouteille du Domaine Valcourt vient du même coteau calcaire, taillé à la main depuis trois générations.",
        media: { src: `${MEDIA}/hero.webp`, alt: "Rangs de vigne sur un coteau au coucher du soleil, une ferme en pierre au loin", position: "50% 60%", positionPhone: "38% 50%" },
        caption: { kicker: "Coteau nord", title: "Les vieilles vignes, une heure avant la récolte" },
      },
      {
        kind: "rows",
        heading: ["De la vigne", "au verre."],
        rows: [
          { label: "Taille", detail: "En hiver, un bourgeon par sarment, pour des grappes rares et concentrées." },
          { label: "Vendange", detail: "À la main, en cagettes de 12 kg, triées au bout du rang." },
          { label: "Élevage", detail: "Dix-huit mois en fûts de chêne déjà utilisés, pour garder le fruit." },
          { label: "Mise", detail: "Sans filtration, puis un an de repos en cave avant la vente." },
        ],
        media: { src: `${MEDIA}/hands.webp`, alt: "Mains tenant une grappe de raisin noir au-dessus d'une cagette", position: "50% 45%", ratio: 1.25, ratioPhone: 1 },
      },
      {
        kind: "proof",
        headingAt: "end",
        heading: ["Le domaine,", "tel qu'il est."],
        body: "Le chai, le sol, la bouteille et la table : tout se visite.",
        items: [
          { media: { src: `${MEDIA}/cellar.webp`, alt: "Fûts de chêne alignés dans une cave voûtée" }, ratio: 1.5, caption: "Le chai voûté, creusé sous la maison." },
          { media: { src: `${MEDIA}/soil.webp`, alt: "Sol calcaire caillouteux au pied d'un vieux cep" }, ratio: 0.8, caption: "Le calcaire affleure à trente centimètres." },
          { media: { src: `${MEDIA}/bottle.webp`, alt: "Bouteille sans étiquette et verre de vin rouge sur une table en bois", position: "50% 60%" }, ratio: 0.8, caption: "Le 2026, avant son étiquette." },
          { media: { src: `${MEDIA}/tasting.webp`, alt: "Longue table de dégustation avec six verres vides dans une salle en pierre", position: "50% 55%" }, ratio: 1.5, caption: "La salle de dégustation, dressée pour six." },
        ],
      },
      {
        kind: "payoff",
        lines: ["Venez goûter.", "Le millésime attend."],
        accentLine: 1,
        lead: "Le coteau, le chai, puis six cuvées dégustées avec le vigneron.",
        results: [
          { title: "90 minutes", detail: "Coteau, chai et dégustation." },
          { title: "6 cuvées", detail: "Dont deux tirées du fût." },
          { title: "12 personnes", detail: "Au plus, par groupe." },
        ],
        cta: { label: "Réserver une dégustation", href: "/reservation" },
      },
    ],
    visit: [
      {
        kind: "rows",
        heading: ["Un après-midi,", "quatre temps."],
        body: "Du jeudi au samedi, départs à 14 h et à 16 h 30.",
        rows: [
          { index: "14:00", label: "Accueil", detail: "Au chai, avec un verre de blanc de l'année." },
          { index: "14:15", label: "Coteau", detail: "Vingt minutes à pied entre les rangs ; chaussures fermées conseillées." },
          { index: "14:45", label: "Cave", detail: "Les fûts, la mise et la bibliothèque des anciens millésimes." },
          { index: "15:15", label: "Table", detail: "Six cuvées, du pain et le fromage de la ferme voisine." },
        ],
      },
      {
        kind: "payoff",
        lines: ["Une table pour six.", "Un jeudi, peut-être."],
        lead: "25 € par personne, déduits de tout achat. Le domaine confirme dans la journée.",
        cta: { label: "Réserver la visite", href: "/reservation" },
      },
    ],
  },
  en: {
    harvest: [
      {
        kind: "intro",
        title: ["One plot.", "One vintage."],
        lead: "Every bottle from Domaine Valcourt comes from the same limestone slope, pruned by hand for three generations.",
        media: { src: `${MEDIA}/hero.webp`, alt: "Rows of vines on a hillside at sunset, a stone farmhouse in the distance", position: "50% 60%", positionPhone: "38% 50%" },
        caption: { kicker: "North slope", title: "The old vines, an hour before picking" },
      },
      {
        kind: "rows",
        heading: ["From the vine", "to the glass."],
        rows: [
          { label: "Pruning", detail: "In winter, one bud per cane, for scarce and concentrated bunches." },
          { label: "Harvest", detail: "By hand, in 12 kg crates, sorted at the end of the row." },
          { label: "Ageing", detail: "Eighteen months in seasoned oak barrels, to keep the fruit." },
          { label: "Bottling", detail: "Unfiltered, then a year of rest in the cellar before release." },
        ],
        media: { src: `${MEDIA}/hands.webp`, alt: "Hands holding a bunch of black grapes over a crate", position: "50% 45%", ratio: 1.25, ratioPhone: 1 },
      },
      {
        kind: "proof",
        headingAt: "end",
        heading: ["The estate,", "as it is."],
        body: "The cellar, the soil, the bottle and the table: all of it can be visited.",
        items: [
          { media: { src: `${MEDIA}/cellar.webp`, alt: "Oak barrels lined up in a vaulted cellar" }, ratio: 1.5, caption: "The vaulted cellar, dug under the house." },
          { media: { src: `${MEDIA}/soil.webp`, alt: "Stony limestone soil at the foot of an old vine" }, ratio: 0.8, caption: "Limestone, thirty centimetres down." },
          { media: { src: `${MEDIA}/bottle.webp`, alt: "Unlabelled bottle and a glass of red wine on a wooden table", position: "50% 60%" }, ratio: 0.8, caption: "The 2026, before its label." },
          { media: { src: `${MEDIA}/tasting.webp`, alt: "Long tasting table with six empty glasses in a stone room", position: "50% 55%" }, ratio: 1.5, caption: "The tasting room, set for six." },
        ],
      },
      {
        kind: "payoff",
        lines: ["Come and taste.", "The vintage is waiting."],
        accentLine: 1,
        lead: "The slope, the cellar, then six wines tasted with the winemaker.",
        results: [
          { title: "90 minutes", detail: "Slope, cellar and tasting." },
          { title: "6 wines", detail: "Two of them drawn from the barrel." },
          { title: "12 guests", detail: "At most, per group." },
        ],
        cta: { label: "Book a tasting", href: "/reservation" },
      },
    ],
    visit: [
      {
        kind: "rows",
        heading: ["One afternoon,", "four moments."],
        body: "Thursday to Saturday, departures at 14:00 and 16:30.",
        rows: [
          { index: "14:00", label: "Welcome", detail: "In the winery, with a glass of this year's white." },
          { index: "14:15", label: "Slope", detail: "Twenty minutes on foot between the rows; closed shoes advised." },
          { index: "14:45", label: "Cellar", detail: "The barrels, the bottling line and the library of old vintages." },
          { index: "15:15", label: "Table", detail: "Six wines, bread and cheese from the neighbouring farm." },
        ],
      },
      {
        kind: "payoff",
        lines: ["A table for six.", "A Thursday, perhaps."],
        lead: "€25 per guest, deducted from any purchase. The estate confirms the same day.",
        cta: { label: "Book the visit", href: "/reservation" },
      },
    ],
  },
};

/** Language used when no copy is passed to <Story>. */
export const defaultStoryBlocksLocale: Locale = "fr";

export function buildStoryBlocksConfig(locale: Locale): StoryBlocksConfig {
  return { locale, copy: COPY[locale], stories: STORIES[locale] };
}
