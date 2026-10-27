import type { MouseEvent, ReactNode } from "react";
import { EVOVIEW_URL } from "../foundation";

/* Reference config — the only per-site file. Neutral client: Atelier Halde,
   a fictional architecture studio. Replace the brand (name, inline mark,
   footer logo), legal line and footer links. Keep `attribution` as delivered:
   it is the approved Evoview placement, on by default; turning it off is the
   founder's call, not the client's. */

export type Locale = "fr" | "en";

export type ChapterFooterLink = {
  label: string;
  /** Route, anchor or URL. */
  href?: string;
  /** Opens in a new tab (adds the spoken hint). */
  external?: boolean;
  /** In-page action, e.g. reopening the cookie banner. Receives the click (call `preventDefault()` to keep an `href` from navigating). */
  onSelect?: (event: MouseEvent<HTMLElement>) => void;
  /** Panel nav: the page being shown (`aria-current="page"`). */
  current?: boolean;
};

/* ── footer panel (ChapterFooter layout="panel") ── */
export type ChapterFooterSocial = {
  /** Network name, spoken (the glyph is decorative). */
  label: string;
  href: string;
  /** Glyph in currentColor, ~20px box. */
  icon: ReactNode;
};

export type ChapterFooterContact = {
  /** One line, e.g. "Dok Noord 4, 9000 Gent". */
  address: string;
  /** Map link for the address (opens in a new tab). */
  mapsHref?: string;
  phone?: string;
  /** `tel:` link; default derived from `phone`. */
  phoneHref?: string;
  email?: string;
};
/* ── /footer panel ── */

export type ChapterConfig = {
  locale: Locale;
  brand: {
    name: string;
    /** Inline title mark (`<ChapterMark>`), drawn in currentColor. */
    mark: ReactNode;
    /** Footer logo, 24 / 28px high, currentColor. */
    logo: ReactNode;
    /** Footer logo destination (home). */
    href?: string;
  };
  footer: {
    legal: string;
    links: ChapterFooterLink[];
    /** Accessible name of the footer link list. */
    linksLabel: string;
    /** Spoken suffix for external links. */
    newTab: string;
    /* footer panel (layout="panel"); the bar ignores these */
    /** One or two sentences beside the logo (hidden on phones). */
    tagline?: string;
    /** Site pages as tonal tiles; mark the current one with `current`. */
    nav?: ChapterFooterLink[];
    navLabel?: string;
    socials?: ChapterFooterSocial[];
    socialsLabel?: string;
    contact?: ChapterFooterContact;
  };
  /** The one linked Evoview wordmark of the page, in the footer chassis. */
  attribution: {
    enabled: boolean;
    href: string;
    /** Visible credit before the wordmark. */
    credit: string;
    /** Accessible name: names Evoview and the new tab, in the page language. */
    label: string;
  };
};

/* Reference brand mark: a lintel over two piers. */
export function HaldeMark() {
  return (
    <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" aria-hidden="true" focusable="false">
      <path d="M3 22V7M29 22V7M1.5 5.5h29M10 22V13.5a6 6 0 0 1 12 0V22" />
    </svg>
  );
}

function HaldeLogo() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45em", height: "100%", fontFamily: "var(--ev-font-display)", fontWeight: 900, fontSize: "0.86em", letterSpacing: "-0.01em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-flex", height: "1.15em" }}>
        <HaldeMark />
      </span>
      Atelier Halde
    </span>
  );
}

/* Reference social glyphs (footer panel), currentColor. */
const glyph = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false } as const;
const SOCIAL_ICONS = {
  instagram: (
    <svg {...glyph}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.4" fill="currentColor" />
    </svg>
  ),
  linkedin: (
    <svg {...glyph}>
      <path d="M6 10v8M6 6.2v.1M10.5 18v-8M10.5 13.5a3 3 0 0 1 6 0V18" />
    </svg>
  ),
  pinterest: (
    <svg {...glyph}>
      <path d="M10.2 20.5 12 13M9.6 11.2a3.6 3.6 0 1 1 3.4 4.3c-1 0-1.6-.4-2-1" />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  ),
};

const SOCIALS = (newTab: string): ChapterFooterSocial[] => [
  { label: `Instagram (${newTab})`, href: "https://www.instagram.com/", icon: SOCIAL_ICONS.instagram },
  { label: `LinkedIn (${newTab})`, href: "https://www.linkedin.com/", icon: SOCIAL_ICONS.linkedin },
  { label: `Pinterest (${newTab})`, href: "https://www.pinterest.com/", icon: SOCIAL_ICONS.pinterest },
];

