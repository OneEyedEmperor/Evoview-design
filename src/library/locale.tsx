import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "fr" | "en";
export type Localized<T = string> = Record<Locale, T>;
export const LOCALES: readonly Locale[] = ["fr", "en"];

const STORAGE_KEY = "evoview-library:locale";

type LocaleContext = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: <T>(value: Localized<T>) => T;
};

const Context = createContext<LocaleContext | null>(null);

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "en") return stored;
  } catch {
    /* storage unavailable */
  }
  return "fr";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContext>(() => ({ locale, setLocale, t: (v) => v[locale] }), [locale, setLocale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLibraryLocale(): LocaleContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useLibraryLocale must be used inside <LocaleProvider>");
  return ctx;
}
