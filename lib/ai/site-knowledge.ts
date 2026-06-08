import { PRODUCT_SUB_SERIES } from "@/lib/products";
import { SALES_CONTACTS } from "@/data/sales-contacts";

/** 官网固定事实（AI 不得编造与之冲突的信息） */
export function buildSiteBaseline(locale: "zh" | "en"): string {
  const series = PRODUCT_SUB_SERIES.filter((s) =>
    ["la", "lw", "mi", "do", "sol", "k", "re", "tour", "unit48", "suite", "turnkey"].includes(
      s.slug
    )
  )
    .map((s) => `- ${s.label[locale]}（型号前缀 ${s.modelPrefix}）`)
    .join("\n");

  const sales = SALES_CONTACTS.map((s) => `- ${s.name}: ${s.phones.join(" / ")}`).join("\n");

  if (locale === "zh") {
    return `【品牌与公司】
- 品牌：dBsource（东莞新声电子科技有限公司）
- 定位：专业音响系统研发与工程交付，B2B 售前与工程方案
- 官网栏目：首页、产品中心、工程案例、下载中心、关于我们、联系我们、智能选型器

【产品系列（仅推荐以下系列及站内具体型号）】
${series}

【选型场景】
- Live House / 酒吧演艺：智能选型器 scene=livehouse
- 体育馆 / 大型场馆：scene=stadium
- 会议 / 礼堂：scene=conference

【销售联系】
${sales}
- 询盘表单：/contact`;
  }

  return `【Brand】
- dBsource — Dongguan Xinsheng Electronics, professional audio B2B
- Site sections: products, cases, downloads, about, contact, configurator

【Product lines (recommend only models listed in reference below)】
${series}

【Configurator scenes】livehouse | stadium | conference

【Sales】
${sales}
- Lead form: /contact`;
}
