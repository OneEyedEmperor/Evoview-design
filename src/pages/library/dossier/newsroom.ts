import { feedEntry, type DossierFeedSource, type DossierImportance, type Locale } from "../../../../components/dossier/src";

/* Test hook `?feed-demo=newsroom`: a news feed's shape with real-length headlines, for the editions board. A fictional
   city paper (RULES §10: neutral demo content, FR + EN): 16 stories, four sections, newest first, headlines of 40 to 75
   characters, deks of one or two sentences, on the library's placeholder pictures. Importance is a demo pick: page 1 has
   one top story (not its lead) and two majors; page 2's lead is a top story. */

type L = Record<Locale, string>;
type Section = "city" | "culture" | "sport" | "business";
export type NewsRecord = { id: string; section: Section; date: string; title: L; dek: L; importance?: DossierImportance };

/* Short: the header gives a text brand 8.5em (a longer name runs into the item readout, reported for the package). */
export const NEWSROOM_BRAND: L = { fr: "Le Courrier", en: "The Courier" };
export const NEWSROOM_LABEL: L = { fr: "À la une", en: "Latest" };
const SECTIONS: Record<Section, L> = {
  city: { fr: "Ville", en: "City" },
  culture: { fr: "Culture", en: "Culture" },
  sport: { fr: "Sport", en: "Sport" },
  business: { fr: "Économie", en: "Business" },
};

const LIST: NewsRecord[] = [
  { id: "harbour-cinema-reopens", section: "culture", date: "2026-11-01", title: { fr: "Le cinéma du port rouvre, et la question de garder les vieilles bobines", en: "The harbour cinema reopens and the case for keeping old reels running" }, dek: { fr: "Trois salles rouvertes en octobre, chacune avec sa propre idée de ce qu'il faut garder. Les projectionnistes disent que tout se joue dans l'entretien.", en: "Three screens reopened in October, each with its own idea of what to keep. The projectionists argue the real test is whether the old machines still run." } },
  { id: "october-in-the-venues", section: "culture", date: "2026-10-31", title: { fr: "Octobre dans les salles : premières, reprises et un mois de travaux", en: "October in the city's venues: premieres, revivals and a month of repairs" }, dek: { fr: "Quatre premières en quatre semaines, deux reprises attendues, et une salle de concert qui a passé sa rentrée en chantier.", en: "Four premieres in four weeks, two awaited revivals, and a concert hall that spent its first fortnight being fixed." } },
  { id: "tram-line-first-fortnight", section: "city", date: "2026-10-30", title: { fr: "Deux semaines de tram : cinq correctifs et une liste publique des pannes", en: "The new tram line's first fortnight: five fixes and a public fault list" }, dek: { fr: "La régie a publié cinq correctifs depuis l'ouverture du 13 octobre, avec les portes et l'affichage en tête de sa liste.", en: "The transit authority has shipped five fixes since the line opened on October 13, with the doors and the signage at the top of its list." } },
  { id: "late-season-festivals", section: "culture", date: "2026-10-30", title: { fr: "Arrière-saison : pourquoi les festivals d'automne nous font attendre", en: "Late season: why this autumn's festivals ask their audiences to wait" }, dek: { fr: "Les programmations d'octobre misent sur la patience : longues ouvertures, entractes tardifs. Les publics suivent, ou décrochent.", en: "October's programmes are built on patience: long overtures, late intervals. Reviews of both festivals show when the wait pays off and when it grates." } },
  { id: "opera-season-review", section: "culture", date: "2026-10-29", importance: "major", title: { fr: "La nouvelle saison de l'opéra : la mise en scène emporte tout", en: "The opera house's new season, reviewed: the staging carries it" }, dek: { fr: "Les trois critiques placent la production parmi les meilleures de la décennie pour sa scénographie. Deux regrettent le livret.", en: "All three reviews put the production near the top of the decade for its staging. Two of them fault the libretto." } },
  { id: "bridge-works-delayed", section: "city", date: "2026-10-29", importance: "top", title: { fr: "Les travaux du pont repoussés au printemps", en: "The bridge works are delayed to next spring" }, dek: { fr: "Le chantier entre dans sa dernière phase, dit la ville, et a besoin de plus de temps après les essais de charge d'août.", en: "The works are in their final stage, the city says, and need more time on load and safety after the August tests." } },
  { id: "regatta-week", section: "sport", date: "2026-10-28", title: { fr: "Semaine des régates : le vent décide du classement", en: "Regatta week on the bay: the wind decides the standings" }, dek: { fr: "Après trois manches dans la baie, deux équipages ont mené presque chaque départ, et les deux changements de parcours ont pesé sur le résultat.", en: "After three rounds in the bay, two crews led nearly every start, and the two changes to the course stayed central to the result." } },
  { id: "shipyard-history", section: "business", date: "2026-10-24", title: { fr: "Le vieux chantier naval, de 1890 à 2026 : la fin d'un siècle de travail", en: "The old shipyard, 1890 to 2026: how a century of work came to an end" }, dek: { fr: "Du premier bateau de pêche au dernier ferry, la fermeture conclut une décennie où le chantier a été repensé à chaque commande.", en: "From the first fishing boat to the last ferry, the closure caps a decade in which the yard was reshaped around every new order." } },
  { id: "rowing-club-boathouse", section: "sport", date: "2026-10-22", importance: "major", title: { fr: "Le club d'aviron fermera son hangar le 2 novembre après 60 ans", en: "The rowing club will close its boathouse on November 2 after 60 years" }, dek: { fr: "Sans renouvellement du bail, le club évoque des sponsors trop rares et des coûts en hausse. Ses rameurs peuvent rejoindre d'autres clubs.", en: "Left without a new lease for next year, the club cites thin sponsorship and rising costs. Its rowers are free to join other clubs." } },
  { id: "night-ferry-closes", section: "city", date: "2026-10-21", importance: "top", title: { fr: "Le conseil supprime le ferry de nuit et met fin à la boucle du port", en: "The council closes the night ferry and ends the harbour loop" }, dek: { fr: "La ligne de nuit s'arrête après plus de trente ans, dans le cadre d'environ quarante suppressions de services votées cette semaine.", en: "The night line is stopping after more than 30 years, as part of about forty service cuts voted by the council this week." } },
  { id: "autumn-cup-final", section: "sport", date: "2026-10-19", title: { fr: "L'équipe du port bat le leader et remporte la coupe d'automne", en: "The harbour team beat the league leaders to win the autumn cup" }, dek: { fr: "Les joueurs locaux ont gagné la finale 3–1 le 18 octobre, premier club à remporter la coupe deux fois, lors de la dernière finale du vieux stade.", en: "The home side won the final 3–1 on October 18, becoming the first club to win the cup twice, at the last final played in the old stadium." } },
  { id: "museum-second-wing", section: "culture", date: "2026-10-17", title: { fr: "La deuxième aile du musée d'art moderne : deux commissaires, plus de salles", en: "The modern art museum's second wing, reviewed: two curators, more rooms" }, dek: { fr: "La critique s'accorde : deux commissaires et un parcours ramifié font une aile meilleure que la première. L'éclairage reste le reproche commun.", en: "Critics agree two curators and a branching route make the new wing better than the first. Dim lighting is the common complaint." } },
  { id: "river-trilogy-review", section: "culture", date: "2026-10-16", title: { fr: "La trilogie du fleuve au théâtre de la ville : un début lent qui paie", en: "The river trilogy at the city theatre, reviewed: a slow start pays off" }, dek: { fr: "La critique salue la troupe et les scènes de foule. Elle diverge sur le rythme, qui commence lentement et, pour un critique, s'effondre à la fin.", en: "Critics love the ensemble and the crowd scenes. They disagree on the pacing, which starts slow and, for one, collapses late." } },
  { id: "winter-market-hall", section: "culture", date: "2026-10-15", title: { fr: "La nouvelle halle du marché d'hiver : le spectacle d'abord, le plan ensuite", en: "The winter market's new hall, reviewed: spectacle first, layout second" }, dek: { fr: "Les visiteurs louent la charpente, les lumières et la nouvelle scène. Le plan semi-ouvert et ses allées partagent les avis.", en: "Visitors praise the timber roof, the lights and the new stage. The semi-open plan and its aisles are where opinions split." } },
  { id: "basketball-new-guards", section: "sport", date: "2026-10-14", title: { fr: "Le club de basket recrute deux meneurs et tourne la page du tout-local", en: "The basketball club sign two guards, ending an all-local roster era" }, dek: { fr: "Quatre fois champion, le club n'aligne plus qu'un joueur formé ici, après avoir laissé partir deux titulaires et recruté deux meneurs.", en: "The four-time champions now field one home-grown player, after releasing two starters and adding two guards from other leagues." } },
  { id: "bakeries-merge", section: "business", date: "2026-10-07", title: { fr: "Deux boulangeries du port fusionnent sous un même nom et un seul four", en: "Two harbour bakeries merge under one name and one oven" }, dek: { fr: "La vente conclue, les deux maisons réunissent leurs équipes dans un seul atelier, dirigé par la fille du fondateur.", en: "With the sale closed, the two houses are folding both teams into one bakehouse led by the founder's daughter." } },
];

