import type { MouseEvent, ReactNode } from "react";
import type { NavIconKey } from "./NavIcons";

/* The whole navbar is driven by one NavbarConfig object. Nothing in the
   components references site data directly: every label, destination, colour
   and action comes through this contract, so adapting the navbar to a site
   means editing `navbar.config.tsx` and nothing else. */

/** A page section the bar can sit over, in document order. `color` drives the
    reticle's pupil while the reader is inside that section. */
export type NavSection = { id: string; color: string };

export type NavDeckEntry = {
  /** Stable identifier; also the key into `NavbarConfig.trays`. */
  key: string;
  label: string;
  /** One of the built-in marks, or any inline SVG/element sized 1em
      (a lucide icon works as is). */
  icon: NavIconKey | ReactNode;
  /** Anchor or route the pill navigates to. Omit to render a button. */
  href?: string;
  /** Section id (see `sections`) that marks this pill as the live one on a
      one-page site. Multi-page sites use `NavbarConfig.activeKey` instead. */
  section?: string;
  /** Accent used by the pill's own marks and its tray rows. */
  accent: string;
  /** Section colour: replaces the pill's icon with a dot (blinking while
      live) and grades its tray (card overlay and edge, row orbs) over any
      row `accent`. Multi-page sites: also the REC dots (page pill, tray
      badge) and the finder's eye while this pill is live. Default
      `--nav-rec-dot` for the dots and the site accent for the eye. */
  dot?: string;
  /** The one filled pill (inverse gloss). At most one entry. */
  cta?: boolean;
  /** Replaces the icon + label body (e.g. `<NavLangSwitch>`); `label` then
      becomes the aria-label. */
  content?: ReactNode;
  /** Clicking leaves the menu open (in-place toggles such as a language switch). */
  keepOpen?: boolean;
};

export type NavTrayItem = {
  id: string;
  title: string;
  /** Short description: the caption under the title on rows (mobile, and
      desktop `rows` trays). Desktop cards show the title only. */
  meta?: string;
  /** Overrides the deck entry's accent for this row (card hover grade and
      edge, row orb). */
  accent?: string;
  /** Desktop card artwork. An image URL (banner crop, 900×216 ≈ 4.2:1,
      fades in once decoded) or a rendered node (live preview) filling the
      card. Shown monochrome at rest, the accent arriving on hover. */
  cover?: string | ReactNode;
  /** Route or anchor: the entry renders as `<a href>` (route it with
      `useNavbarLinks`). */
  href?: string;
  /** Action run on selection (open a modal, scroll…). With `href`, runs
      first; `event.preventDefault()` cancels the navigation. Give every
      entry an `href`, an `onSelect`, or both. */
  onSelect?: (event: MouseEvent<HTMLElement>) => void;
};

export const NAV_TRAY_LAYOUTS = ["cards", "rows"] as const;
export type NavTrayLayout = (typeof NAV_TRAY_LAYOUTS)[number];

/** Reticle style on the finder pill: `eye` = one solid accent almond with a
    pupil (default); `hud` = outlined eyelids that blink on hover. */
export const NAV_RETICLES = ["eye", "hud"] as const;
export type NavReticle = (typeof NAV_RETICLES)[number];

export type NavTray =
  | {
      kind: "items";
      /** Unused since 2.6.0 (trays have no header); kept so existing
          configs still type-check. */
      unit?: string;
      /** Static rows, or a loader so copy stays off the critical path. */
      items: NavTrayItem[] | (() => Promise<NavTrayItem[]>);
      /** Desktop presentation: `cards` = one full-width cover banner per
          entry, stacked; `rows` = 2×2 numbered rows. Default: `cards` when
          any entry has a `cover`, else `rows`. Set it explicitly on a
          loader tray so the loading skeleton has the right shape. Mobile
          always shows single-column rows. */
      layout?: NavTrayLayout;
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
  /** Mobile tray header link to the pill's own `href` (touch has no
      hover/click split, so the tray offers it explicitly). */
  sectionLink: string;
  navAria: string;
  openAria: string;
  closeAria: string;
  homeAria: string;
  loading: string;
  /** Pill on the tray entry for the current page. Default "Active page". */
  currentItem?: string;
};

export type NavTrackPayload = Record<string, string | number | boolean | null | undefined>;

/** CSS custom properties from the tokens block at the top of navbar.css,
    settable per site without touching the stylesheet. */
export type NavbarVars = Partial<Record<`--nav-${string}`, string>>;

export type NavbarConfig = {
  /** Wordmark element. Black artwork is inverted on the dark tone unless
      `vars["--nav-logo-dark-filter"]` is `none`. */
  logo: ReactNode;
  homeHref: string;
  labels: NavbarLabels;
  /** Brand accent: focus ring, CTA glow, mobile pill tiles, language switch,
      and the reticle pupil when no section colour applies. */
  accent?: string;
  /** Token overrides, e.g. `{ "--nav-logo-h-desktop": "2.1em" }`. */
  vars?: NavbarVars;
  reticle?: NavReticle;
  /** One-page sites: sections in document order (ids must exist in the page).
      Multi-page sites: `[]`. Must be a module-level constant: the scroll
      store is cached by reference. */
  sections: NavSection[];
  /** Live pill on a multi-page site (by deck key). Overrides `sections`. */
  activeKey?: string;
  /** One-page sites: show the current-page pill (dot + deck label) for the
      section in view, and blink that entry's dot. Off by default. */
  sectionPill?: boolean;
  /** Current route (no trailing slash). The tray entry whose `href` equals it
      is marked as the active page. `withRoute` sets it; unset, the tray
      reads `window.location.pathname`. */
  currentPath?: string;
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
