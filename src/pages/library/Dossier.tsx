import { useMemo, useState, type MouseEvent } from "react";
import { ControlsProvider, GhostAction, SegmentedControl, Switch, buildControlsConfig } from "../../../components/controls/src";
import { ArrowRight, followRouteLink, pad, routeHrefs, useMediaQuery } from "../../../components/foundation/src";
import { Dossier as DossierModal, buildDossierConfig, dossierRoutes, useDossierFeed, type DossierComposition, type DossierConfig, type DossierFeed, type DossierTileMedia, type DossierView } from "../../../components/dossier/src";
import { buildDossierFeedConfig, buildDossierMenuConfig } from "../../../components/dossier/src/dossier.config";
import { journalSource, JOURNAL_PAGE_SIZE, type JournalNetwork } from "./dossier/journal";
import { NEWSROOM_BRAND, NEWSROOM_LABEL, newsSource } from "./dossier/newsroom";
import type { DossierFeedCards, DossierFeedSource } from "../../../components/dossier/src";
import { topView } from "../../../components/dossier/src/routes";
import "../../../components/dossier/showcase.css";
import ShowcasePage, { ShowcaseVariant, useShowcaseViewOpen } from "../../library/ShowcasePage";
import { useShowcaseSubpath } from "../../library/routing";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";
import { DeskSetting, SceneDesk, deskOptions } from "./scene/Scene";

/* /components/dossier — one fictional restaurant (Maison Ardoise) in the
   configurations a client actually chooses between: several universes behind
   a pager, a single offer, and its menu behind an opening screen (the menu or
   the day's specials, a live list). Colour comes from the frame's --primary
   (or the per-universe accents); a locale switch only swaps copy, nothing
   remounts. The desks pick the composition (panorama | sheet, shown from
   1024 only: below it both are the same), the tiles' photos (graded | true
   colour) and how many specials are posted.

   Every view has a URL (docs/CRAWLABLE-MODALS.md): `<page>/<key>/` addresses
   the main variant (several universes), `<page>/single/<key>/` the
   one-universe variant, `<page>/opening/<key>/` the menu. */
export default function DossierPage() {
  return (
    <ShowcasePage
      entryId="dossier"
      title={() => <em>Dossier</em>}
      tone="dark"
    >
      <Showcase />
    </ShowcasePage>
  );
}

const T = {
  multi: {
    name: { fr: "Dossier · plusieurs univers", en: "Dossier · several universes" },
    when: {
      fr: "Une offre en plusieurs familles. Chaque univers ouvre un sommaire de quatre expériences, racontées en chapitres ; le pager passe d'un univers à l'autre sans fermer.",
      en: "An offer in several families. Each universe opens an overview of four experiences, told in chapters; the pager moves between universes without closing.",
    },
    title: { fr: "Trois façons de passer la soirée.", en: "Three ways to spend the evening." },
    body: {
      fr: "La table, le bar, les salons : chaque univers se découvre en quatre expériences, avec ce qu'il faut savoir avant de venir et une seule action à la fin.",
      en: "The table, the bar, the private rooms: each universe unfolds in four experiences, with what to know before coming and one action at the end.",
    },
    deep: { fr: "Voir directement le menu dégustation", en: "Go straight to the tasting menu" },
    accent: { fr: "Un accent par univers", en: "One accent per universe" },
    accentHint: {
      fr: "Activé, chaque univers donne sa couleur au dossier. Désactivé, le dossier suit l'accent du site, ici la palette.",
      en: "On, each universe gives the dossier its colour. Off, the dossier follows the site accent, here the palette.",
    },
  },
  single: {
    name: { fr: "Dossier · un seul univers", en: "Dossier · one universe" },
    when: {
      fr: "Une seule offre en quatre parties. Sans univers à parcourir, l'en-tête perd son pager et la fin de lecture ramène au sommaire.",
      en: "A single offer in four parts. With no universe to browse, the header drops its pager and the end of a read returns to the overview.",
    },
    title: { fr: "Privatiser la maison.", en: "Have the house to yourselves." },
    body: {
      fr: "Dîner privé, déjeuner d'affaires, réception dans la cour, atelier : quatre formules, une seule demande.",
      en: "Private dinner, business lunch, courtyard reception, workshop: four formats, one request.",
    },
  },
  menu: {
    name: { fr: "Dossier · écran d'ouverture", en: "Dossier · opening screen" },
    when: {
      fr: "Une carte à consulter d'un coup d'œil, depuis n'importe quelle page. Un premier écran choisit entre la carte et les suggestions du jour, une liste que le restaurant tient à jour lui-même.",
      en: "A menu to glance at from any page. A first screen chooses between the menu and today's specials, a list the restaurant keeps up to date itself.",
    },
    title: { fr: "La carte, sans quitter la page.", en: "The menu, without leaving the page." },
    body: {
      fr: "La carte de saison d'un côté, les suggestions du jour de l'autre. Les jours sans suggestion, le dossier le dit et renvoie à la carte.",
      en: "The seasonal menu on one side, today's specials on the other. On a day without specials, the dossier says so and points to the menu.",
    },
  },
  journal: {
    name: { fr: "Dossier · fil en direct", en: "Dossier · live feed" },
    when: {
      fr: "Un fil qui s'allonge : actualités, publications, journal. Les entrées arrivent par lots de neuf au fil de la lecture, chaque page a sa propre adresse, les nouveautés attendent qu'on les demande.",
      en: "A feed that keeps growing: news, posts, a journal. Entries arrive in batches of nine as the visitor reads, every page has its own address, new entries wait to be asked for.",
    },
    title: { fr: "Le journal de la maison.", en: "The house's journal." },
    body: {
      fr: "Producteurs, carte, cave, équipe et rendez-vous : le restaurant publie, le dossier suit, sans jamais déplacer ce qu'on est en train de lire.",
      en: "Producers, menu, cellar, team and events: the restaurant posts, the dossier follows, never moving what the visitor is reading.",
    },
  },
  explore: { fr: "Découvrir", en: "Explore" },
  openAria: (label: string, l: Locale) => (l === "fr" ? `Découvrir : ${label}` : `Explore: ${label}`),
} satisfies Record<string, unknown>;

