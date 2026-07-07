import type { CaseItem, CaseSceneSlug, Locale, SceneItem } from "@/data/mock";

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
  { slugs: CaseSceneSlug[]; label: { zh: string; en: string } }
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

/** 后台案例编辑：应用场景分类（写入 sceneSlug） */
export const ADMIN_CASE_SCENE_OPTIONS = [
  { value: "festival", label: "演唱会 / 音乐节" },
  { value: "stadium", label: "体育场馆" },
  { value: "auditorium", label: "会议 / 礼堂" },
] as const;

export type AdminCaseSceneSlug = (typeof ADMIN_CASE_SCENE_OPTIONS)[number]["value"];

const ADMIN_CASE_SCENE_SLUGS = new Set<string>(
  ADMIN_CASE_SCENE_OPTIONS.map((option) => option.value)
);

export function isAdminCaseSceneSlug(value: string): value is AdminCaseSceneSlug {
  return ADMIN_CASE_SCENE_SLUGS.has(value);
}

export function getAdminCaseSceneLabel(slug: string): string {
  return (
    ADMIN_CASE_SCENE_OPTIONS.find((option) => option.value === slug)?.label ?? slug
  );
}

export function resolveAdminCaseSceneSelectValue(slug: string): AdminCaseSceneSlug {
  if (isAdminCaseSceneSlug(slug)) return slug;
  return "festival";
}

const CASE_SCENE_FILTER_IDS = new Set<string>(Object.keys(CASE_SCENE_FILTERS));

export function isCaseSceneFilterId(value: string): value is CaseSceneFilterId {
  return CASE_SCENE_FILTER_IDS.has(value);
}

export function getCaseSceneFilterLabel(id: CaseSceneFilterId, locale: Locale): string {
  return CASE_SCENE_FILTERS[id].label[locale];
}

export function filterCasesBySceneFilter(
  list: CaseItem[],
  filterId: CaseSceneFilterId
): CaseItem[] {
  const slugs = new Set(CASE_SCENE_FILTERS[filterId].slugs);
  return list.filter((item) => slugs.has(item.sceneSlug));
}

/** 首页应用场景卡片 → 案例页 scene 筛选链接 */
export function getHomeSceneHref(scene: SceneItem): string {
  const blob = `${scene.name.zh} ${scene.name.en}`.toLowerCase();

  if (/演唱会|音乐节|concert|festival/.test(blob)) {
    return "/cases?scene=performance";
  }
  if (/体育|场馆|stadium/.test(blob)) {
    return "/cases?scene=stadium";
  }
  if (/会议|礼堂|conference|auditorium/.test(blob)) {
    return "/cases?scene=conference";
  }

  const order = scene.sortOrder ?? scene.id;
  if (order === 1) return "/cases?scene=performance";
  if (order === 2) return "/cases?scene=stadium";
  if (order === 3) return "/cases?scene=conference";

  return "/cases";
}
