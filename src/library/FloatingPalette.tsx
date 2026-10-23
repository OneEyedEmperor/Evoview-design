import { useEffect, useId, useState, type ComponentProps, type RefObject } from "react";
import { useMediaQuery } from "../../components/foundation/src/useMediaQuery";
import { useBackgroundSuspended } from "../../components/foundation/src/suspension";
import AccentPalette from "./AccentPalette";
import { useLibraryLocale } from "./locale";

/* Glass capsule of the same swatches, bottom corner, shown once the header
   palette leaves the viewport or (desktop) while a modal suspends the page.
   `data-ev-keep-interactive` exempts it from the modal packages' inert walk
   (see components/dossier/README.md). While a modal is open it is pointer
   only: mousedown never moves focus out of the dialog, and the dialog's Tab
   trap does not reach it. On a phone a modal owns the whole screen (its
   last item, dock and CTA sit where the orb would), so the orb steps aside;
   it also steps aside while the navbar's mobile menu is open. */

const COPY = {
  fr: { open: "Changer l'accent", close: "Replier la palette" },
  en: { open: "Change the accent", close: "Collapse the palette" },
};

/* Fixed navbar: 0.75rem top inset + 3.5em capsule (≈ 62 px) + air. */
const NAV_BAND = 80;

type Props = ComponentProps<typeof AccentPalette> & {
  anchor: RefObject<HTMLElement | null>;
  tone: "dark" | "light";
  accent: string;
};

function useMobileMenuOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => setOpen(Boolean(document.querySelector('.ev-navbar .nav-finder--mobile[data-open="true"]')));
    const bar = document.querySelector(".ev-navbar");
    if (!bar) return;
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(bar, { subtree: true, attributes: true, attributeFilter: ["data-open"] });
    return () => mo.disconnect();
  }, []);
  return open;
}

export default function FloatingPalette({ anchor, tone, accent, ...palette }: Props) {
  const { locale } = useLibraryLocale();
  const suspended = useBackgroundSuspended();
  const phone = !useMediaQuery("(min-width: 768px)");
  const menuOpen = useMobileMenuOpen();
  const [away, setAway] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  /* The header palette counts as gone once it reaches the navbar's band:
     it fades there (data-away) instead of showing through the bar's glass,
     and this capsule takes over in the same frame. */
  useEffect(() => {
    const el = anchor.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const gone = entry.intersectionRatio < 0.98;
        el.toggleAttribute("data-away", gone && entry.boundingClientRect.top < NAV_BAND + 4);
        setAway(gone);
      },
      { rootMargin: `-${NAV_BAND}px 0px 0px 0px`, threshold: [0, 0.98, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [anchor]);

  // The page's end: the footer carries its own locale toggle bottom-right.
  const [atFooter, setAtFooter] = useState(false);
  useEffect(() => {
    const footer = document.querySelector(".lib-footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const visible = !menuOpen && (suspended ? !phone : away && !atFooter);
  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  return (
    <div
      className="lib-float"
      data-ev-keep-interactive=""
      data-visible={visible || undefined}
      data-open={open || undefined}
      data-glass={suspended ? "dark" : tone}
      inert={!visible}
      onMouseDown={suspended ? (e) => e.preventDefault() : undefined}
    >
      <div id={panelId} className="lib-float__panel">
        <AccentPalette {...palette} compact />
      </div>
      <button
        type="button"
        className="lib-float__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? COPY[locale].close : COPY[locale].open}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ background: accent }} />
      </button>
    </div>
  );
}
