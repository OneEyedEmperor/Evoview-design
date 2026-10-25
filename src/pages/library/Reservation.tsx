import { useMemo } from "react";
import { Reservation, ReservationFlow } from "../../../components/reservation/src";
import { buildReservationConfig, buildReservationFlowConfig } from "../../../components/reservation/src/reservation.config";
import "../../../components/reservation/showcase.css";
import ShowcasePage, { ShowcaseVariant } from "../../library/ShowcasePage";
import { useLibraryLocale, type Localized } from "../../library/locale";

/* The reservation package on its reference configs: the full application,
   then the short flow on paper. The palette stands in for the host's
   --primary token. Submissions are mocked. */
export default function ReservationShowcase() {
  return (
    <ShowcasePage
      entryId="reservation"
      title={(l) => <em>{l === "fr" ? "Réservation" : "Reservation"}</em>}
      intro={{
        fr: "Une demande de réservation en étapes, une question à la fois, dans l'accent de chaque client. Essayez-la : rien n'est envoyé.",
        en: "A stepped booking request, one question at a time, in each client's accent. Try it: nothing is sent.",
      }}
      tone="dark"
    >
      <Variants />
    </ShowcasePage>
  );
}

const VARIANTS: Record<"full" | "flow", { name: Localized; when: Localized }> = {
  full: {
    name: { fr: "Application complète", en: "Full application" },
    when: {
      fr: "Expériences, calendrier, créneaux d'ouverture et coordonnées : pour une maison qui gère ses tables, salons et horaires.",
      en: "Experiences, calendar, opening windows and contact details: for a house that manages its tables, rooms and hours.",
    },
  },
  flow: {
    name: { fr: "Parcours court · papier", en: "Short flow · paper" },
    when: {
      fr: "Quelques questions en puces puis un e-mail, sur un site clair : pour une réservation simple, un bar, une soirée, une dégustation.",
      en: "A few chip questions then an e-mail, on a light site: for a simple booking, a bar, an evening, a tasting.",
    },
  },
};

/* Separate component so palette changes (CSS variables on the frame) never
   re-render it; only a locale change rebuilds the configs. */
function Variants() {
  const { locale, t } = useLibraryLocale();
  const config = useMemo(() => buildReservationConfig(locale), [locale]);
  const flow = useMemo(() => buildReservationFlowConfig(locale), [locale]);
  return (
    <>
      <ShowcaseVariant name={t(VARIANTS.full.name)} when={t(VARIANTS.full.when)}>
        <div className="lib-rail">
          <div className="lib-reservation">
            <Reservation key={locale} config={config} />
          </div>
        </div>
      </ShowcaseVariant>
      <ShowcaseVariant name={t(VARIANTS.flow.name)} when={t(VARIANTS.flow.when)} tone="paper" rhythm="standard">
        <div className="lib-rail rsv-stage rsv-stage--chapter">
          <ReservationFlow key={locale} config={flow} />
        </div>
      </ShowcaseVariant>
    </>
  );
}
