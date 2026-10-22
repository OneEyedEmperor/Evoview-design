import ShowcasePage from "../../library/ShowcasePage";

/* Placeholder until the package ships its showcase. */
export default function CardTrack() {
  return (
    <ShowcasePage
      entryId="card-track"
      title={(l) => (l === "fr" ? <>Piste de <em>cartes</em></> : <>Card <em>track</em></>)}
      intro={{ fr: "Une carte média et sa piste, pilotée par le défilement sur bureau, en accroche native sur mobile.", en: "A media card and its track, scroll-scrubbed on desktop, natively snapped on mobile." }}
    />
  );
}
