"use client";

import type { ProductSpecSheet } from "@/data/product-specs";
import type { Locale } from "@/lib/i18n";
import { useState } from "react";

export default function StackedSpecPanel({
  pages,
  locale,
}: {
  pages: ProductSpecSheet[];
  locale: Locale;
}) {
  const [activePage, setActivePage] = useState(0);
  const sheet = pages[activePage];

  return (
    <div className="relative">
      <div
        className="absolute inset-x-4 top-4 bottom-0 rounded-xl border border-white/5 bg-white/[0.02]"
        aria-hidden
      />
      <div
        className="absolute inset-x-2 top-2 bottom-0 rounded-xl border border-white/8 bg-white/[0.04]"
        aria-hidden
      />
      <div className="relative rounded-xl border border-white/15 bg-black/40 overflow-hidden">
        <div className="flex flex-wrap gap-2 p-4 md:p-5 border-b border-white/10">
          {pages.map((page, i) => (
            <button
              key={page.model}
              type="button"
              onClick={() => setActivePage(i)}
              className={`min-h-[40px] px-3 py-2 text-xs font-mono rounded-full transition-colors touch-active ${
                activePage === i
                  ? "bg-[#2eb896] text-black"
                  : "border border-white/20 text-gray-400 hover:text-white hover:border-white/40"
              }`}
            >
              {page.model}
            </button>
          ))}
        </div>
        <div className="px-4 md:px-5 py-3 border-b border-white/5">
          <p className="text-xs text-brand-gold/80 font-mono">{sheet.summary[locale]}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[280px]">
            <tbody>
              {sheet.rows.map((row, i) => (
                <tr
                  key={`${sheet.model}-${row.label.zh}`}
                  className={i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
                >
                  <th className="text-left font-normal text-gray-400 px-5 py-3 w-2/5 border-b border-white/5">
                    {row.label[locale]}
                  </th>
                  <td className="text-white px-5 py-3 border-b border-white/5">
                    {row.value[locale]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
