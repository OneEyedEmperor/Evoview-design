import { Link } from "react-router-dom";
import { Navbar } from "../../../components/navbar/src";
import { navbarConfig } from "../../../components/navbar/examples/evoview.config";
import { useLibraryLocale, type Localized } from "../../library/locale";

/* The one-page example, full-screen: tall sections whose ids and tones
   match the config, so the bar can be watched re-toning, lighting the
   section's pill and recolouring its pupil while scrolling. */

const config = navbarConfig;

const SECTIONS: { id: string; title: string; dark: boolean; line: Localized }[] = [
  {
    id: "hero",
    title: "Evoview",
    dark: true,
    line: { fr: "Une page, six sections. Faites défiler : la barre suit.", en: "One page, six sections. Scroll: the bar follows." },
  },
  {
    id: "processus",
    title: "Processus",
    dark: false,
    line: { fr: "Section claire : la capsule passe en verre clair.", en: "Light section: the capsule turns to light glass." },
  },
  {
    id: "services",
    title: "Services",
    dark: false,
    line: { fr: "La pilule Services s'allume tant que vous êtes ici.", en: "The Services pill stays lit while you are here." },
  },
  {
    id: "intro",
    title: "Méthode",
    dark: true,
    line: { fr: "Section sombre : verre sombre, la pupille prend la couleur de la section.", en: "Dark section: dark glass, the pupil takes the section's colour." },
  },
  {
    id: "partners",
    title: "Portfolio",
    dark: false,
    line: { fr: "Chaque pilule ouvre son plateau de cartes au survol.", en: "Each pill opens its card tray on hover." },
  },
  {
    id: "contact",
    title: "Contact",
    dark: true,
    line: { fr: "La pilule Contact est l'appel à l'action de la barre.", en: "The Contact pill is the bar's call to action." },
  },
];

const BACK: Localized = { fr: "Retour à la navbar", en: "Back to the navbar" };

export default function NavbarOnePage() {
  const { t } = useLibraryLocale();
  const framed = typeof window !== "undefined" && window.self !== window.top;
  return (
    <div className="ev-library lib-demo-page">
      <Navbar config={config} />
      <main>
        {SECTIONS.map((section, i) => {
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <section
              key={section.id}
              id={section.id}
              data-nav-tone={section.dark ? "dark" : undefined}
              className="lib-toned lib-demo-page__section"
              data-tone={section.dark ? "dark" : "light"}
            >
              <div className="lib-rail lib-demo-page__copy">
                <Heading className="lib-display">{section.title}</Heading>
                <p className="lib-lead">{t(section.line)}</p>
                {i === SECTIONS.length - 1 &&
                  (framed ? (
                    <a href="/navbar" target="_top" className="lib-command lib-command--quiet">
                      {t(BACK)}
                    </a>
                  ) : (
                    <Link to="/navbar" className="lib-command lib-command--quiet">
                      {t(BACK)}
                    </Link>
                  ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
