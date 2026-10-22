import { buildReservationConfig, type Locale } from "../src/reservation.config";
import type { ReservationConfig } from "../src/types";

/* Tchin Tchin (resto-tchin, project `test`): three experiences, karaoke-only
   asks for an end time, closed Sundays, Saturday dinner only, up to 15.
   Showcase copy; the live site builds this from its i18n and posts to its
   booking API. Not installed. */

export function buildTchinReservationConfig(locale: Locale): ReservationConfig {
  const base = buildReservationConfig(locale);
  const isFr = locale === "fr";
  const karaokePrice = isFr ? "Karaoké : 12 € par personne, par heure" : "Karaoke: €12 per person, per hour";
  return {
    ...base,
    venue: { name: "Tchin Tchin", place: "Bruxelles" },
    copy: {
      ...base.copy,
      steps: {
        ...base.copy.steps,
        experience: isFr
          ? { short: "Expérience", title: "Table, micro, ou les deux ?", hint: "Choisissez votre soirée. Le propriétaire confirme ensuite." }
          : { short: "Experience", title: "Table, mic, or both?", hint: "Pick your night. The owner confirms afterwards." },
        time: isFr
          ? { short: "Horaire", title: "À quelle heure ?", hint: "Votre heure de début souhaitée." }
          : { short: "Time", title: "What time?", hint: "Your preferred start time." },
      },
      startTimeLabel: isFr ? "Début" : "Start",
      confirmationMessage: isFr
        ? "Votre demande a bien été reçue. Le propriétaire vous contactera pour confirmer la disponibilité et les détails. Il ne s'agit pas encore d'une réservation confirmée."
        : "Your request has been received. The owner will contact you to confirm availability and details. This is not yet a confirmed booking.",
    },
    experiences: [
      { value: "restaurant_only", label: isFr ? "Restaurant uniquement" : "Restaurant only", desc: isFr ? "Une table pour dîner" : "A table for dinner" },
      { value: "karaoke_only", label: isFr ? "Karaoké uniquement" : "Karaoke only", desc: isFr ? "Une salle privée pour chanter" : "A private room to sing", requiresEndTime: true, timeNote: karaokePrice },
      { value: "restaurant_then_karaoke", label: isFr ? "Restaurant puis karaoké" : "Restaurant then karaoke", desc: isFr ? "Dînez, puis chantez" : "Dine, then sing", timeNote: karaokePrice },
    ],
    guests: { min: 1, max: 15 },
  };
}