/* Desk labels: the page's own records (they name what the reader sees, not the package's option ids). */
const DESK = {
  fr: {
    composition: { label: "Composition", options: { panorama: "Panorama", sheet: "Feuillet" } },
    tiles: { label: "Photos", options: { graded: "Gradées", "true-colour": "Couleur" } },
    cards: { label: "Cartes", options: { editions: "Éditions", tiles: "Vignettes" } },
    specials: { label: "Suggestions du jour", options: { "0": "Aucune", "3": "Trois", "5": "Cinq" } },
  },
  en: {
    composition: { label: "Composition", options: { panorama: "Panorama", sheet: "Sheet" } },
    tiles: { label: "Photos", options: { graded: "Graded", "true-colour": "True colour" } },
    cards: { label: "Cards", options: { editions: "Editions", tiles: "Tiles" } },
    specials: { label: "Today's specials", options: { "0": "None", "3": "Three", "5": "Five" } },
  },
} satisfies Localized<unknown>;

type Specials = "0" | "3" | "5";

const tr = <V,>(v: Localized<V>, l: Locale) => v[l];

const COVERS: Record<string, string> = {
  table: "/library/dossier/table-tasting.webp",
  bar: "/library/dossier/bar-cocktails.webp",
  salons: "/library/dossier/salon-private.webp",
};
const SINGLE_COVER = "/library/dossier/salon-reception.webp";
const MENU_COVER = "/library/dossier/table-market.webp";
const JOURNAL_COVER = "/library/dossier/table-chef.webp";

type Set = "multi" | "single" | "menu" | "journal";
/** The one-universe variant's views live under `<page>/single/`, the menu's under `<page>/opening/`, the feed's under `<page>/journal/`. */
const SEGMENTS = { single: "single", menu: "opening", journal: "journal" } as const;
const SPECIALS_DEFAULT: Specials = "3";

const singleOnly = (config: DossierConfig): DossierConfig => ({ ...config, items: config.items.filter((item) => item.id === "salons") });
const under = (path: string, segment: string) => (path === segment || path.startsWith(`${segment}/`) ? path.slice(segment.length + 1) : null);

/** A sub-path's view; an unknown key falls back to its nearest existing ancestor, else the top level (a removed entry). */
function nearestView(config: DossierConfig, key: string): DossierView | null {
  const parts = key.split("/");
  for (let n = parts.length; n > 0; n -= 1) {
    const view = dossierRoutes.parse(config, parts.slice(0, n).join("/"));
    if (view) return view;
  }
  return topView(config);
}

