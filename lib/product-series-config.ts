import type { Product } from "@/data/mock";
import type { ProductSeriesTabFilter } from "@/lib/product-series-tabs";

/** CMS product-series-config 行（Strapi ProductSeries） */
export type CmsProductSeriesRow = {
  slug: string;
  nameZh: string;
  nameEn: string;
  seriesGroup?: string;
  modelPrefix?: string;
  sortOrder?: number;
  visible?: boolean;
  featuredProductId?: number;
};

export type ProductSeriesCategoryKey = "engineering" | "touring";

export type ProductSeriesOption = {
  /** 配置内唯一 key：工程=productLine slug；流动=导航 key（如 solo-c） */
  key: string;
  /** 写入 CMS product 的 productLine */
  productLine: string;
  labelZh: string;
  labelEn: string;
  sortOrder: number;
  /** 写入 CMS product 的 seriesGroup（与 productLine 绑定） */
  seriesGroup?: "speaker" | "dsp" | "software" | "engineering";
  /** 流动演出：按型号匹配 CMS 产品 */
  modelMatchers?: string[];
};

/** productLine → seriesGroup / category（后台选择时自动写入，禁止手改） */
const PRODUCT_LINE_TAXONOMY: Record<
  string,
  { seriesGroup: "speaker" | "dsp" | "software" | "engineering"; category: "speaker" | "dsp" | "software" }
> = {
  la: { seriesGroup: "speaker", category: "speaker" },
  lw: { seriesGroup: "speaker", category: "speaker" },
  mi: { seriesGroup: "speaker", category: "speaker" },
  do: { seriesGroup: "speaker", category: "speaker" },
  sol: { seriesGroup: "speaker", category: "speaker" },
  k: { seriesGroup: "speaker", category: "speaker" },
  re: { seriesGroup: "speaker", category: "speaker" },
  p: { seriesGroup: "speaker", category: "speaker" },
  driver: { seriesGroup: "speaker", category: "speaker" },
  electronics: { seriesGroup: "speaker", category: "speaker" },
  accessory: { seriesGroup: "speaker", category: "speaker" },
  tour: { seriesGroup: "speaker", category: "speaker" },
  unit48: { seriesGroup: "dsp", category: "dsp" },
  suite: { seriesGroup: "software", category: "software" },
  turnkey: { seriesGroup: "engineering", category: "speaker" },
};

export function getProductLineTaxonomy(productLine: string): {
  seriesGroup: "speaker" | "dsp" | "software" | "engineering";
  category: "speaker" | "dsp" | "software";
} {
  return (
    PRODUCT_LINE_TAXONOMY[productLine.trim()] ?? {
      seriesGroup: "speaker",
      category: "speaker",
    }
  );
}

export type ProductSeriesCategory = {
  key: ProductSeriesCategoryKey;
  labelZh: string;
  labelEn: string;
  series: ProductSeriesOption[];
};

export type ProductSeriesConfig = {
  categories: ProductSeriesCategory[];
};

export const ENGINEERING_PRODUCT_LINE_SLUGS = [
  "la",
  "mi",
  "do",
  "sol",
  "lw",
  "re",
  "k",
  "electronics",
] as const;

export type EngineeringProductLineSlug = (typeof ENGINEERING_PRODUCT_LINE_SLUGS)[number];

/**
 * 前台 /products 工程系列筛选按钮：统一短文案 + 固定顺序。
 * 仅影响展示层；内部 key / productLine 不变。不包含电子产品。
 */
export const PRODUCT_SERIES_DISPLAY = [
  { key: "la", labelZh: "LA系列", labelEn: "LA Series" },
  { key: "lw", labelZh: "LW系列", labelEn: "LW Series" },
  { key: "mi", labelZh: "MI系列", labelEn: "MI Series" },
  { key: "do", labelZh: "DO系列", labelEn: "DO Series" },
  { key: "sol", labelZh: "SOL系列", labelEn: "SOL Series" },
  { key: "k", labelZh: "K系列", labelEn: "K Series" },
  { key: "re", labelZh: "RE系列", labelEn: "RE Series" },
] as const;

export type ProductSeriesDisplayKey = (typeof PRODUCT_SERIES_DISPLAY)[number]["key"];

export function getProductSeriesDisplayLabel(
  key: string,
  locale: "zh" | "en" = "zh"
): string | null {
  const entry = PRODUCT_SERIES_DISPLAY.find((item) => item.key === key);
  if (!entry) return null;
  return locale === "zh" ? entry.labelZh : entry.labelEn;
}

