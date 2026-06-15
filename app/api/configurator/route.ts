import { recommendSystem, resolveBomModels } from "@/lib/configurator";
import type {
  BudgetTier,
  ConfiguratorInput,
  ConfiguratorScene,
  InstallMethod,
  LowFrequencyNeed,
  UsageType,
} from "@/data/configurator-templates";
import { generateConfiguratorAiAnalysis } from "@/lib/ai/configurator-advisor";
import { getProducts } from "@/lib/cms";
import { NextRequest, NextResponse } from "next/server";

const SCENES: ConfiguratorScene[] = [
  "livehouse",
  "stadium",
  "conference",
  "club",
  "multipurpose",
  "outdoor",
];
const USAGES: UsageType[] = [
  "performance",
  "meeting",
  "music-playback",
  "sports",
  "government",
];
const BUDGETS: BudgetTier[] = ["economy", "standard", "pro", "flagship"];
const INSTALLS: InstallMethod[] = ["fixed", "touring", "flown", "ground"];
const LOWS: LowFrequencyNeed[] = ["light", "standard", "strong", "extreme"];

function toNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asOneOf<T extends string>(v: unknown, list: readonly T[], fallback: T): T {
  const s = String(v ?? "");
  return (list as readonly string[]).includes(s) ? (s as T) : fallback;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const scene = asOneOf(body.scene, SCENES, "livehouse");
  const usagesRaw: unknown[] = Array.isArray(body.usages) ? body.usages : [];
  const usages = usagesRaw
    .map((x: unknown) => String(x))
    .filter((x): x is UsageType => (USAGES as readonly string[]).includes(x));

  const input: ConfiguratorInput = {
    scene,
    areaSqm: toNumber(body.areaSqm, 400),
    ceilingHeightM: toNumber(body.ceilingHeightM, 6),
    seats: toNumber(body.seats, 800),
    usages: usages.length ? usages : ["performance"],
    budget: asOneOf(body.budget, BUDGETS, "standard"),
    installMethod: asOneOf(body.installMethod, INSTALLS, "fixed"),
    lowFrequency: asOneOf(body.lowFrequency, LOWS, "standard"),
    hasBand: Boolean(body.hasBand),
    needsExpansion: Boolean(body.needsExpansion),
  };

  const products = await getProducts();
  const result = recommendSystem(input, products);
  const bom = resolveBomModels(result.lines, products);
  const locale = body.locale === "en" ? "en" : "zh";

  const timeoutMs = 15000;
  const aiPromise = generateConfiguratorAiAnalysis({
    input,
    basePlan: result,
    locale,
  });
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));

  let ai = null;
  try {
    ai = await Promise.race([aiPromise, timeout]);
  } catch {
    ai = null;
  }

  return NextResponse.json({
    ok: true,
    result,
    bom,
    ai,
    aiEnabled: Boolean(ai),
    fallbackOnly: !ai,
  });
}
