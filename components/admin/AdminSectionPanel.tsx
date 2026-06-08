import { strapiAdminUrl, type AdminSection } from "@/lib/admin-sections";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminSectionPanel({
  section,
  count,
  children,
}: {
  section: AdminSection;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
        <div>
          <h2 className="font-medium">{section.title.zh}</h2>
          <p className="text-xs text-gray-500 mt-1">{section.description.zh}</p>
        </div>
        <div className="flex items-center gap-3">
          {typeof count === "number" ? (
            <span className="text-sm text-brand-gold font-mono">{count} 条</span>
          ) : null}
          <a
            href={strapiAdminUrl(section.strapiPath)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-gray-300 hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
          >
            在 Strapi 编辑
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function AdminHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 leading-relaxed">{children}</p>;
}

export function AdminTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  if (!rows.length) {
    return <p className="text-sm text-gray-500">暂无数据，请在 Strapi 后台添加内容。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-white/10">
            {headers.map((h) => (
              <th key={h} className="pb-3 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 text-gray-300">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-4 align-top max-w-xs truncate">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
