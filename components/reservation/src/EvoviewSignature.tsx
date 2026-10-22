import EvoviewLogo from "./brand/EvoviewLogo";

/* Protected Evoview attribution. The destination is Evoview's own site and is
   not a client setting; only the wording is (via copy). No tracking params. */
export const EVOVIEW_URL = "https://evoview.be/";

export function EvoviewSignature({ lead, ariaLabel }: { lead: string; ariaLabel: string }) {
  return (
    <div className="evo-resa__seal">
      <a className="evo-sig" href={EVOVIEW_URL} target="_blank" rel="noopener" aria-label={ariaLabel}>
        <svg className="evo-sig__eye" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path className="evo-sig__corners" d="M7 4H4v3m13-3h3v3M4 17v3h3m13-3v3h-3" />
          <path className="evo-sig__lid" d="M3 12Q12 1 21 12Q12 23 3 12Z" />
          <circle className="evo-sig__pupil" cx="12" cy="12" r="2.6" />
        </svg>
        <span className="evo-sig__lead">{lead}</span>
        <span className="evo-sig__rule" aria-hidden="true" />
        <EvoviewLogo className="evo-sig__wordmark" alt="" />
        <svg className="evo-sig__arrow" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </a>
    </div>
  );
}
