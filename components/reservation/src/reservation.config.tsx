import { isSaturday, isSunday } from "date-fns";
import { fr } from "date-fns/locale";
import { DoorOpen, UtensilsCrossed } from "lucide-react";
import type { ReservationConfig, ReservationCopy, ReservationRequest, ReservationResult } from "./types";

/* Reference config — the only per-site file. A neutral copy of the Tchin Tchin
   setup (the first client): three experiences with the client's icons, a
   by-the-hour option asking a duration (never an end time), "+max" guests.
   Replace venue, copy, icons, experiences, windows, guests and `submit`. */

export type Locale = "fr" | "en";

const COPY: Record<Locale, ReservationCopy> = {
  fr: {
    kicker: "Réservation",
    steps: {
      experience: { short: "Expérience", title: "Table, salon, ou les deux ?", hint: "Choisissez votre moment. L'établissement confirme ensuite." },
      date: { short: "Date", title: "Quel jour vous attend-on ?", hint: "Les jours grisés sont fermés." },
      guests: { short: "Personnes", title: "Combien serez-vous ?", hint: "Plus de 12 ? Choisissez +12, l'établissement s'organise avec vous." },
      time: { short: "Horaire", title: "À quelle heure ?", hint: "Votre heure d'arrivée souhaitée." },
      contact: { short: "Contact", title: "On confirme ?", hint: "L'établissement vous recontacte pour valider la demande." },
    },
    closedNote: "Fermé le dimanche",
    guestsUnit: { one: "personne", many: "personnes" },
    startTimeLabel: "Arrivée",
    endTimeLabel: "Fin",
    hoursLabel: "Durée du salon",
    hoursUnit: { one: "heure", many: "heures" },
    nameLabel: "Nom complet",
    phoneLabel: "Téléphone",
    emailLabel: "Email",
    notesLabel: "Informations complémentaires",
    optional: "facultatif",
    notesPlaceholder: "Anniversaire, allergie, demande particulière…",
    next: "Continuer",
    back: "Retour",
    submit: "Envoyer la demande",
    submitting: "Envoi…",
    chooseToContinue: "Faites un choix pour continuer.",
    statusDraft: "Demande en cours",
    statusSent: "Demande transmise",
    confirmationKicker: "Demande transmise",
    confirmationTitle: "Demande envoyée !",
    confirmationMessage: "Votre demande a bien été reçue. L'établissement vous contactera pour confirmer la disponibilité et les détails. Il ne s'agit pas encore d'une réservation confirmée.",
    submitAnother: "Nouvelle demande",
    errorRequired: "Ce champ est requis.",
    errorInvalidEmail: "Adresse email invalide.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    signatureAriaLabel: "Evoview — ouvrir evoview.be dans un nouvel onglet",
  },
  en: {
    kicker: "Reservation",
    steps: {
      experience: { short: "Experience", title: "Table, room, or both?", hint: "Pick your moment. The venue confirms afterwards." },
      date: { short: "Date", title: "Which day should we expect you?", hint: "Greyed-out days are closed." },
      guests: { short: "Guests", title: "How many of you?", hint: "More than 12? Pick +12, the venue will arrange it with you." },
      time: { short: "Time", title: "What time?", hint: "Your preferred arrival time." },
      contact: { short: "Contact", title: "Shall we confirm?", hint: "The venue will get back to you to confirm the request." },
    },
    closedNote: "Closed on Sundays",
    guestsUnit: { one: "guest", many: "guests" },
    startTimeLabel: "Arrival",
    endTimeLabel: "End",
    hoursLabel: "Room duration",
    hoursUnit: { one: "hour", many: "hours" },
    nameLabel: "Full name",
    phoneLabel: "Phone",
    emailLabel: "Email",
    notesLabel: "Additional information",
    optional: "optional",
    notesPlaceholder: "Birthday, allergy, special request…",
    next: "Continue",
    back: "Back",
    submit: "Send request",
    submitting: "Sending…",
    chooseToContinue: "Make a choice to continue.",
    statusDraft: "Request in progress",
    statusSent: "Request sent",
    confirmationKicker: "Request sent",
    confirmationTitle: "Request sent!",
    confirmationMessage: "Your request has been received. The venue will contact you to confirm availability and details. This is not yet a confirmed booking.",
    submitAnother: "New request",
    errorRequired: "This field is required.",
    errorInvalidEmail: "Invalid email address.",
    errorGeneric: "An error occurred. Please try again.",
    signatureAriaLabel: "Evoview — open evoview.be in a new tab",
  },
};

/* Use the client's navbar marks here (same icons, same colours). The
   reference keeps them neutral: they inherit the row's text colour. */
const table = <UtensilsCrossed strokeWidth={1.6} />;
const room = <DoorOpen strokeWidth={1.6} />;
const ROOM_HOURS = [1, 2, 3];

/* Replace with the site's API call. Map server field errors to name/phone/email/notes;
   map `guestsOverflow` and `hours` to whatever the API accepts (fields or notes). */
async function submitRequest(request: ReservationRequest): Promise<ReservationResult> {
  void request;
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true };
}

export function buildReservationConfig(locale: Locale): ReservationConfig {
  const isFr = locale === "fr";
  const lunch = { open: "12:00", close: "14:30", label: isFr ? "Midi" : "Lunch" };
  const dinner = { open: "18:00", close: "22:30", label: isFr ? "Soir" : "Evening" };
  const roomPrice = isFr ? "Salon privé : 15 € par personne, par heure" : "Private room: €15 per person, per hour";
  return {
    copy: COPY[locale],
    venue: { name: "Maison Exemple" },
    dateLocale: isFr ? fr : undefined,
    experiences: [
      { value: "table", label: isFr ? "Table uniquement" : "Table only", desc: isFr ? "Une table pour dîner" : "A table for dinner", icon: table },
      { value: "room", label: isFr ? "Salon privé uniquement" : "Private room only", desc: isFr ? "Un espace rien que pour vous" : "A space just for you", icon: room, hours: { options: ROOM_HOURS, withinWindow: true }, timeNote: roomPrice },
      { value: "table_then_room", label: isFr ? "Table puis salon" : "Table then room", desc: isFr ? "Dînez, puis prolongez" : "Dine, then stay on", icon: <>{table}{room}</>, hours: { options: ROOM_HOURS }, timeNote: roomPrice },
    ],
    windows: (date) => (isSunday(date) ? [] : isSaturday(date) ? [dinner] : [lunch, dinner]),
    slotMinutes: 30,
    guests: { min: 1, max: 12, overflow: true },
    submit: submitRequest,
  };
}
