"use client";

import { useState } from "react";

export default function RevalidateCacheButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

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
        revalidated?: string[];
      };
      if (!res.ok || !json.ok) {
        setError(true);
        setMessage(json.error || "刷新失败");
        return;
      }
      const count = json.revalidated?.length ?? 0;
      setMessage(`已刷新 ${count} 个路径缓存`);
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "刷新失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
      <p className="text-sm font-medium mb-2">官网缓存</p>
      <p className="text-xs text-gray-500 mb-4">
        后台保存内容时会自动刷新对应页面；若仍看到旧内容，可手动全量刷新 ISR/SSG 缓存。
      </p>
      <button
        type="button"
        onClick={handleRevalidate}
        disabled={loading}
        className="px-4 py-2 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50 text-sm"
      >
        {loading ? "刷新中…" : "手动刷新官网缓存"}
      </button>
      {message ? (
        <p className={`text-xs mt-3 ${error ? "text-red-400" : "text-emerald-400"}`}>{message}</p>
      ) : null}
    </div>
  );
}
