export type CacheRefreshPayload = {
  ok: boolean;
  module: string;
  savedAt: string;
  contentTypes?: string[];
  errorMessage?: string;
};

export type RevalidationPayload = {
  ok: boolean;
  module: string;
  modules: string[];
  paths: string[];
  revalidatedAt: string;
  errorMessage?: string;
};

export type AdminSaveResponse = {
  ok: boolean;
  saved: boolean;
  error?: string;
  revalidation?: RevalidationPayload;
  cacheRefresh?: CacheRefreshPayload;
};

export function formatSaveToast(response: AdminSaveResponse): { type: "ok" | "error"; text: string } {
  if (!response.ok || !response.saved) {
    return { type: "error", text: response.error ?? "保存失败" };
  }

  const revalFailed = response.revalidation && !response.revalidation.ok;
  const cacheFailed = response.cacheRefresh && !response.cacheRefresh.ok;

  if (revalFailed && cacheFailed) {
    return {
      type: "ok",
      text: "保存成功，但官网缓存刷新失败且本地缓存更新失败，请到系统状态页手动处理",
    };
  }
  if (revalFailed) {
    return {
      type: "ok",
      text: "保存成功，但官网缓存刷新失败，请到系统状态页手动刷新",
    };
  }
  if (cacheFailed) {
    return {
      type: "ok",
      text: "保存成功，但本地缓存更新失败，请到系统状态页手动刷新缓存",
    };
  }

  return { type: "ok", text: "保存成功，官网缓存已刷新" };
}
