/** 首字母 / 拼音缩写 → 扩展检索词（本地索引，不改 Strapi） */
export const SEARCH_INITIAL_ALIASES: Record<string, string[]> = {
  la: ["la", "LA", "线阵", "线阵列", "line array", "linearray"],
  xz: ["线阵", "线阵列", "la"],
  ct: ["超低", "sub", "subwoofer"],
  ft: ["返听", "monitor", "mi"],
  yf: ["音箱", "speaker"],
  gf: ["功放", "amplifier"],
  hy: ["会议", "会议室", "conference"],
  ty: ["体育馆", "体育场馆", "stadium", "体育"],
  yx: ["演出", "演艺", "演唱会", "livehouse", "live house"],
  xx: ["学校", "校园", "school"],
  jy: ["剧院", "theater", "theatre"],
};

/** 应用场景展示名（用于搜索命中后的标题） */
export const SEARCH_SCENE_LABELS: Record<
  string,
  { zh: string; en: string; href: string }
> = {
  livehouse: {
    zh: "Live House / 演艺空间",
    en: "Live House venues",
    href: "/configurator?scene=livehouse",
  },
  stadium: {
    zh: "体育场馆",
    en: "Stadiums & arenas",
    href: "/configurator?scene=stadium",
  },
  体育馆: {
    zh: "体育场馆",
    en: "Stadiums & arenas",
    href: "/configurator?scene=stadium",
  },
  conference: {
    zh: "会议 / 报告厅",
    en: "Conference & auditorium",
    href: "/configurator?scene=conference",
  },
  会议: {
    zh: "会议 / 报告厅",
    en: "Conference & auditorium",
    href: "/configurator?scene=conference",
  },
  演唱会: {
    zh: "演唱会 / 流动演出",
    en: "Concerts & touring",
    href: "/cases?type=performance",
  },
  学校: {
    zh: "学校 / 校园",
    en: "Schools & campuses",
    href: "/cases?type=engineering",
  },
  剧院: {
    zh: "剧院",
    en: "Theaters",
    href: "/cases?type=engineering",
  },
};

export function expandInitialAliases(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = new Set<string>([q]);
  const direct = SEARCH_INITIAL_ALIASES[q];
  if (direct) {
    direct.forEach((t) => terms.add(t.toLowerCase()));
  }
  for (const [key, values] of Object.entries(SEARCH_INITIAL_ALIASES)) {
    if (q.includes(key) || values.some((v) => q.includes(v.toLowerCase()))) {
      terms.add(key);
      values.forEach((v) => terms.add(v.toLowerCase()));
    }
  }
  return Array.from(terms);
}
