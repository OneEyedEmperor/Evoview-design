import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import EvoviewLogo from "../../components/foundation/src/brand/EvoviewLogo";
import { TextFill } from "../../components/foundation/src/TextFill";
import { useInViewPause } from "../../components/foundation/src/useInViewPause";
import HeroEye from "./hero/HeroEye";
import { useLibraryLocale, type Localized } from "./locale";

const COPY: Localized = { fr: "La méthode Evoview", en: "The Evoview method" };
const HOME_LINK: Localized = {
  fr: "Evoview Library — retour à l'index",
  en: "Evoview Library — back to the index",
};

/* The hero is mounted per page, yet reads as one shared section: after its
   first reveal, later mounts start revealed (no card rise, shine or eye
   draw) and the reel resumes from the shared clock instead of restarting. */
/* One set repeats the four panels so it outruns a 2560px-wide viewport
   (27-inch class) at the widest card size; the duration is sized to the
   set's length to hold the reel's speed. Keep in step with the
   lib-hero-reel duration in library.css. */
const REEL_REPEAT = 4;
const REEL_MS = 144000;
const reelEpoch = typeof performance === "undefined" ? 0 : performance.now();
let heroRevealed = false;

const HERO_PANELS: { id: string; alt: Localized }[] = [
  {
    id: "identite-visuelle",
    alt: { fr: "Identité visuelle", en: "Visual identity" },
  },
  {
    id: "direction-artistique",
    alt: { fr: "Direction artistique", en: "Art direction" },
  },
  {
    id: "design-creation",
    alt: { fr: "Design & création", en: "Design & creation" },
  },
  {
    id: "strategie-marketing",
    alt: { fr: "Stratégie marketing", en: "Marketing strategy" },
  },
];

type Props = {
  /** Colour of the LIBRARY word's liquid fill; undefined = white. */
  accent?: string;
  /** The index owns the page title; elsewhere the lockup links back to it
      and the page's own header holds the h1. */
  home?: boolean;
  /** Under the lockup, inside it (the index's section bars). */
  bars?: ReactNode;
  /** Under the stage (the index's accent picker). */
  children?: ReactNode;
};

/* The Evoview Library hero, first section of every library page: the
   one-line lockup over the method-card reel. */
export default function LibraryHero({ accent, home = false, bars, children }: Props) {
  const { t } = useLibraryLocale();
  const [revealed] = useState(heroRevealed);
  useEffect(() => {
    heroRevealed = true;
  }, []);
  const row = (
    <span className="lib-hero__row">
      <span className="lib-hero__mark">
        <EvoviewLogo alt="Evoview" />
      </span>
      <HeroStamp revealed={revealed} />
      {/* Takes the picked accent as a liquid rise (RULES §1). */}
      <span className="lib-hero__word">
        <TextFill ink={accent ?? "#fff"}>Library</TextFill>
      </span>
    </span>
  );
  return (
    <section className="lib-hero lib-toned" data-tone="dark" data-nav-tone="dark">
      <div className="lib-rail lib-hero__stage">
        <div className="lib-hero__frame">
          <HeroReel label={t(COPY)} revealed={revealed} />
          {home ? (
            <h1 className="lib-hero__lockup">
              {row}
              {bars}
            </h1>
          ) : (
            <Link to="/" className="lib-hero__lockup" aria-label={t(HOME_LINK)}>
              {row}
              {bars ?? <BarsSlot />}
            </Link>
          )}
        </div>
        {/* The stage centres lockup + palette: slots left empty still hold
            their room, so the lockup sits where it does on the index. */}
        <div className="lib-hero__palette" aria-hidden={children ? undefined : true}>
          {children}
        </div>
      </div>
    </section>
  );
}

function BarsSlot() {
  return (
    <span className="lib-bars" data-slot="" aria-hidden="true">
      <span className="lib-bars__bar" />
    </span>
  );
}

/* The method cards as an endless, full-bleed reel behind the lockup: the
   set is laid twice and the track slides one set's width, so the seam never
   shows. The loop obeys the pause model by pausing the CSS animation in
   place. */
const REEL_SET = Array.from({ length: REEL_REPEAT }, () => HERO_PANELS).flat();
function HeroReel({ label, revealed }: { label: string; revealed: boolean }) {
  const { t } = useLibraryLocale();
  const ref = useRef<HTMLDivElement>(null);
  const { active } = useInViewPause(ref);
  const [phase] = useState(() => (revealed ? -((performance.now() - reelEpoch) % REEL_MS) : 0));
  return (
    <div ref={ref} className="lib-hero__reel" data-live={active || undefined}>
      <ul className="lib-hero__track" aria-label={label} style={phase ? { animationDelay: `${Math.round(phase)}ms` } : undefined}>
        {[0, 1].map((copy) =>
          REEL_SET.map((panel, i) => {
            const decorative = copy > 0 || i >= HERO_PANELS.length;
            return (
              <li key={`${copy}-${i}`} aria-hidden={decorative || undefined}>
                <HeroPanel id={panel.id} alt={decorative ? "" : t(panel.alt)} index={i} revealed={revealed} />
              </li>
            );
          }),
        )}
      </ul>
    </div>
  );
}

/* The method's final, ringed eye as a tilted stamp between mark and word;
   it draws in once, when first seen. */
function HeroStamp({ revealed }: { revealed: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { active } = useInViewPause(ref, { once: true });
  return (
    <span ref={ref} className="lib-hero__stamp" data-drawn={revealed || undefined} aria-hidden="true">
      {(active || revealed) && <HeroEye phase={4} />}
    </span>
  );
}

/* The method card without its eye: purple frame, graded image under a dim
   and a centre falloff, one shine sweep. Revealed once decoded (`complete`
   covers cached images on remount). */
function HeroPanel({ id, alt, index, revealed }: { id: string; alt: string; index: number; revealed: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(revealed);
  useEffect(() => {
    if (ref.current?.complete) setReady(true);
  }, []);
  return (
    <div className="lib-hero__panel" data-ready={ready || undefined} style={{ "--lib-stagger": index } as CSSProperties}>
      <div className="lib-hero__media">
        <img
          ref={ref}
          src={`/library/hero/${id}-768.webp`}
          srcSet={`/library/hero/${id}-480.webp 480w, /library/hero/${id}-768.webp 768w`}
          sizes="(min-width: 1024px) 19em, 30vw"
          alt={alt}
          width={768}
          height={768}
          decoding="async"
          draggable={false}
          onLoad={() => setReady(true)}
          onError={() => setReady(true)}
        />
        <span className="lib-hero__dim" aria-hidden="true" />
        {ready && !revealed && <span className="lib-hero__shine" aria-hidden="true" />}
      </div>
    </div>
  );
}
