import type { Product } from "@/data/mock";
import { getSpecSheetForProduct, getStackedSpecPages } from "@/data/product-specs";
import { hasProductSpecRows, parseProductSpecs } from "@/lib/admin-product-specs";

export type ProductSpecDisplayRow = {
  label: { zh: string; en: string };
  value: { zh: string; en: string };
};

export function getCmsSpecDisplayRows(product: Product): ProductSpecDisplayRow[] | null {
  if (!product.specs) return null;
  const parsed = parseProductSpecs(product.specs.zh, product.specs.en);
  const rows = parsed.rows
    .map((row) => ({
      label: { zh: row.labelZh.trim(), en: row.labelEn.trim() },
      value: { zh: row.valueZh.trim(), en: row.valueEn.trim() },
    }))
    .filter(
      (row) => row.label.zh || row.value.zh || row.label.en || row.value.en
    );
  return rows.length ? rows : null;
}

export function productHasCmsSpecTable(product: Product): boolean {
  if (!product.specs) return false;
  return hasProductSpecRows(product.specs.zh, product.specs.en);
}

export function getProductSpecFallback(
  product: Product
): ReturnType<typeof getStackedSpecPages> | ReturnType<typeof getSpecSheetForProduct> | null {
  const stackedPages = getStackedSpecPages(product.model);
  if (stackedPages) return stackedPages;
  return getSpecSheetForProduct(product) ?? null;
}

export function productHasSpecSection(product: Product): boolean {
  return Boolean(getCmsSpecDisplayRows(product) || getProductSpecFallback(product) || product.specs);
}
