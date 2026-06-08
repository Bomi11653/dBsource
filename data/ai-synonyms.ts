/** 搜索同义词与场景标签（免费本地扩展，无需向量库） */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  线阵列: ["la", "line array", "阵列", "linearray"],
  超低音: ["sub", "subwoofer", "v221", "v18", "低音"],
  返听: ["mi", "monitor", "舞台监听"],
  音柱: ["sol", "column", "防水"],
  处理器: ["unit48", "dsp", "数字处理"],
  软件: ["dbcover", "suite", "声学模拟"],
  livehouse: ["live house", "livehouse", "酒吧", "演艺", "live house"],
  体育馆: ["stadium", "体育", "球场", "场馆"],
  会议: ["conference", "礼堂", "报告厅", "政企"],
  工程: ["turnkey", "系统集成", "安装"],
  流动演出: ["tour", "vit", "v12", "巡演"],
};

export const SCENE_TAGS: Record<string, { products: string[]; cases: number[]; href?: string }> =
  {
    livehouse: {
      products: ["DO", "MI", "LA"],
      cases: [1, 2],
      href: "/configurator?scene=livehouse",
    },
    体育馆: {
      products: ["LA", "V", "LW"],
      cases: [1],
      href: "/configurator?scene=stadium",
    },
    stadium: {
      products: ["LA", "V", "LW"],
      cases: [1],
      href: "/configurator?scene=stadium",
    },
    会议: {
      products: ["SOL", "RE", "Unit48"],
      cases: [2, 4],
      href: "/configurator?scene=conference",
    },
    conference: {
      products: ["SOL", "RE", "Unit48"],
      cases: [2, 4],
      href: "/configurator?scene=conference",
    },
  };
