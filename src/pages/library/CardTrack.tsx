import { useMemo, useState } from "react";
import { CardTrack, buildCardTrackConfig, type CardTrackDefinition, type CardTrackItem } from "../../../components/card-track/src";
import { Readout, SectionMarker, pad } from "../../../components/foundation/src";
import "../../../components/card-track/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";

/* Three chapters of one fictional studio: services (light, ribbon cards),
   portfolio (dark, portrait cards), visits (dark continuation, dark ribbons,
   two cards: static where they fit). Colour comes only from the frame's
   --primary, so a swatch never re-renders the tracks. */
export default function CardTrackPage() {
  return (
    <ShowcasePage
      entryId="card-track"
      title={(l) => (l === "fr" ? <>Piste de <em>cartes</em></> : <>Card <em>track</em></>)}
      intro={{
        fr: "Une carte média et sa piste, pilotée par le défilement sur bureau, en accroche native sur mobile.",
        en: "A media card and its track, scroll-scrubbed on desktop, natively snapped on mobile.",
      }}
      tone="dark"
      defaultAccent="#c8693c"
    >
      <Demo />
    </ShowcasePage>
  );
}

type Chapter = {
  key: "services" | "portfolio" | "visits";
  tone: "light" | "dark";
  rhythm: "standard" | "compact" | "cinematic";
  kicker: Localized;
  title: Localized;
  note: Localized;
  spec: Localized;
};

const CHAPTERS: Chapter[] = [
  {
    key: "services",
    tone: "light",
    rhythm: "standard",
    kicker: { fr: "Services", en: "Services" },
    title: { fr: "Ce que fait l'atelier", en: "What the studio does" },
    note: {
      fr: "Quatre métiers, une carte chacun : l'image d'abord, le ruban explique. Le défilement vertical fait avancer la piste.",
      en: "Four crafts, one card each: the image first, the ribbon explains. Vertical scroll drives the track.",
    },
    spec: { fr: "Ruban clair · onglet · aperçu vidéo au survol", en: "Light ribbon · tab · hover video preview" },
  },
  {
    key: "portfolio",
    tone: "dark",
    rhythm: "cinematic",
    kicker: { fr: "Réalisations", en: "Portfolio" },
    title: { fr: "Projets livrés", en: "Delivered projects" },
    note: {
      fr: "Une carte au premier plan, les autres en retrait. La vidéo ne joue que sur la carte active, à l'écran.",
      en: "One card in focus, the others step back. Video plays only on the active card, on screen.",
    },
    spec: { fr: "Portrait .90 · voile bas · index 01 / 05", en: "Portrait .90 · bottom scrim · index 01 / 05" },
  },
  {
    key: "visits",
    tone: "dark",
    rhythm: "compact",
    kicker: { fr: "Visites", en: "Visits" },
    title: { fr: "Venir voir", en: "Come and see" },
    note: {
      fr: "Deux cartes : quand tout tient sur le rail, la piste reste immobile ; sinon elle défile.",
      en: "Two cards: when everything fits on the rail, the track stays still; otherwise it scrubs.",
    },
    spec: { fr: "Ruban sombre · repli statique", en: "Dark ribbon · static fallback" },
  },
];

const OPENED: Localized<(title: string) => string> = {
  fr: (t) => `onOpen → ${t}`,
  en: (t) => `onOpen → ${t}`,
};
const IDLE: Localized = { fr: "Ouvrez une carte : la piste rend la main à l'hôte", en: "Open a card: the track hands over to the host" };

function Demo() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => buildCardTrackConfig(locale), [locale]);
  const [opened, setOpened] = useState<Partial<Record<Chapter["key"], string>>>({});

  return (
    <div className="ctp">
      {CHAPTERS.map((chapter, i) => (
        <CardTrack
          key={chapter.key}
          id={`card-track-${chapter.key}`}
          tone={chapter.tone}
          rhythm={chapter.rhythm}
          track={config.tracks[chapter.key] as CardTrackDefinition}
          copy={config.copy}
          onOpen={(item: CardTrackItem) => setOpened((o) => ({ ...o, [chapter.key]: item.title }))}
          heading={<ChapterHeading chapter={chapter} n={i + 1} total={CHAPTERS.length} locale={locale} opened={opened[chapter.key]} />}
        />
      ))}
    </div>
  );
}

function ChapterHeading({ chapter, n, total, locale, opened }: { chapter: Chapter; n: number; total: number; locale: Locale; opened?: string }) {
  const id = `ctp-${chapter.key}`;
  return (
    <header className="ctp-head ev-rail ev-rail--wide" aria-labelledby={id}>
      <div className="ctp-head__title">
        <p className="ctp-head__kicker">
          <SectionMarker />
          <Readout>
            {pad(n)} / {pad(total)} · {chapter.kicker[locale]}
          </Readout>
        </p>
        <h2 id={id} className="ev-t-section-feature">
          {chapter.title[locale]}
        </h2>
      </div>
      <div className="ctp-head__aside">
        <p className="ctp-head__note">{chapter.note[locale]}</p>
        <p className="ctp-head__meta">
          <Readout className="ctp-head__spec">{chapter.spec[locale]}</Readout>
          <Readout className="ctp-head__opened" aria-live="polite" data-opened={opened ? true : undefined}>
            {opened ? OPENED[locale](opened) : IDLE[locale]}
          </Readout>
        </p>
      </div>
    </header>
  );
}
