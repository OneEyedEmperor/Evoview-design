import { useMemo, useState } from "react";
import { CardSequence, buildCardSequenceConfig, type CardSequenceLayout } from "../../../../components/card/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk, deskOptions } from "../scene/Scene";

/* CardSequence specimen: the studio's clips under a timed focus. Two real
   choices — where the section sits (home board / page gallery) and the
   environment tone — each recomposing the section. The whole scene takes
   the chosen tone, so the cut stays between scenes. Colour comes from the
   frame's --primary only. */

type Tone = "dark" | "paper";

const T = {
  fr: {
    name: "Séquence",
    when: "Quand les images bougent et qu'il faut toutes les montrer : une carte prend la main à tour de rôle, elle seule joue sa vidéo.",
    layout: { label: "Place", options: { gallery: "Page", board: "Accueil" } },
    tone: { label: "Ton", options: { dark: "Nuit", paper: "Papier" } },
  },
  en: {
    name: "Sequence",
    when: "When the pictures move and all of them deserve a look: one card takes its turn in focus, and only it plays its video.",
    layout: { label: "Placement", options: { gallery: "Page", board: "Home" } },
    tone: { label: "Tone", options: { dark: "Night", paper: "Paper" } },
  },
};

export default function SequenceScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildCardSequenceConfig(locale), [locale]);
  const [layout, setLayout] = useState<CardSequenceLayout>("gallery");
  /* Paper by default: a hard cut under the deck's dark, a clean end on the
     library footer, and the receded cards read as dark screens on white. */
  const [tone, setTone] = useState<Tone>("paper");

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone={tone}
      rhythm="standard"
      desk={
        <SceneDesk>
          <DeskSetting label={t.layout.label}>
            <SegmentedControl
              block
              label={t.layout.label}
              options={deskOptions(t.layout.options)}
              value={layout}
              onChange={(v) => setLayout(v as CardSequenceLayout)}
            />
          </DeskSetting>
          <DeskSetting label={t.tone.label}>
            <SegmentedControl
              block
              label={t.tone.label}
              options={deskOptions(t.tone.options)}
              value={tone}
              onChange={(v) => setTone(v as Tone)}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      {/* Demo destinations are fictional: a card click keeps the page. */}
      <CardSequence
        key={layout}
        id="card-sequence-specimen"
        layout={layout}
        tone={tone}
        headingLevel={3}
        sequence={layout === "board" ? config.sequences.home : config.sequences.page}
        copy={config.copy}
        onOpen={(_clip, e) => e.preventDefault()}
      />
    </Scene>
  );
}
