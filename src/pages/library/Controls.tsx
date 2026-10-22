import ShowcasePage from "../../library/ShowcasePage";

/* Placeholder until the package ships its showcase. */
export default function Controls() {
  return (
    <ShowcasePage
      entryId="controls"
      title={(l) => (l === "fr" ? <><em>Contrôles</em></> : <><em>Controls</em></>)}
      intro={{ fr: "Boutons, puces, champs, progression segmentée et interrupteur.", en: "Buttons, chips, fields, segmented progress and switch." }}
    />
  );
}
