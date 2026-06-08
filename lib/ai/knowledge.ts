import type { CaseItem, DownloadItem, Product } from "@/data/mock";
import { getCases, getDownloads, getProducts } from "@/lib/cms";
import { expandSearchQuery } from "@/lib/ai/synonyms";

function scoreText(haystack: string, terms: string[]): number {
  const h = haystack.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (h.includes(t)) score += t.length > 2 ? 2 : 1;
  }
  return score;
}

export async function retrieveContext(question: string, locale: "zh" | "en") {
  const [products, cases, downloads] = await Promise.all([
    getProducts(),
    getCases(),
    getDownloads(),
  ]);
  const terms = expandSearchQuery(question);
  if (!terms.length) terms.push(question.trim().toLowerCase());

  const topProducts = rankProducts(products, terms, locale).slice(0, 6);
  const topCases = rankCases(cases, terms, locale).slice(0, 3);
  const topDownloads = rankDownloads(downloads, terms, locale).slice(0, 2);

  return {
    products: topProducts,
    cases: topCases,
    downloads: topDownloads,
    contextText: formatContext(topProducts, topCases, topDownloads, locale),
  };
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
1. 只根据下方「参考资料」回答，不确定时建议用户联系销售或访问 /contact
2. 推荐产品时给出型号和简短理由；站内路径由界面按钮展示，正文不必重复 URL
3. 回答简洁专业，200字以内，用中文
4. 可引导用户使用智能选型器做 Live House、体育馆、会议场景选型
5. 用户追问时结合上文连贯回答

参考资料：
${context}`;
  }
  return `You are the dBsource (Dongguan Xinsheng Electronics) website AI advisor for professional audio B2B sales.
Rules:
1. Answer only from the reference below; if unsure, suggest /contact
2. Recommend models with brief reasons; site links appear as UI buttons—do not repeat URLs in prose
3. Keep answers under 120 words, in English
4. Guide users to the configurator for Live House, stadium, or conference sizing
5. Follow up coherently when the user asks a clarifying question

Reference:
${context}`;
}
