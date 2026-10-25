/* Per-site file: the dossier's items, entries, detail chapters, chrome copy
   and attribution. Reference content: "Maison Ardoise", a fictional
   restaurant (three universes × four experiences). Replace the content, keep
   the shape. Media paths point at the library's public placeholders. */

import { EVOVIEW_URL } from "../foundation";
import { PrimaryPlate } from "../controls";
import { ChapterFigure, ChapterHead, ChapterPayoff, ChapterRows, ChapterSpecimen, ChapterSplit, DossierChapter } from "./Chapters";
import type { DossierConfig, DossierCopy, DossierItem, Locale } from "./types";

type L = Record<Locale, string>;
type Rows = Record<Locale, [string, string][]>;

const COPY: Record<Locale, DossierCopy> = {
  fr: {
    close: "Fermer",
    closeDossier: "Fermer le dossier",
    overview: "Sommaire",
    overviewOf: (item) => `Sommaire : ${item}`,
    itemsNav: "Navigation entre les univers",
    entriesNav: "Expériences de cet univers",
    itemLocation: (i, n, label) => `Univers ${i} sur ${n} : ${label}`,
    entryLocation: (i, n, label) => `Expérience ${i} sur ${n} : ${label}`,
    previousItem: (label) => `Univers précédent : ${label}`,
    nextItem: (label) => `Univers suivant : ${label}`,
    nextEntry: (label) => `Expérience suivante : ${label}`,
    openEntry: (i, n, title) => `Ouvrir l'expérience ${i} sur ${n} : ${title}`,
    boardHeading: (item) => `${item} — choisissez une expérience`,
    backTo: (item) => `Retour au sommaire : ${item}`,
    overviewTitle: (i, label) => `Dossier ${String(i).padStart(2, "0")} · ${label}`,
    toastNext: "Expérience suivante",
    toastEnd: "Univers suivant",
    toastBack: "Retour au sommaire",
    dock: { home: "Sommaire", previous: "Préc.", next: "Suivant", item: "Univers" },
    loader: {
      overviewKicker: (i) => `Dossier ${String(i).padStart(2, "0")}`,
      detailKicker: (i) => `Expérience ${String(i).padStart(2, "0")}`,
      title: "Préparation",
      status: "Décodage des médias",
      spoken: (loaded, total) => `Chargement : ${loaded} média${loaded > 1 ? "s" : ""} sur ${total}`,
      failed: "Certains médias n'ont pas pu être chargés. Réessayez pour afficher le contenu complet.",
      retry: "Réessayer",
    },
  },
  en: {
    close: "Close",
    closeDossier: "Close the dossier",
    overview: "Overview",
    overviewOf: (item) => `Overview: ${item}`,
    itemsNav: "Universe navigation",
    entriesNav: "Experiences of this universe",
    itemLocation: (i, n, label) => `Universe ${i} of ${n}: ${label}`,
    entryLocation: (i, n, label) => `Experience ${i} of ${n}: ${label}`,
    previousItem: (label) => `Previous universe: ${label}`,
    nextItem: (label) => `Next universe: ${label}`,
    nextEntry: (label) => `Next experience: ${label}`,
    openEntry: (i, n, title) => `Open experience ${i} of ${n}: ${title}`,
    boardHeading: (item) => `${item} — choose an experience`,
    backTo: (item) => `Back to the overview: ${item}`,
    overviewTitle: (i, label) => `Dossier ${String(i).padStart(2, "0")} · ${label}`,
    toastNext: "Next experience",
    toastEnd: "Next universe",
    toastBack: "Back to the overview",
    dock: { home: "Overview", previous: "Prev.", next: "Next", item: "Universe" },
    loader: {
      overviewKicker: (i) => `Dossier ${String(i).padStart(2, "0")}`,
      detailKicker: (i) => `Experience ${String(i).padStart(2, "0")}`,
      title: "Preparing",
      status: "Decoding media",
      spoken: (loaded, total) => `Loading: ${loaded} of ${total} media`,
      failed: "Some media could not be loaded. Try again to show the full content.",
      retry: "Try again",
    },
  },
};

/** Chrome copy only (for sites that build their own items). */
export const dossierCopy = (locale: Locale): DossierCopy => COPY[locale];

const MEDIA = "/library/dossier/";

type EntryData = {
  id: string;
  image: string;
  title: L;
  label: L;
  kicker: L;
  alt: L;
  caption: { kicker: L; title: L };
  story: { title: L; lead: L; body: L };
  specimen: { heading: L; body: L; note: L; rows: Rows };
  facts: Rows;
};

