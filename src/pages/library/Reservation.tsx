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
      title={() => (
        <>
          Evoview <em>Reservation</em> System
        </>
      )}
      intro={{
        fr: "Une demande de réservation en étapes, au rythme de la candidature evoview.be, dans l'accent de chaque client.",
        en: "A stepped booking request on the evoview.be application chassis, in each client's accent.",
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
      <div style={{ maxWidth: "56rem", marginInline: "auto", fontFamily: "Inter, sans-serif" }}>
        <Reservation key={locale} config={config} />
      </div>
    </div>
  );
}
