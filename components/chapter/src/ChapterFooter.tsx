import { cn, EvoviewMark, OrbFill, Readout, TextFill, usePressJelly } from "../foundation";
import type { ChapterConfig, ChapterFooterLink } from "./chapter.config";
import type { ChapterTone } from "./Chapter";

/** bar: one row (logo · legal + links · credit) · panel: brand + tagline · page tiles · socials, over contact · legal, credit centred. */
export const CHAPTER_FOOTER_LAYOUTS = ["bar", "panel"] as const;
export type ChapterFooterLayout = (typeof CHAPTER_FOOTER_LAYOUTS)[number];

export type ChapterFooterProps = {
  config: ChapterConfig;
  /** Default light (the page tone). */
  tone?: ChapterTone;
  /** Default "bar". "panel" reads `footer.tagline`, `nav`, `socials`, `contact`. */
  layout?: ChapterFooterLayout;
  className?: string;
};

/** Site footer on the wide rail, ending on the Evoview attribution. */
export function ChapterFooter({ config, tone = "light", layout = "bar", className }: ChapterFooterProps) {
  usePressJelly();
  return (
    <footer
      className={cn("ev-root ev-chapter ev-chapter--footer", layout === "panel" && "ev-chapter--panel", `ev-tone-${tone}`, className)}
      data-tone={tone}
      data-layout={layout}
      data-nav-tone={tone === "dark" ? "dark" : "light"}
    >
      <div className="ev-rail ev-rail--wide">{layout === "panel" ? <Panel config={config} /> : <Bar config={config} />}</div>
    </footer>
  );
}

function Brand({ brand }: { brand: ChapterConfig["brand"] }) {
  return brand.href ? (
    <a className="ev-chapter__brand" href={brand.href} aria-label={brand.name}>
      {brand.logo}
    </a>
  ) : (
    <span className="ev-chapter__brand" role="img" aria-label={brand.name}>
      {brand.logo}
    </span>
  );
}

function Credit({ attribution }: { attribution: ChapterConfig["attribution"] }) {
  return (
    <p className="ev-chapter__credit">
      <Readout aria-hidden="true">{attribution.credit}</Readout>
      <EvoviewMark label={attribution.label} href={attribution.href} />
    </p>
  );
}

function Bar({ config }: { config: ChapterConfig }) {
  const { brand, footer, attribution } = config;
  return (
    <div className="ev-chapter__footer">
      <Brand brand={brand} />
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
        {attribution.enabled && <Credit attribution={attribution} />}
      </div>
    </div>
  );
}

const FG = "var(--ev-fg)";

/* A panel text link: rest ink from CSS, the foreground rises on hover / focus (TextFill, RULES §1). */
function PanelLink({ link, className, newTab, current }: { link: ChapterFooterLink; className: string; newTab: string; current?: boolean }) {
  const label = (
    <TextFill hoverWithin={`.${className}`} hoverInk={FG} ink={current ? FG : undefined}>
      {link.label}
    </TextFill>
  );
  return link.href ? (
    <a
      className={className}
      href={link.href}
      target={link.external ? "_blank" : undefined}
      rel={link.external ? "noopener" : undefined}
      aria-current={current ? "page" : undefined}
      onClick={link.onSelect}
    >
      {label}
      {link.external && <span className="ev-sr"> ({newTab})</span>}
    </a>
  ) : (
    <button type="button" className={className} onClick={link.onSelect}>
      {label}
    </button>
  );
}

function Panel({ config }: { config: ChapterConfig }) {
  const { brand, footer, attribution } = config;
  const { nav = [], socials = [], contact } = footer;
  const phone = contact?.phone;
  const tel = phone ? (contact.phoneHref ?? `tel:${phone.replace(/[^\d+]/g, "")}`) : undefined;

  return (
    <>
      <div className="ev-chapter__panel">
        <div className="ev-chapter__panel-brand">
          <Brand brand={brand} />
          {footer.tagline && <p className="ev-t-compact ev-chapter__tagline">{footer.tagline}</p>}
        </div>
        {nav.length > 0 && (
          <nav className="ev-chapter__nav" aria-label={footer.navLabel}>
            <ul>
              {nav.map((link) => (
                <li key={link.label}>
                  <PanelLink link={link} className="ev-chapter__nav-link" newTab={footer.newTab} current={link.current} />
                </li>
              ))}
            </ul>
          </nav>
        )}
        {socials.length > 0 && (
          <ul className="ev-chapter__socials" aria-label={footer.socialsLabel}>
            {socials.map((social) => (
              <li key={social.href}>
                <a className="ev-chapter__social" data-ev-jelly="" href={social.href} target="_blank" rel="noopener" aria-label={social.label}>
                  <span className="ev-chapter__social-orb">
                    <OrbFill hoverWithin=".ev-chapter__social">{social.icon}</OrbFill>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ev-chapter__meta">
        {contact && (
          <address className="ev-chapter__contact">
            {contact.mapsHref ? (
              <PanelLink link={{ label: contact.address, href: contact.mapsHref, external: true }} className="ev-chapter__meta-link" newTab={footer.newTab} />
            ) : (
              <span className="ev-chapter__meta-link">{contact.address}</span>
            )}
            {phone && tel && <PanelLink link={{ label: phone, href: tel }} className="ev-chapter__meta-link" newTab={footer.newTab} />}
            {contact.email && <PanelLink link={{ label: contact.email, href: `mailto:${contact.email}` }} className="ev-chapter__meta-link" newTab={footer.newTab} />}
          </address>
        )}
        <div className="ev-chapter__meta-legal">
          <p className="ev-t-compact">{footer.legal}</p>
          {footer.links.length > 0 && (
            <ul aria-label={footer.linksLabel}>
              {footer.links.map((link) => (
                <li key={link.label}>
                  <PanelLink link={link} className="ev-chapter__meta-link" newTab={footer.newTab} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {attribution.enabled && (
        <div className="ev-chapter__panel-credit">
          <Credit attribution={attribution} />
        </div>
      )}
    </>
  );
}
