export type Locale = "zh" | "en";

/** 系列 Tab：音箱系统 / DSP / 软件 / 工程方案 */
export type ProductSeriesGroup = "speaker" | "dsp" | "software" | "engineering";

/** 分类筛选：音箱 / DSP / 软件 */
export type ProductCategory = "speaker" | "dsp" | "software";

export interface Product {
  id: number;
  name: { zh: string; en: string };
  model: string;
  desc: { zh: string; en: string };
  detail?: { zh: string; en: string };
  specs?: { zh: string; en: string };
  image: string;
  gallery?: string[];
  series?: { zh: string; en: string };
  seriesGroup: ProductSeriesGroup;
  category: ProductCategory;
}

const PRODUCT_IMAGES = [
  "/images/product-1.svg",
  "/images/product-2.svg",
  "/images/product-3.svg",
  "/images/product-4.svg",
];

const SERIES_CATALOG: Omit<Product, "id">[] = [
  {
    name: { zh: "线阵列", en: "Line Array" },
    model: "X",
    series: { zh: "Tour 系列", en: "Tour Series" },
    seriesGroup: "speaker",
    category: "speaker",
    desc: {
      zh: "大功率线阵列模块，巡演与固定安装",
      en: "High-power line array module for tour & install",
    },
    detail: {
      zh: "高性能专业线阵列系统，适用于大型演出、体育场馆与商业空间。采用自主研发 DSP 与单元匹配技术，实现低失真、高声压与均匀覆盖。",
      en: "Professional line array for tours, stadiums and commercial venues. In-house DSP and driver matching for low distortion, high SPL and even coverage.",
    },
    specs: { zh: "140dB | IP55", en: "140dB | IP55" },
    image: PRODUCT_IMAGES[0],
  },
  {
    name: { zh: "超低音", en: "Subwoofer" },
    model: "S",
    series: { zh: "低频系列", en: "LF Series" },
    seriesGroup: "speaker",
    category: "speaker",
    desc: {
      zh: "超低频系统，心形/全向可选",
      en: "Sub-low system, cardioid or omnidirectional",
    },
    detail: {
      zh: "Tour 级超低系统，支持心形与全向模式，与线阵列无缝集成，满足万人场地低频控制需求。",
      en: "Tour-grade sub systems with cardioid or omni modes, seamless line-array integration for large venues.",
    },
    specs: { zh: "134dB 峰值", en: "134dB peak" },
    image: PRODUCT_IMAGES[1],
  },
  {
    name: { zh: "返听", en: "Monitor" },
    model: "M",
    series: { zh: "舞台系列", en: "Stage Series" },
    seriesGroup: "speaker",
    category: "speaker",
    desc: {
      zh: "舞台返听，同轴与二分频",
      en: "Stage monitors, coaxial & 2-way",
    },
    detail: {
      zh: "为艺术家与乐队提供高清晰度返听，低反馈、高动态，适配 Live House 至体育馆舞台。",
      en: "High-clarity monitors for artists with low feedback and high dynamics, from clubs to arenas.",
    },
    specs: { zh: "132dB", en: "132dB" },
    image: PRODUCT_IMAGES[2],
  },
  {
    name: { zh: "点声源", en: "Point Source" },
    model: "P",
    series: { zh: "固定安装", en: "Install Series" },
    seriesGroup: "speaker",
    category: "speaker",
    desc: {
      zh: "会议礼堂分布式扩声",
      en: "Distributed sound for conference halls",
    },
    detail: {
      zh: "政企会议与礼堂分布式扩声方案，优雅外观与可靠语音还原，支持 Dante 与集中管理。",
      en: "Distributed speech systems for conference halls with elegant industrial design and Dante networking.",
    },
    specs: { zh: "Dante", en: "Dante" },
    image: PRODUCT_IMAGES[3],
  },
  {
    name: { zh: "功率放大器", en: "Amplifier" },
    model: "A",
    series: { zh: "电子系列", en: "Electronics" },
    seriesGroup: "speaker",
    category: "speaker",
    desc: {
      zh: "四通道智能功放，DSP 内置",
      en: "4-ch smart amp with built-in DSP",
    },
    detail: {
      zh: "四通道智能功放，内置 DSP 与保护电路，适配固定安装与巡演机柜。",
      en: "Four-channel smart amplifiers with built-in DSP and protection for install and tour racks.",
    },
    specs: { zh: "4×2000W", en: "4×2000W" },
    image: PRODUCT_IMAGES[0],
  },
  {
    name: { zh: "数字处理器", en: "DSP Processor" },
    model: "D",
    series: { zh: "unit48 系列", en: "unit48 Series" },
    seriesGroup: "dsp",
    category: "dsp",
    desc: {
      zh: "系统调音与路由，支持 Dante",
      en: "System tuning & routing with Dante",
    },
    detail: {
      zh: "dBsource 自主版权 unit48 处理器，高通道数 FIR 与路由，面向巡演与固定安装系统级调音。",
      en: "dBsource unit48 processors with high-channel FIR and routing for tour and installed systems.",
    },
    specs: { zh: "64×64", en: "64×64" },
    image: PRODUCT_IMAGES[1],
  },
  {
    name: { zh: "dBcover 声学软件", en: "dBcover Acoustic Software" },
    model: "SW",
    series: { zh: "软件系列", en: "Software Suite" },
    seriesGroup: "software",
    category: "software",
    desc: {
      zh: "电脑版声学模拟与系统设计",
      en: "Desktop acoustic simulation & system design",
    },
    detail: {
      zh: "自主开发的 dBcover 声学模拟软件，支持覆盖预测、系统预调与方案导出，服务工程设计与投标。",
      en: "dBcover simulation for coverage prediction, system pre-tuning and proposal export for engineering teams.",
    },
    specs: { zh: "Win / macOS", en: "Win / macOS" },
    image: PRODUCT_IMAGES[2],
  },
  {
    name: { zh: "系统集成方案", en: "System Integration" },
    model: "SI",
    series: { zh: "工程方案", en: "Engineering" },
    seriesGroup: "engineering",
    category: "speaker",
    desc: {
      zh: "从设计、安装到调试的一站式交付",
      en: "Turnkey design, install and commissioning",
    },
    detail: {
      zh: "提供从声学设计、产品配置、现场安装到系统调试的一站式工程服务，覆盖体育场馆、演艺与政企项目。",
      en: "Turnkey services from acoustic design and product spec to on-site install and commissioning.",
    },
    specs: { zh: "48h 调试", en: "48h commissioning" },
    image: PRODUCT_IMAGES[3],
  },
];

