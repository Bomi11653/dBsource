import type { CaseItem, DownloadItem, Locale, Product } from "@/data/mock";
import {
  expandInitialAliases,
  SEARCH_INITIAL_ALIASES,
  SEARCH_SCENE_LABELS,
} from "@/data/search-aliases";
import { expandSearchQuery, extractModelCodes } from "@/lib/ai/synonyms";
import { caseOverviewMatchesModelCodes } from "@/lib/case-project-overview";
import {
  DEFAULT_PRODUCT_SERIES_CONFIG,
  getTouringSeriesOptions,
  getUnifiedEngineeringSeriesEntries,
} from "@/lib/product-series-config";
import { getProductSeriesHref } from "@/lib/product-series-tabs";
import { getProductDisplayName, getProductSeriesLabel } from "@/lib/product-display";

export type SmartSearchHit = {
  type: "product" | "case" | "download" | "scene";
  id: number | string;
  title: string;
  subtitle?: string;
  href: string;
};

export const SEARCH_SCORE = {
  modelExact: 1000,
  modelPrefix: 900,
  modelContains: 800,
  name: 700,
  series: 600,
  alias: 550,
  scene: 500,
  description: 200,
} as const;

const TYPE_PRIORITY: Record<SmartSearchHit["type"], number> = {
  product: 4,
  scene: 3,
  case: 2,
  download: 1,
};

const DEFAULT_LIMIT = 10;

type ScoredHit = SmartSearchHit & { score: number };

function resolveTerms(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = new Set<string>([q]);
  expandSearchQuery(query).forEach((t) => terms.add(t.toLowerCase()));
  expandInitialAliases(query).forEach((t) => terms.add(t.toLowerCase()));
  return Array.from(terms);
}

function isShortKeywordQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length <= 3) return true;
  return Object.prototype.hasOwnProperty.call(SEARCH_INITIAL_ALIASES, q);
}

function termMatches(text: string, terms: string[], rawLower: string): boolean {
  const hay = text.toLowerCase();
  return hay.includes(rawLower) || terms.some((t) => t.length >= 1 && hay.includes(t));
}

function modelPrefixInText(text: string, prefix: string): boolean {
  const upper = text.toUpperCase();
  const p = prefix.toUpperCase();
  if (!p) return false;
  const re = new RegExp(`(^|[^A-Z0-9])${p}\\d`, "i");
  return upper.startsWith(p) || re.test(upper) || upper.includes(`${p} `) || upper.includes(`${p},`);
}

function scoreProduct(
  p: Product,
  rawQuery: string,
  terms: string[],
  locale: Locale,
  shortMode: boolean
): number {
  const qLower = rawQuery.trim().toLowerCase();
  const qUpper = rawQuery.trim().toUpperCase();
  const model = p.model.toUpperCase();
  let score = 0;

  const modelCodes = extractModelCodes(rawQuery);
  if (model === qUpper || modelCodes.some((c) => model === c)) {
    score = Math.max(score, SEARCH_SCORE.modelExact);
  }
  if (qUpper.length >= 1 && model.startsWith(qUpper)) {
    score = Math.max(score, SEARCH_SCORE.modelPrefix);
  }
  if (qUpper.length >= 2 && model.includes(qUpper)) {
    score = Math.max(score, SEARCH_SCORE.modelContains);
  }

  const nameZh = (p.name?.zh || "").toLowerCase();
  const nameEn = (p.name?.en || "").toLowerCase();
  if (
    terms.some((t) => nameZh.includes(t) || nameEn.includes(t)) ||
    nameZh.includes(qLower) ||
    nameEn.includes(qLower)
  ) {
    score = Math.max(score, SEARCH_SCORE.name);
  }

  const seriesZh = (p.series?.zh || "").toLowerCase();
  const seriesEn = (p.series?.en || "").toLowerCase();
  if (
    terms.some((t) => seriesZh.includes(t) || seriesEn.includes(t)) ||
    seriesZh.includes(qLower) ||
    seriesEn.includes(qLower)
  ) {
    score = Math.max(score, SEARCH_SCORE.series);
  }

  if (terms.some((t) => p.productLine === t) || p.productLine === qLower) {
    score = Math.max(score, SEARCH_SCORE.alias);
  }

  if (!shortMode) {
    const desc = [p.desc.zh, p.desc.en, p.detail?.zh, p.detail?.en, p.specs?.zh, p.specs?.en]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (terms.some((t) => t.length >= 2 && desc.includes(t))) {
      score = Math.max(score, SEARCH_SCORE.description);
    }
  }

  return score;
}

function scoreCase(
  c: CaseItem,
  rawQuery: string,
  terms: string[],
  locale: Locale,
  shortMode: boolean
): number {
  const qLower = rawQuery.trim().toLowerCase();
  const qUpper = rawQuery.trim().toUpperCase();
  let score = 0;

  const titleHay = [c.title.zh, c.title.en].join(" ").toLowerCase();
  if (termMatches(titleHay, terms, qLower)) {
    score = Math.max(score, SEARCH_SCORE.name);
  }

  const overviewHay = [c.projectOverview.zh, c.projectOverview.en].join(" ");
  if (
    modelPrefixInText(overviewHay, qUpper) ||
    terms.some((t) => modelPrefixInText(overviewHay, t.toUpperCase())) ||
    caseOverviewMatchesModelCodes(c, extractModelCodes(rawQuery))
  ) {
    score = Math.max(score, SEARCH_SCORE.series);
  }

  if (!shortMode) {
    const descHay = [c.projectOverview.zh, c.projectOverview.en]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (terms.some((t) => t.length >= 3 && descHay.includes(t))) {
      score = Math.max(score, SEARCH_SCORE.description);
    }
  }

  return score;
}

