import { Index, Readout } from "../../../components/foundation/src";
import { Story, buildStoryBlocksConfig } from "../../../components/story-blocks/src";
import "../../../components/story-blocks/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../library/locale";

/* Two stories of one fictional winery: dark (harvest) and paper (visit).
   Colour comes only from the frame's --primary: a swatch never re-renders them. */
export default function StoryBlocks() {
  return (
    <ShowcasePage
      entryId="story-blocks"
      title={(l) => (l === "fr" ? <>Blocs de <em>récit</em></> : <>Story <em>blocks</em></>)}
      intro={{
        fr: "Les blocs ouverts qui racontent un chapitre : intro scindée et preuve, rangs indexés, grille de preuves, piliers, bandeau final à une seule action.",
        en: "The open blocks that tell a chapter: intro split and proof, indexed rows, proof grid, pillars, a payoff band with a single action.",
      }}
      tone="dark"
    >
      <Stories />
    </ShowcasePage>
  );
}

const VARIANTS = {
  fr: [
    { tone: "Ton sombre", name: "Le millésime", parts: "Intro · rangs · grille de preuves · bandeau final" },
    { tone: "Ton papier", name: "La visite", parts: "Intro haute · rangs pleine largeur · piliers · bandeau final" },
  ],
  en: [
    { tone: "Dark tone", name: "The vintage", parts: "Intro · rows · proof grid · payoff band" },
    { tone: "Paper tone", name: "The visit", parts: "Top-aligned intro · full-width rows · pillars · payoff band" },
  ],
  fiction: { fr: "Exemple fictif · images générées", en: "Fictional example · generated images" },
} as const;

function Variant({ n, locale }: { n: 0 | 1; locale: Locale }) {
  const v = VARIANTS[locale][n];
  return (
    <div className="ev-root sbx-variant">
      <div className="lib-rail sbx-variant__row">
        <Index current={n + 1} total={2} size="lg" className="sbx-variant__index" />
        <p className="sbx-variant__name">
          <span>{v.name}</span> <Readout className="sbx-variant__tone">{v.tone}</Readout>
        </p>
        <Readout className="sbx-variant__parts">{v.parts}</Readout>
        <Readout className="sbx-variant__fiction">{VARIANTS.fiction[locale]}</Readout>
      </div>
    </div>
  );
}

function Stories() {
  const { locale } = useLibraryLocale();
  const config = buildStoryBlocksConfig(locale);
  return (
    <div className="sbx">
      <Variant n={0} locale={locale} />
      <Story tone="dark" copy={config.copy} chapters={config.stories.harvest} />
      <Variant n={1} locale={locale} />
      <Story tone="paper" copy={config.copy} chapters={config.stories.visit} />
    </div>
  );
}
