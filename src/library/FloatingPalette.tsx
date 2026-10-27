import { useEffect, useId, useState, type ComponentProps } from "react";
import { useMediaQuery } from "../../components/foundation/src/useMediaQuery";
import { useBackgroundSuspended } from "../../components/foundation/src/suspension";
import AccentPalette from "./AccentPalette";
import { useLibraryLocale } from "./locale";

/* The page's accent picker: a glass capsule in the bottom corner, shown at
   all times except over the footer (and, desktop only, kept while a modal
   suspends the page).
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

type Props = ComponentProps<typeof AccentPalette> & {
  tone: "dark" | "light";
  accent: string;
  /** Selector of an in-page palette: the float steps aside while it is on screen. */
  yieldTo?: string;
};

function useOnScreen(selector: string | undefined): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = selector ? document.querySelector(selector) : null;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [selector]);
  return on;
}

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

export default function FloatingPalette({ tone, accent, yieldTo, ...palette }: Props) {
  const { locale } = useLibraryLocale();
  const suspended = useBackgroundSuspended();
  const phone = !useMediaQuery("(min-width: 768px)");
  const menuOpen = useMobileMenuOpen();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // The page's end: the footer carries its own locale toggle bottom-right.
  const atFooter = useOnScreen(".lib-footer");
  const yielded = useOnScreen(yieldTo);

  const visible = !menuOpen && (suspended ? !phone : !atFooter && !yielded);
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
