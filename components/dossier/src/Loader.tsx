import { cn, pad } from "../foundation";
import { PrimaryPlate } from "../controls";

export type DossierLoaderProps = {
  /** "Dossier 01", "Partie 02". */
  kicker: string;
  title: string;
  /** Readout beside the bar ("Décodage des médias"). */
  status: string;
  loaded: number;
  total: number;
  /** Spoken progress. */
  spoken: string;
  failed?: boolean;
  failedText?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

/** Honest wait state: count, one module per medium, 1px accent bar, retry on failure. */
export function DossierLoader({ kicker, title, status, loaded, total, spoken, failed = false, failedText, retryLabel, onRetry, className }: DossierLoaderProps) {
  const count = Math.max(total, 1);
  return (
    <div className={cn("evd-loader", className)} role="status" aria-live="polite" aria-label={spoken}>
      <div className="evd-loader__panel">
        <div className="evd-loader__head">
          <div>
            <span className="ev-t-readout evd-loader__kicker">{kicker}</span>
            <span className="evd-loader__title">{title}</span>
          </div>
          <span className="ev-t-readout-lg evd-loader__count" aria-hidden="true">
            {pad(loaded)} <span>/</span> {pad(total)}
          </span>
        </div>
        <div className="evd-loader__modules" style={{ ["--evd-modules" as string]: count }} aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="evd-loader__module" data-ready={i < loaded || undefined} style={{ ["--evd-delay" as string]: `${i * 90}ms` }}>
              <span className="ev-t-readout">{pad(i + 1)}</span>
            </span>
          ))}
        </div>
        <div className="evd-loader__bar-row">
          <span className="ev-t-readout evd-loader__status">{status}</span>
          <span className="evd-loader__bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${total ? loaded / total : 1})` }} />
          </span>
        </div>
        {failed && (
          <div className="evd-loader__failed" role="alert">
            <p className="ev-t-body">{failedText}</p>
            {onRetry && <PrimaryPlate onClick={onRetry}>{retryLabel}</PrimaryPlate>}
          </div>
        )}
      </div>
    </div>
  );
}