/** 前台产品页工程系列筛选 Tab（不含「全部」、不含电子产品） */
export function getProductPageSeriesFilterTabs(locale: "zh" | "en" = "zh"): Array<{
  id: ProductSeriesDisplayKey;
  label: string;
}> {
  return PRODUCT_SERIES_DISPLAY.map((entry) => ({
    id: entry.key,
    label: locale === "zh" ? entry.labelZh : entry.labelEn,
  }));
}

export function isProductSeriesDisplayKey(value: string): value is ProductSeriesDisplayKey {
  return PRODUCT_SERIES_DISPLAY.some((entry) => entry.key === value);
}

/** 前后台统一工程系列条目（固定顺序 / 短文案 / 不含电子产品） */
export function getUnifiedEngineeringSeriesEntries(): Array<{
  key: ProductSeriesDisplayKey;
  productLine: ProductSeriesDisplayKey;
  labelZh: string;
  labelEn: string;
  sortOrder: number;
}> {
  return PRODUCT_SERIES_DISPLAY.map((entry, index) => ({
    key: entry.key,
    productLine: entry.key,
    labelZh: entry.labelZh,
    labelEn: entry.labelEn,
    sortOrder: index + 1,
  }));
}

/** 后台「产品系列」下拉：仅短文案七项，不含电子产品 / CMS 长名称 / 流动演出 */
export function getAdminProductSeriesSelectOptions(): Array<{ value: ProductSeriesDisplayKey; label: string }> {
  return getUnifiedEngineeringSeriesEntries().map((entry) => ({
    value: entry.key,
    label: entry.labelZh,
  }));
}

/** 由统一短文案映射写入 CMS 系列字段 */
export function getAdminProductSeriesPatch(seriesKey: string): AdminSeriesFieldPatch {
  const entry =
    PRODUCT_SERIES_DISPLAY.find((item) => item.key === seriesKey) ?? PRODUCT_SERIES_DISPLAY[0];
  const taxonomy = getProductLineTaxonomy(entry.key);
  return {
    productLine: entry.key,
    seriesZh: entry.labelZh,
    seriesEn: entry.labelEn,
    seriesGroup: taxonomy.seriesGroup,
    category: taxonomy.category,
  };
}

export function getAdminProductSeriesSelectValue(input: {
  productLine?: string;
}): ProductSeriesDisplayKey | "" {
  const productLine = String(input.productLine ?? "").trim();
  if (isProductSeriesDisplayKey(productLine)) return productLine;
  return "";
}

const DEFAULT_ENGINEERING_SERIES: ProductSeriesOption[] = [
  ...PRODUCT_SERIES_DISPLAY.map((entry, index) => ({
    key: entry.key,
    productLine: entry.key,
    labelZh: entry.labelZh,
    labelEn: entry.labelEn,
    sortOrder: index + 1,
    seriesGroup: "speaker" as const,
  })),
  {
    key: "electronics",
    productLine: "electronics",
    labelZh: "电子产品",
    labelEn: "Electronics",
    sortOrder: PRODUCT_SERIES_DISPLAY.length + 1,
    seriesGroup: "speaker",
  },
];

const DEFAULT_TOURING_SERIES: ProductSeriesOption[] = [
  {
    key: "solo-c",
    productLine: "tour",
    labelZh: "Solo C",
    labelEn: "Solo C",
    sortOrder: 1,
    seriesGroup: "speaker",
    modelMatchers: ["solo c", "soloc"],
  },
  {
    key: "206m",
    productLine: "tour",
    labelZh: "206M",
    labelEn: "206M",
    sortOrder: 2,
    seriesGroup: "speaker",
    modelMatchers: ["206m"],
  },
  {
    key: "15n",
    productLine: "tour",
    labelZh: "15N",
    labelEn: "15N",
    sortOrder: 3,
    seriesGroup: "speaker",
    modelMatchers: ["15n"],
  },
  {
    key: "v4",
    productLine: "tour",
    labelZh: "V4",
    labelEn: "V4",
    sortOrder: 4,
    seriesGroup: "speaker",
    modelMatchers: ["v4"],
  },
  {
    key: "vit",
    productLine: "tour",
    labelZh: "VIT(V12-V18)",
    labelEn: "VIT (V12–V18)",
    sortOrder: 5,
    seriesGroup: "speaker",
    modelMatchers: ["vit"],
  },
  {
    key: "v212-v221s",
    productLine: "tour",
    labelZh: "V212-V221S",
    labelEn: "V212–V221S",
    sortOrder: 6,
    seriesGroup: "speaker",
    modelMatchers: ["v212"],
  },
  {
    key: "v415a",
    productLine: "tour",
    labelZh: "V415A",
    labelEn: "V415A",
    sortOrder: 7,
    seriesGroup: "speaker",
    modelMatchers: ["v415a"],
  },
  {
    key: "v225a",
    productLine: "tour",
    labelZh: "V225A",
    labelEn: "V225A",
    sortOrder: 8,
    seriesGroup: "speaker",
    modelMatchers: ["v225a"],
  },
];

