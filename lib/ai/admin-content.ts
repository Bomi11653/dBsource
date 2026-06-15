import { chatCompletion } from "@/lib/ai/deepseek";

type CaseTranslation = {
  titleEn: string;
  descEn: string;
};

type ProductSpecExtraction = {
  specsZh: string;
  specsEn: string;
  descZh?: string;
  descEn?: string;
};

export type BilingualPairInput = {
  zhKey: string;
  enKey: string;
  zh: string;
  en: string;
};

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function translateCaseZhToEn(input: {
  titleZh: string;
  descZh: string;
}): Promise<CaseTranslation | null> {
  const reply = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a precise marketing translator. Translate Chinese case-study title and summary into fluent business English. Return ONLY valid JSON: {\"titleEn\":\"...\",\"descEn\":\"...\"}.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    { maxTokens: 350, temperature: 0.2 }
  );

  const parsed = extractJsonObject(reply);
  if (!parsed) return null;
  const titleEn = String(parsed.titleEn ?? "").trim();
  const descEn = String(parsed.descEn ?? "").trim();
  if (!titleEn || !descEn) return null;
  return { titleEn, descEn };
}

export async function extractProductSpecsFromPdfText(input: {
  modelHint?: string;
  text: string;
}): Promise<ProductSpecExtraction | null> {
  const reply = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You extract product specification summary from PDF text. Return ONLY valid JSON with keys: specsZh, specsEn, descZh, descEn. Keep specs short, one compact line each language. If uncertain, best-effort from available text.",
      },
      {
        role: "user",
        content: JSON.stringify({
          modelHint: input.modelHint ?? "",
          text: input.text.slice(0, 26000),
        }),
      },
    ],
    { maxTokens: 700, temperature: 0.2 }
  );

  const parsed = extractJsonObject(reply);
  if (!parsed) return null;

  const specsZh = String(parsed.specsZh ?? "").trim();
  const specsEn = String(parsed.specsEn ?? "").trim();
  const descZh = String(parsed.descZh ?? "").trim();
  const descEn = String(parsed.descEn ?? "").trim();

  if (!specsZh || !specsEn) return null;

  return {
    specsZh,
    specsEn,
    descZh: descZh || undefined,
    descEn: descEn || undefined,
  };
}

export async function translateBilingualPairs(
  section: "cases" | "products",
  pairs: BilingualPairInput[]
): Promise<Record<string, string> | null> {
  const normalized = pairs.map((pair) => ({
    ...pair,
    zh: pair.zh.trim(),
    en: pair.en.trim(),
  }));
  const pending = normalized
    .map((pair) => {
      if (pair.zh) {
        return {
          zhKey: pair.zhKey,
          enKey: pair.enKey,
          zh: pair.zh,
          en: "",
        };
      }
      if (pair.en) {
        return {
          zhKey: pair.zhKey,
          enKey: pair.enKey,
          zh: "",
          en: pair.en,
        };
      }
      return null;
    })
    .filter((pair): pair is BilingualPairInput => Boolean(pair));
  if (!pending.length) return {};

  const reply = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a bilingual translator for pro-audio website CMS. For each item: if zh has content, always translate zh->en and overwrite en; otherwise if en has content, translate en->zh and overwrite zh. Keep model names and product codes unchanged. Return ONLY strict JSON object with field keys to fill, e.g. {\"titleEn\":\"...\",\"descZh\":\"...\"}.",
      },
      {
        role: "user",
        content: JSON.stringify({
          section,
          pairs: pending,
        }),
      },
    ],
    { maxTokens: 1200, temperature: 0.2 }
  );

  const parsed = extractJsonObject(reply);
  if (!parsed) return null;

  const patch: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    const text = String(value ?? "").trim();
    if (text) patch[key] = text;
  }
  return patch;
}
