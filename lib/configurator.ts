import type { Product } from "@/data/mock";
import type {
  BomLine,
  ConfiguratorInput,
  ConfiguratorResult,
  BudgetTier,
  InstallMethod,
  LowFrequencyNeed,
  UsageType,
} from "@/data/configurator-templates";

function findByPrefix(products: Product[], prefix: string): Product | undefined {
  const p = prefix.toUpperCase();
  return (
    products.find((x) => x.model.toUpperCase() === p) ||
    products.find((x) => x.model.toUpperCase().startsWith(p)) ||
    products.find((x) => x.productLine === prefix.toLowerCase())
  );
}

function line(
  model: string,
  qty: number,
  role: BomLine["role"],
  note?: BomLine["note"]
): BomLine {
  return { model, qty, role, note };
}

export function recommendSystem(
  input: ConfiguratorInput,
  products: Product[]
): ConfiguratorResult {
  const area = clamp(input.areaSqm, 80, 120000);
  const seats = clamp(input.seats, 30, 100000);
  const height = clamp(input.ceilingHeightM, 2.5, 40);
  const usageBoost = usageWeight(input.usages);
  const baseScale = Math.max(area / 320, seats / 260) * usageBoost;
  const sceneScale = sceneMultiplier(input.scene);
  const lfScale = lfMultiplier(input.lowFrequency);
  const budgetScale = budgetMultiplier(input.budget);
  const installScale = installMultiplier(input.installMethod);
  const expansionScale = input.needsExpansion ? 1.12 : 1;
  const bandScale = input.hasBand ? 1.08 : 1;

  const mainsCount = Math.max(2, roundUp(baseScale * sceneScale * installScale, 2));
  const subCount = Math.max(
    0,
    roundUp((mainsCount / 2) * lfScale * budgetScale, 2)
  );
  const fillCount = Math.max(
    0,
    roundUp((mainsCount * (height >= 8 ? 0.4 : 0.25)) * expansionScale, 2)
  );
  const monitorCount = Math.max(
    0,
    roundUp((input.hasBand ? mainsCount * 0.55 : mainsCount * 0.2) * bandScale, 2)
  );

  const dspQty = Math.max(
    1,
    roundUp((mainsCount + subCount + fillCount + monitorCount) / 16, 1)
  );
  const ampQty = Math.max(
    1,
    roundUp((mainsCount + subCount + fillCount + monitorCount) / 4, 1)
  );
  const complexity = complexityLabel(
    mainsCount + subCount + fillCount + monitorCount,
    input
  );
  const matchScore = calcMatchScore(input, mainsCount, subCount, fillCount, monitorCount);
  const title = sceneTitle(input.scene);
  const summary = {
    zh: `${SCENE_TEXT_ZH[input.scene]} · ${area}㎡ · ${seats}人 · ${budgetLabelZh(input.budget)}`,
    en: `${SCENE_TEXT_EN[input.scene]} · ${area} sqm · ${seats} pax · ${budgetLabelEn(input.budget)}`,
  };

  const lines = buildLines(input, products, {
    mainsCount,
    subCount,
    fillCount,
    monitorCount,
    dspQty,
    ampQty,
  });

  const applicableArea = {
    zh: `${Math.round(area * 0.75)}㎡ - ${Math.round(area * 1.3)}㎡`,
    en: `${Math.round(area * 0.75)} - ${Math.round(area * 1.3)} sqm`,
  };

  const caseIds = sceneCaseIds(input.scene);
  const needsConsult =
    input.scene === "stadium" ||
    input.scene === "outdoor" ||
    matchScore < 80 ||
    complexity.zh.includes("高");

  return {
    scene: input.scene,
    title,
    summary,
    matchScore,
    complexity,
    applicableArea,
    mainsCount,
    subCount,
    fillCount,
    monitorCount,
    dspSuggestion: {
      zh: `Unit48 数字处理器 ${dspQty} 台（支持分区路由与预设管理）`,
      en: `Unit48 DSP x ${dspQty} (zoning, routing and preset control)`,
    },
    ampSuggestion: {
      zh: `建议 ${ampQty} 台功放机组，保留 10%-15% 功率余量`,
      en: `Recommend ${ampQty} amplifier units with 10%-15% power headroom`,
    },
    lines,
    caseIds,
    contactQuery: `${SCENE_TEXT_ZH[input.scene]} ${area}㎡ ${seats}人 方案咨询`,
    needsConsult,
  };
}

function buildLines(
  input: ConfiguratorInput,
  products: Product[],
  counts: {
    mainsCount: number;
    subCount: number;
    fillCount: number;
    monitorCount: number;
    dspQty: number;
    ampQty: number;
  }
): BomLine[] {
  const lines: BomLine[] = [];
  const la = findByPrefix(products, "LA");

  const mainModel =
    input.scene === "conference" || input.scene === "multipurpose"
      ? "SOL"
      : la?.model ?? "LA208";
  const subModel = input.lowFrequency === "light" ? "D0118S" : "V221S";
  const fillModel = input.scene === "outdoor" ? "RE" : "LW";
  const monitorModel = "MI12";

  lines.push(
    line(mainModel, counts.mainsCount, { zh: "主扩音箱", en: "Main speakers" }),
    line(subModel, counts.subCount, { zh: "超低音箱", en: "Subwoofers" }),
    line(fillModel, counts.fillCount, { zh: "补声音箱", en: "Fill speakers" }),
    line(monitorModel, counts.monitorCount, { zh: "返听音箱", en: "Monitor speakers" }),
    line("Unit48", counts.dspQty, { zh: "DSP 控制系统", en: "DSP control system" }),
    line("AMP", counts.ampQty, { zh: "功放系统", en: "Amplifier system" })
  );

  return lines;
}

