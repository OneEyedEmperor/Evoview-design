import { useMemo, useState } from "react";
import { ControlsProvider, GhostAction, SegmentedControl, Switch, buildControlsConfig } from "../../../components/controls/src";
import { ArrowRight, Index, Readout, pad } from "../../../components/foundation/src";
import { ChapterRows, Dossier as DossierModal, DossierLoader, buildDossierConfig, type DossierConfig } from "../../../components/dossier/src";
import "../../../components/dossier/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";

/* /components/dossier — a client page (Maison Ardoise) launching the dossier,
   its modal contract, and the loader as a specimen. Colour comes from the
   frame's --primary; nothing re-renders on a swatch. */
export default function DossierPage() {
  return (
    <ShowcasePage
      entryId="dossier"
      title={(l) => (l === "fr" ? <>Le <em>dossier</em></> : <>The <em>dossier</em></>)}
      intro={{
        fr: "Une modale portail pour toute offre en plusieurs parties : un tableau de sélection, des chapitres à lire, un retour toujours fiable.",
        en: "A portal modal for any multi-part offer: a selection board, chapters to read, a return that always works.",
      }}
      tone="dark"
    >
      <Showcase />
    </ShowcasePage>
  );
}

const T = {
  context: {
    index: { fr: "Sur un site client", en: "On a client site" },
    kicker: { fr: "Maison Ardoise · restaurant fictif", en: "Maison Ardoise · fictional restaurant" },
    title: { fr: "Trois façons de passer la soirée.", en: "Three ways to spend the evening." },
    body: {
      fr: "Chaque univers ouvre un dossier : quatre expériences au sommaire, puis des chapitres à lire. Le visiteur reste sur la page, et revient toujours où il était.",
      en: "Each universe opens a dossier: four experiences on the overview, then chapters to read. Visitors stay on the page and always come back where they were.",
    },
    entries: { fr: "4 expériences", en: "4 experiences" },
    open: { fr: "Ouvrir le dossier", en: "Open the dossier" },
    openAria: (label: string, l: Locale) => (l === "fr" ? `Ouvrir le dossier : ${label}` : `Open the dossier: ${label}`),
    deep: { fr: "Lien direct : menu dégustation", en: "Deep link: tasting menu" },
    accentLabel: { fr: "Un accent par univers", en: "One accent per universe" },
    accentHint: {
      fr: "Désactivé, le dossier suit l'accent de la palette, en direct. Activé, chaque univers impose sa propre couleur.",
      en: "Off, the dossier follows the palette accent, live. On, each universe brings its own colour.",
    },
  },
  contract: {
    index: { fr: "Contrat de la modale", en: "Modal contract" },
    title: { fr: "Toujours savoir où l'on est. Toujours pouvoir revenir.", en: "Always know where you are. Always get back." },
    rows: {
      fr: [
        ["Échap", "Remonte d'un niveau : chapitre → sommaire → fermeture."],
        ["Retour", "Le bouton retour du navigateur suit la même logique."],
        ["Focus", "Arrive sur Fermer, reste dans la modale, revient au lanceur."],
        ["Page", "Inerte et suspendue derrière : ses animations s'arrêtent."],
        ["Mobile", "Capsule et dock en verre ; ils s'effacent à la lecture."],
      ],
      en: [
        ["Escape", "Goes up one level: chapter → overview → close."],
        ["Back", "The browser's Back button follows the same logic."],
        ["Focus", "Lands on Close, stays in the modal, returns to the launcher."],
        ["Page", "Inert and suspended behind: its loops stop."],
        ["Mobile", "Glass capsule and dock; they step aside while reading."],
      ],
    },
  },
  loader: {
    index: { fr: "Chargement honnête", en: "Honest loading" },
    title: { fr: "Rien ne s'affiche avant d'être prêt.", en: "Nothing shows before it is ready." },
    body: {
      fr: "Le loader n'apparaît qu'après 350 ms d'attente, compte les médias décodés et propose de réessayer en cas d'échec.",
      en: "The loader only appears after 350 ms, counts the decoded media and offers a retry on failure.",
    },
    state: { fr: "État du loader", en: "Loader state" },
    loading: { fr: "En cours", en: "Loading" },
    failed: { fr: "Échec", en: "Failed" },
  },
} satisfies Record<string, unknown>;

const tr = <V,>(v: Localized<V>, l: Locale) => v[l];

const COVERS: Record<string, string> = {
  table: "/library/dossier/table-tasting.webp",
  bar: "/library/dossier/bar-cocktails.webp",
  salons: "/library/dossier/salon-private.webp",
};

