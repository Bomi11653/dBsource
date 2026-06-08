"use client";

import type { DownloadItem } from "@/data/mock";
import {
  filterDownloads,
  getDownloadSubCategoriesForTab,
  getDownloadSubCategoryBySlug,
  downloadSubCategoryLabel,
  type DownloadSubCategorySlug,
  type DownloadTab,
} from "@/lib/downloads";
import Image from "next/image";
import { useI18n } from "./I18nProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function DownloadList({ items }: { items: DownloadItem[] }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<DownloadTab>("software");
  const [subCategory, setSubCategory] = useState<DownloadSubCategorySlug | "all">("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLLIElement | null>>({});

  const syncUrl = useCallback(
    (next: { tab: DownloadTab; sub: DownloadSubCategorySlug | "all" }) => {
      const params = new URLSearchParams();
      params.set("tab", next.tab);
      if (next.sub !== "all") params.set("sub", next.sub);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "software" || tabParam === "catalog") {
      setTab(tabParam);
    }
    const sub = searchParams.get("sub");
    if (sub && getDownloadSubCategoryBySlug(sub)) {
      setSubCategory(sub as DownloadSubCategorySlug);
    } else {
      setSubCategory("all");
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

  const subOptions = getDownloadSubCategoriesForTab(tab);

  const filtered = filterDownloads(
    items,
    tab,
    subCategory === "all" ? null : subCategory
  );

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
      <div className="flex gap-2 sm:gap-4 mb-6 md:mb-8">
        {(["software", "catalog"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setSubCategory("all");
              syncUrl({ tab: key, sub: "all" });
            }}
            className={`flex-1 min-h-[48px] px-4 py-2.5 text-sm border rounded-lg transition-colors touch-active ${
              tab === key
                ? "border-brand-gold text-white bg-brand-gold/5"
                : "border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {key === "software" ? t.downloads.software : t.downloads.catalog}
          </button>
        ))}
      </div>

      {subOptions.length > 0 ? (
        <div className="filter-scroll flex gap-2 mb-8 md:mb-10 pb-1">
          <button
            type="button"
            onClick={() => {
              setSubCategory("all");
              syncUrl({ tab, sub: "all" });
            }}
            className={`filter-chip touch-active px-4 py-2 text-sm rounded-lg border ${
              subCategory === "all"
                ? "border-brand-gold/50 text-brand-gold bg-brand-gold/10"
                : "border-white/10 text-gray-400"
            }`}
          >
            {t.products.filterAll}
          </button>
          {subOptions.map((sub) => (
            <button
              key={sub.slug}
              type="button"
              onClick={() => {
                setSubCategory(sub.slug);
                syncUrl({ tab, sub: sub.slug });
              }}
              className={`filter-chip touch-active px-4 py-2 text-sm rounded-lg border whitespace-nowrap ${
                subCategory === sub.slug
                  ? "border-brand-gold/50 text-brand-gold bg-brand-gold/10"
                  : "border-white/10 text-gray-400"
              }`}
            >
              {downloadSubCategoryLabel(sub, locale)}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="space-y-2">
        {filtered.map((file) => (
          <li
            key={file.id}
            ref={(el) => {
              rowRefs.current[file.id] = el;
            }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 py-4 hover:bg-white/[0.02] px-2 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative w-[112px] h-[44px] md:w-[120px] md:h-[47px] shrink-0 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                <Image
                  src={file.cover}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="120px"
                />
              </div>
              <div className="min-w-0">
                <span className="text-white block truncate">{file.name[locale]}</span>
                <span className="text-gray-500 text-sm">
                  {t.downloads.size}: {file.size}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleShare(file)}
                className="flex-1 sm:flex-none min-h-[44px] px-4 text-sm text-gray-400 hover:text-white transition-colors touch-active rounded-lg border border-white/10 sm:border-0"
              >
                {copiedId === file.id ? t.downloads.shareCopied : t.downloads.share}
              </button>
              <a
                href={file.url}
                className="flex-1 sm:flex-none inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-brand-gold/90 text-black text-sm font-medium hover:bg-brand-gold transition-colors touch-active"
                download={file.url !== "#"}
                target={file.url.startsWith("http") ? "_blank" : undefined}
                rel={file.url.startsWith("http") ? "noopener noreferrer" : undefined}
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
