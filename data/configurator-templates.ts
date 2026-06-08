export type ConfiguratorScene = "livehouse" | "stadium" | "conference";

export type BudgetTier = "standard" | "premium";

export interface ConfiguratorInput {
  scene: ConfiguratorScene;
  areaSqm?: number;
  seats?: number;
  hasBand?: boolean;
  needsRecording?: boolean;
  budget: BudgetTier;
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
  lines: BomLine[];
  caseIds: number[];
  contactQuery: string;
  needsConsult: boolean;
}

export const SCENE_META: Record<
  ConfiguratorScene,
  { title: { zh: string; en: string }; desc: { zh: string; en: string } }
> = {
  livehouse: {
    title: { zh: "Live House 演艺空间", en: "Live House" },
    desc: {
      zh: "按面积与乐队规模推荐主扩、超低与返听",
      en: "PA, subs and monitors sized by area and band setup",
    },
  },
  stadium: {
    title: { zh: "体育馆 / 大型场馆", en: "Stadium & Large Venue" },
    desc: {
      zh: "按座位规模推荐线阵列与分区扩声",
      en: "Line arrays and zoning by seating capacity",
    },
  },
  conference: {
    title: { zh: "会议 / 礼堂", en: "Conference & Auditorium" },
    desc: {
      zh: "语言清晰度优先的音柱或点声源方案",
      en: "Speech-focused column or point-source systems",
    },
  },
};
