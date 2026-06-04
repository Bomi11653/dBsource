"use client";

import { getPageNumbers } from "@/lib/pagination";
import { FormEvent, useState } from "react";
import { useI18n } from "./I18nProvider";

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function ProductPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: Props) {
  const { t } = useI18n();
  const [jumpValue, setJumpValue] = useState("");

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  function handleJump(e: FormEvent) {
    e.preventDefault();
    const page = parseInt(jumpValue, 10);
    if (!Number.isNaN(page)) onPageChange(page);
    setJumpValue("");
  }

  const showingText = t.products.showing
    .replace("{from}", String(from))
    .replace("{to}", String(to));

  const totalText = t.products.total.replace("{count}", String(totalItems));

  return (
    <div className="mt-12 pt-8 border-t border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <p className="text-xs text-gray-500 tracking-wide">
        {showingText}
        <span className="mx-2 text-white/20">|</span>
        {totalText}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-4 py-2 text-xs border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          {t.products.prev}
        </button>

        {pages.map((page, i) =>
          page === "ellipsis" ? (
            <span key={`e-${i}`} className="px-2 text-gray-600">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-[2.25rem] px-3 py-2 text-xs rounded transition-colors ${
                page === currentPage
                  ? "bg-brand-gold/20 text-brand-gold border border-brand-gold/40"
                  : "border border-white/10 hover:bg-white/5 text-gray-400"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-4 py-2 text-xs border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          {t.products.next}
        </button>

        <form onSubmit={handleJump} className="flex items-center gap-2 ml-2">
          <input
            type="number"
            name="page"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder={t.products.jumpPlaceholder}
            className="w-16 px-2 py-2 text-xs bg-zinc-900 border border-white/10 rounded text-white outline-none focus:border-brand-gold/50"
          />
          <button
            type="submit"
            className="px-3 py-2 text-xs bg-white/10 rounded hover:bg-brand-gold/20 hover:text-brand-gold transition-colors"
          >
            {t.products.go}
          </button>
        </form>
      </div>
    </div>
  );
}