function Showcase() {
  const { locale } = useLibraryLocale();
  const [itemAccents, setItemAccents] = useState(false);
  const [open, setOpen] = useState<{ item: string; entry?: string } | null>(null);

  const config = useMemo<DossierConfig>(() => {
    const base = buildDossierConfig(locale);
    return itemAccents ? base : { ...base, items: base.items.map((item) => ({ ...item, accent: undefined })) };
  }, [locale, itemAccents]);

  return (
    <ControlsProvider config={buildControlsConfig(locale)}>
      <div className="ev-root ev-tone-dark dsh">
        <div className="lib-rail">
          <ClientContext config={config} locale={locale} itemAccents={itemAccents} onAccents={setItemAccents} onOpen={(item, entry) => setOpen({ item, entry })} />
          <Contract locale={locale} />
          <LoaderSpecimen locale={locale} />
        </div>
        <DossierModal
          config={config}
          open={open !== null}
          onClose={() => setOpen(null)}
          initialItemId={open?.item}
          initialEntryId={open?.entry}
        />
      </div>
    </ControlsProvider>
  );
}

function SectionHead({ n, label, title, body }: { n: number; label: string; title: string; body?: string }) {
  return (
    <header className="dsh-head">
      <div className="dsh-head__index">
        <Index current={n} total={3} size="lg" />
        <Readout>{label}</Readout>
      </div>
      <h2 className="ev-t-section">{title}</h2>
      {body && <p className="ev-t-body dsh-head__body">{body}</p>}
    </header>
  );
}

function ClientContext({ config, locale, itemAccents, onAccents, onOpen }: { config: DossierConfig; locale: Locale; itemAccents: boolean; onAccents: (v: boolean) => void; onOpen: (item: string, entry?: string) => void }) {
  const t = T.context;
  return (
    <section className="dsh-section dsh-context" aria-labelledby="dsh-context">
      <div className="dsh-context__copy">
        <div className="dsh-head__index">
          <Index current={1} total={3} size="lg" />
          <Readout>{tr(t.index, locale)}</Readout>
        </div>
        <Readout className="dsh-context__kicker">{tr(t.kicker, locale)}</Readout>
        <h2 id="dsh-context" className="ev-t-section-feature">{tr(t.title, locale)}</h2>
        <p className="ev-t-body dsh-head__body">{tr(t.body, locale)}</p>
        <GhostAction icon={<ArrowRight />} iconPosition="end" onClick={() => onOpen("table", "tasting")}>
          {tr(t.deep, locale)}
        </GhostAction>
        <div className="dsh-context__switch">
          <Switch checked={itemAccents} onCheckedChange={onAccents} label={tr(t.accentLabel, locale)} description={tr(t.accentHint, locale)} />
        </div>
      </div>
      <ul className="dsh-launchers">
        {config.items.map((item, i) => (
          <li key={item.id} className="dsh-launchers__item" data-index={i + 1}>
            <button type="button" className="dsh-launcher" aria-label={T.context.openAria(item.label, locale)} onClick={() => onOpen(item.id)}>
              <span className="dsh-launcher__media">
                <img src={COVERS[item.id]} alt="" decoding="async" />
              </span>
              <span className="dsh-launcher__meta">
                <span className="ev-t-readout dsh-launcher__index">{pad(i + 1)} / {pad(config.items.length)}</span>
                <span className="ev-t-card dsh-launcher__title">{item.label}</span>
                <span className="ev-t-readout dsh-launcher__count">{tr(t.entries, locale)}</span>
              </span>
              <span className="dsh-launcher__cta">
                <span>{tr(t.open, locale)}</span>
                <ArrowRight />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contract({ locale }: { locale: Locale }) {
  const t = T.contract;
  return (
    <section className="dsh-section dsh-split" aria-label={tr(t.index, locale)}>
      <SectionHead n={2} label={tr(t.index, locale)} title={tr(t.title, locale)} />
      <ChapterRows className="dsh-rows" rows={tr(t.rows, locale).map(([label, detail]) => ({ label, detail }))} />
    </section>
  );
}

function LoaderSpecimen({ locale }: { locale: Locale }) {
  const t = T.loader;
  const [state, setState] = useState("loading");
  const copy = buildDossierConfig(locale).copy.loader;
  return (
    <section className="dsh-section dsh-split" aria-label={tr(t.index, locale)}>
      <div className="dsh-loader-copy">
        <SectionHead n={3} label={tr(t.index, locale)} title={tr(t.title, locale)} body={tr(t.body, locale)} />
        <SegmentedControl
          label={tr(t.state, locale)}
          value={state}
          onChange={setState}
          options={[
            { value: "loading", label: tr(t.loading, locale) },
            { value: "failed", label: tr(t.failed, locale) },
          ]}
        />
      </div>
      <div className="evd-scope dsh-loader">
        <DossierLoader
          kicker={copy.overviewKicker(1)}
          title={copy.title}
          status={copy.status}
          loaded={2}
          total={4}
          spoken={copy.spoken(2, 4)}
          failed={state === "failed"}
          failedText={copy.failed}
          retryLabel={copy.retry}
          onRetry={() => setState("loading")}
        />
      </div>
    </section>
  );
}
