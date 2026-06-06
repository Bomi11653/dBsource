import { buildRealProductCatalog } from "./product-catalog";

export type Locale = "zh" | "en";

/** 系列 Tab：音箱系统 / DSP / 软件 / 工程方案 */
export type ProductSeriesGroup = "speaker" | "dsp" | "software" | "engineering";

/** 分类筛选：音箱 / DSP / 软件 */
export type ProductCategory = "speaker" | "dsp" | "software";

export type ProductLineSlug =
  | "la"
  | "lw"
  | "mi"
  | "do"
  | "sol"
  | "k"
  | "re"
  | "p"
  | "driver"
  | "electronics"
  | "accessory"
  | "tour"
  | "unit48"
  | "suite"
  | "turnkey";

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
  productLine: ProductLineSlug;
  seriesGroup: ProductSeriesGroup;
  category: ProductCategory;
}


export type CaseType = "engineering" | "performance";

export type CaseSceneSlug =
  | "stadium"
  | "festival"
  | "livehouse"
  | "convention"
  | "corporate"
  | "auditorium";

export interface CaseItem {
  id: number;
  type: CaseType;
  sceneSlug: CaseSceneSlug;
  title: { zh: string; en: string };
  desc: { zh: string; en: string };
  detail?: { zh: string; en: string };
  scene: { zh: string; en: string };
  products: string;
  image: string;
  gallery?: string[];
  highlights?: { zh: string[]; en: string[] };
}

export type DownloadSubSlug =
  | "v225a"
  | "dbcover-mac"
  | "dbcover-win"
  | "unit48"
  | "soloc"
  | "preset-pack"
  | "sol12sa"
  | "v415a"
  | "catalog-cn"
  | "catalog-en"
  | "case-study";

