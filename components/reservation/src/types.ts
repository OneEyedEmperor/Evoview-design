import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "date-fns";

/** Opening window, "HH:MM" local time. Start slots run from `open` to `close - slotMinutes`. */
export type ReservationWindow = { open: string; close: string; /** Group label above its slots ("Midi", "Soir"). */ label?: string };

export type ReservationExperience = {
  /** Sent back to `submit` as `experience`. */
  value: string;
  label: string;
  /** Short meta line under the label, rendered as an uppercase readout ("Table · Dîner"). */
  desc: string;
  /** Replaces the Evoview eye glyph of this row: one or more icons (rendered side by side),
      carrying their own colour, e.g. the client's navbar marks. */
  icon?: ReactNode;
  /** Ask for an end time after the start time. */
  requiresEndTime?: boolean;
  /** Ask for a duration in hours after the start time (e.g. a room rented by the hour).
      `withinWindow` drops durations that would run past the start's opening window. */
  hours?: { options: number[]; withinWindow?: boolean };
  /** Line shown in the time step when this experience is selected (price, duration…). */
  timeNote?: string;
};

export type ReservationRequest = {
  experience: string;
  date: Date;
  /** yyyy-MM-dd */
  dateISO: string;
  startTime: string;
  endTime?: string;
  /** Chosen duration when the experience has `hours`. */
  hours?: number;
  guests: number;
  /** Set when the guest picked "+max": the real party is larger than `guests`. */
  guestsOverflow?: boolean;
  name: string;
  phone: string;
  email: string;
  notes?: string;
};

export type ReservationResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Partial<Record<"name" | "phone" | "email" | "notes", string>> };

export type ReservationStepCopy = {
  /** Question heading of the step ("Quelle expérience vous tente ?"). */
  title: string;
  /** One line under the heading. */
  hint: string;
  /** Short name for the header, progress and recap ticket ("Expérience"). */
  short: string;
};

export type ReservationCopy = {
  /** Header kicker ("Réservation"). */
  kicker: string;
  steps: Record<"experience" | "date" | "guests" | "time" | "contact", ReservationStepCopy>;
  /** Under the calendar, e.g. "Fermé le dimanche". Empty string hides it. */
  closedNote: string;
  guestsUnit: { one: string; many: string };
  startTimeLabel: string;
  endTimeLabel: string;
  /** Duration group title and unit, used by experiences with `hours`. */
  hoursLabel?: string;
  hoursUnit?: { one: string; many: string };
  nameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  notesLabel: string;
  optional: string;
  notesPlaceholder: string;
  next: string;
  back: string;
  submit: string;
  submitting: string;
  /** Shown next to "next" when the step is not answered yet. */
  chooseToContinue: string;
  /** Ticket status line while composing and once sent. */
  statusDraft: string;
  statusSent: string;
  confirmationKicker: string;
  confirmationTitle: string;
  confirmationMessage: string;
  submitAnother: string;
  errorRequired: string;
  errorInvalidEmail: string;
  errorGeneric: string;
  /** Accessible name of the Evoview wordmark link; must say it opens evoview.be in a new tab. */
  signatureAriaLabel: string;
};

export type ReservationConfig = {
  copy: ReservationCopy;
  /** The client's venue, printed on the header kicker and the recap ticket. */
  venue: { name: string };
  /** date-fns locale for the calendar and ticket date. Omit for en-US. */
  dateLocale?: Locale;
  experiences: ReservationExperience[];
  /** Opening windows for a date; `[]` closes the day (disabled in the calendar). */
  windows: (date: Date) => ReservationWindow[];
  slotMinutes?: number;
  /** `overflow` adds a final "+max" choice; it submits `guests: max` with `guestsOverflow: true`. */
  guests: { min: number; max: number; overflow?: boolean };
  /** Bookable horizon in days from today. Omit for no limit. */
  maxDaysAhead?: number;
  submit: (request: ReservationRequest) => Promise<ReservationResult>;
  /** Called once on mount (preload a captcha, warm an API…). */
  onMount?: () => void;
  /** Called after every submit (toasts, analytics already wired by the host). */
  onResult?: (result: ReservationResult, request: ReservationRequest) => void;
  /** Overrides the accent. By default the chassis takes the host's `--primary` (the client's accent), Evoview indigo #818cf8 if absent. */
  accent?: string;
  /** Overrides the text colour on accent fills. Default: host `--primary-foreground`, else #101011. */
  accentInk?: string;
  /** Any `--resa-*` token override. */
  vars?: Record<`--resa-${string}`, string>;
  /** `{ href: null }` pauses the header wordmark's link (destination not live yet); the wordmark stays. */
  attribution?: { href?: string | null };
  className?: string;
  style?: CSSProperties;
};

/* ── ReservationFlow: the short form (paper chassis, controls language) ── */

export type ReservationFlowOption = { value: string; label: string; /** Shown but not choosable (full slot, closed day). */ disabled?: boolean };

export type ReservationFlowStep =
  | {
      kind: "choice";
      /** Key of the answer in `ReservationFlowRequest.answers`. */
      id: string;
      /** Progress caption ("Invités"). */
      short: string;
      /** Question heading ("Combien serez-vous ?"). */
      question: string;
      options: ReservationFlowOption[];
    }
  | { kind: "contact"; short: string; question: string };

export type ReservationFlowRequest = {
  /** Step id → chosen option value. */
  answers: Record<string, string>;
  email: string;
  /** Only when `contact.sms` is configured. */
  sms?: boolean;
};

export type ReservationFlowCopy = {
  /** Accessible name of the progress ("Votre réservation"). */
  label: string;
  next: string;
  back: string;
  send: string;
  again: string;
  doneTitle: string;
  doneBody: string;
  errorGeneric: string;
  emailLabel: string;
  errorInvalidEmail: string;
  /** Accessible name of the Evoview wordmark link; must say it opens evoview.be in a new tab. */
  signatureAriaLabel: string;
};

export type ReservationFlowConfig = {
  /** Locale of the shared controls copy (busy states, step names). */
  locale: "fr" | "en";
  copy: ReservationFlowCopy;
  /** Choice steps in order, then exactly one contact step, last. Three to five steps in total. */
  steps: ReservationFlowStep[];
  /** Optional SMS opt-in under the e-mail field. */
  contact?: { sms?: { label: string; description: string } };
  submit: (request: ReservationFlowRequest) => Promise<ReservationResult>;
  onResult?: (result: ReservationResult, request: ReservationFlowRequest) => void;
  /** Tone of the module. Default "paper" (white); "light" on #efefef sites. */
  tone?: "paper" | "light";
  /** The approved Evoview attribution (linked wordmark above the progress). Default true. */
  attribution?: boolean | { href?: string | null };
  className?: string;
};
