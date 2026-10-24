import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import EvoviewLogo from "../../../components/foundation/src/brand/EvoviewLogo";
import { Cover } from "../../library/covers";
import HeroEye from "../../library/hero/HeroEye";
import LocaleToggle from "../../library/LocaleToggle";
import { useLibraryLocale, type Localized } from "../../library/locale";
import { CATEGORY_LABEL, REGISTRY, entriesOf, getEntry, pad2, type Category, type RegistryEntry } from "../../library/registry";
import StatusTag from "../../library/StatusTag";

/* The library index, built for picking: the hero ends in a directory of
   every package (three equal shelves), then each category is a chapter
   whose packages sit in an equal 2-up grid (peers, so equal columns), the
   navbar chapter pairs its package with its two demos 6/6. Tone cuts and
   spacing separate everything; text choices sit on tonal tiles. */

const COPY = {
  fr: {
    intro: "Les sections et composants des sites Evoview, extraits du site, découplés et prêts à adapter pour chaque client.",
    count: (n: number, ready: number) => (ready === n ? `${pad2(n)} packages` : `${pad2(n)} packages · ${pad2(ready)} prêts`),
    indexLabel: "Sommaire de la bibliothèque",
    collageLabel: "La méthode Evoview",
    demo: "Démo",
  },
  en: {
    intro: "The sections and components behind Evoview sites, extracted from the site, decoupled and ready to adapt for each client.",
    count: (n: number, ready: number) => (ready === n ? `${pad2(n)} packages` : `${pad2(n)} packages · ${pad2(ready)} ready`),
    indexLabel: "Library contents",
    collageLabel: "The Evoview method",
    demo: "Demo",
  },
};

const HERO_SHELVES: Category[] = ["layouts", "components", "navbar"];

const NAVBAR_DEMOS: { route: string; title: Localized; meta: Localized }[] = [
  {
    route: "/navbar/reference",
    title: { fr: "Démo multi-page", en: "Multi-page demo" },
    meta: { fr: "Cinq pages : la pilule active suit la route", en: "Five pages: the active pill follows the route" },
  },
  {
    route: "/navbar/one-page",
    title: { fr: "Exemple une page", en: "One-page example" },
    meta: { fr: "Six sections : la barre change de ton au défilement", en: "Six sections: the bar re-tones as you scroll" },
  },
];

const NAVBAR_LEAD: Localized = {
  fr: "La capsule de navigation des sites Evoview : le package, puis deux démos plein écran pour la voir vivre.",
  en: "The navigation capsule of Evoview sites: the package, then two full-screen demos to watch it work.",
};

