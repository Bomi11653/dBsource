import { SCENE_TAGS, SEARCH_SYNONYMS } from "@/data/ai-synonyms";

/** 从用户问题中提取产品型号（如 DO106、LA206） */
export function extractModelCodes(query: string): string[] {
  const matches = query.match(/\b[A-Za-z]{1,5}\d{2,4}[A-Za-z]?\b/g) ?? [];
  return [...new Set(matches.map((m) => m.toUpperCase()))];
}

/** 按型号精确匹配产品；单型号查询时只返回完全一致的型号 */
export function matchProductsByModelCodes<
  T extends { model: string }
>(products: T[], modelCodes: string[]): T[] {
  if (!modelCodes.length) return [];
  const matched = products.filter((p) =>
    modelCodes.some(
      (code) =>
        p.model.toUpperCase() === code || p.model.toUpperCase().startsWith(code)
    )
  );
  if (modelCodes.length === 1) {
    const exact = matched.filter((p) => p.model.toUpperCase() === modelCodes[0]);
    if (exact.length) return exact;
  }
  return matched;
}

export function expandSearchQuery(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = new Set<string>([q]);
  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    const keyLower = key.toLowerCase();
    if (q.includes(keyLower) || values.some((v) => q.includes(v.toLowerCase()))) {
      terms.add(keyLower);
      values.forEach((v) => terms.add(v.toLowerCase()));
    }
  }
  return Array.from(terms);
}

export function matchSceneTag(query: string): string | null {
  const q = query.trim().toLowerCase();
  for (const tag of Object.keys(SCENE_TAGS)) {
    if (q.includes(tag.toLowerCase())) return tag;
    const syns = SEARCH_SYNONYMS[tag];
    if (syns?.some((s) => q.includes(s.toLowerCase()))) return tag;
  }
  return null;
}

export function sceneTagConfig(tag: string) {
  return SCENE_TAGS[tag] ?? SCENE_TAGS[tag.toLowerCase()];
}
