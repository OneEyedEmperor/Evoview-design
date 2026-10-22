import ShowcasePage from "../../library/ShowcasePage";

/* Placeholder until the package ships its showcase. */
export default function SelectorStage() {
  return (
    <ShowcasePage
      entryId="selector-stage"
      title={(l) => (l === "fr" ? <>Sélecteur et <em>scène</em></> : <>Selector <em>stage</em></>)}
      intro={{ fr: "Un sélecteur qui pilote une scène, avec comparaison avant/après.", en: "A selector driving a stage, with a before/after compare." }}
    />
  );
}
