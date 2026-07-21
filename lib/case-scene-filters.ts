import type { CaseItem, CaseType, Locale } from "@/data/mock";

/** 遗留场景 slug（仅用于旧 URL / 首页跳转，不再映射到 CaseItem） */
export type LegacyCaseSceneSlug =
  | "stadium"
  | "festival"
  | "livehouse"
  | "convention"
  | "corporate"
  | "auditorium";

export type CaseSceneFilterId =
  | "performance"
  | "stadium"
  | "conference"
  | "education"
  | "theater"
  | "outdoor"
  | "installation";

const CASE_SCENE_FILTERS: Record<
  CaseSceneFilterId,
  { slugs: LegacyCaseSceneSlug[]; label: { zh: string; en: string } }
> = {
  performance: {
    slugs: ["festival"],
    label: { zh: "演唱会 / 音乐节", en: "Concerts & Festivals" },
  },
  stadium: {
    slugs: ["stadium"],
    label: { zh: "体育场馆", en: "Stadiums" },
  },
  conference: {
    slugs: ["auditorium"],
    label: { zh: "会议 / 礼堂", en: "Conference & Auditorium" },
  },
  education: {
    slugs: ["auditorium"],
    label: { zh: "学校 / 礼堂", en: "Schools & Auditoriums" },
  },
  theater: {
    slugs: ["auditorium"],
    label: { zh: "剧院 / 剧场", en: "Theaters" },
  },
  outdoor: {
    slugs: ["festival"],
    label: { zh: "户外活动", en: "Outdoor Events" },
  },
  installation: {
    slugs: ["auditorium"],
    label: { zh: "固定安装", en: "Fixed Installation" },
  },
};

/** @deprecated 场景分类已从案例前台移除；保留供旧链接兼容提示 */
export const ADMIN_CASE_SCENE_OPTIONS = [
  { value: "festival", label: "演唱会 / 音乐节" },
  { value: "stadium", label: "体育场馆" },
  { value: "auditorium", label: "会议 / 礼堂" },
] as const;

export type AdminCaseSceneSlug = (typeof ADMIN_CASE_SCENE_OPTIONS)[number]["value"];

const CASE_SCENE_FILTER_IDS = new Set<string>(Object.keys(CASE_SCENE_FILTERS));

export function isCaseSceneFilterId(value: string): value is CaseSceneFilterId {
  return CASE_SCENE_FILTER_IDS.has(value);
}

export function getCaseSceneFilterLabel(id: CaseSceneFilterId, locale: Locale): string {
  return CASE_SCENE_FILTERS[id].label[locale];
}

/** @deprecated 场景筛选已废弃，始终返回原列表 */
export function filterCasesBySceneFilter(list: CaseItem[], _filterId: CaseSceneFilterId): CaseItem[] {
  return list;
}

/** 首页应用场景卡片 → 案例页（仅保留 type 入口） */
export function getHomeSceneHref(_scene: { sortOrder?: number; id?: number }): string {
  return "/cases";
}
