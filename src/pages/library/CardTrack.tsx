import { useMemo, useState } from "react";
import { CardTrack, buildCardTrackConfig, type CardTrackDefinition, type CardTrackItem } from "../../../components/card-track/src";
import { Readout } from "../../../components/foundation/src";
import "../../../components/card-track/showcase.css";
import ShowcasePage, { ShowcaseVariant } from "../../library/ShowcasePage";
import { useLibraryLocale, type Localized } from "../../library/locale";

/* One studio, the two card variants a client chooses between: the portfolio
   as portrait cards (dark, continuing the header) and the services as
   ribbon cards (light). The frame owns every space between header, captions
   and tracks. Colour comes only from the frame's --primary, so a swatch
   never re-renders the tracks. */
export default function CardTrackPage() {
  return (
    <ShowcasePage
      entryId="card-track"
      title={(l) => (l === "fr" ? <>Piste de <em>cartes</em></> : <>Card <em>track</em></>)}
      intro={{
        fr: "Des cartes média parcourues une à une : sur ordinateur, le défilement de la page fait avancer la piste ; sur mobile, on la balaie.",
        en: "Media cards browsed one at a time: on desktop the page scroll drives the track; on phones you swipe it.",
      }}
      tone="dark"
      defaultAccent="#c8693c"
    >
      <Demo />
    </ShowcasePage>
  );
}

type Chapter = {
  key: "portfolio" | "services";
  name: string;
  tone: "light" | "dark";
  rhythm: "standard" | "compact";
  when: Localized;
};

const CHAPTERS: Chapter[] = [
  {
    key: "portfolio",
    name: "CardTrack · portrait",
    tone: "dark",
    rhythm: "compact",
    when: {
      fr: "Quand l'image est l'argument (projets, lieux, plats) : une carte au premier plan, les autres en retrait, et elle seule lit sa vidéo.",
      en: "When the image is the argument (projects, places, dishes): one card in focus, the others step back, and only it plays its video.",
    },
  },
  {
    key: "services",
    name: "CardTrack · ribbon",
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

function Demo() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => buildCardTrackConfig(locale), [locale]);
  const [opened, setOpened] = useState<Partial<Record<Chapter["key"], string>>>({});

  return (
    <>
      {CHAPTERS.map((chapter) => {
        const title = opened[chapter.key];
        return (
          <ShowcaseVariant key={chapter.key} name={chapter.name} when={chapter.when[locale]} tone={chapter.tone} rhythm={chapter.rhythm}>
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
          </ShowcaseVariant>
        );
      })}
    </>
  );
}
