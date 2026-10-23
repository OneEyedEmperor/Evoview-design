import { useMemo } from "react";
import { Story, buildStoryBlocksConfig } from "../../../components/story-blocks/src";
import ShowcasePage, { ShowcaseVariant } from "../../library/ShowcasePage";
import { useLibraryLocale, type Localized } from "../../library/locale";

/* One fictional winery: the full story on a dark page, then the short close
   a light page would use. The frame owns the spacing; the story's chapter
   band (cinematic top) is absorbed under each caption. Colour comes only
   from the frame's --primary: a swatch never re-renders them. */
export default function StoryBlocks() {
  return (
    <ShowcasePage
      entryId="story-blocks"
      title={(l) => (l === "fr" ? <>Blocs de <em>récit</em></> : <>Story <em>blocks</em></>)}
      intro={{
        fr: "Quatre blocs ouverts qui mènent une offre jusqu'à son action : une image qui ouvre, une séquence, des preuves, un bandeau final.",
        en: "Four open blocks that carry an offer to its action: an opening image, a sequence, the proof, a closing band.",
      }}
      tone="dark"
    >
      <Stories />
    </ShowcasePage>
  );
}

const WHEN: Record<"full" | "short", Localized> = {
  full: {
    fr: "Quand l'offre mérite une page entière : une ouverture, une séquence, des preuves, puis une seule action.",
    en: "When the offer deserves a whole page: an opening, a sequence, the proof, then one action.",
  },
  short: {
    fr: "Pour clore une page claire : un programme horaire, puis la réservation.",
    en: "To close a light page: a timed programme, then the booking.",
  },
};

function Stories() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => buildStoryBlocksConfig(locale), [locale]);
  return (
    <>
      <ShowcaseVariant name="Story · dark" when={WHEN.full[locale]} rhythm="cinematic">
        <Story tone="dark" copy={config.copy} chapters={config.stories.harvest} />
      </ShowcaseVariant>
      <ShowcaseVariant name="Story · paper" when={WHEN.short[locale]} tone="paper" rhythm="cinematic">
        <Story tone="paper" copy={config.copy} chapters={config.stories.visit} />
      </ShowcaseVariant>
    </>
  );
}
