import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { GhostAction } from "../controls";
import { ArrowRight, Chevron, cn, OrbFill, usePressJelly } from "../foundation";
import { Chapter, ChapterHeading, type ChapterRhythm, type ChapterTone } from "./Chapter";
import type { ChapterFaqConfig } from "./chapter.config";

/** media: sticky portrait beside the list (heading above) · split: heading column beside the list · stacked: centred heading over one column. */
export type ChapterFaqLayout = "media" | "split" | "stacked";

export type ChapterFaqProps = {
  config: ChapterFaqConfig;
  /** Default "media" when the config has media, else "split". */
  layout?: ChapterFaqLayout;
  /** Anchor / navbar section id. Default "faq". */
  id?: string;
  tone?: ChapterTone;
  rhythm?: ChapterRhythm;
  /** Question open on first render (0-based); none by default. */
  defaultOpen?: number | null;
  /** Section heading level; questions are one level below. */
  level?: 2 | 3;
  className?: string;
};

/** FAQPage structured data from the same strings the accordion renders. */
export function chapterFaqJsonLd(config: Pick<ChapterFaqConfig, "items">) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

const json = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

const icon = { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": true, focusable: false } as const;
const Plus = () => (
  <svg {...icon}>
    <path d="M6 1.5v9M1.5 6h9" />
  </svg>
);
const Minus = () => (
  <svg {...icon}>
    <path d="M1.5 6h9" />
  </svg>
);

/** A chapter of questions: single-open accordion on alternating tonal rows. Answers are always rendered (crawlable), collapsed by height; find-in-page opens them where `hidden="until-found"` is supported. */
export function ChapterFaq({ config, layout, id = "faq", tone = "dark", rhythm = "standard", defaultOpen = null, level = 2, className }: ChapterFaqProps) {
  const mode: ChapterFaqLayout = layout ?? (config.media ? "media" : "split");
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  usePressJelly();
  const listRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const listId = `${id}-${uid}-list`;
  const Q = level === 2 ? "h3" : "h4";
  const limit = config.phoneVisible > 0 ? config.phoneVisible : config.items.length;
  const hidden = Math.max(0, config.items.length - limit);

  /* Closed answers become hidden="until-found" once hydrated (never in
     server HTML, where they stay plain text): the browser's find-in-page
     reaches them and fires beforematch, which opens that question. React
     only knows boolean `hidden`, so the attribute is set here. */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !("onbeforematch" in list)) return;
    list.querySelectorAll<HTMLElement>(":scope > .ev-chapter-faq__item > .ev-chapter-faq__panel").forEach((panel, i) => {
      if (i === open) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "until-found");
    });
  }, [open]);
  useEffect(() => {
    const list = listRef.current;
    if (!list || !("onbeforematch" in list)) return;
    const onMatch = (e: Event) => {
      const i = Number((e.target as HTMLElement).closest<HTMLElement>(".ev-chapter-faq__item")?.dataset.index);
      if (Number.isInteger(i)) flushSync(() => setOpen(i));
    };
    list.addEventListener("beforematch", onMatch);
    return () => list.removeEventListener("beforematch", onMatch);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const triggers = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(".ev-chapter-faq__trigger")).filter((b) => b.offsetParent !== null);
    const at = triggers.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? triggers.length - 1 : (at + (e.key === "ArrowDown" ? 1 : -1) + triggers.length) % triggers.length;
    triggers[next]?.focus();
  };

  const more = config.more && (
    <GhostAction href={config.more.href} icon={<ArrowRight />} iconPosition="end" className="ev-chapter-faq__ask">
      {config.more.label}
    </GhostAction>
  );

  const heading = (
    <ChapterHeading
      level={level}
      marker={false}
      layout={mode === "stacked" ? "centered" : "split"}
      title={config.title}
      subtitle={config.subtitle}
      side={mode === "split" ? undefined : more}
      support={mode === "split" ? more : undefined}
    />
  );

  const list = (
    <div className="ev-chapter-faq__stack">
      <div ref={listRef} id={listId} className="ev-chapter-faq__list" data-expanded={expanded ? "" : undefined} onKeyDown={onKeyDown}>
        {config.items.map((item, i) => {
          const isOpen = open === i;
          const qId = `${id}-${uid}-q${i}`;
          const aId = `${id}-${uid}-a${i}`;
          return (
            <div key={i} className="ev-chapter-faq__item" data-index={i} data-open={isOpen ? "" : undefined} data-extra={i >= limit ? "" : undefined}>
              <Q className="ev-chapter-faq__q">
                <button
                  type="button"
                  id={qId}
                  className="ev-chapter-faq__trigger"
                  aria-expanded={isOpen}
                  aria-controls={aId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="ev-chapter-faq__question">{item.question}</span>
                  <span className="ev-chapter-faq__orb">
                    <OrbFill on={isOpen} lit={<Minus />}>
                      <Plus />
                    </OrbFill>
                  </span>
                </button>
              </Q>
              <div id={aId} role="region" aria-labelledby={qId} className="ev-chapter-faq__panel">
                <div className="ev-chapter-faq__clip">
                  <div className="ev-chapter-faq__answer">
                    <p className="ev-t-body">{item.answer}</p>
                    {item.link && (
                      <GhostAction href={item.link.href} icon={<ArrowRight />} iconPosition="end" className="ev-chapter-faq__follow">
                        {item.link.label}
                      </GhostAction>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          className="ev-chapter-faq__more"
          data-ev-jelly=""
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => {
            if (expanded && open !== null && open >= limit) setOpen(null);
            setExpanded(!expanded);
          }}
        >
          <span className="ev-t-label">{expanded ? config.showLess : config.showMore(hidden)}</span>
          <Chevron dir={expanded ? "up" : "down"} />
        </button>
      )}
    </div>
  );

  return (
    <Chapter id={id} tone={tone} rhythm={rhythm} rail={mode === "stacked" ? "reading" : "wide"} className={cn("ev-chapter-faq", className)} data-layout={mode}>
      {mode !== "split" && heading}
      <div className="ev-chapter-faq__body">
        {mode === "split" && <div className="ev-chapter-faq__head">{heading}</div>}
        {mode === "media" && config.media && (
          <figure className="ev-chapter-faq__media">
            <img src={config.media.src} srcSet={config.media.srcSet} sizes={config.media.sizes} alt={config.media.alt} loading="lazy" decoding="async" />
          </figure>
        )}
        {list}
      </div>
      {config.structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(chapterFaqJsonLd(config)) }} />}
    </Chapter>
  );
}
