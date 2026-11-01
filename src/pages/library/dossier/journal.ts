import { feedEntry, type DossierEntry, type DossierFeedSnapshot, type DossierFeedSource, type Locale } from "../../../../components/dossier/src";

/* The showcase's live feed: Maison Ardoise's journal (the library's fictional
   restaurant), served by a fake paginated API with latency and a failure
   switch. Records are locale-free (the feed's cache survives a language
   switch); `toEntry` picks the locale. Media: the library's placeholders. */

type L = Record<Locale, string>;
type Section = "producers" | "menu" | "cellar" | "team" | "events";

export type JournalRecord = { id: string; section: Section; date: string; image: string; position?: string; title: L; excerpt: L };

const MEDIA = "/library/dossier/";

const SECTION: Record<Section, { label: L; images: string[]; body: Record<Locale, string[]> }> = {
  producers: {
    label: { fr: "Producteurs", en: "Producers" },
    images: ["table-market.webp", "table-chef.webp"],
    body: {
      fr: [
        "Nous allons chez eux avant qu'ils viennent chez nous : une matinée sur place, la récolte du jour, puis la carte se décide au retour.",
        "Le prix est fixé avec eux pour la saison, livré deux fois par semaine. Ce qui ne part pas en salle part en bouillon, en pickles ou au repas de l'équipe.",
      ],
      en: [
        "We go to them before they come to us: a morning on site, the day's harvest, and the menu is decided on the way back.",
        "The price is set with them for the season, delivered twice a week. What doesn't go to the dining room goes into stock, pickles or the team meal.",
      ],
    },
  },
  menu: {
    label: { fr: "Carte", en: "Menu" },
    images: ["table-tasting.webp", "bar-boards.webp"],
    body: {
      fr: [
        "La carte change par petites touches, un plat à la fois, selon ce que les producteurs apportent. Rien ne disparaît sans qu'un autre plat soit prêt.",
        "Les plats sont goûtés en équipe la veille, ajustés au service du midi, puis inscrits à l'ardoise du soir.",
      ],
      en: [
        "The menu changes in small steps, one dish at a time, with what the producers bring. Nothing leaves before another dish is ready.",
        "Dishes are tasted by the team the day before, adjusted at lunch service, then written on the evening's slate.",
      ],
    },
  },
  cellar: {
    label: { fr: "Cave", en: "Cellar" },
    images: ["table-cellar.webp", "bar-wine.webp"],
    body: {
      fr: [
        "La cave s'achète en petites quantités, chez des vignerons que nous connaissons, et se boit au verre autant qu'à la bouteille.",
        "Chaque semaine, trois vins ouverts au comptoir, servis avec ce qui sort de la cuisine à ce moment-là.",
      ],
      en: [
        "The cellar is bought in small quantities from growers we know, and is poured by the glass as much as by the bottle.",
        "Each week, three wines open at the counter, served with whatever is leaving the kitchen at the time.",
      ],
    },
  },
  team: {
    label: { fr: "Équipe", en: "Team" },
    images: ["salon-workshop.webp", "table-chef.webp"],
    body: {
      fr: [
        "La maison tient à une douzaine de personnes, en salle, en cuisine et à la plonge. Chacun passe une journée de l'autre côté du pass avant de commencer.",
        "Le repas d'équipe a lieu à 17 h, tous ensemble, avant l'ouverture : c'est là que se racontent les nouveautés.",
      ],
      en: [
        "The house runs on a dozen people, in the dining room, in the kitchen and at the sink. Everyone spends a day on the other side of the pass before starting.",
        "The team meal is at 5 pm, all together, before opening: that's where the news gets told.",
      ],
    },
  },
  events: {
    label: { fr: "Agenda", en: "Events" },
    images: ["bar-live.webp", "salon-reception.webp", "salon-business.webp", "bar-cocktails.webp"],
    body: {
      fr: [
        "Les soirées de la maison se réservent comme une table, sur le site ou par téléphone, dans la limite des places.",
        "La carte habituelle reste servie en salle ; le bar et la cour accueillent l'événement.",
      ],
      en: [
        "The house's evenings are booked like a table, online or by phone, while places last.",
        "The usual menu is still served in the dining room; the bar and the courtyard host the event.",
      ],
    },
  },
};

