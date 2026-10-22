/* Evoview marks, as drawn on evoview.be (candidature flow). */

export function EyeGlyph({ className, variant = 4 }: { className?: string; variant?: number }) {
  const v = variant % 5;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {v === 4 && <path d="M7 4H4v3m13-3h3v3M4 17v3h3m13-3v3h-3" />}
      <path d="M3 12Q12 1 21 12Q12 23 3 12Z" />
      {v === 0 && <circle cx="12" cy="12" r="3.2" />}
      {v === 1 && <><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></>}
      {v === 2 && <><path d="m9 14 3-4 3 4M12 10v6M12 2v2" /><path d="m8 3 1 2m7-2-1 2" /></>}
      {v === 3 && <path d="m12 8 1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2Z" />}
      {v === 4 && <circle cx="12" cy="12" r="2.2" fill="currentColor" />}
    </svg>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  );
}

export function Chevron({ className, dir }: { className?: string; dir: "left" | "right" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

export function Hud() {
  return (
    <span className="evo-resa-hud" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}
