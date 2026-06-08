import type { CaseItem, DownloadItem, Locale, Product } from "@/data/mock";
import type { ConfiguratorScene } from "@/data/configurator-templates";
import { recommendSystem } from "@/lib/configurator";
import {
  extractModelCodes,
  matchProductsByModelCodes,
  matchSceneTag,
} from "@/lib/ai/synonyms";
import { isComplexProjectQuery } from "@/lib/sales-routing";

export type FallbackResult = {
  reply: string;
  needsHuman: boolean;
};

function parseArea(q: string): number | undefined {
  const m = q.match(/(\d{2,5})\s*(㎡|平米|平方|sqm|m²|m2)/i);
  return m ? Number(m[1]) : undefined;
}

function parseSeats(q: string): number | undefined {
  const m = q.match(/(\d{3,6})\s*(座|seat)/i);
  return m ? Number(m[1]) : undefined;
}

function detectScene(q: string): ConfiguratorScene | null {
  const tag = matchSceneTag(q);
  if (tag === "livehouse") return "livehouse";
  if (tag === "stadium" || tag === "体育馆") return "stadium";
  if (tag === "conference" || tag === "会议") return "conference";
  const lower = q.toLowerCase();
  if (/live\s*house|livehouse|酒吧|演艺空间/.test(lower)) return "livehouse";
  if (/体育馆|stadium|球场|场馆/.test(lower)) return "stadium";
  if (/会议|礼堂|报告厅|conference|auditorium/.test(lower)) return "conference";
  return null;
}

function formatBom(
  result: ReturnType<typeof recommendSystem>,
  locale: Locale
): string {
  const lines = result.lines
    .filter((l) => l.qty > 0)
    .map((l) => `· ${l.model} × ${l.qty}（${l.role[locale]}）`)
    .join("\n");
  const header = locale === "zh" ? "【规则引擎简要方案】" : "[Rule-based sizing]";
  return `${header}\n${result.summary[locale]}\n${lines}`;
}

export function generateFallbackReply(
  message: string,
  locale: Locale,
  ctx: {
    products: Product[];
    cases: CaseItem[];
    downloads: DownloadItem[];
  }
): FallbackResult {
  const needsHuman = isComplexProjectQuery(message);
  const scene = detectScene(message);

  if (scene) {
    const area = parseArea(message);
    const seats = parseSeats(message);
    const result = recommendSystem(
      {
        scene,
        areaSqm: area,
        seats,
        hasBand: /乐队|band/i.test(message),
        needsRecording: /录播|recording/i.test(message),
        budget: "standard",
      },
      ctx.products
    );
    const intro =
      locale === "zh"
        ? "AI 服务暂不可用，以下为本地规则引擎生成的参考方案（不消耗 API）："
        : "AI is offline — rule-based reference (no API used):";
    return {
      reply: `${intro}\n\n${formatBom(result, locale)}`,
      needsHuman: needsHuman || result.needsConsult,
    };
  }

  const modelCodes = extractModelCodes(message);
  let products = ctx.products;
  let cases = ctx.cases;

  if (modelCodes.length) {
    const matched = matchProductsByModelCodes(ctx.products, modelCodes);
    if (matched.length) {
      products = matched.slice(0, modelCodes.length === 1 ? 1 : 4);
      const matchedCases = ctx.cases.filter((c) =>
        modelCodes.some((code) => c.products.toUpperCase().includes(code))
      );
      if (matchedCases.length) cases = matchedCases.slice(0, 3);
    }
  }

  if (!products.length && !cases.length) {
    return {
      reply:
        locale === "zh"
          ? "AI 暂不可用。建议使用「智能选型器」或联系销售获取方案。"
          : "AI unavailable. Try the configurator or contact our sales team.",
      needsHuman: true,
    };
  }

  const intro =
    locale === "zh"
      ? "AI 服务暂不可用，根据站内资料为您整理如下，请点击下方链接查看详情："
      : "AI is offline. See related items below — tap a link for details:";

  if (products.length === 1) {
    const p = products[0];
    const desc = p.desc[locale].slice(0, 120);
    const detail =
      locale === "zh"
        ? `\n\n${p.model}：${desc}`
        : `\n\n${p.model}: ${desc}`;
    return { reply: intro + detail, needsHuman };
  }

  return { reply: intro, needsHuman };
}