const R = (id: string, section: Section, date: string, title: L, excerpt: L, position?: string): Omit<JournalRecord, "image"> & { position?: string } => ({ id, section, date, title, excerpt, position });

/* Newest first. The three first are published while the visitor reads (live updates). */
const LIST = [
  R("menu-hiver-premiers-plats", "menu", "2026-11-01", { fr: "Les premiers plats d'hiver arrivent à l'ardoise", en: "The first winter dishes reach the slate" }, { fr: "Courge rôtie, bouillon fumé, poire pochée : trois plats prennent le relais de l'automne.", en: "Roast squash, smoked broth, poached pear: three dishes take over from autumn." }),
  R("soiree-cave-novembre", "events", "2026-11-01", { fr: "Soirée cave : les vins de garde de novembre", en: "Cellar evening: November's keeping wines" }, { fr: "Un jeudi soir, six vins ouverts au comptoir, une assiette par verre.", en: "One Thursday evening, six wines open at the counter, one plate per glass." }),
  R("nouveau-boulanger", "producers", "2026-10-31", { fr: "Un nouveau boulanger livre la maison chaque matin", en: "A new baker delivers to the house every morning" }, { fr: "Levain, farines du coin, cuisson au bois : le pain change, la corbeille aussi.", en: "Sourdough, local flours, wood-fired: the bread changes, so does the basket." }),
  R("vendanges-tardives", "cellar", "2026-10-30", { fr: "Vendanges tardives : la cave accueille trois liquoreux", en: "Late harvest: the cellar welcomes three sweet wines" }, { fr: "Servis au verre avec le fromage et le dessert, jusqu'à la fin de l'hiver.", en: "Poured by the glass with the cheese and dessert, until the end of winter." }),
  R("marche-du-samedi", "producers", "2026-10-28", { fr: "Le marché du samedi décide de la carte du week-end", en: "Saturday's market decides the weekend menu" }, { fr: "Ce que la cuisine rapporte à dix heures est à l'ardoise à midi.", en: "What the kitchen brings back at ten is on the slate by noon." }),
  R("cheffe-patissiere", "team", "2026-10-26", { fr: "Une cheffe pâtissière rejoint la cuisine", en: "A pastry chef joins the kitchen" }, { fr: "Elle reprend les desserts à l'assiette et lance un goûter le dimanche.", en: "She takes over the plated desserts and starts a Sunday afternoon tea." }),
  R("concert-cour", "events", "2026-10-24", { fr: "Dernier concert dans la cour avant l'hiver", en: "Last concert in the courtyard before winter" }, { fr: "Un trio acoustique, des braseros, une carte courte servie au bar.", en: "An acoustic trio, braziers, a short menu served at the bar." }),
  R("champignons-foret", "menu", "2026-10-22", { fr: "Les champignons de la forêt voisine à la carte", en: "Mushrooms from the nearby forest on the menu" }, { fr: "Cèpes et girolles tant que la cueillette le permet, en tarte et en risotto.", en: "Ceps and chanterelles while the picking lasts, in a tart and a risotto." }),
  R("vin-orange", "cellar", "2026-10-20", { fr: "Trois vins de macération ouverts au comptoir", en: "Three skin-contact wines open at the counter" }, { fr: "Des blancs vinifiés comme des rouges, à découvrir au verre cette semaine.", en: "Whites made like reds, to try by the glass this week." }),
  R("eleveur-agneau", "producers", "2026-10-18", { fr: "Chez l'éleveur qui fournit notre agneau", en: "With the farmer who raises our lamb" }, { fr: "Une matinée dans les prés, et pourquoi la maison ne sert l'agneau qu'au printemps et à l'automne.", en: "A morning in the meadows, and why the house serves lamb only in spring and autumn." }),
  R("atelier-pates", "events", "2026-10-16", { fr: "Atelier pâtes fraîches, un dimanche par mois", en: "Fresh pasta workshop, one Sunday a month" }, { fr: "Huit places autour de la grande table, le déjeuner compris.", en: "Eight places around the big table, lunch included." }),
  R("salle-renovee", "team", "2026-10-14", { fr: "La salle du fond rouvre après travaux", en: "The back room reopens after works" }, { fr: "Acoustique reprise, lumière plus douce, douze couverts de plus.", en: "Acoustics redone, softer light, twelve more covers." }),
  R("menu-dejeuner", "menu", "2026-10-12", { fr: "Le menu du déjeuner passe à trois plats", en: "The lunch menu moves to three courses" }, { fr: "Entrée, plat, dessert, servis en moins d'une heure, du mardi au vendredi.", en: "Starter, main, dessert, served within the hour, Tuesday to Friday." }),
  R("cidre-fermier", "cellar", "2026-10-10", { fr: "Un cidre fermier rejoint la carte des boissons", en: "A farmhouse cider joins the drinks list" }, { fr: "Brut, non filtré, servi frais avec les plats de la mer.", en: "Dry, unfiltered, served chilled with the seafood dishes." }),
  R("potager-toit", "producers", "2026-10-08", { fr: "Le potager sur le toit donne ses dernières tomates", en: "The rooftop garden gives its last tomatoes" }, { fr: "Avant de le préparer pour l'hiver, la cuisine en fait un dernier gaspacho.", en: "Before readying it for winter, the kitchen makes one last gazpacho." }),
  R("soiree-jazz", "events", "2026-10-06", { fr: "Les jeudis jazz reprennent au bar", en: "Jazz Thursdays return to the bar" }, { fr: "Deux sets, entrée libre, cocktails de saison.", en: "Two sets, free entry, seasonal cocktails." }),
  R("sommelier", "team", "2026-10-04", { fr: "Notre sommelier raconte sa cave idéale", en: "Our sommelier describes his ideal cellar" }, { fr: "Peu de références, beaucoup de visites chez les vignerons, et une règle : tout se boit au verre.", en: "Few references, many visits to growers, and one rule: everything is poured by the glass." }),
  R("poisson-ligne", "menu", "2026-10-02", { fr: "Le poisson de ligne arrive deux fois par semaine", en: "Line-caught fish arrives twice a week" }, { fr: "La pêche du jour décide du plat : la carte l'annonce le matin même.", en: "The day's catch decides the dish: the slate announces it that morning." }),
  R("fromager", "producers", "2026-09-30", { fr: "Le plateau de fromages change de fromager", en: "The cheese board changes cheesemonger" }, { fr: "Six fromages affinés à vingt kilomètres, servis avec une confiture de la maison.", en: "Six cheeses aged twenty kilometres away, served with a house jam." }),
  R("brunch-dimanche", "events", "2026-09-28", { fr: "Le brunch du dimanche s'installe dans la cour", en: "Sunday brunch moves to the courtyard" }, { fr: "Jusqu'à la mi-octobre, quand le temps le permet.", en: "Until mid-October, weather permitting." }),
  R("rentree-cuisine", "team", "2026-09-26", { fr: "La cuisine fait sa rentrée avec deux apprentis", en: "The kitchen starts the season with two apprentices" }, { fr: "Une année entre l'école et la maison, à tous les postes.", en: "A year between school and the house, at every station." }),
  R("vin-nature-salon", "cellar", "2026-09-24", { fr: "Retour du salon des vins de la région", en: "Back from the regional wine fair" }, { fr: "Quatre domaines entrent à la carte, dont deux tout jeunes.", en: "Four estates join the list, two of them brand new." }),
  R("figues", "menu", "2026-09-22", { fr: "Les figues du voisin finissent en tarte", en: "The neighbour's figs end up in a tart" }, { fr: "Un dessert qui ne restera que deux semaines à la carte.", en: "A dessert that will stay on the menu for two weeks only." }),
  R("miel", "producers", "2026-09-20", { fr: "Le miel de la maison vient de trois ruches", en: "The house honey comes from three hives" }, { fr: "Posées au jardin il y a deux ans, elles donnent assez pour les desserts de l'automne.", en: "Set in the garden two years ago, they give enough for the autumn desserts." }),
  R("journees-patrimoine", "events", "2026-09-18", { fr: "Les journées du patrimoine ouvrent les caves", en: "Heritage days open the cellars" }, { fr: "Visites guidées des caves voûtées, le samedi et le dimanche après-midi.", en: "Guided tours of the vaulted cellars, Saturday and Sunday afternoons." }),
  R("chef-de-rang", "team", "2026-09-16", { fr: "Portrait de notre chef de rang", en: "Portrait of our head waiter" }, { fr: "Quinze ans de salle, et la mémoire de chaque habitué.", en: "Fifteen years in the dining room, and the memory of every regular." }),
  R("tomates-anciennes", "menu", "2026-09-14", { fr: "Une assiette de tomates anciennes, rien d'autre", en: "A plate of heirloom tomatoes, nothing else" }, { fr: "Sel, huile, quelques herbes : la fin de l'été dans une assiette.", en: "Salt, oil, a few herbs: the end of summer on a plate." }),
  R("rose-ete", "cellar", "2026-09-12", { fr: "Le rosé de l'été laisse sa place", en: "The summer rosé steps aside" }, { fr: "Les dernières bouteilles partent au verre jusqu'à épuisement.", en: "The last bottles go by the glass while they last." }),
  R("maraicher", "producers", "2026-09-10", { fr: "Une journée chez notre maraîcher", en: "A day with our market gardener" }, { fr: "Cinq hectares, quarante variétés, et une liste envoyée chaque dimanche soir.", en: "Five hectares, forty varieties, and a list sent every Sunday evening." }),
  R("fermeture-ete", "events", "2026-09-08", { fr: "Réouverture après la pause d'été", en: "Reopening after the summer break" }, { fr: "La maison rouvre ses portes avec une carte de fin d'été.", en: "The house opens its doors again with a late-summer menu." }),
  R("plonge", "team", "2026-09-06", { fr: "Ceux qu'on ne voit pas : la plonge", en: "The ones you don't see: the dish room" }, { fr: "Le poste qui tient le service, raconté par ceux qui le tiennent.", en: "The station that keeps service going, told by the people who run it." }),
  R("glaces-maison", "menu", "2026-09-04", { fr: "Les glaces de la maison changent chaque semaine", en: "The house ice creams change every week" }, { fr: "Trois parfums, faits le lundi, servis jusqu'au dimanche.", en: "Three flavours, made on Monday, served until Sunday." }),
  R("bieres-locales", "cellar", "2026-09-02", { fr: "Deux brasseries locales à la pression", en: "Two local breweries on tap" }, { fr: "Une blonde légère et une ambrée, changées à chaque fût.", en: "A light blonde and an amber, changed with every keg." }),
  R("huile-olive", "producers", "2026-08-31", { fr: "L'huile d'olive vient d'un seul moulin", en: "The olive oil comes from a single mill" }, { fr: "Une récolte, une huile, utilisée crue en salle et en cuisine.", en: "One harvest, one oil, used raw in the dining room and in the kitchen." }),
  R("ete-terrasse", "events", "2026-08-29", { fr: "Les soirs d'été sur la terrasse", en: "Summer evenings on the terrace" }, { fr: "Retour en images sur la saison en terrasse, avant la pause.", en: "A look back at the terrace season, before the break." }),
];

