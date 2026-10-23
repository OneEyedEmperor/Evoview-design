import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  Chapter as ChapterShell,
  ChapterFooter,
  ChapterHeading,
  ChapterMark,
  ChapterTicker,
  buildChapterConfig,
  type ChapterRhythm,
  type ChapterTone,
} from "../../../components/chapter/src";
import { PrimaryPlate, SegmentedControl } from "../../../components/controls/src";
import { Readout, useInViewPause, useSequenceClock } from "../../../components/foundation/src";
import "../../../components/chapter/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../library/locale";

/* Two scenes. 1 · one chapter the reader sets (tone, rhythm, heading, mark)
   between the two chapters it really sits between. 2 · the page those
   chapters belong to, ending on the footer and its Evoview credit. Colour
   comes from the frame's --primary only; a swatch never re-renders. */
export default function Chapter() {
  return (
    <ShowcasePage
      entryId="chapter"
      title={(l) => (l === "fr" ? <>Le <em>chapitre</em></> : <>The <em>chapter</em></>)}
      intro={{
        fr: "Une page Evoview se découpe en chapitres : chacun choisit son ton, son rythme et son titre, et la coupe de ton remplace tout trait.",
        en: "An Evoview page is cut into chapters: each picks its tone, rhythm and heading, and the tone cut replaces every rule.",
      }}
      tone="light"
      defaultAccent="#b4532a"
    >
      <Demo />
    </ShowcasePage>
  );
}

type Heading = "centered" | "split" | "feature";
type Mark = "word" | "logo";
type View = "plan" | "section" | "elevation";
type Said = { tone: ChapterTone } | { rhythm: ChapterRhythm } | { heading: Heading } | { mark: Mark } | null;