const IMAGES = ["bar-live.webp", "table-market.webp", "salon-workshop.webp", "bar-cocktails.webp", "table-cellar.webp", "salon-reception.webp", "table-chef.webp", "bar-boards.webp", "salon-business.webp", "table-tasting.webp", "bar-wine.webp", "salon-private.webp"];
const MONTHS: Record<Locale, string[]> = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
/* No Intl / time zone: the same string on the server and in every browser. */
const day = (iso: string, locale: Locale) => {
  const [, m, d] = iso.split("-").map(Number);
  return locale === "fr" ? `${d} ${MONTHS.fr[m - 1]}` : `${d} ${MONTHS.en[m - 1]}`;
};

export const NEWS_PAGE_SIZE = 9;

export function newsSource(locale: Locale, latencyMs = 650): DossierFeedSource<NewsRecord> {
  return {
    fetchPage: (page, _cursor, signal) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const items = LIST.slice((page - 1) * NEWS_PAGE_SIZE, page * NEWS_PAGE_SIZE);
          resolve({ items, next: page * NEWS_PAGE_SIZE < LIST.length ? String(page + 1) : null });
        }, latencyMs);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("aborted", "AbortError"));
        });
      }),
    fetchEntry: async (id) => LIST.find((r) => r.id === id) ?? null,
    toEntry: (record) =>
      feedEntry({
        id: record.id,
        title: record.title[locale],
        section: SECTIONS[record.section][locale],
        published: { iso: record.date, label: day(record.date, locale) },
        importance: record.importance,
        media: { src: `/library/dossier/${IMAGES[LIST.indexOf(record) % IMAGES.length]}`, alt: "" },
        excerpt: record.dek[locale],
        body: [record.dek[locale]],
      }),
  };
}