const CONTACT: ChapterFooterContact = {
  address: "Dok Noord 4, 9000 Gent",
  mapsHref: "https://www.google.com/maps/search/?api=1&query=Dok%20Noord%204%2C%209000%20Gent",
  phone: "+32 9 234 56 78",
  email: "atelier@halde.example",
};

const COPY: Record<Locale, Omit<ChapterConfig, "locale" | "brand">> = {
  fr: {
    footer: {
      legal: `© ${new Date().getFullYear()} Atelier Halde — architectes · BE 0712.345.678`,
      links: [
        { label: "Mentions légales", href: "#mentions" },
        { label: "Gérer les cookies", onSelect: () => undefined },
      ],
      linksLabel: "Informations légales",
      newTab: "nouvel onglet",
      tagline: "Atelier d'architecture à Gand. Maisons, rénovations et lieux de travail, dessinés à la main.",
      nav: [
        { label: "L'atelier", href: "/", current: true },
        { label: "Projets", href: "#projets" },
        { label: "Méthode", href: "#methode" },
        { label: "Visiter", href: "#visite" },
      ],
      navLabel: "Pages du site",
      socials: SOCIALS("nouvel onglet"),
      socialsLabel: "Réseaux sociaux",
      contact: CONTACT,
    },
    attribution: {
      enabled: true,
      href: EVOVIEW_URL,
      credit: "Site",
      label: "Site conçu par Evoview — evoview.be (nouvel onglet)",
    },
  },
  en: {
    footer: {
      legal: `© ${new Date().getFullYear()} Atelier Halde — architects · BE 0712.345.678`,
      links: [
        { label: "Legal notice", href: "#legal" },
        { label: "Manage cookies", onSelect: () => undefined },
      ],
      linksLabel: "Legal information",
      newTab: "new tab",
      tagline: "An architecture studio in Ghent. Houses, renovations and workplaces, drawn by hand.",
      nav: [
        { label: "Studio", href: "/", current: true },
        { label: "Projects", href: "#projets" },
        { label: "Method", href: "#methode" },
        { label: "Visit", href: "#visite" },
      ],
      navLabel: "Site pages",
      socials: SOCIALS("new tab"),
      socialsLabel: "Social media",
      contact: CONTACT,
    },
    attribution: {
      enabled: true,
      href: EVOVIEW_URL,
      credit: "Site",
      label: "Site designed by Evoview — evoview.be (new tab)",
    },
  },
};

export function buildChapterConfig(locale: Locale = "fr"): ChapterConfig {
  return {
    locale,
    brand: { name: "Atelier Halde", mark: <HaldeMark />, logo: <HaldeLogo />, href: "/" },
    ...COPY[locale],
  };
}

/* ══ FAQ (ChapterFaq) ═══════════════════════════════════════════════════
   Questions and answers as plain text: the same strings feed the visible
   accordion and the FAQPage JSON-LD, so the two never drift. */

export type ChapterFaqItem = {
  question: string;
  /** Plain text (also the JSON-LD answer). */
  answer: string;
  /** Optional follow-up under the answer, e.g. the booking page. */
  link?: { label: string; href: string };
};

export type ChapterFaqConfig = {
  locale: Locale;
  /** Section heading; one `<em>` word takes the accent. */
  title: ReactNode;
  subtitle?: ReactNode;
  items: ChapterFaqItem[];
  /** Text link beside the title ("Another question?"), never a CTA plate. */
  more?: { label: string; href: string };
  /** Portrait for layout="media" (sticky beside the list from 768, first on phones). */
  media?: { src: string; alt: string; srcSet?: string; sizes?: string };
  /** Phones show this many questions, then a "show more" row; the rest stay in the DOM. 0 = all. */
  phoneVisible: number;
  showMore: (hidden: number) => string;
  showLess: string;
  /** Emit FAQPage JSON-LD next to the list (one per page; off if the head already has it). */
  structuredData: boolean;
};

