import { createContext, useContext, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import AccentPalette, { CUSTOM_SWATCH, inkFor } from "./AccentPalette";
import { Cover } from "./covers";
import FloatingPalette from "./FloatingPalette";
import { useLibraryLocale, type Locale, type Localized } from "./locale";
import { CATEGORY_LABEL, CATEGORY_ROUTE, getEntry, pad2, positionOf } from "./registry";
import StatusTag from "./StatusTag";

export type ShowcaseContext = { locale: Locale; accent: string; ink: string };

type Props = {
  /** Registry id → kicker, breadcrumb, version, status. */
  entryId: string;
  /** Display title; wrap the accent word in <em>. */
  title: (locale: Locale) => ReactNode;
  /** One sentence. */
  intro: Localized;
  tone?: "dark" | "light";
  defaultAccent?: string;
  /** Live accent palette. Off for pages that are not colourable. */
  palette?: boolean;
  /** The live component. Omitted → the honest "in construction" state. */
  children?: ReactNode | ((ctx: ShowcaseContext) => ReactNode);
};

const NEAR_WHITE = "#e9e6df";
const NEAR_INK = "#1c1c1f";

const SWATCHES: { id: string; color: string; label: Localized }[] = [
  { id: "indigo", color: "#818cf8", label: { fr: "Indigo Evoview", en: "Evoview indigo" } },
  { id: "chili", color: "#d83a2c", label: { fr: "Rouge piment", en: "Chili red" } },
  { id: "orange", color: "#fb923c", label: { fr: "Orange", en: "Orange" } },
  { id: "yellow", color: "#facc15", label: { fr: "Jaune", en: "Yellow" } },
  { id: "emerald", color: "#34d399", label: { fr: "Émeraude", en: "Emerald" } },
  { id: "sky", color: "#38bdf8", label: { fr: "Bleu ciel", en: "Sky blue" } },
  { id: "rose", color: "#fb7185", label: { fr: "Rose", en: "Rose" } },
  { id: "white", color: NEAR_WHITE, label: { fr: "Blanc cassé", en: "Off-white" } },
];

const COPY = {
  fr: {
    library: "Bibliothèque",
    breadcrumb: "Fil d'Ariane",
    paletteStrong: "Accent client",
    paletteRest: "le composant s'adapte à chaque marque",
    custom: "Couleur personnalisée",
    default: "Par défaut",
    buildingBody: "Ce package est en cours d'extraction depuis evoview.be. La démo live remplacera cette page dès sa première version.",
    back: "Retour à l'index",
  },
  en: {
    library: "Library",
    breadcrumb: "Breadcrumb",
    paletteStrong: "Client accent",
    paletteRest: "the component adapts to every brand",
    custom: "Custom colour",
    default: "Default",
    buildingBody: "This package is being extracted from evoview.be. The live demo replaces this page with its first version.",
    back: "Back to the index",
  },
} satisfies Record<Locale, Record<string, string>>;

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ShowcasePage({ entryId, title, intro, tone = "dark", defaultAccent, palette = true, children }: Props) {
  const { locale } = useLibraryLocale();
  const copy = COPY[locale];
  const entry = getEntry(entryId);
  const { index, total } = positionOf(entry);
  const fallback = defaultAccent ?? (tone === "dark" ? NEAR_WHITE : NEAR_INK);

  const [accentId, setAccentId] = useState("default");
  const [custom, setCustom] = useState("#7c3aed");
  const swatches = useMemo(
    () => [
      { id: "default", color: fallback, label: copy.default },
      ...SWATCHES.filter((s) => !same(s.color, fallback)).map((s) => ({ id: s.id, color: s.color, label: s.label[locale] })),
    ],
    [fallback, locale, copy.default],
  );
  const accent = accentId === CUSTOM_SWATCH ? custom : (swatches.find((s) => s.id === accentId) ?? swatches[0]).color;
  const ink = useMemo(() => inkFor(accent), [accent]);

  const style = {
    "--showcase-accent": accent,
    "--showcase-ink": ink,
  } as CSSProperties;

  const body = children === undefined ? <InConstruction entryId={entry.id} category={entry.category} /> : typeof children === "function" ? children({ locale, accent, ink }) : children;

  const paletteRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tonedByContent = useHasNavTone(stageRef);
  const ready = usePageReady(stageRef);
  const dark = tone === "dark" ? "dark" : undefined;
  const paletteProps = {
    swatches,
    value: accentId,
    custom,
    caption: { strong: copy.paletteStrong, rest: copy.paletteRest },
    customLabel: copy.custom,
    onChange: setAccentId,
    onCustom: setCustom,
  };

  /* Nav tone is declared per region, never on the wrapper: the navbar probe
     has no nesting priority, so a dark wrapper would win over every light
     chapter inside it. The stage is marked only while its content declares
     no tone of its own. */
  return (
    <div className="lib-showcase lib-toned ev-library" data-tone={tone} data-lib-ready={ready ? "" : undefined} style={style}>
      <header className="lib-showcase__head lib-rail" data-nav-tone={dark}>
        <nav aria-label={copy.breadcrumb} className="lib-crumbs lib-voice-state">
          <Link to="/">{copy.library}</Link>
          <span aria-hidden="true">/</span>
          <Link to={CATEGORY_ROUTE[entry.category]}>{CATEGORY_LABEL[entry.category][locale]}</Link>
          {entry.category !== "navbar" && (
            <>
              <span aria-hidden="true">/</span>
              <span className="lib-crumbs__index">
                {pad2(index)} / {pad2(total)}
              </span>
            </>
          )}
        </nav>
        <div className="lib-showcase__split">
          <h1 className="lib-display">{title(locale)}</h1>
          <div className="lib-showcase__aside">
            <p className="lib-lead">{intro[locale]}</p>
            <div className="lib-showcase__meta">
              <StatusTag status={entry.status} version={entry.version} />
            </div>
          </div>
        </div>
        {palette && (
          <div ref={paletteRef} className="lib-showcase__palette">
            <AccentPalette {...paletteProps} />
          </div>
        )}
      </header>
      <div ref={stageRef} className="lib-showcase__stage" data-nav-tone={tonedByContent ? undefined : dark}>
        <FrameTone.Provider value={tone}>{body}</FrameTone.Provider>
      </div>
      <div className="lib-showcase__tail" data-nav-tone={dark} aria-hidden="true" />
      {palette && <FloatingPalette {...paletteProps} anchor={paletteRef} tone={tone} accent={accent} />}
    </div>
  );
}

const FrameTone = createContext<"dark" | "light">("dark");

export type DemoTone = "dark" | "light" | "paper";
export type DemoRhythm = "flush" | "standard" | "compact" | "cinematic";

type VariantProps = {
  /** Component (and variant) name, set as a readout: `SelectorStage · paper`. */
  name: ReactNode;
  /** One sentence: when a client would choose this configuration. */
  when: ReactNode;
  /** Only when it indexes something real (a numbered sequence the reader
      steps through); never as decoration. */
  index?: { current: number; total: number };
  /** Environment of the component below. Omit when it sits on the frame
      tone or manages several tones itself. */
  tone?: DemoTone;
  /** Top padding the component brings (foundation chapter rhythm), so the
      frame can hold caption → content at the heading band. */
  rhythm?: DemoRhythm;
  id?: string;
  children: ReactNode;
};

/* One demo of a showcase page: a caption (name readout + when to choose it)
   over the live component. The frame owns the spacing, so every page has
   the same rhythm: header → first caption and caption → component sit at
   the heading band, variants are separated by a chapter band (or by the
   component's own chapter padding when it has one). No rules, no boxes.
   Contract: docs/SHOWCASE-CONTRACT.md. */
export function ShowcaseVariant({ name, when, index, tone, rhythm = "flush", id, children }: VariantProps) {
  const frame = useContext(FrameTone);
  const nameId = useId();
  const env = tone ?? frame;
  const bodyRef = useRef<HTMLDivElement>(null);
  useInkOffset(bodyRef);
  return (
    <section
      id={id}
      aria-labelledby={nameId}
      className={tone ? `lib-variant ev-tone-${tone}` : "lib-variant"}
      data-tone={env}
      data-frame={env === frame ? "" : undefined}
      data-rhythm={rhythm}
    >
      <header className="lib-variant__caption lib-rail">
        <p id={nameId} className="lib-voice-state lib-variant__name">
          {index && (
            <span className="lib-variant__index">
              {pad2(index.current)} / {pad2(index.total)}
            </span>
          )}
          {name}
        </p>
        <p className="lib-body lib-variant__when">{when}</p>
      </header>
      <div ref={bodyRef} className="lib-variant__body">
        {children}
      </div>
    </section>
  );
}

function topWithin(el: HTMLElement, body: HTMLElement): number {
  let top = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== body) {
    top += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  return cur === body ? top : Number.NaN;
}

const MEDIA = new Set(["IMG", "VIDEO", "CANVAS", "IFRAME", "PICTURE"]);

/* Top of the first ink and bottom of the last (text, media) inside `body`,
   in layout px: offsetTop chains, so reveal transforms still in flight
   never skew them. */
function inkBounds(body: HTMLElement): { top: number; bottom: number } | null {
  let best: number | null = null;
  let last = 0;
  let seen = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT);
  for (let node = walker.nextNode() as Element | null; node && seen < 4000; node = walker.nextNode() as Element | null) {
    seen += 1;
    const el = node instanceof HTMLElement ? node : node.tagName.toLowerCase() === "svg" ? (node.parentElement as HTMLElement | null) : null;
    if (!el) continue;
    const isMedia = MEDIA.has(node.tagName) || (node.tagName.toLowerCase() === "svg" && (node as SVGSVGElement).getBoundingClientRect().width > 40);
    const hasText = !isMedia && Array.from(node.childNodes).some((c) => c.nodeType === Node.TEXT_NODE && c.textContent?.trim());
    if (!isMedia && !hasText) continue;
    const style = getComputedStyle(el);
    // Layout boxes, not paint: media gated until decoded and copy waiting
    // for its reveal already occupy their place.
    if (style.display === "none" || el.offsetWidth <= 1 || el.offsetHeight <= 1 || style.clipPath.startsWith("inset(50%")) continue;
    let top = hasText ? parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth) : 0;
    let cur: HTMLElement | null = el;
    while (cur && cur !== body) {
      top += cur.offsetTop;
      cur = cur.offsetParent as HTMLElement | null;
    }
    if (cur !== body) continue; // fixed or outside the body's layout
    if (best === null || top < best) best = top;
    last = Math.max(last, top + el.offsetHeight);
  }
  return best === null ? null : { top: best, bottom: last };
}