const T = {
  fr: {
    specimen: {
      title: "Réglez un chapitre",
      region: "Spécimen : un chapitre entre ses deux voisins",
      hint: "Changez un réglage : le chapitre change, ses voisins restent.",
      controls: {
        tone: { label: "Ton", options: { light: "Clair", paper: "Papier", dark: "Sombre" } },
        rhythm: { label: "Rythme", options: { standard: "Standard", compact: "Compact", cinematic: "Cinématique" } },
        heading: { label: "Titre", options: { centered: "Centré", split: "Scindé", feature: "Vedette" } },
        mark: { label: "Marque client", options: { word: "Mot", logo: "Logo" } },
      },
      say: {
        tone: {
          light: "Clair. Entre deux chapitres sombres, la coupe nette sépare : aucun trait.",
          paper: "Papier. Le blanc franc, pour un chapitre qui doit se détacher d'une page claire.",
          dark: "Sombre. Entre deux sombres, plus de coupe : passez-le en compact, l'espace seul marque la suite.",
        },
        rhythm: {
          standard: "Standard. 120 au-dessus et au-dessous, 80 sur téléphone.",
          compact: "Compact. 96 : la suite d'un chapitre du même ton.",
          cinematic: "Cinématique. 144 au-dessus : l'entrée dans un chapitre sombre.",
        },
        heading: {
          centered: "Centré. Titre, phrase et ligne de repères, sur le rail de lecture.",
          split: "Scindé. Le titre et son instrument côte à côte, sur le rail large ; l'instrument passe dessous si la place manque.",
          feature: "Vedette. Un cran plus grand, une seule fois par région de page.",
        },
        mark: {
          word: "Mot. Le nom du client reste écrit dans le titre.",
          logo: "Logo. La marque du client remplace le mot, à 1,1 fois la hauteur du titre.",
        },
      },
    },
    studio: {
      title: (name: ReactNode) => <>L'atelier {name} en quatre <em>gestes</em></>,
      word: "Halde",
      subtitle: "Relever, dessiner, construire, transmettre : chaque projet traverse les mêmes gestes.",
      phasesLabel: "Phases",
      phases: [
        ["Relevé", "Le terrain, la lumière, l'existant."],
        ["Esquisse", "Trois pistes, une retenue."],
        ["Chantier", "Une visite par semaine."],
        ["Livraison", "Les clés et le carnet."],
      ],
    },
    page: {
      title: "La page entière",
      lead: "Atelier Halde, cabinet d'architectes imaginaire : trois chapitres, puis le pied de page qui signe Evoview.",
    },
    light: {
      title: <>La lumière <em>d'abord</em></>,
      subtitle: "Avant les murs, on dessine le trajet du soleil dans la pièce.",
      caption: "Maison du Pré — séjour, de midi au soir",
      momentsLabel: "Heure du jour",
      moments: ["Midi", "15 h", "18 h", "Soir"],
    },
    projects: {
      title: "Maison du Pré",
      subtitle: "Une longère reprise pour une famille de cinq. Les mêmes murs, une autre lumière.",
      views: { plan: "Plan", section: "Coupe", elevation: "Façade" },
      viewsLabel: "Dessin affiché",
      captions: { plan: "Plan du rez · 1:100", section: "Coupe A–A · 1:100", elevation: "Façade sud · 1:100" },
      place: "Habitat · 2025",
    },
    visit: {
      title: "Visiter l'atelier",
      subtitle: "Gand, Dok Noord 4. Sur rendez-vous, du mardi au vendredi.",
      cta: "Prendre rendez-vous",
    },
  },
  en: {
    specimen: {
      title: "Set one chapter",
      region: "Specimen: one chapter between its two neighbours",
      hint: "Change a setting: the chapter changes, its neighbours stay.",
      controls: {
        tone: { label: "Tone", options: { light: "Light", paper: "Paper", dark: "Dark" } },
        rhythm: { label: "Rhythm", options: { standard: "Standard", compact: "Compact", cinematic: "Cinematic" } },
        heading: { label: "Heading", options: { centered: "Centered", split: "Split", feature: "Feature" } },
        mark: { label: "Client mark", options: { word: "Word", logo: "Logo" } },
      },
      say: {
        tone: {
          light: "Light. Between two dark chapters, the hard cut separates: no rule.",
          paper: "Paper. The clean white, for a chapter that must stand off a light page.",
          dark: "Dark. Between two dark ones there is no cut: make it compact, space alone marks the continuation.",
        },
        rhythm: {
          standard: "Standard. 120 above and below, 80 on phones.",
          compact: "Compact. 96: the continuation of a same-tone chapter.",
          cinematic: "Cinematic. 144 above: the entry into a dark chapter.",
        },
        heading: {
          centered: "Centered. Title, sentence and a support line, on the reading rail.",
          split: "Split. The title beside its instrument, on the wide rail; the instrument drops below when room runs out.",
          feature: "Feature. One size up, once per page region.",
        },
        mark: {
          word: "Word. The client's name stays written in the title.",
          logo: "Logo. The client's mark replaces the word, at 1.1× the title height.",
        },
      },
    },
    studio: {
      title: (name: ReactNode) => <>The {name} studio in four <em>moves</em></>,
      word: "Halde",
      subtitle: "Survey, draw, build, hand over: every project goes through the same moves.",
      phasesLabel: "Phases",
      phases: [
        ["Survey", "The site, the light, what stands."],
        ["Sketch", "Three options, one kept."],
        ["Build", "One site visit a week."],
        ["Handover", "The keys and the logbook."],
      ],
    },
    page: {
      title: "The whole page",
      lead: "Atelier Halde, an imaginary architecture studio: three chapters, then the footer that signs Evoview.",
    },
    light: {
      title: <>Light <em>first</em></>,
      subtitle: "Before the walls, we draw the sun's path through the room.",
      caption: "Meadow House — living room, noon to evening",
      momentsLabel: "Time of day",
      moments: ["Noon", "3 pm", "6 pm", "Evening"],
    },
    projects: {
      title: "Meadow House",
      subtitle: "A farmhouse reworked for a family of five. The same walls, another light.",
      views: { plan: "Plan", section: "Section", elevation: "Elevation" },
      viewsLabel: "Drawing shown",
      captions: { plan: "Ground floor plan · 1:100", section: "Section A–A · 1:100", elevation: "South elevation · 1:100" },
      place: "Housing · 2025",
    },
    visit: {
      title: "Visit the studio",
      subtitle: "Ghent, Dok Noord 4. By appointment, Tuesday to Friday.",
      cta: "Book a visit",
    },
  },
} satisfies Record<Locale, unknown>;

type Copy = (typeof T)[Locale];

const options = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

const preventDefault = (e: MouseEvent<HTMLElement>) => e.preventDefault();