function scoreDownload(
  d: DownloadItem,
  rawQuery: string,
  terms: string[],
  shortMode: boolean
): number {
  const qLower = rawQuery.trim().toLowerCase();
  const nameHay = [d.name.zh, d.name.en, d.type, d.subCategory || ""].join(" ").toLowerCase();
  if (!termMatches(nameHay, terms, qLower)) return 0;
  return shortMode ? SEARCH_SCORE.series : SEARCH_SCORE.name;
}

function buildProductHit(p: Product, locale: Locale, _rawQuery: string): SmartSearchHit {
  return {
    type: "product",
    id: p.id,
    title: getProductDisplayName(p, locale),
    subtitle: getProductSeriesLabel(p, locale) || undefined,
    href: `/products/${p.id}`,
  };
}

function collectSceneHits(rawQuery: string, terms: string[], locale: Locale): ScoredHit[] {
  const hits: ScoredHit[] = [];
  const seen = new Set<string>();

  for (const [key, cfg] of Object.entries(SEARCH_SCENE_LABELS)) {
    const keyLower = key.toLowerCase();
    const matched =
      terms.some((t) => keyLower.includes(t) || t.includes(keyLower)) ||
      rawQuery.trim().toLowerCase() === keyLower;

    if (!matched || seen.has(cfg.href)) continue;
    seen.add(cfg.href);
    hits.push({
      type: "scene",
      id: key,
      title: cfg[locale],
      subtitle: locale === "zh" ? "应用场景" : "Application scene",
      href: cfg.href,
      score: SEARCH_SCORE.scene,
    });
  }

  const seriesOptions = [
    ...getUnifiedEngineeringSeriesEntries().map((entry) => ({
      key: entry.key,
      productLine: entry.productLine,
      labelZh: entry.labelZh,
      labelEn: entry.labelEn,
    })),
    ...getTouringSeriesOptions(DEFAULT_PRODUCT_SERIES_CONFIG),
  ];
  for (const series of seriesOptions) {
    const slug = series.key.toLowerCase();
    const line = series.productLine.toLowerCase();
    const labelZh = series.labelZh.toLowerCase();
    const labelEn = series.labelEn.toLowerCase();
    const matched =
      terms.some(
        (t) => t === slug || t === line || labelZh.includes(t) || labelEn.includes(t)
      ) ||
      rawQuery.trim().toLowerCase() === slug ||
      rawQuery.trim().toLowerCase() === line;

    if (!matched || seen.has(series.key)) continue;
    seen.add(series.key);
    hits.push({
      type: "scene",
      id: `series-${series.key}`,
      title: locale === "zh" ? series.labelZh : series.labelEn,
      subtitle: locale === "zh" ? "产品系列" : "Product series",
      href: getProductSeriesHref(
        series.productLine === "tour" ? series.key : series.productLine
      ),
      score: SEARCH_SCORE.series,
    });
  }

  return hits;
}

function sortHits(hits: ScoredHit[]): ScoredHit[] {
  return [...hits].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type];
  });
}

export function rankProductsForList(
  query: string,
  products: Product[],
  locale: Locale = "zh"
): Product[] {
  const q = query.trim();
  if (!q) return products;

  const terms = resolveTerms(q);
  const shortMode = isShortKeywordQuery(q);

  return [...products]
    .map((p) => ({ p, score: scoreProduct(p, q, terms, locale, shortMode) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export function rankSearch(
  query: string,
  data: { products: Product[]; cases: CaseItem[]; downloads: DownloadItem[] },
  locale: Locale,
  limit = DEFAULT_LIMIT
): SmartSearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const terms = resolveTerms(q);
  const shortMode = isShortKeywordQuery(q);
  const hits: ScoredHit[] = [];

  for (const p of data.products) {
    const score = scoreProduct(p, q, terms, locale, shortMode);
    if (score <= 0) continue;
    hits.push({ ...buildProductHit(p, locale, q), score });
  }

  hits.push(...collectSceneHits(q, terms, locale));

  for (const c of data.cases) {
    const score = scoreCase(c, q, terms, locale, shortMode);
    if (score <= 0) continue;
    hits.push({
      type: "case",
      id: c.id,
      title: c.title[locale],
      subtitle: c.projectOverview[locale]?.slice(0, 60) || undefined,
      href: `/cases/${c.id}`,
      score,
    });
  }

  for (const d of data.downloads) {
    const score = scoreDownload(d, q, terms, shortMode);
    if (score <= 0) continue;
    hits.push({
      type: "download",
      id: d.id,
      title: d.name[locale],
      subtitle: d.type,
      href: `/downloads?tab=${d.type}&file=${d.id}`,
      score,
    });
  }

  return sortHits(hits)
    .slice(0, limit)
    .map(({ score: _score, ...hit }) => hit);
}
