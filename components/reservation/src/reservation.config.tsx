import { isSaturday, isSunday } from "date-fns";
import { fr } from "date-fns/locale";
import type { ReservationConfig, ReservationCopy, ReservationRequest, ReservationResult } from "./types";

/* Reference config — the only per-site file. Replace venue, copy,
   experiences, opening windows, guests and `submit`. The chassis, marks,
   typography and the Evoview wordmark link are the component, not config. */

export type Locale = "fr" | "en";

const COPY: Record<Locale, ReservationCopy> = {
  fr: {
    kicker: "Réservation",
    steps: {
      experience: { short: "Expérience", title: "Quelle expérience vous tente ?", hint: "Choisissez votre moment. Nous l'affinerons ensemble." },
      date: { short: "Date", title: "Quel jour vous attend-on ?", hint: "Les jours grisés sont complets ou fermés." },
      guests: { short: "Convives", title: "Combien serez-vous ?", hint: "Au-delà, écrivez-nous dans la dernière étape." },
      time: { short: "Horaire", title: "À quelle heure ?", hint: "Votre heure d'arrivée souhaitée." },
      contact: { short: "Contact", title: "Où vous confirmer ?", hint: "Nous vous recontactons pour valider la réservation." },
    },
    closedNote: "Fermé le dimanche",
    guestsUnit: { one: "personne", many: "personnes" },
    startTimeLabel: "Arrivée",
    endTimeLabel: "Fin",
    nameLabel: "Nom complet",
    phoneLabel: "Téléphone",
    emailLabel: "Email",
    notesLabel: "Une précision ?",
    optional: "facultatif",
    notesPlaceholder: "Anniversaire, allergie, demande particulière…",
    next: "Continuer",
    back: "Retour",
    submit: "Envoyer la demande",
    submitting: "Envoi…",
    chooseToContinue: "Faites un choix pour continuer.",
    dossier: "Dossier",
    stepsWord: "étapes",
    remainingWord: "restantes",
    pending: "À choisir",
    statusDraft: "Demande en cours",
    statusSent: "Demande transmise",
    confirmationKicker: "Demande transmise",
    confirmationTitle: "C'est noté.",
    confirmationMessage: "Nous avons bien reçu votre demande et vous recontactons pour la confirmer. Ce n'est pas encore une réservation confirmée.",
    submitAnother: "Nouvelle demande",
    errorRequired: "Ce champ est requis.",
    errorInvalidEmail: "Adresse email invalide.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    signatureAriaLabel: "Evoview — ouvrir evoview.be dans un nouvel onglet",
  },
  en: {
    kicker: "Reservation",
    steps: {
      experience: { short: "Experience", title: "What are you in the mood for?", hint: "Pick your moment. We will fine-tune it together." },
      date: { short: "Date", title: "Which day should we expect you?", hint: "Greyed-out days are full or closed." },
      guests: { short: "Guests", title: "How many of you?", hint: "Larger group? Tell us in the last step." },
      time: { short: "Time", title: "What time?", hint: "Your preferred arrival time." },
      contact: { short: "Contact", title: "Where do we confirm?", hint: "We will get back to you to confirm the booking." },
    },
    closedNote: "Closed on Sundays",
    guestsUnit: { one: "guest", many: "guests" },
    startTimeLabel: "Arrival",
    endTimeLabel: "End",
    nameLabel: "Full name",
    phoneLabel: "Phone",
    emailLabel: "Email",
    notesLabel: "Anything to add?",
    optional: "optional",
    notesPlaceholder: "Birthday, allergy, special request…",
    next: "Continue",
    back: "Back",
    submit: "Send request",
    submitting: "Sending…",
    chooseToContinue: "Make a choice to continue.",
    dossier: "Dossier",
    stepsWord: "steps",
    remainingWord: "left",
    pending: "To choose",
    statusDraft: "Request in progress",
    statusSent: "Request sent",
    confirmationKicker: "Request sent",
    confirmationTitle: "Noted.",
    confirmationMessage: "We have received your request and will contact you to confirm it. This is not a confirmed booking yet.",
    submitAnother: "New request",
    errorRequired: "This field is required.",
    errorInvalidEmail: "Invalid email address.",
    errorGeneric: "An error occurred. Please try again.",
    signatureAriaLabel: "Evoview — open evoview.be in a new tab",
  },
};

const EXPERIENCES: Record<Locale, ReservationConfig["experiences"]> = {
  fr: [
    { value: "lunch", label: "Déjeuner", desc: "Table · Midi" },
    { value: "dinner", label: "Dîner", desc: "Table · Soir" },
    { value: "private", label: "Salon privé", desc: "Groupe · À l'heure", requiresEndTime: true, timeNote: "Salon privé : 15 € par personne et par heure" },
  ],
  en: [
    { value: "lunch", label: "Lunch", desc: "Table · Noon" },
    { value: "dinner", label: "Dinner", desc: "Table · Evening" },
    { value: "private", label: "Private room", desc: "Group · By the hour", requiresEndTime: true, timeNote: "Private room: €15 per person, per hour" },
  ],
};

/* Replace with the site's API call. Map server field errors to name/phone/email/notes. */
async function submitRequest(request: ReservationRequest): Promise<ReservationResult> {
  void request;
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true };
}

export function buildReservationConfig(locale: Locale): ReservationConfig {
  const lunch = { open: "12:00", close: "14:30", label: locale === "fr" ? "Midi" : "Lunch" };
  const dinner = { open: "18:00", close: "22:30", label: locale === "fr" ? "Soir" : "Dinner" };
  return {
    copy: COPY[locale],
    venue: { name: "Maison Exemple", place: "Bruxelles" },
    dateLocale: locale === "fr" ? fr : undefined,
    experiences: EXPERIENCES[locale],
    windows: (date) => (isSunday(date) ? [] : isSaturday(date) ? [dinner] : [lunch, dinner]),
    slotMinutes: 30,
    guests: { min: 1, max: 12 },
    submit: submitRequest,
  };
}
