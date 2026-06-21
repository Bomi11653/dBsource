import AdminShell from "@/components/admin/AdminShell";
import { getAdminStats } from "@/lib/admin-stats";
import { isCmsAvailable } from "@/lib/cms-health";
import { getCmsUrl } from "@/lib/strapi-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  mock: "Mock 演示数据",
  strapi: "Strapi CMS 实时数据",
  "mock-fallback": "CMS 不可用 · Mock 降级",
};

export default async function AdminStatusPage() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  const cmsUrl = getCmsUrl();
  const cmsOnline = useMock ? false : await isCmsAvailable();

  let dataSource: keyof typeof SOURCE_LABEL = "mock-fallback";
  if (useMock) dataSource = "mock";
  else if (cmsOnline) dataSource = "strapi";

  const stats = cmsOnline && !useMock ? await getAdminStats() : null;

  return (
    <AdminShell title="系统状态" subtitle="CMS 连接、数据源与内容规模一览">
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-gray-500">当前数据源</p>
          <p
            className={`text-lg font-medium mt-1 ${
              dataSource === "strapi" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {SOURCE_LABEL[dataSource]}
          </p>
          <p className="text-xs text-gray-500 mt-3 break-all">CMS: {cmsUrl}</p>
          <p className="text-xs text-gray-500 mt-1">
            CMS 在线: {cmsOnline ? "是" : "否"} · USE_MOCK_DATA: {useMock ? "true" : "false"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-gray-500">前台缓存策略</p>
          <p className="text-lg font-medium mt-1 text-white">ISR revalidate 300s</p>
          <p className="text-xs text-gray-500 mt-3">
            官网页面默认 5 分钟再验证；后台 API 仍为 no-store。
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
        <p className="text-sm font-medium mb-4">内容数量（Strapi）</p>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">产品</p>
              <p className="text-2xl font-semibold text-brand-gold">{stats.products}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">案例</p>
              <p className="text-2xl font-semibold text-brand-gold">{stats.cases}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">下载</p>
              <p className="text-2xl font-semibold text-brand-gold">{stats.downloads}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">询盘</p>
              <p className="text-2xl font-semibold text-brand-gold">{stats.leads}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">CMS 未连接或未配置 STRAPI_API_TOKEN，无法读取统计。</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/api/sync/status"
          target="_blank"
          className="px-4 py-2 rounded-lg border border-white/15 hover:border-brand-gold/40"
        >
          查看 JSON 状态 API
        </Link>
        <Link href="/admin" className="px-4 py-2 rounded-lg border border-white/15 hover:border-brand-gold/40">
          返回总览
        </Link>
      </div>
    </AdminShell>
  );
}
