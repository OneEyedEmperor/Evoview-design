import { createContext, useContext, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import AccentPalette, { CUSTOM_SWATCH, inkFor } from "./AccentPalette";
import { Cover } from "./covers";
import FloatingPalette from "./FloatingPalette";
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

  const paletteRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tonedByContent = useHasNavTone(stageRef);
  const ready = usePageReady(stageRef);
  const dark = tone === "dark" ? "dark" : undefined;
  const paletteProps = {
    swatches,
    value: accentId,
    custom,
    caption: { strong: copy.paletteStrong, rest: copy.paletteRest },
    customLabel: copy.custom,
    onChange: setAccentId,
    onCustom: setCustom,
  };

  /* Nav tone is declared per region, never on the wrapper: the navbar probe
     has no nesting priority, so a dark wrapper would win over every light
     chapter inside it. The stage is marked only while its content declares
     no tone of its own. */
  return (
    <div className="lib-showcase lib-toned ev-library" data-tone={tone} data-lib-ready={ready ? "" : undefined} style={style}>
      <header className="lib-showcase__head lib-rail" data-nav-tone={dark}>
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
          <div ref={paletteRef} className="lib-showcase__palette">
            <AccentPalette {...paletteProps} />
          </div>
        )}
      </header>
      <div ref={stageRef} className="lib-showcase__stage" data-nav-tone={tonedByContent ? undefined : dark}>
        <FrameTone.Provider value={tone}>{body}</FrameTone.Provider>
      </div>
      <div className="lib-showcase__tail" data-nav-tone={dark} aria-hidden="true" />
      {palette && <FloatingPalette {...paletteProps} anchor={paletteRef} tone={tone} accent={accent} />}
    </div>
  );
}

const FrameTone = createContext<"dark" | "light">("dark");

export type DemoTone = "dark" | "light" | "paper";
export type DemoRhythm = "flush" | "standard" | "compact" | "cinematic";

type VariantProps = {
  /** Component (and variant) name, set as a readout: `SelectorStage · paper`. */
  name: ReactNode;
  /** One sentence: when a client would choose this configuration. */
  when: ReactNode;
  /** Only when it indexes something real (a numbered sequence the reader
      steps through); never as decoration. */
  index?: { current: number; total: number };
  /** Environment of the component below. Omit when it sits on the frame
      tone or manages several tones itself. */
  tone?: DemoTone;
  /** Top padding the component brings (foundation chapter rhythm), so the
      frame can hold caption → content at the heading band. */
  rhythm?: DemoRhythm;
  id?: string;
  children: ReactNode;
};

/* One demo of a showcase page: a caption (name readout + when to choose it)
   over the live component. The frame owns the spacing, so every page has
   the same rhythm: header → first caption and caption → component sit at
   the heading band, variants are separated by a chapter band (or by the
   component's own chapter padding when it has one). No rules, no boxes.
   Contract: docs/SHOWCASE-CONTRACT.md. */
export function ShowcaseVariant({ name, when, index, tone, rhythm = "flush", id, children }: VariantProps) {
  const frame = useContext(FrameTone);
  const nameId = useId();
  const env = tone ?? frame;
  return (
    <section
      id={id}
      aria-labelledby={nameId}
      className={tone ? `lib-variant ev-tone-${tone}` : "lib-variant"}
      data-tone={env}
      data-frame={env === frame ? "" : undefined}
      data-rhythm={rhythm}
    >
      <header className="lib-variant__caption lib-rail">
        <p id={nameId} className="lib-voice-state lib-variant__name">
          {index && (
            <span className="lib-variant__index">
              {pad2(index.current)} / {pad2(index.total)}
            </span>
          )}
          {name}
        </p>
        <p className="lib-body lib-variant__when">{when}</p>
      </header>
      <div className="lib-variant__body">{children}</div>
    </section>
  );
}

/* `data-lib-ready` on the frame once fonts are loaded and every eager image
   in the stage has settled (decoded or failed): the signal scripts wait
   for (scripts/covers). Lazy images are left to the viewport. Capped at
   10 s so a stuck request never hides the page from tooling. */
function usePageReady(ref: RefObject<HTMLElement | null>): boolean {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    let timer = 0;
    const started = performance.now();
    const check = () => {
      const el = ref.current;
      const images = el ? Array.from(el.querySelectorAll("img")).filter((img) => img.loading !== "lazy") : [];
      const settled = images.every((img) => img.complete);
      const fonts = typeof document.fonts === "undefined" || document.fonts.status === "loaded";
      if ((el && settled && fonts) || performance.now() - started > 10000) setReady(true);
      else timer = window.setTimeout(check, 120);
    };
    timer = window.setTimeout(check, 120);
    return () => window.clearTimeout(timer);
  }, [ref]);
  return ready;
}

const TONED = ".ev-tone-dark, .ev-tone-light, .ev-tone-paper, [data-nav-tone]";
const BRIDGED = "data-nav-tone-bridged";

/* True once the stage content declares its own tone. Packages that only set
   foundation's `ev-tone-*` class on a section root (no `data-nav-tone`) are
   bridged: outermost dark roots get `data-nav-tone="dark"`. Nested tone
   elements (cards, modals) are ignored — the navbar probe is a horizontal
   line, so a dark card inside a light chapter must not darken the bar. */
function useHasNavTone(ref: RefObject<HTMLElement | null>): boolean {
  const [has, setHas] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const roots = Array.from(el.querySelectorAll<HTMLElement>(TONED)).filter((n) => {
        const outer = n.parentElement?.closest(TONED);
        return !outer || outer === el || !el.contains(outer);
      });
      for (const n of Array.from(el.querySelectorAll<HTMLElement>(`[${BRIDGED}]`))) {
        if (!roots.includes(n) || !n.classList.contains("ev-tone-dark")) {
          n.removeAttribute("data-nav-tone");
          n.removeAttribute(BRIDGED);
        }
      }
      for (const n of roots) {
        if (n.classList.contains("ev-tone-dark") && !n.hasAttribute("data-nav-tone")) {
          n.setAttribute(BRIDGED, "");
          n.setAttribute("data-nav-tone", "dark");
        }
      }
      setHas(roots.length > 0);
    };
    sync();
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(sync);
    });
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-nav-tone"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);
  return has;
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
