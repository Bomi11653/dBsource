"use client";

import { useI18n } from "./I18nProvider";

export default function LanguageSwitch() {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="text-xs border border-white/20 px-3 py-1.5 rounded hover:border-brand-gold/50 hover:text-brand-gold transition-colors tracking-wider"
      aria-label="Toggle language"
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  );
}
