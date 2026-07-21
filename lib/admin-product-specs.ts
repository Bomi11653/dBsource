export type SpecFieldId =
  | "model"
  | "frequencyResponse"
  | "hfDriver"
  | "lfDriver"
  | "power"
  | "sensitivity"
  | "maxSpl"
  | "impedance"
  | "coverage"
  | "crossover"
  | "connector"
  | "netWeight"
  | "grossWeight"
  | "packingSize"
  | "protectionRating"
  | string;

export type SpecTableRow = {
  id: SpecFieldId;
  labelZh: string;
  labelEn: string;
  valueZh: string;
  valueEn: string;
  isFixed: boolean;
};

export type ParsedProductSpecs = {
  rows: SpecTableRow[];
  unparsedZh: string;
  unparsedEn: string;
  /** 至少解析出一行带标签的参数，或识别出紧凑格式片段 */
  parseable: boolean;
};

export const CUSTOM_OTHER_LABEL_ZH = "其他参数";
export const CUSTOM_OTHER_LABEL_EN = "Other";

export const DEFAULT_SPEC_FIELD_DEFS: {
  id: SpecFieldId;
  labelZh: string;
  labelEn: string;
  matchZh: string[];
  matchEn: string[];
}[] = [
  {
    id: "model",
    labelZh: "型号",
    labelEn: "Model",
    matchZh: ["型号"],
    matchEn: ["model"],
  },
  {
    id: "frequencyResponse",
    labelZh: "频率响应(-10dB)",
    labelEn: "Frequency Response (-10dB)",
    matchZh: ["频率响应(-10db)", "频率响应"],
    matchEn: ["frequency response (-10db)", "frequency response"],
  },
  {
    id: "hfDriver",
    labelZh: "高音单元",
    labelEn: "HF Driver",
    matchZh: ["高音单元"],
    matchEn: ["hf driver", "high frequency driver"],
  },
  {
    id: "lfDriver",
    labelZh: "低音单元",
    labelEn: "LF Driver",
    matchZh: ["低音单元"],
    matchEn: ["lf driver", "low frequency driver"],
  },
  {
    id: "power",
    labelZh: "功率(额定/峰值)",
    labelEn: "Power (Rated/Peak)",
    matchZh: ["功率(额定/峰值)", "功率"],
    matchEn: ["power (rated/peak)", "power (rms/peak)", "power"],
  },
  {
    id: "sensitivity",
    labelZh: "灵敏度(1瓦/1米)",
    labelEn: "Sensitivity (1W/1m)",
    matchZh: ["灵敏度(1瓦/1米)", "灵敏度(1w/1m)", "灵敏度"],
    matchEn: ["sensitivity (1w/1m)", "sensitivity"],
  },
  {
    id: "maxSpl",
    labelZh: "最大声压级",
    labelEn: "Max SPL",
    matchZh: ["最大声压级"],
    matchEn: ["max spl", "maximum spl"],
  },
  {
    id: "impedance",
    labelZh: "标称阻抗",
    labelEn: "Nominal Impedance",
    matchZh: ["标称阻抗", "阻抗"],
    matchEn: ["nominal impedance", "impedance"],
  },
  {
    id: "coverage",
    labelZh: "覆盖角(-6dB)",
    labelEn: "Coverage Angle (-6dB)",
    matchZh: ["覆盖角(-6db)", "覆盖角"],
    matchEn: ["coverage angle (-6db)", "dispersion (-6db)", "coverage angle"],
  },
  {
    id: "crossover",
    labelZh: "声学分频点",
    labelEn: "Crossover Frequency",
    matchZh: ["声学分频点", "分频点"],
    matchEn: ["crossover frequency", "crossover"],
  },
  {
    id: "connector",
    labelZh: "输入连接器",
    labelEn: "Input Connector",
    matchZh: ["输入连接器", "连接器"],
    matchEn: ["input connector", "connector"],
  },
  {
    id: "netWeight",
    labelZh: "净重",
    labelEn: "Net Weight",
    matchZh: ["净重"],
    matchEn: ["net weight"],
  },
  {
    id: "grossWeight",
    labelZh: "毛重",
    labelEn: "Gross Weight",
    matchZh: ["毛重"],
    matchEn: ["gross weight"],
  },
  {
    id: "packingSize",
    labelZh: "包装尺寸(HxWxD)",
    labelEn: "Packing Size (HxWxD)",
    matchZh: ["包装尺寸(hxwxd)", "包装尺寸"],
    matchEn: ["packing size (hxwxd)", "packing size", "package size"],
  },
  {
    id: "protectionRating",
    labelZh: "防护等级",
    labelEn: "Protection Rating",
    matchZh: ["防护等级", "ip等级", "ip防护"],
    matchEn: ["protection rating", "ip rating", "ingress protection"],
  },
];

