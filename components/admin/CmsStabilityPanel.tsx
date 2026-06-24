"use client";

import { useCallback, useState } from "react";

type LkgPerType = Record<
  string,
  {
    savedAt: string | null;
    sourceUrl: string | null;
  }
>;

type Props = {
  cmsOnline: boolean;
  usingLastKnownGood: boolean;
  dataSource: string;
  lastSuccessfulFetchAt: string | null;
  lastFailedFetchAt: string | null;
  errorMessage: string | null;
  fileCount: number;
  perType: LkgPerType;
};

const TYPE_LABELS: Record<string, string> = {
  products: "产品",
  productSeries: "产品系列",
  cases: "案例",
  downloads: "下载",
  about: "关于",
  contact: "联系",
  globalSetting: "全局/首页",
  scenes: "场景",
};

const SOURCE_LABEL: Record<string, string> = {
  mock: "Mock（仅开发）",
  strapi: "Strapi 实时数据",
  "strapi-cache": "Strapi 最后成功缓存",
  "strapi-error": "Strapi 异常",
};

function cmsStateLabel(cmsOnline: boolean, usingCache: boolean): string {
  if (usingCache) return "使用缓存";
  if (cmsOnline) return "在线";
  return "异常";
}

export default function CmsStabilityPanel({
  cmsOnline: initialCmsOnline,
  usingLastKnownGood: initialUsingCache,
  dataSource: initialDataSource,
  lastSuccessfulFetchAt: initialSuccessAt,
  lastFailedFetchAt: initialFailedAt,
  errorMessage: initialError,
  fileCount: initialFileCount,
  perType: initialPerType,
}: Props) {
  const [cmsOnline, setCmsOnline] = useState(initialCmsOnline);
  const [usingCache, setUsingCache] = useState(initialUsingCache);
  const [dataSource, setDataSource] = useState(initialDataSource);
  const [lastSuccessAt, setLastSuccessAt] = useState(initialSuccessAt);
  const [lastFailedAt, setLastFailedAt] = useState(initialFailedAt);
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [fileCount, setFileCount] = useState(initialFileCount);
  const [perType, setPerType] = useState(initialPerType);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const refreshFromSync = useCallback(async () => {
    const res = await fetch("/api/sync/status");
    const json = (await res.json()) as {
      cmsOnline?: boolean;
      usingLastKnownGood?: boolean;
      dataSource?: string;
      lastSuccessfulFetchAt?: string | null;
      lastFailedFetchAt?: string | null;
      errorMessage?: string | null;
      cache?: { lkgFileCount?: number; lkgPerType?: LkgPerType };
    };
    setCmsOnline(Boolean(json.cmsOnline));
    setUsingCache(Boolean(json.usingLastKnownGood));
    setDataSource(json.dataSource ?? "strapi-error");
    setLastSuccessAt(json.lastSuccessfulFetchAt ?? null);
    setLastFailedAt(json.lastFailedFetchAt ?? null);
    setErrorMessage(json.errorMessage ?? null);
    setFileCount(json.cache?.lkgFileCount ?? 0);
    setPerType(json.cache?.lkgPerType ?? {});
  }, []);

  async function handleRefreshLkg() {
    setLoading("refresh");
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/admin/refresh-lkg-cache", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; sourceUrl?: string };
      if (!res.ok || !json.ok) {
        setIsError(true);
        setMessage("本地缓存刷新失败");
      } else {
        setMessage("已从 Strapi 刷新全部本地 last-known-good 缓存");
      }
      await refreshFromSync();
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "刷新失败");
    } finally {
      setLoading(null);
    }
  }

  async function handleClearLkg() {
    if (!confirm("确定清理全部本地 CMS 缓存？Strapi 断开时官网可能暂时无数据。")) return;
    setLoading("clear");
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/admin/clear-lkg-cache", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean };
      if (!res.ok || !json.ok) {
        setIsError(true);
        setMessage("清理失败");
      } else {
        setMessage("本地缓存已清理");
      }
      await refreshFromSync();
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "清理失败");
    } finally {
      setLoading(null);
    }
  }

  async function handleTestStrapi() {
    setLoading("test");
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/admin/health-check", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        service?: { strapi?: { ok?: boolean; errorMessage?: string } };
      };
      if (json.service?.strapi?.ok) {
        setMessage("Strapi 连接正常");
      } else {
        setIsError(true);
        setMessage(json.service?.strapi?.errorMessage || "Strapi 连接失败");
      }
      await refreshFromSync();
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "测试失败");
    } finally {
      setLoading(null);
    }
  }

  const stateLabel = cmsStateLabel(cmsOnline, usingCache);
  const stateColor =
    stateLabel === "在线"
      ? "text-emerald-400"
      : stateLabel === "使用缓存"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
      <p className="text-sm font-medium mb-2">CMS 稳定性</p>

      {usingCache && !cmsOnline ? (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
          CMS 当前不可用，官网正在使用最后一次成功缓存数据。
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4 text-xs mb-4">
        <div>
          <p className="text-gray-500">CMS 当前状态</p>
          <p className={`text-base font-medium mt-1 ${stateColor}`}>{stateLabel}</p>
        </div>
        <div>
          <p className="text-gray-500">当前数据来源</p>
          <p className="text-base font-medium mt-1 text-white">
            {SOURCE_LABEL[dataSource] ?? dataSource}
          </p>
        </div>
        <div>
          <p className="text-gray-500">最近成功同步</p>
          <p className="text-gray-300 mt-1">
            {lastSuccessAt ? new Date(lastSuccessAt).toLocaleString("zh-CN") : "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">最近失败时间</p>
          <p className="text-gray-300 mt-1">
            {lastFailedAt ? new Date(lastFailedAt).toLocaleString("zh-CN") : "—"}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-gray-500">最近错误原因</p>
          <p className={`mt-1 ${errorMessage ? "text-red-400" : "text-gray-500"}`}>
            {errorMessage || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">缓存文件数量</p>
          <p className="text-gray-300 mt-1">{fileCount}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-2">各类缓存更新时间</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-4">
        {Object.entries(TYPE_LABELS).map(([key, label]) => {
          const entry = perType[key];
          return (
            <div key={key} className="p-2 rounded-lg bg-black/20">
              <p className="text-gray-400">{label}</p>
              <p className="text-gray-300 mt-1">
                {entry?.savedAt ? new Date(entry.savedAt).toLocaleString("zh-CN") : "—"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRefreshLkg}
          disabled={loading !== null}
          className="px-4 py-2 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50 text-sm"
        >
          {loading === "refresh" ? "刷新中…" : "手动刷新 Strapi 数据缓存"}
        </button>
        <button
          type="button"
          onClick={handleClearLkg}
          disabled={loading !== null}
          className="px-4 py-2 rounded-lg border border-white/15 hover:border-red-400/40 disabled:opacity-50 text-sm"
        >
          {loading === "clear" ? "清理中…" : "清理本地缓存"}
        </button>
        <button
          type="button"
          onClick={handleTestStrapi}
          disabled={loading !== null}
          className="px-4 py-2 rounded-lg border border-white/15 hover:border-brand-gold/40 disabled:opacity-50 text-sm"
        >
          {loading === "test" ? "测试中…" : "测试 Strapi 连接"}
        </button>
      </div>

      {message ? (
        <p className={`text-xs mt-3 ${isError ? "text-red-400" : "text-emerald-400"}`}>{message}</p>
      ) : null}
    </div>
  );
}
