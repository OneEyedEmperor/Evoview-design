import { isSaturday, isSunday } from "date-fns";
import { fr } from "date-fns/locale";
import { GlassWater, UtensilsCrossed, Wine } from "lucide-react";
import type { ReservationConfig, ReservationCopy, ReservationRequest, ReservationResult } from "./types";

/* Reference config — the only per-site file. Replace copy, experiences,
   opening windows, guests, accent and `submit`. Keep the signature copy
   (translate it if the site has another language). */

export type Locale = "fr" | "en";

const COPY: Record<Locale, ReservationCopy> = {
  fr: {
    experienceLabel: "Expérience",
    dateLabel: "Date souhaitée",
    closedNote: "Fermé le dimanche",
    guestsLabel: "Convives",
    timeLabel: "Heure souhaitée",
    startTimeLabel: "Heure d'arrivée",
    endTimeLabel: "Heure de fin",
    contactLabel: "Vos coordonnées",
    nameLabel: "Nom complet",
    phoneLabel: "Téléphone",
    emailLabel: "Email",
    notesLabel: "Informations complémentaires",
    notesOptional: "facultatif",
    notesPlaceholder: "Anniversaire, allergie, demande particulière...",
    submit: "Envoyer la demande",
    submitting: "Envoi...",
    confirmationTitle: "Demande envoyée !",
    confirmationMessage: "Nous avons bien reçu votre demande et vous recontacterons pour la confirmer.",
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
    startTimeLabel: "Arrival time",
    endTimeLabel: "End time",
    contactLabel: "Your details",
    nameLabel: "Full name",
    phoneLabel: "Phone",
    emailLabel: "Email",
    notesLabel: "Additional information",
    notesOptional: "optional",
    notesPlaceholder: "Birthday, allergy, special request...",
    submit: "Send request",
    submitting: "Sending...",
    confirmationTitle: "Request sent!",
    confirmationMessage: "We have received your request and will contact you to confirm it.",
    submitAnother: "Send another request",
    errorRequired: "This field is required.",
    errorInvalidEmail: "Invalid email address.",
    errorGeneric: "An error occurred. Please try again.",
    signatureLead: "Booking by",
    signatureAriaLabel: "Booking experience designed by Evoview — open evoview.be in a new tab",
  },
};

const EXPERIENCES: Record<Locale, ReservationConfig["experiences"]> = {
  fr: [
    { value: "lunch", label: "Déjeuner", desc: "Une table à midi", icon: UtensilsCrossed },
    { value: "dinner", label: "Dîner", desc: "Une table le soir", icon: Wine },
    { value: "private", label: "Salon privé", desc: "Pour un groupe, à l'heure", icon: GlassWater, requiresEndTime: true, timeNote: "Salon privé : 15 € par personne et par heure" },
  ],
  en: [
    { value: "lunch", label: "Lunch", desc: "A table at noon", icon: UtensilsCrossed },
    { value: "dinner", label: "Dinner", desc: "A table in the evening", icon: Wine },
    { value: "private", label: "Private room", desc: "For a group, by the hour", icon: GlassWater, requiresEndTime: true, timeNote: "Private room: €15 per person, per hour" },
  ],
};

const LUNCH = { open: "12:00", close: "14:30" };
const DINNER = { open: "18:00", close: "22:30" };

/* Replace with the site's API call. Map server field errors to name/phone/email/notes. */
async function submitRequest(request: ReservationRequest): Promise<ReservationResult> {
  void request;
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true };
}

export function buildReservationConfig(locale: Locale): ReservationConfig {
  return {
    copy: COPY[locale],
    dateLocale: locale === "fr" ? fr : undefined,
    experiences: EXPERIENCES[locale],
    windows: (date) => (isSunday(date) ? [] : isSaturday(date) ? [DINNER] : [LUNCH, DINNER]),
    slotMinutes: 30,
    guests: { min: 1, max: 12 },
    submit: submitRequest,
    /* Evoview indigo, lifted (Material indigo 300) for contrast on dark surfaces. */
    accent: "#7986cb",
    accentForeground: "#0c0c10",
  };
}
