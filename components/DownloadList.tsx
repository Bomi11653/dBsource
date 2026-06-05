"use client";

import type { DownloadItem } from "@/data/mock";
import { useI18n } from "./I18nProvider";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Tab = "software" | "catalog";

export default function DownloadList({ items }: { items: DownloadItem[] }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("software");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLLIElement | null>>({});

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "software" || tabParam === "catalog") {
      setTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fileId = Number(searchParams.get("file"));
    if (!Number.isFinite(fileId)) return;
    const el = rowRefs.current[fileId];
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-1", "ring-white/30", "bg-white/[0.04]");
        window.setTimeout(() => {
          el.classList.remove("ring-1", "ring-white/30", "bg-white/[0.04]");
        }, 2400);
      }, 300);
    }
  }, [searchParams, tab, items]);

  const filtered = items.filter((i) => i.type === tab);

  const shareLink = useCallback((file: DownloadItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/downloads?tab=${file.type}&file=${file.id}`;
  }, []);

  const handleShare = useCallback(
    async (file: DownloadItem) => {
      const url = shareLink(file);
      try {
        if (navigator.share) {
          await navigator.share({
            title: file.name[locale],
            url,
          });
        } else {
          await navigator.clipboard.writeText(url);
          setCopiedId(file.id);
          window.setTimeout(() => setCopiedId(null), 2000);
        }
      } catch {
        /* user cancelled or unsupported */
      }
    },
    [locale, shareLink]
  );

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
                ? "border-brand-gold text-white bg-brand-gold/5"
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
            ref={(el) => {
              rowRefs.current[file.id] = el;
            }}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-4 hover:bg-white/[0.02] px-2 transition-colors rounded-lg"
          >
            <div>
              <span className="text-white">{file.name[locale]}</span>
              <span className="text-gray-500 text-sm ml-4">
                {t.downloads.size}: {file.size}
              </span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => handleShare(file)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {copiedId === file.id ? t.downloads.shareCopied : t.downloads.share}
              </button>
              <a
                href={file.url}
                className="text-white text-sm hover:underline"
                download
              >
                {t.downloads.download} ↓
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
