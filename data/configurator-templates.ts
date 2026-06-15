export type ConfiguratorScene =
  | "livehouse"
  | "stadium"
  | "conference"
  | "club"
  | "multipurpose"
  | "outdoor";

export type UsageType =
  | "performance"
  | "meeting"
  | "music-playback"
  | "sports"
  | "government";

export type BudgetTier = "economy" | "standard" | "pro" | "flagship";
export type InstallMethod = "fixed" | "touring" | "flown" | "ground";
export type LowFrequencyNeed = "light" | "standard" | "strong" | "extreme";

export interface ConfiguratorInput {
  scene: ConfiguratorScene;
  areaSqm: number;
  ceilingHeightM: number;
  seats: number;
  usages: UsageType[];
  budget: BudgetTier;
  installMethod: InstallMethod;
  lowFrequency: LowFrequencyNeed;
  hasBand: boolean;
  needsExpansion: boolean;
}

export interface BomLine {
  model: string;
  qty: number;
  role: { zh: string; en: string };
  note?: { zh: string; en: string };
}

export interface ConfiguratorResult {
  scene: ConfiguratorScene;
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  matchScore: number;
  complexity: { zh: string; en: string };
  applicableArea: { zh: string; en: string };
  mainsCount: number;
  subCount: number;
  fillCount: number;
  monitorCount: number;
  dspSuggestion: { zh: string; en: string };
  ampSuggestion: { zh: string; en: string };
  lines: BomLine[];
  caseIds: number[];
  contactQuery: string;
  needsConsult: boolean;
}

export type ConfiguratorAiAnalysis = {
  summary: string;
  professionalReason: string;
  acousticDesign: string;
  installationNotes: string[];
  riskWarnings: string[];
  salesFollowUp: string;
  engineerReviewRequired: boolean;
};

export const SCENE_META: Record<
  ConfiguratorScene,
  { title: { zh: string; en: string }; desc: { zh: string; en: string } }
> = {
  livehouse: {
    title: { zh: "Live House", en: "Live House" },
    desc: {
      zh: "中小型演艺空间，兼顾主扩冲击力与返听清晰度",
      en: "Live venue with balanced impact and monitor clarity",
    },
  },
  stadium: {
    title: { zh: "体育馆 / 大型场馆", en: "Stadium / Large Venue" },
    desc: {
      zh: "高覆盖、大声压、分区延时和系统冗余优先",
      en: "Large coverage with zoning, delay and redundancy",
    },
  },
  conference: {
    title: { zh: "会议 / 礼堂", en: "Conference / Auditorium" },
    desc: {
      zh: "语言清晰度优先，兼顾背景音乐与活动扩声",
      en: "Speech-first system for conference and events",
    },
  },
  club: {
    title: { zh: "酒吧 / CLUB", en: "Bar / CLUB" },
    desc: {
      zh: "强化低频和近场均匀度，适配高能音乐场景",
      en: "Bass-forward design for high-energy music",
    },
  },
  multipurpose: {
    title: { zh: "多功能厅", en: "Multi-purpose Hall" },
    desc: {
      zh: "兼容演出、会议、活动，重视扩展与切换效率",
      en: "Flexible system for mixed-use operation",
    },
  },
  outdoor: {
    title: { zh: "户外演出", en: "Outdoor Performance" },
    desc: {
      zh: "远投射与抗风噪优先，适合临时舞台系统",
      en: "Long throw outdoor system for temporary stages",
    },
  },
};
