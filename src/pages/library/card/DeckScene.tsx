import { useMemo, useState, type ReactNode } from "react";
import { CardDeck, buildCardDeckConfig } from "../../../../components/card/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { Readout } from "../../../../components/foundation/src";
import { ShowcaseVariant } from "../../../library/ShowcasePage";
import { useLibraryLocale, type Localized } from "../../../library/locale";
import "./deck-scene.css";

/* The studio's work as a deck: a selection first, each category dealt on
   a switch. The desk sets the two client choices that change the layout
   (card anatomy, rows); the deck re-deals in place, keeping the category. */

type Anatomy = "portrait" | "ribbon";
type Rows = "two" | "one";
type Said = { anatomy: Anatomy } | { rows: Rows } | null;

const T = {
  fr: {
    when: "Quand un catalogue se range par catégories (carte, collections, réalisations) : une sélection d'abord, puis chaque catégorie distribuée comme un jeu de cartes.",
    anatomy: { label: "Cartes", options: { portrait: "Image", ribbon: "Phrase" } },
    rows: { label: "Rangées", options: { two: "Deux", one: "Une" } },
    say: {
      hint: "Changez de catégorie : la carte du centre se retourne, les autres repartent sous elle et reviennent.",
      anatomy: {
        portrait: "Image. La photo porte la carte, le titre et une ligne s'y posent.",
        ribbon: "Phrase. L'image d'abord, une phrase sous le titre : quand chaque carte doit s'expliquer.",
      },
      rows: {
        two: "Deux rangées. Six cartes ; les côtés glissent en diagonale depuis la carte centrale de l'autre rangée.",
        one: "Une rangée. Trois cartes ; les côtés sortent de sous la carte centrale.",
      },
    },
    opened: (t: string) => `Ouvert : ${t}`,
  },
  en: {
    when: "When a catalogue sorts into categories (a menu, collections, work): a selection first, then each category dealt like a hand of cards.",
    anatomy: { label: "Cards", options: { portrait: "Image", ribbon: "Sentence" } },
    rows: { label: "Rows", options: { two: "Two", one: "One" } },
    say: {
      hint: "Switch category: the centre card turns over, the others slide back under it and deal out again.",
      anatomy: {
        portrait: "Image. The photograph carries the card; the title and one line sit on it.",
        ribbon: "Sentence. Image first, a sentence under the title: when each card has to explain itself.",
      },
      rows: {
        two: "Two rows. Six cards; the sides slide diagonally from under the other row's centre card.",
        one: "One row. Three cards; the sides slide out from under the centre card.",
      },
    },
    opened: (t: string) => `Opened: ${t}`,
  },
} satisfies Localized<unknown>;

const options = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

export default function DeckScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildCardDeckConfig(locale), [locale]);
  const [anatomy, setAnatomy] = useState<Anatomy>("portrait");
  const [rows, setRows] = useState<Rows>("two");
  const [said, setSaid] = useState<Said>(null);
  const [opened, setOpened] = useState("");

  const sentence = !said ? t.say.hint : "anatomy" in said ? t.say.anatomy[said.anatomy] : t.say.rows[said.rows];

  return (
    <ShowcaseVariant name="CardDeck" when={t.when} tone="dark" rhythm="standard">
      <CardDeck
        id="card-deck"
        deck={config.deck}
        copy={config.copy}
        variant={anatomy}
        rows={rows === "two" ? 2 : 1}
        tone="dark"
        onOpen={(item) => setOpened(t.opened(item.title))}
        onMore={(e) => {
          e.preventDefault();
          setOpened(t.opened(config.deck.more?.label ?? ""));
        }}
        heading={
          <div className="cdk-desk ev-rail ev-rail--wide">
            <div className="cdk-desk__controls">
              <Setting label={t.anatomy.label}>
                <SegmentedControl
                  block
                  label={t.anatomy.label}
                  options={options(t.anatomy.options)}
                  value={anatomy}
                  onChange={(v) => {
                    setAnatomy(v as Anatomy);
                    setSaid({ anatomy: v as Anatomy });
                  }}
                />
              </Setting>
              <Setting label={t.rows.label}>
                <SegmentedControl
                  block
                  label={t.rows.label}
                  options={options(t.rows.options)}
                  value={rows}
                  onChange={(v) => {
                    setRows(v as Rows);
                    setSaid({ rows: v as Rows });
                  }}
                />
              </Setting>
            </div>
            <div className="cdk-desk__notes">
              <p className="ev-t-body cdk-desk__say" aria-live="polite">
                {sentence}
              </p>
              <Readout as="p" className="cdk-desk__opened" aria-live="polite">
                {opened}
              </Readout>
            </div>
          </div>
        }
      />
    </ShowcaseVariant>
  );
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="cdk-setting">
      <Readout className="cdk-setting__label" aria-hidden="true">
        {label}
      </Readout>
      {children}
    </div>
  );
}