function Demo() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => {
    const base = buildChapterConfig(locale);
    return {
      ...base,
      brand: { ...base.brand, href: "#chd-page" },
      footer: { ...base.footer, links: base.footer.links.map((link) => ({ ...link, onSelect: preventDefault })) },
    };
  }, [locale]);

  return (
    <div className="chd">
      <Specimen t={t} brandMark={config.brand.mark} />
      <header id="chd-page" className="lib-rail chd-scene">
        <h2 className="chd-scene__title">{t.page.title}</h2>
        <p className="lib-body chd-scene__lead">{t.page.lead}</p>
      </header>
      <Page t={t} />
      <ChapterFooter config={config} tone="light" />
    </div>
  );
}

/* ── Scene 1 · the specimen ───────────────────────────────────────────── */

function Specimen({ t, brandMark }: { t: Copy; brandMark: ReactNode }) {
  const s = t.specimen;
  const [tone, setTone] = useState<ChapterTone>("light");
  const [rhythm, setRhythm] = useState<ChapterRhythm>("standard");
  const [heading, setHeading] = useState<Heading>("centered");
  const [mark, setMark] = useState<Mark>("logo");
  const [phase, setPhase] = useState(1);
  const [said, setSaid] = useState<Said>(null);
  const [flash, setFlash] = useState(0);

  const sentence = !said
    ? s.hint
    : "tone" in said
      ? s.say.tone[said.tone]
      : "rhythm" in said
        ? s.say.rhythm[said.rhythm]
        : "heading" in said
          ? s.say.heading[said.heading]
          : s.say.mark[said.mark];

  const phases = t.studio.phases.map(([label]) => label);
  const name = mark === "logo" ? <ChapterMark label={t.studio.word}>{brandMark}</ChapterMark> : t.studio.word;

  return (
    <section className="chd-specimen" aria-label={s.region}>
      <div className="lib-rail chd-specimen__grid">
        <div className="ev-root ev-tone-light chd-desk">
          <h2 className="chd-scene__title">{s.title}</h2>
          <div className="chd-desk__controls">
            <Setting label={s.controls.tone.label}>
              <SegmentedControl
                block
                label={s.controls.tone.label}
                options={options(s.controls.tone.options)}
                value={tone}
                onChange={(v) => {
                  setTone(v as ChapterTone);
                  setSaid({ tone: v as ChapterTone });
                }}
              />
            </Setting>
            <Setting label={s.controls.rhythm.label}>
              <SegmentedControl
                block
                label={s.controls.rhythm.label}
                options={options(s.controls.rhythm.options)}
                value={rhythm}
                onChange={(v) => {
                  setRhythm(v as ChapterRhythm);
                  setSaid({ rhythm: v as ChapterRhythm });
                  setFlash((n) => n + 1);
                }}
              />
            </Setting>
            <Setting label={s.controls.heading.label}>
              <SegmentedControl
                block
                label={s.controls.heading.label}
                options={options(s.controls.heading.options)}
                value={heading}
                onChange={(v) => {
                  setHeading(v as Heading);
                  setSaid({ heading: v as Heading });
                }}
              />
            </Setting>
            <Setting label={s.controls.mark.label}>
              <SegmentedControl
                block
                label={s.controls.mark.label}
                options={options(s.controls.mark.options)}
                value={mark}
                onChange={(v) => {
                  setMark(v as Mark);
                  setSaid({ mark: v as Mark });
                }}
              />
            </Setting>
          </div>
          <p className="ev-t-body chd-desk__say" aria-live="polite">
            {sentence}
          </p>
        </div>

        <div className="chd-frame">
          <div className="ev-root ev-tone-dark chd-neighbour chd-neighbour--before" aria-hidden="true">
            <div className="ev-rail ev-rail--wide">
              <div className="chd-neighbour__crop">
                <Room moment={2} />
              </div>
              <Readout as="p" className="chd-caption">
                {t.light.caption}
              </Readout>
            </div>
          </div>

          <ChapterShell
            id="chd-specimen"
            tone={tone}
            rhythm={rhythm}
            rail={heading === "split" ? "wide" : "reading"}
            className="chd-live"
          >
            {flash > 0 && (
              <>
                <span key={`t${flash}`} className="chd-band chd-band--top" aria-hidden="true" />
                <span key={`b${flash}`} className="chd-band chd-band--bottom" aria-hidden="true" />
              </>
            )}
            <ChapterHeading
              level={3}
              layout={heading === "split" ? "split" : "centered"}
              variant={heading === "feature" ? "feature" : "standard"}
              title={t.studio.title(name)}
              subtitle={t.studio.subtitle}
              side={
                heading === "split" ? (
                  <SegmentedControl
                    label={t.studio.phasesLabel}
                    options={phases.map((label, i) => ({ value: String(i), label }))}
                    value={String(phase)}
                    onChange={(v) => setPhase(Number(v))}
                  />
                ) : undefined
              }
            />
            <ol className="chd-phases" aria-label={t.studio.phasesLabel}>
              {t.studio.phases.map(([label, line], i) => (
                <li key={i} className="chd-phase" aria-current={i === phase ? "step" : undefined}>
                  <span className="chd-phase__bar" aria-hidden="true" />
                  <span className="ev-t-label chd-phase__label">{label}</span>
                  <p className="ev-t-compact chd-phase__line">{line}</p>
                </li>
              ))}
            </ol>
          </ChapterShell>

          <div className="ev-root ev-tone-dark chd-neighbour chd-neighbour--after" aria-hidden="true">
            <div className="ev-rail">
              <div className="ev-chapter__heading ev-chapter__heading--split">
                <div className="ev-chapter__main">
                  <p className="ev-chapter__title ev-t-section">
                    <span className="ev-marker ev-chapter__marker" />
                    {t.visit.title}
                  </p>
                  <p className="ev-chapter__subtitle">{t.visit.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="chd-setting">
      <Readout className="chd-setting__label" aria-hidden="true">
        {label}
      </Readout>
      {children}
    </div>
  );
}

/* ── Scene 2 · the page ───────────────────────────────────────────────── */

const MOMENT_MS = 4200;

function Page({ t }: { t: Copy }) {
  const [view, setView] = useState<View>("plan");
  const views = options(t.projects.views);
  const viewIndex = views.findIndex((v) => v.value === view) + 1;

  /* The sun's path: four moments, advancing only while the room is
     on-screen, the tab visible and nothing suspends the page. */
  const roomRef = useRef<HTMLElement>(null);
  const { active } = useInViewPause(roomRef);
  const [moment, setMoment] = useState(0);
  useSequenceClock(moment, active, MOMENT_MS, () => setMoment((m) => (m + 1) % t.light.moments.length));

  return (
    <>
      <ChapterShell id="lumiere" tone="dark" rhythm="cinematic" rail="wide">
        <ChapterHeading
          level={3}
          live
          variant="feature"
          title={t.light.title}
          subtitle={t.light.subtitle}
          support={<ChapterTicker label={t.light.momentsLabel} items={t.light.moments} active={moment} />}
        />
        <figure ref={roomRef} className="chd-figure">
          <Room moment={moment} label={t.light.caption} />
          <figcaption className="chd-caption">
            <Readout>{t.light.caption}</Readout>
          </figcaption>
        </figure>
      </ChapterShell>

      <ChapterShell id="visite" tone="dark" rhythm="compact" rail="reading">
        <ChapterHeading
          level={3}
          layout="split"
          title={t.visit.title}
          subtitle={t.visit.subtitle}
          side={<PrimaryPlate onClick={() => undefined}>{t.visit.cta}</PrimaryPlate>}
        />
      </ChapterShell>

      <ChapterShell id="projets" tone="paper" rhythm="standard" rail="wide">
        <ChapterHeading
          level={3}
          layout="split"
          title={t.projects.title}
          subtitle={t.projects.subtitle}
          side={<SegmentedControl options={views} value={view} onChange={(v) => setView(v as View)} label={t.projects.viewsLabel} />}
        />
        <figure className="chd-figure">
          <div className="chd-sheet">
            <Drawing key={view} view={view} />
          </div>
          <figcaption className="chd-caption">
            <Readout>
              {String(viewIndex).padStart(2, "0")} / {String(views.length).padStart(2, "0")} — {t.projects.captions[view]}
            </Readout>
            <Readout className="chd-caption__aside">{t.projects.place}</Readout>
          </figcaption>
        </figure>
      </ChapterShell>
    </>
  );
}

/* A graded room: the light is the subject; `moment` (0–3) sets the sun. */
function Room({ moment, label }: { moment: number; label?: string }) {
  return (
    <div className="chd-room" data-moment={moment} role={label ? "img" : undefined} aria-label={label}>
      <span className="chd-room__wall" />
      <span className="chd-room__window" />
      <span className="chd-room__beam" />
      <span className="chd-room__floor" />
      <span className="chd-room__patch" />
    </div>
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
