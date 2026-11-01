import type { DossierCopy, DossierFeedCopy, DossierItem, Locale } from "./types";

/** The copy of an item's views: the config's, with the item's own keys over it (`dock`, `loader`, `feed` key by key).
    Without `item.copy` it is the config's copy itself. */
export function itemCopy(copy: DossierCopy, item: DossierItem | null | undefined): DossierCopy {
  const own = item?.copy;
  if (!own) return copy;
  return {
    ...copy,
    ...own,
    dock: { ...copy.dock, ...own.dock },
    loader: { ...copy.loader, ...own.loader },
    ...(copy.feed || own.feed ? { feed: { ...copy.feed, ...own.feed } } : {}),
  };
}

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

const FEED: Record<Locale, DossierFeedCopy> = {
  fr: {
    newer: "Plus récents",
    older: "Plus anciens",
    loading: "Chargement de la suite",
    loaded: (n) => `${n} de plus`,
    failed: "La suite n'a pas pu être chargée.",
    unavailable: "Ce contenu n'a pas pu être chargé.",
    retry: "Réessayer",
    end: "C'est tout pour le moment.",
    fresh: (n) => (n > 1 ? `${n} nouveaux` : "1 nouveau"),
    freshAria: (n) => (n > 1 ? `Afficher les ${n} nouvelles publications` : "Afficher la nouvelle publication"),
    page: (p) => `Page ${p}`,
    location: (i, label) => `Publication ${i} : ${label}`,
    open: (i, title) => `Ouvrir la publication ${i} : ${title}`,
  },
  en: {
    newer: "Newer",
    older: "Older",
    loading: "Loading more",
    loaded: (n) => `${n} more`,
    failed: "The next entries could not be loaded.",
    unavailable: "This content could not be loaded.",
    retry: "Try again",
    end: "That's everything for now.",
    fresh: (n) => `${n} new`,
    freshAria: (n) => (n > 1 ? `Show the ${n} new entries` : "Show the new entry"),
    page: (p) => `Page ${p}`,
    location: (i, label) => `Entry ${i}: ${label}`,
    open: (i, title) => `Open entry ${i}: ${title}`,
  },
};

/** Feed board copy (1.14.0): the config's keys over the locale's defaults. */
export const feedCopy = (copy: DossierCopy, locale: Locale): DossierFeedCopy => ({ ...(FEED[locale] ?? FEED.en), ...copy.feed });

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
