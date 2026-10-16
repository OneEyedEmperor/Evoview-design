import type { MouseEvent, ReactNode } from "react";
import type { NavIconKey } from "./NavIcons";

/* The whole navbar is driven by one NavbarConfig object. Nothing in the
   components references site data directly: every label, destination, colour
   and action comes through this contract, so adapting the navbar to a site
   means editing `navbar.config.tsx` and nothing else. */

/** A page section the bar can sit over, in document order. `color` drives the
    reticle's REC dot while the reader is inside that section. */
export type NavSection = { id: string; color: string };

export type NavDeckEntry = {
  /** Stable identifier; also the key into `NavbarConfig.trays`. */
  key: string;
  label: string;
  /** One of the built-in marks, or any inline SVG/element sized 1em. */
  icon: NavIconKey | ReactNode;
  /** Anchor the pill navigates to (`#services`). Omit to render a button. */
  href?: string;
  /** Section id (see `sections`) that marks this pill as the live one. */
  section?: string;
  /** Accent used by the pill's own marks and its tray rows. */
  accent: string;
  /** The one filled pill (inverse gloss). At most one entry. */
  cta?: boolean;
};

export type NavTrayItem = {
  id: string;
  title: string;
  /** Small technical caption under the title (status, category, phase). */
  meta?: string;
  /** Overrides the deck entry's accent for this row. */
  accent?: string;
  onSelect: () => void;
};

export type NavTray =
  | {
      kind: "items";
      /** Counter noun shown in the tray header: "04 dossiers". */
      unit: string;
      /** Static rows, or a loader so copy stays off the critical path. */
      items: NavTrayItem[] | (() => Promise<NavTrayItem[]>);
    }
  | {
      kind: "cta";
      copy: string;
      label: string;
      note?: string;
      onSelect: () => void;
    };

export type NavbarLabels = {
  /** Resting word on the finder pill. */
  menu: string;
  /** Word the mobile finder morphs into while open. */
  close: string;
  /** Mobile tray header link to the section itself. */
  sectionLink: string;
  navAria: string;
  openAria: string;
  closeAria: string;
  homeAria: string;
  loading: string;
};

export type NavTrackPayload = Record<string, string | number | boolean | null | undefined>;

export type NavbarConfig = {
  /** Wordmark element. Must be black artwork: the dark tone inverts it. */
  logo: ReactNode;
  homeHref: string;
  labels: NavbarLabels;
  /** Must be a module-level constant: the scroll store is cached by reference. */
  sections: NavSection[];
  /** Tone rendered before the first scroll probe (server render, hydration).
      Set "dark" on a site whose first screen is dark. Default "light". */
  initialTone?: "light" | "dark";
  deck: NavDeckEntry[];
  /** Keyed by deck `key`. A deck entry without a tray navigates directly. */
  trays: Partial<Record<string, NavTray>>;
  /** Called before the menu closes on a pill click. Call
      `event.preventDefault()` to replace the anchor navigation. */
  onSection?: (entry: NavDeckEntry, event: MouseEvent<HTMLElement>) => void;
  /** Analytics sink; events: nav_click, nav_modal_open, cta_click. */
  track?: (name: string, payload: NavTrackPayload) => void;
};
