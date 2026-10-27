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
type Said = { layout: CardSequenceLayout } | { tone: Tone } | { opened: string } | null;

const T = {
  fr: {
    name: "Séquence",
    when: "Quand les images bougent et qu'il faut toutes les montrer : une carte prend la main à tour de rôle, elle seule joue sa vidéo.",
    hint: "Changez un réglage : la section se recompose. Survolez une carte pour la garder.",
    layout: { label: "Place", options: { gallery: "Page", board: "Accueil" } },
    tone: { label: "Ton", options: { dark: "Nuit", paper: "Papier" } },
    say: {
      layout: {
        gallery: "Page. Tous les lieux sur une rangée ; chacun garde la main deux secondes. Le pointeur ou le clavier retient une carte, la séquence reprend là où elle était.",
        board: "Accueil. Deux lieux en vitrine, les faits à côté, puis le prix et une seule action : la section qui donne envie d'aller plus loin.",
      },
      tone: {
        dark: "Nuit. Les vidéos ressortent sur le noir ; seule la carte active porte l'accent.",
        paper: "Papier. Les cartes restent des écrans sombres posés sur le blanc : l'image garde sa force dans une page claire.",
      },
      opened: (title: string) => `Ouvert : ${title}. Sur le site, la carte mène à sa page.`,
    },
  },
  en: {
    name: "Sequence",
    when: "When the pictures move and all of them deserve a look: one card takes its turn in focus, and only it plays its video.",
    hint: "Change a setting: the section recomposes. Hover a card to keep it.",
    layout: { label: "Placement", options: { gallery: "Page", board: "Home" } },
    tone: { label: "Tone", options: { dark: "Night", paper: "Paper" } },
    say: {
      layout: {
        gallery: "Page. Every place in one row; each holds the focus for two seconds. Pointer or keyboard keeps a card, and the sequence resumes where it stood.",
        board: "Home. Two places on show, the facts beside them, then the price and a single action: the section that makes people want to go further.",
      },
      tone: {
        dark: "Night. The videos stand out on black; only the active card carries the accent.",
        paper: "Paper. The cards stay dark screens set on white: the picture keeps its strength on a light page.",
      },
      opened: (title: string) => `Opened: ${title}. On the site, the card leads to its page.`,
    },
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
  const [said, setSaid] = useState<Said>(null);

  const sentence = !said
    ? t.hint
    : "layout" in said
      ? t.say.layout[said.layout]
      : "tone" in said
        ? t.say.tone[said.tone]
        : t.say.opened(said.opened);
  const longestTitle = useMemo(
    () => [...config.sequences.home.clips, ...config.sequences.page.clips].map((clip) => clip.title).reduce((a, b) => (b.length > a.length ? b : a), ""),
    [config],
  );

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone={tone}
      rhythm="standard"
      desk={
        <SceneDesk
          say={sentence}
          sayAll={[t.hint, ...Object.values(t.say.layout), ...Object.values(t.say.tone), t.say.opened(longestTitle)]}
        >
          <DeskSetting label={t.layout.label}>
            <SegmentedControl
              block
              label={t.layout.label}
              options={deskOptions(t.layout.options)}
              value={layout}
              onChange={(v) => {
                setLayout(v as CardSequenceLayout);
                setSaid({ layout: v as CardSequenceLayout });
              }}
            />
          </DeskSetting>
          <DeskSetting label={t.tone.label}>
            <SegmentedControl
              block
              label={t.tone.label}
              options={deskOptions(t.tone.options)}
              value={tone}
              onChange={(v) => {
                setTone(v as Tone);
                setSaid({ tone: v as Tone });
              }}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <CardSequence
        key={layout}
        id="card-sequence-specimen"
        layout={layout}
        tone={tone}
        sequence={layout === "board" ? config.sequences.home : config.sequences.page}
        copy={config.copy}
        onOpen={(clip, e) => {
          e.preventDefault();
          setSaid({ opened: clip.title });
        }}
      />
    </Scene>
  );
}
