import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  Chapter as ChapterShell,
  ChapterHeading,
  ChapterMark,
  ChapterTicker,
  buildChapterConfig,
  type ChapterTone,
} from "../../../components/chapter/src";
import { SegmentedControl, Switch, rovingKeyDown } from "../../../components/controls/src";
import { OrbFill, Readout, useInViewPause, useSequenceClock } from "../../../components/foundation/src";
import "../../../components/chapter/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../library/locale";
import EveilMark from "./EveilMark";
import ContactScene from "./chapter/ContactScene";
import FaqScene from "./chapter/FaqScene";
import FooterScene from "./chapter/FooterScene";
import StoryScene from "./chapter/StoryScene";
import { DeskSetting, Scene, SceneDesk, deskOptions } from "./scene/Scene";

/* Scenes, each a caption → desk → component on the component's ground
   (./scene/Scene), in the order a client page unfolds: the chapter
   specimen, the story, the FAQ, the contact, and the footer with the
   Evoview credit. Colour comes from the frame's --primary
   only; a swatch never re-renders. */
export default function Chapter() {
  return (
    <ShowcasePage
      entryId="chapter"
      title={(l) => (l === "fr" ? <>Rythme des <em>sections</em></> : <>Section <em>pacing</em></>)}
      tone="dark"
      defaultAccent="#b4532a"
    >
      <Demo />
    </ShowcasePage>
  );
}

type Heading = "centered" | "split" | "feature";
type View = "plan" | "section" | "elevation";
type Instrument = "phases" | "ticker" | "steps";
type Said = { tone: ChapterTone } | { instrument: Instrument } | { heading: Heading } | { logo: boolean } | null;

const T = {
  fr: {
    specimen: {
      name: "Chapitre",
      when: "La coque de chaque section du site : le ton, le titre et l'instrument se choisissent chapitre par chapitre.",
      hint: "Changez un réglage : le chapitre change, ses voisins restent.",
      controls: {
        tone: { label: "Ton", options: { light: "Clair", paper: "Papier", dark: "Sombre" } },
        instrument: { label: "Instrument", options: { phases: "Phases", ticker: "Fil", steps: "Étapes" } },
        heading: { label: "Titre", options: { centered: "Centré", split: "Scindé", feature: "Vedette" } },
        logo: { label: "Logo", switch: "Logo du client" },
      },
      say: {
        tone: {
          light: "Clair. Entre deux chapitres sombres, la coupe nette sépare : aucun trait.",
          paper: "Papier. Le blanc franc, pour un chapitre qui doit se détacher d'une page claire.",
          dark: "Sombre. Entre deux sombres, plus de coupe : passez-le en compact, l'espace seul marque la suite.",
        },
        instrument: {
          phases: "Phases. Un sélecteur dans le titre : le lecteur choisit la phase, le dessin suit.",
          ticker: "Fil. Une ligne d'état : les phases défilent seules, la courante marquée. Retirée sur téléphone.",
          steps: "Étapes. Les quatre gestes posés d'un coup, chacun avec sa phrase : l'introduction énonce toute la méthode, sans image.",
        },
        heading: {
          centered: "Centré. Titre, phrase et instrument empilés sur le rail de lecture.",
          split: "Scindé. Le titre à gauche, son instrument à droite, sur le rail large ; sur téléphone l'instrument passe dessous.",
          feature: "Vedette. Titre un cran plus grand, le contenu prend la scène : les phases indexent le dessin, l'image va au bord, les étapes s'alignent. Une fois par région.",
        },
        logo: {
          centered: "Logo, centré. La marque remplace le nom de l'atelier dans le titre, à la hauteur de la ligne.",
          split: "Logo, scindé. La marque coiffe la colonne de l'instrument, face au titre.",
          feature: "Logo, vedette. La marque ouvre la région, en grand au-dessus du titre.",
          off: "Sans logo. Le nom de l'atelier s'écrit en toutes lettres dans le titre.",
        },
      },
    },
    studio: {
      title: (name: ReactNode) => <>L'atelier {name} en quatre <em>gestes</em></>,
      word: "Halde",
      subtitle: "Relever, dessiner, construire, transmettre : chaque projet traverse les mêmes gestes.",
      phasesLabel: "Phases",
      phases: ["Relevé", "Esquisse", "Chantier", "Livraison"],
      steps: [
        "On mesure ce qui existe : les murs, la lumière, les usages.",
        "Plans et coupes à la main, jusqu'à ce que la lumière tombe juste.",
        "Sur place chaque semaine, aux côtés des artisans.",
        "Les clés, les plans, et une visite un an plus tard.",
      ],
      drawings: ["Relevé · plan du rez", "Esquisse · coupe A–A", "Chantier · façade sud", "Livraison · façade sud, le soir"],
    },
  },
  en: {
    specimen: {
      name: "Chapter",
      when: "The shell of every section on the site: tone, heading and instrument are chosen chapter by chapter.",
      hint: "Change a setting: the chapter changes, its neighbours stay.",
      controls: {
        tone: { label: "Tone", options: { light: "Light", paper: "Paper", dark: "Dark" } },
        instrument: { label: "Instrument", options: { phases: "Phases", ticker: "Ticker", steps: "Steps" } },
        heading: { label: "Heading", options: { centered: "Centered", split: "Split", feature: "Feature" } },
        logo: { label: "Logo", switch: "Client logo" },
      },
      say: {
        tone: {
          light: "Light. Between two dark chapters, the hard cut separates: no rule.",
          paper: "Paper. The clean white, for a chapter that must stand off a light page.",
          dark: "Dark. Between two dark ones there is no cut: make it compact, space alone marks the continuation.",
        },
        instrument: {
          phases: "Phases. A chooser in the heading: the reader picks the phase, the drawing follows.",
          ticker: "Ticker. One state line: the phases run on their own, the current one marked. Dropped on phones.",
          steps: "Steps. The four moves laid out at once, each with its sentence: the introduction states the whole method, no image.",
        },
        heading: {
          centered: "Centered. Title, sentence and instrument stacked on the reading rail.",
          split: "Split. The title on the left, its instrument on the right, on the wide rail; on phones the instrument drops below.",
          feature: "Feature. Title one size up, the content takes the stage: the phases index the drawing, the image bleeds, the steps line up. Once per region.",
        },
        logo: {
          centered: "Logo, centered. The mark replaces the studio's name inside the title, at line height.",
          split: "Logo, split. The mark heads the instrument column, across from the title.",
          feature: "Logo, feature. The mark opens the region, set large above the title.",
          off: "No logo. The studio's name is spelled out in the title.",
        },
      },
    },
    studio: {
      title: (name: ReactNode) => <>The {name} studio in four <em>moves</em></>,
      word: "Halde",
      subtitle: "Survey, draw, build, hand over: every project goes through the same moves.",
      phasesLabel: "Phases",
      phases: ["Survey", "Sketch", "Build", "Handover"],
      steps: [
        "We measure what stands: the walls, the light, how the house is lived in.",
        "Plans and sections by hand, until the light falls right.",
        "On site every week, beside the builders.",
        "The keys, the drawings, and a visit a year later.",
      ],
      drawings: ["Survey · ground floor plan", "Sketch · section A–A", "Build · south elevation", "Handover · south elevation, evening"],
    },
  },
} satisfies Record<Locale, unknown>;

