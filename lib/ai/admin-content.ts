import { chatCompletion } from "@/lib/ai/deepseek";
import { normalizeExtractedSpecsToTableFormat } from "@/lib/admin-product-specs";

type CaseTranslation = {
  titleEn: string;
  descEn: string;
};

type ProductSpecExtraction = {
  specsZh: string;
  specsEn: string;
  descZh?: string;
  descEn?: string;
  rowCount?: number;
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

function rowsFromAiPayload(parsed: Record<string, unknown>): {
  specsZh: string;
  specsEn: string;
} | null {
  const rowsRaw = parsed.rows;
  if (!Array.isArray(rowsRaw) || !rowsRaw.length) return null;

  const zhLines: string[] = [];
  const enLines: string[] = [];
  for (const item of rowsRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const labelZh = String(row.labelZh ?? row.nameZh ?? row.label ?? "").trim();
    const labelEn = String(row.labelEn ?? row.nameEn ?? row.label ?? "").trim();
    const valueZh = String(row.valueZh ?? row.value ?? "").trim();
    const valueEn = String(row.valueEn ?? row.value ?? "").trim();
    if (!labelZh && !valueZh && !labelEn && !valueEn) continue;
    if (labelZh || valueZh) zhLines.push(`${labelZh || "—"}: ${valueZh}`);
    if (labelEn || valueEn) enLines.push(`${labelEn || "—"}: ${valueEn}`);
  }
  if (!zhLines.length && !enLines.length) return null;
  return { specsZh: zhLines.join("\n"), specsEn: enLines.join("\n") };
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
          "You extract product technical specifications from PDF text for a CMS editable table. Return ONLY valid JSON. Prefer: {\"rows\":[{\"labelZh\":\"参数名称\",\"labelEn\":\"Parameter\",\"valueZh\":\"中文值\",\"valueEn\":\"English value\"}],\"descZh\":\"...\",\"descEn\":\"...\"}. Rules: 1) One object per parameter row. 2) Do NOT return a single pipe-separated compact summary line. 3) Do NOT invent empty fixed template rows. 4) Only include parameters found in the PDF. 5) Keep bilingual labels/values aligned. Fallback keys specsZh/specsEn are allowed only as multiline \"Label: Value\" text (one parameter per line).",
      },
      {
        role: "user",
        content: JSON.stringify({
          modelHint: input.modelHint ?? "",
          text: input.text.slice(0, 26000),
        }),
      },
    ],
    { maxTokens: 1600, temperature: 0.2 }
  );

  const parsed = extractJsonObject(reply);
  if (!parsed) return null;

  const fromRows = rowsFromAiPayload(parsed);
  const specsZhRaw = fromRows?.specsZh ?? String(parsed.specsZh ?? "").trim();
  const specsEnRaw = fromRows?.specsEn ?? String(parsed.specsEn ?? "").trim();
  const descZh = String(parsed.descZh ?? "").trim();
  const descEn = String(parsed.descEn ?? "").trim();

  if (!specsZhRaw && !specsEnRaw) return null;

  const normalized = normalizeExtractedSpecsToTableFormat(specsZhRaw, specsEnRaw);
  if (!normalized.rowCount) return null;

  return {
    specsZh: normalized.specsZh,
    specsEn: normalized.specsEn,
    rowCount: normalized.rowCount,
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
