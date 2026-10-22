import ShowcasePage from "../../library/ShowcasePage";

/* Placeholder until the package ships its showcase. */
export default function Chapter() {
  return (
    <ShowcasePage
      entryId="chapter"
      title={(l) => (l === "fr" ? <><em>Chapitre</em></> : <><em>Chapter</em></>)}
      intro={{ fr: "La coque de section : titres, rythme et coupes de ton entre chapitres.", en: "The section shell: headings, rhythm and tone cuts between chapters." }}
    />
  );
}
