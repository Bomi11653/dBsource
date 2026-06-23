"use client";

import { useCallback, useEffect, useState } from "react";

type RevalidationRecord = {
  ok: boolean;
  trigger: string;
  modules: string[];
  paths: string[];
  pathCount: number;
  revalidatedAt: string;
  errorMessage?: string;
};

type CacheStatusResponse = {
  ok?: boolean;
  revalidation?: {
    manual: RevalidationRecord | null;
    automatic: RevalidationRecord | null;
    test: RevalidationRecord | null;
  };
};

function formatRecord(label: string, record: RevalidationRecord | null | undefined) {
  if (!record) {
    return (
      <div className="text-xs text-gray-500">
        <p className="text-gray-400 mb-1">{label}</p>
        <p>暂无记录</p>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className={record.ok ? "text-emerald-400" : "text-red-400"}>
        {record.ok ? "成功" : "失败"} · {record.pathCount} 个路径
      </p>
      <p className="text-gray-500 mt-1">模块: {record.modules.join(", ") || "—"}</p>
      <p className="text-gray-500">时间: {new Date(record.revalidatedAt).toLocaleString("zh-CN")}</p>
      {record.errorMessage ? (
        <p className="text-red-400 mt-1">{record.errorMessage}</p>
      ) : null}
    </div>
  );
}

export default function SiteCacheStatusPanel() {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [audit, setAudit] = useState<CacheStatusResponse["revalidation"] | null>(null);

  const loadAudit = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/cache-status");
      const json = (await res.json()) as CacheStatusResponse;
      if (json.revalidation) setAudit(json.revalidation);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  async function handleRevalidate() {
    setLoading(true);
    setMessage(null);
    setError(false);
    try {
      const res = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: ["all"] }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        pathCount?: number;
        revalidated?: string[];
      };
      if (!res.ok || !json.ok) {
        setError(true);
        setMessage(json.error || "刷新失败");
      } else {
        const count = json.pathCount ?? json.revalidated?.length ?? 0;
        setMessage(`已手动刷新 ${count} 个路径缓存`);
      }
      await loadAudit();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "刷新失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleTestRevalidate() {
    setTestLoading(true);
    setMessage(null);
    setError(false);
    try {
      const res = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: ["all"], test: true }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        pathCount?: number;
        revalidated?: string[];
      };
      if (!res.ok || !json.ok) {
        setError(true);
        setMessage(`自动刷新测试失败: ${json.error || "未知错误"}`);
      } else {
        const count = json.pathCount ?? json.revalidated?.length ?? 0;
        setMessage(`自动刷新测试成功，已验证 ${count} 个路径（不影响 CMS 内容）`);
      }
      await loadAudit();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "测试失败");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
      <p className="text-sm font-medium mb-2">官网缓存</p>
      <p className="text-xs text-gray-500 mb-4">
        后台保存内容时会自动刷新对应页面；下方可查看最近手动/自动刷新记录。
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-4 p-3 rounded-xl bg-black/20">
        {formatRecord("最近手动刷新", audit?.manual)}
        {formatRecord("最近自动刷新", audit?.automatic)}
        {formatRecord("最近自动刷新测试", audit?.test)}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRevalidate}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50 text-sm"
        >
          {loading ? "刷新中…" : "手动刷新官网缓存"}
        </button>
        <button
          type="button"
          onClick={handleTestRevalidate}
          disabled={testLoading}
          className="px-4 py-2 rounded-lg border border-white/15 hover:border-brand-gold/40 disabled:opacity-50 text-sm"
        >
          {testLoading ? "测试中…" : "自动刷新测试"}
        </button>
      </div>

      {message ? (
        <p className={`text-xs mt-3 ${error ? "text-red-400" : "text-emerald-400"}`}>{message}</p>
      ) : null}
    </div>
  );
}
