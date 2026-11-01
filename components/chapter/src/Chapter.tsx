import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn, inkFor, useInViewPause } from "../foundation";

export type ChapterTone = "light" | "paper" | "dark";
export type ChapterRhythm = "standard" | "compact" | "cinematic";
export type ChapterRail = "reading" | "wide" | "none";
export const CHAPTER_HEADING_LAYOUTS = ["centered", "split"] as const;
export type ChapterHeadingLayout = (typeof CHAPTER_HEADING_LAYOUTS)[number];
export const CHAPTER_HEADING_VARIANTS = ["standard", "feature"] as const;
export type ChapterHeadingVariant = (typeof CHAPTER_HEADING_VARIANTS)[number];

type HeadingSlot = { id: string; register: () => () => void };
const HeadingContext = createContext<HeadingSlot | null>(null);

export type ChapterProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Anchor id; also the navbar section id (see `chapterNavSections`). */
  id?: string;
  /** Environment. Neighbours alternate near-white / near-black with a hard cut. */
  tone?: ChapterTone;
  /** standard 80 / 120 · compact 64 / 96 (same-tone continuation) · cinematic 96–80 / 144–120 (dark entry). */
  rhythm?: ChapterRhythm;
  /** reading 70em · wide 85em · none (children place themselves, e.g. a bleeding track). */
  rail?: ChapterRail;
  /** Overrides the host accent (`--primary`) for this chapter only. */
  accent?: string;
  /** Writes `data-nav-tone` for the navbar package. Default true. */
  navTone?: boolean;
  as?: "section" | "article" | "div";
  children: ReactNode;
};

/** The page-section shell: tone, rhythm, rail, accent scope and navbar tone. */
export function Chapter({
  id,
  tone = "light",
  rhythm = "standard",
  rail = "reading",
  accent,
  navTone = true,
  as = "section",
  className,
  style,
  children,
  ...rest
}: ChapterProps) {
  const Tag = as as ElementType;
  const ref = useRef<HTMLElement>(null);
  const { active } = useInViewPause(ref);
  const autoId = useId();
  const [headings, setHeadings] = useState(0);
  const slot = useRef<HeadingSlot>({
    id: `${id ?? autoId.replace(/[^a-zA-Z0-9_-]/g, "")}-heading`,
    register: () => {
      setHeadings((n) => n + 1);
      return () => setHeadings((n) => n - 1);
    },
  }).current;

  const accentStyle = accent ? ({ "--primary": accent, "--primary-foreground": inkFor(accent) } as CSSProperties) : null;
  const labelled = headings > 0 && !rest["aria-label"] && !rest["aria-labelledby"];

  return (
    <Tag
      ref={ref}
      id={id}
      className={cn("ev-root ev-chapter", rhythm !== "standard" && `ev-chapter--${rhythm}`, `ev-tone-${tone}`, className)}
      data-tone={tone}
      data-rhythm={rhythm}
      data-nav-tone={navTone ? (tone === "dark" ? "dark" : "light") : undefined}
      data-ev-paused={active ? undefined : ""}
      aria-labelledby={labelled ? slot.id : undefined}
      style={accentStyle ? { ...accentStyle, ...style } : style}
      {...rest}
    >
      <HeadingContext.Provider value={slot}>
        {rail === "none" ? children : <div className={cn("ev-rail", rail === "wide" && "ev-rail--wide")}>{children}</div>}
      </HeadingContext.Provider>
    </Tag>
  );
}

export type ChapterHeadingProps = {
  /** Overused 900 uppercase. Wrap one word in <em> for the accent; embed a <ChapterMark> for the client mark. */
  title: ReactNode;
  /** One or two sentences; measure 590 centered, 380 split. */
  subtitle?: ReactNode;
  /** Under the subtitle: a <ChapterTicker>, an <Index>… */
  support?: ReactNode;
  /** Split: the instrument / controls on the right (under the heading on phones). Centered: below. */
  side?: ReactNode;
  layout?: ChapterHeadingLayout;
  /** feature = one size up (28 → 34.4); one feature heading per page region. */
  variant?: ChapterHeadingVariant;
  /** The element only (never the voice or size). 1 = the page's title; 2 while a modal view's h1 is open (docs/CRAWLABLE-MODALS.md §4). Default 2. */
  level?: 1 | 2 | 3;
  /** @deprecated No effect since chapter 1.7.0: the boxed marker is gone (evoview.be's motif, RULES §8). */
  marker?: boolean;
  /** @deprecated No effect since chapter 1.7.0 (it pulsed the removed marker). */
  live?: boolean;
  className?: string;
};

export function ChapterHeading({ title, subtitle, support, side, layout = "centered", variant = "standard", level = 2, className }: ChapterHeadingProps) {
  const slot = useContext(HeadingContext);
  const register = slot?.register;
  useLayoutEffect(() => register?.(), [register]);
  const H = `h${level}` as const;

  return (
    <header
      className={cn("ev-chapter__heading", `ev-chapter__heading--${layout}`, variant === "feature" && "ev-chapter__heading--feature", className)}
    >
      <div className="ev-chapter__main">
        <H id={slot?.id} className={cn("ev-chapter__title", variant === "feature" ? "ev-t-section-feature" : "ev-t-section")}>
          {title}
        </H>
        {subtitle && <p className="ev-chapter__subtitle">{subtitle}</p>}
        {support && <div className="ev-chapter__support">{support}</div>}
      </div>
      {side && <div className="ev-chapter__side">{side}</div>}
    </header>
  );
}

/** A client mark set inline in a title at 1.1em (replaces a word: give it the word as `label`). */
export function ChapterMark({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn("ev-chapter__mark", className)} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      {children}
    </span>
  );
}

export type ChapterTickerProps = {
  items: ReactNode[];
  /** 0-based; marked with the accent dot, full ink and aria-current. */
  active?: number;
  /** Accessible name of the list. */
  label: string;
  /** Phones drop the ticker (secondary object) unless "show". */
  phone?: "hide" | "show";
};

/** Heading support line: `PHASE · PHASE · ACTIVE · PHASE`. */
export function ChapterTicker({ items, active, label, phone = "hide" }: ChapterTickerProps) {
  return (
    <ol className="ev-chapter__ticker" aria-label={label} data-phone={phone}>
      {items.map((item, i) => (
        <li key={i} aria-current={i === active ? "step" : undefined}>
          {i === active && <span className="ev-chapter__ticker-dot" aria-hidden="true" />}
          {item}
        </li>
      ))}
    </ol>
  );
}

/** Navbar `sections` for a list of chapters: `{ id, color }` with the client accent as fallback. */
export function chapterNavSections(chapters: { id: string; accent?: string }[], accent: string): { id: string; color: string }[] {
  return chapters.map(({ id, accent: own }) => ({ id, color: own ?? accent }));
}
