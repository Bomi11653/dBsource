import type { CaseItem, DownloadItem, Product } from "@/data/mock";
import type { AiPageContext } from "@/lib/ai/page-context";
import { buildSiteBaseline } from "@/lib/ai/site-knowledge";
import {
  expandSearchQuery,
  extractModelCodes,
  matchProductsByModelCodes,
} from "@/lib/ai/synonyms";
import { getCases, getDownloads, getProducts } from "@/lib/cms";
import { PRODUCT_SUB_SERIES } from "@/lib/products";

function scoreText(haystack: string, terms: string[]): number {
  const h = haystack.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (h.includes(t)) score += t.length > 2 ? 2 : 1;
  }
  return score;
}

function fallbackProducts(products: Product[]): Product[] {
  const picked = new Map<number, Product>();
  for (const sub of PRODUCT_SUB_SERIES) {
    const match = products.find(
      (p) => p.id === sub.featuredProductId || p.model.startsWith(sub.modelPrefix)
    );
    if (match) picked.set(match.id, match);
  }
  if (picked.size < 4) {
    products.slice(0, 8).forEach((p) => picked.set(p.id, p));
  }
  return Array.from(picked.values()).slice(0, 8);
}

export async function retrieveContext(
  question: string,
  locale: "zh" | "en",
  pageContext?: AiPageContext | null
) {
  const [products, cases, downloads] = await Promise.all([
    getProducts(),
    getCases(),
    getDownloads(),
  ]);
  const terms = expandSearchQuery(question);
  if (!terms.length) terms.push(question.trim().toLowerCase());

  let topProducts = rankProducts(products, terms, locale).slice(0, 6);
  let topCases = rankCases(cases, terms, locale).slice(0, 3);
  const topDownloads = rankDownloads(downloads, terms, locale).slice(0, 2);

  const modelCodes = extractModelCodes(question);
  if (modelCodes.length) {
    const matched = matchProductsByModelCodes(products, modelCodes);
    if (matched.length) {
      topProducts = matched.slice(0, modelCodes.length === 1 ? 1 : 4);
      const relatedCases = cases.filter((c) =>
        modelCodes.some((code) => c.products.toUpperCase().includes(code))
      );
      if (relatedCases.length) {
        topCases = relatedCases.slice(0, 3);
      }
    }
  }

  if (pageContext?.type === "product") {
    const current = products.find((p) => p.id === pageContext.productId);
    if (current && !topProducts.some((p) => p.id === current.id)) {
      topProducts = [current, ...topProducts].slice(0, 6);
    }
  }
  if (pageContext?.type === "case") {
    const current = cases.find((c) => c.id === pageContext.caseId);
    if (current && !topCases.some((c) => c.id === current.id)) {
      topCases = [current, ...topCases].slice(0, 3);
    }
  }

  if (!topProducts.length) topProducts = fallbackProducts(products);
  if (!topCases.length) topCases = cases.slice(0, 2);

  const baseline = buildSiteBaseline(locale);
  const detail = formatPageDetail(pageContext, products, cases, locale);
  const contextText = [baseline, detail, formatContext(topProducts, topCases, topDownloads, locale)]
    .filter(Boolean)
    .join("\n\n");

  return {
    products: topProducts,
    cases: topCases,
    downloads: topDownloads,
    contextText,
  };
}

