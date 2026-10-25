import { useMemo, type CSSProperties } from "react";
import NavFinder from "./NavFinder";
import NavFinderMobile from "./NavFinderMobile";
import type { NavbarConfig } from "./types";
import { useNavState } from "./useNavState";
import { useIdleTrayPreload } from "./useNavTrays";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import "./navbar.css";

/* One finder, two unfolds: sideways on desktop, downward on mobile. The bar
   owns no destination: every entry runs the action declared in the config. */
export default function Navbar({ config: siteConfig }: { config: NavbarConfig }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Light glass over the light sections, dark glass over the dark ones; the
  // section under the bar also colours the reticle's pupil and lights its pill.
  const { tone, section, color } = useNavState(siteConfig.sections, siteConfig.initialTone, siteConfig.accent);

  const activeKey = siteConfig.activeKey ?? siteConfig.deck.find((entry) => entry.section === section)?.key;
  // Multi-page: the live pill is this page; one-page: the section in view.
  const current = siteConfig.activeKey !== undefined ? "page" : "location";

  // The live pill leads the deck where it carries the REC marks (multi-page,
  // or one-page with `sectionPill`); the rest keep their order. A plain
  // one-page deck stays fixed. The menu is closed whenever this changes, as
  // scrolling dismisses it.
  const leads = current === "page" || Boolean(siteConfig.sectionPill);
  const config = useMemo(() => {
    const index = !leads || activeKey === undefined ? -1 : siteConfig.deck.findIndex((entry) => entry.key === activeKey);
    // The CTA keeps its closing slot.
    if (index <= 0 || siteConfig.deck[index].cta) return siteConfig;
    const deck = [siteConfig.deck[index], ...siteConfig.deck.slice(0, index), ...siteConfig.deck.slice(index + 1)];
    return { ...siteConfig, deck };
  }, [siteConfig, leads, activeKey]);
  useIdleTrayPreload(config);
  const liveDot = current === "page" || config.sectionPill ? config.deck.find((entry) => entry.key === activeKey)?.dot : undefined;
  const eye = liveDot ?? color;

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
        ...(liveDot ? { "--nav-rec-dot": liveDot } : null),
      } as CSSProperties}
    >
      <div className="nav-rail relative z-20 flex w-full items-center justify-center">
        <NavFinderMobile config={config} activeKey={activeKey} current={current} accent={eye} />
        <NavFinder config={config} activeKey={activeKey} current={current} accent={eye} />
      </div>
    </header>
  );
}
