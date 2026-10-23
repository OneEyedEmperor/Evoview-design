import { useMemo, useState } from "react";
import { ControlsProvider, GhostAction, Switch, buildControlsConfig } from "../../../components/controls/src";
import { ArrowRight, pad } from "../../../components/foundation/src";
import { Dossier as DossierModal, buildDossierConfig, type DossierConfig, type DossierItem } from "../../../components/dossier/src";
import "../../../components/dossier/showcase.css";
import ShowcasePage, { ShowcaseVariant } from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";

/* /components/dossier — one fictional restaurant (Maison Ardoise) in the two
   configurations a client actually chooses between: several universes behind
   a pager, or a single offer. Colour comes from the frame's --primary (or the
   per-universe accents); a locale switch only swaps copy, nothing remounts. */
export default function DossierPage() {
  return (
    <ShowcasePage
      entryId="dossier"
      title={() => <em>Dossier</em>}
      intro={{
        fr: "Pour une offre en plusieurs parties : le visiteur choisit, lit, puis agit — sans quitter la page, et revient toujours où il était.",
        en: "For an offer in several parts: visitors choose, read, then act — without leaving the page, and always come back where they were.",
      }}
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

type Open = { set: "multi" | "single"; item: string; entry?: string };

function Showcase() {
  const { locale } = useLibraryLocale();
  const [itemAccents, setItemAccents] = useState(false);
  const [open, setOpen] = useState<Open | null>(null);
  // The set of the last open, kept through the exit animation.
  const [set, setSet] = useState<Open["set"]>("multi");

  const multi = useMemo<DossierConfig>(() => {
    const base = buildDossierConfig(locale);
    return itemAccents ? base : { ...base, items: base.items.map((item) => ({ ...item, accent: undefined })) };
  }, [locale, itemAccents]);
  const single = useMemo<DossierConfig>(() => ({ ...multi, items: multi.items.filter((item) => item.id === "salons") }), [multi]);

  const launch = (next: Open) => {
    setSet(next.set);
    setOpen(next);
  };

  return (
    <ControlsProvider config={buildControlsConfig(locale)}>
      <ShowcaseVariant name={tr(T.multi.name, locale)} when={tr(T.multi.when, locale)} rhythm="standard">
        <div className="ev-root ev-chapter lib-rail dsh-scene">
          <div className="dsh-scene__copy">
            <h2 className="ev-t-section-feature">{tr(T.multi.title, locale)}</h2>
            <p className="ev-t-body dsh-scene__body">{tr(T.multi.body, locale)}</p>
            <GhostAction icon={<ArrowRight />} iconPosition="end" onClick={() => launch({ set: "multi", item: "table", entry: "tasting" })}>
              {tr(T.multi.deep, locale)}
            </GhostAction>
            <div className="dsh-scene__choice">
              <Switch checked={itemAccents} onCheckedChange={setItemAccents} label={tr(T.multi.accent, locale)} description={tr(T.multi.accentHint, locale)} />
            </div>
          </div>
          <ul className="dsh-launchers">
            {multi.items.map((item, i) => (
              <li key={item.id} className="dsh-launchers__item" data-index={i + 1}>
                <Launcher item={item} cover={COVERS[item.id]} index={`${pad(i + 1)} / ${pad(multi.items.length)}`} locale={locale} onOpen={() => launch({ set: "multi", item: item.id })} />
              </li>
            ))}
          </ul>
        </div>
      </ShowcaseVariant>

      <ShowcaseVariant name={tr(T.single.name, locale)} when={tr(T.single.when, locale)} tone="light" rhythm="standard">
        <div className="ev-root ev-chapter lib-rail dsh-scene dsh-scene--single">
          <div className="dsh-scene__copy">
            <h2 className="ev-t-section-feature">{tr(T.single.title, locale)}</h2>
            <p className="ev-t-body dsh-scene__body">{tr(T.single.body, locale)}</p>
          </div>
          <Launcher item={single.items[0]} cover={SINGLE_COVER} locale={locale} wide onOpen={() => launch({ set: "single", item: "salons" })} />
        </div>
      </ShowcaseVariant>

      <DossierModal
        className="dsh-modal"
        config={set === "single" ? single : multi}
        open={open !== null}
        onClose={() => setOpen(null)}
        initialItemId={open?.item}
        initialEntryId={open?.entry}
      />
    </ControlsProvider>
  );
}

function Launcher({ item, cover, index, locale, wide = false, onOpen }: { item: DossierItem; cover: string; index?: string; locale: Locale; wide?: boolean; onOpen: () => void }) {
  return (
    <button type="button" className="dsh-launcher" data-wide={wide || undefined} aria-label={T.openAria(item.label, locale)} onClick={onOpen}>
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
    </button>
  );
}
