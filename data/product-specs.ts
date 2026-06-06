import type { Locale } from "./mock";

export type SpecRow = {
  label: { zh: string; en: string };
  value: { zh: string; en: string };
};

export type ProductSpecSheet = {
  model: string;
  summary: { zh: string; en: string };
  rows: SpecRow[];
};

const row = (
  zhLabel: string,
  enLabel: string,
  zhValue: string,
  enValue: string
): SpecRow => ({
  label: { zh: zhLabel, en: enLabel },
  value: { zh: zhValue, en: enValue },
});

/** 说明书参数（C 端 + B 端画册）— 全站统一数据源 */
export const PRODUCT_SPEC_SHEETS: Record<string, ProductSpecSheet> = {
  LA206: {
    model: "LA206",
    summary: { zh: "85Hz–20kHz | 250W/1000W | 120dB | 16Ω", en: "85Hz–20kHz | 250W/1000W | 120dB | 16Ω" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "85Hz–20kHz", "85Hz–20kHz"),
      row("高音单元", "HF Driver", "1×1\"/1.7\" 音圈", "1×1\"/1.7\" voice coil"),
      row("低音单元", "LF Driver", "2×6.5\"/2\" 音圈", "2×6.5\"/2\" voice coil"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "250W / 1000W", "250W / 1000W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "96dB", "96dB"),
      row("最大声压级", "Max SPL", "120dB（峰值 126dB）", "120dB (126dB peak)"),
      row("标称阻抗", "Nominal Impedance", "16Ω", "16Ω"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×10°(V)", "90°(H)×10°(V)"),
      row("声学分频点", "Crossover", "1.9kHz", "1.9kHz"),
      row("净重", "Net Weight", "15kg/只", "15kg/pc"),
    ],
  },
  LA208: {
    model: "LA208",
    summary: { zh: "80Hz–20kHz | 300W/1200W | 123dB | 8Ω", en: "80Hz–20kHz | 300W/1200W | 123dB | 8Ω" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "80Hz–20kHz", "80Hz–20kHz"),
      row("高音单元", "HF Driver", "1×1.4\"/3\" 音圈", "1×1.4\"/3\" voice coil"),
      row("低音单元", "LF Driver", "2×8\"/2\" 音圈", "2×8\"/2\" voice coil"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "300W / 1200W", "300W / 1200W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "98dB", "98dB"),
      row("最大声压级", "Max SPL", "123dB（峰值 129dB）", "123dB (129dB peak)"),
      row("标称阻抗", "Nominal Impedance", "8Ω", "8Ω"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×10°(V)", "90°(H)×10°(V)"),
      row("声学分频点", "Crossover", "1.5kHz", "1.5kHz"),
      row("净重", "Net Weight", "27kg/只", "27kg/pc"),
    ],
  },
  LA212: {
    model: "LA212",
    summary: { zh: "50Hz–20kHz | 800W/3200W | 130dB | 8Ω", en: "50Hz–20kHz | 800W/3200W | 130dB | 8Ω" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "50Hz–20kHz", "50Hz–20kHz"),
      row("高音单元", "HF Driver", "2×1.4\"/3\" 音圈", "2×1.4\"/3\" voice coil"),
      row("低音单元", "LF Driver", "2×12\"/3\" 音圈", "2×12\"/3\" voice coil"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "800W / 3200W", "800W / 3200W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "101dB", "101dB"),
      row("最大声压级", "Max SPL", "130dB（峰值 136dB）", "130dB (136dB peak)"),
      row("标称阻抗", "Nominal Impedance", "8Ω", "8Ω"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×10°(V)", "90°(H)×10°(V)"),
      row("声学分频点", "Crossover", "1.3kHz", "1.3kHz"),
      row("净重", "Net Weight", "43.5kg/只", "43.5kg/pc"),
    ],
  },
  LW208: {
    model: "LW208",
    summary: { zh: "75Hz–20kHz | 150W/600W | IP66", en: "75Hz–20kHz | 150W/600W | IP66" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "75Hz–20kHz", "75Hz–20kHz"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "150W / 600W", "150W / 600W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "96dB", "96dB"),
      row("最大声压级", "Max SPL", "118dB（峰值 124dB）", "118dB (124dB peak)"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "80°(H)×80°(V)", "80°(H)×80°(V)"),
      row("防护等级", "IP Rating", "IP66", "IP66"),
      row("净重", "Net Weight", "10kg/只", "10kg/pc"),
    ],
  },
  MI12: {
    model: "MI12",
    summary: { zh: "70Hz–20kHz | 300W/1200W | 122dB", en: "70Hz–20kHz | 300W/1200W | 122dB" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "70Hz–20kHz", "70Hz–20kHz"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "300W / 1200W", "300W / 1200W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "97dB", "97dB"),
      row("最大声压级", "Max SPL", "122dB（峰值 128dB）", "122dB (128dB peak)"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×40°(V)", "90°(H)×40°(V)"),
      row("净重", "Net Weight", "18kg/只", "18kg/pc"),
    ],
  },
  DO112: {
    model: "DO112",
    summary: { zh: "60Hz–20kHz | 300W/1200W | 122dB", en: "60Hz–20kHz | 300W/1200W | 122dB" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "60Hz–20kHz", "60Hz–20kHz"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "300W / 1200W", "300W / 1200W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "97dB", "97dB"),
      row("最大声压级", "Max SPL", "122dB（峰值 128dB）", "122dB (128dB peak)"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×60°(V)", "90°(H)×60°(V)"),
      row("净重", "Net Weight", "22kg/只", "22kg/pc"),
    ],
  },
  SOL403: {
    model: "SOL403",
    summary: { zh: "120Hz–20kHz | 80W/320W | IP66", en: "120Hz–20kHz | 80W/320W | IP66" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "120Hz–20kHz", "120Hz–20kHz"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "80W / 320W", "80W / 320W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "91dB", "91dB"),
      row("最大声压级", "Max SPL", "110dB（峰值 116dB）", "110dB (116dB peak)"),
      row("防护等级", "IP Rating", "IP66", "IP66"),
      row("净重", "Net Weight", "5.5kg/只", "5.5kg/pc"),
    ],
  },
  V12: {
    model: "V12",
    summary: { zh: "60Hz–18kHz | 400W/1600W | IP65 | 搭配 V18", en: "60Hz–18kHz | 400W/1600W | IP65 | with V18" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "LF 60–900Hz；HF 900Hz–18kHz", "LF 60–900Hz; HF 900Hz–18kHz"),
      row("高音单元", "HF Driver", "2×75mm 钕磁压缩高音", "2×75mm neodymium compression HF"),
      row("低音单元", "LF Driver", "1×12\" 75mm 音圈", "1×12\" 75mm voice coil"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "LF 400W/1600W；HF 220W/880W", "LF 400W/1600W; HF 220W/880W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "LF 100dB；HF 115dB", "LF 100dB; HF 115dB"),
      row("最大声压级", "Max SPL", "LF 126dB(132dB)；HF 138dB(144dB)", "LF 126dB(132dB); HF 138dB(144dB)"),
      row("标称阻抗", "Nominal Impedance", "16Ω", "16Ω"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×10°(V)", "90°(H)×10°(V)"),
      row("防护等级", "IP Rating", "IP65", "IP65"),
      row("净重", "Net Weight", "28kg/只", "28kg/pc"),
    ],
  },
  V18: {
    model: "V18",
    summary: { zh: "32–300Hz | 600W/2400W | IP65", en: "32–300Hz | 600W/2400W | IP65" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "32–300Hz", "32–300Hz"),
      row("低音单元", "LF Driver", "1×18\" 100mm 音圈", "1×18\" 100mm voice coil"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "600W / 2400W", "600W / 2400W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "99dB", "99dB"),
      row("最大声压级", "Max SPL", "126dB（峰值 132dB）", "126dB (132dB peak)"),
      row("标称阻抗", "Nominal Impedance", "8Ω", "8Ω"),
      row("防护等级", "IP Rating", "IP65", "IP65"),
      row("净重", "Net Weight", "28kg/只", "28kg/pc"),
    ],
  },
  V212: {
    model: "V212",
    summary: { zh: "60Hz–18kHz | 三频线阵 | 搭配 V221S", en: "60Hz–18kHz | 3-way line array | with V221S" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "LF 60–250Hz；MF 250–1kHz；HF 1–18kHz", "LF 60–250Hz; MF 250–1kHz; HF 1–18kHz"),
      row("高音单元", "HF Driver", "2×75mm 钕磁压缩高音", "2×75mm neodymium compression HF"),
      row("中音单元", "MF Driver", "2×8\" 65mm 音圈钕磁", "2×8\" 65mm neodymium MF"),
      row("低音单元", "LF Driver", "2×12\" 75mm 音圈钕磁", "2×12\" 75mm neodymium LF"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "HF 220W/880W；MF 400W/1600W；LF 400W×2/1600W×2", "HF 220W/880W; MF 400W/1600W; LF 400W×2/1600W×2"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "HF 115dB；MF 107dB；LF 103dB", "HF 115dB; MF 107dB; LF 103dB"),
      row("最大声压级", "Max SPL", "HF 138dB(144dB)；MF 133dB(139dB)；LF 129dB(135dB)", "HF 138dB(144dB); MF 133dB(139dB); LF 129dB(135dB)"),
      row("标称阻抗", "Nominal Impedance", "16Ω", "16Ω"),
      row("声学分频点", "Crossover", "250Hz；1kHz", "250Hz; 1kHz"),
      row("净重", "Net Weight", "68kg/只", "68kg/pc"),
    ],
  },
  V221S: {
    model: "V221S",
    summary: { zh: "25–150Hz | 1600W/6400W | IP65", en: "25–150Hz | 1600W/6400W | IP65" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "25–150Hz", "25–150Hz"),
      row("低音单元", "LF Driver", "2×21\" 115mm 音圈钕磁", "2×21\" 115mm neodymium LF"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "1600W / 6400W", "1600W / 6400W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "103dB", "103dB"),
      row("最大声压级", "Max SPL", "135dB（峰值 141dB）", "135dB (141dB peak)"),
      row("标称阻抗", "Nominal Impedance", "4Ω", "4Ω"),
      row("防护等级", "IP Rating", "IP65", "IP65"),
      row("净重", "Net Weight", "95kg/只", "95kg/pc"),
    ],
  },
  VIT: {
    model: "VIT",
    summary: { zh: "V12×8 + V18×6 + V415A×2 标准配置", en: "V12×8 + V18×6 + V415A×2 standard kit" },
    rows: [
      row("线阵列音箱", "Line Array", "V12 × 8 只", "V12 × 8"),
      row("超低音箱", "Subwoofers", "V18 × 6 只", "V18 × 6"),
      row("功放机柜", "Amplifier Rack", "V415A × 2 台", "V415A × 2"),
      row("配套", "Accessories", "线材箱、田字架、轮板车、航空箱等", "Cables, frames, dollies, flight cases, etc."),
      row("系统特点", "System Features", "V12 搭配 V18，IP65 防水，巡演级线阵列", "V12 paired with V18, IP65, tour-grade line array"),
    ],
  },
  V415A: {
    model: "V415A",
    summary: { zh: "4×1500W@8Ω | Dante | DSP", en: "4×1500W@8Ω | Dante | DSP" },
    rows: [
      row("输出功率", "Output Power", "8Ω：4×1500W；4Ω：4×2250W", "8Ω: 4×1500W; 4Ω: 4×2250W"),
      row("频率响应", "Frequency Response", "20Hz–20kHz (+0.3/−0.3dB)", "20Hz–20kHz (+0.3/−0.3dB)"),
      row("DSP", "DSP", "4 进 4 出，支持 VOS 数据粘贴", "4-in 4-out, VOS paste support"),
      row("数字接口", "Digital I/O", "Dante 双网口", "Dante dual RJ45"),
      row("净重", "Net Weight", "10.2kg", "10.2kg"),
    ],
  },
  V225A: {
    model: "V225A",
    summary: { zh: "2×2500W@4Ω | Dante | DSP", en: "2×2500W@4Ω | Dante | DSP" },
    rows: [
      row("输出功率", "Output Power", "4Ω 立体声：2×2500W", "4Ω stereo: 2×2500W"),
      row("频率响应", "Frequency Response", "20Hz–20kHz (+0.3/−0.3dB)", "20Hz–20kHz (+0.3/−0.3dB)"),
      row("DSP", "DSP", "2 进 2 出，支持 VOS 数据粘贴", "2-in 2-out, VOS paste support"),
      row("净重", "Net Weight", "8.2kg", "8.2kg"),
    ],
  },
  K12: {
    model: "K12",
    summary: { zh: "45Hz–20kHz | 300W/1200W | 122dB", en: "45Hz–20kHz | 300W/1200W | 122dB" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "45Hz–20kHz", "45Hz–20kHz"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "300W / 1200W", "300W / 1200W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "97dB", "97dB"),
      row("最大声压级", "Max SPL", "122dB（峰值 128dB）", "122dB (128dB peak)"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×60°(V)", "90°(H)×60°(V)"),
      row("净重", "Net Weight", "22kg/只", "22kg/pc"),
    ],
  },
  RE12: {
    model: "RE12",
    summary: { zh: "45Hz–20kHz | 250W/1000W | 120dB", en: "45Hz–20kHz | 250W/1000W | 120dB" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "45Hz–20kHz", "45Hz–20kHz"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "250W / 1000W", "250W / 1000W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "97dB", "97dB"),
      row("最大声压级", "Max SPL", "120dB（峰值 126dB）", "120dB (126dB peak)"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "90°(H)×60°(V)", "90°(H)×60°(V)"),
      row("净重", "Net Weight", "15kg/只", "15kg/pc"),
    ],
  },
  "206M": {
    model: "206M",
    summary: { zh: "90Hz–20kHz | 280W/1120W | 116dB", en: "90Hz–20kHz | 280W/1120W | 116dB" },
    rows: [
      row("频率响应(-10dB)", "Frequency Response (-10dB)", "90Hz–20kHz", "90Hz–20kHz"),
      row("功率(额定/峰值)", "Power (RMS/Peak)", "280W / 1120W", "280W / 1120W"),
      row("灵敏度(1W/1m)", "Sensitivity (1W/1m)", "92dB", "92dB"),
      row("最大声压级", "Max SPL", "116dB（峰值 122dB）", "116dB (122dB peak)"),
      row("覆盖角(-6dB)", "Dispersion (-6dB)", "60°(H)×120°(V)", "60°(H)×120°(V)"),
      row("净重", "Net Weight", "7kg/只", "7kg/pc"),
    ],
  },
};

/** 各产品子系列在列表/卡片上显示的统一摘要 */
export const SERIES_SPEC_SUMMARY: Record<string, { zh: string; en: string }> = {
  la: PRODUCT_SPEC_SHEETS.LA212.summary,
  lw: PRODUCT_SPEC_SHEETS.LW208.summary,
  mi: PRODUCT_SPEC_SHEETS.MI12.summary,
  do: PRODUCT_SPEC_SHEETS.DO112.summary,
  sol: PRODUCT_SPEC_SHEETS.SOL403.summary,
  k: { zh: "45Hz–20kHz | 300W/1200W | 娱乐扩声", en: "45Hz–20kHz | 300W/1200W | entertainment PA" },
  re: { zh: "45Hz–20kHz | 250W/1000W | 会议全频", en: "45Hz–20kHz | 250W/1000W | conference full-range" },
  p: { zh: "轻量化塑胶箱体", en: "Lightweight plastic enclosure" },
  driver: { zh: "定制喇叭单元", en: "Custom driver units" },
  electronics: PRODUCT_SPEC_SHEETS.V415A.summary,
  accessory: { zh: "全系配套附件", en: "Full-system accessories" },
  tour: PRODUCT_SPEC_SHEETS.V12.summary,
  unit48: { zh: "96kHz | 123dB 动态范围 | Dante", en: "96kHz | 123dB dynamic range | Dante" },
  suite: { zh: "Win / macOS 声学模拟", en: "Win / macOS acoustic simulation" },
  turnkey: { zh: "设计·安装·调试一站式", en: "Design · install · commissioning" },
};

export function getSpecSheet(model: string): ProductSpecSheet | undefined {
  const normalized = model.replace(/\s+/g, "");
  return (
    PRODUCT_SPEC_SHEETS[model] ??
    PRODUCT_SPEC_SHEETS[normalized] ??
    PRODUCT_SPEC_SHEETS[normalized.toUpperCase()] ??
    PRODUCT_SPEC_SHEETS[model.toUpperCase()]
  );
}

export function getSeriesSpecSummary(
  productLine: string
): { zh: string; en: string } | undefined {
  return SERIES_SPEC_SUMMARY[productLine];
}

export function formatSpecRows(sheet: ProductSpecSheet, locale: Locale): string {
  return sheet.rows.map((r) => `${r.label[locale]}: ${r.value[locale]}`).join(" | ");
}

/** 产品子系列 → 详情页展示的代表型号（说明书参数） */
const LINE_REP_MODEL: Record<string, string> = {
  la: "LA212",
  lw: "LW208",
  mi: "MI12",
  do: "DO112",
  sol: "SOL403",
  k: "K12",
  re: "RE12",
  electronics: "V415A",
  tour: "V12",
  unit48: "UNIT48",
};

export function getSpecSheetForProduct(
  product: { model: string; productLine: string }
): ProductSpecSheet | undefined {
  return getSpecSheet(product.model) ?? getSpecSheetForProductLine(product.productLine);
}

/** 系统产品叠页参数（C 端画册） */
const STACKED_SPEC_GROUPS: Record<string, string[]> = {
  V212: ["V212", "V221S"],
  VIT: ["VIT", "V12", "V18", "V415A"],
};

export function getStackedSpecPages(model: string): ProductSpecSheet[] | null {
  const models = STACKED_SPEC_GROUPS[model];
  if (!models) return null;
  const pages = models
    .map((m) => getSpecSheet(m))
    .filter((s): s is ProductSpecSheet => Boolean(s));
  return pages.length ? pages : null;
}

export function getSpecSheetForProductLine(
  productLine: string
): ProductSpecSheet | undefined {
  const model = LINE_REP_MODEL[productLine];
  if (!model) return undefined;
  if (model === "UNIT48") {
    return {
      model: "Unit48",
      summary: SERIES_SPEC_SUMMARY.unit48,
      rows: [
        row("采样率", "Sample Rate", "96kHz", "96kHz"),
        row("动态范围", "Dynamic Range", "> 123dB", "> 123dB"),
        row("底噪", "Noise Floor", "低至 -92dBu", "Down to -92dBu"),
        row("DSP", "DSP", "40-bit 浮点，512 阶 FIR", "40-bit float, 512-tap FIR"),
        row("数字接口", "Digital I/O", "Dante 双网口", "Dante dual RJ45"),
      ],
    };
  }
  return getSpecSheet(model);
}
