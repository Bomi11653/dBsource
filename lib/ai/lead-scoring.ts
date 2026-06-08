export type LeadIntent = "high" | "medium" | "low";

export function scoreLeadIntent(payload: {
  name: string;
  message: string;
  phone?: string;
  email?: string;
  company?: string;
  product?: string;
}): LeadIntent {
  let score = 0;
  if (payload.product?.trim()) score += 3;
  if (payload.company?.trim()) score += 2;
  if (payload.phone?.trim()) score += 2;
  if (payload.email?.trim()) score += 1;
  if (payload.message.length > 40) score += 1;
  if (/工程|项目|报价|方案|招标|体育馆|livehouse|会议/i.test(payload.message)) score += 2;

  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function intentLabel(intent: LeadIntent, locale: "zh" | "en" = "zh") {
  const map = {
    zh: { high: "高意向", medium: "中意向", low: "低意向" },
    en: { high: "High intent", medium: "Medium intent", low: "Low intent" },
  };
  return map[locale][intent];
}
