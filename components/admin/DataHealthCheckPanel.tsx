"use client";

import type { HealthCheckResult, HealthContentType, HealthIssueRow } from "@/lib/cms-health-check";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const TYPE_FILTERS: Array<{ key: "all" | HealthContentType; label: string }> = [
  { key: "all", label: "全部" },
  { key: "cases", label: "工程案例" },
  { key: "downloads", label: "下载中心" },
  { key: "products", label: "产品中心" },
];

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN");
  } catch {
    return iso;
  }
}

export default function DataHealthCheckPanel({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | HealthContentType>("all");

  const filteredIssues = useMemo(() => {
    if (!result) return [];
    if (filter === "all") return result.issues;
    return result.issues.filter((item) => item.contentType === filter);
  }, [filter, result]);

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/health-check", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        content?: HealthCheckResult;
        error?: string;
      };
      const result = json.content ?? (json as HealthCheckResult);
      if (!res.ok && result.error) {
        setError(result.error);
        setResult(result);
        return;
      }
      setResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "检查失败");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
        <p className="text-sm font-medium mb-2">数据健康检查</p>
        <p className="text-xs text-gray-500">
          需要 CMS 在线且配置 STRAPI_API_TOKEN 后才能运行检查。
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium">数据健康检查</p>
          <p className="text-xs text-gray-500 mt-1">
            上线前检查案例、下载、产品是否缺标题、图片或文件，并验证媒体 URL 是否可访问。
          </p>
        </div>
        <button
          type="button"
          onClick={runCheck}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50 text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "检查中…" : "运行检查"}
        </button>
      </div>

      {error ? <p className="text-xs text-red-400 mb-3">{error}</p> : null}

      {result ? (
        <>
          <div
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 mb-4 ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
            }`}
          >
            {result.ok ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : null}
            {!result.ok ? <AlertTriangle size={18} className="shrink-0 mt-0.5" /> : null}
            <div className="text-sm">
              {result.ok ? (
                <p>全部通过，未发现内容完整性问题。</p>
              ) : (
                <p>发现 {result.issues.length} 个问题，请在下表修复后再上线。</p>
              )}
              <p className="text-xs opacity-80 mt-1">检查时间：{formatTime(result.checkedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
            <SummaryCard
              label="工程案例"
              total={result.summary.cases.total}
              issues={result.summary.cases.issues}
            />
            <SummaryCard
              label="下载中心"
              total={result.summary.downloads.total}
              issues={result.summary.downloads.issues}
            />
            <SummaryCard
              label="产品中心"
              total={result.summary.products.total}
              issues={result.summary.products.issues}
            />
          </div>

          {result.issues.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {TYPE_FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      filter === item.key
                        ? "border-brand-gold/50 text-brand-gold bg-brand-gold/10"
                        : "border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.03] text-gray-500 text-xs">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">内容类型</th>
                      <th className="text-left px-4 py-3 font-medium">ID</th>
                      <th className="text-left px-4 py-3 font-medium">标题</th>
                      <th className="text-left px-4 py-3 font-medium">imageUrl</th>
                      <th className="text-left px-4 py-3 font-medium">问题原因</th>
                      <th className="text-left px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((issue) => (
                      <IssueRow key={`${issue.documentId}-${issue.reason}`} issue={issue} />
                    ))}
                  </tbody>
                </table>
                {filteredIssues.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 py-6">当前筛选下没有问题项。</p>
                ) : null}
              </div>
            </>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-gray-500">尚未运行检查，点击「运行检查」开始。</p>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  total,
  issues,
}: {
  label: string;
  total: number;
  issues: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-white mt-1">{total} 条</p>
      <p className={`text-xs mt-1 ${issues > 0 ? "text-amber-400" : "text-emerald-400"}`}>
        {issues > 0 ? `${issues} 个问题` : "正常"}
      </p>
    </div>
  );
}

function IssueRow({ issue }: { issue: HealthIssueRow }) {
  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.02]">
      <td className="px-4 py-3 whitespace-nowrap text-gray-300">{issue.contentTypeLabel}</td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-400">{issue.id}</td>
      <td className="px-4 py-3 max-w-[180px] truncate text-white">{issue.title}</td>
      <td className="px-4 py-3 max-w-[200px] truncate font-mono text-[11px] text-gray-500">
        {issue.imageUrl || "—"}
      </td>
      <td className="px-4 py-3 text-amber-200/90 text-xs leading-relaxed max-w-[280px]">
        {issue.reason}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link
          href={issue.editHref}
          className="inline-flex items-center gap-1 text-xs text-brand-gold hover:underline"
        >
          去编辑
          <ExternalLink size={12} />
        </Link>
      </td>
    </tr>
  );
}
