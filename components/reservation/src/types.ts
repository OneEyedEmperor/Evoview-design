import type { ComponentType, CSSProperties } from "react";
import type { Locale } from "date-fns";

export type ReservationIcon = ComponentType<{ className?: string }>;

/** Opening window, "HH:MM" local time. Start slots run from `open` to `close - slotMinutes`. */
export type ReservationWindow = { open: string; close: string };

export type ReservationExperience = {
  /** Sent back to `submit` as `experience`. */
  value: string;
  label: string;
  desc: string;
  icon: ReservationIcon;
  /** Ask for an end time too (e.g. a room rented by the hour). */
  requiresEndTime?: boolean;
  /** Line shown under the time step when this experience is selected (price, duration…). */
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
  name: string;
  phone: string;
  email: string;
  notes?: string;
};

export type ReservationResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Partial<Record<"name" | "phone" | "email" | "notes", string>> };

export type ReservationCopy = {
  experienceLabel: string;
  dateLabel: string;
  /** Under the calendar, e.g. "Closed on Sundays". Empty string hides it. */
  closedNote: string;
  guestsLabel: string;
  timeLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
  contactLabel: string;
  nameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  notesLabel: string;
  notesOptional: string;
  notesPlaceholder: string;
  submit: string;
  submitting: string;
  confirmationTitle: string;
  confirmationMessage: string;
  submitAnother: string;
  errorRequired: string;
  errorInvalidEmail: string;
  errorGeneric: string;
  /** Evoview signature, in the page language. Lead text before the wordmark. */
  signatureLead: string;
  /** Accessible name of the signature link; must say it opens Evoview's site in a new tab. */
  signatureAriaLabel: string;
};

export type ReservationConfig = {
  copy: ReservationCopy;
  /** date-fns locale for the calendar (month names, week start). Omit for en-US. */
  dateLocale?: Locale;
  experiences: ReservationExperience[];
  /** Opening windows for a date; `[]` closes the day (disabled in the calendar). */
  windows: (date: Date) => ReservationWindow[];
  slotMinutes?: number;
  guests: { min: number; max: number };
  /** Bookable horizon in days from today. Omit for no limit. */
  maxDaysAhead?: number;
  submit: (request: ReservationRequest) => Promise<ReservationResult>;
  /** Called once on mount (preload a captcha, warm an API…). */
  onMount?: () => void;
  /** Called after every submit (toasts, analytics already wired by the host). */
  onResult?: (result: ReservationResult, request: ReservationRequest) => void;
  /** Client accent; drives selections, step badges, focus ring and the submit button. */
  accent?: string;
  /** Text colour on top of `accent`. */
  accentForeground?: string;
  /** Any `--resa-*` token override. */
  vars?: Record<`--resa-${string}`, string>;
  className?: string;
  style?: CSSProperties;
};
