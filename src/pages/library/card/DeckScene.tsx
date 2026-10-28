import { useMemo, useState } from "react";
import { CARD_DECK_ROWS, CardDeck, buildCardDeckConfig, type CardDeckRows, type CardTrackVariant } from "../../../../components/card/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Localized } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk, deskOptions } from "../scene/Scene";

/* The studio's work as a deck: a selection first, each category dealt on
   a switch. The desk sets the two client choices that change the layout
   (card anatomy, rows); the deck re-deals in place, keeping the category. */

const T = {
  fr: {
    name: "Donne",
    when: "Quand un catalogue se range par catégories (carte, collections, réalisations) : une sélection d'abord, puis chaque catégorie distribuée comme un jeu de cartes.",
    anatomy: { label: "Cartes", options: { portrait: "Image", ribbon: "Phrase" } satisfies Record<CardTrackVariant, string> },
    rows: { label: "Rangées", options: { 2: "Deux", 1: "Une" } satisfies Record<CardDeckRows, string> },
  },
  en: {
    name: "Deal",
    when: "When a catalogue sorts into categories (a menu, collections, work): a selection first, then each category dealt like a hand of cards.",
    anatomy: { label: "Cards", options: { portrait: "Image", ribbon: "Sentence" } satisfies Record<CardTrackVariant, string> },
    rows: { label: "Rows", options: { 2: "Two", 1: "One" } satisfies Record<CardDeckRows, string> },
  },
} satisfies Localized<unknown>;

/* Cards are only buttons, with their open affordance, when the deck gets
   an `onOpen`: the demo keeps that anatomy, its destinations are fictional. */
const keepPage = () => {};

export default function DeckScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildCardDeckConfig(locale), [locale]);
  const [anatomy, setAnatomy] = useState<CardTrackVariant>("portrait");
  const [rows, setRows] = useState<CardDeckRows>(2);

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
              onChange={(v) => setAnatomy(v as CardTrackVariant)}
            />
          </DeskSetting>
          <DeskSetting label={t.rows.label}>
            <SegmentedControl
              block
              label={t.rows.label}
              options={CARD_DECK_ROWS.map((n) => ({ value: String(n), label: t.rows.options[n] }))}
              value={String(rows)}
              onChange={(v) => setRows(Number(v) as CardDeckRows)}
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
        rows={rows}
        tone="dark"
        onOpen={keepPage}
        onMore={(e) => e.preventDefault()}
      />
    </Scene>
  );
}
