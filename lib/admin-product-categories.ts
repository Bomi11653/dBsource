import {
  PRODUCT_SERIES_TABS,
  compareProductsBySeriesTab,
  countProductsBySeriesTab,
  getProductSeriesTab,
  getProductSeriesTabLabel,
  matchProductSeriesTab,
  type ProductSeriesTabFilter,
  type ProductSeriesTabRow,
} from "@/lib/product-series-tabs";

export type AdminProductSeriesFilter = ProductSeriesTabFilter;
export type AdminProductRow = Record<string, unknown>;

export const ADMIN_PRODUCT_SERIES_TABS = PRODUCT_SERIES_TABS;

export function getAdminProductSeriesFilter(row: AdminProductRow): AdminProductSeriesFilter {
  return getProductSeriesTab(row);
}

export function matchAdminProductSeriesFilter(
  row: AdminProductRow,
  filter: AdminProductSeriesFilter
): boolean {
  return matchProductSeriesTab(row, filter);
}

export function compareAdminProductRows(a: AdminProductRow, b: AdminProductRow): number {
  return compareProductsBySeriesTab(a, b);
}
export function countAdminProductsBySeriesFilter(
  rows: AdminProductRow[]
): Record<AdminProductSeriesFilter, number> {
  return countProductsBySeriesTab(rows);
}

export function getAdminProductSeriesTabLabel(filter: AdminProductSeriesFilter): string {
  return getProductSeriesTabLabel(filter);
}

const CATEGORY_LABELS: Record<string, string> = {
  speaker: "音箱",
  dsp: "处理器",
  software: "软件",
};

function strField(row: AdminProductRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

export type AdminProductRowMeta = {
  subtitle: string;
  seriesFilter: AdminProductSeriesFilter;
  seriesLabel: string;
};

export function getAdminProductRowMeta(row: AdminProductRow): AdminProductRowMeta {
  const model = strField(row, "model");
  const productLine = strField(row, "productLine");
  const seriesZh = strField(row, "seriesZh");
  const category = strField(row, "category");
  const seriesFilter = getAdminProductSeriesFilter(row);
  const seriesLabel = getAdminProductSeriesTabLabel(seriesFilter);

  const parts = [
    model || null,
    productLine || null,
    seriesZh || null,
    category ? CATEGORY_LABELS[category] ?? category : null,
    seriesLabel,
  ].filter(Boolean);

  return {
    subtitle: parts.join(" · "),
    seriesFilter,
    seriesLabel,
  };
}
