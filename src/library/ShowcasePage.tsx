import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChannelSwitch } from "../../components/foundation/src/ChannelSwitch";
import { OrbFill } from "../../components/foundation/src/OrbFill";
import { TextFill } from "../../components/foundation/src/TextFill";
import { inkFor } from "./AccentPalette";
import { EntryArt, EntryThumb, warmEntryArt } from "./art";
import { Cover } from "./covers";
import { useAccentChoice } from "./accentChoice";
import FloatingPalette from "./FloatingPalette";
import LibraryHero from "./LibraryHero";
import { CATEGORY_DOT } from "./library.navbar.config";
import { useLibraryLocale, type Locale, type Localized } from "./locale";
import { CATEGORY_LABEL, CATEGORY_ROUTE, entriesOf, getEntry, pad2, type Category, type RegistryEntry } from "./registry";
import StatusTag from "./StatusTag";
import { useNavEyeAccent } from "./useNavEyeAccent";

export type ShowcaseContext = { locale: Locale; accent: string; ink: string };

type Props = {
  /** Registry id → version, status. */
  entryId: string;
  /** Display title; wrap the accent word in <em>. */
  title: (locale: Locale) => ReactNode;
  tone?: "dark" | "light";
  defaultAccent?: string;
  /** Live accent palette. Off for pages that are not colourable. */
  palette?: boolean;
  /** The live component. Omitted → the honest "in construction" state. */
  children?: ReactNode | ((ctx: ShowcaseContext) => ReactNode);
};

const NEAR_WHITE = "#e9e6df";
const NEAR_INK = "#1c1c1f";

export const SWATCHES: { id: string; color: string; label: Localized }[] = [
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
    paletteStrong: "Accent client",
    paletteRest: "le composant s'adapte à chaque marque",
    custom: "Couleur personnalisée",
    default: "Par défaut",
    buildingBody: "Ce package est en cours d'extraction depuis evoview.be. La démo live remplacera cette page dès sa première version.",
    back: "Retour à l'index",
    pages: "Toutes les pages",
    category: "Catégorie de pages",
  },
  en: {
    paletteStrong: "Client accent",
    paletteRest: "the component adapts to every brand",
    custom: "Custom colour",
    default: "Default",
    buildingBody: "This package is being extracted from evoview.be. The live demo replaces this page with its first version.",
    back: "Back to the index",
    pages: "All pages",
    category: "Page category",
  },
} satisfies Record<Locale, Record<string, string>>;

/* The homepage's section bars, one per page of the category, the shown
   page's lit; it draws in on arrival. The lit bar is one segment sliding
   over the tracks, so previewing another page glides it there and back. */
