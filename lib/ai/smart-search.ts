export type { SmartSearchHit } from "@/lib/search/rank-search";
export { rankSearch, rankProductsForList, SEARCH_SCORE } from "@/lib/search/rank-search";

import { rankSearch } from "@/lib/search/rank-search";
import type { CaseItem, DownloadItem, Product } from "@/data/mock";

/** @deprecated 请直接使用 rankSearch；保留别名兼容旧引用 */
export function smartSearch(
  query: string,
  data: { products: Product[]; cases: CaseItem[]; downloads: DownloadItem[] },
  locale: "zh" | "en"
) {
  return rankSearch(query, data, locale);
}
