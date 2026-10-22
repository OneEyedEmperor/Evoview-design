/* Per-site file: default labels of the Evoview controls (spoken names,
   counters, step statuses). Edit the copy, keep the keys. */

export type Locale = "fr" | "en";

export type ControlsCopy = {
  close: string;
  previous: string;
  next: string;
  optional: string;
  /** Spoken after a required field label. */
  required: string;
  busy: string;
  /** Multi-select counter, e.g. "2 sur 3". */
  selectedCount: (count: number, max: number) => string;
  maxReached: (max: number) => string;
  /** Segmented progress, e.g. "Étape 2 sur 5". */
  step: (current: number, total: number) => string;
  stepStatus: { done: string; current: string; upcoming: string };
};

export type ControlsConfig = { locale: Locale; copy: ControlsCopy };

const COPY: Record<Locale, ControlsCopy> = {
  fr: {
    close: "Fermer",
    previous: "Précédent",
    next: "Suivant",
    optional: "facultatif",
    required: "obligatoire",
    busy: "En cours…",
    selectedCount: (count, max) => `${count} sur ${max}`,
    maxReached: (max) => `Maximum atteint : ${max}`,
    step: (current, total) => `Étape ${current} sur ${total}`,
    stepStatus: { done: "terminée", current: "en cours", upcoming: "à venir" },
  },
  en: {
    close: "Close",
    previous: "Previous",
    next: "Next",
    optional: "optional",
    required: "required",
    busy: "Working…",
    selectedCount: (count, max) => `${count} of ${max}`,
    maxReached: (max) => `Maximum reached: ${max}`,
    step: (current, total) => `Step ${current} of ${total}`,
    stepStatus: { done: "done", current: "current", upcoming: "upcoming" },
  },
};

/** Language used when no <ControlsProvider> is mounted. */
export const defaultControlsLocale: Locale = "fr";

export function buildControlsConfig(locale: Locale): ControlsConfig {
  return { locale, copy: COPY[locale] };
}
