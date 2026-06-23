/**
 * 数据源策略：生产环境禁止静默回退 Mock 演示数据
 */

export type CmsDataSource = "mock" | "strapi" | "strapi-error";

export function isUseMockDataEnv(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

/** 仅 NEXT_PUBLIC_USE_MOCK_DATA=true 时使用 mock */
export function shouldUseMockData(): boolean {
  return isUseMockDataEnv();
}

/** 生产且未开启 mock */
export function isProductionStrapiMode(): boolean {
  return process.env.NODE_ENV === "production" && !isUseMockDataEnv();
}

/** 是否允许在 Strapi 失败时回退 mock（仅 mock 模式） */
export function allowMockFallback(): boolean {
  return isUseMockDataEnv();
}

export function resolveDataSource(cmsOnline: boolean): CmsDataSource {
  if (isUseMockDataEnv()) return "mock";
  if (cmsOnline) return "strapi";
  return "strapi-error";
}
