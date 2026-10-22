import { useId, type CSSProperties, type ReactNode } from "react";
import { PrimaryPlate } from "../controls";
import { cn, pad } from "../foundation";
import { Reveal, StoryFigure, renderLines } from "./parts";
import type { Band, IndexedRowsProps, Lines, PayoffBandProps, ProofGridProps, RuledPillarsProps, StoryIntroProps } from "./types";

type ChapterProps = { id?: string; band?: Band; className?: string; children: ReactNode };

/** Open chapter: spacing + hairline + alternating band. Never a box. */
function Chapter({ id, band, className, children }: ChapterProps) {
  return (
    <section aria-labelledby={id} className={cn("evsb-chapter", className)} data-band={band}>
      <div className="ev-rail ev-rail--wide evsb-rail">{children}</div>
    </section>
  );
}

/** Heading | copy split, .72 / 1.28, copy bottom-aligned. */
function HeadSplit({ id, heading, body }: { id: string; heading: Lines; body?: ReactNode }) {
  return (
    <div className="evsb-split" data-align="end">
      <Reveal>
        <h2 id={id} className="ev-t-heading evsb-heading">
          {renderLines(heading)}
        </h2>
      </Reveal>
      {body && (
        <Reveal index={1} className="evsb-split__aside">
          <p className="ev-t-body evsb-body">{body}</p>
        </Reveal>
      )}
    </div>
  );
}

export function StoryIntro({ title, lead, body, media, caption, align = "end", band }: StoryIntroProps) {
  const id = useId();
  return (
    <Chapter id={id} band={band} className="evsb-intro">
      <div className="evsb-intro__body">
        <div className="evsb-split" data-align={align}>
          <Reveal>
            <h2 id={id} className="ev-t-title evsb-title">
              {renderLines(title)}
            </h2>
          </Reveal>
          <Reveal index={1} className="evsb-intro__copy">
            <p className="ev-t-lead evsb-lead">{lead}</p>
            {body && <p className="ev-t-body evsb-body">{body}</p>}
          </Reveal>
        </div>
        <Reveal kind="media" className="evsb-intro__media">
          <StoryFigure media={media} eager scrim className="evsb-hero">
            <figcaption className="evsb-caption">
              <span className="evsb-caption__text">
                <span className="ev-t-readout evsb-caption__kicker">{caption.kicker}</span>
                <span className="ev-t-compact evsb-caption__title">{caption.title}</span>
              </span>
              <span className="evsb-dot" aria-hidden="true" />
            </figcaption>
          </StoryFigure>
        </Reveal>
      </div>
    </Chapter>
  );
}

export function IndexedRows({ heading, body, rows, layout = "split", band }: IndexedRowsProps) {
  const id = useId();
  const list = (
    <ol className="evsb-rows">
      {rows.map((row, i) => (
        <Reveal as="li" key={i} index={i} className="evsb-row">
          <span className="ev-t-readout evsb-row__index" aria-hidden="true">
            {pad(i + 1)}
          </span>
          <h3 className="ev-t-label evsb-row__label">{row.label}</h3>
          <p className="ev-t-compact evsb-row__detail">{row.detail}</p>
        </Reveal>
      ))}
    </ol>
  );

  if (layout === "full") {
    return (
      <Chapter id={id} band={band} className="evsb-rows-chapter">
        <HeadSplit id={id} heading={heading} body={body} />
        <div className="evsb-after-head">{list}</div>
      </Chapter>
    );
  }
  return (
    <Chapter id={id} band={band} className="evsb-rows-chapter">
      <div className="evsb-split" data-align="start">
        <Reveal>
          <h2 id={id} className="ev-t-heading evsb-heading">
            {renderLines(heading)}
          </h2>
          {body && <p className="ev-t-body evsb-body evsb-body--under">{body}</p>}
        </Reveal>
        {list}
      </div>
    </Chapter>
  );
}

const relax = (ratio: number) => Math.min(1.25, Math.max(0.88, ratio));

