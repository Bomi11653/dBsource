import type { Product, ProductLineSlug } from "./mock";
import { getSpecSheet, SERIES_SPEC_SUMMARY } from "./product-specs";

const PRODUCT_IMAGES = [
  "/images/product-1.svg",
  "/images/product-2.svg",
  "/images/product-3.svg",
  "/images/product-4.svg",
];

type CatalogEntry = {
  model: string;
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  productLine: ProductLineSlug;
  series: { zh: string; en: string };
};

const SERIES_META: Record<
  ProductLineSlug,
  Pick<Product, "seriesGroup" | "category">
> = {
  la: { seriesGroup: "speaker", category: "speaker" },
  lw: { seriesGroup: "speaker", category: "speaker" },
  mi: { seriesGroup: "speaker", category: "speaker" },
  do: { seriesGroup: "speaker", category: "speaker" },
  sol: { seriesGroup: "speaker", category: "speaker" },
  k: { seriesGroup: "speaker", category: "speaker" },
  re: { seriesGroup: "speaker", category: "speaker" },
  p: { seriesGroup: "speaker", category: "speaker" },
  driver: { seriesGroup: "speaker", category: "speaker" },
  electronics: { seriesGroup: "speaker", category: "speaker" },
  accessory: { seriesGroup: "speaker", category: "speaker" },
  tour: { seriesGroup: "speaker", category: "speaker" },
  unit48: { seriesGroup: "dsp", category: "dsp" },
  suite: { seriesGroup: "software", category: "software" },
  turnkey: { seriesGroup: "engineering", category: "speaker" },
};

