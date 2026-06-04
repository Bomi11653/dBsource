import type { CaseItem, Product, ProductCategory, ProductSeriesGroup } from "@/data/mock";
import { cases, products } from "@/data/mock";

export type SeriesTab = "all" | ProductSeriesGroup;
export type CategoryFilter = "all" | ProductCategory;

export function filterProducts(
  list: Product[],
  seriesTab: SeriesTab,
  categoryFilter: CategoryFilter
): Product[] {
  let result = list;
  if (seriesTab !== "all") {
    result = result.filter((p) => p.seriesGroup === seriesTab);
  }
  if (categoryFilter !== "all") {
    result = result.filter((p) => p.category === categoryFilter);
    if (seriesTab === "all") {
      result = result.filter((p) => p.seriesGroup !== "engineering");
    }
  }
  return result;
}

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getRelatedCases(product: Product, allCases: CaseItem[] = cases): CaseItem[] {
  const prefix = product.model.split("-")[0];
  const matched = allCases.filter(
    (c) => c.products.includes(prefix) || c.products.includes(product.model)
  );
  return (matched.length ? matched : allCases).slice(0, 2);
}
