import { useMemo, type ReactNode } from "react";
import { CompareToggle, ProofAtlas, SelectorStage as Stage, buildSelectorStageConfig, type Tone } from "../../../components/selector-stage/src";
import { Readout } from "../../../components/foundation/src";
import "../../../components/selector-stage/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Localized } from "../../library/locale";

/* Four chapters of one fictional client (a renovation studio with a lime-paint
   line), one per client job. Colour comes only from the frame's --primary and
   a locale switch only swaps copy: nothing remounts, state survives both. */
export default function SelectorStage() {
  return (
    <ShowcasePage
      entryId="selector-stage"
      title={(l) => (l === "fr" ? <>Sélecteur et <em>scène</em></> : <>Selector <em>stage</em></>)}
      intro={{
        fr: "Un chapitre qui fait comparer : le visiteur change une chose, la scène montre ce qu'elle change.",
        en: "A chapter for comparing: the visitor changes one thing, the stage shows what it changes.",
      }}
      tone="dark"
    >
      <Demo />
    </ShowcasePage>
  );
}

const JOBS: { name: string; job: Localized }[] = [
  {
    name: "SelectorStage",
    job: {
      fr: "Une variable, plusieurs valeurs : les rangées pilotent la scène. Défilement automatique en option, arrêté au premier choix.",
      en: "One variable, several values: the rows drive the stage. Optional autoplay, stopped by the first choice.",
    },
  },
  {
    name: "CompareToggle",
    job: {
      fr: "Une transformation : avant et après sur le même cadre, pour que seul le changement bouge.",
      en: "A transformation: before and after on the same frame, so only the change moves.",
    },
  },
  {
    name: "CompareToggle · pair",
    job: {
      fr: "Deux alternatives à peser ensemble : côte à côte, à égalité. Sur mobile, une bascule.",
      en: "Two alternatives to weigh together: side by side, as equals. On a phone, a toggle.",
    },
  },
  {
    name: "ProofAtlas",
    job: {
      fr: "Les images sont le choix : une même maison, plusieurs cadres.",
      en: "The pictures are the choice: one house, several frames.",
    },
  },
];

function Band({ n, tone, children }: { n: number; tone: Tone; children: ReactNode }) {
  const { locale } = useLibraryLocale();
  const { name, job } = JOBS[n];
  return (
    <div className={`ev-root ev-tone-${tone} ssx-band`}>
      <p className="ev-rail ev-rail--wide ssx-job">
        <Readout className="ssx-job__name">{name}</Readout>
        <span className="ev-t-compact ssx-job__text">{job[locale]}</span>
      </p>
      {children}
    </div>
  );
}

function Demo() {
  const { locale } = useLibraryLocale();
  const { copy, chapters } = useMemo(() => buildSelectorStageConfig(locale), [locale]);
  return (
    <div>
      <Band n={0} tone="dark">
        <Stage {...chapters.finishes} copy={copy} tone="dark" autoplay={{ dwellMs: 4200 }} />
      </Band>
      <Band n={1} tone="paper">
        <CompareToggle {...chapters.renovation} copy={copy} tone="paper" />
      </Band>
      <Band n={2} tone="light">
        <CompareToggle {...chapters.plans} copy={copy} tone="light" mode="pair" />
      </Band>
      <Band n={3} tone="dark">
        <ProofAtlas {...chapters.atlas} copy={copy} tone="dark" />
      </Band>
    </div>
  );
}
