import { useMemo } from "react";
import { ProcessSequence as Board, buildProcessSequenceConfig } from "../../../components/process-sequence/src";
import releve from "../../../components/process-sequence/examples/releve.webp";
import esquisse from "../../../components/process-sequence/examples/esquisse.webp";
import permis from "../../../components/process-sequence/examples/permis.webp";
import chantier from "../../../components/process-sequence/examples/chantier.webp";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale } from "../../library/locale";

const MEDIA = {
  survey: { src: releve, alt: "" },
  sketch: { src: esquisse, alt: "" },
  permit: { src: permis, alt: "" },
  site: { src: chantier, alt: "" },
};

/* One client chapter (an architecture studio's method). The frame owns the
   chapter (spacing and environment), so the board mounts with
   chapter={false}. Colour comes only from the frame's --primary: a swatch
   never re-renders the board. */
export default function ProcessSequence() {
  return (
    <ShowcasePage
      entryId="process-sequence"
      title={(l) => (l === "fr" ? <>Séquence de <em>processus</em></> : <>Process <em>sequence</em></>)}
      intro={{
        fr: "La méthode d'un client, jouée étape par étape : une seule étape vit à la fois, les étapes faites gardent leur image et leur marque. Cliquez une carte pour ouvrir son dossier.",
        en: "A client's method, played step by step: one step is live at a time, finished steps keep their picture and their mark. Click a card to open its dossier.",
      }}
      tone="dark"
      defaultAccent="#c8a46e"
    >
      <Demo />
    </ShowcasePage>
  );
}

function Demo() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => buildProcessSequenceConfig(locale, { media: MEDIA }), [locale]);
  return <Board config={config} tone="dark" chapter={false} />;
}
