import { useLibraryLocale } from "./locale";
import type { Status } from "./registry";

const LABEL = {
  ready: { fr: "Version", en: "Version" },
  building: { fr: "En construction", en: "In construction" },
};

/* A ready package shows its version only (every live entry is ready, so a
   "ready" word would repeat on every card); a building one says so. */
export default function StatusTag({ status, version }: { status: Status; version?: string }) {
  const { locale } = useLibraryLocale();
  if (status === "ready") {
    return version ? (
      <span className="lib-status lib-voice-state" data-status={status}>
        <span className="lib-sr">{LABEL.ready[locale]} </span>v{version}
      </span>
    ) : null;
  }
  return (
    <span className="lib-status lib-voice-state" data-status={status}>
      <span aria-hidden="true" className="lib-dot lib-dot--building" />
      {LABEL.building[locale]}
      {version && <span className="lib-status__version">v{version}</span>}
    </span>
  );
}
