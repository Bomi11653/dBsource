import type { Product } from "@/data/mock";
import type { ProductSpecSheet } from "@/data/product-specs";
import { getSpecSheetForProduct, getStackedSpecPages } from "@/data/product-specs";
import {
  hasProductSpecRows,
  isTableSerializedSpecs,
  parseProductSpecs,
} from "@/lib/admin-product-specs";

export type ProductSpecDisplayRow = {
  label: { zh: string; en: string };
  value: { zh: string; en: string };
};

export type ProductSpecDisplaySource =
  | { kind: "cms"; rows: ProductSpecDisplayRow[] }
  | { kind: "static-stacked"; pages: ProductSpecSheet[] }
  | { kind: "static-sheet"; sheet: ProductSpecSheet };

export type ProductSpecLocale = "zh" | "en";

function countLocaleSpecRows(
  rows: ProductSpecDisplayRow[] | null | undefined,
  locale: ProductSpecLocale
): number {
  if (!rows?.length) return 0;
  return rows.filter(
    (row) => row.label[locale].trim() || row.value[locale].trim()
  ).length;
}

function cmsLocaleHasContent(
  rows: ProductSpecDisplayRow[] | null | undefined,
  locale: ProductSpecLocale
): boolean {
  return countLocaleSpecRows(rows, locale) > 0;
}

function countStaticSpecRows(
  fallback: ReturnType<typeof getProductSpecFallback>
): number {
  if (!fallback) return 0;
  if (Array.isArray(fallback)) {
    return fallback.reduce((sum, page) => sum + page.rows.length, 0);
  }
  return fallback.rows.length;
}

/** CMS 是否存在可展示的非空参数（空白字符串不算） */
export function productHasCmsSpecContent(product: Product): boolean {
  if (!product.specs) return false;
  const zh = product.specs.zh.trim();
  const en = product.specs.en.trim();
  if (!zh && !en) return false;
  return hasProductSpecRows(product.specs.zh, product.specs.en);
}

export function getCmsSpecDisplayRows(product: Product): ProductSpecDisplayRow[] | null {
  if (!productHasCmsSpecContent(product)) return null;
  const parsed = parseProductSpecs(product.specs!.zh, product.specs!.en);
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

/** @deprecated 使用 productHasCmsSpecContent */
export function productHasCmsSpecTable(product: Product): boolean {
  return productHasCmsSpecContent(product);
}

export function getProductSpecFallback(
  product: Product
): ReturnType<typeof getStackedSpecPages> | ReturnType<typeof getSpecSheetForProduct> | null {
  const stackedPages = getStackedSpecPages(product.model);
  if (stackedPages) return stackedPages;
  return getSpecSheetForProduct(product) ?? null;
}

/**
 * 参数展示优先级（按当前语言独立判定，互不影响）：
 * 1. 当前语言 CMS 有完整参数（行数不少于静态表）→ CMS
 * 2. 当前语言 CMS 为空或仅为摘要 → 静态参数库
 * 3. 两者皆无 → null（不展示参数模块）
 *
 * 中文页读 specsZh，英文页读 specsEn；某一语言为空时不影响另一语言。
 */
export function resolveProductSpecDisplay(
  product: Product,
  locale: ProductSpecLocale = "zh"
): ProductSpecDisplaySource | null {
  const cmsRows = getCmsSpecDisplayRows(product);
  const cmsCount = countLocaleSpecRows(cmsRows, locale);
  const fallback = getProductSpecFallback(product);
  const staticCount = countStaticSpecRows(fallback);

  const cmsHasContent = cmsLocaleHasContent(cmsRows, locale);
  const staticHasContent = staticCount > 0;
  const specs = product.specs;
  const cmsIsOrderedTable =
    Boolean(specs) &&
    isTableSerializedSpecs(
      locale === "zh" ? specs!.zh : "",
      locale === "en" ? specs!.en : ""
    );

  // 后台表格保存的参数（含排序）始终按 CMS 行顺序展示
  if (cmsHasContent && (cmsIsOrderedTable || !staticHasContent || cmsCount >= staticCount)) {
    return { kind: "cms", rows: cmsRows! };
  }

  if (fallback) {
    if (Array.isArray(fallback)) {
      return { kind: "static-stacked", pages: fallback };
    }
    return { kind: "static-sheet", sheet: fallback };
  }

  if (cmsHasContent) {
    return { kind: "cms", rows: cmsRows! };
  }

  return null;
}

export function productHasSpecSection(product: Product): boolean {
  return (
    resolveProductSpecDisplay(product, "zh") !== null ||
    resolveProductSpecDisplay(product, "en") !== null
  );
}