type ItemData = {
  id: string;
  label: L;
  accent: string;
  payoff: { lines: Record<Locale, string[]>; lead: L; cta: L; results: Record<Locale, [string, string][]> };
  entries: EntryData[];
};

const T = {
  practical: { fr: "En pratique.", en: "In practice." },
  practicalNote: { fr: "Les informations utiles avant de venir.", en: "What to know before you come." },
  consequence: { fr: "Quitte le dossier", en: "Leaves the dossier" },
  kicker: { fr: "Expériences", en: "Experiences" },
  attribution: { fr: "Site conçu par Evoview — evoview.be (nouvel onglet)", en: "Site designed by Evoview — evoview.be (new tab)" },
};

const DATA: ItemData[] = [
  {
    id: "table",
    label: { fr: "La table", en: "The table" },
    accent: "#c2643f",
    payoff: {
      lines: { fr: ["Une table.", "Votre soirée."], en: ["One table.", "Your evening."] },
      lead: { fr: "Réservez en deux minutes ; nous confirmons par SMS dans l'heure.", en: "Book in two minutes; we confirm by text within the hour." },
      cta: { fr: "Réserver une table", en: "Book a table" },
      results: { fr: [["38", "couverts"], ["7 / 7", "service du soir"], ["2 h", "à table, sans presse"]], en: [["38", "covers"], ["7 / 7", "evening service"], ["2 h", "at the table, unhurried"]] },
    },
    entries: [
      {
        id: "tasting",
        image: "table-tasting.webp",
        title: { fr: "Menu dégustation", en: "Tasting menu" },
        label: { fr: "Dégustation", en: "Tasting" },
        kicker: { fr: "7 services · 78 €", en: "7 courses · €78" },
        alt: { fr: "Assiette du menu dégustation sur une table en ardoise", en: "Tasting-menu plate on a slate table" },
        caption: { kicker: { fr: "Service 04 / 07", en: "Course 04 / 07" }, title: { fr: "Lieu jaune, beurre noisette, oseille", en: "Pollock, brown butter, sorrel" } },
        story: {
          title: { fr: "Sept services. Une saison.", en: "Seven courses. One season." },
          lead: { fr: "Le menu change avec le marché, jamais avec les modes.", en: "The menu changes with the market, never with trends." },
          body: { fr: "La cuisine compose sept assiettes courtes autour de trois producteurs de la région. Comptez deux heures et demie, à votre rythme.", en: "The kitchen builds seven short plates around three regional producers. Allow two and a half hours, at your pace." },
        },
        specimen: {
          heading: { fr: "La carte de ce soir.", en: "Tonight's card." },
          body: { fr: "Chaque assiette tient en une ligne : un produit, une cuisson, un accent.", en: "Each plate fits on one line: a product, a cooking, an accent." },
          note: { fr: "Exemple de menu — il change chaque semaine.", en: "Sample menu — it changes every week." },
          rows: {
            fr: [["Mise en bouche", "Radis, beurre fumé, sel de céleri"], ["Entrée", "Betterave rôtie, chèvre frais, noisette"], ["Poisson", "Lieu jaune, beurre noisette, oseille"], ["Dessert", "Poire pochée, sarrasin, crème crue"]],
            en: [["Amuse-bouche", "Radish, smoked butter, celery salt"], ["Starter", "Roast beetroot, fresh goat cheese, hazelnut"], ["Fish", "Pollock, brown butter, sorrel"], ["Dessert", "Poached pear, buckwheat, raw cream"]],
          },
        },
        facts: {
          fr: [["Quand", "Du mardi au samedi, dès 19 h"], ["Pour qui", "De 2 à 6 personnes"], ["Accords", "Vins en accord, + 42 €"]],
          en: [["When", "Tuesday to Saturday, from 7 pm"], ["For", "2 to 6 guests"], ["Pairing", "Matched wines, + €42"]],
        },
      },
      {
        id: "market",
        image: "table-market.webp",
        title: { fr: "Le marché du midi", en: "Market lunch" },
        label: { fr: "Midi", en: "Lunch" },
        kicker: { fr: "Entrée · plat · 26 €", en: "Starter · main · €26" },
        alt: { fr: "Bols de légumes de saison et pain au levain près d'une fenêtre", en: "Bowls of seasonal vegetables and sourdough by a window" },
        caption: { kicker: { fr: "Ardoise du jour", en: "Today's board" }, title: { fr: "Légumes du marché, pain au levain", en: "Market vegetables, sourdough" } },
        story: {
          title: { fr: "Le midi. Sans détour.", en: "Lunch. No detours." },
          lead: { fr: "Trois assiettes du jour, servies en cinquante minutes.", en: "Three plates of the day, served in fifty minutes." },
          body: { fr: "Pensé pour une pause de travail : une entrée, un plat, un café. Le pain est cuit le matin même.", en: "Built for a work break: a starter, a main, a coffee. The bread is baked that morning." },
        },
        specimen: {
          heading: { fr: "L'ardoise du jour.", en: "Today's board." },
          body: { fr: "Écrite à la craie à 11 h, effacée à 14 h.", en: "Chalked at 11 am, wiped at 2 pm." },
          note: { fr: "Exemple — l'ardoise change chaque matin.", en: "Sample — the board changes every morning." },
          rows: {
            fr: [["Entrée", "Velouté de courge, graines torréfiées"], ["Plat", "Poulet fermier, carottes glacées, jus court"], ["Végétarien", "Épeautre, champignons, parmesan"], ["Café", "Et un carré de chocolat"]],
            en: [["Starter", "Squash velouté, toasted seeds"], ["Main", "Free-range chicken, glazed carrots, jus"], ["Vegetarian", "Spelt, mushrooms, parmesan"], ["Coffee", "And a square of chocolate"]],
          },
        },
        facts: {
          fr: [["Quand", "Du mardi au vendredi, 12 h – 14 h"], ["Durée", "Cinquante minutes, promis"], ["Prix", "26 € entrée + plat · 31 € avec dessert"]],
          en: [["When", "Tuesday to Friday, noon – 2 pm"], ["Time", "Fifty minutes, promised"], ["Price", "€26 starter + main · €31 with dessert"]],
        },
      },
      {
        id: "cellar",
        image: "table-cellar.webp",
        title: { fr: "La cave", en: "The cellar" },
        label: { fr: "Cave", en: "Cellar" },
        kicker: { fr: "240 références", en: "240 wines" },
        alt: { fr: "Cave voûtée, casiers de bouteilles et deux verres sur un tonneau", en: "Cellar racks of bottles and two glasses on a barrel" },
        caption: { kicker: { fr: "Cave · niveau −1", en: "Cellar · level −1" }, title: { fr: "Loire, Jura, Rhône nord", en: "Loire, Jura, northern Rhône" } },
        story: {
          title: { fr: "Une cave. Deux cents histoires.", en: "One cellar. Two hundred stories." },
          lead: { fr: "Des vignerons que nous connaissons par leur prénom.", en: "Winemakers we know by first name." },
          body: { fr: "La cave se visite avant le dîner. Le sommelier vous sert trois verres pour trouver votre bouteille.", en: "Visit the cellar before dinner. The sommelier pours three glasses to find your bottle." },
        },
        specimen: {
          heading: { fr: "Trois verres pour choisir.", en: "Three glasses to choose." },
          body: { fr: "Du plus léger au plus profond, pour savoir ce que vous aimez ce soir.", en: "From lightest to deepest, to find what you like tonight." },
          note: { fr: "Exemple de parcours de dégustation.", en: "Sample tasting flight." },
          rows: {
            fr: [["Blanc", "Chenin sec, Anjou"], ["Rouge léger", "Poulsard, Jura"], ["Rouge", "Syrah, Saint-Joseph"]],
            en: [["White", "Dry Chenin, Anjou"], ["Light red", "Poulsard, Jura"], ["Red", "Syrah, Saint-Joseph"]],
          },
        },
        facts: {
          fr: [["Quand", "Sur demande, avant le service"], ["Durée", "Vingt minutes"], ["Prix", "Offert avec une bouteille"]],
          en: [["When", "On request, before service"], ["Time", "Twenty minutes"], ["Price", "Free with a bottle"]],
        },
      },
      {
        id: "chef",
        image: "table-chef.webp",
        title: { fr: "Table du chef", en: "Chef's table" },
        label: { fr: "Table du chef", en: "Chef's table" },
        kicker: { fr: "4 places · comptoir", en: "4 seats · counter" },
        alt: { fr: "Mains dressant une assiette à la pince au comptoir de la cuisine", en: "Hands plating a dish with tweezers at the kitchen counter" },
        caption: { kicker: { fr: "Comptoir · passe", en: "Counter · pass" }, title: { fr: "Dressage à la pince", en: "Plating with tweezers" } },
        story: {
          title: { fr: "Au comptoir. Face au feu.", en: "At the counter. Facing the fire." },
          lead: { fr: "Quatre places devant la cuisine ouverte, une conversation avec l'équipe.", en: "Four seats facing the open kitchen, a conversation with the team." },
          body: { fr: "Le chef adapte le menu à vos goûts. Les assiettes sont dressées devant vous, expliquées par celui qui les cuisine.", en: "The chef adapts the menu to your taste. Plates are finished in front of you and explained by whoever cooked them." },
        },
        specimen: {
          heading: { fr: "Votre soirée, heure par heure.", en: "Your evening, hour by hour." },
          body: { fr: "Trois heures au rythme de la cuisine, sans attendre une assiette.", en: "Three hours at the kitchen's pace, never waiting for a plate." },
          note: { fr: "Exemple de déroulé.", en: "Sample running order." },
          rows: {
            fr: [["19 h 30", "Accueil en cuisine, un verre"], ["20 h", "Premier service au comptoir"], ["21 h 30", "Dessert dressé à quatre mains"], ["22 h 30", "Café avec la brigade"]],
            en: [["7:30 pm", "Welcome in the kitchen, a glass"], ["8 pm", "First course at the counter"], ["9:30 pm", "Dessert plated four-handed"], ["10:30 pm", "Coffee with the brigade"]],
          },
        },
        facts: {
          fr: [["Quand", "Jeudi et vendredi"], ["Pour qui", "De 2 à 4 personnes"], ["Prix", "120 € par personne, vins compris"]],
          en: [["When", "Thursday and Friday"], ["For", "2 to 4 guests"], ["Price", "€120 per guest, wines included"]],
        },
      },
    ],
  },
  {
    id: "bar",
    label: { fr: "Le bar", en: "The bar" },
    accent: "#d4a23a",
    payoff: {
      lines: { fr: ["Un verre.", "Ou trois."], en: ["One drink.", "Or three."] },
      lead: { fr: "Le bar ne prend pas de réservation : passez, il reste toujours un tabouret.", en: "The bar takes no bookings: drop by, there is always a stool." },
      cta: { fr: "Voir les horaires", en: "See opening hours" },
      results: { fr: [["18 h", "ouverture"], ["1 h", "dernier service"], ["14", "places au comptoir"]], en: [["6 pm", "opening"], ["1 am", "last call"], ["14", "counter seats"]] },
    },
    entries: [
      {
        id: "cocktails",
        image: "bar-cocktails.webp",
        title: { fr: "Cocktails de saison", en: "Seasonal cocktails" },
        label: { fr: "Cocktails", en: "Cocktails" },
        kicker: { fr: "6 créations · 12 €", en: "6 signatures · €12" },
        alt: { fr: "Deux cocktails sur un comptoir en marbre sombre", en: "Two cocktails on a dark marble counter" },
        caption: { kicker: { fr: "Comptoir · 18 h", en: "Counter · 6 pm" }, title: { fr: "Ambre fumé, écorce de bergamote", en: "Smoked amber, bergamot peel" } },
        story: {
          title: { fr: "Le verre suit la saison.", en: "The glass follows the season." },
          lead: { fr: "Six cocktails construits avec ce que la cuisine n'utilise pas.", en: "Six cocktails built from what the kitchen doesn't use." },
          body: { fr: "Écorces, herbes, fins de sirops : rien ne se perd. La carte change quand le marché change.", en: "Peels, herbs, the end of syrups: nothing is wasted. The list changes when the market does." },
        },
        specimen: {
          heading: { fr: "La carte du moment.", en: "The current list." },
          body: { fr: "Trois classiques revus, trois créations du comptoir.", en: "Three reworked classics, three counter originals." },
          note: { fr: "Exemple — six créations, renouvelées chaque saison.", en: "Sample — six signatures, renewed every season." },
          rows: {
            fr: [["Ambre", "Whisky, sirop de poire rôtie, bergamote"], ["Herbier", "Gin, verveine, tonic maison"], ["Ardoise", "Mezcal, betterave, citron vert"]],
            en: [["Amber", "Whisky, roast-pear syrup, bergamot"], ["Herbarium", "Gin, verbena, house tonic"], ["Slate", "Mezcal, beetroot, lime"]],
          },
        },
        facts: {
          fr: [["Quand", "Tous les soirs dès 18 h"], ["Sans alcool", "Trois créations dédiées"], ["Prix", "12 € · 8 € sans alcool"]],
          en: [["When", "Every evening from 6 pm"], ["Alcohol-free", "Three dedicated signatures"], ["Price", "€12 · €8 alcohol-free"]],
        },
      },
      {
        id: "boards",
        image: "bar-boards.webp",
        title: { fr: "Planches à partager", en: "Sharing boards" },
        label: { fr: "Planches", en: "Boards" },
        kicker: { fr: "Pour 2 à 4 · 24 €", en: "For 2 to 4 · €24" },
        alt: { fr: "Planche de fromages, charcuterie et pain à la lueur des bougies", en: "Board of cheeses, charcuterie and bread by candlelight" },
        caption: { kicker: { fr: "Planche · grand format", en: "Board · large" }, title: { fr: "Comté 24 mois, coppa, pickles", en: "24-month Comté, coppa, pickles" } },
        story: {
          title: { fr: "À partager. Sans cérémonie.", en: "To share. No ceremony." },
          lead: { fr: "Fromages affinés sur place, charcuterie d'un éleveur voisin.", en: "Cheeses aged in-house, charcuterie from a neighbouring farm." },
          body: { fr: "Les planches se commandent au bar jusqu'à minuit. Le pain arrive chaud, les pickles sont maison.", en: "Boards are served at the bar until midnight. The bread arrives warm, the pickles are homemade." },
        },
        specimen: {
          heading: { fr: "Ce qu'il y a dessus.", en: "What's on it." },
          body: { fr: "Trois familles, rien de superflu.", en: "Three families, nothing superfluous." },
          note: { fr: "Exemple de composition.", en: "Sample selection." },
          rows: {
            fr: [["Fromages", "Comté 24 mois, tomme de brebis, bleu"], ["Charcuterie", "Coppa, jambon sec, rillettes"], ["À côté", "Pickles maison, pain au levain chaud"]],
            en: [["Cheeses", "24-month Comté, sheep tomme, blue"], ["Charcuterie", "Coppa, dry ham, rillettes"], ["On the side", "House pickles, warm sourdough"]],
          },
        },
        facts: {
          fr: [["Quand", "Jusqu'à minuit"], ["Pour qui", "De 2 à 4 personnes"], ["Prix", "24 € · 38 € grand format"]],
          en: [["When", "Until midnight"], ["For", "2 to 4 guests"], ["Price", "€24 · €38 large"]],
        },
      },
      {
        id: "wine",
        image: "bar-wine.webp",
        title: { fr: "Vins au verre", en: "Wine by the glass" },
        label: { fr: "Au verre", en: "By the glass" },
        kicker: { fr: "18 vins ouverts", en: "18 wines open" },
        alt: { fr: "Vin versé dans un verre à pied au bar", en: "Wine poured into a stemmed glass at the bar" },
        caption: { kicker: { fr: "Bar · tirage", en: "Bar · pour" }, title: { fr: "Chenin, Anjou 2021", en: "Chenin, Anjou 2021" } },
        story: {
          title: { fr: "Dix-huit bouteilles ouvertes.", en: "Eighteen bottles open." },
          lead: { fr: "Toute la cave tourne au verre, même les grandes bouteilles.", en: "The whole cellar rotates by the glass, even the big bottles." },
          body: { fr: "Un système de conservation garde chaque bouteille comme au premier verre. Goûtez avant de choisir.", en: "A preservation system keeps each bottle as fresh as the first pour. Taste before you choose." },
        },
        specimen: {
          heading: { fr: "Ouvert ce soir.", en: "Open tonight." },
          body: { fr: "Une sélection courte, renouvelée chaque lundi.", en: "A short selection, renewed every Monday." },
          note: { fr: "Exemple — la sélection tourne chaque semaine.", en: "Sample — the selection rotates weekly." },
          rows: {
            fr: [["Bulles", "Pétillant naturel, Loire"], ["Blanc", "Chenin, Anjou"], ["Orange", "Macération, Alsace"], ["Rouge", "Gamay, Beaujolais"]],
            en: [["Sparkling", "Pét-nat, Loire"], ["White", "Chenin, Anjou"], ["Orange", "Skin contact, Alsace"], ["Red", "Gamay, Beaujolais"]],
          },
        },
        facts: {
          fr: [["Quand", "Tous les soirs"], ["Format", "12 cl, ou 50 cl en carafe"], ["Prix", "De 7 à 16 € le verre"]],
          en: [["When", "Every evening"], ["Size", "12 cl, or a 50 cl carafe"], ["Price", "€7 to €16 a glass"]],
        },
      },
      {
        id: "piano",
        image: "bar-live.webp",
        title: { fr: "Soirées au piano", en: "Piano nights" },
        label: { fr: "Piano", en: "Piano" },
        kicker: { fr: "Jeudi · 21 h", en: "Thursday · 9 pm" },
        alt: { fr: "Bar intime le soir, piano droit et tabourets", en: "Intimate bar at night, upright piano and stools" },
        caption: { kicker: { fr: "Salle · jeudi", en: "Room · Thursday" }, title: { fr: "Piano droit, deux sets", en: "Upright piano, two sets" } },
        story: {
          title: { fr: "Le jeudi. Au piano.", en: "Thursdays. At the piano." },
          lead: { fr: "Un pianiste invité, deux sets, et le bar reste ouvert.", en: "A guest pianist, two sets, and the bar stays open." },
          body: { fr: "Pas de billet, pas de scène : le piano est dans la salle. Arrivez tôt pour les places près du clavier.", en: "No tickets, no stage: the piano sits in the room. Arrive early for the seats by the keys." },
        },
        specimen: {
          heading: { fr: "Le déroulé du jeudi.", en: "Thursday's running order." },
          body: { fr: "Deux sets courts, une pause pour commander.", en: "Two short sets, a break to order." },
          note: { fr: "Exemple de soirée.", en: "Sample evening." },
          rows: {
            fr: [["21 h", "Premier set"], ["22 h", "Pause, planches au bar"], ["22 h 30", "Second set"]],
            en: [["9 pm", "First set"], ["10 pm", "Break, boards at the bar"], ["10:30 pm", "Second set"]],
          },
        },
        facts: {
          fr: [["Quand", "Chaque jeudi"], ["Entrée", "Libre"], ["Places", "Premier arrivé, premier assis"]],
          en: [["When", "Every Thursday"], ["Entry", "Free"], ["Seats", "First come, first seated"]],
        },
      },
    ],
  },
  {
    id: "salons",
    label: { fr: "Les salons", en: "Private rooms" },
    accent: "#6f9a6a",
    payoff: {
      lines: { fr: ["Votre table.", "Rien que pour vous."], en: ["Your table.", "Just for you."] },
      lead: { fr: "Envoyez-nous la date et le nombre d'invités ; une proposition vous revient sous 48 heures.", en: "Send us the date and the number of guests; a proposal comes back within 48 hours." },
      cta: { fr: "Demander une proposition", en: "Request a proposal" },
      results: { fr: [["2", "salons privés"], ["8 – 60", "invités"], ["48 h", "pour une proposition"]], en: [["2", "private rooms"], ["8 – 60", "guests"], ["48 h", "for a proposal"]] },
    },
    entries: [
      {
        id: "private",
        image: "salon-private.webp",
        title: { fr: "Dîner privé", en: "Private dinner" },
        label: { fr: "Dîner privé", en: "Private dinner" },
        kicker: { fr: "Jusqu'à 14 invités", en: "Up to 14 guests" },
        alt: { fr: "Salon privé aux murs verts, longue table dressée aux bougies", en: "Green private room, long table set with candles" },
        caption: { kicker: { fr: "Salon vert", en: "Green room" }, title: { fr: "Table de quatorze, bougies", en: "Table for fourteen, candles" } },
        story: {
          title: { fr: "Une porte. Une seule table.", en: "One door. One table." },
          lead: { fr: "Le salon vert accueille quatorze invités autour d'une table unique.", en: "The green room seats fourteen guests around a single table." },
          body: { fr: "Menu choisi avec le chef, service dédié, musique à votre goût. La porte se ferme, la soirée vous appartient.", en: "Menu chosen with the chef, a dedicated server, your music. The door closes; the evening is yours." },
        },
        specimen: {
          heading: { fr: "Ce qui est compris.", en: "What's included." },
          body: { fr: "Une formule claire, ajustée à votre budget.", en: "A clear package, fitted to your budget." },
          note: { fr: "Exemple de formule.", en: "Sample package." },
          rows: {
            fr: [["Menu", "Quatre services choisis avec le chef"], ["Vins", "Accords sélectionnés par le sommelier"], ["Service", "Un maître d'hôtel dédié"]],
            en: [["Menu", "Four courses chosen with the chef"], ["Wines", "Pairings selected by the sommelier"], ["Service", "A dedicated maître d'"]],
          },
        },
        facts: {
          fr: [["Quand", "Tous les soirs, sur réservation"], ["Pour qui", "De 8 à 14 invités"], ["Prix", "À partir de 85 € par personne"]],
          en: [["When", "Every evening, by booking"], ["For", "8 to 14 guests"], ["Price", "From €85 per guest"]],
        },
      },
      {
        id: "business",
        image: "salon-business.webp",
        title: { fr: "Déjeuner d'affaires", en: "Business lunch" },
        label: { fr: "Affaires", en: "Business" },
        kicker: { fr: "Écran · Wi-Fi · 90 min", en: "Screen · Wi-Fi · 90 min" },
        alt: { fr: "Salon lumineux dressé pour un déjeuner de travail", en: "Bright room set for a working lunch" },
        caption: { kicker: { fr: "Salon clair · midi", en: "Light room · noon" }, title: { fr: "Douze couverts, lumière du jour", en: "Twelve covers, daylight" } },
        story: {
          title: { fr: "Une réunion. Un vrai déjeuner.", en: "A meeting. A proper lunch." },
          lead: { fr: "Un salon lumineux, un écran, et un service réglé sur votre ordre du jour.", en: "A bright room, a screen, and service timed to your agenda." },
          body: { fr: "Le menu est servi en deux temps pour ne pas couper les échanges. Nous facturons directement l'entreprise.", en: "The menu is served in two moments so the conversation isn't cut. We invoice the company directly." },
        },
        specimen: {
          heading: { fr: "Le déroulé.", en: "How it runs." },
          body: { fr: "Quatre-vingt-dix minutes, café compris.", en: "Ninety minutes, coffee included." },
          note: { fr: "Exemple d'organisation.", en: "Sample schedule." },
          rows: {
            fr: [["12 h", "Accueil, café, présentation"], ["12 h 30", "Entrée et plat servis ensemble"], ["13 h 30", "Dessert, café, fin de séance"]],
            en: [["Noon", "Welcome, coffee, presentation"], ["12:30 pm", "Starter and main served together"], ["1:30 pm", "Dessert, coffee, wrap-up"]],
          },
        },
        facts: {
          fr: [["Quand", "Du lundi au vendredi"], ["Pour qui", "De 6 à 20 personnes"], ["Prix", "À partir de 42 € par personne"]],
          en: [["When", "Monday to Friday"], ["For", "6 to 20 guests"], ["Price", "From €42 per guest"]],
        },
      },
      {
        id: "reception",
        image: "salon-reception.webp",
        title: { fr: "Réception dans la cour", en: "Courtyard reception" },
        label: { fr: "Réception", en: "Reception" },
        kicker: { fr: "Cour · jusqu'à 60", en: "Courtyard · up to 60" },
        alt: { fr: "Cour du restaurant au crépuscule, mange-debout et guirlandes", en: "Restaurant courtyard at dusk, high tables and string lights" },
        caption: { kicker: { fr: "Cour · 20 h", en: "Courtyard · 8 pm" }, title: { fr: "Mange-debout, guirlandes", en: "High tables, string lights" } },
        story: {
          title: { fr: "La cour. À la tombée du jour.", en: "The courtyard. At dusk." },
          lead: { fr: "Un cocktail debout dans la cour, puis le restaurant rien que pour vous.", en: "Standing drinks in the courtyard, then the restaurant to yourselves." },
          body: { fr: "Bouchées salées et sucrées, bar dédié, guirlandes allumées à la nuit tombée. Repli en salle s'il pleut.", en: "Savoury and sweet bites, a dedicated bar, lights on at nightfall. We move indoors if it rains." },
        },
        specimen: {
          heading: { fr: "Pour soixante invités.", en: "For sixty guests." },
          body: { fr: "Une base que nous ajustons avec vous.", en: "A starting point we adjust with you." },
          note: { fr: "Exemple de proposition.", en: "Sample proposal." },
          rows: {
            fr: [["Bouchées", "Douze pièces par invité"], ["Bar", "Champagne, cocktails, sans alcool"], ["Fin de soirée", "Planches au bar"]],
            en: [["Bites", "Twelve pieces per guest"], ["Bar", "Champagne, cocktails, alcohol-free"], ["Late", "Boards at the bar"]],
          },
        },
        facts: {
          fr: [["Quand", "D'avril à octobre"], ["Pour qui", "De 30 à 60 invités"], ["Prix", "À partir de 55 € par personne"]],
          en: [["When", "April to October"], ["For", "30 to 60 guests"], ["Price", "From €55 per guest"]],
        },
      },
      {
        id: "workshop",
        image: "salon-workshop.webp",
        title: { fr: "Atelier cuisine", en: "Cooking workshop" },
        label: { fr: "Atelier", en: "Workshop" },
        kicker: { fr: "Samedi · 10 h", en: "Saturday · 10 am" },
        alt: { fr: "Table d'atelier avec farine, pâtes fraîches et tomates", en: "Workshop table with flour, fresh pasta and tomatoes" },
        caption: { kicker: { fr: "Atelier · samedi", en: "Workshop · Saturday" }, title: { fr: "Pâtes fraîches, blé ancien", en: "Fresh pasta, heritage wheat" } },
        story: {
          title: { fr: "Les mains. Dans la farine.", en: "Hands. In the flour." },
          lead: { fr: "Trois heures avec le chef pour apprendre les pâtes fraîches.", en: "Three hours with the chef to learn fresh pasta." },
          body: { fr: "Chaque participant repart avec sa pâte et la recette. L'atelier se termine à table, avec ce que vous avez cuisiné.", en: "Everyone leaves with their dough and the recipe. The workshop ends at the table with what you cooked." },
        },
        specimen: {
          heading: { fr: "Le programme.", en: "The programme." },
          body: { fr: "Du pétrissage au déjeuner, tout se passe à la même table.", en: "From kneading to lunch, all at the same table." },
          note: { fr: "Exemple d'atelier.", en: "Sample workshop." },
          rows: {
            fr: [["10 h", "Pétrir, reposer, étaler"], ["11 h", "Tagliatelles et raviolis"], ["12 h 30", "Déjeuner à table"]],
            en: [["10 am", "Knead, rest, roll"], ["11 am", "Tagliatelle and ravioli"], ["12:30 pm", "Lunch at the table"]],
          },
        },
        facts: {
          fr: [["Quand", "Un samedi par mois"], ["Pour qui", "De 6 à 10 participants"], ["Prix", "95 € par personne, déjeuner compris"]],
          en: [["When", "One Saturday a month"], ["For", "6 to 10 participants"], ["Price", "€95 per guest, lunch included"]],
        },
      },
    ],
  },
];

