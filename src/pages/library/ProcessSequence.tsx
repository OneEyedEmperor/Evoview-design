import { useMemo } from "react";
import { ProcessSequence as Board, buildProcessSequenceConfig, type ProcessSequenceConfig } from "../../../components/process-sequence/src";
import { Index, Readout } from "../../../components/foundation/src";
import releve from "../../../components/process-sequence/examples/releve.webp";
import esquisse from "../../../components/process-sequence/examples/esquisse.webp";
import permis from "../../../components/process-sequence/examples/permis.webp";
import chantier from "../../../components/process-sequence/examples/chantier.webp";
import "../../../components/process-sequence/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../library/locale";

const MEDIA = {
  survey: { src: releve, alt: "" },
  sketch: { src: esquisse, alt: "" },
  permit: { src: permis, alt: "" },
  site: { src: chantier, alt: "" },
};

/* Two chapters of one plausible client (an architecture studio): the full
   board with its dossier on dark, then a lighter three-step variant on paper.
   Colour comes only from the frame's --primary: a swatch never re-renders. */
export default function ProcessSequence() {
  return (
    <ShowcasePage
      entryId="process-sequence"
      title={(l) => (l === "fr" ? <>Séquence de <em>processus</em></> : <>Process <em>sequence</em></>)}
      intro={{
        fr: "Un tableau d'étapes minuté qui montre une méthode en la jouant, et n'avance que lorsqu'il est visible.",
        en: "A timed step board that shows a method by playing it, and only advances while it is on screen.",
      }}
      tone="dark"
      defaultAccent="#c8a46e"
    >
      <Demo />
    </ShowcasePage>
  );
}

const NOTES: Record<Locale, { title: string; note: string; tags: string[] }[]> = {
  fr: [
    {
      title: "Chapitre sombre",
      note: "Quatre étapes, 4 / 4 / 4 / 6 s. Une seule étape active, inversée en papier ; les étapes terminées gardent leur image et la marque du client. Cliquez une carte pour ouvrir le dossier.",
      tags: ["Dossier", "Icônes client", "Survol inclinable"],
    },
    {
      title: "Chapitre clair",
      note: "Trois étapes, sans dossier : un tableau passif. Sur papier, l'inversion devient un bandeau encre et les étapes terminées portent leur numéro.",
      tags: ["Sans dossier", "Numéros", "3 étapes"],
    },
  ],
  en: [
    {
      title: "Dark chapter",
      note: "Four steps, 4 / 4 / 4 / 6 s. One active step, inverted on paper; completed steps keep their picture and the client's mark. Click a card to open the dossier.",
      tags: ["Dossier", "Client icons", "Tilt on hover"],
    },
    {
      title: "Light chapter",
      note: "Three steps, no dossier: a passive board. On paper the inversion becomes an ink band and completed steps carry their numeral.",
      tags: ["No dossier", "Numerals", "3 steps"],
    },
  ],
};

function Demo() {
  const { locale } = useLibraryLocale();
  const full = useMemo(() => buildProcessSequenceConfig(locale, { media: MEDIA }), [locale]);
  const light = useMemo<ProcessSequenceConfig>(() => {
    const base = buildProcessSequenceConfig(locale, { media: MEDIA, steps: ["survey", "sketch", "site"] });
    return {
      ...base,
      completionMark: "numeral",
      durations: [3500, 3500, 5000],
      copy: {
        ...base.copy,
        kicker: locale === "fr" ? "Rénovation légère" : "Light renovation",
        title: locale === "fr" ? "Trois étapes suffisent" : "Three steps are enough",
      },
    };
  }, [locale]);
  const notes = NOTES[locale];

  return (
    <div className="ps-show">
      <Strip n={1} {...notes[0]} />
      <Board config={full} tone="dark" />
      <Strip n={2} {...notes[1]} />
      <Board config={light} tone="light" dossier={false} />
    </div>
  );
}

function Strip({ n, title, note, tags }: { n: number; title: string; note: string; tags: string[] }) {
  return (
    <div className="ps-show__strip ev-rail ev-rail--wide">
      <div className="ps-show__id">
        <Index current={n} total={2} size="lg" />
        <h2 className="ev-t-card">{title}</h2>
      </div>
      <div className="ps-show__note">
        <p className="ev-t-body">{note}</p>
        <ul>
          {tags.map((t) => (
            <li key={t}>
              <Readout>{t}</Readout>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