const FAQ_COPY: Record<Locale, Omit<ChapterFaqConfig, "locale" | "media" | "phoneVisible" | "structuredData">> = {
  fr: {
    title: (
      <>
        Tout ce qu'il faut <em>savoir</em>
      </>
    ),
    subtitle: "Les questions qu'on nous pose avant un premier rendez-vous.",
    more: { label: "Une autre question ?", href: "#visite" },
    showMore: (n) => `Voir les ${n} autres questions`,
    showLess: "Voir moins de questions",
    items: [
      {
        question: "Combien coûte une mission d'architecte ?",
        answer:
          "Nos honoraires vont de 8 à 12 % du coût des travaux, selon l'étendue de la mission. La première visite sur place est forfaitaire (180 €) et déduite des honoraires si le projet se poursuit.",
      },
      {
        question: "Comment démarrer un projet avec l'atelier ?",
        answer:
          "Tout commence par une visite sur place : on regarde le bâtiment, on écoute vos usages, on parle budget. Vous recevez ensuite une proposition de mission écrite sous dix jours.",
        link: { label: "Prendre rendez-vous", href: "#visite" },
      },
      {
        question: "Combien de temps dure un projet ?",
        answer:
          "Comptez trois à quatre mois d'études et de permis pour une maison, puis six à douze mois de chantier. Le planning est fixé avec vous dès l'esquisse et mis à jour chaque mois.",
      },
      {
        question: "Vous occupez-vous du permis d'urbanisme ?",
        answer:
          "Oui. Nous préparons et déposons le dossier, suivons l'instruction avec la commune et adaptons les plans si l'administration le demande.",
      },
      {
        question: "Suivez-vous le chantier ?",
        answer:
          "Chaque semaine, sur place, aux côtés des artisans. Un compte rendu illustré vous parvient après chaque visite, avec les décisions à prendre.",
      },
      {
        question: "Travaillez-vous en dehors de Gand ?",
        answer: "Nous travaillons en Flandre-Orientale et à Bruxelles. Au-delà, seulement pour des projets où nous pouvons garantir une visite de chantier par semaine.",
      },
      {
        question: "Rénovez-vous des bâtiments protégés ?",
        answer:
          "Oui, une part importante de nos projets touche au patrimoine. Nous montons le dossier avec l'agence du patrimoine et choisissons des artisans habitués aux techniques anciennes.",
      },
      {
        question: "Que recevons-nous à la livraison ?",
        answer: "Les clés, le dossier complet des plans tels que construits, les garanties des entreprises, et une visite un an plus tard pour régler ce que le temps révèle.",
      },
    ],
  },
  en: {
    title: (
      <>
        Everything you need to <em>know</em>
      </>
    ),
    subtitle: "What clients ask us before a first meeting.",
    more: { label: "Another question?", href: "#visite" },
    showMore: (n) => `Show ${n} more questions`,
    showLess: "Show fewer questions",
    items: [
      {
        question: "What does an architect's commission cost?",
        answer:
          "Our fees range from 8 to 12 % of the construction cost, depending on the scope. The first site visit is a flat fee (€180), deducted from the fees if the project goes ahead.",
      },
      {
        question: "How do we start a project with the studio?",
        answer:
          "It starts with a visit on site: we look at the building, listen to how you live in it and talk budget. You receive a written proposal within ten days.",
        link: { label: "Book a visit", href: "#visite" },
      },
      {
        question: "How long does a project take?",
        answer:
          "Allow three to four months of design and permit for a house, then six to twelve months on site. The schedule is set with you at sketch stage and updated every month.",
      },
      {
        question: "Do you handle the planning permit?",
        answer: "Yes. We prepare and file the application, follow it through with the municipality and adjust the drawings if the authority asks.",
      },
      {
        question: "Do you supervise the build?",
        answer: "Every week, on site, beside the builders. An illustrated report follows each visit, with the decisions to make.",
      },
      {
        question: "Do you work outside Ghent?",
        answer: "We work across East Flanders and in Brussels. Further away, only on projects where we can guarantee a site visit every week.",
      },
      {
        question: "Do you renovate listed buildings?",
        answer:
          "Yes, a large share of our work involves heritage. We prepare the file with the heritage agency and choose craftspeople used to traditional techniques.",
      },
      {
        question: "What do we receive at handover?",
        answer: "The keys, the full set of as-built drawings, the contractors' warranties, and a visit a year later to settle what time reveals.",
      },
    ],
  },
};

export function buildChapterFaqConfig(locale: Locale = "fr"): ChapterFaqConfig {
  return {
    locale,
    ...FAQ_COPY[locale],
    media: {
      src: "/library/card/pf-loft.webp",
      alt: locale === "fr" ? "Loft réhabilité par l'atelier : cuisine en chêne sous une mezzanine plantée" : "Loft reworked by the studio: oak kitchen under a planted mezzanine",
    },
    phoneVisible: 4,
    structuredData: true,
  };
}
/* ══ /FAQ ══════════════════════════════════════════════════════════════ */

