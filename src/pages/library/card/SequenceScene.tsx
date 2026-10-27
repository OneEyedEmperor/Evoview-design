import { useMemo, useState, type ReactNode } from "react";
import { CardSequence, buildCardSequenceConfig, type CardSequenceLayout } from "../../../../components/card/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { Readout } from "../../../../components/foundation/src";
import { ShowcaseVariant } from "../../../library/ShowcasePage";
import { useLibraryLocale } from "../../../library/locale";
import "./sequence-scene.css";

/* CardSequence specimen: the studio's clips under a timed focus. Two real
   choices — where the section sits (home board / page gallery) and the
   environment tone — each recomposing the section. Colour comes from the
   frame's --primary only. */

type Tone = "dark" | "paper";
type Said = { layout: CardSequenceLayout } | { tone: Tone } | { opened: string } | null;

const T = {
  fr: {
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

const options = <K extends string>(labels: Record<K, string>) => (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

export default function SequenceScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildCardSequenceConfig(locale), [locale]);
  const [layout, setLayout] = useState<CardSequenceLayout>("gallery");
  const [tone, setTone] = useState<Tone>("dark");
  const [said, setSaid] = useState<Said>(null);

  const sentence = !said
    ? t.hint
    : "layout" in said
      ? t.say.layout[said.layout]
      : "tone" in said
        ? t.say.tone[said.tone]
        : t.say.opened(said.opened);

  return (
    <ShowcaseVariant name="CardSequence" when={t.when}>
      <div className="csqs">
        <div className="lib-rail">
          <div className="ev-root ev-tone-dark csqs-desk">
            <Setting label={t.layout.label}>
              <SegmentedControl
                block
                label={t.layout.label}
                options={options(t.layout.options)}
                value={layout}
                onChange={(v) => {
                  setLayout(v as CardSequenceLayout);
                  setSaid({ layout: v as CardSequenceLayout });
                }}
              />
            </Setting>
            <Setting label={t.tone.label}>
              <SegmentedControl
                block
                label={t.tone.label}
                options={options(t.tone.options)}
                value={tone}
                onChange={(v) => {
                  setTone(v as Tone);
                  setSaid({ tone: v as Tone });
                }}
              />
            </Setting>
            <p className="ev-t-body csqs-desk__say" aria-live="polite">
              {sentence}
            </p>
          </div>
        </div>

        <CardSequence
          key={layout}
          id="card-sequence-specimen"
          className="csqs-live"
          layout={layout}
          tone={tone}
          sequence={layout === "board" ? config.sequences.home : config.sequences.page}
          copy={config.copy}
          onOpen={(clip, e) => {
            e.preventDefault();
            setSaid({ opened: clip.title });
          }}
        />
      </div>
    </ShowcaseVariant>
  );
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="csqs-setting">
      <Readout className="csqs-setting__label" aria-hidden="true">
        {label}
      </Readout>
      {children}
    </div>
  );
}
