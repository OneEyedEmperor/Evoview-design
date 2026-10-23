import { useMemo } from "react";
import { Story, buildStoryBlocksConfig } from "../../../components/story-blocks/src";
import "../../../components/story-blocks/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale } from "../../library/locale";

/* One fictional winery: the full story on a dark page, then the short close
   a light page would use. The tone cut between them is the only separator.
   Colour comes only from the frame's --primary: a swatch never re-renders them. */
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

const SHORT = {
  fr: "Sur une page claire, un récit court : un programme horaire, puis la réservation.",
  en: "On a light page, a short story: a timed programme, then the booking.",
};

function Stories() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => buildStoryBlocksConfig(locale), [locale]);
  return (
    <div className="sbx">
      <Story tone="dark" copy={config.copy} chapters={config.stories.harvest} />
      <div className="sbx-short ev-tone-paper">
        <div className="ev-root sbx-short__note">
          <p className="ev-rail ev-rail--wide">{SHORT[locale]}</p>
        </div>
        <Story tone="paper" copy={config.copy} chapters={config.stories.visit} />
      </div>
    </div>
  );
}
