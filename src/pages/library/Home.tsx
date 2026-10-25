import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import AccentPalette, { inkFor } from "../../library/AccentPalette";
import { useAccentChoice } from "../../library/accentChoice";
import { Cover } from "../../library/covers";
import EyeMark from "../../library/hero/EyeMark";
import LibraryHero from "../../library/LibraryHero";
import { useLibraryLocale, type Localized } from "../../library/locale";
import { CATEGORY_DOT } from "../../library/library.navbar.config";
import { CATEGORY_LABEL, entriesOf, getEntry, type Category, type RegistryEntry } from "../../library/registry";
import { OrbFill, type OrbFillController } from "../../../components/foundation/src/OrbFill";
import SeamFlow from "../../library/SeamFlow";
import { SWATCHES } from "../../library/ShowcasePage";
import StatusTag from "../../library/StatusTag";
import { useNavEyeAccent } from "../../library/useNavEyeAccent";

/* The library index, built for picking: the hero is the one-line lockup
   over the method-card reel with a small accent palette under it; the
   picked colour drives the eyes' irises, the orbs and the hover fills,
   except in the layouts and components chapters, whose cards (irises,
   orbs, hover fills) take their category's live dot.
   Then each category is a chapter whose packages sit in an equal 2-up
   grid (peers, so equal columns), the navbar chapter pairs its package
   with its two demos 6/6. Tone cuts and spacing separate everything; text
   choices sit on tonal tiles. */

const COPY = {
  fr: {
    demo: "Démo",
    accent: "Couleur d'accent",
    custom: "Couleur personnalisée",
  },
  en: {
    demo: "Demo",
    accent: "Accent colour",
    custom: "Custom colour",
  },
};

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

const CHAPTERS: { category: Exclude<Category, "navbar">; tone: "light" | "dark"; lead: Localized }[] = [
  {
    category: "layouts",
    tone: "light",
    lead: {
      fr: "Les compositions qui portent une page : rythme des sections, piste de cartes, séquence minutée, blocs de récit.",
      en: "The compositions a page is built from: section pacing, card track, timed sequence, story blocks.",
    },
  },
  {
    category: "components",
    tone: "dark",
    lead: {
      fr: "Les pièces que le visiteur manipule, chacune à l'accent du client : réservation, dossier, sélecteur, contrôles.",
      en: "The pieces a visitor operates, each in the client's accent: reservation, dossier, selector, controls.",
    },
  },
];

/* Hero, the category chapters, navbar. */
const SECTIONS = 2 + CHAPTERS.length;

/* The page's sections as a row of bars beside a title, only this
   section's bar lit; the lit bar draws in once on screen. */
function SectionBars({ index, separator, dot }: { index: number; separator?: boolean; dot?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={ref} className="lib-bars" data-role={separator ? "separator" : undefined} data-seen={seen || undefined} aria-hidden="true">
      {Array.from({ length: SECTIONS }, (_, i) => (
        <span key={i} className="lib-bars__bar" data-on={i + 1 === index || undefined}>
          {dot && i + 1 === index && <span className="lib-bars__dot" style={{ "--lib-bar-dot": dot } as CSSProperties} />}
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const { locale, t } = useLibraryLocale();
  const copy = COPY[locale];
  const navbar = getEntry("navbar");

  const swatches = useMemo(() => SWATCHES.map((s) => ({ id: s.id, color: s.color, label: t(s.label) })), [t]);
  const { accentId, custom, accent, picked, onChange, onCustom } = useAccentChoice(swatches, SWATCHES[0].id);
  const style = { "--primary": accent, "--primary-foreground": inkFor(accent) } as CSSProperties;
  useNavEyeAccent(accent);

  return (
    <div className="lib-home" style={style}>
      <LibraryHero accent={picked ? accent : undefined} home bars={<SectionBars index={1} separator />}>
        <AccentPalette
          swatches={swatches}
          value={accentId}
          custom={custom}
          caption={{ strong: copy.accent, rest: "" }}
          customLabel={copy.custom}
          onChange={onChange}
          onCustom={onCustom}
          compact
        />
      </LibraryHero>

      {CHAPTERS.map((chapter, c) => {
        const entries = entriesOf(chapter.category);
        return (
          <section
            key={chapter.category}
            id={chapter.category}
            aria-labelledby={`${chapter.category}-title`}
            className="lib-chapter lib-toned"
            data-tone={chapter.tone}
            data-nav-tone={chapter.tone === "dark" ? "dark" : undefined}
            style={
              {
                "--lib-iris": CATEGORY_DOT[chapter.category],
                "--primary": CATEGORY_DOT[chapter.category],
                "--primary-foreground": inkFor(CATEGORY_DOT[chapter.category]),
              } as CSSProperties
            }
          >
            <div className="lib-rail">
              <header className="lib-chapter__head">
                <h2 id={`${chapter.category}-title`} className="lib-title">
                  {t(CATEGORY_LABEL[chapter.category])}
                  <SectionBars index={c + 2} separator dot={CATEGORY_DOT[chapter.category]} />
                </h2>
                <p className="lib-lead">{t(chapter.lead)}</p>
              </header>
              <ol className="lib-grid">
                {entries.map((entry, i) => (
                  <li key={entry.id}>
                    <EntryCard entry={entry} index={i + 1} />
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
            <h2 id="navbar-title" className="lib-title">
              {t(CATEGORY_LABEL.navbar)}
              <SectionBars index={SECTIONS} separator />
            </h2>
            <p className="lib-lead">{t(NAVBAR_LEAD)}</p>
          </header>
          <ol className="lib-grid lib-grid--navbar">
            <li>
              <EntryCard entry={navbar} />
            </li>
            <li>
              <ol className="lib-demos">
                {NAVBAR_DEMOS.map((demo) => (
                  <li key={demo.route}>
                    <Link to={demo.route} className="lib-demo">
                      <span className="lib-card__meta">
                        <span className="lib-voice-state lib-status">{copy.demo}</span>
                      </span>
                      <span className="lib-demo__copy">
                        <span className="lib-card__title">{t(demo.title)}</span>
                        <span className="lib-body">{t(demo.meta)}</span>
                      </span>
                      <span className="lib-demo__go" aria-hidden="true">
                        <OrbFill hoverWithin=".lib-demo">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </OrbFill>
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

function EntryCard({ entry, index }: { entry: RegistryEntry; index?: number }) {
  const { t } = useLibraryLocale();
  const orb = useRef<OrbFillController | null>(null);
  return (
    <Link to={entry.route} className="lib-card">
      <div className="lib-well">
        <Cover id={entry.id} />
        <span className="lib-well__tag">
          <EyeMark artwork={3} />
        </span>
      </div>
      <div className="lib-card__caption">
        {index !== undefined && (
          <span className="lib-card__orb" aria-hidden="true">
            <OrbFill controller={orb}>{index}</OrbFill>
          </span>
        )}
        <div className="lib-card__meta">
          <StatusTag status={entry.status} version={entry.version} />
        </div>
        <h3 className="lib-card__title">{t(entry.title)}</h3>
        <p className="lib-body">{t(entry.meta)}</p>
      </div>
      <SeamFlow orb={orb} />
    </Link>
  );
}
