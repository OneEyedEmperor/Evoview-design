import type { ReactNode } from "react";

/* Built-in navigation marks. `services` and `portfolio` share eyelids and
   HUD corners (square signal pixels vs. a small iris); `method` is the
   spiral eye; `envelope` is a closed envelope. The group with class
   `nav-blinking-eye` is what the CSS double-blinks on hover. */
export type NavIconKey = "services" | "portfolio" | "method" | "envelope";

export const NAV_ICONS: Record<NavIconKey, ReactNode> = {
  services: (
    <>
      <path d="M7 4H4v3m13-3h3v3M4 17v3h3m13-3v3h-3" />
      <g className="nav-blinking-eye">
        <path d="M3 12Q12 1 21 12Q12 23 3 12Z" />
        <path
          d="M5.25 10.75h2v2h-2ZM8 8.25h2v2H8ZM8 10.75h2v2H8ZM8 13.25h2v2H8ZM10.75 9.75h2v2h-2ZM10.75 14.25h2v2h-2ZM13.5 7.75h2v2h-2ZM13.5 10.25h2v2h-2ZM13.5 12.75h2v2h-2ZM16.25 11.25h2v2h-2Z"
          fill="currentColor"
          stroke="none"
        />
      </g>
    </>
  ),
  portfolio: (
    <>
      <path d="M7 4H4v3m13-3h3v3M4 17v3h3m13-3v3h-3" />
      <g className="nav-blinking-eye">
        <path d="M3 12Q12 1 21 12Q12 23 3 12Z" />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      </g>
    </>
  ),
  envelope: (
    <g transform="translate(1.2 1.2) scale(0.9)">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </g>
  ),
  method: (
    <g className="nav-blinking-eye">
      <path d="M2 12c2.6-3.8 5.8-6 10-6s7.4 2.2 10 6c-2.6 3.8-5.8 6-10 6" />
      <circle cx="12" cy="12" r="3.7" fill="var(--nav-orb-accent)" stroke="none" />
      <path d="M12 18a6 6 0 0 1-6-6 5 5 0 0 1 5-5 4.5 4.5 0 0 1 4.5 4.5 3.3 3.3 0 0 1-3.3 3.3 2.3 2.3 0 0 1-2.3-2.3 1.4 1.4 0 0 1 1.4-1.4" />
    </g>
  ),
};

export function isNavIconKey(icon: unknown): icon is NavIconKey {
  return typeof icon === "string" && icon in NAV_ICONS;
}

export function NavIcon({ icon, size = 24, className }: { icon: NavIconKey; size?: number | string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {NAV_ICONS[icon]}
    </svg>
  );
}

/** Renders a built-in mark or a custom node at the deck's icon size. */
export function DeckIcon({ icon }: { icon: NavIconKey | ReactNode }) {
  if (isNavIconKey(icon)) return <NavIcon icon={icon} size="1.25em" className="nav-deck-icon" />;
  return <span aria-hidden="true" className="nav-deck-icon nav-deck-icon--custom">{icon}</span>;
}
