import type { CSSProperties } from "react";
import NavFinder from "./NavFinder";
import NavFinderMobile from "./NavFinderMobile";
import type { NavbarConfig } from "./types";
import { useNavState } from "./useNavState";
import { useIdleTrayPreload } from "./useNavTrays";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import "./navbar.css";

/* One finder, two unfolds: sideways on desktop, downward on mobile. The bar
   owns no destination: every entry runs the action declared in the config. */
export default function Navbar({ config }: { config: NavbarConfig }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Light glass over the light sections, dark glass over the dark ones; the
  // section under the bar also colours the reticle's dot and lights its pill.
  const { tone, section, color } = useNavState(config.sections, config.initialTone);
  useIdleTrayPreload(config);

  return (
    <header
      data-tone={tone}
      className={`ev-navbar fixed top-0 left-0 right-0 z-50 flex justify-center px-4${prefersReducedMotion ? " reduced-motion" : ""}`}
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        "--nav-orb-accent": "currentColor",
      } as CSSProperties}
    >
      <div className="nav-rail relative z-20 flex w-full items-center justify-center">
        <NavFinderMobile config={config} accent={color} />
        <NavFinder config={config} activeSection={section} accent={color} />
      </div>
    </header>
  );
}
