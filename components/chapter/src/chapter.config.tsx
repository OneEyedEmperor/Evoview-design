import type { ReactNode } from "react";
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
  /** In-page action, e.g. reopening the cookie banner. */
  onSelect?: () => void;
};

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
