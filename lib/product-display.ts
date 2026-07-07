import type { Locale, Product } from "@/data/mock";

function normalizeLabel(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

/** model 与 title/name 是否视为同一文案（忽略大小写与首尾空格） */
export function productTextsEqual(a?: string, b?: string): boolean {
  const left = normalizeLabel(a);
  const right = normalizeLabel(b);
  if (!left || !right) return false;
  return left === right;
}

/** 副标题 name/title 是否应展示（与 model 不同时才展示） */
export function shouldShowProductTitle(model?: string, title?: string): boolean {
  const name = title?.trim();
  if (!name) return false;
  const code = model?.trim();
  if (!code) return true;
  return !productTextsEqual(code, name);
}

export type ProductDisplayTitle = {
  /** 主标题：优先型号 */
  primary: string;
  /** 副标题：仅当 name 与 model 不同时存在 */
  subtitle?: string;
  /** 用于 alt / 复制 / SEO 的单行标题 */
  label: string;
};

export function getProductDisplayTitle(product: Product, locale: Locale): ProductDisplayTitle {
  const model = product.model?.trim() ?? "";
  const name = product.name[locale]?.trim() ?? "";
  const showSubtitle = shouldShowProductTitle(model, name);
  const primary = model || name;

  return {
    primary,
    subtitle: showSubtitle ? name : undefined,
    label: showSubtitle && primary ? `${primary} · ${name}` : primary,
  };
}

export function formatProductHeading(product: Product, locale: Locale): string {
  return getProductDisplayTitle(product, locale).label;
}