function buildProductCatalog(count = 80): Product[] {
  const items: Product[] = [];
  for (let i = 0; i < count; i++) {
    const base = SERIES_CATALOG[i % SERIES_CATALOG.length];
    const variant = Math.floor(i / SERIES_CATALOG.length) + 1;
    const img = PRODUCT_IMAGES[i % PRODUCT_IMAGES.length];
    items.push({
      id: i + 1,
      name: {
        zh: `${base.name.zh} ${base.model}${variant}`,
        en: `${base.name.en} ${base.model}${variant}`,
      },
      model: `${base.model}${variant}-${2020 + (i % 5)}`,
      series: base.series,
      seriesGroup: base.seriesGroup,
      category: base.category,
      desc: base.desc,
      detail: base.detail,
      specs: base.specs,
      image: img,
      gallery: [
        img,
        PRODUCT_IMAGES[(i + 1) % PRODUCT_IMAGES.length],
        PRODUCT_IMAGES[(i + 2) % PRODUCT_IMAGES.length],
      ],
    });
  }
  return items;
}

export interface CaseItem {
  id: number;
  title: { zh: string; en: string };
  desc: { zh: string; en: string };
  scene: { zh: string; en: string };
  products: string;
  image: string;
}

export interface DownloadItem {
  id: number;
  name: { zh: string; en: string };
  size: string;
  url: string;
  type: "software" | "catalog";
}

export interface SceneItem {
  id: number;
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  image: string;
}

export interface QRItem {
  id: number;
  label: { zh: string; en: string };
  image: string;
}

export const contactInfo = {
  company: {
    zh: "东莞新声电子科技有限公司",
    en: "Dongguan Xinsheng Electronics Technology Co., Ltd.",
  },
  phones: ["15362862396", "13713323136"],
  email: "939611016@qq.com",
  address: {
    zh: "广东省东莞市万江街道莫屋新丰西三路1号",
    en: "No.1 Xinfeng West 3rd Rd, Mowu, Wanjiang, Dongguan, Guangdong",
  },
  mapQuery: "广东省东莞市万江街道莫屋新丰西三路1号",
};

