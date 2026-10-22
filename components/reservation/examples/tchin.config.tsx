import { isSaturday, isSunday } from "date-fns";
import { fr } from "date-fns/locale";
import { Mic, Sparkles, UtensilsCrossed } from "lucide-react";
import type { ReservationConfig, ReservationCopy } from "../src/types";

/* Tchin Tchin (resto-tchin, project `test`) as shipped: gold accent, three
   experiences, karaoke-only asks for an end time, closed Sundays, Saturday
   dinner only. Showcase copy; the live site builds this from its i18n and
   posts to its booking API. Not installed. */

type Locale = "fr" | "en";

const COPY: Record<Locale, ReservationCopy> = {
  fr: {
    experienceLabel: "Expérience",
    dateLabel: "Date souhaitée",
    closedNote: "Fermé le dimanche",
    guestsLabel: "Personnes",
    timeLabel: "Horaire souhaité",
    startTimeLabel: "Heure de début souhaitée",
    endTimeLabel: "Heure de fin souhaitée",
    contactLabel: "Vos coordonnées",
    nameLabel: "Nom complet",
    phoneLabel: "Téléphone",
    emailLabel: "Email",
    notesLabel: "Informations complémentaires",
    notesOptional: "facultatif",
    notesPlaceholder: "Anniversaire, demande spéciale...",
    submit: "Envoyer la demande",
    submitting: "Envoi...",
    confirmationTitle: "Demande Envoyée !",
    confirmationMessage: "Votre demande a bien été reçue. Le propriétaire vous contactera pour confirmer la disponibilité et les détails. Il ne s'agit pas encore d'une réservation confirmée.",
    submitAnother: "Envoyer une autre demande",
    errorRequired: "Ce champ est requis.",
    errorInvalidEmail: "Adresse email invalide.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    signatureLead: "Réservation signée",
    signatureAriaLabel: "Réservation conçue par Evoview — ouvrir evoview.be dans un nouvel onglet",
  },
  en: {
    experienceLabel: "Experience",
    dateLabel: "Preferred date",
    closedNote: "Closed on Sundays",
    guestsLabel: "Guests",
    timeLabel: "Preferred time",
    startTimeLabel: "Preferred start time",
    endTimeLabel: "Preferred end time",
    contactLabel: "Your details",
    nameLabel: "Full name",
    phoneLabel: "Phone",
    emailLabel: "Email",
    notesLabel: "Additional information",
    notesOptional: "optional",
    notesPlaceholder: "Birthday, special request...",
    submit: "Send request",
    submitting: "Sending...",
    confirmationTitle: "Request Sent!",
    confirmationMessage: "Your request has been received. The owner will contact you to confirm availability and details. This is not yet a confirmed booking.",
    submitAnother: "Send another request",
    errorRequired: "This field is required.",
    errorInvalidEmail: "Invalid email address.",
    errorGeneric: "An error occurred. Please try again.",
    signatureLead: "Booking by",
    signatureAriaLabel: "Booking experience designed by Evoview — open evoview.be in a new tab",
  },
};

const LUNCH = { open: "12:00", close: "14:30" };
const DINNER = { open: "18:00", close: "22:30" };

export function buildTchinReservationConfig(locale: Locale): ReservationConfig {
  const isFr = locale === "fr";
  return {
    copy: COPY[locale],
    dateLocale: isFr ? fr : undefined,
    experiences: [
      { value: "restaurant_only", label: isFr ? "Restaurant uniquement" : "Restaurant only", desc: isFr ? "Une table pour dîner" : "A table for dinner", icon: UtensilsCrossed },
      { value: "karaoke_only", label: isFr ? "Karaoké uniquement" : "Karaoke only", desc: isFr ? "Une salle privée pour chanter" : "A private room to sing", icon: Mic, requiresEndTime: true, timeNote: isFr ? "Karaoké : 12€ par personne, par heure" : "Karaoke: €12 per person, per hour" },
      { value: "restaurant_then_karaoke", label: isFr ? "Restaurant puis karaoké" : "Restaurant then karaoke", desc: isFr ? "Dînez, puis chantez" : "Dine, then sing", icon: Sparkles, timeNote: isFr ? "Karaoké : 12€ par personne, par heure" : "Karaoke: €12 per person, per hour" },
    ],
    windows: (date) => (isSunday(date) ? [] : isSaturday(date) ? [DINNER] : [LUNCH, DINNER]),
    slotMinutes: 30,
    guests: { min: 1, max: 15 },
    submit: async () => {
      await new Promise((r) => setTimeout(r, 700));
      return { ok: true };
    },
    accent: "oklch(0.88 0.18 90)",
    accentForeground: "oklch(0.07 0 0)",
  };
}