type Copy = (typeof T)[Locale];

const preventDefault = (e: MouseEvent<HTMLElement>) => e.preventDefault();

function Demo() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => {
    const base = buildChapterConfig(locale);
    return {
      ...base,
      brand: { ...base.brand, href: "#chd-specimen" },
      footer: { ...base.footer, links: base.footer.links.map((link) => ({ ...link, onSelect: preventDefault })) },
    };
  }, [locale]);

  return (
    <>
      {/* No `tone`: the specimen is a framed crop on the frame's ground. */}
      <Scene name={t.specimen.name} when={t.specimen.when}>
        <Specimen t={t} />
      </Scene>
      <StoryScene />
      <FaqScene />
      <ContactScene />
      <FooterScene config={config} />
    </>
  );
}

/* ── Scene 1 · the specimen ───────────────────────────────────────────── */

function Specimen({ t }: { t: Copy }) {
  const s = t.specimen;
  const [tone, setTone] = useState<ChapterTone>("paper");
  const [instrument, setInstrument] = useState<Instrument>("phases");
  const [heading, setHeading] = useState<Heading>("feature");
  const [phase, setPhase] = useState(1);
  const [logo, setLogo] = useState(true);
  const [said, setSaid] = useState<Said>(null);

  const sentence = !said
    ? s.hint
    : "tone" in said
      ? s.say.tone[said.tone]
      : "instrument" in said
        ? s.say.instrument[said.instrument]
        : "logo" in said
          ? said.logo
            ? s.say.logo[heading]
            : s.say.logo.off
          : s.say.heading[said.heading];
  const sayAll = [s.hint, ...Object.values(s.say.tone), ...Object.values(s.say.instrument), ...Object.values(s.say.heading), ...Object.values(s.say.logo)];

  const phases = t.studio.phases;

  /* Ticker: the phases advance on their own while the specimen is on-screen. */
  const frameRef = useRef<HTMLDivElement>(null);
  const { active } = useInViewPause(frameRef);
  useSequenceClock(phase, active && instrument === "ticker", MOMENT_MS, () => setPhase((p) => (p + 1) % phases.length));

  /* Feature = the content takes the stage: the phases leave the heading to
     index the drawing, the ticker's drawing bleeds, the steps line up. */
  const feature = heading === "feature";
  const phaseList = <PhaseList label={t.studio.phasesLabel} items={phases} active={phase} onChange={setPhase} row={heading === "centered"} />;
  const carried =
    instrument === "phases" && !feature ? (
      phaseList
    ) : instrument === "ticker" ? (
      <ChapterTicker label={t.studio.phasesLabel} items={phases} active={phase} />
    ) : undefined;

  /* The client logo, placed by layout: inside the title where the heading
     is a sentence (centered), heading the instrument column across from the
     title (split), opening the region above the title (feature). Outside
     the title it doubles the spelled-out name, so it is decorative. */
  const titleWord =
    logo && heading === "centered" ? (
      <ChapterMark label={t.studio.word} className="chd-logo-in">
        <EveilMark />
      </ChapterMark>
    ) : (
      t.studio.word
    );
  const side =
    heading !== "split" ? undefined : logo ? (
      <div className="chd-side">
        <span className="chd-logo chd-logo--side" aria-hidden="true">
          <EveilMark />
        </span>
        {carried}
      </div>
    ) : (
      carried
    );

  const figure = (
    <figure className="chd-figure">
      <div className={`chd-sheet chd-sheet--specimen chd-sheet--${heading}`}>
        <Drawing key={phase} view={PHASE_VIEW[phase]} lit={phase === 3} />
      </div>
      <figcaption className="chd-caption">
        <Readout>{t.studio.drawings[phase]}</Readout>
      </figcaption>
    </figure>
  );

  return (
    <div className="chd-specimen">
      <div className="lib-rail chd-specimen__grid">
        <div className="ev-root ev-tone-dark chd-desk">
          <SceneDesk layout="column" say={sentence} sayAll={sayAll}>
            <DeskSetting label={s.controls.tone.label}>
              <SegmentedControl
                block
                label={s.controls.tone.label}
                options={deskOptions(s.controls.tone.options)}
                value={tone}
                onChange={(v) => {
                  setTone(v as ChapterTone);
                  setSaid({ tone: v as ChapterTone });
                }}
              />
            </DeskSetting>
            <DeskSetting label={s.controls.instrument.label}>
              <SegmentedControl
                block
                label={s.controls.instrument.label}
                options={deskOptions(s.controls.instrument.options)}
                value={instrument}
                onChange={(v) => {
                  setInstrument(v as Instrument);
                  setSaid({ instrument: v as Instrument });
                }}
              />
            </DeskSetting>
            <DeskSetting label={s.controls.heading.label}>
              <LayoutPicker
                label={s.controls.heading.label}
                labels={s.controls.heading.options}
                value={heading}
                onChange={(v) => {
                  setHeading(v);
                  setSaid({ heading: v });
                }}
              />
            </DeskSetting>
            <DeskSetting label={s.controls.logo.label}>
              <Switch
                label={s.controls.logo.switch}
                checked={logo}
                onCheckedChange={(on) => {
                  setLogo(on);
                  setSaid({ logo: on });
                }}
              />
            </DeskSetting>
          </SceneDesk>
        </div>

        {/* data-lib-ink: the crop is a painted object, so the frame keeps a
            chapter band under its edge, not under its last line. */}
        <div ref={frameRef} className="chd-frame" data-lib-ink="">
          <ChapterShell
            id="chd-specimen"
            tone={tone}
            rail={heading === "split" ? "wide" : "reading"}
            className="chd-live"
            data-instrument={instrument}
            data-heading={heading}
          >
            {logo && feature && (
              <span className="chd-logo chd-logo--emblem" aria-hidden="true">
                <EveilMark />
              </span>
            )}
            <ChapterHeading
              level={3}
              marker={false}
              live={instrument === "ticker"}
              layout={heading === "split" ? "split" : "centered"}
              variant={heading === "feature" ? "feature" : "standard"}
              title={t.studio.title(titleWord)}
              subtitle={t.studio.subtitle}
              support={heading === "split" ? undefined : carried}
              side={side}
            />
            {instrument === "steps" ? (
              <ol className="chd-steps" aria-label={t.studio.phasesLabel}>
                {phases.map((name, i) => (
                  <li key={name} className="chd-step">
                    <span className="chd-phase__orb" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="ev-t-label chd-step__name">{name}</span>
                    <p className="ev-t-body chd-step__text">{t.studio.steps[i]}</p>
                  </li>
                ))}
              </ol>
            ) : instrument === "phases" && feature ? (
              <div className="chd-stage">
                {phaseList}
                {figure}
              </div>
            ) : (
              figure
            )}
          </ChapterShell>
        </div>
      </div>
    </div>
  );
}