/** 80 款产品，支持 4×5 分页（每页 20 条，共 4 页） */
export const products: Product[] = buildProductCatalog(80);

export const PRODUCTS_PAGE_SIZE = 20;

export const cases: CaseItem[] = [
  {
    id: 1,
    title: { zh: "体育场演唱会项目", en: "Stadium Concert Project" },
    desc: {
      zh: "72,000 人户外音乐节，全栈线阵列 + 心形超低系统",
      en: "72,000-capacity outdoor festival with full line array & cardioid subs",
    },
    scene: { zh: "体育场馆", en: "Stadium" },
    products: "X1-2024 × 24, S9-Deep × 12",
    image: "/images/case-1.svg",
  },
  {
    id: 2,
    title: { zh: "城市 Live House", en: "Urban Live House" },
    desc: {
      zh: "360° 舞池覆盖，艺术家定制返听方案",
      en: "360° dance floor coverage with artist-custom monitor mixes",
    },
    scene: { zh: "演艺酒吧", en: "Live House" },
    products: "S9-Deep × 8, M6-Pro × 16",
    image: "/images/case-2.svg",
  },
  {
    id: 3,
    title: { zh: "国际会展中心", en: "Convention Center" },
    desc: {
      zh: "多厅 AV 升级，Dante 组网，按厅型预设 DSP",
      en: "Multi-hall AV upgrade with Dante and per-room DSP presets",
    },
    scene: { zh: "政企会议", en: "Corporate" },
    products: "P4-Compact × 48",
    image: "/images/case-3.svg",
  },
];

export const downloads: DownloadItem[] = [
  {
    id: 1,
    name: { zh: "dBsource 调音软件 v2.4", en: "dBsource Tuning Software v2.4" },
    size: "128 MB",
    url: "#",
    type: "software",
  },
  {
    id: 2,
    name: { zh: "系统配置工具 v1.8", en: "System Config Tool v1.8" },
    size: "86 MB",
    url: "#",
    type: "software",
  },
  {
    id: 3,
    name: { zh: "Dante 路由助手", en: "Dante Routing Assistant" },
    size: "42 MB",
    url: "#",
    type: "software",
  },
  {
    id: 4,
    name: { zh: "2024 产品画册（中文）", en: "2024 Product Catalog (CN)" },
    size: "24 MB",
    url: "#",
    type: "catalog",
  },
  {
    id: 5,
    name: { zh: "2024 Product Catalog (EN)", en: "2024 Product Catalog (EN)" },
    size: "22 MB",
    url: "#",
    type: "catalog",
  },
  {
    id: 6,
    name: { zh: "工程案例集", en: "Case Study Portfolio" },
    size: "18 MB",
    url: "#",
    type: "catalog",
  },
];

export const scenes: SceneItem[] = [
  {
    id: 1,
    name: { zh: "演唱会 / 音乐节", en: "Concerts & Festivals" },
    desc: {
      zh: "Tour 级系统，均匀覆盖万人场地",
      en: "Tour-grade coverage for 10,000+ venues",
    },
    image: "/images/scene-1.svg",
  },
  {
    id: 2,
    name: { zh: "体育场馆", en: "Stadiums" },
    desc: {
      zh: "远投、语言清晰度与紧急广播一体化",
      en: "Long-throw, speech intelligibility & PA integration",
    },
    image: "/images/scene-2.svg",
  },
  {
    id: 3,
    name: { zh: "会议 / 礼堂", en: "Conference & Auditorium" },
    desc: {
      zh: "优雅外观与可靠语音还原",
      en: "Elegant design with reliable speech reproduction",
    },
    image: "/images/scene-3.svg",
  },
];

export const qrCodes: QRItem[] = [
  { id: 1, label: { zh: "微信公众号", en: "WeChat Official" }, image: "/images/qr-wechat.svg" },
  { id: 2, label: { zh: "企业微信", en: "WeCom" }, image: "/images/qr-wecom.svg" },
  { id: 3, label: { zh: "抖音", en: "Douyin" }, image: "/images/qr-douyin.svg" },
  { id: 4, label: { zh: "视频号", en: "Channels" }, image: "/images/qr-video.svg" },
];
