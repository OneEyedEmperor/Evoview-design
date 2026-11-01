import { useMemo, useState } from "react";
import { CardTrack, buildCardTrackConfig, type CardTrackDefinition, type CardTrackItem } from "../../../components/card/src";
import { Readout } from "../../../components/foundation/src";
import "../../../components/card/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Localized } from "../../library/locale";
import DeckScene from "./card/DeckScene";
import SequenceScene from "./card/SequenceScene";
import { Scene } from "./scene/Scene";

/* One studio, its cards: the portfolio as portrait cards (dark, continuing
   the header), the services as ribbon cards (light), then the scenes in
   ./card/*. Each is a scene (./scene/Scene): caption → (desk) → component
   on the component's ground. Colour comes only from the frame's --primary,
   so a swatch never re-renders the cards. */
export default function CardPage() {
  return (
    <ShowcasePage
      entryId="card"
      title={(l) => (l === "fr" ? <em>Carte</em> : <em>Card</em>)}
      tone="dark"
      defaultAccent="#c8693c"
    >
      <Demo />
      <DeckScene />
      <SequenceScene />
    </ShowcasePage>
  );
}

type Chapter = {
  key: "portfolio" | "services";
  name: Localized;
  tone: "light" | "dark";
  rhythm: "standard" | "compact";
  when: Localized;
};

const CHAPTERS: Chapter[] = [
  {
    key: "portfolio",
    name: { fr: "Piste · portraits", en: "Track · portraits" },
    tone: "dark",
    rhythm: "compact",
    when: {
      fr: "Quand l'image est l'argument (projets, lieux, plats) : une carte au premier plan, les autres en retrait, et elle seule lit sa vidéo.",
      en: "When the image is the argument (projects, places, dishes): one card in focus, the others step back, and only it plays its video.",
    },
  },
  {
    key: "services",
    name: { fr: "Piste · rubans", en: "Track · ribbons" },
    tone: "light",
    rhythm: "standard",
    when: {
      fr: "Quand chaque carte a besoin d'une phrase (services, offres) : l'image d'abord, le texte dessous, toutes à la même hauteur.",
      en: "When each card needs a sentence (services, offers): image first, copy below, all the same height.",
    },
  },
];

const OPENED: Localized<(title: string) => string> = {
  fr: (t) => `Ouvert : ${t}`,
  en: (t) => `Opened: ${t}`,
};

/* Fictional destinations: the portfolio's cards are links (a plain click
   still opens in place), the services' stay buttons. */
const withDemoHrefs = (items: CardTrackItem[]): CardTrackItem[] => items.map((item) => ({ ...item, href: `#${item.id}` }));

function Demo() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => {
    const built = buildCardTrackConfig(locale);
    const portfolio = built.tracks.portfolio as CardTrackDefinition;
    const tracks: Record<string, CardTrackDefinition> = { ...built.tracks, portfolio: { ...portfolio, items: withDemoHrefs(portfolio.items) } };
    return { ...built, tracks };
  }, [locale]);
  const [opened, setOpened] = useState<Partial<Record<Chapter["key"], string>>>({});

  return (
    <>
      {CHAPTERS.map((chapter) => {
        const title = opened[chapter.key];
        return (
          <Scene key={chapter.key} name={chapter.name[locale]} when={chapter.when[locale]} tone={chapter.tone} rhythm={chapter.rhythm}>
            <CardTrack
              id={`card-track-${chapter.key}`}
              tone={chapter.tone}
              rhythm={chapter.rhythm}
              track={config.tracks[chapter.key] as CardTrackDefinition}
              copy={config.copy}
              onOpen={(item: CardTrackItem) => setOpened((o) => ({ ...o, [chapter.key]: item.title }))}
              heading={
                <Readout as="p" className="ctp-opened ev-rail ev-rail--wide" aria-live="polite">
                  {title ? OPENED[locale](title) : ""}
                </Readout>
              }
            />
          </Scene>
        );
      })}
    </>
  );
}
