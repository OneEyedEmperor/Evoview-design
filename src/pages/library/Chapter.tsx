import { useMemo, useState, type ReactNode } from "react";
import {
  Chapter as ChapterShell,
  ChapterFooter,
  ChapterHeading,
  ChapterMark,
  ChapterTicker,
  buildChapterConfig,
  type ChapterRail,
  type ChapterRhythm,
  type ChapterTone,
} from "../../../components/chapter/src";
import { PrimaryPlate, SegmentedControl } from "../../../components/controls/src";
import { Readout } from "../../../components/foundation/src";
import "../../../components/chapter/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../library/locale";

/* A fictional client page built only from chapters: light → light compact →
   dark cinematic → paper → footer. Colour comes from the frame's --primary
   (the palette); nothing here re-renders on a swatch. */
export default function Chapter() {
  return (
    <ShowcasePage
      entryId="chapter"
      title={(l) => (l === "fr" ? <>Le <em>chapitre</em></> : <>The <em>chapter</em></>)}
      intro={{
        fr: "La coque de section : titres, rythme et coupes de ton entre chapitres.",
        en: "The section shell: headings, rhythm and tone cuts between chapters.",
      }}
      tone="light"
      defaultAccent="#b4532a"
    >
      <Demo />
    </ShowcasePage>
  );
}

type View = "plan" | "section" | "elevation";

const T = {
  fr: {
    demo: "Démo — Atelier Halde, architectes (client fictif)",
    count: "4 chapitres + pied de page",
    studio: {
      title: (mark: ReactNode) => <>L'atelier {mark} en quatre gestes</>,
      subtitle: "Relever, dessiner, construire, transmettre. Chaque projet traverse les mêmes quatre gestes, à son propre rythme.",
      ticker: "Phases",
      phases: [
        ["Relevé", "Le terrain, la lumière, l'existant."],
        ["Esquisse", "Trois pistes, une retenue."],
        ["Chantier", "Une visite par semaine."],
        ["Livraison", "Les clés et le carnet."],
      ],
      current: "En cours",
    },
    projects: {
      title: "Maison du Pré",
      subtitle: "Une longère reprise pour une famille de cinq. Les mêmes murs, une autre lumière.",
      views: { plan: "Plan", section: "Coupe", elevation: "Façade" },
      viewsLabel: "Dessin affiché",
      captions: { plan: "Plan du rez · 1:100", section: "Coupe A–A · 1:100", elevation: "Façade sud · 1:100" },
      place: "Habitat · 2025",
    },
    light: {
      title: <>La lumière <em>d'abord</em></>,
      subtitle: "Avant les murs, on dessine le trajet du soleil dans la pièce.",
      caption: "Maison du Pré — séjour, fin d'après-midi",
    },
    visit: {
      title: "Visiter l'atelier",
      subtitle: "Gand, Dok Noord 4. Sur rendez-vous, du mardi au vendredi.",
      cta: "Prendre rendez-vous",
    },
  },
  en: {
    demo: "Demo — Atelier Halde, architects (fictional client)",
    count: "4 chapters + footer",
    studio: {
      title: (mark: ReactNode) => <>The {mark} studio in four moves</>,
      subtitle: "Survey, draw, build, hand over. Every project goes through the same four moves, at its own pace.",
      ticker: "Phases",
      phases: [
        ["Survey", "The site, the light, what stands."],
        ["Sketch", "Three options, one kept."],
        ["Build", "One site visit a week."],
        ["Handover", "The keys and the logbook."],
      ],
      current: "Current",
    },
    projects: {
      title: "Meadow House",
      subtitle: "A farmhouse reworked for a family of five. The same walls, another light.",
      views: { plan: "Plan", section: "Section", elevation: "Elevation" },
      viewsLabel: "Drawing shown",
      captions: { plan: "Ground floor plan · 1:100", section: "Section A–A · 1:100", elevation: "South elevation · 1:100" },
      place: "Housing · 2025",
    },
    light: {
      title: <>Light <em>first</em></>,
      subtitle: "Before the walls, we draw the sun's path through the room.",
      caption: "Meadow House — living room, late afternoon",
    },
    visit: {
      title: "Visit the studio",
      subtitle: "Ghent, Dok Noord 4. By appointment, Tuesday to Friday.",
      cta: "Book a visit",
    },
  },
} satisfies Record<Locale, unknown>;

const ACTIVE_PHASE = 1;