function buildItem(data: ItemData, locale: Locale): DossierItem {
  return {
    id: data.id,
    label: data.label[locale],
    accent: data.accent,
    entries: data.entries.map((e) => ({
      id: e.id,
      title: e.title[locale],
      label: e.label[locale],
      kicker: e.kicker[locale],
      media: { src: MEDIA + e.image, alt: e.alt[locale] },
      description: `${e.story.lead[locale]} ${e.story.body[locale]}`,
      content: ({ close }) => (
        <>
          <DossierChapter tone="a" variant="intro">
            <ChapterHead level="title" title={e.story.title[locale]} lead={e.story.lead[locale]} body={e.story.body[locale]} />
            <ChapterFigure
              ratio="hero"
              media={{ src: MEDIA + e.image, alt: e.alt[locale] }}
              caption={{ kicker: e.caption.kicker[locale], title: e.caption.title[locale] }}
            />
          </DossierChapter>
          <DossierChapter tone="b">
            <ChapterSplit aside={<ChapterHead title={e.specimen.heading[locale]} body={e.specimen.body[locale]} />}>
              <ChapterSpecimen note={e.specimen.note[locale]}>
                <ChapterRows rows={e.specimen.rows[locale].map(([label, detail]) => ({ label, detail }))} />
              </ChapterSpecimen>
            </ChapterSplit>
          </DossierChapter>
          <DossierChapter tone="a">
            <ChapterHead title={T.practical[locale]} body={T.practicalNote[locale]} />
            <ChapterRows rows={e.facts[locale].map(([label, detail]) => ({ label, detail }))} />
          </DossierChapter>
          <DossierChapter tone="b" variant="payoff">
            <ChapterPayoff
              lines={data.payoff.lines[locale]}
              accentLine={1}
              lead={data.payoff.lead[locale]}
              results={data.payoff.results[locale].map(([value, label]) => ({ value, label }))}
              action={
                <PrimaryPlate size="lg" block onClick={close}>
                  {data.payoff.cta[locale]}
                </PrimaryPlate>
              }
              consequence={T.consequence[locale]}
            />
          </DossierChapter>
        </>
      ),
    })),
  };
}

export function buildDossierConfig(locale: Locale): DossierConfig {
  return {
    locale,
    brand: { name: "Maison Ardoise" },
    kicker: T.kicker[locale],
    items: DATA.map((d) => buildItem(d, locale)),
    attribution: { enabled: true, href: EVOVIEW_URL, label: T.attribution[locale] },
    copy: COPY[locale],
  };
}
