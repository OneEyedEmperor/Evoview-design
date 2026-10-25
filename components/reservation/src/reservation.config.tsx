import { isSunday } from "date-fns";
import { fr } from "date-fns/locale";
import { DoorOpen, UtensilsCrossed } from "lucide-react";
import type {
  ReservationConfig,
  ReservationCopy,
  ReservationFlowConfig,
  ReservationFlowCopy,
  ReservationFlowOption,
  ReservationFlowRequest,
  ReservationRequest,
  ReservationResult,
} from "./types";

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
  // One continuous service: all start times in a single list. Clients with split
  // services return several windows, each with a `label` ("Midi", "Soir").
  const service = { open: "12:00", close: "22:30" };
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
    windows: (date) => (isSunday(date) ? [] : [service]),
    slotMinutes: 30,
    guests: { min: 1, max: 12, overflow: true },
    submit: submitRequest,
  };
}

/* ── ReservationFlow: the short form ──────────────────────────────────
   Three to five chip questions, then an e-mail. Use it where the booking
   is simple (a bar, an evening, a tasting); the full Reservation above for
   experiences, calendars and opening windows. */

const FLOW_COPY: Record<Locale, ReservationFlowCopy> = {
  fr: {
    label: "Votre réservation",
    next: "Continuer",
    back: "Retour",
    send: "Envoyer la demande",
    again: "Recommencer",
    doneTitle: "C'est noté.",
    doneBody: "Vous recevrez une confirmation sous 24 heures.",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    emailLabel: "E-mail",
    errorInvalidEmail: "Il manque la fin de l'adresse (ex. : nom@domaine.be)",
    signatureAriaLabel: "Evoview — ouvrir evoview.be dans un nouvel onglet",
  },
  en: {
    label: "Your booking",
    next: "Continue",
    back: "Back",
    send: "Send the request",
    again: "Start again",
    doneTitle: "All set.",
    doneBody: "You will receive a confirmation within 24 hours.",
    errorGeneric: "An error occurred. Please try again.",
    emailLabel: "Email",
    errorInvalidEmail: "The address is missing its end (e.g. name@domain.com)",
    signatureAriaLabel: "Evoview — open evoview.be in a new tab",
  },
};

/** The next `count` open days as chips: today, tomorrow, then "sam. 26". */
function nextDays(locale: Locale, count: number, closed: (d: Date) => boolean): ReservationFlowOption[] {
  const isFr = locale === "fr";
  const fmt = new Intl.DateTimeFormat(isFr ? "fr-BE" : "en-GB", { weekday: "short", day: "numeric" });
  const out: ReservationFlowOption[] = [];
  const day = new Date();
  day.setHours(12, 0, 0, 0);
  for (let i = 0; out.length < count && i < 31; i++, day.setDate(day.getDate() + 1)) {
    if (closed(day)) continue;
    const label = i === 0 ? (isFr ? "Aujourd'hui" : "Today") : i === 1 ? (isFr ? "Demain" : "Tomorrow") : fmt.format(day);
    out.push({ value: day.toISOString().slice(0, 10), label });
  }
  return out;
}

/* Replace with the site's API call; `answers` holds each step id → value. */
async function submitFlow(request: ReservationFlowRequest): Promise<ReservationResult> {
  void request;
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true };
}

export function buildReservationFlowConfig(locale: Locale): ReservationFlowConfig {
  const isFr = locale === "fr";
  return {
    locale,
    copy: FLOW_COPY[locale],
    steps: [
      {
        kind: "choice",
        id: "venue",
        short: isFr ? "Lieu" : "Venue",
        question: isFr ? "Où vous recevoir ?" : "Where shall we seat you?",
        options: [
          { value: "restaurant", label: isFr ? "Restaurant" : "Restaurant" },
          { value: "bar", label: "Bar" },
          { value: "room", label: isFr ? "Salon privé" : "Private room" },
        ],
      },
      { kind: "choice", id: "date", short: "Date", question: isFr ? "Quel jour ?" : "Which day?", options: nextDays(locale, 5, isSunday) },
      { kind: "choice", id: "guests", short: isFr ? "Invités" : "Guests", question: isFr ? "Combien serez-vous ?" : "How many of you?", options: ["2", "3 – 4", "5 – 8", "9 – 12"].map((label) => ({ value: label, label })) },
      {
        kind: "choice",
        id: "time",
        short: isFr ? "Heure" : "Time",
        question: isFr ? "À quelle heure ?" : "At what time?",
        // A full slot stays visible, disabled.
        options: ["19:00", "19:30", "20:00", "20:30", "21:00"].map((label) => ({ value: label, label, disabled: label === "20:00" })),
      },
      { kind: "contact", short: "Contact", question: isFr ? "Où vous confirmer ?" : "Where do we confirm?" },
    ],
    contact: { sms: isFr ? { label: "Confirmation par SMS", description: "Un message la veille de votre venue." } : { label: "SMS confirmation", description: "One message the day before your visit." } },
    submit: submitFlow,
  };
}
