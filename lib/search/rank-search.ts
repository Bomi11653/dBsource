import type { CaseItem, DownloadItem, Locale, Product } from "@/data/mock";
import {
  expandInitialAliases,
  SEARCH_INITIAL_ALIASES,
  SEARCH_SCENE_LABELS,
} from "@/data/search-aliases";
import { expandSearchQuery, extractModelCodes } from "@/lib/ai/synonyms";
import { caseOverviewMatchesModelCodes } from "@/lib/case-project-overview";
import { getProductSeriesHref } from "@/lib/product-series-tabs";
import { PRODUCT_SUB_SERIES } from "@/lib/products";

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

  const name = p.name[locale].toLowerCase();
  const nameEn = p.name.en.toLowerCase();
  if (terms.some((t) => name.includes(t) || nameEn.includes(t)) || name.includes(qLower)) {
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

  for (const sub of PRODUCT_SUB_SERIES) {
    const prefix = sub.modelPrefix.toUpperCase();
    const slug = sub.slug.toLowerCase();
    const labelZh = sub.label.zh.toLowerCase();
    const labelEn = sub.label.en.toLowerCase();
    const aliasHit =
      terms.some(
        (t) =>
          t === slug ||
          t === prefix.toLowerCase() ||
          labelZh.includes(t) ||
          labelEn.includes(t)
      ) ||
      qLower === slug ||
      qUpper === prefix;

    if (aliasHit && model.startsWith(prefix)) {
      score = Math.max(score, SEARCH_SCORE.alias);
      if (qUpper === prefix || qLower === slug) {
        score = Math.max(score, SEARCH_SCORE.modelPrefix);
      }
    }
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

function buildProductHit(p: Product, locale: Locale, rawQuery: string): SmartSearchHit {
  const name = p.name[locale];
  const qUpper = rawQuery.trim().toUpperCase();
  const modelHit =
    p.model.toUpperCase() === qUpper ||
    p.model.toUpperCase().startsWith(qUpper) ||
    extractModelCodes(rawQuery).some((c) => p.model.toUpperCase() === c);

  return {
    type: "product",
    id: p.id,
    title: modelHit
      ? p.model
      : name.trim().toLowerCase() === p.model.trim().toLowerCase()
        ? p.model
        : `${p.model} · ${name}`,
    subtitle: p.series?.[locale],
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

  for (const sub of PRODUCT_SUB_SERIES) {
    const slug = sub.slug.toLowerCase();
    const prefix = sub.modelPrefix.toLowerCase();
    const matched =
      terms.some((t) => t === slug || t === prefix) ||
      rawQuery.trim().toLowerCase() === slug ||
      rawQuery.trim().toUpperCase() === sub.modelPrefix.toUpperCase();

    if (!matched || seen.has(sub.slug)) continue;
    seen.add(sub.slug);
    hits.push({
      type: "scene",
      id: `series-${sub.slug}`,
      title: sub.label[locale],
      subtitle: locale === "zh" ? "产品系列" : "Product series",
      href: getProductSeriesHref(sub.slug),
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
