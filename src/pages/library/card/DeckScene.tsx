import { useMemo, useState } from "react";
import { CardDeck, buildCardDeckConfig } from "../../../../components/card/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Localized } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk, deskOptions } from "../scene/Scene";

/* The studio's work as a deck: a selection first, each category dealt on
   a switch. The desk sets the two client choices that change the layout
   (card anatomy, rows); the deck re-deals in place, keeping the category. */

type Anatomy = "portrait" | "ribbon";
type Rows = "two" | "one";

const T = {
  fr: {
    name: "Donne",
    when: "Quand un catalogue se range par catégories (carte, collections, réalisations) : une sélection d'abord, puis chaque catégorie distribuée comme un jeu de cartes.",
    anatomy: { label: "Cartes", options: { portrait: "Image", ribbon: "Phrase" } },
    rows: { label: "Rangées", options: { two: "Deux", one: "Une" } },
  },
  en: {
    name: "Deal",
    when: "When a catalogue sorts into categories (a menu, collections, work): a selection first, then each category dealt like a hand of cards.",
    anatomy: { label: "Cards", options: { portrait: "Image", ribbon: "Sentence" } },
    rows: { label: "Rows", options: { two: "Two", one: "One" } },
  },
} satisfies Localized<unknown>;

/* The cards are links (fictional destinations) with an `onOpen`: a plain
   click keeps the page, a modified click follows the link. */
const keepPage = () => {};

export default function DeckScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => {
    const built = buildCardDeckConfig(locale);
    const categories = built.deck.categories.map((c) => ({ ...c, items: c.items.map((item) => ({ ...item, href: `#${item.id}` })) }));
    return { ...built, deck: { ...built.deck, categories } };
  }, [locale]);
  const [anatomy, setAnatomy] = useState<Anatomy>("portrait");
  const [rows, setRows] = useState<Rows>("two");

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="dark"
      rhythm="standard"
      desk={
        <SceneDesk>
          <DeskSetting label={t.anatomy.label}>
            <SegmentedControl
              block
              label={t.anatomy.label}
              options={deskOptions(t.anatomy.options)}
              value={anatomy}
              onChange={(v) => setAnatomy(v as Anatomy)}
            />
          </DeskSetting>
          <DeskSetting label={t.rows.label}>
            <SegmentedControl
              block
              label={t.rows.label}
              options={deskOptions(t.rows.options)}
              value={rows}
              onChange={(v) => setRows(v as Rows)}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <CardDeck
        id="card-deck"
        deck={config.deck}
        copy={config.copy}
        variant={anatomy}
        rows={rows === "two" ? 2 : 1}
        tone="dark"
        onOpen={keepPage}
        onMore={(e) => e.preventDefault()}
      />
    </Scene>
  );
}
