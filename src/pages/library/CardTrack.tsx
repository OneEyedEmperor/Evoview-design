import { useMemo, useState } from "react";
import { CardTrack, buildCardTrackConfig, type CardTrackDefinition, type CardTrackItem } from "../../../components/card-track/src";
import { Readout, SectionMarker } from "../../../components/foundation/src";
import "../../../components/card-track/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";

/* One studio, the two card variants a client chooses between: services on a
   light chapter (ribbon cards) and the portfolio on a dark one (portrait
   cards). Colour comes only from the frame's --primary, so a swatch never
   re-renders the tracks. */
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
  key: "services" | "portfolio";
  tone: "light" | "dark";
  rhythm: "standard" | "cinematic";
  kicker: Localized;
  title: Localized;
  note: Localized;
};

const CHAPTERS: Chapter[] = [
  {
    key: "services",
    tone: "light",
    rhythm: "standard",
    kicker: { fr: "Services", en: "Services" },
    title: { fr: "Ce que fait l'atelier", en: "What the studio does" },
    note: {
      fr: "Cartes à ruban : l'image d'abord, le texte dessous, toutes à la même hauteur. Faites défiler, la page fait avancer la piste.",
      en: "Ribbon cards: image first, copy below, all the same height. Scroll, and the page drives the track.",
    },
  },
  {
    key: "portfolio",
    tone: "dark",
    rhythm: "cinematic",
    kicker: { fr: "Réalisations", en: "Portfolio" },
    title: { fr: "Projets livrés", en: "Delivered projects" },
    note: {
      fr: "Cartes portrait : une seule au premier plan, les autres en retrait. Elle seule lit sa vidéo.",
      en: "Portrait cards: one in focus, the others step back. Only that one plays its video.",
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
    <div className="ctp">
      {CHAPTERS.map((chapter) => (
        <CardTrack
          key={chapter.key}
          id={`card-track-${chapter.key}`}
          tone={chapter.tone}
          rhythm={chapter.rhythm}
          track={config.tracks[chapter.key] as CardTrackDefinition}
          copy={config.copy}
          onOpen={(item: CardTrackItem) => setOpened((o) => ({ ...o, [chapter.key]: item.title }))}
          heading={<ChapterHeading chapter={chapter} locale={locale} opened={opened[chapter.key]} />}
        />
      ))}
    </div>
  );
}

function ChapterHeading({ chapter, locale, opened }: { chapter: Chapter; locale: Locale; opened?: string }) {
  const id = `ctp-${chapter.key}`;
  return (
    <header className="ctp-head ev-rail ev-rail--wide" aria-labelledby={id}>
      <div className="ctp-head__title">
        <p className="ctp-head__kicker">
          <SectionMarker />
          <Readout>{chapter.kicker[locale]}</Readout>
        </p>
        <h2 id={id} className="ev-t-section-feature">
          {chapter.title[locale]}
        </h2>
      </div>
      <div className="ctp-head__aside">
        <p className="ctp-head__note">{chapter.note[locale]}</p>
        <Readout as="p" className="ctp-head__opened" aria-live="polite">
          {opened ? OPENED[locale](opened) : ""}
        </Readout>
      </div>
    </header>
  );
}