function normalizeLabel(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .toLowerCase();
}


function parseLine(line: string): { label: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const colon = trimmed.match(/^(.+?)[：:]\s*(.+)$/);
  if (colon) {
    return { label: colon[1].trim(), value: colon[2].trim() };
  }

  const pipe = trimmed.match(/^(.+?)\s*\|\s*(.+)$/);
  if (pipe && /[：:]/.test(pipe[1]) === false) {
    const left = pipe[1].trim();
    const right = pipe[2].trim();
    if (left.length <= 40) return { label: left, value: right };
  }

  return null;
}

/** 按换行或 | 拆分为值片段（紧凑摘要或多行无标签格式） */
function splitIntoSegments(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 1 && lines[0].includes("|")) {
    return lines[0]
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return lines;
}

function findFieldIdForLabel(label: string, lang: "zh" | "en"): SpecFieldId | null {
  const norm = normalizeLabel(label);
  if (!norm) return null;

  for (const def of DEFAULT_SPEC_FIELD_DEFS) {
    const candidates = lang === "zh" ? def.matchZh : def.matchEn;
    for (const candidate of candidates) {
      const normCandidate = normalizeLabel(candidate);
      if (norm === normCandidate || norm.includes(normCandidate) || normCandidate.includes(norm)) {
        return def.id;
      }
    }
    const defaultLabel = normalizeLabel(lang === "zh" ? def.labelZh : def.labelEn);
    if (norm === defaultLabel || norm.includes(defaultLabel) || defaultLabel.includes(norm)) {
      return def.id;
    }
  }

  return null;
}

type CompactParseContext = {
  netWeightSeen: boolean;
  grossWeightSeen: boolean;
};

function isCrossoverContext(value: string): boolean {
  if (/分频|crossover/i.test(value)) return true;
  const trimmed = value.trim();
  if (/^[\d.]+\s*k?hz$/i.test(trimmed)) return true;
  return false;
}

function isFrequencyResponseValue(value: string): boolean {
  if (!/(hz|khz)/i.test(value)) return false;
  if (isCrossoverContext(value)) return false;
  if (/[\d.]+\s*[-–—~至]\s*[\d.]+\s*k?hz/i.test(value)) return true;
  if (/(-10\s*db|（-10db）|\(-10db\))/i.test(value)) return true;
  if (/频率响应|frequency\s*response/i.test(value)) return true;
  return /(hz|khz)/i.test(value);
}