/** The view a page sub-path names, and the variant it belongs to. */
function viewFromSubpath(path: string, locale: Locale, feed: DossierFeed): { set: Set; view: DossierView | null } {
  const config = buildDossierConfig(locale);
  const journal = under(path, SEGMENTS.journal);
  if (journal !== null) return { set: "journal", view: journal ? nearestView(buildDossierFeedConfig(locale, feed), journal) : null };
  const single = under(path, SEGMENTS.single);
  if (single !== null) return { set: "single", view: single ? nearestView(singleOnly(config), single) : null };
  const menu = under(path, SEGMENTS.menu);
  if (menu !== null) return { set: "menu", view: menu ? nearestView(buildDossierMenuConfig(locale, { specials: Number(SPECIALS_DEFAULT) }), menu) : null };
  return { set: "multi", view: path ? nearestView(config, path) : null };
}

function Showcase() {
  const { locale } = useLibraryLocale();
  const desk = DESK[locale];
  const { base, path } = useShowcaseSubpath();
  // Below 1024 both compositions are the same phone / tablet dossier: the choice only exists where it shows.
  const wide = useMediaQuery("(min-width: 1024px)", true);
  const [itemAccents, setItemAccents] = useState(false);
  const [composition, setComposition] = useState<DossierComposition>("panorama");
  const [menuComposition, setMenuComposition] = useState<DossierComposition>("sheet");
  const [tileMedia, setTileMedia] = useState<DossierTileMedia>("graded");
  const [menuTileMedia, setMenuTileMedia] = useState<DossierTileMedia>("graded");
  const [specials, setSpecials] = useState<Specials>(SPECIALS_DEFAULT);
  /* The live feed: a fake paginated API (latency), live updates every 8 s while its first page is on screen. Test hooks
     (nothing visible): `?feed-cap=N`, batches appended in place before the next page's URL; `?feed-network=down` (every
     call fails) or `down-from-2` (page 1 loads, later pages and single entries fail); `?feed-demo=newsroom`, a fictional
     city paper's real-length headlines (sections, days, importance tiers) instead of the journal, no live updates. */
  const [hooks] = useState(() => {
    const query = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
    const network = query?.get("feed-network");
    return {
      cap: Number(query?.get("feed-cap")) || undefined,
      network: (network === "down" || network === "down-from-2" ? network : "normal") as JournalNetwork,
      newsroom: query?.get("feed-demo") === "newsroom",
    };
  });
  const feedCap = hooks.cap;
  const source = useMemo(
    () =>
      (hooks.newsroom ? newsSource(locale) : journalSource(locale, { network: () => hooks.network })) as unknown as DossierFeedSource<object>,
    [locale, hooks],
  );
  const feed = useDossierFeed(source, { pageSize: JOURNAL_PAGE_SIZE, refreshMs: hooks.newsroom ? undefined : 8000, batchCap: feedCap });
  const [journalComposition, setJournalComposition] = useState<DossierComposition>("panorama");
  const [journalCards, setJournalCards] = useState<DossierFeedCards>("editions");
  // Seeded once from the URL; the modal keeps the URL in step from there. `set` is kept through the exit animation.
  const [state, setState] = useState(() => viewFromSubpath(path, locale, feed));
  const { set, view } = state;
  // An open view owns the page's h1 (the page title renders as h2 meanwhile).
  useShowcaseViewOpen(view !== null);
  /* Test hook (`?lazy-mount`, nothing visible): the modal mounts on its first launch, already holding the view, as a
     client that loads the dossier on intent does. That mount is an in-page open, never a direct load. */
  const [lazyMount] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("lazy-mount"));
  const [launched, setLaunched] = useState(false);
  if (lazyMount && view && !launched) setLaunched(true);

  const multi = useMemo<DossierConfig>(() => {
    const config = buildDossierConfig(locale);
    const items = itemAccents ? config.items : config.items.map((item) => ({ ...item, accent: undefined }));
    return { ...config, items, composition, tileMedia };
  }, [locale, itemAccents, composition, tileMedia]);
  const single = useMemo(() => singleOnly(multi), [multi]);
  // The menu (a page of its own on a client site, often entered from search) loads its URL at rest; the universes keep the entrance.
  const menu = useMemo<DossierConfig>(
    () => ({ ...buildDossierMenuConfig(locale, { specials: Number(specials), composition: menuComposition }), tileMedia: menuTileMedia, directLoad: "at-rest" }),
    [locale, specials, menuComposition, menuTileMedia],
  );
  const journal = useMemo(() => {
    const config = buildDossierFeedConfig(locale, feed, { composition: journalComposition, feedCards: journalCards });
    if (!hooks.newsroom) return config;
    return { ...config, tileMedia: "graded" as const, brand: { name: NEWSROOM_BRAND[locale] }, items: config.items.map((item) => ({ ...item, label: NEWSROOM_LABEL[locale] })) };
  }, [locale, feed, journalComposition, journalCards, hooks]);
  const configs = { multi, single, menu, journal };

  const hrefs = useMemo(() => {
    const nested = (segment: string) => {
      const views = routeHrefs(`${base}/${segment}`, dossierRoutes.key);
      return (v: DossierView | null) => (v === null ? base : views(v));
    };
    return { multi: routeHrefs(base, dossierRoutes.key), single: nested(SEGMENTS.single), menu: nested(SEGMENTS.menu), journal: nested(SEGMENTS.journal) };
  }, [base]);

  const launch = (nextSet: Set, next: DossierView) => setState({ set: nextSet, view: next });
  const launcher = (nextSet: Set, next: DossierView) => ({
    href: hrefs[nextSet](next),
    onClick: (event: MouseEvent<HTMLAnchorElement>) => followRouteLink(event, () => launch(nextSet, next)),
  });
  const compositionSetting = (value: DossierComposition, onChange: (v: DossierComposition) => void) =>
    wide && (
      <DeskSetting label={desk.composition.label}>
        <SegmentedControl block label={desk.composition.label} options={deskOptions(desk.composition.options)} value={value} onChange={(v) => onChange(v as DossierComposition)} />
      </DeskSetting>
    );
  const tilesSetting = (value: DossierTileMedia, onChange: (v: DossierTileMedia) => void) => (
    <DeskSetting label={desk.tiles.label}>
      <SegmentedControl block label={desk.tiles.label} options={deskOptions(desk.tiles.options)} value={value} onChange={(v) => onChange(v as DossierTileMedia)} />
    </DeskSetting>
  );

  return (
    <ControlsProvider config={buildControlsConfig(locale)}>
      <ShowcaseVariant name={tr(T.multi.name, locale)} when={tr(T.multi.when, locale)} rhythm="standard">
        <div className="ev-root ev-chapter lib-rail dsh-scene">
          <div className="dsh-scene__copy">
            <h2 className="ev-t-section-feature">{tr(T.multi.title, locale)}</h2>
            <p className="ev-t-body dsh-scene__body">{tr(T.multi.body, locale)}</p>
            <GhostAction icon={<ArrowRight />} iconPosition="end" {...launcher("multi", { item: "table", entry: "tasting" })}>
              {tr(T.multi.deep, locale)}
            </GhostAction>
            <div className="dsh-scene__choice">
              <SceneDesk className="dsh-desk">
                {compositionSetting(composition, setComposition)}
                {tilesSetting(tileMedia, setTileMedia)}
              </SceneDesk>
              <Switch checked={itemAccents} onCheckedChange={setItemAccents} label={tr(T.multi.accent, locale)} description={tr(T.multi.accentHint, locale)} />
            </div>
          </div>
          <ul className="dsh-launchers">
            {multi.items.map((item, i) => (
              <li key={item.id} className="dsh-launchers__item" data-index={i + 1}>
                <Launcher
                  title={item.label}
                  meta={item.entries.map((e) => e.label ?? e.title).join(" · ")}
                  cover={COVERS[item.id]}
                  index={`${pad(i + 1)} / ${pad(multi.items.length)}`}
                  locale={locale}
                  {...launcher("multi", { item: item.id })}
                />
              </li>
            ))}
          </ul>
        </div>
      </ShowcaseVariant>

      <ShowcaseVariant name={tr(T.single.name, locale)} when={tr(T.single.when, locale)} tone="light" rhythm="standard">
        <div className="ev-root ev-chapter lib-rail dsh-scene dsh-scene--single">
          <div className="dsh-scene__head">
            <h2 className="ev-t-section-feature">{tr(T.single.title, locale)}</h2>
            <p className="ev-t-body dsh-scene__body">{tr(T.single.body, locale)}</p>
          </div>
          <Launcher
            title={single.items[0].label}
            meta={single.items[0].entries.map((e) => e.label ?? e.title).join(" · ")}
            cover={SINGLE_COVER}
            locale={locale}
            wide
            {...launcher("single", { item: "salons" })}
          />
        </div>
      </ShowcaseVariant>

      <ShowcaseVariant name={tr(T.menu.name, locale)} when={tr(T.menu.when, locale)} rhythm="standard">
        <div className="ev-root ev-chapter lib-rail dsh-scene">
          <div className="dsh-scene__copy">
            <h2 className="ev-t-section-feature">{tr(T.menu.title, locale)}</h2>
            <p className="ev-t-body dsh-scene__body">{tr(T.menu.body, locale)}</p>
            <div className="dsh-scene__choice">
              <SceneDesk className="dsh-desk">
                {compositionSetting(menuComposition, setMenuComposition)}
                {tilesSetting(menuTileMedia, setMenuTileMedia)}
                <DeskSetting label={desk.specials.label}>
                  <SegmentedControl block label={desk.specials.label} options={deskOptions(desk.specials.options)} value={specials} onChange={(v) => setSpecials(v as Specials)} />
                </DeskSetting>
              </SceneDesk>
            </div>
          </div>
          <Launcher
            title={menu.opening?.title ?? ""}
            meta={menu.items.map((item) => item.label).join(" · ")}
            cover={MENU_COVER}
            locale={locale}
            wide
            {...launcher("menu", { opening: "choose" })}
          />
        </div>
      </ShowcaseVariant>

      <ShowcaseVariant name={tr(T.journal.name, locale)} when={tr(T.journal.when, locale)} tone="light" rhythm="standard">
        <div className="ev-root ev-chapter lib-rail dsh-scene">
          <div className="dsh-scene__copy">
            <h2 className="ev-t-section-feature">{tr(T.journal.title, locale)}</h2>
            <p className="ev-t-body dsh-scene__body">{tr(T.journal.body, locale)}</p>
            {/* Composition only exists from 1024 (below it both are the same dossier); Cards change the board at every width. */}
            <div className="dsh-scene__choice">
              <SceneDesk className="dsh-desk">
                {compositionSetting(journalComposition, setJournalComposition)}
                <DeskSetting label={desk.cards.label}>
                  <SegmentedControl block label={desk.cards.label} options={deskOptions(desk.cards.options)} value={journalCards} onChange={(v) => setJournalCards(v as DossierFeedCards)} />
                </DeskSetting>
              </SceneDesk>
            </div>
          </div>
          <Launcher
            title={journal.items[0].label}
            meta={journal.items[0].description ?? ""}
            cover={JOURNAL_COVER}
            locale={locale}
            wide
            {...launcher("journal", { item: "journal" })}
          />
        </div>
      </ShowcaseVariant>

      {(!lazyMount || launched) && (
        <DossierModal config={configs[set]} view={view} onNavigate={(next) => setState((s) => ({ ...s, view: next }))} hrefFor={hrefs[set]} />
      )}
    </ControlsProvider>
  );
}

type LauncherProps = { title: string; meta: string; cover: string; index?: string; locale: Locale; wide?: boolean; href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void };

function Launcher({ title, meta, cover, index, locale, wide = false, href, onClick }: LauncherProps) {
  return (
    <a className="dsh-launcher" href={href} data-wide={wide || undefined} aria-label={T.openAria(title, locale)} onClick={onClick}>
      <span className="dsh-launcher__media">
        <img src={cover} alt="" decoding="async" />
      </span>
      <span className="dsh-launcher__meta">
        {index && <span className="ev-t-readout dsh-launcher__index">{index}</span>}
        <span className="ev-t-card dsh-launcher__title">{title}</span>
        <span className="ev-t-compact dsh-launcher__entries">{meta}</span>
      </span>
      <span className="dsh-launcher__cta" aria-hidden="true">
        <span>{tr(T.explore, locale)}</span>
        <ArrowRight />
      </span>
    </a>
  );
}