const HERO_PANELS: { id: string; alt: Localized }[] = [
  { id: "identite-visuelle", alt: { fr: "Identité visuelle", en: "Visual identity" } },
  { id: "direction-artistique", alt: { fr: "Direction artistique", en: "Art direction" } },
  { id: "design-creation", alt: { fr: "Design & création", en: "Design & creation" } },
  { id: "strategie-marketing", alt: { fr: "Stratégie marketing", en: "Marketing strategy" } },
];

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
          <div className="lib-hero__main">
            <p className="lib-voice-state lib-hero__count">{copy.count(REGISTRY.length, ready)}</p>
            <h1 className="lib-hero__lockup">
              <span className="lib-hero__mark">
                <EvoviewLogo alt="Evoview" />
              </span>
              <span className="lib-hero__word">Library</span>
            </h1>
            <div className="lib-hero__intro">
              <p className="lib-lead">{copy.intro}</p>
              <LocaleToggle />
            </div>
          </div>
          <ul className="lib-hero__collage" aria-label={copy.collageLabel}>
            {HERO_PANELS.map((panel, i) => (
              <li key={panel.id}>
                <HeroPanel id={panel.id} alt={t(panel.alt)} index={i} />
              </li>
            ))}
          </ul>
          <nav className="lib-dir" aria-label={copy.indexLabel}>
            {HERO_SHELVES.map((category, i) => {
              const entries = entriesOf(category);
              const demos = category === "navbar" ? NAVBAR_DEMOS : [];
              return (
                <div key={category} className="lib-dir__shelf">
                  <Link to={{ hash: category }} className="lib-dir__head">
                    <span className="lib-voice-state lib-dir__index">{pad2(i + 1)}</span>
                    <span className="lib-dir__label">{t(CATEGORY_LABEL[category])}</span>
                    <span className="lib-voice-state lib-dir__count">{pad2(entries.length)}</span>
                  </Link>
                  <ol className="lib-dir__list">
                    {entries.map((entry) => (
                      <li key={entry.id}>
                        <Link to={entry.route} className="lib-dir__item">
                          <span className="lib-dir__name">{t(entry.title)}</span>
                          <StatusTag status={entry.status} version={entry.version} />
                        </Link>
                      </li>
                    ))}
                    {demos.map((demo) => (
                      <li key={demo.route}>
                        <Link to={demo.route} className="lib-dir__item" data-kind="demo">
                          <span className="lib-dir__name">{t(demo.title)}</span>
                          <span className="lib-voice-state lib-status">{copy.demo}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </nav>
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

      <section id="navbar" aria-labelledby="navbar-title" className="lib-chapter lib-toned" data-tone="light">
        <div className="lib-rail">
          <header className="lib-chapter__head">
            <div>
              <p className="lib-voice-state lib-chapter__kicker">03 — Navigation</p>
              <h2 id="navbar-title" className="lib-title">
                {t(CATEGORY_LABEL.navbar)}
              </h2>
            </div>
            <p className="lib-lead">{t(NAVBAR_LEAD)}</p>
          </header>
          <ol className="lib-grid lib-grid--navbar">
            <li>
              <EntryCard entry={navbar} index={1} total={1 + NAVBAR_DEMOS.length} />
            </li>
            <li>
              <ol className="lib-demos">
                {NAVBAR_DEMOS.map((demo, i) => (
                  <li key={demo.route}>
                    <Link to={demo.route} className="lib-demo">
                      <span className="lib-card__meta">
                        <span className="lib-voice-state lib-card__index">
                          {pad2(i + 2)} / {pad2(1 + NAVBAR_DEMOS.length)}
                        </span>
                        <span className="lib-voice-state lib-status">{copy.demo}</span>
                      </span>
                      <span className="lib-demo__copy">
                        <span className="lib-card__title">{t(demo.title)}</span>
                        <span className="lib-body">{t(demo.meta)}</span>
                      </span>
                      <span className="lib-demo__go" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}

const EYE_AFTER_MS = 520;

/* The method card's finished state: purple frame, graded image under a dim
   and a centre falloff, the phase eye drawn in, one shine sweep. Revealed
   once decoded (`complete` covers cached images on remount); the eye mounts
   after the dim has settled so its stroke reveal plays in sequence. */
function HeroPanel({ id, alt, index }: { id: string; alt: string; index: number }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (ref.current?.complete) setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setDrawn(true), EYE_AFTER_MS + index * 160);
    return () => window.clearTimeout(timer);
  }, [ready, index]);
  return (
    <div className="lib-hero__panel" data-ready={ready || undefined} style={{ "--lib-stagger": index } as CSSProperties}>
      <div className="lib-hero__media">
        <img
          ref={ref}
          src={`/library/hero/${id}-768.webp`}
          srcSet={`/library/hero/${id}-480.webp 480w, /library/hero/${id}-768.webp 768w`}
          sizes="(min-width: 768px) 12em, 24vw"
          alt={alt}
          width={768}
          height={768}
          decoding="async"
          draggable={false}
          onLoad={() => setReady(true)}
          onError={() => setReady(true)}
        />
        <span className="lib-hero__dim" aria-hidden="true" />
        {drawn && (
          <>
            <span className="lib-hero__eye">
              <HeroEye phase={(index + 1) as 1 | 2 | 3 | 4} />
            </span>
            <span className="lib-hero__shine" aria-hidden="true" />
          </>
        )}
      </div>
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
      <div className="lib-card__caption">
        <div className="lib-card__meta">
          <span className="lib-voice-state lib-card__index">
            {pad2(index)} / {pad2(total)}
          </span>
          <StatusTag status={entry.status} version={entry.version} />
        </div>
        <h3 className="lib-card__title">{t(entry.title)}</h3>
        <p className="lib-body">{t(entry.meta)}</p>
      </div>
    </Link>
  );
}
