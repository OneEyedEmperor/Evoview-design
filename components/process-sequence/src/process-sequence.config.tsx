import type { ReactNode } from "react";
import type { Locale, ProcessSequenceConfig, ProcessSequenceCopy, ProcessStep, StepMedia } from "./types";

/* Reference config — the only per-site file. A neutral demo: an architecture
   studio's four-step process (survey → sketch → permit → build site).
   Replace steps, media, copy, marks, durations and the CTA; keep the keys.
   Media defaults to inline placeholders so the package renders anywhere;
   pass real files through `buildProcessSequenceConfig(locale, { media })`. */

export type { Locale };

type StepId = "survey" | "sketch" | "permit" | "site";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/* Client icons used as completion marks (drawn in by the card). */
const MARKS: Record<StepId, ReactNode> = {
  survey: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M3 17 17 3l4 4L7 21z" />
      <path d="m7 13 2 2M10 10l2 2M13 7l2 2" />
    </svg>
  ),
  sketch: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13 7 4 4M4 20l4-4" />
    </svg>
  ),
  permit: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4M9 14l2 2 4-4" />
    </svg>
  ),
  site: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M4 21V9l8-6 8 6v12" />
      <path d="M9 21v-6h6v6M2 21h20" />
    </svg>
  ),
};

/* Inline neutral placeholder (no file needed). */
const placeholder = (a: string, b: string): StepMedia => ({
  src:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1200" height="560" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-opacity=".12"><path d="M0 420h1200M0 300h1200M240 0v560M600 0v560M960 0v560"/><circle cx="600" cy="280" r="150"/></g></svg>`,
    ),
  type: "image",
});

const DEFAULT_MEDIA: Record<StepId, StepMedia> = {
  survey: placeholder("#4b4740", "#16151a"),
  sketch: placeholder("#5d5a52", "#1c1b1f"),
  permit: placeholder("#6a6458", "#1d1c1e"),
  site: placeholder("#3c3a3f", "#0e0e10"),
};

type StepCopy = Omit<ProcessStep, "id" | "media" | "mark">;

const STEPS: Record<Locale, Record<StepId, StepCopy>> = {
  fr: {
    survey: {
      title: "Relevé",
      summary: "Nous mesurons l'existant au laser et au mètre : murs, niveaux, réseaux. Le plan de départ est exact.",
      detail: {
        heading: ["Mesurer", "avant de dessiner"],
        intro: "Une journée sur place suffit le plus souvent. Nous relevons chaque pièce, photographions les détails et vérifions les contraintes du terrain avant toute proposition.",
        items: ["Relevé laser des volumes", "Repérage des réseaux", "Photos de chaque détail", "Contraintes du terrain"],
        objective: "Un plan de l'existant fiable, partagé avec vous sous une semaine.",
      },
    },
    sketch: {
      title: "Esquisse",
      summary: "Deux ou trois pistes dessinées à la main, une maquette de volume. Vous choisissez une direction.",
      detail: {
        heading: ["Choisir", "une direction"],
        intro: "Nous dessinons plusieurs intentions, du croquis à la maquette. Chaque piste est chiffrée à grands traits pour que le choix se fasse en connaissance de cause.",
        items: ["Deux à trois pistes", "Maquette de volume", "Estimation par piste", "Une séance de choix"],
        objective: "Une esquisse validée qui fixe les volumes et le budget cible.",
      },
    },
    permit: {
      title: "Permis",
      summary: "Le dossier de permis est monté, déposé et suivi jusqu'à l'accord. Vous n'avez rien à relancer.",
      detail: {
        heading: ["Déposer", "et obtenir l'accord"],
        intro: "Plans, notices et insertions sont préparés selon le règlement local. Nous déposons le dossier, répondons aux demandes de pièces et suivons l'instruction.",
        items: ["Plans et notices", "Insertion paysagère", "Dépôt en mairie", "Suivi de l'instruction"],
        objective: "Un permis accordé, sans aller-retour inutile.",
      },
    },
    site: {
      title: "Chantier",
      summary: "Consultation des entreprises, visites hebdomadaires, réception. Le projet se construit comme il a été dessiné.",
      detail: {
        heading: ["Construire", "ce qui a été dessiné"],
        intro: "Nous consultons les entreprises, comparons les offres puis dirigeons le chantier chaque semaine jusqu'à la réception et la levée des réserves.",
        items: ["Consultation des entreprises", "Visite chaque semaine", "Compte rendu partagé", "Réception des travaux"],
        objective: "Une maison livrée au prix et dans les délais convenus.",
      },
    },
  },
  en: {
    survey: {
      title: "Survey",
      summary: "We measure what exists by laser and by tape: walls, levels, services. The starting plan is exact.",
      detail: {
        heading: ["Measure", "before drawing"],
        intro: "One day on site is usually enough. We survey every room, photograph the details and check the plot's constraints before proposing anything.",
        items: ["Laser survey of volumes", "Services located", "Photos of every detail", "Plot constraints"],
        objective: "A reliable plan of the existing building, shared with you within a week.",
      },
    },
    sketch: {
      title: "Sketch",
      summary: "Two or three hand-drawn options and a massing model. You choose a direction.",
      detail: {
        heading: ["Choose", "a direction"],
        intro: "We draw several intentions, from sketch to model. Each option is roughly priced so the choice is an informed one.",
        items: ["Two to three options", "Massing model", "Estimate per option", "One choosing session"],
        objective: "An approved sketch that fixes the volumes and the target budget.",
      },
    },
    permit: {
      title: "Permit",
      summary: "The permit file is prepared, filed and followed through to approval. Nothing for you to chase.",
      detail: {
        heading: ["File", "and get approval"],
        intro: "Plans, statements and visual insertions are prepared to the local rules. We file, answer requests for documents and follow the review.",
        items: ["Plans and statements", "Visual insertion", "Filed with the council", "Review followed up"],
        objective: "An approved permit, without needless back-and-forth.",
      },
    },
    site: {
      title: "Build",
      summary: "Contractor tender, weekly site visits, handover. The project is built as it was drawn.",
      detail: {
        heading: ["Build", "what was drawn"],
        intro: "We tender the works, compare offers, then run the site every week until handover and the last snag is cleared.",
        items: ["Contractor tender", "Weekly site visit", "Shared minutes", "Handover of the works"],
        objective: "A house delivered at the agreed price and on time.",
      },
    },
  },
};

