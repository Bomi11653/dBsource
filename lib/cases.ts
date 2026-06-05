import type { CaseItem } from "@/data/mock";

export function getRelatedCases(
  currentId: number,
  allCases: CaseItem[],
  limit = 2
): CaseItem[] {
  return allCases.filter((c) => c.id !== currentId).slice(0, limit);
}
