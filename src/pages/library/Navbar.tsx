import { Link } from "react-router-dom";
import { Cover } from "../../library/covers";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale } from "../../library/locale";

/* Placeholder until the dedicated navbar showcase: the library's own
   navigation is the package; the two demos render it full-screen. */

const DEMOS = [
  {
    to: "/navbar/reference",
    title: { fr: "Démo multi-page", en: "Multi-page demo" },
    meta: { fr: "La config de référence : routes, plateau de services, langue, CTA.", en: "The reference config: routes, services tray, language, CTA." },
  },
  {
    to: "/navbar/one-page",
    title: { fr: "Exemple une page", en: "One-page example" },
    meta: { fr: "Sections sondées au défilement, plateaux de cartes, réticule hud.", en: "Scroll-probed sections, cover-card trays, hud reticle." },
  },
];

const NOTE = {
  fr: "La barre en haut de cette page est le package lui-même, configuré pour la bibliothèque. Le showcase dédié est en construction.",
  en: "The bar at the top of this page is the package itself, configured for the library. The dedicated showcase is in construction.",
};

export default function NavbarPage() {
  return (
    <ShowcasePage
      entryId="navbar"
      title={(l) => (l === "fr" ? <>La <em>navbar</em></> : <>The <em>navbar</em></>)}
      intro={{
        fr: "Une capsule de verre qui se déplie en pilules, avec plateaux de cartes sur bureau et tuiles sur mobile.",
        en: "A glass capsule that unfolds into pills, with cover-card trays on desktop and tiles on mobile.",
      }}
      palette={false}
    >
      <Demos />
    </ShowcasePage>
  );
}

function Demos() {
  const { t } = useLibraryLocale();
  return (
    <div className="lib-rail">
      <p className="lib-body" style={{ maxWidth: "40em", marginBottom: "3em" }}>
        {t(NOTE)}
      </p>
      <ol className="lib-grid">
        {DEMOS.map((demo, i) => (
          <li key={demo.to}>
            <Link to={demo.to} className="lib-card">
              <div className="lib-well">
                <Cover id="navbar" />
              </div>
              <div className="lib-card__meta">
                <span className="lib-voice-state lib-card__index">{`0${i + 1} / 02`}</span>
              </div>
              <h3 className="lib-card__title">{t(demo.title)}</h3>
              <p className="lib-body">{t(demo.meta)}</p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
