import { LOCALES, useLibraryLocale } from "./locale";

const LABEL = { fr: "Langue", en: "Language" };

export default function LocaleToggle() {
  const { locale, setLocale } = useLibraryLocale();
  return (
    <div role="group" aria-label={LABEL[locale]} className="lib-locale">
      {LOCALES.map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={locale === l} onClick={() => setLocale(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
