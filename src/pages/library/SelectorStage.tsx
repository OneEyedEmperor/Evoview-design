import { useMemo, type ReactNode } from "react";
import { CompareToggle, ProofAtlas, SelectorStage as Stage, buildSelectorStageConfig, type Tone } from "../../../components/selector-stage/src";
import ShowcasePage, { ShowcaseVariant } from "../../library/ShowcasePage";
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
        fr: "Un chapitre qui fait comparer : le visiteur change une chose, la scène montre ce qu'elle change. Cas et images fictifs.",
        en: "A chapter for comparing: the visitor changes one thing, the stage shows what it changes. Fictional case and images.",
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

/* The first chapter sits on the dark frame (no tone); every chapter brings
   the standard chapter padding. */
function Variant({ n, tone, children }: { n: number; tone?: Tone; children: ReactNode }) {
  const { locale } = useLibraryLocale();
  const { name, job } = JOBS[n];
  return (
    <ShowcaseVariant name={name} when={job[locale]} tone={tone} rhythm="standard">
      {children}
    </ShowcaseVariant>
  );
}

function Demo() {
  const { locale } = useLibraryLocale();
  const { copy, chapters } = useMemo(() => buildSelectorStageConfig(locale), [locale]);
  return (
    <>
      <Variant n={0}>
        <Stage {...chapters.finishes} copy={copy} tone="dark" autoplay={{ dwellMs: 4200 }} />
      </Variant>
      <Variant n={1} tone="paper">
        <CompareToggle {...chapters.renovation} copy={copy} tone="paper" />
      </Variant>
      <Variant n={2} tone="light">
        <CompareToggle {...chapters.plans} copy={copy} tone="light" mode="pair" />
      </Variant>
      <Variant n={3} tone="dark">
        <ProofAtlas {...chapters.atlas} copy={copy} tone="dark" />
      </Variant>
    </>
  );
}