const opaque = (color: string) => color !== "transparent" && !/rgba\(.*,\s*0\)$/.test(color);
const channels = (color: string) => (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
// Near-blacks #0c0c0d / #0e0e0e / #101011 are one environment (RULES §3).
const sameGround = (a: string, b: string) => {
  const [x, y] = [channels(a), channels(b)];
  return x.length === 3 && y.length === 3 && x.every((v, i) => Math.abs(v - y[i]) <= 6);
};

function opensOnOtherGround(body: HTMLElement): boolean {
  const band = getComputedStyle(body.parentElement ?? body).backgroundColor;
  let el = body.firstElementChild as HTMLElement | null;
  for (let depth = 0; el && depth < 6; depth += 1) {
    // A full-width ground only; a well or card at the top is not a cut.
    if (el.offsetHeight > 0 && el.offsetWidth >= body.offsetWidth * 0.9 && el.offsetTop <= 1) {
      const bg = getComputedStyle(el).backgroundColor;
      if (opaque(bg)) return !sameGround(bg, opaque(band) ? band : getComputedStyle(document.querySelector(".lib-showcase") ?? body).backgroundColor);
    }
    el = el.firstElementChild as HTMLElement | null;
  }
  return false;
}

/* Sticky elements report their current stick offset in offsetTop (a pinned
   scrub scene read mid-scroll would report the scroll distance). Read the
   in-flow layout instead: sticky elements are made static for the duration
   of one synchronous read and restored before anything paints. */
function inFlow<T>(body: HTMLElement, read: () => T): T {
  const pinned: [HTMLElement, string][] = [];
  for (const el of Array.from(body.querySelectorAll<HTMLElement>("*"))) {
    if (getComputedStyle(el).position === "sticky") pinned.push([el, el.style.position]);
  }
  for (const [el] of pinned) el.style.position = "static";
  try {
    return read();
  } finally {
    for (const [el, prev] of pinned) el.style.position = prev;
  }
}

/* Caption → component is measured, not assumed: whatever top padding a
   package brings (its chapter rhythm, a capped pinned scene, none), the
   body is pulled so its first ink sits one heading band under the caption,
   and padded so at least one chapter band follows its last ink.
   Measured on mount, once fonts settle, when media inside loads and when
   the width changes; never continuously. A new value is held back while
   the reader is scrolled into or past the variant (it would move content
   around the viewport) and applied once the variant is below its top
   again. The pull itself is clamped in CSS. */
function useInkOffset(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const body = ref.current;
    if (!body) return;
    let frame = 0;
    let applied = false;
    let pending: (() => void) | null = null;
    let width = body.offsetWidth;

    const read = () =>
      inFlow(body, () => {
        const ink = inkBounds(body);
        if (!ink) return null;
        // Only pull into space that looks like the caption's band: a component
        // opening on another background (a tone cut of its own) starts one
        // lead under the caption instead of sliding under it.
        if (opensOnOtherGround(body)) ink.top = 0;
        const content = body.offsetHeight - parseFloat(getComputedStyle(body).paddingBottom);
        // A demo that ends in its own footer (a client page) is the page's
        // end: no chapter band or frame tail between it and the library footer.
        const footers = body.querySelectorAll<HTMLElement>("footer");
        const last = footers[footers.length - 1];
        const endsInFooter = Boolean(last && last.offsetHeight > 0 && Math.abs(topWithin(last, body) + last.offsetHeight - content) <= 2);
        return { pad: `${Math.round(ink.top)}px`, trail: `${Math.max(0, Math.round(content - ink.bottom))}px`, endsInFooter };
      });

    const apply = (next: NonNullable<ReturnType<typeof read>>) => {
      body.style.setProperty("--lib-variant-pad", next.pad);
      body.style.setProperty("--lib-variant-trail", next.trail);
      body.parentElement?.toggleAttribute("data-ends-in-footer", next.endsInFooter);
      applied = true;
    };

    const onScroll = () => {
      if (pending && (body.parentElement ?? body).getBoundingClientRect().top >= 0) {
        const run = pending;
        pending = null;
        run();
      }
    };

    const measure = () => {
      frame = 0;
      const next = read();
      if (!next) return;
      const same =
        body.style.getPropertyValue("--lib-variant-pad") === next.pad &&
        body.style.getPropertyValue("--lib-variant-trail") === next.trail &&
        (body.parentElement?.hasAttribute("data-ends-in-footer") ?? false) === next.endsInFooter;
      if (same) {
        pending = null;
        return;
      }
      if (applied && (body.parentElement ?? body).getBoundingClientRect().top < 0) {
        pending = () => apply(next);
        return;
      }
      apply(next);
    };

    measure();
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(() => {
      if (body.offsetWidth === width) return;
      width = body.offsetWidth;
      schedule();
    });
    ro.observe(body);
    // Media sized only once loaded can move the first ink without resizing
    // the body (pinned scenes).
    body.addEventListener("load", schedule, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.fonts?.ready.then(schedule);
    return () => {
      ro.disconnect();
      body.removeEventListener("load", schedule, true);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/* `data-lib-ready` on the frame once fonts are loaded and every eager image
   in the stage has settled (decoded or failed): the signal scripts wait
   for (scripts/covers). Lazy images are left to the viewport. Capped at
   10 s so a stuck request never hides the page from tooling. */
function usePageReady(ref: RefObject<HTMLElement | null>): boolean {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    let timer = 0;
    const started = performance.now();
    const check = () => {
      const el = ref.current;
      const images = el ? Array.from(el.querySelectorAll("img")).filter((img) => img.loading !== "lazy") : [];
      const settled = images.every((img) => img.complete);
      const fonts = typeof document.fonts === "undefined" || document.fonts.status === "loaded";
      if ((el && settled && fonts) || performance.now() - started > 10000) setReady(true);
      else timer = window.setTimeout(check, 120);
    };
    timer = window.setTimeout(check, 120);
    return () => window.clearTimeout(timer);
  }, [ref]);
  return ready;
}

const TONED = ".ev-tone-dark, .ev-tone-light, .ev-tone-paper, [data-nav-tone]";
const BRIDGED = "data-nav-tone-bridged";

/* True once the stage content declares its own tone. Packages that only set
   foundation's `ev-tone-*` class on a section root (no `data-nav-tone`) are
   bridged: outermost dark roots get `data-nav-tone="dark"`. Nested tone
   elements (cards, modals) are ignored — the navbar probe is a horizontal
   line, so a dark card inside a light chapter must not darken the bar. */
function useHasNavTone(ref: RefObject<HTMLElement | null>): boolean {
  const [has, setHas] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      /* A dark variant left on the frame tone (no `tone`, so no ev-tone
         class) declares nothing; once another variant does, the stage stops
         being marked and the bar would turn light over it. Mark the variant,
         or only its caption when the component holds light grounds of its
         own (those regions then speak for themselves). */
      const wanted = new Set<HTMLElement>();
      for (const v of Array.from(el.querySelectorAll<HTMLElement>(".lib-variant[data-tone='dark']:not(.ev-tone-dark)"))) {
        const islands = v.querySelector(".ev-tone-light, .ev-tone-paper, [data-nav-tone]:not([data-nav-tone='dark'])");
        const target = islands ? v.querySelector<HTMLElement>(".lib-variant__caption") : v;
        if (target) wanted.add(target);
      }
      for (const n of Array.from(el.querySelectorAll<HTMLElement>("[data-nav-tone-variant]"))) {
        if (!wanted.has(n)) {
          n.removeAttribute("data-nav-tone");
          n.removeAttribute("data-nav-tone-variant");
        }
      }
      for (const n of wanted) {
        if (!n.hasAttribute("data-nav-tone-variant")) {
          n.setAttribute("data-nav-tone-variant", "");
          n.setAttribute("data-nav-tone", "dark");
        }
      }
      const roots =Array.from(el.querySelectorAll<HTMLElement>(TONED)).filter((n) => {
        const outer = n.parentElement?.closest(TONED);
        return !outer || outer === el || !el.contains(outer);
      });
      for (const n of Array.from(el.querySelectorAll<HTMLElement>(`[${BRIDGED}]`))) {
        if (!roots.includes(n) || !n.classList.contains("ev-tone-dark")) {
          n.removeAttribute("data-nav-tone");
          n.removeAttribute(BRIDGED);
        }
      }
      for (const n of roots) {
        if (n.classList.contains("ev-tone-dark") && !n.hasAttribute("data-nav-tone")) {
          n.setAttribute(BRIDGED, "");
          n.setAttribute("data-nav-tone", "dark");
        }
      }
      setHas(roots.length > 0);
    };
    sync();
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(sync);
    });
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-nav-tone"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);
  return has;
}

function InConstruction({ entryId, category }: { entryId: string; category: keyof typeof CATEGORY_ROUTE }) {
  const { locale } = useLibraryLocale();
  const copy = COPY[locale];
  return (
    <section className="lib-rail lib-building">
      <div className="lib-building__media lib-well">
        <Cover id={entryId} variant="card" />
      </div>
      <div className="lib-building__copy">
        <p className="lib-body">{copy.buildingBody}</p>
        <Link to={CATEGORY_ROUTE[category]} className="lib-command lib-command--quiet">
          {copy.back}
        </Link>
      </div>
    </section>
  );
}
