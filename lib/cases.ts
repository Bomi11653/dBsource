import { caseImageMap } from "@/data/case-images";
import { cases as caseCatalog, type CaseItem, type CaseType, type Locale } from "@/data/mock";

/** 全站案例展示顺序：工程案例 → 演出案例 */
export function sortCases(list: CaseItem[]): CaseItem[] {
  const byType = {
    engineering: list.filter((c) => c.type === "engineering"),
    performance: list.filter((c) => c.type === "performance"),
  } as const;

  return [
    ...sortCasesWithinType(byType.engineering, "engineering"),
    ...sortCasesWithinType(byType.performance, "performance"),
  ];
}

/** 将本地案例图册路径合并到案例数据（仅 Mock 模式使用） */
export function applyCaseImages(list: CaseItem[]): CaseItem[] {
  return list.map((item) => {
    const imgs = caseImageMap[item.id];
    if (!imgs) return item;
    const hasCmsCover = Boolean(item.imageUrl || item.image);
    const hasCmsGallery = Array.isArray(item.gallery) && item.gallery.length > 0;
    const cover = hasCmsCover ? (item.imageUrl || item.image) : imgs.cover;
    return {
      ...item,
      image: cover,
      imageUrl: cover,
      gallery: hasCmsGallery ? item.gallery : imgs.gallery,
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

  const featuredIds = new Set(
    [hero?.id, profile?.id, spotlight?.id].filter((id): id is number => id != null)
  );

  const moreCases: CaseItem[] = [];
  for (const item of cases) {
    if (!featuredIds.has(item.id)) {
      moreCases.push(item);
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
  const sameType = list.filter((c) => c.type === type);
  return sortCasesWithinType(sameType, type);
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

function sortCasesWithinType(list: CaseItem[], type: CaseType): CaseItem[] {
  const preferredOrder = CASE_TYPE_ORDER[type];
  const hasCmsSort = list.some((item) => typeof item.sortOrder === "number");
  if (hasCmsSort) {
    const preferredRank = new Map(preferredOrder.map((id, index) => [id, index]));
    return [...list].sort((a, b) => {
      const aHasSort = typeof a.sortOrder === "number";
      const bHasSort = typeof b.sortOrder === "number";

      if (aHasSort && bHasSort && a.sortOrder !== b.sortOrder) {
        return (a.sortOrder as number) - (b.sortOrder as number);
      }
      if (aHasSort !== bHasSort) {
        return aHasSort ? -1 : 1;
      }

      const aPreferred = preferredRank.get(a.id);
      const bPreferred = preferredRank.get(b.id);
      if (aPreferred != null && bPreferred != null && aPreferred !== bPreferred) {
        return aPreferred - bPreferred;
      }
      if (aPreferred != null && bPreferred == null) return -1;
      if (aPreferred == null && bPreferred != null) return 1;

      return a.id - b.id;
    });
  }

  const byId = new Map(list.map((item) => [item.id, item]));
  const ordered = preferredOrder
    .map((id) => byId.get(id))
    .filter((item): item is CaseItem => Boolean(item));

  const orderedIds = new Set(ordered.map((item) => item.id));
  const appended = list.filter((item) => !orderedIds.has(item.id));

  return [...ordered, ...appended];
}
