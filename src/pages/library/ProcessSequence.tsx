import ShowcasePage from "../../library/ShowcasePage";

/* Placeholder until the package ships its showcase. */
export default function ProcessSequence() {
  return (
    <ShowcasePage
      entryId="process-sequence"
      title={(l) => (l === "fr" ? <>Séquence de <em>processus</em></> : <>Process <em>sequence</em></>)}
      intro={{ fr: "Un tableau d'étapes minuté qui n'avance que lorsqu'il est visible.", en: "A timed step board that only advances while it is on screen." }}
    />
  );
}
