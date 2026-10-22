import { Link } from "react-router-dom";
import { Cover } from "../../library/covers";
import LocaleToggle from "../../library/LocaleToggle";
import { useLibraryLocale, type Localized } from "../../library/locale";
import { CATEGORY_LABEL, REGISTRY, entriesOf, getEntry, pad2, type Category, type RegistryEntry } from "../../library/registry";
import StatusTag from "../../library/StatusTag";

/* The library index: one display title, then the two categories as
   chapters (paper / night), the navbar as a smaller third entry. */

const COPY = {
  fr: {
    title: (
      <>
        Bibliothèque <em>Evoview</em>
      </>
    ),
    intro: "Les sections et composants des sites Evoview, extraits du site, découplés et prêts à adapter pour chaque client.",
    count: (n: number, ready: number) => `${pad2(n)} entrées · ${pad2(ready)} prêtes`,
    navbarLinks: { reference: "Démo multi-page", onePage: "Exemple une page" },
  },
  en: {
    title: (
      <>
        Evoview <em>library</em>
      </>
    ),
    intro: "The sections and components behind Evoview sites, extracted from the site, decoupled and ready to adapt for each client.",
    count: (n: number, ready: number) => `${pad2(n)} entries · ${pad2(ready)} ready`,
    navbarLinks: { reference: "Multi-page demo", onePage: "One-page example" },
  },
};

const CHAPTERS: { category: Exclude<Category, "navbar">; tone: "light" | "dark"; kicker: Localized; lead: Localized }[] = [
  {
    category: "layouts",
    tone: "light",
    kicker: { fr: "01 — Sections de page", en: "01 — Page sections" },
    lead: {
      fr: "Les compositions qui portent une page : coque de chapitre, piste de cartes, séquence minutée, blocs de récit.",
      en: "The compositions a page is built from: chapter shell, card track, timed sequence, story blocks.",
    },
  },
  {
    category: "components",
    tone: "dark",
    kicker: { fr: "02 — Interactifs", en: "02 — Interactive" },
    lead: {
      fr: "Les pièces que le visiteur manipule, chacune à l'accent du client : réservation, dossier, sélecteur, contrôles.",
      en: "The pieces a visitor operates, each in the client's accent: reservation, dossier, selector, controls.",
    },
  },
];

export default function Home() {
  const { locale, t } = useLibraryLocale();
  const copy = COPY[locale];
  const ready = REGISTRY.filter((e) => e.status === "ready").length;
  const navbar = getEntry("navbar");

  return (
    <div className="lib-home">
      <section className="lib-hero lib-toned" data-tone="dark" data-nav-tone="dark">
        <div className="lib-rail lib-hero__grid">
          <div className="lib-hero__title">
            <p className="lib-voice-state lib-hero__count">{copy.count(REGISTRY.length, ready)}</p>
            <h1 className="lib-display">{copy.title}</h1>
          </div>
          <div className="lib-hero__aside">
            <p className="lib-lead">{copy.intro}</p>
            <LocaleToggle />
          </div>
        </div>
      </section>

      {CHAPTERS.map((chapter) => {
        const entries = entriesOf(chapter.category);
        return (
          <section
            key={chapter.category}
            id={chapter.category}
            aria-labelledby={`${chapter.category}-title`}
            className="lib-chapter lib-toned"
            data-tone={chapter.tone}
            data-nav-tone={chapter.tone === "dark" ? "dark" : undefined}
          >
            <div className="lib-rail">
              <header className="lib-chapter__head">
                <div>
                  <p className="lib-voice-state lib-chapter__kicker">{t(chapter.kicker)}</p>
                  <h2 id={`${chapter.category}-title`} className="lib-title">
                    {t(CATEGORY_LABEL[chapter.category])}
                  </h2>
                </div>
                <p className="lib-lead">{t(chapter.lead)}</p>
              </header>
              <ol className="lib-grid">
                {entries.map((entry, i) => (
                  <li key={entry.id}>
                    <EntryCard entry={entry} index={i + 1} total={entries.length} />
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );
      })}

      <section id="navbar" aria-labelledby="navbar-title" className="lib-feature lib-toned" data-tone="light">
        <div className="lib-rail lib-feature__row">
          <Link to={navbar.route} className="lib-card" tabIndex={-1} aria-hidden="true">
            <div className="lib-well">
              <Cover id="navbar" />
            </div>
          </Link>
          <div className="lib-feature__copy">
            <p className="lib-voice-state lib-chapter__kicker">03 — Navigation</p>
            <h2 id="navbar-title" className="lib-title">
              <Link to={navbar.route} className="lib-feature__title">
                {t(navbar.title)}
              </Link>
            </h2>
            <p className="lib-body">{t(navbar.meta)}</p>
            <StatusTag status={navbar.status} version={navbar.version} />
            <div className="lib-feature__links">
              <Link to="/navbar/reference" className="lib-command lib-command--quiet">
                {copy.navbarLinks.reference}
              </Link>
              <Link to="/navbar/one-page" className="lib-command lib-command--quiet">
                {copy.navbarLinks.onePage}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EntryCard({ entry, index, total }: { entry: RegistryEntry; index: number; total: number }) {
  const { t } = useLibraryLocale();
  return (
    <Link to={entry.route} className="lib-card">
      <div className="lib-well">
        <Cover id={entry.id} />
      </div>
      <div className="lib-card__meta">
        <span className="lib-voice-state lib-card__index">
          {pad2(index)} / {pad2(total)}
        </span>
        <StatusTag status={entry.status} version={entry.version} />
      </div>
      <h3 className="lib-card__title">{t(entry.title)}</h3>
      <p className="lib-body">{t(entry.meta)}</p>
    </Link>
  );
}
