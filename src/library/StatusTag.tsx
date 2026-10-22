import { useLibraryLocale } from "./locale";
import type { Status } from "./registry";

const LABEL = {
  ready: { fr: "Prêt", en: "Ready" },
  building: { fr: "En construction", en: "In construction" },
};

export default function StatusTag({ status, version }: { status: Status; version?: string }) {
  const { locale } = useLibraryLocale();
  return (
    <span className="lib-status lib-voice-state" data-status={status}>
      <span aria-hidden="true" className={`lib-dot lib-dot--${status}`} />
      {LABEL[status][locale]}
      {version && <span className="lib-status__version">v{version}</span>}
    </span>
  );
}
