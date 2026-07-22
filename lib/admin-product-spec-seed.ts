import type { Product, ProductLineSlug } from "@/data/mock";
import { getProductSpecFallback } from "@/lib/product-spec-display";
import {
  createCustomSpecRow,
  hasProductSpecRows,
  serializeProductSpecs,
  type SpecTableRow,
} from "@/lib/admin-product-specs";

export type AdminProductSpecSource = "cms" | "static" | "empty";

/** 后台：CMS 是否存在可编辑的非空参数 */
export function adminHasCmsSpecContent(specsZh: string, specsEn: string): boolean {
  const zh = specsZh.trim();
  const en = specsEn.trim();
  if (!zh && !en) return false;
  return hasProductSpecRows(specsZh, specsEn);
}

function staticFallbackToRows(
  fallback: NonNullable<ReturnType<typeof getProductSpecFallback>>
): SpecTableRow[] {
  const sheets = Array.isArray(fallback) ? fallback : [fallback];
  const rows: SpecTableRow[] = [];

  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      rows.push({
        ...createCustomSpecRow(rows.length),
        labelZh: row.label.zh,
        labelEn: row.label.en,
        valueZh: row.value.zh,
        valueEn: row.value.en,
        isFixed: false,
      });
    }
  }

  return rows;
}

/** 从旧静态参数库生成可写入 CMS 的 specsZh / specsEn */
export function getStaticSpecSeedForAdmin(
  model: string,
  productLine: string
): { specsZh: string; specsEn: string } | null {
  const product = {
    model: model.trim(),
    productLine: (productLine.trim() || "la") as ProductLineSlug,
  } as Product;

  const fallback = getProductSpecFallback(product);
  if (!fallback) return null;

  const rows = staticFallbackToRows(fallback);
  if (!rows.length) return null;
  return serializeProductSpecs(rows);
}

/**
 * 后台参数编辑展示优先级：
 * 1. CMS 有参数 → 使用 CMS
 * 2. CMS 为空 → 使用旧静态参数库
 * 3. 皆无 → 空
 */
export function resolveAdminProductSpecs(input: {
  specsZh: string;
  specsEn: string;
  model: string;
  productLine: string;
}): {
  specsZh: string;
  specsEn: string;
  source: AdminProductSpecSource;
} {
  const cmsZh = input.specsZh ?? "";
  const cmsEn = input.specsEn ?? "";

  if (adminHasCmsSpecContent(cmsZh, cmsEn)) {
    return { specsZh: cmsZh, specsEn: cmsEn, source: "cms" };
  }

  const staticSeed = getStaticSpecSeedForAdmin(input.model, input.productLine);
  if (staticSeed) {
    return { specsZh: staticSeed.specsZh, specsEn: staticSeed.specsEn, source: "static" };
  }

  return { specsZh: cmsZh, specsEn: cmsEn, source: "empty" };
}

/** 保存前：CMS 为空时用静态参数补齐 payload */
export function mergeProductSpecsForSave(
  draft: Record<string, unknown>
): { specsZh: string; specsEn: string } {
  const cmsZh = String(draft.specsZh ?? "");
  const cmsEn = String(draft.specsEn ?? "");

  if (adminHasCmsSpecContent(cmsZh, cmsEn)) {
    return { specsZh: cmsZh, specsEn: cmsEn };
  }

  const staticSeed = getStaticSpecSeedForAdmin(
    String(draft.model ?? ""),
    String(draft.productLine ?? "")
  );
  if (staticSeed) {
    return staticSeed;
  }

  return { specsZh: cmsZh, specsEn: cmsEn };
}
