"use client";

import type { DownloadItem } from "@/data/mock";
import { ArrowRight, Download, FileImage, Search, Share2 } from "lucide-react";
import CmsImage from "@/components/CmsImage";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "./I18nProvider";
import { filterDownloads } from "@/lib/downloads";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ---------- 展示层分类（不改动数据结构，纯前端映射） ---------- */

type CategoryKey = "software" | "catalog";

const CATEGORIES: { key: CategoryKey; label: { zh: string; en: string } }[] = [
  { key: "software", label: { zh: "软件工具", en: "Software" } },
  { key: "catalog", label: { zh: "产品画册", en: "Catalogs" } },
];

function matchCategory(file: DownloadItem, cat: CategoryKey): boolean {
  return file.type === cat;
}

/** 卡片上的类型标签（按 subCategory 细分，仅展示用） */
const TYPE_TAGS: Record<string, { zh: string; en: string }> = {
  unit48: { zh: "固件升级", en: "Firmware" },
  "preset-pack": { zh: "音箱系列", en: "Speakers" },
  sol12sa: { zh: "音箱系列", en: "Speakers" },
  "catalog-cn": { zh: "产品手册", en: "Manual" },
  "catalog-en": { zh: "产品手册", en: "Manual" },
  "case-study": { zh: "技术文档", en: "Docs" },
};

function typeTag(file: DownloadItem, locale: "zh" | "en"): string {
  const tag = TYPE_TAGS[file.subCategory];
  if (tag) return tag[locale];
  return file.type === "software"
    ? { zh: "软件工具", en: "Software" }[locale]
    : { zh: "产品手册", en: "Manual" }[locale];
}

/** 资源简介（仅展示用） */
const ITEM_DESC: Record<string, { zh: string; en: string }> = {
  v225a: {
    zh: "V225A 系列设备的调试与参数配置工具软件包。",
    en: "Tuning and configuration toolkit for V225A series.",
  },
  "dbcover-mac": {
    zh: "Mac 平台下的设备发现与控制软件，支持离线调试。",
    en: "Device discovery & control for Mac, with offline tuning.",
  },
  "dbcover-win": {
    zh: "Windows 平台下的设备发现与控制软件，稳定高效。",
    en: "Device discovery & control for Windows, stable & fast.",
  },
  unit48: {
    zh: "Unit48 最新软件与固件升级包。",
    en: "Latest Unit48 software and firmware update package.",
  },
  soloc: {
    zh: "SOLO C 系列设备控制软件。",
    en: "Control software for SOLO C series.",
  },
  "preset-pack": {
    zh: "V415A / V225A 音箱预设参数包。",
    en: "Preset pack for V415A / V225A loudspeakers.",
  },
  sol12sa: {
    zh: "SOL12SA 音箱预设参数包。",
    en: "Preset pack for SOL12SA loudspeakers.",
  },
  v415a: {
    zh: "V415A 功放控制软件。",
    en: "Amplifier control software for V415A.",
  },
  "catalog-cn": {
    zh: "dBsource 产品画册（中文版）。",
    en: "dBsource product catalog (Chinese).",
  },
  "catalog-en": {
    zh: "dBsource 产品画册（英文版）。",
    en: "dBsource product catalog (English).",
  },
  "case-study": {
    zh: "dBsource 工程案例集与技术文档。",
    en: "dBsource case studies and technical documentation.",
  },
};

function itemDesc(file: DownloadItem, locale: "zh" | "en"): string {
  /* 优先读后台填写的简介，未填时用内置文案兜底 */
  const cmsDesc = file.desc?.[locale]?.trim();
  if (cmsDesc) return cmsDesc;
  return ITEM_DESC[file.subCategory]?.[locale] ?? "";
}

const OS_LABELS: Record<NonNullable<DownloadItem["osType"]>, { zh: string; en: string }> = {
  windows: { zh: "Windows", en: "Windows" },
  mac: { zh: "Mac", en: "Mac" },
  "cross-platform": { zh: "全平台", en: "Cross-platform" },
};

/** 推荐下载兜底（后台未勾选任何「推荐」时使用） */
const FEATURED_SUBS = ["unit48", "dbcover-mac", "dbcover-win"] as const;

