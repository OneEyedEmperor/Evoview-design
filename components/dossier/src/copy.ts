import type { DossierCopy, Locale } from "./types";

type Extra = Required<Pick<DossierCopy, "openItem" | "chooseItem" | "up" | "empty">> & { pending: string };

const EXTRA: Record<Locale, Extra> = {
  fr: {
    openItem: (i, n, label) => `Ouvrir ${i} sur ${n} : ${label}`,
    chooseItem: "Choisissez",
    up: (label) => `Retour : ${label}`,
    empty: { title: "Rien pour le moment.", body: "Revenez bientôt." },
    pending: "Chargement du contenu",
  },
  en: {
    openItem: (i, n, label) => `Open ${i} of ${n}: ${label}`,
    chooseItem: "Choose",
    up: (label) => `Back: ${label}`,
    empty: { title: "Nothing for now.", body: "Come back soon." },
    pending: "Loading content",
  },
};

/** The 1.8.0 copy keys, filled from the locale's defaults when a config predates them. */
export function fullCopy(copy: DossierCopy, locale: Locale): DossierCopy & Required<Pick<DossierCopy, "openItem" | "chooseItem" | "up" | "empty">> & { pendingStatus: string } {
  const extra = EXTRA[locale] ?? EXTRA.en;
  return {
    ...copy,
    openItem: copy.openItem ?? extra.openItem,
    chooseItem: copy.chooseItem ?? extra.chooseItem,
    up: copy.up ?? extra.up,
    empty: copy.empty ?? extra.empty,
    pendingStatus: copy.loader.pending ?? extra.pending,
  };
}
