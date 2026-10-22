import { cn, EvoviewMark, Readout } from "../foundation";
import type { ChapterConfig } from "./chapter.config";
import type { ChapterTone } from "./Chapter";

export type ChapterFooterProps = {
  config: ChapterConfig;
  /** Default light (the page tone). */
  tone?: ChapterTone;
  className?: string;
};

/** Site footer bar on the wide rail: client logo · legal + links · the Evoview attribution. */
export function ChapterFooter({ config, tone = "light", className }: ChapterFooterProps) {
  const { brand, footer, attribution } = config;
  return (
    <footer
      className={cn("ev-root ev-chapter ev-chapter--footer", `ev-tone-${tone}`, className)}
      data-tone={tone}
      data-nav-tone={tone === "dark" ? "dark" : "light"}
    >
      <div className="ev-rail ev-rail--wide">
        <div className="ev-chapter__footer">
          {brand.href ? (
            <a className="ev-chapter__brand" href={brand.href} aria-label={brand.name}>
              {brand.logo}
            </a>
          ) : (
            <span className="ev-chapter__brand" role="img" aria-label={brand.name}>
              {brand.logo}
            </span>
          )}
          <div className="ev-chapter__footer-end">
            <div className="ev-chapter__legal">
              <p className="ev-t-compact">{footer.legal}</p>
              {footer.links.length > 0 && (
                <ul className="ev-chapter__links" aria-label={footer.linksLabel}>
                  {footer.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <a
                          className="ev-chapter__link ev-t-label"
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener" : undefined}
                          onClick={link.onSelect}
                        >
                          {link.label}
                          {link.external && <span className="ev-sr"> ({footer.newTab})</span>}
                        </a>
                      ) : (
                        <button type="button" className="ev-chapter__link ev-t-label" onClick={link.onSelect}>
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {attribution.enabled && (
              <p className="ev-chapter__credit">
                <Readout aria-hidden="true">{attribution.credit}</Readout>
                <EvoviewMark label={attribution.label} href={attribution.href} />
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