export function ProofGrid({ heading, body, items, note, band }: ProofGridProps) {
  const id = useId();
  const total = items.length;
  // Pairs alternate 7/5 then 5/7: the wide side switches every row.
  const spanOf = (i: number) => ((Math.floor(i / 2) % 2 === 0) === (i % 2 === 0) ? 7 : 5);
  const noteSpan = total % 2 === 1 ? 12 - spanOf(total - 1) : 5;

  return (
    <Chapter id={heading ? id : undefined} band={band} className="evsb-proof-chapter">
      {heading && <HeadSplit id={id} heading={heading} body={body} />}
      <div className={cn("evsb-proof", heading ? "evsb-after-head" : undefined)}>
        {items.map((item, i) => (
          <Reveal
            key={i}
            kind="media"
            index={i % 2}
            className="evsb-proof__item"
            style={{ "--evsb-span": spanOf(i), "--evsb-ratio": item.ratio, "--evsb-ratio-phone": item.ratioPhone ?? relax(item.ratio) } as CSSProperties}
          >
            <StoryFigure media={item.media} className="evsb-proof__figure" />
            <p className="ev-t-readout evsb-proof__caption">
              <span>
                <span className="evsb-proof__index">{pad(i + 1)}</span> / {item.label}
              </span>
              {item.qualifier && <span>{item.qualifier}</span>}
            </p>
          </Reveal>
        ))}
        {note && (
          <Reveal className="evsb-note" style={{ "--evsb-span": noteSpan } as CSSProperties}>
            <span className="evsb-note__rule" aria-hidden="true" />
            <p className="ev-t-compact">{renderLines(note)}</p>
          </Reveal>
        )}
      </div>
    </Chapter>
  );
}

export function RuledPillars({ heading, body, pillars, band }: RuledPillarsProps) {
  const id = useId();
  return (
    <Chapter id={heading ? id : undefined} band={band} className="evsb-pillars-chapter">
      {heading && <HeadSplit id={id} heading={heading} body={body} />}
      <ol className={cn("evsb-pillars", heading ? "evsb-after-head" : undefined)}>
        {pillars.map((pillar, i) => (
          <Reveal as="li" key={i} index={i} className="evsb-pillar">
            <span className="ev-t-readout evsb-pillar__label">
              <span className="evsb-pillar__index">{pad(i + 1)}</span> / {pillar.label}
            </span>
            <h3 className="ev-t-card evsb-pillar__heading">{renderLines(pillar.heading)}</h3>
            <p className="ev-t-compact evsb-pillar__copy">{pillar.copy}</p>
          </Reveal>
        ))}
      </ol>
    </Chapter>
  );
}

export function PayoffBand({ lines, accentLine, lead, results, cta, bloom = true, band }: PayoffBandProps) {
  const id = useId();
  const consequenceId = useId();
  const { label, consequence, href, target, rel, onClick } = cta;
  const plate = href ? (
    <PrimaryPlate block href={href} target={target} rel={rel} onClick={onClick} aria-describedby={consequenceId}>
      {label}
    </PrimaryPlate>
  ) : (
    <PrimaryPlate block onClick={onClick} aria-describedby={consequenceId}>
      {label}
    </PrimaryPlate>
  );

  return (
    <Chapter id={id} band={band} className={cn("evsb-payoff", bloom && "evsb-payoff--bloom")}>
      <div className="evsb-payoff__grid">
        <div className="evsb-payoff__statement">
          <Reveal>
            <h2 id={id} className="ev-t-display evsb-display">
              {renderLines(lines, accentLine)}
            </h2>
          </Reveal>
          <Reveal index={1}>
            <p className="ev-t-lead evsb-payoff__lead">{lead}</p>
          </Reveal>
          {results && results.length > 0 && (
            <ul className="evsb-results">
              {results.map((result, i) => (
                <Reveal as="li" key={i} index={i + 2} className="evsb-result">
                  <h3 className="ev-t-compact evsb-result__title">{result.title}</h3>
                  <p className="ev-t-compact evsb-result__detail">{result.detail}</p>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
        <Reveal index={2} className="evsb-payoff__action">
          {plate}
          <span id={consequenceId} className="ev-t-readout evsb-consequence">
            {consequence}
          </span>
        </Reveal>
      </div>
    </Chapter>
  );
}