/** B 端 + C 端画册全部型号 */
const CATALOG_ENTRIES: CatalogEntry[] = [
  // LA 线阵列（B 端）
  { model: "LA206", name: { zh: "LA206", en: "LA206" }, desc: { zh: "双 6.5 寸全频线阵列音箱", en: "Dual 6.5\" full-range line array" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA115S", name: { zh: "LA115S", en: "LA115S" }, desc: { zh: "单 15 寸线阵列超低音箱", en: "Single 15\" line array subwoofer" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA208", name: { zh: "LA208", en: "LA208" }, desc: { zh: "双 8 寸全频线阵列音箱", en: "Dual 8\" full-range line array" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA118S", name: { zh: "LA118S", en: "LA118S" }, desc: { zh: "单 18 寸线阵列超低音箱", en: "Single 18\" line array subwoofer" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA210", name: { zh: "LA210", en: "LA210" }, desc: { zh: "双 10 寸全频线阵列音箱", en: "Dual 10\" full-range line array" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA118W", name: { zh: "LA118W", en: "LA118W" }, desc: { zh: "单 18 寸线阵列超低音箱", en: "Single 18\" line array subwoofer" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA121W", name: { zh: "LA121W", en: "LA121W" }, desc: { zh: "单 21 寸线阵列超低音箱", en: "Single 21\" line array subwoofer" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA212", name: { zh: "LA212", en: "LA212" }, desc: { zh: "双 12 寸全频线阵列音箱", en: "Dual 12\" full-range line array" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  { model: "LA218S", name: { zh: "LA218S", en: "LA218S" }, desc: { zh: "双 18 寸线阵列超低音箱", en: "Dual 18\" line array subwoofer" }, productLine: "la", series: { zh: "LA 线阵列音箱", en: "LA Line Array" } },
  // LW 全天候（B 端）
  { model: "LW210L", name: { zh: "LW210L", en: "LW210L" }, desc: { zh: "双 10 寸全天候线阵列音箱", en: "Dual 10\" all-weather line array" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW18S", name: { zh: "LW18S", en: "LW18S" }, desc: { zh: "单 18 寸全天候线阵列超低", en: "Single 18\" all-weather line array sub" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW6", name: { zh: "LW6", en: "LW6" }, desc: { zh: "6.5 寸全天候两分频音箱", en: "6.5\" all-weather two-way speaker" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW8", name: { zh: "LW8", en: "LW8" }, desc: { zh: "8 寸全天候两分频音箱", en: "8\" all-weather two-way speaker" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW12", name: { zh: "LW12", en: "LW12" }, desc: { zh: "12 寸全天候两分频音箱", en: "12\" all-weather two-way speaker" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW15", name: { zh: "LW15", en: "LW15" }, desc: { zh: "15 寸全天候两分频音箱", en: "15\" all-weather two-way speaker" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW208", name: { zh: "LW208", en: "LW208" }, desc: { zh: "8 寸同轴全天候中远程音箱", en: "8\" coaxial all-weather mid-long range" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW212", name: { zh: "LW212", en: "LW212" }, desc: { zh: "12 寸同轴全天候中远程音箱", en: "12\" coaxial all-weather mid-long range" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  { model: "LW215", name: { zh: "LW215", en: "LW215" }, desc: { zh: "15 寸同轴全天候中远程音箱", en: "15\" coaxial all-weather mid-long range" }, productLine: "lw", series: { zh: "LW 中远程防水音箱", en: "LW Medium-Throw IP" } },
  // MI 返送（B 端）
  { model: "MI12", name: { zh: "MI12", en: "MI12" }, desc: { zh: "12 寸同轴舞台返听音箱", en: "12\" coaxial stage monitor" }, productLine: "mi", series: { zh: "MI 返送音箱", en: "MI Stage Monitor" } },
  { model: "MI15", name: { zh: "MI15", en: "MI15" }, desc: { zh: "15 寸同轴舞台返听音箱", en: "15\" coaxial stage monitor" }, productLine: "mi", series: { zh: "MI 返送音箱", en: "MI Stage Monitor" } },
  // DO 全频（B 端）
  { model: "DO106", name: { zh: "DO106", en: "DO106" }, desc: { zh: "6.5 寸两分频全频音箱", en: "6.5\" two-way full-range speaker" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO108", name: { zh: "DO108", en: "DO108" }, desc: { zh: "8 寸两分频全频音箱", en: "8\" two-way full-range speaker" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO110", name: { zh: "DO110", en: "DO110" }, desc: { zh: "10 寸两分频全频音箱", en: "10\" two-way full-range speaker" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO112", name: { zh: "DO112", en: "DO112" }, desc: { zh: "12 寸两分频全频音箱", en: "12\" two-way full-range speaker" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO115", name: { zh: "DO115", en: "DO115" }, desc: { zh: "15 寸两分频全频音箱", en: "15\" two-way full-range speaker" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO115H", name: { zh: "DO115H", en: "DO115H" }, desc: { zh: "15 寸高功率两分频全频音箱", en: "15\" high-power two-way speaker" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO215", name: { zh: "DO215", en: "DO215" }, desc: { zh: "双 15 寸两分频全频音箱", en: "Dual 15\" two-way full-range speaker" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO115S", name: { zh: "DO115S", en: "DO115S" }, desc: { zh: "15 寸倒相式超低音箱", en: "15\" inverted subwoofer" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO118S", name: { zh: "DO118S", en: "DO118S" }, desc: { zh: "18 寸倒相式超低音箱", en: "18\" inverted subwoofer" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  { model: "DO218S", name: { zh: "DO218S", en: "DO218S" }, desc: { zh: "双 18 寸倒相式超低音箱", en: "Dual 18\" inverted subwoofer" }, productLine: "do", series: { zh: "DO 多功能全频音箱", en: "DO Full-Range" } },
  // SOL 音柱（B 端）
  { model: "SOL403", name: { zh: "SOL403", en: "SOL403" }, desc: { zh: "2×4 寸全天候音柱音箱", en: "2×4\" all-weather column speaker" }, productLine: "sol", series: { zh: "SOL 多功能防水音柱", en: "SOL IP Column" } },
  { model: "SOL405", name: { zh: "SOL405", en: "SOL405" }, desc: { zh: "4×4 寸全天候音柱音箱", en: "4×4\" all-weather column speaker" }, productLine: "sol", series: { zh: "SOL 多功能防水音柱", en: "SOL IP Column" } },
  { model: "SOL407", name: { zh: "SOL407", en: "SOL407" }, desc: { zh: "6×4 寸全天候音柱音箱", en: "6×4\" all-weather column speaker" }, productLine: "sol", series: { zh: "SOL 多功能防水音柱", en: "SOL IP Column" } },
  // K 娱乐（B 端）
  { model: "K10", name: { zh: "K10", en: "K10" }, desc: { zh: "10 寸两分频娱乐音箱", en: "10\" two-way entertainment speaker" }, productLine: "k", series: { zh: "K 系列娱乐音箱", en: "K Entertainment" } },
  { model: "K12", name: { zh: "K12", en: "K12" }, desc: { zh: "12 寸两分频娱乐音箱", en: "12\" two-way entertainment speaker" }, productLine: "k", series: { zh: "K 系列娱乐音箱", en: "K Entertainment" } },
  { model: "K212S", name: { zh: "K212S", en: "K212S" }, desc: { zh: "双 12 寸倒相式超低音箱", en: "Dual 12\" inverted subwoofer" }, productLine: "k", series: { zh: "K 系列娱乐音箱", en: "K Entertainment" } },
  { model: "K18S", name: { zh: "K18S", en: "K18S" }, desc: { zh: "单 18 寸倒相式超低音箱", en: "18\" inverted subwoofer" }, productLine: "k", series: { zh: "K 系列娱乐音箱", en: "K Entertainment" } },
  // RE 全频（B 端）
  { model: "RE8", name: { zh: "RE8", en: "RE8" }, desc: { zh: "8 寸两分频全频音箱", en: "8\" two-way full-range speaker" }, productLine: "re", series: { zh: "RE 全频音箱", en: "RE Full-Range" } },
  { model: "RE10", name: { zh: "RE10", en: "RE10" }, desc: { zh: "10 寸两分频全频音箱", en: "10\" two-way full-range speaker" }, productLine: "re", series: { zh: "RE 全频音箱", en: "RE Full-Range" } },
  { model: "RE12", name: { zh: "RE12", en: "RE12" }, desc: { zh: "12 寸两分频全频音箱", en: "12\" two-way full-range speaker" }, productLine: "re", series: { zh: "RE 全频音箱", en: "RE Full-Range" } },
  { model: "RE15", name: { zh: "RE15", en: "RE15" }, desc: { zh: "15 寸两分频全频音箱", en: "15\" two-way full-range speaker" }, productLine: "re", series: { zh: "RE 全频音箱", en: "RE Full-Range" } },
  // 流动演出（C 端）
  { model: "V12", name: { zh: "V12", en: "V12" }, desc: { zh: "单 12 寸线阵列音箱，搭配 V18", en: "Single 12\" line array, pairs with V18" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "V18", name: { zh: "V18", en: "V18" }, desc: { zh: "单 18 寸线阵列超低音箱", en: "Single 18\" line array subwoofer" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "V212", name: { zh: "V212", en: "V212" }, desc: { zh: "三频线阵列音箱，搭配 V221S", en: "3-way line array, pairs with V221S" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "V221S", name: { zh: "V221S", en: "V221S" }, desc: { zh: "双 21 寸线阵列超低音箱", en: "Dual 21\" line array subwoofer" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "VIT", name: { zh: "VIT 系统", en: "VIT System" }, desc: { zh: "V12×8 + V18×6 + V415A×2 标准配置", en: "V12×8 + V18×6 + V415A×2 standard kit" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "206M", name: { zh: "206M", en: "206M" }, desc: { zh: "舞台返听音箱", en: "Stage monitor speaker" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "15N", name: { zh: "15N", en: "15N" }, desc: { zh: "流动演出全频音箱", en: "Touring full-range speaker" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "Solo C", name: { zh: "Solo C", en: "Solo C" }, desc: { zh: "演出现场控台监听音箱", en: "FOH console monitor speaker" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "V4", name: { zh: "V4 音柱", en: "V4 Column" }, desc: { zh: "有源音柱系统", en: "Powered column system" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  { model: "V4SA", name: { zh: "V4SA 超低", en: "V4SA Sub" }, desc: { zh: "有源音柱超低模块", en: "Powered column sub module" }, productLine: "tour", series: { zh: "流动演出系统", en: "Touring Systems" } },
  // 电子产品（C 端）
  { model: "V415A", name: { zh: "V415A", en: "V415A" }, desc: { zh: "4 通道 DSP 功放机柜", en: "4-channel DSP amplifier rack" }, productLine: "electronics", series: { zh: "电子产品", en: "Electronics" } },
  { model: "V225A", name: { zh: "V225A", en: "V225A" }, desc: { zh: "2 通道 DSP 功放", en: "2-channel DSP amplifier" }, productLine: "electronics", series: { zh: "电子产品", en: "Electronics" } },
  { model: "Unit48", name: { zh: "Unit48", en: "Unit48" }, desc: { zh: "音频处理器 / 音箱管理器", en: "Audio processor / loudspeaker manager" }, productLine: "unit48", series: { zh: "unit48 系列", en: "unit48 Series" } },
  // 软件
  { model: "dBcover", name: { zh: "dBcover", en: "dBcover" }, desc: { zh: "声学模拟与系统设计软件", en: "Acoustic simulation & design software" }, productLine: "suite", series: { zh: "dBcover 软件", en: "dBcover Software" } },
];

export function buildRealProductCatalog(): Product[] {
  return CATALOG_ENTRIES.map((entry, i) => {
    const meta = SERIES_META[entry.productLine];
    const img = PRODUCT_IMAGES[i % PRODUCT_IMAGES.length];
    const specSheet = getSpecSheet(entry.model);
    return {
      id: i + 1,
      name: entry.name,
      model: entry.model,
      desc: entry.desc,
      detail: entry.desc,
      specs: specSheet?.summary ?? SERIES_SPEC_SUMMARY[entry.productLine],
      image: img,
      gallery: [img, PRODUCT_IMAGES[(i + 1) % PRODUCT_IMAGES.length]],
      series: entry.series,
      productLine: entry.productLine,
      seriesGroup: meta.seriesGroup,
      category: meta.category,
    };
  });
}

/** 各子系列首个产品 ID（导航定位用） */
export function getFeaturedProductIdByLine(line: ProductLineSlug): number {
  const product = buildRealProductCatalog().find((p) => p.productLine === line);
  return product?.id ?? 1;
}
