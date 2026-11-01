import { feedEntry, type DossierFeedSource, type DossierImportance } from "../../../../components/dossier/src";

/* Test hook `?feed-demo=newsroom`: a news client's real-length headlines, the Evoview Gaming "Latest" feed as published
   (16 headlines, deks, desks and days, newest first, the live feed's order), on the library's placeholder pictures.
   Importance is a demo pick: page 1 has one top story (not its lead) and two majors; page 2's lead is a top story. */
const IMPORTANCE: Record<string, DossierImportance> = {
  "duskbloods-delayed-to-2027": "top",
  "phantom-blade-zero-review": "major",
  "evil-geniuses-shut-down": "major",
  "ea-closes-bioware": "top",
};

type Desk = "News" | "Reviews" | "Features" | "Esports";
export type NewsRecord = { id: string; desk: Desk; date: string; title: string; dek: string };

const LIST: NewsRecord[] = [
  { id: "remasters-and-preservation", desk: "Features", date: "2026-11-01", title: "October's remasters and the case for keeping old games playable", dek: "Three remasters launched in October, each with its own idea of what to keep. GOG argues the real test is whether you can still run the game at all." },
  { id: "october-2026-releases", desk: "Features", date: "2026-10-31", title: "October 2026 in releases: sequels, revivals and a month of patches", dek: "Gears, Castlevania, Boltgun and Phantom Blade all landed within four weeks, alongside a zoo sim that spent its first fortnight being fixed." },
  { id: "planet-zoo-2-first-patches", desk: "News", date: "2026-10-30", title: "Planet Zoo 2's first fortnight: five updates and a public bug list", dek: "Frontier has shipped five updates since Planet Zoo 2 launched on October 13, with Franchise mode stability and lost saves at the top of its list." },
  { id: "parry-season", desk: "Features", date: "2026-10-30", title: "Parry season: why October's action games want you to wait", dek: "Phantom Blade Zero builds its combat on deflection; Castlevania asks for it. Reviews of both show when a parry helps and when it grates." },
  { id: "phantom-blade-zero-review", desk: "Reviews", date: "2026-10-29", title: "Phantom Blade Zero review round-up: the combat carries it", dek: "All three reviews put S-GAME's wuxia action game near the top of its genre for its fighting. Two of them fault the storytelling." },
  { id: "duskbloods-delayed-to-2027", desk: "News", date: "2026-10-29", title: "FromSoftware delays The Duskbloods to 2027", dek: "The Switch 2 exclusive is in its final adjustment stage, FromSoftware says, and needs more time on rules and balance after its August network test." },
  { id: "worlds-2026-jungle-meta", desk: "Esports", date: "2026-10-28", title: "Worlds 2026 on patch 26.20: the jungle decides the draft", dek: "After three Swiss rounds in Allen, Texas, Vi and Nocturne were picked or banned in nearly every game, and two champions Riot nerfed for Worlds stayed central." },
  { id: "bioware-1995-2026", desk: "Features", date: "2026-10-24", title: "BioWare, 1995 to 2026: how a studio's long run ended", dek: "From Shattered Steel to The Veilguard, BioWare's closure caps a decade in which its games were repeatedly reshaped around EA's live-service plans." },
  { id: "evil-geniuses-shut-down", desk: "Esports", date: "2026-10-22", title: "Evil Geniuses will shut down on November 2 after more than 25 years", dek: "Left out of VCT Americas partnership for 2027, the North American organization cites thin sponsorship and rising costs. Its players are free to move." },
  { id: "ea-closes-bioware", desk: "News", date: "2026-10-21", title: "EA closes BioWare and ends work on the next Mass Effect", dek: "The studio behind Mass Effect and Dragon Age is shutting after more than 30 years, as part of about 400 job cuts at EA reported by Bloomberg." },
  { id: "loud-win-champions-shanghai", desk: "Esports", date: "2026-10-19", title: "LOUD beat Vitality to win VALORANT Champions Shanghai", dek: "The Brazilian side won the final 3–1 on October 18, becoming the first organization to win Champions twice, at the last event of VCT's partnership era." },
  { id: "boltgun-2-review", desk: "Reviews", date: "2026-10-17", title: "Warhammer 40,000: Boltgun 2 review round-up: two heroes, more routes", dek: "Critics agree a second hero and a branching campaign make Boltgun 2 a better shooter than the first. Dim enemy AI is the common complaint." },
  { id: "castlevania-belmonts-curse-review", desk: "Reviews", date: "2026-10-16", title: "Castlevania: Belmont's Curse review round-up: a hard start pays off", dek: "Critics love Rose Belmont's whip-swinging and the boss fights. They disagree on the difficulty curve, which starts steep and, for one, collapses late." },
  { id: "gears-of-war-e-day-review", desk: "Reviews", date: "2026-10-15", title: "Gears of War: E-Day review round-up: spectacle first, structure second", dek: "Critics praise Kalona, the combat and the new Siege mode. The semi-open campaign and its boss fights are where opinions split." },
  { id: "astralis-international-roster", desk: "Esports", date: "2026-10-14", title: "Astralis sign siuhy and cmtry, ending their all-Danish era", dek: "The four-time Major winners now field one Dane, Staehr, after benching HooXi and jabbi and adding a Polish in-game leader and a Ukrainian rifler." },
  { id: "skydance-merges-game-studios", desk: "News", date: "2026-10-07", title: "Skydance merges Warner Bros. Games with Paramount's game studio", dek: "With the Warner Bros. Discovery deal closed, Skydance is folding both companies' game teams into one division led by Tony Driscoll." },
];

const IMAGES = ["bar-live.webp", "table-market.webp", "salon-workshop.webp", "bar-cocktails.webp", "table-cellar.webp", "salon-reception.webp", "table-chef.webp", "bar-boards.webp", "salon-business.webp", "table-tasting.webp", "bar-wine.webp", "salon-private.webp"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

export const NEWS_PAGE_SIZE = 9;

export function newsSource(latencyMs = 650): DossierFeedSource<NewsRecord> {
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
        title: record.title,
        section: record.desk,
        published: { iso: record.date, label: day(record.date) },
        importance: IMPORTANCE[record.id],
        media: { src: `/library/dossier/${IMAGES[LIST.indexOf(record) % IMAGES.length]}`, alt: "" },
        excerpt: record.dek,
        body: [record.dek],
      }),
  };
}