const LAYOUTS: Heading[] = ["centered", "split", "feature"];

/* Heading setting as three schematic tiles: the layout is read before its name. */
function LayoutPicker({
  label,
  labels,
  value,
  onChange,
}: {
  label: string;
  labels: Record<Heading, string>;
  value: Heading;
  onChange: (value: Heading) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="chd-layouts"
      onKeyDown={(e) => rovingKeyDown(e, (i) => onChange(LAYOUTS[i]), "[role=radio]")}
    >
      {LAYOUTS.map((layout) => (
        <button
          key={layout}
          type="button"
          role="radio"
          aria-checked={layout === value}
          tabIndex={layout === value ? 0 : -1}
          className="chd-layout"
          onClick={() => onChange(layout)}
        >
          <LayoutSchematic layout={layout} />
          <span className="ev-t-label">{labels[layout]}</span>
        </button>
      ))}
    </div>
  );
}

function LayoutSchematic({ layout }: { layout: Heading }) {
  return (
    <svg className="chd-layout__plan" viewBox="0 0 72 44" aria-hidden="true" focusable="false">
      {layout === "centered" && (
        <>
          <rect x="18" y="3" width="36" height="5" rx="1.5" className="chd-s-title" />
          <rect x="22" y="10" width="28" height="2.5" rx="1.25" className="chd-s-text" />
          <rect x="14" y="17" width="10" height="4" rx="1.5" className="chd-s-text" />
          <rect x="25.5" y="17" width="10" height="4" rx="1.5" className="chd-s-signal" />
          <rect x="37" y="17" width="10" height="4" rx="1.5" className="chd-s-text" />
          <rect x="48.5" y="17" width="10" height="4" rx="1.5" className="chd-s-text" />
          <rect x="8" y="27" width="56" height="13" rx="2.5" className="chd-s-media" />
        </>
      )}
      {layout === "split" && (
        <>
          <rect x="6" y="6" width="32" height="5" rx="1.5" className="chd-s-title" />
          <rect x="6" y="14" width="24" height="2.5" rx="1.25" className="chd-s-text" />
          <rect x="48" y="5" width="18" height="4" rx="1.5" className="chd-s-signal" />
          <rect x="48" y="11" width="18" height="4" rx="1.5" className="chd-s-text" />
          <rect x="48" y="17" width="18" height="4" rx="1.5" className="chd-s-text" />
          <rect x="6" y="27" width="60" height="13" rx="2.5" className="chd-s-media" />
        </>
      )}
      {layout === "feature" && (
        <>
          <rect x="10" y="2" width="52" height="7" rx="2" className="chd-s-title" />
          <rect x="20" y="11" width="32" height="2.5" rx="1.25" className="chd-s-text" />
          <rect x="27" y="15.5" width="18" height="3" rx="1" className="chd-s-signal" />
          <rect x="27" y="20" width="18" height="3" rx="1" className="chd-s-text" />
          <rect x="27" y="24.5" width="18" height="3" rx="1" className="chd-s-text" />
          <rect x="4" y="29.5" width="64" height="13" rx="2.5" className="chd-s-media" />
        </>
      )}
    </svg>
  );
}

