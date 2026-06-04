"use client";

import { translations, type Locale } from "@/lib/i18n";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface I18nContextValue {
  locale: Locale;
  t: (typeof translations)[Locale];
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const defaultValue: I18nContextValue = {
  locale: "zh",
  t: translations.zh,
  setLocale: () => {},
  toggleLocale: () => {},
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dbsource-locale") as Locale | null;
      if (saved === "zh" || saved === "en") setLocaleState(saved);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("dbsource-locale", l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "zh" ? "en" : "zh");
  }, [locale, setLocale]);

  const value = useMemo(
    () => ({
      locale,
      t: translations[locale],
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale]
  );

  return (
    <I18nContext.Provider value={hydrated ? value : defaultValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
