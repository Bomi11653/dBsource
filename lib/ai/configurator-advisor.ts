import type {
  ConfiguratorAiAnalysis,
  ConfiguratorInput,
  ConfiguratorResult,
} from "@/data/configurator-templates";
import { chatCompletion } from "@/lib/ai/deepseek";

type AdvisorPayload = {
  input: ConfiguratorInput;
  basePlan: ConfiguratorResult;
  locale: "zh" | "en";
};

function labelScene(scene: ConfiguratorInput["scene"]) {
  const map: Record<ConfiguratorInput["scene"], string> = {
    livehouse: "Live House",
    stadium: "体育馆/大型场馆",
    conference: "会议/礼堂",
    club: "酒吧/CLUB",
    multipurpose: "多功能厅",
    outdoor: "户外演出",
  };
  return map[scene];
}

function labelUsage(usage: ConfiguratorInput["usages"][number]) {
  const map: Record<ConfiguratorInput["usages"][number], string> = {
    performance: "演出",
    meeting: "会议",
    "music-playback": "音乐播放",
    sports: "体育赛事",
    government: "政企活动",
  };
  return map[usage];
}

function labelBudget(budget: ConfiguratorInput["budget"]) {
  const map: Record<ConfiguratorInput["budget"], string> = {
    economy: "经济版",
    standard: "标准版",
    pro: "专业版",
    flagship: "旗舰版",
  };
  return map[budget];
}

function labelInstall(install: ConfiguratorInput["installMethod"]) {
  const map: Record<ConfiguratorInput["installMethod"], string> = {
    fixed: "固定安装",
    touring: "流动演出",
    flown: "吊挂安装",
    ground: "落地安装",
  };
  return map[install];
}

function labelBass(level: ConfiguratorInput["lowFrequency"]) {
  const map: Record<ConfiguratorInput["lowFrequency"], string> = {
    light: "轻量",
    standard: "标准",
    strong: "强低频",
    extreme: "极强低频",
  };
  return map[level];
}

const EMPTY_ANALYSIS: ConfiguratorAiAnalysis = {
  summary: "",
  professionalReason: "",
  acousticDesign: "",
  installationNotes: [],
  riskWarnings: [],
  salesFollowUp: "",
  engineerReviewRequired: false,
};

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "{}";
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return "{}";
}

function normalize(raw: unknown): ConfiguratorAiAnalysis {
  if (!raw || typeof raw !== "object") return EMPTY_ANALYSIS;
  const o = raw as Record<string, unknown>;
  const notes = Array.isArray(o.installationNotes)
    ? o.installationNotes.map((x) => String(x)).filter(Boolean).slice(0, 6)
    : [];
  const risks = Array.isArray(o.riskWarnings)
    ? o.riskWarnings.map((x) => String(x)).filter(Boolean).slice(0, 6)
    : [];
  return {
    summary: String(o.summary ?? ""),
    professionalReason: String(o.professionalReason ?? ""),
    acousticDesign: String(o.acousticDesign ?? ""),
    installationNotes: notes,
    riskWarnings: risks,
    salesFollowUp: String(o.salesFollowUp ?? ""),
    engineerReviewRequired: Boolean(o.engineerReviewRequired),
  };
}

export async function generateConfiguratorAiAnalysis({
  input,
  basePlan,
  locale,
}: AdvisorPayload): Promise<ConfiguratorAiAnalysis | null> {
  const system =
    locale === "en"
      ? [
          "You are dBsource's professional sound field design consultant.",
          "Your analysis must be professional, concise, restrained, and trustworthy.",
          "Do not exaggerate outcomes. Do not promise absolute acoustic performance.",
          "Do not fabricate specific product models beyond the provided baseline plan.",
          "Do not provide unverified construction conclusions.",
          "Always emphasize that final decisions require site structure checks, rigging points, RT60/reverberation assessment, and on-site measurement verification.",
          "Return strict JSON only, no markdown, no prose outside JSON.",
          "Use the required shape exactly:",
          "{",
          '  "summary": "...",',
          '  "professionalReason": "...",',
          '  "acousticDesign": "...",',
          '  "installationNotes": ["..."],',
          '  "riskWarnings": ["..."],',
          '  "salesFollowUp": "...",',
          '  "engineerReviewRequired": true',
          "}",
        ].join("\n")
      : [
          "你是 dBsource 的专业声场设计顾问。",
          "分析必须专业、简洁、克制、可信。",
          "不要夸大效果，不要承诺绝对结果。",
          "不要虚构基线方案之外的具体型号。",
          "不要给出未经验证的施工结论。",
          "必须强调最终方案需结合现场结构、吊挂点位、混响时间与实测数据复核。",
          "仅返回 JSON，不要 Markdown，不要额外散文。",
          "必须严格使用以下结构：",
          "{",
          '  "summary": "...",',
          '  "professionalReason": "...",',
          '  "acousticDesign": "...",',
          '  "installationNotes": ["..."],',
          '  "riskWarnings": ["..."],',
          '  "salesFollowUp": "...",',
          '  "engineerReviewRequired": true',
          "}",
        ].join("\n");

  const user =
    locale === "en"
      ? JSON.stringify(
          {
            task:
              "Based on user input and local baseline plan, provide professional acoustic recommendation analysis in strict JSON.",
            userInput: input,
            baselinePlan: {
              mains: basePlan.mainsCount,
              subs: basePlan.subCount,
              fills: basePlan.fillCount,
              monitors: basePlan.monitorCount,
              dsp: basePlan.dspSuggestion,
              amp: basePlan.ampSuggestion,
              matchScore: basePlan.matchScore,
            },
            requiredJsonShape: {
              summary: "",
              professionalReason: "",
              acousticDesign: "",
              installationNotes: [""],
              riskWarnings: [""],
              salesFollowUp: "",
              engineerReviewRequired: true,
            },
          },
          null,
          2
        )
      : [
          "请根据以下用户输入和本地规则引擎生成的基础方案，输出专业声场推荐分析。",
          "",
          "用户输入：",
          `场地类型：${labelScene(input.scene)}`,
          `场地面积：${input.areaSqm}㎡`,
          `层高：${input.ceilingHeightM}m`,
          `容纳人数：${input.seats}人`,
          `使用场景：${input.usages.map(labelUsage).join("、")}`,
          `预算区间：${labelBudget(input.budget)}`,
          `安装方式：${labelInstall(input.installMethod)}`,
          `低频需求：${labelBass(input.lowFrequency)}`,
          `是否乐队/多路输入：${input.hasBand ? "是" : "否"}`,
          `是否需要后期扩展：${input.needsExpansion ? "是" : "否"}`,
          "",
          "本地基础方案：",
          `主扩音箱：${basePlan.mainsCount}`,
          `超低音箱：${basePlan.subCount}`,
          `补声音箱：${basePlan.fillCount}`,
          `返听音箱：${basePlan.monitorCount}`,
          `DSP：${basePlan.dspSuggestion.zh}`,
          `功放系统：${basePlan.ampSuggestion.zh}`,
          `匹配度：${basePlan.matchScore}%`,
          "",
          "请返回以下 JSON：",
          "{",
          '  "summary": "",',
          '  "professionalReason": "",',
          '  "acousticDesign": "",',
          '  "installationNotes": [],',
          '  "riskWarnings": [],',
          '  "salesFollowUp": "",',
          '  "engineerReviewRequired": true',
          "}",
        ].join("\n");

  const text = await chatCompletion(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 900, temperature: 0.2 }
  );

  try {
    return normalize(JSON.parse(extractJson(text)));
  } catch {
    return null;
  }
}