const FRESH = 3;
const counts: Record<Section, number> = { producers: 0, menu: 0, cellar: 0, team: 0, events: 0 };
export const JOURNAL: JournalRecord[] = LIST.map((r) => {
  const pool = SECTION[r.section].images;
  const image = pool[counts[r.section]++ % pool.length];
  return { ...r, image };
});

const MONTHS: Record<Locale, string[]> = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
/* No Intl / time zone: the same string on the server and in every browser. */
const day = (iso: string, locale: Locale) => {
  const [, m, d] = iso.split("-").map(Number);
  return locale === "fr" ? `${d} ${MONTHS.fr[m - 1]}` : `${MONTHS.en[m - 1]} ${d}`;
};

export function journalEntry(record: JournalRecord, locale: Locale): DossierEntry {
  const section = SECTION[record.section];
  return feedEntry({
    id: record.id,
    title: record.title[locale],
    kicker: `${section.label[locale]} · ${day(record.date, locale)}`,
    media: { src: MEDIA + record.image, position: record.position, alt: record.title[locale] },
    excerpt: record.excerpt[locale],
    body: section.body[locale],
  });
}

export const JOURNAL_PAGE_SIZE = 9;

/** Network modes (test hook `?feed-network=…`): "down" fails every call, "down-from-2" serves page 1 and fails later
    pages and single entries. */