const COPY: Record<Locale, ProcessSequenceCopy> = {
  fr: {
    kicker: "Notre méthode",
    title: "Quatre étapes, un seul interlocuteur",
    instrumentLabel: "Progression de la méthode",
    status: { idle: "À venir", active: "En cours", complete: "Terminée" },
    stepOf: (c, t) => `Étape ${c} sur ${t}`,
    openHint: "ouvrir le détail",
    dossier: {
      label: "Détail de l'étape",
      close: "Fermer",
      previous: "Précédent",
      next: "Suivant",
      progress: "Progression",
      objective: "Objectif",
      loading: "Chargement du média…",
      failed: "Le média n'a pas pu être chargé.",
      retry: "Réessayer",
    },
    attributionLabel: "Evoview — ouvrir evoview.be dans un nouvel onglet",
  },
  en: {
    kicker: "Our method",
    title: "Four steps, one point of contact",
    instrumentLabel: "Method progress",
    status: { idle: "Upcoming", active: "In progress", complete: "Done" },
    stepOf: (c, t) => `Step ${c} of ${t}`,
    openHint: "open the detail",
    dossier: {
      label: "Step detail",
      close: "Close",
      previous: "Previous",
      next: "Next",
      progress: "Progress",
      objective: "Objective",
      loading: "Loading the media…",
      failed: "The media could not be loaded.",
      retry: "Retry",
    },
    attributionLabel: "Evoview — open evoview.be in a new tab",
  },
};

const ORDER: StepId[] = ["survey", "sketch", "permit", "site"];

export type ProcessSequenceConfigOptions = {
  /** Real media per step id (files from the client project). */
  media?: Partial<Record<StepId, StepMedia>>;
  /** Subset / order of step ids (3–6). */
  steps?: StepId[];
};

export function buildProcessSequenceConfig(locale: Locale, options: ProcessSequenceConfigOptions = {}): ProcessSequenceConfig {
  const ids = options.steps ?? ORDER;
  return {
    locale,
    steps: ids.map((id) => ({ id, ...STEPS[locale][id], media: options.media?.[id] ?? DEFAULT_MEDIA[id], mark: MARKS[id] })),
    durations: [4000, 4000, 4000, 6000],
    completionMark: "icon",
    copy: COPY[locale],
    cta: { label: locale === "fr" ? "Parler de votre projet" : "Discuss your project", href: "#contact" },
    attribution: { enabled: true },
  };
}
