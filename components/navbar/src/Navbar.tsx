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
  // section under the bar also colours the reticle's pupil and lights its pill.
  const { tone, section, color } = useNavState(config.sections, config.initialTone, config.accent);
  useIdleTrayPreload(config);

  const activeKey = config.activeKey ?? config.deck.find((entry) => entry.section === section)?.key;
  // Multi-page: the live pill is this page; one-page: the section in view.
  const current = config.activeKey !== undefined ? "page" : "location";

  return (
    <header
      data-tone={tone}
      data-reticle={config.reticle ?? "eye"}
      className={`ev-navbar fixed top-0 left-0 right-0 z-50 flex justify-center px-4${prefersReducedMotion ? " reduced-motion" : ""}`}
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        "--nav-orb-accent": "currentColor",
        ...(config.accent ? { "--nav-accent": config.accent } : null),
        ...config.vars,
      } as CSSProperties}
    >
      <div className="nav-rail relative z-20 flex w-full items-center justify-center">
        <NavFinderMobile config={config} activeKey={activeKey} current={current} accent={color} />
        <NavFinder config={config} activeKey={activeKey} current={current} accent={color} />
      </div>
    </header>
  );
}
