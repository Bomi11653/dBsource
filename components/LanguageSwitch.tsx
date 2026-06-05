"use client";

import { useI18n } from "./I18nProvider";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  const btn = (lang: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(lang)}
      className={`px-2.5 py-1 text-xs tracking-wider transition-colors ${
        locale === lang
          ? "text-white font-medium"
          : "text-gray-500 hover:text-gray-300"
      }`}
      aria-pressed={locale === lang}
    >
      {label}
    </button>
  );

  return (
    <div
      className="flex items-center border border-white/20 rounded overflow-hidden"
      aria-label="Language"
    >
      {btn("zh", t.nav.langZh)}
      <span className="w-px h-4 bg-white/15" />
      {btn("en", t.nav.langEn)}
    </div>
  );
}