function isPowerValue(value: string): boolean {
  return (
    /\d+\s*w\s*\/\s*\d+\s*w/i.test(value) ||
    /\d+\s*w\s*[\(（]\s*rms\s*[\)）]/i.test(value) ||
    /\d+\s*w\s*[\(（]?\s*(rated|peak|rms)/i.test(value) ||
    /功率|power/i.test(value) ||
    /^\d+\s*w$/i.test(value.trim())
  );
}

function isProtectionRatingValue(value: string): boolean {
  return /\bIP\s*\d{2}\b/i.test(value);
}

function isImpedanceValue(value: string): boolean {
  return /\d+\s*Ω|\d+\s*ohm/i.test(value) || /阻抗|impedance/i.test(value);
}

function isMaxSplValue(value: string): boolean {
  if (!/db/i.test(value)) return false;
  return /spl|声压|最大|peak|峰值|max/i.test(value);
}

function isSensitivityValue(value: string): boolean {
  if (!/db/i.test(value)) return false;
  if (isMaxSplValue(value)) return false;
  if (/(hz|khz)/i.test(value)) return false;
  return /灵敏度|sensitivity/i.test(value) || /^\d+(\.\d+)?\s*db$/i.test(value.trim());
}

function isPackingSizeValue(value: string): boolean {
  return (
    /\d+\s*[x×]\s*\d+\s*[x×]\s*\d+/i.test(value) ||
    /包装尺寸|packing\s*size|package\s*size/i.test(value)
  );
}

function isConnectorValue(value: string): boolean {
  return (
    /nl4|speakon|xlr|connector|连接器|凤凰端子|接线柱/i.test(value) ||
    /\d+\s*[x×]\s*nl4/i.test(value)
  );
}

function isDriverValue(value: string, kind: "hf" | "lf"): boolean {
  if (kind === "hf") {
    return /高音|hf\s*driver|high\s*frequency/i.test(value);
  }
  return /低音|lf\s*driver|low\s*frequency|woofer/i.test(value);
}

function isCoverageValue(value: string): boolean {
  return /覆盖角|coverage|dispersion/i.test(value) || /°|度/.test(value);
}

function isWeightValue(value: string): boolean {
  return /\d+(\.\d+)?\s*kg/i.test(value) || /净重|毛重|net\s*weight|gross\s*weight/i.test(value);
}

function classifyWeightField(
  value: string,
  lang: "zh" | "en",
  ctx: CompactParseContext
): SpecFieldId {
  const lower = value.toLowerCase();
  if (/毛重|gross/i.test(value)) return "grossWeight";
  if (/净重|net/i.test(value)) return "netWeight";

  if (!ctx.netWeightSeen) {
    ctx.netWeightSeen = true;
    return "netWeight";
  }
  if (!ctx.grossWeightSeen) {
    ctx.grossWeightSeen = true;
    return "grossWeight";
  }

  return lang === "zh" ? "netWeight" : "netWeight";
}

function classifyCompactValue(
  segment: string,
  lang: "zh" | "en",
  ctx: CompactParseContext
): SpecFieldId | null {
  const value = segment.trim();
  if (!value) return null;

  if (isProtectionRatingValue(value)) return "protectionRating";
  if (isConnectorValue(value)) return "connector";
  if (isPackingSizeValue(value)) return "packingSize";
  if (isImpedanceValue(value)) return "impedance";
  if (isPowerValue(value)) return "power";
  if (isMaxSplValue(value)) return "maxSpl";
  if (isSensitivityValue(value)) return "sensitivity";
  if (isFrequencyResponseValue(value)) return "frequencyResponse";
  if (isCrossoverContext(value)) return "crossover";
  if (isWeightValue(value)) return classifyWeightField(value, lang, ctx);
  if (isDriverValue(value, "hf")) return "hfDriver";
  if (isDriverValue(value, "lf")) return "lfDriver";
  if (isCoverageValue(value)) return "coverage";

  return null;
}

type SegmentAssignment = {
  fieldId: SpecFieldId | null;
  value: string;
  isCustom: boolean;
  label?: string;
};

function parseSegments(text: string, lang: "zh" | "en"): SegmentAssignment[] {
  const segments = splitIntoSegments(text);
  const assignments: SegmentAssignment[] = [];
  const ctx: CompactParseContext = { netWeightSeen: false, grossWeightSeen: false };

  for (const segment of segments) {
    const labeled = parseLine(segment);
    if (labeled) {
      const fieldId = findFieldIdForLabel(labeled.label, lang);
      assignments.push({
        fieldId,
        value: labeled.value,
        isCustom: !fieldId,
        label: labeled.label,
      });
      continue;
    }

    const fieldId = classifyCompactValue(segment, lang, ctx);
    if (fieldId) {
      assignments.push({ fieldId, value: segment.trim(), isCustom: false });
      continue;
    }

    if (segment.trim()) {
      assignments.push({
        fieldId: null,
        value: segment.trim(),
        isCustom: true,
        label: CUSTOM_OTHER_LABEL_ZH,
      });
    }
  }

  return assignments;
}

function findFieldDef(fieldId: SpecFieldId | null | undefined) {
  if (!fieldId) return undefined;
  return DEFAULT_SPEC_FIELD_DEFS.find((def) => def.id === fieldId);
}

function resolveRowLabels(
  assignment: SegmentAssignment | undefined,
  lang: "zh" | "en",
  fieldId: SpecFieldId | null
): string {
  if (assignment?.label?.trim()) return assignment.label.trim();
  const def = findFieldDef(fieldId);
  if (def) return lang === "zh" ? def.labelZh : def.labelEn;
  return lang === "zh" ? CUSTOM_OTHER_LABEL_ZH : CUSTOM_OTHER_LABEL_EN;
}

/** 按文本行顺序合并中英文，保留后台保存时的参数顺序 */
function buildOrderedRows(
  zhAssignments: SegmentAssignment[],
  enAssignments: SegmentAssignment[]
): SpecTableRow[] {
  const count = Math.max(zhAssignments.length, enAssignments.length);
  const rows: SpecTableRow[] = [];

  for (let i = 0; i < count; i += 1) {
    const zh = zhAssignments[i];
    const en = enAssignments[i];
    if (!zh && !en) continue;

    const fieldId = zh?.fieldId ?? en?.fieldId ?? null;
    const labelZh = resolveRowLabels(zh, "zh", fieldId);
    const labelEn = resolveRowLabels(en, "en", fieldId);
    const valueZh = zh?.value?.trim() ?? "";
    const valueEn = en?.value?.trim() ?? "";

    if (!labelZh && !valueZh && !labelEn && !valueEn) continue;

    const slug = normalizeLabel(`${labelZh}-${labelEn}-${valueZh}-${valueEn}`) || String(i);
    rows.push({
      id: fieldId ? `${fieldId}-${i}-${slug}` : `custom-${i}-${slug}`,
      labelZh,
      labelEn,
      valueZh,
      valueEn,
      isFixed: false,
    });
  }

  return rows;
}

export function parseProductSpecs(specsZh: string, specsEn: string): ParsedProductSpecs {
  const zhText = specsZh.trim();
  const enText = specsEn.trim();

  if (!zhText && !enText) {
    return {
      rows: [],
      unparsedZh: "",
      unparsedEn: "",
      parseable: true,
    };
  }

  const zhAssignments = parseSegments(zhText, "zh");
  const enAssignments = parseSegments(enText, "en");
  const hasRecognized =
    zhAssignments.some((a) => a.fieldId && !a.isCustom) ||
    enAssignments.some((a) => a.fieldId && !a.isCustom);
  const hasLabeled =
    zhAssignments.some((a) => a.label && !a.isCustom) ||
    enAssignments.some((a) => a.label && !a.isCustom);
  const hasContent = zhAssignments.length > 0 || enAssignments.length > 0;
  const parseable = hasContent;

  if (!parseable) {
    return {
      rows: [],
      unparsedZh: zhText,
      unparsedEn: enText,
      parseable: false,
    };
  }

  const rows = buildOrderedRows(zhAssignments, enAssignments);

  const unparsedZh =
    !hasRecognized && !hasLabeled && zhText
      ? zhAssignments.map((a) => a.value).join(" | ")
      : "";
  const unparsedEn =
    !hasRecognized && !hasLabeled && enText
      ? enAssignments.map((a) => a.value).join(" | ")
      : "";

  return {
    rows,
    unparsedZh,
    unparsedEn,
    parseable: true,
  };
}

/** 默认优先表格模式；仅当完全无内容时不强制表格（空表） */
export function shouldDefaultRawMode(specsZh: string, specsEn: string): boolean {
  const parsed = parseProductSpecs(specsZh, specsEn);
  return !parsed.parseable;
}

export function serializeProductSpecs(rows: SpecTableRow[]): { specsZh: string; specsEn: string } {
  const zhLines: string[] = [];
  const enLines: string[] = [];

  for (const row of rows) {
    const labelZh = row.labelZh.trim();
    const valueZh = row.valueZh.trim();
    const labelEn = row.labelEn.trim();
    const valueEn = row.valueEn.trim();

    if (labelZh || valueZh) {
      zhLines.push(`${labelZh || "—"}: ${valueZh}`);
    }
    if (labelEn || valueEn) {
      enLines.push(`${labelEn || "—"}: ${valueEn}`);
    }
  }

  return {
    specsZh: zhLines.join("\n"),
    specsEn: enLines.join("\n"),
  };
}

export function createCustomSpecRow(index: number): SpecTableRow {
  return {
    id: `custom-${Date.now()}-${index}`,
    labelZh: "",
    labelEn: "",
    valueZh: "",
    valueEn: "",
    isFixed: false,
  };
}

export function hasProductSpecRows(specsZh: string, specsEn: string): boolean {
  const { rows } = parseProductSpecs(specsZh, specsEn);
  return rows.some(
    (row) =>
      row.labelZh.trim() ||
      row.valueZh.trim() ||
      row.labelEn.trim() ||
      row.valueEn.trim()
  );
}