/* ══ STORY (ChapterStory) ═════════════════════════════════════════════════
   The story chapter after the hero: title (one <em> accent word), optional
   emblem above it, paragraphs, an optional signed quote, and the pictures
   that drift in lanes beside / around / under the text. Media are
   atmosphere (decorative): stills and short forward loops whose poster is
   their first frame. Replace with the client's own; keep ≥ 9 items. Each
   still and poster: cut to its `ratio`, at 400w and ~2× the widest tile
   (640–800w), webp; the lanes pick one per tile size. */
import type { ChapterStoryContent, ChapterStoryMedia } from "./ChapterStory";

export type ChapterStoryConfig = ChapterStoryContent & { locale: Locale };

const sized = (name: string, large: number) => ({
  src: `/library/chapter/story-${name}-${large}.webp`,
  srcSet: `/library/chapter/story-${name}-400.webp 400w, /library/chapter/story-${name}-${large}.webp ${large}w`,
});
const still = (name: string, large: number, ratio: string): ChapterStoryMedia => ({ kind: "image", ...sized(name, large), ratio });
const clip = (src: string, poster: string, large: number, ratio: string): ChapterStoryMedia => {
  const p = sized(poster, large);
  return { kind: "video", src, poster: p.src, posterSrcSet: p.srcSet, ratio };
};

const STORY_MEDIA: ChapterStoryMedia[] = [
  clip("/library/card/pf-maison.mp4", "maison", 540, "4 / 5"),
  still("facade", 640, "4 / 5"),
  clip("/library/card/svc-interior.mp4", "interior", 640, "1 / 1"),
  still("drawing", 640, "1 / 1"),
  clip("/library/card/pf-pavillon.mp4", "pavillon", 540, "4 / 5"),
  still("model", 640, "4 / 5"),
  still("architecture", 800, "4 / 3"),
  clip("/library/card/pf-cafe.mp4", "cafe", 540, "4 / 5"),
  still("courtyard", 640, "1 / 1"),
  still("atelier", 800, "4 / 5"),
  clip("/library/card/svc-furniture.mp4", "furniture", 800, "4 / 3"),
  still("stair", 640, "4 / 5"),
  still("loft", 800, "4 / 5"),
  still("renovation", 800, "4 / 3"),
];

const STORY_COPY: Record<Locale, Omit<ChapterStoryContent, "media" | "emblem">> = {
  fr: {
    title: <>Des murs anciens, une <em>lumière</em> nouvelle</>,
    story: [
      "Atelier Halde est né en 2011 dans une ancienne corderie du Dok Noord, à Gand. Lies Verbeke y a réuni six architectes autour d'une conviction : la plupart des maisons ne demandent pas à être remplacées, mais relues.",
      "Nous relevons ce qui existe, nous gardons ce qui tient, et nous ouvrons le reste à la lumière. Maisons de maître, longères, ateliers : chaque projet garde ses murs et change de vie.",
    ],
    quote: {
      text: "« Une bonne transformation ne se remarque pas le premier jour. On la remarque un an plus tard, quand la maison semble avoir toujours été ainsi. »",
      name: "Lies Verbeke",
      role: "Fondatrice",
    },
  },
  en: {
    title: <>Old walls, new <em>light</em></>,
    story: [
      "Atelier Halde began in 2011 in a former rope works on Dok Noord, Ghent. Lies Verbeke gathered six architects around one conviction: most houses do not need replacing, they need rereading.",
      "We survey what stands, keep what holds and open the rest to the light. Town houses, farmhouses, workshops: every project keeps its walls and takes on a new life.",
    ],
    quote: {
      text: "“A good conversion goes unnoticed on the first day. You notice it a year later, when the house seems to have always been this way.”",
      name: "Lies Verbeke",
      role: "Founder",
    },
  },
};

export function buildChapterStoryConfig(locale: Locale = "fr"): ChapterStoryConfig {
  return { locale, emblem: <HaldeMark />, ...STORY_COPY[locale], media: STORY_MEDIA };
}
/* ══ /STORY ════════════════════════════════════════════════════════════ */

/* ══ CONTACT (ChapterContact) ═════════════════════════════════════════════
   Booking action, place, channels, hours (Monday → Sunday, one entry per
   service, null = closed) in the business's time zone, the place's picture.
   Times as "HH:MM–HH:MM". Destinations must be the client's real ones. */

