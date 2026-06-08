"use client";

import { useI18n } from "@/components/I18nProvider";

type ProductSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  className?: string;
};

export default function ProductSearchBar({
  value,
  onChange,
  resultCount,
  className = "",
}: ProductSearchBarProps) {
  const { t } = useI18n();

  return (
    <div className={className}>
      <label htmlFor="product-search" className="sr-only">
        {t.products.searchLabel}
      </label>
      <div className="relative w-full">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id="product-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.products.searchPlaceholder}
          className="w-full min-h-[48px] rounded-2xl border border-white/15 bg-white/5 py-3 pl-12 pr-12 text-base text-white placeholder:text-gray-500 outline-none transition-colors focus:border-[#2eb896]/50 focus:bg-white/[0.07]"
          autoComplete="off"
          enterKeyHint="search"
        />
        {value.trim() && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="touch-target touch-active absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full text-gray-400 hover:text-white"
            aria-label={t.products.searchClear}
          >
            ×
          </button>
        )}
      </div>
      {value.trim() ? (
        <p className="mt-2 text-sm text-gray-500">
          {t.products.searchResults.replace("{count}", String(resultCount))}
        </p>
      ) : null}
    </div>
  );
}
