import { useMemo, type ReactNode } from "react";
import { CompareToggle, ProofAtlas, SelectorStage as Stage, buildSelectorStageConfig, type Tone } from "../../../components/selector-stage/src";
import { Index, Readout } from "../../../components/foundation/src";
import "../../../components/selector-stage/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale } from "../../library/locale";

/* Four chapters of one fictional client (a renovation studio with a lime-paint
   line). Colour comes only from the frame's --primary: nothing re-renders on a swatch. */
export default function SelectorStage() {
  return (
    <ShowcasePage
      entryId="selector-stage"
      title={(l) => (l === "fr" ? <>Sélecteur et <em>scène</em></> : <>Selector <em>stage</em></>)}
      intro={{
        fr: "Un chapitre qui montre une variable à la fois : des rangées pilotent une scène, un avant/après sur le même cadre, un atlas de cadres.",
        en: "A chapter that shows one variable at a time: rows drive a stage, a before/after on the same frame, an atlas of frames.",
      }}
      tone="dark"
    >
      <Demo />
    </ShowcasePage>
  );
}

const SPECS = {
  fr: [
    ["SelectorStage", "sombre · défilement auto · scène photo"],
    ["CompareToggle", "papier · avant / après sur le même cadre"],
    ["CompareToggle · pair", "clair · deux plans, scène dessinée"],
    ["ProofAtlas", "sombre · cadre principal + vignettes"],
  ],
  en: [
    ["SelectorStage", "dark · autoplay · photo stage"],
    ["CompareToggle", "paper · before / after on one frame"],
    ["CompareToggle · pair", "light · two plans, drawn stage"],
    ["ProofAtlas", "dark · main frame + thumbnails"],
  ],
} as const;

function Band({ n, tone, children }: { n: number; tone: Tone; children: ReactNode }) {
  const { locale } = useLibraryLocale();
  const [name, meta] = SPECS[locale][n - 1];
  return (
    <div className={`ev-root ev-tone-${tone} ssx-band`}>
      <div className="ev-rail ev-rail--wide ssx-spec">
        <Index current={n} total={4} className="ssx-spec__index" />
        <Readout className="ssx-spec__name">{name}</Readout>
        <Readout>{meta}</Readout>
      </div>
      {children}
    </div>
  );
}

function Demo() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => buildSelectorStageConfig(locale), [locale]);
  const { copy, chapters } = config;
  return (
    <div>
      <Band n={1} tone="dark">
        <Stage key={locale} {...chapters.finishes} copy={copy} tone="dark" autoplay={{ dwellMs: 4200 }} />
      </Band>
      <Band n={2} tone="paper">
        <CompareToggle key={locale} {...chapters.renovation} copy={copy} tone="paper" />
      </Band>
      <Band n={3} tone="light">
        <CompareToggle key={locale} {...chapters.plans} copy={copy} tone="light" mode="pair" />
      </Band>
      <Band n={4} tone="dark">
        <ProofAtlas key={locale} {...chapters.atlas} copy={copy} tone="dark" />
      </Band>
    </div>
  );
}
