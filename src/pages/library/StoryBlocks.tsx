import ShowcasePage from "../../library/ShowcasePage";

/* Placeholder until the package ships its showcase. */
export default function StoryBlocks() {
  return (
    <ShowcasePage
      entryId="story-blocks"
      title={(l) => (l === "fr" ? <>Blocs de <em>récit</em></> : <>Story <em>blocks</em></>)}
      intro={{ fr: "Intro scindée, rangs indexés, grille de preuves et bandeau final.", en: "Intro split, indexed rows, proof grid and payoff band." }}
    />
  );
}
