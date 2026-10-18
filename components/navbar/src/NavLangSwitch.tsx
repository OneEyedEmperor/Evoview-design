import type { ReactNode } from "react";
import { DeckIcon } from "./NavIcons";
import "./navbar.lang.css";

/* Language switch for a deck entry's `content`: every code stays visible, a
   thumb in the brand accent sits under the active one and slides across when
   the locale flips. Pair with `keepOpen: true` on the entry and flip the
   locale from `config.onSection`. */
export function NavLangSwitch({ locale, locales, icon }: { locale: string; locales: readonly string[]; icon: ReactNode }) {
  const index = Math.max(0, locales.indexOf(locale));
  return (
    <span className="nav-lang" style={{ "--nav-lang-count": locales.length, "--nav-lang-index": index } as React.CSSProperties}>
      <DeckIcon icon={icon} />
      <span className="nav-lang-track" aria-hidden="true">
        <span className="nav-lang-thumb" />
        {locales.map((code) => (
          <span key={code} className="nav-lang-opt" data-active={code === locale || undefined}>
            {code.toUpperCase()}
          </span>
        ))}
      </span>
    </span>
  );
}
