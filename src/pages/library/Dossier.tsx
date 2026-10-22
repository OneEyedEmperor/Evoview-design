import ShowcasePage from "../../library/ShowcasePage";

/* Placeholder until the package ships its showcase. */
export default function Dossier() {
  return (
    <ShowcasePage
      entryId="dossier"
      title={(l) => (l === "fr" ? <><em>Dossier</em></> : <><em>Dossier</em></>)}
      intro={{ fr: "Une modale portail : tableau de sélection, bande de chapitres, dock mobile.", en: "A portal modal: selection board, chapter strip, mobile dock." }}
    />
  );
}
