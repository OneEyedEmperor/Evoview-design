import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import AccentPalette, { CUSTOM_SWATCH, inkFor } from "./AccentPalette";
import { Cover } from "./covers";
import LocaleToggle from "./LocaleToggle";
import { useLibraryLocale, type Locale, type Localized } from "./locale";
import { CATEGORY_LABEL, CATEGORY_ROUTE, getEntry, pad2, positionOf } from "./registry";
import StatusTag from "./StatusTag";

export type ShowcaseContext = { locale: Locale; accent: string; ink: string };

type Props = {
  /** Registry id → kicker, breadcrumb, version, status. */
  entryId: string;
  /** Display title; wrap the accent word in <em>. */
  title: (locale: Locale) => ReactNode;
  /** One sentence. */
  intro: Localized;
  tone?: "dark" | "light";
  defaultAccent?: string;
  /** Live accent palette. Off for pages that are not colourable. */
  palette?: boolean;
  /** The live component. Omitted → the honest "in construction" state. */
  children?: ReactNode | ((ctx: ShowcaseContext) => ReactNode);
};

const NEAR_WHITE = "#e9e6df";
const NEAR_INK = "#1c1c1f";

const SWATCHES: { id: string; color: string; label: Localized }[] = [
  { id: "indigo", color: "#818cf8", label: { fr: "Indigo Evoview", en: "Evoview indigo" } },
  { id: "chili", color: "#d83a2c", label: { fr: "Rouge piment", en: "Chili red" } },
  { id: "orange", color: "#fb923c", label: { fr: "Orange", en: "Orange" } },
  { id: "yellow", color: "#facc15", label: { fr: "Jaune", en: "Yellow" } },
  { id: "emerald", color: "#34d399", label: { fr: "Émeraude", en: "Emerald" } },
  { id: "sky", color: "#38bdf8", label: { fr: "Bleu ciel", en: "Sky blue" } },
  { id: "rose", color: "#fb7185", label: { fr: "Rose", en: "Rose" } },
  { id: "white", color: NEAR_WHITE, label: { fr: "Blanc cassé", en: "Off-white" } },
];

const COPY = {
  fr: {
    library: "Bibliothèque",
    breadcrumb: "Fil d'Ariane",
    paletteStrong: "Accent client",
    paletteRest: "le composant s'adapte à chaque marque",
    custom: "Couleur personnalisée",
    default: "Par défaut",
    buildingBody: "Ce package est en cours d'extraction depuis evoview.be. La démo live remplacera cette page dès sa première version.",
    back: "Retour à l'index",
  },
  en: {
    library: "Library",
    breadcrumb: "Breadcrumb",
    paletteStrong: "Client accent",
    paletteRest: "the component adapts to every brand",
    custom: "Custom colour",
    default: "Default",
    buildingBody: "This package is being extracted from evoview.be. The live demo replaces this page with its first version.",
    back: "Back to the index",
  },
} satisfies Record<Locale, Record<string, string>>;

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ShowcasePage({ entryId, title, intro, tone = "dark", defaultAccent, palette = true, children }: Props) {
  const { locale } = useLibraryLocale();
  const copy = COPY[locale];
  const entry = getEntry(entryId);
  const { index, total } = positionOf(entry);
  const fallback = defaultAccent ?? (tone === "dark" ? NEAR_WHITE : NEAR_INK);

  const [accentId, setAccentId] = useState("default");
  const [custom, setCustom] = useState("#7c3aed");
  const swatches = useMemo(
    () => [
      { id: "default", color: fallback, label: copy.default },
      ...SWATCHES.filter((s) => !same(s.color, fallback)).map((s) => ({ id: s.id, color: s.color, label: s.label[locale] })),
    ],
    [fallback, locale, copy.default],
  );
  const accent = accentId === CUSTOM_SWATCH ? custom : (swatches.find((s) => s.id === accentId) ?? swatches[0]).color;
  const ink = useMemo(() => inkFor(accent), [accent]);

  const style = {
    "--showcase-accent": accent,
    "--showcase-ink": ink,
  } as CSSProperties;

  const body = children === undefined ? <InConstruction entryId={entry.id} category={entry.category} /> : typeof children === "function" ? children({ locale, accent, ink }) : children;

  return (
    <div className="lib-showcase lib-toned ev-library" data-tone={tone} data-nav-tone={tone === "dark" ? "dark" : undefined} style={style}>
      <header className="lib-showcase__head lib-rail">
        <nav aria-label={copy.breadcrumb} className="lib-crumbs lib-voice-state">
          <Link to="/">{copy.library}</Link>
          <span aria-hidden="true">/</span>
          <Link to={CATEGORY_ROUTE[entry.category]}>{CATEGORY_LABEL[entry.category][locale]}</Link>
          {entry.category !== "navbar" && (
            <>
              <span aria-hidden="true">/</span>
              <span className="lib-crumbs__index">
                {pad2(index)} / {pad2(total)}
              </span>
            </>
          )}
        </nav>
        <div className="lib-showcase__split">
          <h1 className="lib-display">{title(locale)}</h1>
          <div className="lib-showcase__aside">
            <p className="lib-lead">{intro[locale]}</p>
            <div className="lib-showcase__meta">
              <StatusTag status={entry.status} version={entry.version} />
              <LocaleToggle />
            </div>
          </div>
        </div>
        {palette && (
          <AccentPalette
            swatches={swatches}
            value={accentId}
            custom={custom}
            caption={{ strong: copy.paletteStrong, rest: copy.paletteRest }}
            customLabel={copy.custom}
            onChange={setAccentId}
            onCustom={setCustom}
          />
        )}
      </header>
      <div className="lib-showcase__stage">{body}</div>
    </div>
  );
}

function InConstruction({ entryId, category }: { entryId: string; category: keyof typeof CATEGORY_ROUTE }) {
  const { locale } = useLibraryLocale();
  const copy = COPY[locale];
  return (
    <section className="lib-rail lib-building">
      <div className="lib-building__media lib-well">
        <Cover id={entryId} variant="card" />
      </div>
      <div className="lib-building__copy">
        <p className="lib-body">{copy.buildingBody}</p>
        <Link to={CATEGORY_ROUTE[category]} className="lib-command lib-command--quiet">
          {copy.back}
        </Link>
      </div>
    </section>
  );
}
