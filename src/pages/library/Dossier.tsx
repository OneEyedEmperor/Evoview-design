import { useMemo, useState, type MouseEvent } from "react";
import { ControlsProvider, GhostAction, Switch, buildControlsConfig } from "../../../components/controls/src";
import { ArrowRight, followRouteLink, pad, routeHrefs } from "../../../components/foundation/src";
import { Dossier as DossierModal, buildDossierConfig, dossierRoutes, type DossierConfig, type DossierItem, type DossierView } from "../../../components/dossier/src";
import "../../../components/dossier/showcase.css";
import ShowcasePage, { ShowcaseVariant, useShowcaseViewOpen } from "../../library/ShowcasePage";
import { useShowcaseSubpath } from "../../library/routing";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";

/* /components/dossier — one fictional restaurant (Maison Ardoise) in the two
   configurations a client actually chooses between: several universes behind
   a pager, or a single offer. Colour comes from the frame's --primary (or the
   per-universe accents); a locale switch only swaps copy, nothing remounts.

   Every view has a URL (docs/CRAWLABLE-MODALS.md): `<page>/<key>/` addresses
   the main variant (several universes), `<page>/single/<key>/` the
   one-universe variant. */
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
  explore: { fr: "Découvrir", en: "Explore" },
  openAria: (label: string, l: Locale) => (l === "fr" ? `Découvrir : ${label}` : `Explore: ${label}`),
} satisfies Record<string, unknown>;

const tr = <V,>(v: Localized<V>, l: Locale) => v[l];

const COVERS: Record<string, string> = {
  table: "/library/dossier/table-tasting.webp",
  bar: "/library/dossier/bar-cocktails.webp",
  salons: "/library/dossier/salon-private.webp",
};
const SINGLE_COVER = "/library/dossier/salon-reception.webp";

type Set = "multi" | "single";
/** The one-universe variant's views live under `<page>/single/`. */
const SINGLE_SEGMENT = "single";

const singleOnly = (config: DossierConfig): DossierConfig => ({ ...config, items: config.items.filter((item) => item.id === "salons") });

/** The view a page sub-path names, and the variant it belongs to. */
function viewFromSubpath(path: string, locale: Locale): { set: Set; view: DossierView | null } {
  const config = buildDossierConfig(locale);
  if (path === SINGLE_SEGMENT || path.startsWith(`${SINGLE_SEGMENT}/`)) {
    return { set: "single", view: dossierRoutes.parse(singleOnly(config), path.slice(SINGLE_SEGMENT.length + 1)) };
  }
  return { set: "multi", view: path ? dossierRoutes.parse(config, path) : null };
}

function Showcase() {
  const { locale } = useLibraryLocale();
  const { base, path } = useShowcaseSubpath();
  const [itemAccents, setItemAccents] = useState(false);
  // Seeded once from the URL; the modal keeps the URL in step from there. `set` is kept through the exit animation.
  const [state, setState] = useState(() => viewFromSubpath(path, locale));
  const { set, view } = state;
  // An open view owns the page's h1 (the page title renders as h2 meanwhile).
  useShowcaseViewOpen(view !== null);

  const multi = useMemo<DossierConfig>(() => {
    const config = buildDossierConfig(locale);
    return itemAccents ? config : { ...config, items: config.items.map((item) => ({ ...item, accent: undefined })) };
  }, [locale, itemAccents]);
  const single = useMemo(() => singleOnly(multi), [multi]);

  const hrefs = useMemo(() => {
    const singleViews = routeHrefs(`${base}/${SINGLE_SEGMENT}`, dossierRoutes.key);
    return {
      multi: routeHrefs(base, dossierRoutes.key),
      single: (v: DossierView | null) => (v === null ? base : singleViews(v)),
    };
  }, [base]);

  const launch = (nextSet: Set, next: DossierView) => setState({ set: nextSet, view: next });
  const launcher = (nextSet: Set, next: DossierView) => ({
    href: hrefs[nextSet](next),
    onClick: (event: MouseEvent<HTMLAnchorElement>) => followRouteLink(event, () => launch(nextSet, next)),
  });

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
              <Switch checked={itemAccents} onCheckedChange={setItemAccents} label={tr(T.multi.accent, locale)} description={tr(T.multi.accentHint, locale)} />
            </div>
          </div>
          <ul className="dsh-launchers">
            {multi.items.map((item, i) => (
              <li key={item.id} className="dsh-launchers__item" data-index={i + 1}>
                <Launcher item={item} cover={COVERS[item.id]} index={`${pad(i + 1)} / ${pad(multi.items.length)}`} locale={locale} {...launcher("multi", { item: item.id })} />
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
          <Launcher item={single.items[0]} cover={SINGLE_COVER} locale={locale} wide {...launcher("single", { item: "salons" })} />
        </div>
      </ShowcaseVariant>

      <DossierModal
        config={set === "single" ? single : multi}
        view={view}
        onNavigate={(next) => setState((s) => ({ ...s, view: next }))}
        hrefFor={hrefs[set]}
      />
    </ControlsProvider>
  );
}

type LauncherProps = { item: DossierItem; cover: string; index?: string; locale: Locale; wide?: boolean; href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void };

function Launcher({ item, cover, index, locale, wide = false, href, onClick }: LauncherProps) {
  return (
    <a className="dsh-launcher" href={href} data-wide={wide || undefined} aria-label={T.openAria(item.label, locale)} onClick={onClick}>
      <span className="dsh-launcher__media">
        <img src={cover} alt="" decoding="async" />
      </span>
      <span className="dsh-launcher__meta">
        {index && <span className="ev-t-readout dsh-launcher__index">{index}</span>}
        <span className="ev-t-card dsh-launcher__title">{item.label}</span>
        <span className="ev-t-compact dsh-launcher__entries">{item.entries.map((e) => e.label ?? e.title).join(" · ")}</span>
      </span>
      <span className="dsh-launcher__cta" aria-hidden="true">
        <span>{tr(T.explore, locale)}</span>
        <ArrowRight />
      </span>
    </a>
  );
}
