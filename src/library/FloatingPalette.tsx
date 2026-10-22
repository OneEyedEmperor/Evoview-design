import { useEffect, useId, useState, type ComponentProps, type RefObject } from "react";
import { useBackgroundSuspended } from "../../components/foundation/src/suspension";
import AccentPalette from "./AccentPalette";
import { useLibraryLocale } from "./locale";

/* Glass capsule of the same swatches, bottom corner, shown once the header
   palette leaves the viewport or while a modal suspends the page.
   `data-ev-keep-interactive` exempts it from the modal packages' inert walk
   (see components/dossier/README.md). While a modal is open it is pointer
   only: mousedown never moves focus out of the dialog, and the dialog's Tab
   trap does not reach it. */

const COPY = {
  fr: { open: "Changer l'accent", close: "Replier la palette" },
  en: { open: "Change the accent", close: "Collapse the palette" },
};

type Props = ComponentProps<typeof AccentPalette> & {
  anchor: RefObject<HTMLElement | null>;
  tone: "dark" | "light";
  accent: string;
};

export default function FloatingPalette({ anchor, tone, accent, ...palette }: Props) {
  const { locale } = useLibraryLocale();
  const suspended = useBackgroundSuspended();
  const [away, setAway] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const el = anchor.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [anchor]);

  const visible = away || suspended;
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
