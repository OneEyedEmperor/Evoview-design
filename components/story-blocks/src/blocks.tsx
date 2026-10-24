import { useId, type CSSProperties, type ReactNode } from "react";
import { PrimaryPlate } from "../controls";
import { cn, pad } from "../foundation";
import { Reveal, StoryFigure, renderLines } from "./parts";
import type { IndexedRow, IndexedRowsProps, Lines, PayoffBandProps, ProofGridProps, ProofItem, StoryIntroProps } from "./types";

/** Open chapter: separated from its neighbours by the chapter band of space only. */
function Chapter({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={cn("evsb-chapter", className)}>
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

export function StoryIntro({ title, lead, body, media, caption, align = "end" }: StoryIntroProps) {
  const id = useId();
  return (
    <Chapter id={id} className="evsb-intro">
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
          <StoryFigure media={media} eager scrim={!!caption} className="evsb-hero">
            {caption && (
              <figcaption className="evsb-caption">
                <span className="evsb-caption__text">
                  {caption.kicker && <span className="ev-t-readout evsb-caption__kicker">{caption.kicker}</span>}
                  <span className="ev-t-compact evsb-caption__title">{caption.title}</span>
                </span>
                <span className="evsb-dot" aria-hidden="true" />
              </figcaption>
            )}
          </StoryFigure>
        </Reveal>
      </div>
    </Chapter>
  );
}

function RowContent({ row, i }: { row: IndexedRow; i: number }) {
  return (
    <>
      <span className="ev-t-readout evsb-row__index" aria-hidden={row.index === undefined ? true : undefined}>
        {row.index ?? pad(i + 1)}
      </span>
      <h3 className="ev-t-card evsb-row__label">{row.label}</h3>
      <p className="ev-t-body evsb-row__detail">{row.detail}</p>
    </>
  );
}

/** Tiles reveal one by one; joined rows reveal as one surface (no gaps open between them). */
function RowList({ rows, surface }: { rows: readonly IndexedRow[]; surface: "tiles" | "rows" }) {
  if (surface === "rows") {
    return (
      <Reveal className="evsb-rows-group">
        <ol className="evsb-rows" data-surface="rows">
          {rows.map((row, i) => (
            <li key={i} className="evsb-row">
              <RowContent row={row} i={i} />
            </li>
          ))}
        </ol>
      </Reveal>
    );
  }
  return (
    <ol className="evsb-rows" data-surface="tiles">
      {rows.map((row, i) => (
        <Reveal as="li" key={i} index={i} className="evsb-row">
          <RowContent row={row} i={i} />
        </Reveal>
      ))}
    </ol>
  );
}

export function IndexedRows({ heading, body, rows, media, surface = media ? "tiles" : "rows" }: IndexedRowsProps) {
  const id = useId();
  const head = (
    <Reveal>
      <h2 id={id} className="ev-t-heading evsb-heading">
        {renderLines(heading)}
      </h2>
      {body && <p className="ev-t-body evsb-body evsb-body--under">{body}</p>}
    </Reveal>
  );

  if (media) {
    const { ratio = 1, ratioPhone, ...figure } = media;
    return (
      <Chapter id={id} className="evsb-sequence-chapter">
        <div className="evsb-sequence">
          <div className="evsb-sequence__text">
            {head}
            <RowList rows={rows} surface={surface} />
          </div>
          <Reveal
            kind="media"
            className="evsb-sequence__media"
            style={{ "--evsb-ratio": ratio, "--evsb-ratio-phone": ratioPhone ?? ratio } as CSSProperties}
          >
            <StoryFigure media={figure} className="evsb-sequence__figure" />
          </Reveal>
        </div>
      </Chapter>
    );
  }

  return (
    <Chapter id={id} className="evsb-rows-chapter">
      <div className="evsb-split" data-align="start">
        {head}
        <RowList rows={rows} surface={surface} />
      </div>
    </Chapter>
  );
}

/** Desktop spans: pairs alternate 7/5 then 5/7, so the wide side switches every row. */
const autoSpan = (i: number) => ((Math.floor(i / 2) % 2 === 0) === (i % 2 === 0) ? 7 : 5);

/** Phone: two consecutive portrait items share a row; everything else is full width. */
function phoneHalves(items: readonly ProofItem[]): boolean[] {
  const half = items.map(() => false);
  for (let i = 0; i < items.length - 1; i++) {
    if (!half[i] && (items[i].ratioPhone ?? items[i].ratio) < 1 && (items[i + 1].ratioPhone ?? items[i + 1].ratio) < 1) {
      half[i] = half[i + 1] = true;
      i++;
    }
  }
  return half;
}

export function ProofGrid({ heading, body, headingAt = "start", items }: ProofGridProps) {
  const id = useId();
  const halves = phoneHalves(items);
  const end = headingAt === "end";
  const head = heading && <HeadSplit id={id} heading={heading} body={body} />;

  return (
    <Chapter id={heading ? id : undefined} className="evsb-proof-chapter">
      {!end && head}
      <div className={cn("evsb-proof", heading && !end ? "evsb-after-head" : undefined)}>
        {items.map((item, i) => (
          <Reveal
            key={i}
            kind="media"
            index={i % 2}
            className={cn("evsb-proof__item", halves[i] && "evsb-proof__item--half")}
            style={{ "--evsb-span": item.span ?? autoSpan(i), "--evsb-ratio": item.ratio, "--evsb-ratio-phone": item.ratioPhone ?? item.ratio } as CSSProperties}
          >
            <StoryFigure media={item.media} className="evsb-proof__figure" />
            {item.caption && <p className="ev-t-compact evsb-proof__caption">{item.caption}</p>}
          </Reveal>
        ))}
      </div>
      {end && head && <div className="evsb-after-proof">{head}</div>}
    </Chapter>
  );
}

export function PayoffBand({ lines, accentLine, lead, results, cta, bloom = true }: PayoffBandProps) {
  const id = useId();
  const consequenceId = useId();
  const { label, consequence, href, target, rel, onClick } = cta;
  const describedBy = consequence ? consequenceId : undefined;
  const plate = href ? (
    <PrimaryPlate block href={href} target={target} rel={rel} onClick={onClick} aria-describedby={describedBy}>
      {label}
    </PrimaryPlate>
  ) : (
    <PrimaryPlate block onClick={onClick} aria-describedby={describedBy}>
      {label}
    </PrimaryPlate>
  );

  return (
    <Chapter id={id} className={cn("evsb-payoff", bloom && "evsb-payoff--bloom")}>
      <div className="evsb-payoff__grid">
        <div className="evsb-payoff__statement">
          <Reveal>
            <h2 id={id} className="ev-t-display evsb-display">
              {renderLines(lines, accentLine)}
            </h2>
          </Reveal>
          {lead && (
            <Reveal index={1}>
              <p className="ev-t-lead evsb-payoff__lead">{lead}</p>
            </Reveal>
          )}
          {results && results.length > 0 && (
            <Reveal index={2}>
              <ul className="evsb-results">
                {results.map((result, i) => (
                  <li key={i} className="evsb-result">
                    <h3 className="ev-t-lead evsb-result__title">{result.title}</h3>
                    <p className="ev-t-compact evsb-result__detail">{result.detail}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
        <Reveal index={2} className="evsb-payoff__action">
          {plate}
          {consequence && (
            <span id={consequenceId} className="ev-t-readout evsb-consequence">
              {consequence}
            </span>
          )}
        </Reveal>
      </div>
    </Chapter>
  );
}
