import type { CaseItem, Locale } from "@/data/mock";

/** CMS 项目概述来源（detail 优先，desc 兼容） */
export type CaseOverviewSource = {
  detailZh?: unknown;
  detailEn?: unknown;
  descZh?: string | null;
  descEn?: string | null;
};

export function richtextToPlain(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";

  return value
    .map((block) => {
      if (
        block &&
        typeof block === "object" &&
        "children" in block &&
        Array.isArray((block as { children: unknown[] }).children)
      ) {
        return (block as { children: { text?: string }[] }).children
          .map((child) => child.text ?? "")
          .join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/** Strapi / Mock → 前台统一 projectOverview */
export function resolveCaseProjectOverview(source: CaseOverviewSource): {
  zh: string;
  en: string;
} {
  const detailZh = richtextToPlain(source.detailZh);
  const detailEn = richtextToPlain(source.detailEn);
  const descZh = source.descZh?.trim() || "";
  const descEn = source.descEn?.trim() || "";

  return {
    zh: detailZh || descZh,
    en: detailEn || descEn,
  };
}

export function getCaseProjectOverview(item: CaseItem, locale: Locale): string {
  return item.projectOverview[locale]?.trim() || item.projectOverview.zh || "";
}

export function getCaseOverviewExcerpt(
  item: CaseItem,
  locale: Locale,
  maxLength = 160
): string {
  const text = getCaseProjectOverview(item, locale).replace(/\s+/g, " ");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

/** 在 projectOverview 文本中匹配型号（替代已废弃的 products 字段） */
export function caseOverviewMatchesModelCodes(
  item: CaseItem,
  codes: string[]
): boolean {
  if (!codes.length) return false;
  const hay = [item.projectOverview.zh, item.projectOverview.en]
    .join(" ")
    .toUpperCase();
  return codes.some((code) => hay.includes(code.trim().toUpperCase()));
}
