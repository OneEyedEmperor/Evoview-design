import { useMemo, useState } from "react";
import { ProcessSequence as Board, buildProcessSequenceConfig, processSequenceRoutes, type ProcessSequenceView } from "../../../components/process-sequence/src";
import { routeHrefs } from "../../../components/foundation/src";
import releve from "../../../components/process-sequence/examples/releve.webp";
import esquisse from "../../../components/process-sequence/examples/esquisse.webp";
import permis from "../../../components/process-sequence/examples/permis.webp";
import chantier from "../../../components/process-sequence/examples/chantier.webp";
import ShowcasePage, { useShowcaseViewOpen } from "../../library/ShowcasePage";
import { useLibraryLocale } from "../../library/locale";
import { useShowcaseSubpath } from "../../library/routing";

const MEDIA = {
  survey: { src: releve, alt: "" },
  sketch: { src: esquisse, alt: "" },
  permit: { src: permis, alt: "" },
  site: { src: chantier, alt: "" },
};

/* One client chapter (an architecture studio's method). The frame owns the
   chapter (spacing and environment), so the board mounts with
   chapter={false}. Colour comes only from the frame's --primary: a swatch
   never re-renders the board. Each step dossier has its URL
   (/layouts/process-sequence/<step>/), seeded once from the location. */
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
  const { base, path } = useShowcaseSubpath();
  const config = useMemo(() => buildProcessSequenceConfig(locale, { media: MEDIA }), [locale]);
  const hrefFor = useMemo(() => routeHrefs(base, processSequenceRoutes.key), [base]);
  const [view, setView] = useState<ProcessSequenceView | null>(() => (path ? processSequenceRoutes.parse(config, path) : null));
  useShowcaseViewOpen(view !== null);
  return <Board config={config} tone="dark" chapter={false} view={view} onNavigate={setView} hrefFor={hrefFor} />;
}
