import type { Product } from "@/data/mock";
import type {
  BomLine,
  ConfiguratorInput,
  ConfiguratorResult,
  ConfiguratorScene,
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
  switch (input.scene) {
    case "livehouse":
      return recommendLiveHouse(input, products);
    case "stadium":
      return recommendStadium(input, products);
    case "conference":
      return recommendConference(input, products);
  }
}

function recommendLiveHouse(input: ConfiguratorInput, products: Product[]): ConfiguratorResult {
  const area = input.areaSqm ?? 400;
  const band = input.hasBand ?? true;
  const lines: BomLine[] = [];

  if (area < 200) {
    lines.push(line("DO115", 6, { zh: "主扩", en: "Main PA" }));
    lines.push(line("D0118S", 2, { zh: "超低", en: "Sub" }));
    lines.push(line("MI12", 4, { zh: "返听", en: "Monitor" }));
  } else if (area < 500) {
    lines.push(line("DO115", 12, { zh: "主扩", en: "Main PA" }));
    lines.push(line("D0218S", 4, { zh: "超低", en: "Sub" }));
    lines.push(line("MI12", band ? 6 : 4, { zh: "返听", en: "Monitor" }));
  } else {
    const la = findByPrefix(products, "LA");
    lines.push(
      line(la?.model ?? "LA208", 8, { zh: "线阵列主扩", en: "Line array mains" })
    );
    lines.push(line("V221S", 4, { zh: "超低", en: "Sub" }));
    lines.push(line("MI12", 8, { zh: "返听", en: "Monitor" }));
  }

  lines.push(line("Unit48", 1, { zh: "处理器", en: "DSP" }));

  return {
    scene: "livehouse",
    title: { zh: "Live House 推荐方案", en: "Live House Recommendation" },
    summary: {
      zh: `约 ${area}㎡${band ? "、含乐队输入" : ""}，标准演艺扩声配置`,
      en: `~${area} sqm${band ? ", with band I/O" : ""}, standard venue PA`,
    },
    lines,
    caseIds: [1, 2],
    contactQuery: "Live House 选型咨询",
    needsConsult: area > 800,
  };
}

function recommendStadium(input: ConfiguratorInput, products: Product[]): ConfiguratorResult {
  const seats = input.seats ?? 5000;
  const lines: BomLine[] = [];
  const la = findByPrefix(products, "LA");

  if (seats < 3000) {
    lines.push(line(la?.model ?? "LA208", 12, { zh: "线阵列", en: "Line array" }));
    lines.push(line("V221S", 6, { zh: "超低", en: "Sub" }));
    lines.push(line("Unit48", 2, { zh: "处理器", en: "DSP" }));
  } else if (seats < 10000) {
    lines.push(line(la?.model ?? "LA208", 24, { zh: "主阵线阵列", en: "Main arrays" }));
    lines.push(line("V221S", 12, { zh: "超低", en: "Subs" }));
    lines.push(line("LW", 8, { zh: "延时补声", en: "Delay fill" }, {
      zh: "按实际看台选择 LW 系列",
      en: "Select LW series per stands",
    }));
    lines.push(line("Unit48", 4, { zh: "分区处理", en: "Zone DSP" }));
  } else {
    return {
      scene: "stadium",
      title: { zh: "体育馆大型方案", en: "Large Stadium Project" },
      summary: {
        zh: `${seats} 座大型场馆建议由工程团队定制 Turnkey 方案`,
        en: `${seats} seats — turnkey engineering recommended`,
      },
      lines: [
        line("LA", 0, { zh: "线阵列系统", en: "Line array system" }, {
          zh: "需现场勘测后定型号数量",
          en: "Model/qty after site survey",
        }),
      ],
      caseIds: [1],
      contactQuery: `体育馆 ${seats}座 工程方案`,
      needsConsult: true,
    };
  }

  return {
    scene: "stadium",
    title: { zh: "体育馆推荐方案", en: "Stadium Recommendation" },
    summary: {
      zh: `约 ${seats} 座，线阵列 + 超低 + 分区处理`,
      en: `~${seats} seats, line array + subs + zoning`,
    },
    lines,
    caseIds: [1],
    contactQuery: `体育馆 ${seats}座 选型`,
    needsConsult: seats >= 8000,
  };
}

function recommendConference(input: ConfiguratorInput, products: Product[]): ConfiguratorResult {
  const area = input.areaSqm ?? 300;
  const rec = input.needsRecording ?? false;
  const lines: BomLine[] = [];

  if (area < 300) {
    lines.push(line("SOL", 4, { zh: "音柱主扩", en: "Column PA" }));
  } else if (area < 800) {
    lines.push(line("SOL", 8, { zh: "音柱主扩", en: "Column PA" }));
    lines.push(line("RE", 4, { zh: "补声", en: "Fill" }));
  } else {
    lines.push(line("RE", 12, { zh: "全频主扩", en: "Full-range mains" }));
    lines.push(line("SOL", 4, { zh: "侧填", en: "Side fill" }));
  }

  lines.push(line("Unit48", 1, { zh: "处理器", en: "DSP" }));
  if (rec) {
    lines.push(line("MI12", 2, { zh: "录播返听", en: "Recording monitor" }));
  }

  return {
    scene: "conference",
    title: { zh: "会议礼堂推荐方案", en: "Conference Recommendation" },
    summary: {
      zh: `约 ${area}㎡，语言清晰度优先${rec ? "，含录播监听" : ""}`,
      en: `~${area} sqm, speech intelligibility first${rec ? ", with recording feeds" : ""}`,
    },
    lines,
    caseIds: [2, 4],
    contactQuery: `会议礼堂 ${area}㎡ 选型`,
    needsConsult: area > 1000,
  };
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
