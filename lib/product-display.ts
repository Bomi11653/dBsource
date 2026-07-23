import type { Locale, Product } from "@/data/mock";
import {
  getProductSeriesDisplayLabel,
  type ProductSeriesConfig,
} from "@/lib/product-series-config";

export type ProductDisplayTitle = {
  /** 主标题：CMS 产品名称 */
  primary: string;
  /** 用于 alt / 复制 / SEO 的单行标题 */
  label: string;
};

/** 前台统一读取 CMS 映射后的 product.model（型号，非标题） */
export function getProductModel(product: Product): string {
  return product.model?.trim() ?? "";
}

/** 前台统一读取 CMS 产品名称（nameZh / nameEn → product.name） */
export function getProductDisplayName(product: Product, locale: Locale = "zh"): string {
  const localized = product.name?.[locale]?.trim();
  if (localized) return localized;
  const fallback = product.name?.zh?.trim() || product.name?.en?.trim();
  if (fallback) return fallback;
  return getProductModel(product);
}

/**
 * 前台系列文案：
 * 1) product-series-configs（按 productLine，含隐藏项）
 * 2) 产品自身 seriesZh / seriesEn
 * 3) 旧默认短文案 / slug
 */
export function getProductSeriesLabel(
  product: Product,
  locale: Locale = "zh",
  config?: ProductSeriesConfig
): string {
  const line = String(product.productLine ?? "").trim();
  if (line) {
    const fromConfig = getProductSeriesDisplayLabel(line, locale, config);
    if (fromConfig) return fromConfig;
  }
  const localized = product.series?.[locale]?.trim();
  if (localized) return localized;
  const other = product.series?.zh?.trim() || product.series?.en?.trim();
  if (other) return other;
  return line;
}

export function getProductDisplayTitle(product: Product, locale: Locale = "zh"): ProductDisplayTitle {
  const name = getProductDisplayName(product, locale);
  return {
    primary: name,
    label: name,
  };
}

export function formatProductHeading(product: Product, locale: Locale = "zh"): string {
  return getProductDisplayTitle(product, locale).label;
}