import type { ChapterContactConfig } from "./ChapterContact";

const CONTACT_WEEK: (string | null)[][] = [
  [null, null],
  ["09:30–12:30", "13:30–18:00"],
  ["09:30–12:30", "13:30–18:00"],
  ["09:30–12:30", "13:30–18:00"],
  ["09:30–12:30", "13:30–17:00"],
  [null, null],
  [null, null],
];

const CONTACT_PICTURE = {
  src: "/library/chapter/contact-studio-1200.webp",
  srcSet: "/library/chapter/contact-studio-720.webp 720w, /library/chapter/contact-studio-1200.webp 1200w",
  width: 1200,
  height: 800,
};

const CONTACT_COPY: Record<Locale, ChapterContactConfig> = {
  fr: {
    title: <>Passer à <em>l'atelier</em></>,
    lead: "Au bord de l'eau, au Dok Noord. On vous reçoit sur rendez-vous, plans et maquettes sur la table.",
    action: { label: "Prendre rendez-vous", href: "/rendez-vous" },
    place: [{ label: "Atelier", value: "Dok Noord 4, 9000 Gand", href: "https://www.google.com/maps/search/?api=1&query=Dok%20Noord%204%2C%209000%20Gent", external: true }],
    channels: [
      { label: "Téléphone", value: "+32 9 234 56 78", href: "tel:+3292345678" },
      { label: "E-mail", value: "atelier@halde.example", href: "mailto:atelier@halde.example" },
      { label: "WhatsApp", value: "+32 470 12 34 56", href: "https://wa.me/32470123456", external: true },
      { label: "Instagram", value: "@atelierhalde", href: "https://www.instagram.com/", external: true },
    ],
    hours: {
      title: "Heures de visite",
      timeZone: "Europe/Brussels",
      services: ["Matin", "Après-midi"],
      week: CONTACT_WEEK,
      note: "Heure de Gand · visites sur rendez-vous.",
      labels: {
        days: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
        today: "Aujourd'hui",
        day: "Jour",
        closed: "Fermé",
        weekToggle: "Toute la semaine",
        openUntil: (time) => `Ouvert jusqu'à ${time}`,
        opensAt: (day, time) => (day ? `Fermé · ouvre ${day.toLowerCase()} à ${time}` : `Fermé · ouvre à ${time}`),
        closedForNow: "Fermé pour le moment",
      },
    },
    picture: { ...CONTACT_PICTURE, alt: "La façade en brique de l'atelier sur le quai du Dok Noord, porte ouverte sur les tables à dessin." },
    newTab: "nouvel onglet",
  },
  en: {
    title: <>Drop by the <em>studio</em></>,
    lead: "On the water at Dok Noord. We see you by appointment, drawings and models on the table.",
    action: { label: "Book a visit", href: "/visit" },
    place: [{ label: "Studio", value: "Dok Noord 4, 9000 Ghent", href: "https://www.google.com/maps/search/?api=1&query=Dok%20Noord%204%2C%209000%20Gent", external: true }],
    channels: [
      { label: "Phone", value: "+32 9 234 56 78", href: "tel:+3292345678" },
      { label: "E-mail", value: "atelier@halde.example", href: "mailto:atelier@halde.example" },
      { label: "WhatsApp", value: "+32 470 12 34 56", href: "https://wa.me/32470123456", external: true },
      { label: "Instagram", value: "@atelierhalde", href: "https://www.instagram.com/", external: true },
    ],
    hours: {
      title: "Visiting hours",
      timeZone: "Europe/Brussels",
      services: ["Morning", "Afternoon"],
      week: CONTACT_WEEK,
      note: "Ghent time · visits by appointment.",
      labels: {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        today: "Today",
        day: "Day",
        closed: "Closed",
        weekToggle: "Full week",
        openUntil: (time) => `Open until ${time}`,
        opensAt: (day, time) => (day ? `Closed · opens ${day} at ${time}` : `Closed · opens at ${time}`),
        closedForNow: "Closed for now",
      },
    },
    picture: { ...CONTACT_PICTURE, alt: "The studio's brick façade on the Dok Noord quay, its door open onto the drawing tables." },
    newTab: "new tab",
  },
};

export function buildChapterContactConfig(locale: Locale = "fr"): ChapterContactConfig {
  return CONTACT_COPY[locale];
}
/* ══ /CONTACT ══════════════════════════════════════════════════════════ */
