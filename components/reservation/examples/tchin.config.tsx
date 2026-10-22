import { Mic, Soup } from "lucide-react";
import { buildReservationConfig, type Locale } from "../src/reservation.config";
import type { ReservationConfig } from "../src/types";

/* Tchin Tchin (resto-tchin, project `test`): three experiences, karaoke-only
   asks for an end time, closed Sundays, Saturday dinner only, up to 15.
   Showcase copy; the live site builds this from its i18n and posts to its
   booking API. Not installed. */

// The navbar deck marks: Carte (Soup, chili orange) and Karaoké (Mic, violet).
const dining = <Soup strokeWidth={1.6} style={{ color: "#f97316" }} />;
const karaoke = <Mic strokeWidth={1.6} style={{ color: "#c08cf0" }} />;

export function buildTchinReservationConfig(locale: Locale): ReservationConfig {
  const base = buildReservationConfig(locale);
  const isFr = locale === "fr";
  const karaokePrice = isFr ? "Karaoké : 12 € par personne, par heure" : "Karaoke: €12 per person, per hour";
  return {
    ...base,
    venue: { name: "Tchin Tchin" },
    copy: {
      ...base.copy,
      steps: {
        ...base.copy.steps,
        experience: isFr
          ? { short: "Expérience", title: "Table, micro, ou les deux ?", hint: "Choisissez votre soirée. Le propriétaire confirme ensuite." }
          : { short: "Experience", title: "Table, mic, or both?", hint: "Pick your night. The owner confirms afterwards." },
        time: isFr
          ? { short: "Horaire", title: "À quelle heure ?", hint: "Votre heure d'arrivée souhaitée." }
          : { short: "Time", title: "What time?", hint: "Your preferred arrival time." },
      },
      startTimeLabel: isFr ? "Début" : "Start",
      hoursLabel: isFr ? "Durée du karaoké" : "Karaoke duration",
      hoursUnit: isFr ? { one: "heure", many: "heures" } : { one: "hour", many: "hours" },
      confirmationMessage: isFr
        ? "Votre demande a bien été reçue. Le propriétaire vous contactera pour confirmer la disponibilité et les détails. Il ne s'agit pas encore d'une réservation confirmée."
        : "Your request has been received. The owner will contact you to confirm availability and details. This is not yet a confirmed booking.",
    },
    experiences: [
      { value: "restaurant_only", label: isFr ? "Restaurant uniquement" : "Restaurant only", desc: isFr ? "Une table pour dîner" : "A table for dinner", icon: dining },
      { value: "karaoke_only", label: isFr ? "Karaoké uniquement" : "Karaoke only", desc: isFr ? "Une salle privée pour chanter" : "A private room to sing", icon: karaoke, hours: { options: [1, 2, 3], withinWindow: true }, timeNote: karaokePrice },
      { value: "restaurant_then_karaoke", label: isFr ? "Restaurant puis karaoké" : "Restaurant then karaoke", desc: isFr ? "Dînez, puis chantez" : "Dine, then sing", icon: <>{dining}{karaoke}</>, hours: { options: [1, 2, 3] }, timeNote: karaokePrice },
    ],
    guests: { min: 1, max: 15, overflow: true },
  };
}