const SCENE_TEXT_ZH = {
  livehouse: "Live House",
  stadium: "体育馆/大型场馆",
  conference: "会议/礼堂",
  club: "酒吧/CLUB",
  multipurpose: "多功能厅",
  outdoor: "户外演出",
} as const;

const SCENE_TEXT_EN = {
  livehouse: "Live House",
  stadium: "Stadium / Large Venue",
  conference: "Conference / Auditorium",
  club: "Bar / CLUB",
  multipurpose: "Multi-purpose Hall",
  outdoor: "Outdoor Performance",
} as const;

function sceneTitle(scene: ConfiguratorInput["scene"]) {
  return {
    zh: `${SCENE_TEXT_ZH[scene]} 扩声推荐方案`,
    en: `${SCENE_TEXT_EN[scene]} PA Recommendation`,
  };
}

function sceneCaseIds(scene: ConfiguratorInput["scene"]): number[] {
  switch (scene) {
    case "stadium":
      return [1, 6];
    case "conference":
      return [2, 4];
    case "outdoor":
      return [3, 5];
    default:
      return [1, 2];
  }
}

function complexityLabel(totalBoxes: number, input: ConfiguratorInput) {
  const high = totalBoxes > 30 || input.scene === "stadium" || input.scene === "outdoor";
  const low = totalBoxes < 12 && input.installMethod === "fixed";
  if (high) return { zh: "高（建议工程师复核）", en: "High (Engineer review recommended)" };
  if (low) return { zh: "低（标准部署）", en: "Low (Standard deployment)" };
  return { zh: "中（常规工程复杂度）", en: "Medium (Typical project complexity)" };
}

function calcMatchScore(
  input: ConfiguratorInput,
  mains: number,
  subs: number,
  fills: number,
  monitors: number
) {
  let score = 88;
  if (input.lowFrequency === "extreme" && subs < mains) score -= 8;
  if (input.needsExpansion) score += 3;
  if (input.budget === "economy" && (mains + subs + fills + monitors) > 28) score -= 6;
  if (input.scene === "outdoor" && input.installMethod === "fixed") score -= 4;
  return Math.max(62, Math.min(98, score));
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function roundUp(n: number, step: number) {
  if (step <= 1) return Math.ceil(n);
  return Math.ceil(n / step) * step;
}

function sceneMultiplier(scene: ConfiguratorInput["scene"]) {
  switch (scene) {
    case "stadium":
      return 1.45;
    case "outdoor":
      return 1.35;
    case "club":
      return 1.1;
    case "multipurpose":
      return 1.08;
    case "conference":
      return 0.95;
    default:
      return 1;
  }
}

function budgetMultiplier(budget: BudgetTier) {
  switch (budget) {
    case "economy":
      return 0.85;
    case "pro":
      return 1.1;
    case "flagship":
      return 1.2;
    default:
      return 1;
  }
}

function installMultiplier(install: InstallMethod) {
  switch (install) {
    case "flown":
      return 1.08;
    case "touring":
      return 1.12;
    case "ground":
      return 0.98;
    default:
      return 1;
  }
}

function lfMultiplier(lf: LowFrequencyNeed) {
  switch (lf) {
    case "light":
      return 0.7;
    case "strong":
      return 1.25;
    case "extreme":
      return 1.45;
    default:
      return 1;
  }
}

function usageWeight(usages: UsageType[]) {
  const set = new Set(usages);
  let w = 1;
  if (set.has("performance")) w += 0.1;
  if (set.has("sports")) w += 0.08;
  if (set.has("government")) w += 0.05;
  return w;
}

function budgetLabelZh(budget: BudgetTier) {
  switch (budget) {
    case "economy":
      return "经济版";
    case "pro":
      return "专业版";
    case "flagship":
      return "旗舰版";
    default:
      return "标准版";
  }
}

function budgetLabelEn(budget: BudgetTier) {
  switch (budget) {
    case "economy":
      return "Economy";
    case "pro":
      return "Pro";
    case "flagship":
      return "Flagship";
    default:
      return "Standard";
  }
}

export function resolveBomModels(lines: BomLine[], products: Product[]) {
  return lines.map((item) => {
    if (item.qty === 0) return { ...item, product: undefined as Product | undefined };
    const product =
      products.find((p) => p.model.toUpperCase() === item.model.toUpperCase()) ||
      findByPrefix(products, item.model.split(/[\d]/)[0] || item.model);
    return { ...item, product };
  });
}