function formatPageDetail(
  pageContext: AiPageContext | null | undefined,
  products: Product[],
  cases: CaseItem[],
  locale: "zh" | "en"
): string {
  if (!pageContext) return "";
  if (pageContext.type === "product") {
    const p = products.find((x) => x.id === pageContext.productId);
    if (!p) return "";
    const lines = [
      locale === "zh" ? "【当前页面产品（优先依据）】" : "【Current product page】",
      `- 型号: ${p.model}`,
      `- 名称: ${p.name[locale]}`,
      `- 简介: ${p.desc[locale]}`,
    ];
    if (p.detail?.[locale]) lines.push(`- 详情: ${p.detail[locale].slice(0, 300)}`);
    if (p.series) lines.push(`- 系列: ${p.series[locale]}`);
    return lines.join("\n");
  }
  if (pageContext.type === "case") {
    const c = cases.find((x) => x.id === pageContext.caseId);
    if (!c) return "";
    return [
      locale === "zh" ? "【当前页面案例（优先依据）】" : "【Current case page】",
      `- ${c.title[locale]}`,
      `- ${c.desc[locale].slice(0, 200)}`,
      `- 设备: ${c.products}`,
    ].join("\n");
  }
  return "";
}

function rankProducts(products: Product[], terms: string[], locale: "zh" | "en") {
  return [...products]
    .map((p) => ({
      p,
      score: scoreText(
        [p.model, p.name.zh, p.name.en, p.desc.zh, p.desc.en, p.series?.zh, p.series?.en, p.productLine]
          .filter(Boolean)
          .join(" "),
        terms
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

function rankCases(cases: CaseItem[], terms: string[], locale: "zh" | "en") {
  return [...cases]
    .map((c) => ({
      c,
      score: scoreText(
        [c.title.zh, c.title.en, c.desc.zh, c.desc.en, c.products, c.scene.zh, c.scene.en].join(
          " "
        ),
        terms
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}

function rankDownloads(downloads: DownloadItem[], terms: string[], locale: "zh" | "en") {
  return [...downloads]
    .map((d) => ({
      d,
      score: scoreText([d.name.zh, d.name.en, d.type, d.subCategory].join(" "), terms),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.d);
}

function formatContext(
  products: Product[],
  cases: CaseItem[],
  downloads: DownloadItem[],
  locale: "zh" | "en"
) {
  const lines: string[] = [];
  if (products.length) {
    lines.push("【相关产品】");
    products.forEach((p) => {
      lines.push(
        `- ${p.model} | ${p.name[locale]} | ${p.desc[locale].slice(0, 80)} | /products/${p.id}`
      );
    });
  }
  if (cases.length) {
    lines.push("【相关案例】");
    cases.forEach((c) => {
      lines.push(`- ${c.title[locale]} | ${c.products} | /cases/${c.id}`);
    });
  }
  if (downloads.length) {
    lines.push("【相关下载】");
    downloads.forEach((d) => {
      lines.push(`- ${d.name[locale]} | /downloads?tab=${d.type}&file=${d.id}`);
    });
  }
  lines.push("【选型工具】/configurator — Live House / 体育馆 / 会议");
  lines.push("【联系报价】/contact");
  return lines.join("\n");
}

export function buildSystemPrompt(locale: "zh" | "en", context: string) {
  if (locale === "zh") {
    return `你是 dBsource（东莞新声电子）官网智能顾问，专业音响 B2B 售前助手。
规则：
1. 严格只根据下方「参考资料」回答；参考资料未出现的型号、参数、价格、案例细节一律不得编造
2. 不确定或资料不足时，明确说「官网暂无该信息」，并建议 /contact 联系销售或 /configurator 选型
3. 推荐产品时必须使用参考资料中的真实型号；给出简短适用场景理由
4. 禁止引用竞品或编造 dBsource 未列出的产品线
5. 回答简洁专业，200字以内，用中文
6. 用户追问时结合上文连贯回答

参考资料：
${context}`;
  }
  return `You are the dBsource (Dongguan Xinsheng Electronics) website AI advisor for professional audio B2B sales.
Rules:
1. Answer ONLY from the reference below; never invent models, specs, prices, or case details not listed
2. If unsure, say the site has no data and suggest /contact or /configurator
3. Recommend only real model numbers from the reference
4. Do not mention competitor brands or product lines absent from the reference
5. Keep answers under 120 words, in English
6. Follow up coherently on clarifying questions

Reference:
${context}`;
}
