import AdminShell from "@/components/admin/AdminShell";
import CmsStabilityPanel from "@/components/admin/CmsStabilityPanel";
import DataHealthCheckPanel from "@/components/admin/DataHealthCheckPanel";
import SiteCacheStatusPanel from "@/components/admin/SiteCacheStatusPanel";
import { getAdminStats } from "@/lib/admin-stats";
import { listLkgCacheSummary } from "@/lib/cms-lkg-cache";
import { resolveDataSource } from "@/lib/cms-data-source";
import { probeStrapiApi } from "@/lib/cms-health";
import { getPublicCmsUrl } from "@/lib/media-url";
import { adminTokenConfigured } from "@/lib/strapi-admin";
import { getCmsUrl } from "@/lib/strapi-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  mock: "Mock 演示数据",
  strapi: "Strapi CMS 实时数据",
  "strapi-cache": "Strapi 最后成功缓存",
  "strapi-error": "Strapi 异常 · 不回退 Mock",
};

export default async function AdminStatusPage() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  const cmsUrl = getCmsUrl();
  const publicCmsUrl = getPublicCmsUrl();
  const strapiProbe = await probeStrapiApi();
  const cmsOnline = strapiProbe.ok;
  const lkgSummary = listLkgCacheSummary();
  const usingLastKnownGood = lkgSummary.usingLastKnownGood;
  const dataSource = resolveDataSource(cmsOnline, usingLastKnownGood);

  const stats = cmsOnline && !useMock ? await getAdminStats() : null;
  const healthCheckEnabled = !useMock && adminTokenConfigured();

  return (
    <AdminShell title="系统状态" subtitle="CMS 连接、数据源与内容规模一览">
      {useMock ? (
        <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4">
          <p className="text-sm font-medium text-red-300">
            警告：当前构建启用了 Mock 数据（NEXT_PUBLIC_USE_MOCK_DATA=true）
          </p>
          <p className="text-xs text-red-200/80 mt-2 leading-relaxed">
            生产环境不应使用 Mock。请确认 .env.production.local 中 USE_MOCK_DATA=false，重新 npm run
            build 并 pm2 restart dbsource-web。
          </p>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-gray-500">当前数据源</p>
          <p
            className={`text-lg font-medium mt-1 ${
              dataSource === "strapi"
                ? "text-emerald-400"
                : dataSource === "strapi-cache"
                  ? "text-amber-400"
                  : dataSource === "strapi-error"
                    ? "text-red-400"
                    : "text-amber-400"
            }`}
          >
            {SOURCE_LABEL[dataSource] ?? dataSource}
          </p>
          <p className="text-xs text-gray-500 mt-3 break-all">CMS (内网): {cmsUrl}</p>
          <p className="text-xs text-gray-500 mt-1 break-all">CMS (公网): {publicCmsUrl}</p>
          <p className="text-xs text-gray-500 mt-1">
            Strapi API: {strapiProbe.status ?? "—"} · USE_MOCK_DATA: {useMock ? "true" : "false"}
          </p>
          {usingLastKnownGood ? (
            <p className="text-xs text-amber-400 mt-2">
              官网正在使用 last-known-good 本地缓存
            </p>
          ) : null}
          {strapiProbe.errorMessage ? (
            <p className="text-xs text-red-400 mt-2">{strapiProbe.errorMessage}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-gray-500">前台缓存策略</p>
          <p className="text-lg font-medium mt-1 text-white">ISR revalidate 300s</p>
          <p className="text-xs text-gray-500 mt-3">
            后台保存成功后会立即触发 revalidate 并刷新本地 CMS 缓存；Strapi 异常时使用
            last-known-good，不回退 Mock。
          </p>
        </div>
      </div>

      <CmsStabilityPanel
        cmsOnline={cmsOnline}
        usingLastKnownGood={usingLastKnownGood}
        dataSource={dataSource}
        lastSuccessfulFetchAt={lkgSummary.lastSuccessfulFetchAt}
        lastFailedFetchAt={lkgSummary.lastFailedFetchAt}
        errorMessage={strapiProbe.errorMessage ?? lkgSummary.lastErrorMessage}
        fileCount={lkgSummary.fileCount}
        perType={lkgSummary.perType}
      />

      <SiteCacheStatusPanel />

      <DataHealthCheckPanel enabled={healthCheckEnabled} />

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
