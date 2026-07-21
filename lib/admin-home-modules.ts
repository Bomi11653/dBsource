/** 旧版首页模块：数据与 API 保留，自定义后台 UI 已停用 */
export const ADMIN_HOME_LEGACY_MODULES = {
  scenes: {
    enabled: false,
    label: "应用场景",
    strapiPath: "/content-manager/collection-types/api::scene.scene",
  },
  featuredProducts: {
    enabled: false,
    label: "核心产品",
    fields: ["homeFeaturedProductAId", "homeFeaturedProductBId"],
  },
  featuredCase: {
    enabled: false,
    label: "精选案例",
    fields: [
      "homeFeaturedCaseId",
      "homeFeaturedCaseTitleZh",
      "homeFeaturedCaseTitleEn",
      "homeFeaturedCaseDescZh",
      "homeFeaturedCaseDescEn",
      "homeFeaturedCaseImage",
    ],
  },
} as const;
