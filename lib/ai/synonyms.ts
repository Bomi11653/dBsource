import { SCENE_TAGS, SEARCH_SYNONYMS } from "@/data/ai-synonyms";

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