function Demo() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => {
    const base = buildChapterConfig(locale);
    return { ...base, brand: { ...base.brand, href: "#studio" } };
  }, [locale]);
  const [view, setView] = useState<View>("plan");
  const views = (Object.keys(t.projects.views) as View[]).map((value) => ({ value, label: t.projects.views[value] }));

  return (
    <div className="chd">
      <div className="lib-rail chd-intro">
        <Readout>{t.demo}</Readout>
        <Readout className="chd-intro__count">{t.count}</Readout>
      </div>

      <ChapterShell id="studio" tone="light" rhythm="standard" rail="reading">
        <Spec n={1} tone="light" rhythm="standard" rail="reading" />
        <ChapterHeading
          live
          title={t.studio.title(
            <ChapterMark label={config.brand.name}>{config.brand.mark}</ChapterMark>,
          )}
          subtitle={t.studio.subtitle}
          support={<ChapterTicker label={t.studio.ticker} items={t.studio.phases.map(([label]) => label)} active={ACTIVE_PHASE} />}
        />
        <ol className="chd-phases">
          {t.studio.phases.map(([label, line], i) => (
            <li key={label} className="chd-phase" aria-current={i === ACTIVE_PHASE ? "step" : undefined}>
              <span className="chd-phase__bar" aria-hidden="true" />
              <Readout className="chd-phase__index">{String(i + 1).padStart(2, "0")}</Readout>
              <span className="ev-t-label chd-phase__label">{label}</span>
              <p className="ev-t-compact chd-phase__line">{line}</p>
              {i === ACTIVE_PHASE && <Readout className="chd-phase__state">{t.studio.current}</Readout>}
            </li>
          ))}
        </ol>
      </ChapterShell>

      <ChapterShell id="projets" tone="light" rhythm="compact" rail="wide">
        <Spec n={2} tone="light" rhythm="compact" rail="wide" />
        <ChapterHeading
          layout="split"
          title={t.projects.title}
          subtitle={t.projects.subtitle}
          side={<SegmentedControl options={views} value={view} onChange={(v) => setView(v as View)} label={t.projects.viewsLabel} />}
        />
        <figure className="chd-sheet">
          <div className="chd-sheet__well">
            <Drawing key={view} view={view} />
          </div>
          <figcaption className="chd-caption">
            <Readout>
              {String(views.findIndex((v) => v.value === view) + 1).padStart(2, "0")} / 03 — {t.projects.captions[view]}
            </Readout>
            <Readout className="chd-caption__aside">{t.projects.place}</Readout>
          </figcaption>
        </figure>
      </ChapterShell>

      <ChapterShell id="lumiere" tone="dark" rhythm="cinematic" rail="wide">
        <Spec n={3} tone="dark" rhythm="cinematic" rail="wide" />
        <ChapterHeading variant="feature" title={t.light.title} subtitle={t.light.subtitle} />
        <figure className="chd-room">
          <div className="chd-room__scene" role="img" aria-label={t.light.caption}>
            <span className="chd-room__wall" />
            <span className="chd-room__window" />
            <span className="chd-room__beam" />
            <span className="chd-room__floor" />
            <span className="chd-room__patch" />
          </div>
          <figcaption className="chd-caption">
            <Readout>{t.light.caption}</Readout>
          </figcaption>
        </figure>
      </ChapterShell>

      <ChapterShell id="visite" tone="paper" rhythm="standard" rail="reading">
        <Spec n={4} tone="paper" rhythm="standard" rail="reading" />
        <ChapterHeading
          layout="split"
          title={t.visit.title}
          subtitle={t.visit.subtitle}
          side={<PrimaryPlate href="#visite">{t.visit.cta}</PrimaryPlate>}
        />
      </ChapterShell>

      <ChapterFooter config={config} tone="light" />
    </div>
  );
}

function Spec({ n, tone, rhythm, rail }: { n: number; tone: ChapterTone; rhythm: ChapterRhythm; rail: ChapterRail }) {
  return (
    <Readout as="p" className="chd-spec">
      <span className="chd-spec__n">{String(n).padStart(2, "0")} / 04</span> tone {tone} · rhythm {rhythm} · rail {rail}
    </Readout>
  );
}

/* Line drawings of the fictional house (ink, one accent signal each). */
function Drawing({ view }: { view: View }) {
  return (
    <svg className="chd-drawing" viewBox="0 0 440 200" aria-hidden="true" focusable="false">
      {view === "plan" && (
        <>
          <rect x="90" y="30" width="260" height="140" className="chd-d-wall" />
          <path d="M200 30V92M200 128V110H90M260 110V170M290 110H350" className="chd-d-wall chd-d-wall--inner" />
          <path d="M200 92A18 18 0 0 1 218 110M260 128A18 18 0 0 0 278 110" className="chd-d-thin" />
          <path d="M118 30h44M232 30h52M350 60v40M120 170h60" className="chd-d-opening" />
          <path d="M150 150h34M150 156h34M300 50h30v30h-30z" className="chd-d-thin" />
          <g className="chd-d-accent">
            <circle cx="398" cy="54" r="14" />
            <path d="M398 40l6 18h-12z" className="chd-d-fill" />
          </g>
        </>
      )}
      {view === "section" && (
        <>
          <path d="M20 170H420" className="chd-d-thin" />
          <path d="M40 176h360M60 182h320" className="chd-d-hatch" />
          <path d="M120 170V80L220 30L320 80V170" className="chd-d-wall" />
          <path d="M120 120H320" className="chd-d-wall chd-d-wall--inner" />
          <path d="M250 170v-10h10v-10h10v-10h10v-10h10v-10h10" className="chd-d-thin" />
          <path d="M150 120V100h30v20M150 170V145h30v25" className="chd-d-thin" />
          <path d="M350 30V170M344 30h12M344 120h12M344 170h12" className="chd-d-thin" />
          <g className="chd-d-accent">
            <path d="M92 120l-10-8h20z" className="chd-d-fill" />
            <path d="M70 120h34" />
          </g>
        </>
      )}
      {view === "elevation" && (
        <>
          <path d="M20 170H420" className="chd-d-thin" />
          <path d="M140 170V75L220 30L300 75V170Z" className="chd-d-wall" />
          <rect x="160" y="92" width="30" height="40" className="chd-d-thin" />
          <rect x="250" y="92" width="30" height="40" className="chd-d-thin" />
          <rect x="205" y="118" width="30" height="52" className="chd-d-thin" />
          <circle cx="220" cy="64" r="9" className="chd-d-thin" />
          <path d="M160 112h30M265 92v40" className="chd-d-hatch" />
          <g className="chd-d-accent">
            <circle cx="372" cy="52" r="11" />
            <path d="M372 30v-8M372 82v-8M350 52h-8M402 52h-8" />
          </g>
        </>
      )}
    </svg>
  );
}
