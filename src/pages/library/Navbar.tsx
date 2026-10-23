import { useLayoutEffect, useRef, useState } from "react";
import ShowcasePage, { ShowcaseVariant } from "../../library/ShowcasePage";
import { useLibraryLocale, type Localized } from "../../library/locale";

/* The navbar page: the library's own bar is the package (multi-page
   shape); the two reference demos run live in preview frames, desktop
   beside phone, since the mechanism changes between them. */

const DEMOS: { to: string; name: Localized; when: Localized; title: Localized }[] = [
  {
    to: "/navbar/reference",
    name: { fr: "Navbar · multi-page", en: "Navbar · multi-page" },
    when: {
      fr: "Pour un site à plusieurs pages : chaque pilule mène à une route, ses plateaux listent les pages d'une rubrique, la pilule de la page courante reste allumée.",
      en: "For a multi-page site: each pill leads to a route, its tray lists a section's pages, and the current page's pill stays lit.",
    },
    title: { fr: "Démo multi-page de la navbar", en: "Navbar multi-page demo" },
  },
  {
    to: "/navbar/one-page",
    name: { fr: "Navbar · une page", en: "Navbar · one page" },
    when: {
      fr: "Pour un site d'une seule page : la barre suit les sections au défilement, passe en verre sombre sur les chapitres sombres et allume la pilule de la section.",
      en: "For a one-page site: the bar follows the sections as you scroll, turns to dark glass over dark chapters and lights the section's pill.",
    },
    title: { fr: "Exemple une page de la navbar", en: "Navbar one-page example" },
  },
];

const COPY = {
  fr: { desktop: "Bureau", phone: "Mobile", open: "Ouvrir en plein écran" },
  en: { desktop: "Desktop", phone: "Phone", open: "Open full screen" },
};

export default function NavbarPage() {
  return (
    <ShowcasePage
      entryId="navbar"
      title={() => <em>Navbar</em>}
      intro={{
        fr: "La navigation des sites Evoview : une capsule de verre qui se déplie en pilules et en plateaux de cartes. Celle en haut de cette page est le package lui-même : ouvrez MENU.",
        en: "The navigation of Evoview sites: a glass capsule that unfolds into pills and cover-card trays. The one at the top of this page is the package itself: open MENU.",
      }}
      palette={false}
    >
      <Demos />
    </ShowcasePage>
  );
}

function Demos() {
  const { t, locale } = useLibraryLocale();
  const copy = COPY[locale];
  return (
    <>
      {DEMOS.map((demo) => (
        <ShowcaseVariant key={demo.to} name={t(demo.name)} when={t(demo.when)}>
          <div className="lib-rail">
            <div className="lib-previews">
              <Preview src={demo.to} width={1440} height={900} title={`${t(demo.title)} — ${copy.desktop}`} className="lib-preview--desktop" />
              <Preview src={demo.to} width={390} height={844} title={`${t(demo.title)} — ${copy.phone}`} className="lib-preview--phone" />
            </div>
            <a href={demo.to} target="_blank" rel="noopener" className="lib-command lib-command--quiet lib-previews__open">
              {copy.open}
            </a>
          </div>
        </ShowcaseVariant>
      ))}
    </>
  );
}

/* A live route at a real viewport size, scaled into its well. Lazy, so the
   frames only load when they near the screen. */
function Preview({ src, width, height, title, className }: { src: string; width: number; height: number; title: string; className: string }) {
  const well = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = well.current;
    if (!el) return;
    const sync = () => setScale(el.clientWidth / width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={well} className={`lib-well lib-preview ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      {scale > 0 && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          width={width}
          height={height}
          style={{ transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
