import type { ComponentType, CSSProperties } from "react";
import type { Locale } from "date-fns";

/** Opening window, "HH:MM" local time. Start slots run from `open` to `close - slotMinutes`. */
export type ReservationWindow = { open: string; close: string; /** Group label above its slots ("Midi", "Soir"). */ label?: string };

export type ReservationExperience = {
  /** Sent back to `submit` as `experience`. */
  value: string;
  label: string;
  /** Short meta line under the label, rendered as an uppercase readout ("Table · Dîner"). */
  desc: string;
  /** Overrides the Evoview eye glyph of this row. Prefer the default. */
  icon?: ComponentType<{ className?: string }>;
  /** Ask for an end time too (e.g. a room rented by the hour). */
  requiresEndTime?: boolean;
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
  className?: string;
  style?: CSSProperties;
};
