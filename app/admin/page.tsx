import AdminShell from "@/components/admin/AdminShell";
import { ADMIN_SECTIONS, strapiAdminUrl } from "@/lib/admin-sections";
import { getAdminStats, getLeadDashboard } from "@/lib/admin-stats";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [stats, leadDashboard] = await Promise.all([getAdminStats(), getLeadDashboard()]);

  return (
    <AdminShell
      title="内容管理总览"
      subtitle="按官网页面分区 · 进入各分区可直接编辑、上传图片/文件并发布"
    >
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {ADMIN_SECTIONS.map((section) => {
          const count = section.countKey ? stats[section.countKey] : undefined;
          return (
            <Link
              key={section.id}
              href={section.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-brand-gold/35 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium group-hover:text-brand-gold transition-colors">
                  {section.title.zh}
                </h2>
                {typeof count === "number" ? (
                  <span className="text-xs font-mono text-brand-gold bg-brand-gold/10 px-2 py-1 rounded-full">
                    {count}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{section.description.zh}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-gray-500">询盘总量（近500条）</p>
          <p className="text-2xl font-semibold mt-1">{leadDashboard.total}</p>
          <p className="text-xs text-gray-500 mt-2">
            已确认率 {leadDashboard.qualifiedRate}% · 成交率 {leadDashboard.winRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-gray-500 mb-2">主要来源渠道</p>
          <ul className="space-y-1.5 text-sm">
            {leadDashboard.topSources.length ? (
              leadDashboard.topSources.map((item) => (
                <li key={item.source} className="flex justify-between text-gray-300">
                  <span>{item.source}</span>
                  <span className="text-brand-gold">{item.count}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500">暂无数据</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-gray-500 mb-2">主要国家/地区</p>
          <ul className="space-y-1.5 text-sm">
            {leadDashboard.topCountries.length ? (
              leadDashboard.topCountries.map((item) => (
                <li key={item.country} className="flex justify-between text-gray-300">
                  <span>{item.country}</span>
                  <span className="text-brand-gold">{item.count}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500">暂无数据</li>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-5 text-sm space-y-2">
        <p className="text-brand-gold font-medium">使用方式</p>
        <ol className="list-decimal list-inside text-xs text-gray-400 space-y-1">
          <li>点击上方分区卡片进入编辑页</li>
          <li>展开条目 → 修改文字 / 上传图片 → 点「保存并发布」</li>
          <li>首次使用请在 <code className="text-brand-gold">.env.local</code> 配置 <code className="text-brand-gold">STRAPI_API_TOKEN</code> 后重启预览</li>
        </ol>
        <p className="text-xs text-gray-500 pt-2">
          官网预览 <a href="http://127.0.0.1:3003" className="text-brand-gold hover:underline">127.0.0.1:3003</a>
          {" · "}
          <a href="/templates/monthly-lead-review.md" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-gold">
            月度复盘模板
          </a>
          {" · "}
          <a href={strapiAdminUrl("")} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-gold inline-flex items-center gap-1">
            高级设置 Strapi <ExternalLink size={12} />
          </a>
        </p>
      </div>
    </AdminShell>
  );
}