export interface DownloadItem {
  id: number;
  name: { zh: string; en: string };
  size: string;
  url: string;
  type: "software" | "catalog";
  subCategory: DownloadSubSlug;
  cover: string;
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

/** 画册真实型号目录（B 端 + C 端） */
export const products: Product[] = buildRealProductCatalog();

export const PRODUCTS_PAGE_SIZE = 20;

export const cases: CaseItem[] = [
  {
    id: 1,
    type: "engineering",
    sceneSlug: "livehouse",
    title: { zh: "AK Live House", en: "AK Live House" },
    desc: {
      zh: "万江 AK Live House，dBsource 音响系统稳定运营一周年",
      en: "Wanjiang AK Live House — one year of reliable dBsource sound",
    },
    detail: {
      zh: "万江 AK Live House 采用 dBsource 专业音响系统，自投入使用以来已稳定经营一年。系统覆盖主扩、超低与舞台监听需求，满足日常演出与活动混音，成为东莞万江地区具有代表性的 Live House 声场案例。",
      en: "Wanjiang AK Live House runs on dBsource professional audio and has operated reliably for one year, covering mains, subs and stage monitoring for daily shows and events.",
    },
    scene: { zh: "Live House", en: "Live House" },
    products: "dBsource 全系统",
    image: "/images/case-1.svg",
    gallery: ["/images/case-1.svg", "/images/scene-3.svg", "/images/product-3.svg"],
    highlights: {
      zh: ["稳定运营一年", "万江 Live House", "dBsource 全系统"],
      en: ["One year operation", "Wanjiang venue", "Full dBsource system"],
    },
  },
  {
    id: 2,
    type: "engineering",
    sceneSlug: "livehouse",
    title: { zh: "梅州 YoYo Music", en: "Meizhou YoYo Music" },
    desc: {
      zh: "DO 系列主扩 + 多路乐队输入，精宏音响科技交付",
      en: "DO-series PA with full band I/O — Jinghong AV integration",
    },
    detail: {
      zh: "工程案例：梅州 YoYo Music。音响配置：dBsource DO115 × 16、D0118S × 8、D0218S × 2。乐队配置：鼓麦 11 只、bass 1 路、吉他 2 路、键盘 6 路、伴唱 3 路、歌手 6 路、Cue 麦 5 路。在此再次感谢广东精宏音响科技有限公司的支持与协作。",
      en: "Meizhou YoYo Music: dBsource DO115 ×16, D0118S ×8, D0218S ×2. Band I/O includes 11 drum mics, bass, guitars, keys, BVs, vocals and cue mixes. Delivered with Guangdong Jinghong Audio Technology.",
    },
    scene: { zh: "演艺空间", en: "Music Venue" },
    products: "DO115 ×16, D0118S ×8, D0218S ×2",
    image: "/images/case-2.svg",
    gallery: ["/images/case-2.svg", "/images/scene-1.svg", "/images/product-4.svg"],
    highlights: {
      zh: ["DO115 ×16", "34 路乐队输入", "精宏音响科技"],
      en: ["DO115 ×16", "34-channel band I/O", "Jinghong AV"],
    },
  },
  {
    id: 3,
    type: "performance",
    sceneSlug: "auditorium",
    title: {
      zh: "乐山师范学院 2025 年迎新晚会",
      en: "Leshan Normal University Welcome Gala 2025",
    },
    desc: {
      zh: "VIT 音响系统护航全校迎新文艺晚会",
      en: "VIT sound system for the university welcome gala",
    },
    detail: {
      zh: "乐山师范学院 2025 年迎新晚会采用 VIT 音响系统，为全校师生呈现高清晰度、高动态的现场听感。系统覆盖礼堂主扩声与舞台监听，满足合唱、舞蹈、器乐等多元节目形式。",
      en: "Leshan Normal University's 2025 welcome gala used a VIT sound system for clear, dynamic coverage across choral, dance and instrumental programs.",
    },
    scene: { zh: "校园礼堂", en: "Campus Auditorium" },
    products: "VIT 音响系统",
    image: "/images/case-3.svg",
    gallery: ["/images/case-3.svg", "/images/scene-2.svg", "/images/product-1.svg"],
    highlights: {
      zh: ["全校迎新晚会", "VIT 系统", "多节目形式覆盖"],
      en: ["Campus welcome gala", "VIT system", "Multi-format shows"],
    },
  },
  {
    id: 4,
    type: "engineering",
    sceneSlug: "corporate",
    title: { zh: "乌兰浩特 城市声场", en: "Ulanhot Urban Soundscape" },
    desc: {
      zh: "城市公共声场扩声系统工程交付",
      en: "Urban public sound field engineering project",
    },
    detail: {
      zh: "乌兰浩特城市声场项目采用 dBsource 专业音响系统，为城市公共声场空间提供稳定、均匀、清晰的扩声覆盖，满足日常广播与大型活动需求。",
      en: "The Ulanhot urban soundscape project deploys dBsource systems for stable, even PA coverage across public spaces and events.",
    },
    scene: { zh: "城市声场", en: "Urban PA" },
    products: "dBsource 扩声系统",
    image: "/images/case-1.svg",
    gallery: ["/images/case-1.svg", "/images/scene-2.svg"],
    highlights: {
      zh: ["城市公共声场", "均匀覆盖", "大型活动支持"],
      en: ["Urban sound field", "Even coverage", "Event-ready"],
    },
  },
  {
    id: 5,
    type: "performance",
    sceneSlug: "festival",
    title: { zh: "贵州大方彝族新年晚会", en: "Guizhou Dafang Yi New Year Gala" },
    desc: {
      zh: "奢香故里庆彝年，58 只 dBsource 音箱打造精准声场",
      en: "58 dBsource loudspeakers for the Yi New Year celebration",
    },
    detail: {
      zh: "2025 年贵州「彝族新年」晚会在大方隆重举行，活动以「奢香故里庆彝年·民族团结谱新篇」为主题，展现彝族文化的独特魅力。精彩纷呈的文艺演出在灯光秀中拉开帷幕；现场旋律优美，舞姿翩跹，由 dBsource 音响系统带来的精准声场还原，更让每首乐曲都焕发出最动人的光彩，将这场彝族新年晚会的魅力推向极致。\n\n本场晚会采用 dBsource V12 线阵列音箱 16 只，V18/V21 超低频箱 16 只，206M 返听音箱 12 只，DO 系列辅助音箱 12 只及监听音箱等共计 58 只；整个系统角度精准、能量集中，完美覆盖整个晚会现场。无论是细腻的民谣吟唱，还是炸裂的电子节奏，这套系统都能精准还原每一刻的乐感，让每位观众都能感受到最真实的音乐感受。",
      en: "The 2025 Yi New Year gala in Dafang, Guizhou featured 58 dBsource loudspeakers — V12 line arrays, V18/V21 subs, 206M monitors and DO fills — delivering precise coverage from folk ballads to electronic peaks.",
    },
    scene: { zh: "民族晚会", en: "Cultural Gala" },
    products: "V12 ×16, V18/V21 ×16, 206M ×12, DO ×12 等共 58 只",
    image: "/images/case-2.svg",
    gallery: ["/images/case-2.svg", "/images/scene-1.svg", "/images/scene-3.svg"],
    highlights: {
      zh: ["58 只音箱", "V12 线阵列", "彝族新年晚会"],
      en: ["58 loudspeakers", "V12 line array", "Yi New Year gala"],
    },
  },
  {
    id: 6,
    type: "performance",
    sceneSlug: "festival",
    title: {
      zh: "贵州大方第一中学百年校庆",
      en: "Dafang No.1 Middle School Centenary Gala",
    },
    desc: {
      zh: "百年校庆文艺晚会，68 只 dBsource 系统覆盖全校师生",
      en: "Centenary gala with 68 dBsource loudspeakers on campus",
    },
    detail: {
      zh: "贵州大方第一中学建校 100 周年文艺晚会在新校区隆重举行，灯光璀璨，人头攒动，欢声盈耳，几千名师生及历届校友代表欢聚一堂，共同回顾百年峥嵘，启航崭新征程。晚会华章在掌声中开启，当《长大后我就成了你》旋律响起，许多两鬓斑白的校友情不自禁轻声跟唱，手中摇曳的点点星光，汇成一片温暖的星海，将深厚的师生情谊渲染到极致。校歌《翰墨飘香》的旋律响彻云霄，全体师生校友齐声高唱，激昂的歌声在夜空中久久回荡。\n\n本场晚会采用 dBsource V12 线阵列音箱 16 只，V18/V21 超低频箱 16 只，206M 返听音箱 12 只，LA 系列辅助音箱及监听音箱等共计 68 只；整个系统角度精准、能量集中，完美覆盖整个晚会现场。无论是细腻的民谣吟唱，还是劲爆的摇滚乐表演，这套系统都能精准还原每一刻的乐感，让每位师生都能感受到最真实的音乐感受。",
      en: "Dafang No.1 Middle School's centenary gala welcomed thousands of students and alumni with 68 dBsource boxes — V12 arrays, V18/V21 subs, 206M monitors and LA fills — covering folk and rock performances with precision.",
    },
    scene: { zh: "百年校庆", en: "Centenary" },
    products: "V12 ×16, V18/V21 ×16, 206M ×12, LA 系列等共 68 只",
    image: "/images/cases/home-dafang.png",
    gallery: ["/images/cases/home-dafang.png", "/images/scene-2.svg", "/images/product-2.svg"],
    highlights: {
      zh: ["建校 100 周年", "68 只音箱", "全校师生覆盖"],
      en: ["100th anniversary", "68 loudspeakers", "Full campus coverage"],
    },
  },
];

export const downloads: DownloadItem[] = [
  {
    id: 1,
    name: { zh: "V225A", en: "V225A" },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "v225a",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 2,
    name: { zh: "dBcover 0.0.15 Mac", en: "dBcover 0.0.15 Mac" },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "dbcover-mac",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 3,
    name: { zh: "dBcover 0.0.15 Win10-11", en: "dBcover 0.0.15 Win10-11" },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "dbcover-win",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 4,
    name: {
      zh: "Unit48-1.11 软件 + 升级包（2026-5-18）",
      en: "Unit48-1.11 Software + Update (2026-5-18)",
    },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "unit48",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 5,
    name: { zh: "SOLOC（新版）", en: "SOLOC (New Edition)" },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "soloc",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 6,
    name: { zh: "V415A / V225A 预设包", en: "V415A / V225A Preset Pack" },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "preset-pack",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 7,
    name: { zh: "SOL12SA", en: "SOL12SA" },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "sol12sa",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 8,
    name: { zh: "V415A 功放软件", en: "V415A Amplifier Software" },
    size: "—",
    url: "#",
    type: "software",
    subCategory: "v415a",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 9,
    name: { zh: "2024 产品画册（中文）", en: "2024 Product Catalog (CN)" },
    size: "24 MB",
    url: "#",
    type: "catalog",
    subCategory: "catalog-cn",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 10,
    name: { zh: "2024 Product Catalog (EN)", en: "2024 Product Catalog (EN)" },
    size: "22 MB",
    url: "#",
    type: "catalog",
    subCategory: "catalog-en",
    cover: "/images/downloads/cover-unit48.png",
  },
  {
    id: 11,
    name: { zh: "工程案例集", en: "Case Study Portfolio" },
    size: "18 MB",
    url: "#",
    type: "catalog",
    subCategory: "case-study",
    cover: "/images/downloads/cover-unit48.png",
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
    image: "/images/scenes/scene-1.png",
  },
  {
    id: 2,
    name: { zh: "体育场馆", en: "Stadiums" },
    desc: {
      zh: "远投、语言清晰度与紧急广播一体化",
      en: "Long-throw, speech intelligibility & PA integration",
    },
    image: "/images/scenes/scene-2.png",
  },
  {
    id: 3,
    name: { zh: "会议 / 礼堂", en: "Conference & Auditorium" },
    desc: {
      zh: "优雅外观与可靠语音还原",
      en: "Elegant design with reliable speech reproduction",
    },
    image: "/images/scenes/scene-3.png",
  },
];

export const qrCodes: QRItem[] = [
  {
    id: 1,
    label: { zh: "微信服务号", en: "WeChat Service" },
    image: "/images/qr/wechat-service.png",
  },
  {
    id: 2,
    label: { zh: "抖音", en: "Douyin" },
    image: "/images/qr/douyin.png",
  },
  {
    id: 3,
    label: { zh: "视频号", en: "WeChat Channels" },
    image: "/images/qr/channels.png",
  },
];
