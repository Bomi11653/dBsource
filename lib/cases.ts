import { caseImageMap } from "@/data/case-images";
import { cases as caseCatalog, type CaseItem, type CaseType, type Locale } from "@/data/mock";

/** 全站案例展示顺序：工程案例 → 演出案例 */
export function sortCases(list: CaseItem[]): CaseItem[] {
  const order = [...CASE_TYPE_ORDER.engineering, ...CASE_TYPE_ORDER.performance];
  const byId = new Map(list.map((c) => [c.id, c]));
  return order.map((id) => byId.get(id)).filter((c): c is CaseItem => Boolean(c));
}

/** 将本地案例图册路径合并到案例数据（全站统一封面与图集） */
export function applyCaseImages(list: CaseItem[]): CaseItem[] {
  return list.map((item) => {
    const imgs = caseImageMap[item.id];
    if (!imgs) return item;
    return {
      ...item,
      image: imgs.cover,
      gallery: imgs.gallery,
    };
  });
}

export type CaseSubCategorySlug =
  | "stadium"
  | "festival"
  | "livehouse"
  | "convention"
  | "corporate"
  | "auditorium";

export interface CaseSubCategory {
  slug: CaseSubCategorySlug;
  type: CaseType;
  label: { zh: string; en: string };
}

export const CASE_TYPES: CaseType[] = ["engineering", "performance"];

/** 各类型案例在导航与列表中的固定顺序 */
export const CASE_TYPE_ORDER: Record<CaseType, number[]> = {
  engineering: [1, 2, 4],
  performance: [6, 5, 3],
};

/** 案例滚动叙事页：首屏 Sticky 主视觉 */
export const CASE_SCROLL_HERO_ID = 6;
/** 项目背景图文区 */
export const CASE_SCROLL_PROFILE_ID = 5;
/** 大图展示卡片区 */
export const CASE_SCROLL_SPOTLIGHT_ID = 1;

export function getScrollStoryLayout(cases: CaseItem[]) {
  const byId = new Map(cases.map((c) => [c.id, c]));
  const hero = byId.get(CASE_SCROLL_HERO_ID) ?? cases[0];
  const profile = byId.get(CASE_SCROLL_PROFILE_ID) ?? cases[1];
  const spotlight = byId.get(CASE_SCROLL_SPOTLIGHT_ID) ?? cases[2];

  const seen = new Set<number>();
  const moreCases: CaseItem[] = [];
  for (const id of CASE_TYPE_ORDER.performance) {
    const item = byId.get(id);
    if (item && !seen.has(id)) {
      moreCases.push(item);
      seen.add(id);
    }
  }
  for (const item of cases) {
    if (!seen.has(item.id)) {
      moreCases.push(item);
      seen.add(item.id);
    }
  }

  return { hero, profile, spotlight, moreCases };
}

export const CASE_SUB_CATEGORIES: CaseSubCategory[] = [
  {
    slug: "stadium",
    type: "performance",
    label: { zh: "体育场馆", en: "Stadiums" },
  },
  {
    slug: "festival",
    type: "performance",
    label: { zh: "演唱会 / 音乐节", en: "Concerts & Festivals" },
  },
  {
    slug: "livehouse",
    type: "performance",
    label: { zh: "Live House", en: "Live House" },
  },
  {
    slug: "convention",
    type: "engineering",
    label: { zh: "会展中心", en: "Convention Centers" },
  },
  {
    slug: "corporate",
    type: "engineering",
    label: { zh: "政企会议", en: "Corporate & Government" },
  },
  {
    slug: "auditorium",
    type: "engineering",
    label: { zh: "礼堂 / 剧院", en: "Auditoriums" },
  },
];

export function getCaseSubCategoriesForType(type: CaseType): CaseSubCategory[] {
  return CASE_SUB_CATEGORIES.filter((c) => c.type === type);
}

/** 导航子项：按类型自动配对已有案例项目名称（与产品中心子系列逻辑一致） */
export function getCasesForType(
  type: CaseType,
  list: CaseItem[] = applyCaseImages(caseCatalog)
): CaseItem[] {
  const order = CASE_TYPE_ORDER[type];
  const byId = new Map(list.filter((c) => c.type === type).map((c) => [c.id, c]));
  return order.map((id) => byId.get(id)).filter((c): c is CaseItem => Boolean(c));
}

export function getCaseMegaLinks(
  type: CaseType,
  locale: Locale,
  list?: CaseItem[]
): { key: string; href: string; label: string }[] {
  return getCasesForType(type, list).map((c) => ({
    key: String(c.id),
    href: `/cases/${c.id}`,
    label: c.title[locale],
  }));
}

export function getCaseSubCategoryBySlug(slug: string): CaseSubCategory | undefined {
  return CASE_SUB_CATEGORIES.find((c) => c.slug === slug);
}

export function caseSubCategoryLabel(sub: CaseSubCategory, locale: Locale): string {
  return sub.label[locale];
}

export function filterCasesBySub(
  list: CaseItem[],
  type?: CaseType | null,
  subSlug?: CaseSubCategorySlug | null
): CaseItem[] {
  let result = list;
  if (type) {
    result = result.filter((c) => c.type === type);
  }
  if (subSlug) {
    result = result.filter((c) => c.sceneSlug === subSlug);
  }
  return result;
}

export function getRelatedCases(
  currentId: number,
  allCases: CaseItem[],
  limit = 2
): CaseItem[] {
  return allCases.filter((c) => c.id !== currentId).slice(0, limit);
}