export const DEFAULT_PRODUCT_SERIES_CONFIG: ProductSeriesConfig = {
  categories: [
    {
      key: "engineering",
      labelZh: "工程系列",
      labelEn: "Engineering",
      series: DEFAULT_ENGINEERING_SERIES,
    },
    {
      key: "touring",
      labelZh: "流动演出",
      labelEn: "Touring",
      series: DEFAULT_TOURING_SERIES,
    },
  ],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function modelMatchesModel(model: string, matcher: string): boolean {
  const target = normalize(matcher);
  const normalizedModel = normalize(model);
  if (target === "v4") return normalizedModel === "v4";
  return normalizedModel === target || normalizedModel.includes(target);
}

export function modelMatchesSeriesOption(model: string, option: ProductSeriesOption): boolean {
  if (!option.modelMatchers?.length) return false;
  return option.modelMatchers.some((matcher) => modelMatchesModel(model, matcher));
}

function getCategory(
  config: ProductSeriesConfig,
  key: ProductSeriesCategoryKey
): ProductSeriesCategory | undefined {
  return config.categories.find((category) => category.key === key);
}

/** CMS 有数据时合并工程系列标签/排序；流动演出子系列仍用默认（CMS 无独立条目） */
export function buildProductSeriesConfig(
  cmsRows?: CmsProductSeriesRow[] | null
): ProductSeriesConfig {
  const base = DEFAULT_PRODUCT_SERIES_CONFIG;
  if (!cmsRows?.length) return base;

  const cmsBySlug = new Map(
    cmsRows
      .filter((row) => row.slug && row.visible !== false)
      .map((row) => [normalize(row.slug), row])
  );

  const engineering = getCategory(base, "engineering");
  if (!engineering) return base;

  const mergedEngineering: ProductSeriesOption[] = engineering.series
    .map((series) => {
      const cms = cmsBySlug.get(normalize(series.key));
      const cmsGroup = cms?.seriesGroup;
      const seriesGroup =
        cmsGroup === "speaker" ||
        cmsGroup === "dsp" ||
        cmsGroup === "software" ||
        cmsGroup === "engineering"
          ? cmsGroup
          : series.seriesGroup;

      // 统一七项：展示名 / 顺序固定，不被 CMS 长名称覆盖；electronics 等仍可读 CMS
      if (isProductSeriesDisplayKey(series.key)) {
        const display = PRODUCT_SERIES_DISPLAY.find((item) => item.key === series.key)!;
        return {
          ...series,
          labelZh: display.labelZh,
          labelEn: display.labelEn,
          sortOrder: PRODUCT_SERIES_DISPLAY.findIndex((item) => item.key === series.key) + 1,
          seriesGroup: seriesGroup ?? series.seriesGroup,
        };
      }

      if (!cms) return series;
      return {
        ...series,
        labelZh: cms.nameZh?.trim() || series.labelZh,
        labelEn: cms.nameEn?.trim() || series.labelEn,
        sortOrder: typeof cms.sortOrder === "number" ? cms.sortOrder : series.sortOrder,
        seriesGroup,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    categories: [
      { ...engineering, series: mergedEngineering },
      getCategory(base, "touring")!,
    ],
  };
}

export function getCategories(config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG) {
  return config.categories;
}

export function getCategoryLabel(
  config: ProductSeriesConfig,
  categoryKey: ProductSeriesCategoryKey,
  locale: "zh" | "en" = "zh"
): string {
  const category = getCategory(config, categoryKey);
  if (!category) return categoryKey;
  return locale === "zh" ? category.labelZh : category.labelEn;
}

export function getSeriesOptions(
  config: ProductSeriesConfig,
  categoryKey: ProductSeriesCategoryKey
): ProductSeriesOption[] {
  return getCategory(config, categoryKey)?.series ?? [];
}

export function getEngineeringSeriesOptions(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): ProductSeriesOption[] {
  return getSeriesOptions(config, "engineering");
}

export function getTouringSeriesOptions(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): ProductSeriesOption[] {
  return getSeriesOptions(config, "touring");
}

export function isEngineeringProductLine(
  productLine: string,
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): productLine is EngineeringProductLineSlug {
  return getEngineeringSeriesOptions(config).some((series) => series.productLine === productLine);
}

export function getEngineeringProductLines(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): string[] {
  return getEngineeringSeriesOptions(config).map((series) => series.productLine);
}

export function findTouringSeriesByModel(
  config: ProductSeriesConfig,
  model: string
): ProductSeriesOption | undefined {
  return getTouringSeriesOptions(config).find((series) => modelMatchesSeriesOption(model, series));
}

export function findTouringSeriesByKey(
  config: ProductSeriesConfig,
  key: string
): ProductSeriesOption | undefined {
  return getTouringSeriesOptions(config).find((series) => series.key === key);
}

export function resolveProductSeriesSelection(
  config: ProductSeriesConfig,
  input: { productLine?: string; model?: string; seriesZh?: string }
): { category: ProductSeriesCategoryKey | "other"; seriesKey: string | null } {
  const productLine = normalize(input.productLine ?? "");
  const model = String(input.model ?? "").trim();
  const seriesZh = String(input.seriesZh ?? "").trim();

  if (productLine === "tour") {
    const byModel = model ? findTouringSeriesByModel(config, model) : undefined;
    if (byModel) return { category: "touring", seriesKey: byModel.key };
    if (seriesZh) {
      const byLabel = getTouringSeriesOptions(config).find(
        (series) => series.labelZh === seriesZh || series.labelEn === seriesZh
      );
      if (byLabel) return { category: "touring", seriesKey: byLabel.key };
    }
    const first = getTouringSeriesOptions(config)[0];
    return { category: "touring", seriesKey: first?.key ?? null };
  }

  if (isEngineeringProductLine(productLine, config)) {
    const match = getEngineeringSeriesOptions(config).find((series) => series.productLine === productLine);
    return { category: "engineering", seriesKey: match?.key ?? productLine };
  }

  return { category: "other", seriesKey: null };
}

export type AdminSeriesFieldPatch = {
  productLine: string;
  seriesZh: string;
  seriesEn: string;
  seriesGroup: "speaker" | "dsp" | "software" | "engineering";
  category: "speaker" | "dsp" | "software";
};

export function getSeriesBadge(
  config: ProductSeriesConfig,
  input: { productLine?: string; model?: string }
): { seriesZh: string; seriesEn: string } {
  const productLine = String(input.productLine ?? "").trim();
  const model = String(input.model ?? "").trim();
  if (!productLine) return { seriesZh: "", seriesEn: "" };

  // 工程七项：始终用统一短文案，避免 CMS 长名称回写
  if (isProductSeriesDisplayKey(productLine)) {
    const display = getAdminProductSeriesPatch(productLine);
    return { seriesZh: display.seriesZh, seriesEn: display.seriesEn };
  }

  if (productLine === "tour") {
    const touring = model ? findTouringSeriesByModel(config, model) : undefined;
    if (touring) return { seriesZh: touring.labelZh, seriesEn: touring.labelEn };
    const category = getCategory(config, "touring");
    if (category) return { seriesZh: category.labelZh, seriesEn: category.labelEn };
    return { seriesZh: "", seriesEn: "" };
  }

  const engineering = getEngineeringSeriesOptions(config).find((series) => series.productLine === productLine);
  if (engineering) {
    return { seriesZh: engineering.labelZh, seriesEn: engineering.labelEn };
  }

  return { seriesZh: "", seriesEn: "" };
}

export function getAdminSeriesPatch(
  config: ProductSeriesConfig,
  categoryKey: ProductSeriesCategoryKey,
  seriesKey: string,
  _model?: string
): AdminSeriesFieldPatch {
  if (categoryKey === "engineering" && isProductSeriesDisplayKey(seriesKey)) {
    return getAdminProductSeriesPatch(seriesKey);
  }

  const series = getSeriesOptions(config, categoryKey).find((entry) => entry.key === seriesKey);
  if (!series) {
    return getAdminProductSeriesPatch("la");
  }

  const taxonomy = getProductLineTaxonomy(series.productLine);
  const seriesGroup = series.seriesGroup ?? taxonomy.seriesGroup;

  if (categoryKey === "touring") {
    return {
      productLine: series.productLine,
      seriesZh: series.labelZh,
      seriesEn: series.labelEn,
      seriesGroup,
      category: taxonomy.category,
    };
  }

  if (isProductSeriesDisplayKey(series.productLine)) {
    return getAdminProductSeriesPatch(series.productLine);
  }

  return {
    productLine: series.productLine,
    seriesZh: series.labelZh,
    seriesEn: series.labelEn,
    seriesGroup,
    category: taxonomy.category,
  };
}

/** 保存时按当前选择重算系列字段，避免手改导致不一致 */
export function resolveAdminSeriesSavePatch(
  config: ProductSeriesConfig,
  input: { productLine?: string; model?: string; seriesZh?: string }
): AdminSeriesFieldPatch | null {
  const productLine = String(input.productLine ?? "").trim();
  if (isProductSeriesDisplayKey(productLine)) {
    return getAdminProductSeriesPatch(productLine);
  }
  const resolved = resolveProductSeriesSelection(config, input);
  if (resolved.category === "other" || !resolved.seriesKey) return null;
  return getAdminSeriesPatch(config, resolved.category, resolved.seriesKey, input.model);
}

/** 后台单一系列下拉：optgroup 值 = category:seriesKey */
export function encodeAdminSeriesSelectValue(
  categoryKey: ProductSeriesCategoryKey,
  seriesKey: string
): string {
  return `${categoryKey}:${seriesKey}`;
}

export function parseAdminSeriesSelectValue(
  value: string
): { categoryKey: ProductSeriesCategoryKey; seriesKey: string } | null {
  const [categoryKey, ...rest] = value.split(":");
  const seriesKey = rest.join(":").trim();
  if ((categoryKey !== "engineering" && categoryKey !== "touring") || !seriesKey) {
    return null;
  }
  return { categoryKey, seriesKey };
}

export function getAdminSeriesGroupedSelectOptions(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): Array<{ label: string; options: Array<{ value: string; label: string }> }> {
  return config.categories.map((category) => ({
    label: category.labelZh,
    options: category.series.map((series) => ({
      value: encodeAdminSeriesSelectValue(category.key, series.key),
      label: series.labelZh,
    })),
  }));
}

export type EngineeringSeriesNavEntry = {
  key: ProductSeriesTabFilter;
  labelZh: string;
  labelEn: string;
  sortOrder: number;
};

export function getEngineeringSeriesOrder(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): EngineeringSeriesNavEntry[] {
  const unified = getUnifiedEngineeringSeriesEntries().map((entry) => ({
    key: entry.key as ProductSeriesTabFilter,
    labelZh: entry.labelZh,
    labelEn: entry.labelEn,
    sortOrder: entry.sortOrder,
  }));

  // electronics 等非统一项保留在配置末尾（历史数据 / 后台筛选可用，不进前台七项 UI）
  const extras = getEngineeringSeriesOptions(config)
    .filter((series) => !isProductSeriesDisplayKey(series.key))
    .map((series, index) => ({
      key: series.key as ProductSeriesTabFilter,
      labelZh: series.labelZh,
      labelEn: series.labelEn,
      sortOrder: unified.length + index + 1,
    }));

  return [...unified, ...extras];
}

export type TouringSeriesNavEntry = {
  key: string;
  labelZh: string;
  labelEn: string;
  sortOrder: number;
  modelMatchers: string[];
};

export function getTouringSeriesOrder(
  config: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): TouringSeriesNavEntry[] {
  return getTouringSeriesOptions(config).map((series) => ({
    key: series.key,
    labelZh: series.labelZh,
    labelEn: series.labelEn,
    sortOrder: series.sortOrder,
    modelMatchers: series.modelMatchers ?? [],
  }));
}

export function findTouringProduct(
  config: ProductSeriesConfig,
  products: Product[],
  seriesKey: string
): Product | undefined {
  const entry = findTouringSeriesByKey(config, seriesKey);
  if (!entry?.modelMatchers?.length) return undefined;
  const pool = products.filter((product) => product.productLine === "tour");
  for (const matcher of entry.modelMatchers) {
    const found = pool.find((product) => modelMatchesModel(product.model, matcher));
    if (found) return found;
  }
  return undefined;
}

export function isTouringSeriesKey(
  config: ProductSeriesConfig,
  value: string
): boolean {
  return getTouringSeriesOptions(config).some((series) => series.key === value);
}
