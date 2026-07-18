"use client";

import type { ReactNode } from "react";
import { useI18n } from "./I18nProvider";

export type ProductFilterTab = {
  id: string;
  label: string;
};

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base = "filter-chip touch-active transition";
  const pillActive = "bg-brand-gold/90 text-black";
  const pillIdle = "bg-white/5 text-gray-300 hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? pillActive : pillIdle}`}
    >
      {children}
    </button>
  );
}

export default function ProductSeriesBar({
  tabs,
  activeId,
  onChange,
  resultCount,
  search,
}: {
  tabs: ProductFilterTab[];
  activeId: string;
  onChange: (id: string) => void;
  resultCount: number;
  search?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-6 md:mb-10">
      <div className="sticky top-[calc(4.25rem+env(safe-area-inset-top,0px))] z-30 -mx-1 px-1 py-3 md:static md:mx-0 md:px-0 md:py-0 bg-black/92 backdrop-blur-xl md:bg-transparent border-b border-white/10 md:border-0 space-y-3 md:space-y-6">
        {search ? <div className="md:hidden w-full">{search}</div> : null}

        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4 md:border-b md:border-white/10 md:pb-4">
          <div className="filter-scroll md:flex md:flex-wrap md:gap-3 min-w-0 -mx-1 px-1">
            {tabs.map((tab) => (
              <FilterButton
                key={tab.id}
                active={activeId === tab.id}
                onClick={() => onChange(tab.id)}
              >
                {tab.label}
              </FilterButton>
            ))}
          </div>
          <span className="text-xs text-gray-500 md:hidden">
            {t.products.total.replace("{count}", String(resultCount))}
          </span>
          {search ? (
            <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">{search}</div>
          ) : null}
        </div>

        <p className="hidden md:block text-xs text-gray-500">
          {t.products.total.replace("{count}", String(resultCount))}
        </p>
      </div>
    </div>
  );
}