const UI_LABELS = {
  zh: {
    searchPlaceholder: "搜索软件、产品型号、资料名称...",
    featured: "推荐下载",
    featuredEn: "Recommended Resources",
    all: "全部资源",
    allEn: "All Resources",
    supportTitle: "需要技术支持？",
    supportDesc:
      "如果您不确定需要下载哪个文件，或在使用过程中遇到问题，请联系我们的技术团队获取帮助。",
    contactSupport: "联系技术支持",
    noResults: "暂无符合条件的资源",
    noCover: "暂无封面",
  },
  en: {
    searchPlaceholder: "Search software, models, documents...",
    featured: "Recommended",
    featuredEn: "Recommended Resources",
    all: "All Resources",
    allEn: "All Resources",
    supportTitle: "Need technical support?",
    supportDesc:
      "Not sure which file you need, or running into issues? Contact our engineering team for help.",
    contactSupport: "Contact Support",
    noResults: "No resources match your filters",
    noCover: "No cover",
  },
} as const;

function DownloadCover({
  cover,
  alt,
  compact,
}: {
  cover?: string;
  alt: string;
  compact?: boolean;
}) {
  if (!cover) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900/80 border border-white/10 ${
          compact ? "h-14 w-24 shrink-0 rounded-xl" : "absolute inset-0"
        }`}
        aria-label={alt}
      >
        <FileImage className={compact ? "h-6 w-6 text-white/25" : "h-10 w-10 text-white/25"} />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative h-14 w-24 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-white">
        <CmsImage
          src={cover}
          alt={alt}
          fill
          className="object-contain object-center p-1"
          sizes="96px"
        />
      </div>
    );
  }

  return (
    <CmsImage
      src={cover}
      alt={alt}
      fill
      className="object-contain object-center p-3 transition-transform duration-500 md:group-hover:scale-[1.03]"
      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
    />
  );
}

export default function DownloadList({ items }: { items: DownloadItem[] }) {
  const { locale, t } = useI18n();
  const ui = UI_LABELS[locale];
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [category, setCategory] = useState<CategoryKey>("software");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLLIElement | null>>({});

  const syncUrl = useCallback(
    (next: CategoryKey) => {
      const params = new URLSearchParams();
      params.set("tab", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "software" || tab === "catalog") {
      setCategory(tab);
    } else {
      setCategory("software");
    }
  }, [searchParams]);

  /* 兼容旧分享/导航链接 ?file=ID：滚动定位并高亮 */
  useEffect(() => {
    const fileId = Number(searchParams.get("file"));
    if (!Number.isFinite(fileId)) return;
    const el = rowRefs.current[fileId];
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-1", "ring-white/30", "bg-white/[0.06]");
        window.setTimeout(() => {
          el.classList.remove("ring-1", "ring-white/30", "bg-white/[0.06]");
        }, 2400);
      }, 300);
    }
  }, [searchParams, category, items]);

  /* 旧 sub 参数仍然生效（来自旧分享链接） */
  const legacySub = searchParams.get("sub");

  const filtered = useMemo(() => {
    let result = filterDownloads(items, null, null);
    result = result.filter((f) => matchCategory(f, category));
    if (legacySub) {
      result = result.filter((f) => f.subCategory === legacySub);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((f) =>
        [f.name.zh, f.name.en, f.fileName, f.subCategory]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return result;
  }, [items, category, legacySub, query]);

  const showFeatured = category === "software" && !query.trim() && !legacySub;
  const featured = useMemo(() => {
    if (!showFeatured) return [];
    /* 后台勾选了「推荐」则按勾选展示（最多 3 个），否则用内置兜底 */
    const flagged = items.filter((f) => f.featured);
    if (flagged.length > 0) return flagged.slice(0, 3);
    return FEATURED_SUBS.map((sub) => items.find((f) => f.subCategory === sub)).filter(
      (f): f is DownloadItem => Boolean(f)
    );
  }, [items, showFeatured]);

  const shareLink = useCallback((file: DownloadItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/downloads/${file.id}/file`;
  }, []);

  const downloadHref = useCallback((file: DownloadItem) => `/api/downloads/${file.id}/file`, []);

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
      {/* 搜索框 */}
      <div className="max-w-3xl mx-auto mt-10 md:mt-14 mb-6 md:mb-8">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.searchPlaceholder}
            className="w-full min-h-[56px] rounded-2xl border border-white/10 bg-white/[0.04] pl-[3.25rem] pr-5 py-4 text-base text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/30 focus:bg-white/[0.06]"
          />
        </div>
      </div>

      {/* 分类标签 */}
      <div className="filter-scroll flex gap-2 justify-start md:justify-center mb-12 md:mb-16 pb-1">
        {CATEGORIES.map((cat) => {
          const active = category === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setCategory(cat.key);
                syncUrl(cat.key);
              }}
              className={`filter-chip touch-active shrink-0 min-h-[42px] px-5 py-2 text-sm rounded-full border whitespace-nowrap transition-colors ${
                active
                  ? "border-white bg-white text-black font-medium"
                  : "border-white/10 bg-white/[0.04] text-white/[0.62] hover:text-white hover:border-white/25"
              }`}
            >
              {cat.label[locale]}
            </button>
          );
        })}
      </div>

      {/* 推荐下载 */}
      {featured.length > 0 && (
        <section className="mb-14 md:mb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-light text-white">{ui.featured}</h2>
              <p className="text-xs text-white/[0.45] mt-1 tracking-wide">{ui.featuredEn}</p>
            </div>
          </div>
          <ul className="grid md:grid-cols-3 gap-4 md:gap-5">
            {featured.map((file) => (
              <li
                key={file.id}
                ref={(el) => {
                  rowRefs.current[file.id] = el;
                }}
                className="group relative flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 md:p-6 transition-all duration-300 hover:border-white/25 md:hover:-translate-y-1"
              >
                <div className="flex items-start gap-4 mb-4">
                  <DownloadCover cover={file.cover} alt={file.name[locale] || ui.noCover} compact />
                  <div className="min-w-0">
                    <h3 className="text-base font-medium text-white leading-snug">
                      {file.name[locale]}
                      {file.version ? (
                        <span className="ml-2 text-xs font-normal text-white/[0.45] font-mono">
                          v{file.version}
                        </span>
                      ) : null}
                    </h3>
                    <span className="inline-block mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]">
                      {typeTag(file, locale)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-white/[0.62] leading-relaxed flex-1">
                  {itemDesc(file, locale)}
                </p>
                <div className="flex items-center gap-2 mt-5">
                  <a
                    href={downloadHref(file)}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors touch-active"
                  >
                    {t.downloads.download}
                    <Download size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleShare(file)}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 rounded-xl border border-white/10 text-sm text-white/[0.62] hover:text-white hover:border-white/25 transition-colors touch-active"
                  >
                    <Share2 size={14} />
                    {copiedId === file.id ? t.downloads.shareCopied : t.downloads.share}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 全部资源 */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-white">{ui.all}</h2>
            <p className="text-xs text-white/[0.45] mt-1 tracking-wide">{ui.allEn}</p>
          </div>
          <span className="text-sm text-white/[0.45]">{filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-white/[0.45] py-20 rounded-3xl border border-white/10 bg-white/[0.02]">
            {ui.noResults}
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((file) => (
              <li
                key={file.id}
                ref={(el) => {
                  rowRefs.current[file.id] = el;
                }}
                className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden transition-all duration-300 hover:border-white/25 md:hover:-translate-y-1"
              >
                <div
                  className={`relative w-full aspect-[16/9] border-b border-white/10 ${
                    file.cover ? "bg-white" : "bg-zinc-900/80"
                  }`}
                >
                  <DownloadCover cover={file.cover} alt={file.name[locale] || ui.noCover} />
                </div>
                <div className="flex flex-col flex-1 p-4 md:p-5">
                  <h3 className="text-sm md:text-[15px] font-medium text-white leading-snug line-clamp-2">
                    {file.name[locale]}
                    {file.version ? (
                      <span className="ml-1.5 text-xs font-normal text-white/[0.45] font-mono">
                        v{file.version}
                      </span>
                    ) : null}
                  </h3>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]">
                      {typeTag(file, locale)}
                    </span>
                    <span className="text-xs text-white/[0.45]">
                      {[file.size, file.osType ? OS_LABELS[file.osType][locale] : null, file.releasedAt]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <p className="text-xs text-white/[0.62] leading-relaxed mt-3 flex-1 line-clamp-2">
                    {itemDesc(file, locale)}
                  </p>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.08]">
                    <a
                      href={downloadHref(file)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors touch-active"
                    >
                      {t.downloads.download}
                      <Download size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleShare(file)}
                      className="inline-flex items-center justify-center min-h-[40px] min-w-[44px] rounded-xl border border-white/10 text-white/[0.62] hover:text-white hover:border-white/25 transition-colors touch-active"
                      aria-label={copiedId === file.id ? t.downloads.shareCopied : t.downloads.share}
                      title={copiedId === file.id ? t.downloads.shareCopied : t.downloads.share}
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 技术支持 CTA */}
      <section className="mt-16 md:mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent px-6 md:px-12 py-10 md:py-12">
          <div
            className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#3b82f6]/10 blur-[80px]"
            aria-hidden
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-medium text-white mb-2">
                {ui.supportTitle}
              </h2>
              <p className="text-sm text-white/[0.62] leading-relaxed max-w-2xl">
                {ui.supportDesc}
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 min-h-[50px] px-7 rounded-2xl bg-[#2563eb] text-white text-sm font-medium hover:bg-[#3b82f6] transition-colors touch-active"
            >
              {ui.contactSupport}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
