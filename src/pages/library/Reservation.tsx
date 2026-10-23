import { useMemo } from "react";
import { Reservation } from "../../../components/reservation/src";
import { buildReservationConfig } from "../../../components/reservation/src/reservation.config";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale } from "../../library/locale";

/* The reservation package on its reference config; the palette stands in
   for the host's --primary token. Submissions are mocked. */
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
      <Stage />
    </ShowcasePage>
  );
}

/* Separate component so palette changes (CSS variables on the frame) never
   re-render it; only a locale change rebuilds the config. */
function Stage() {
  const { locale } = useLibraryLocale();
  const config = useMemo(() => buildReservationConfig(locale), [locale]);
  return (
    <div className="lib-rail">
      <div className="lib-reservation">
        <Reservation key={locale} config={config} />
      </div>
    </div>
  );
}