export type JournalNetwork = "normal" | "down" | "down-from-2";

/* Each page call is also a real request (a static file, `?page=N`), so a client-agnostic check sees and fails it by
   request interception, as it would a client's API (`scripts/feed-fetch-check.mjs`). */
const JOURNAL_API = "/library/dossier/journal.json";
const request = (page: number, signal: AbortSignal) =>
  typeof window === "undefined"
    ? Promise.resolve()
    : fetch(`${JOURNAL_API}?page=${page}`, { signal, cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error(`journal page ${page}: ${r.status}`);
      });

/** The fake API: pages of nine, newest first, `latencyMs` per call; `network()` makes calls fail (above). After its
    first page-1 call the three newest records count as published (a live update to find). */
export function journalSource(locale: Locale, options: { latencyMs?: number; network?: () => JournalNetwork; live?: boolean } = {}): DossierFeedSource<JournalRecord> {
  const { latencyMs = 650, network = () => "normal", live = true } = options;
  let firstPageCalls = 0;
  const published = () => (live && firstPageCalls > 1 ? JOURNAL : JOURNAL.slice(FRESH));
  const wait = <T,>(signal: AbortSignal, fails: () => boolean, value: () => T) =>
    new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => (fails() ? reject(new Error("network down")) : resolve(value())), latencyMs);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("aborted", "AbortError"));
      });
    });
  return {
    fetchPage: (page, _cursor, signal) => {
      if (page === 1) firstPageCalls += 1;
      return request(page, signal).then(() =>
        wait(
          signal,
          () => network() === "down" || (network() === "down-from-2" && page >= 2),
          () => {
            const list = published();
            const items = list.slice((page - 1) * JOURNAL_PAGE_SIZE, page * JOURNAL_PAGE_SIZE);
            return { items, next: page * JOURNAL_PAGE_SIZE < list.length ? String(page + 1) : null };
          },
        ),
      );
    },
    fetchEntry: (id, signal) => wait(signal, () => network() !== "normal", () => JOURNAL.find((r) => r.id === id) ?? null),
    toEntry: (record) => journalEntry(record, locale),
  };
}

/** Pages as the build would hold them (no live records): the server snapshot, and verify:ssr's reference. */
export function journalSnapshot(pages: number[] = [1]): DossierFeedSnapshot<JournalRecord> {
  const list = JOURNAL.slice(FRESH);
  return {
    pages: pages.map((page) => ({
      page,
      items: list.slice((page - 1) * JOURNAL_PAGE_SIZE, page * JOURNAL_PAGE_SIZE),
      next: page * JOURNAL_PAGE_SIZE < list.length ? String(page + 1) : null,
    })),
  };
}