function GroupBars({ entry, shown }: { entry: RegistryEntry; shown: RegistryEntry }) {
  const category = shown.category;
  const group = entriesOf(category);
  const dot = (CATEGORY_DOT as Partial<Record<Category, string>>)[category];
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSeen(true));
    return () => cancelAnimationFrame(frame);
  }, [entry.id]);
  const lit = group.findIndex((e) => e.id === shown.id);
  return (
    <span
      className="lib-bars lib-showcase__group-bars"
      data-role="separator"
      data-seen={seen || undefined}
      style={{ gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))`, "--lib-bars-n": group.length, "--lib-bars-i": Math.max(lit, 0) } as CSSProperties}
      aria-hidden="true"
    >
      {group.map((e) => (
        <span key={e.id} className="lib-bars__bar" />
      ))}
      <span className="lib-showcase__bars-lit" data-off={lit < 0 || undefined}>
        {dot && <span className="lib-bars__dot" style={{ "--lib-bar-dot": dot } as CSSProperties} />}
      </span>
    </span>
  );
}

/* The categories the page screen can list. */
const SCREEN_CATEGORIES: Category[] = ["layouts", "components"];

/* Pointing at a page in the list previews it on the player. Pointing away
   returns after a beat, so travel between two rows never flashes this page
   in between. */
function usePreview(entryId: string): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(null);
  const timer = useRef(0);
  const point = useCallback((next: string | null) => {
    window.clearTimeout(timer.current);
    if (next) setId(next);
    else timer.current = window.setTimeout(() => setId(null), 140);
  }, []);
  useEffect(() => {
    window.clearTimeout(timer.current);
    setId(null);
  }, [entryId]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [id, point];
}

const pointer = (id: string, point: (id: string | null) => void) => ({
  onPointerEnter: () => point(id),
  onPointerLeave: () => point(null),
  onFocus: () => point(id),
  onBlur: () => point(null),
});

/* The shell's second part: every page of a category, always shown, in
   registry order. A row previews its page on the player part. The pill's
   category switch retunes it to the other category (a channel switch, like
   the player). */
function PageList({
  id,
  entry,
  category,
  previewId,
  point,
}: {
  id: string;
  entry: RegistryEntry;
  category: Category;
  previewId: string | null;
  point: (id: string | null) => void;
}) {
  const { locale } = useLibraryLocale();
  const copy = COPY[locale];
  const group = entriesOf(category);
  const listRef = useRef<HTMLElement>(null);

  // Phones scroll the rows sideways: keep this page's row in view.
  useLayoutEffect(() => {
    const list = listRef.current?.querySelector<HTMLElement>(".lib-screen__list");
    const row = list?.querySelector<HTMLElement>("[aria-current='page']");
    if (!list || !row || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft = row.offsetLeft - (list.clientWidth - row.offsetWidth) / 2;
  }, [category, entry.id]);

  return (
    <nav ref={listRef} id={id} className="lib-screen" aria-label={copy.pages}>
      <ChannelSwitch channel={category} className="lib-screen__channel">
        <ul className="lib-screen__list">
          {group.map((e, i) => {
            const cued = previewId === e.id;
            return (
              <li key={e.id}>
                <Link
                  to={e.route}
                  className="lib-screen__row"
                  aria-current={e.id === entry.id ? "page" : undefined}
                  data-cued={cued || undefined}
                  {...pointer(e.id, point)}
                  onClick={(event) => {
                    if (e.id === entry.id) event.preventDefault();
                  }}
                >
                  <span className="lib-screen__thumb" aria-hidden="true">
                    <EntryThumb id={e.id} />
                  </span>
                  <span className="lib-screen__text">
                    <span className="lib-screen__title">{e.title[locale]}</span>
                    <span className="lib-screen__meta">{e.meta[locale]}</span>
                  </span>
                  <span className="lib-screen__num" aria-hidden="true">
                    <OrbFill on={cued}>{i + 1}</OrbFill>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </ChannelSwitch>
    </nav>
  );
}

/* The pill's second half: which category the page list shows, the listed
   one on a white plate that slides between the keys (paper inversion). */
function CategorySwitch({ category, onCategory, controls }: { category: Category; onCategory: (category: Category) => void; controls: string }) {
  const { locale } = useLibraryLocale();
  const active = SCREEN_CATEGORIES.indexOf(category);
  return (
    <div className="lib-screen__switch" role="group" aria-label={COPY[locale].category} style={{ "--lib-switch-i": Math.max(active, 0) } as CSSProperties}>
      <span className="lib-screen__plate" data-off={active < 0 || undefined} aria-hidden="true" />
      {SCREEN_CATEGORIES.map((c) => (
        <button key={c} type="button" className="lib-screen__option lib-voice-state" aria-pressed={c === category} aria-controls={controls} onClick={() => onCategory(c)}>
          <TextFill ink={c === category ? "#0b0b0e" : undefined} hoverWithin={c === category ? undefined : ".lib-screen__option"} hoverInk="#fff" withFocus={false}>
            {CATEGORY_LABEL[c][locale]}
          </TextFill>
        </button>
      ))}
    </div>
  );
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ShowcasePage({ entryId, title, tone = "dark", defaultAccent, palette = true, children }: Props) {
  const { locale } = useLibraryLocale();
  const copy = COPY[locale];
  const entry = getEntry(entryId);
  // The page screen opens on this page's category (layouts for the navbar).
  const ownList = SCREEN_CATEGORIES.includes(entry.category) ? entry.category : SCREEN_CATEGORIES[0];
  const [listCategory, setListCategory] = useState<Category>(ownList);
  useEffect(() => setListCategory(ownList), [ownList]);
  const [previewId, point] = usePreview(entry.id);
  const shown = previewId ? getEntry(previewId) : entry;
  const listId = useId();
  useEffect(warmEntryArt, []);
  const fallback = defaultAccent ?? (tone === "dark" ? NEAR_WHITE : NEAR_INK);

  // Evoview indigo is selected on arrival; it is the "default" swatch itself
  // when the page's own default is indigo (filtered out of the rest).
  // A pick made on any page carries over (accentChoice).
  const swatches = useMemo(
    () => [
      { id: "default", color: fallback, label: copy.default },
      ...SWATCHES.filter((s) => !same(s.color, fallback)).map((s) => ({ id: s.id, color: s.color, label: s.label[locale] })),
    ],
    [fallback, locale, copy.default],
  );
  const shared = useAccentChoice(swatches, same(fallback, SWATCHES[0].color) ? "default" : SWATCHES[0].id);
  const { accentId, custom, onChange, onCustom } = shared;
  const accent = palette ? shared.accent : fallback;
  const ink = useMemo(() => inkFor(accent), [accent]);
  useNavEyeAccent(palette ? accent : undefined);
  // An open modal view owns the page's h1 (useShowcaseViewOpen).
  const [viewOpen, setViewOpen] = useState(false);
  const Title = viewOpen ? "h2" : "h1";

  const style = {
    "--showcase-accent": accent,
    "--showcase-ink": ink,
  } as CSSProperties;

  const body = children === undefined ? <InConstruction entryId={entry.id} category={entry.category} /> : typeof children === "function" ? children({ locale, accent, ink }) : children;

  const stageRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLSpanElement>(null);
  const tonedByContent = useHasNavTone(stageRef, tone === "dark" ? leadRef : null);
  const ready = usePageReady(stageRef);
  const versionSlot = useFirstVersionSlot(stageRef);
  const dark = tone === "dark" ? "dark" : undefined;
  const headTone = "dark" as "dark" | "light";
  const paletteProps = {
    swatches,
    value: accentId,
    custom,
    caption: { strong: copy.paletteStrong, rest: copy.paletteRest },
    customLabel: copy.custom,
    onChange,
    onCustom,
  };

  /* Nav tone is declared per region, never on the wrapper: the navbar probe
     has no nesting priority, so a dark wrapper would win over every light
     chapter inside it. The stage is marked only while its content declares
     no tone of its own. */
  return (
    <div className="lib-showcase lib-toned ev-library" data-tone={tone} data-lib-ready={ready ? "" : undefined} style={style}>
      {/* LIBRARY follows the accent on the index only; here it stays white.
          The palette floats bottom-right, so the hero's slot is empty. */}
      <LibraryHero />
      {/* The title block takes the opposite tone of the page: a full cut
          segments it from the demos. */}
      <header className="lib-showcase__head lib-toned" data-tone={headTone} data-nav-tone={headTone === "dark" ? "dark" : undefined}>
        {/* The hero's viewport-pinned grade carries on behind the strip
            (trial-grade.css). */}
        <div className="lib-stage-grade lib-showcase__ground" aria-hidden="true" />
        {/* One module on the rail: one shell holding the player (the shown
            page's glyph) and the page list, under one glass pill centred on
            the shell's lower edge (title over category and the position
            track, then the list's category switch). Whatever page is
            pointed at in the list plays on the player by a channel switch,
            as on the evoview application's first question. */}
        <div className="lib-showcase__intro lib-rail">
          <div className="lib-deck">
            <div className="lib-deck__shell">
              <ChannelSwitch as="span" channel={shown.id} className="lib-player__art" aria-hidden="true">
                <EntryArt id={shown.id} />
              </ChannelSwitch>
              <PageList id={listId} entry={entry} category={listCategory} previewId={previewId} point={point} />
            </div>
            <div className="lib-deck__pill">
              <div className="lib-player__transport">
                <div className="lib-player__track">
                  {/* The h1 stays this page's title; a preview shows over it. */}
                  <ChannelSwitch channel={shown.id} signal={false} className="lib-showcase__title">
                    {shown.id === entry.id ? (
                      <Title className="lib-display">{title(locale)}</Title>
                    ) : (
                      <>
                        <Title className="lib-sr">{title(locale)}</Title>
                        <span className="lib-display" aria-hidden="true">
                          {shown.title[locale]}
                        </span>
                      </>
                    )}
                  </ChannelSwitch>
                  <div className="lib-player__scrub">
                    <Link to={CATEGORY_ROUTE[shown.category]} className="lib-voice-state lib-showcase__group">
                      <ChannelSwitch as="span" channel={shown.category} signal={false} className="lib-showcase__group-label">
                        {CATEGORY_LABEL[shown.category][locale]}
                      </ChannelSwitch>
                    </Link>
                    {entriesOf(shown.category).length > 1 && <GroupBars entry={entry} shown={shown} />}
                  </div>
                </div>
              </div>
              <CategorySwitch category={listCategory} onCategory={setListCategory} controls={listId} />
            </div>
          </div>
        </div>
      </header>
      <div ref={stageRef} className="lib-showcase__stage" data-nav-tone={tonedByContent ? undefined : dark}>
        <FrameTone.Provider value={tone}>
          <ViewOpen.Provider value={setViewOpen}>{body}</ViewOpen.Provider>
        </FrameTone.Provider>
      </div>
      {versionSlot && createPortal(<StatusTag status={entry.status} version={entry.version} />, versionSlot)}
      {dark && (
        <div className="lib-showcase__lead" aria-hidden="true">
          <span ref={leadRef} data-nav-tone="dark" />
        </div>
      )}
      <div className="lib-showcase__tail" data-nav-tone={dark} aria-hidden="true" />
      {palette && <FloatingPalette {...paletteProps} tone={tone} accent={accent} />}
    </div>
  );
}

/* The page's version sits over the first captioned demo's title: every
   ShowcaseVariant caption carries an empty slot, the first one in the stage
   receives the tag through a portal. Re-resolved when the stage's tree
   changes (variants swapped by specimen switches). */
function useFirstVersionSlot(ref: RefObject<HTMLElement | null>): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const find = () => {
      frame = 0;
      setSlot(el.querySelector<HTMLElement>("[data-version-slot]"));
    };
    find();
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(find);
    });
    mo.observe(el, { subtree: true, childList: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);
  return slot;
}

const FrameTone = createContext<"dark" | "light">("dark");
const ViewOpen = createContext<(open: boolean) => void>(() => {});

/**
 * A modal view of the page is open (docs/CRAWLABLE-MODALS.md §4): the page
 * title renders as an h2 with the same look, so the view's h1 is the only
 * one. Call it from the component that holds the view state.
 */
export function useShowcaseViewOpen(open: boolean): void {
  const set = useContext(ViewOpen);
  useLayoutEffect(() => {
    set(open);
    return () => set(false);
  }, [open, set]);
}

export type DemoTone = "dark" | "light" | "paper";
export type DemoRhythm = "flush" | "standard" | "compact" | "cinematic";

type VariantProps = {
  /** Component (and variant) name, set as a readout: `SelectorStage · paper`. */
  name?: ReactNode;
  /** One sentence: when a client would choose this configuration. */
  when?: ReactNode;
  /** Only when it indexes something real (a numbered sequence the reader
      steps through); never as decoration. */
  index?: { current: number; total: number };
  /** Environment of the component below. Omit when it sits on the frame
      tone or manages several tones itself. */
  tone?: DemoTone;
  /** Top padding the component brings (foundation chapter rhythm), so the
      frame can hold caption → content at the heading band. */
  rhythm?: DemoRhythm;
  /** "title": the name set as a section heading with `when` as a lead under
      it, for a scene the reader must understand before using it. "none":
      no caption, the scene opens one heading band under the page header. */
  caption?: "readout" | "title" | "none";
  id?: string;
  children: ReactNode;
};

/* One demo of a showcase page: a caption (name readout + when to choose it)
   over the live component. The frame owns the spacing, so every page has
   the same rhythm: header → first caption and caption → component sit at
   the heading band, variants are separated by a chapter band (or by the
   component's own chapter padding when it has one). No rules, no boxes.
   Contract: docs/SHOWCASE-CONTRACT.md. */
export function ShowcaseVariant({ name, when, index, tone, rhythm = "flush", caption = "readout", id, children }: VariantProps) {
  const frame = useContext(FrameTone);
  const nameId = useId();
  const env = tone ?? frame;
  const bodyRef = useRef<HTMLDivElement>(null);
  useInkOffset(bodyRef);
  return (
    <section
      id={id}
      aria-labelledby={caption === "none" ? undefined : nameId}
      className={tone ? `lib-variant ev-tone-${tone}` : "lib-variant"}
      data-tone={env}
      data-frame={env === frame ? "" : undefined}
      data-rhythm={rhythm}
    >
      {caption === "none" ? null : caption === "title" ? (
        <header className="lib-variant__caption lib-variant__caption--title lib-rail">
          <h2 id={nameId} className="lib-title lib-variant__title">
            <span className="lib-variant__version" data-version-slot="" aria-hidden="true" />
            {name}
          </h2>
          <p className="lib-lead lib-variant__when">{when}</p>
        </header>
      ) : (
        <header className="lib-variant__caption lib-rail">
          <p id={nameId} className="lib-voice-state lib-variant__name">
            <span className="lib-variant__version" data-version-slot="" aria-hidden="true" />
            {index && (
              <span className="lib-variant__index">
                {pad2(index.current)} / {pad2(index.total)}
              </span>
            )}
            {name}
          </p>
          {when && <p className="lib-body lib-variant__when">{when}</p>}
        </header>
      )}
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
   line, so a dark card inside a light chapter must not darken the bar.

   `lead` (dark frames only) marks the stage's own ground above its first
   toned region — the palette seam, a captionless variant's top — which no
   region declares, so the bar would flash light there. It sits after the
   stage (first/last-child rules) and is placed back over its top. */
function useHasNavTone(ref: RefObject<HTMLElement | null>, lead: RefObject<HTMLElement | null> | null): boolean {
  const [has, setHas] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let roots: HTMLElement[] = [];
    const docTop = (n: HTMLElement) => {
      let top = 0;
      for (let cur: HTMLElement | null = n; cur; cur = cur.offsetParent as HTMLElement | null) top += cur.offsetTop;
      return top;
    };
    const placeLead = () => {
      const strip = lead?.current;
      const holder = strip?.parentElement;
      if (!strip || !holder) return;
      const stageTop = docTop(el);
      const first = roots.length ? Math.min(...roots.map(docTop)) : stageTop;
      // offsetTop is whole px: 1px of overlap at each end leaves no subpixel hole.
      strip.style.top = `${stageTop - docTop(holder) - 1}px`;
      strip.style.height = first > stageTop ? `${Math.ceil(first - stageTop) + 2}px` : "0px";
    };
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
      roots = Array.from(el.querySelectorAll<HTMLElement>(TONED)).filter((n) => {
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
      placeLead();
    };
    sync();
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(sync);
    });
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-nav-tone"] });
    // Layout moves the first region without a tone mutation (fonts, media, width).
    const ro = lead ? new ResizeObserver(placeLead) : null;
    ro?.observe(el);
    return () => {
      mo.disconnect();
      ro?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref, lead]);
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
