"use client";

import type { DownloadItem } from "@/data/mock";
import { useState } from "react";
import { useI18n } from "./I18nProvider";

export default function DownloadList({ items }: { items: DownloadItem[] }) {
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<"software" | "catalog">("software");

  const filtered = items.filter((i) => i.type === tab);

  return (
    <div>
      <div className="flex gap-4 mb-10">
        {(["software", "catalog"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm border transition-colors ${
              tab === key
                ? "border-brand-gold text-brand-gold bg-brand-gold/5"
                : "border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {key === "software" ? t.downloads.software : t.downloads.catalog}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((file) => (
          <li
            key={file.id}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-4 hover:bg-white/[0.02] px-2 transition-colors"
          >
            <div>
              <span className="text-white">{file.name[locale]}</span>
              <span className="text-gray-500 text-sm ml-4">
                {t.downloads.size}: {file.size}
              </span>
            </div>
            <a
              href={file.url}
              className="text-brand-gold text-sm hover:underline"
              download
            >
              {t.downloads.download} ↓
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