/* Split heading instrument: the phases as a short vertical list, narrow
   enough to stand beside the title instead of wrapping under it. */
function PhaseList({
  label,
  items,
  active,
  onChange,
  row = false,
}: {
  label: string;
  items: string[];
  active: number;
  onChange: (i: number) => void;
  row?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={row ? "chd-phases chd-phases--row" : "chd-phases"} onKeyDown={(e) => rovingKeyDown(e, onChange, "[role=radio]")}>
      {items.map((item, i) => (
        <button
          key={item}
          type="button"
          role="radio"
          aria-checked={i === active}
          tabIndex={i === active ? 0 : -1}
          className="chd-phase"
          onClick={() => onChange(i)}
        >
          <span className="chd-phase__orb" aria-hidden="true">
            <OrbFill on={i === active}>{i + 1}</OrbFill>
          </span>
          <span className="ev-t-label">{item}</span>
        </button>
      ))}
    </div>
  );
}

const PHASE_VIEW: View[] = ["plan", "section", "elevation", "elevation"];

const MOMENT_MS = 4200;

/* Line drawings of the fictional house (ink, one accent signal each). */
function Drawing({ view, lit = false }: { view: View; lit?: boolean }) {
  return (
    <svg className="chd-drawing" data-lit={lit || undefined} viewBox="0 0 440 200" aria-hidden="true" focusable="false">
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
          <rect x="160" y="92" width="30" height="40" className="chd-d-thin chd-d-window" />
          <rect x="250" y="92" width="30" height="40" className="chd-d-thin chd-d-window" />
          <rect x="205" y="118" width="30" height="52" className="chd-d-thin chd-d-window" />
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
