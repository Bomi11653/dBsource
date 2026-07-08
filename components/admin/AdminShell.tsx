"use client";

import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";
import {
  Briefcase,
  Download,
  Home,
  Info,
  LayoutDashboard,
  Mail,
  Package,
  QrCode,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  home: Home,
  package: Package,
  briefcase: Briefcase,
  download: Download,
  info: Info,
  mail: Mail,
  qr: QrCode,
  status: Activity,
  target: LayoutDashboard,
  layers: LayoutDashboard,
} as const;

export default function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-black/60 p-3 md:p-4 flex flex-row md:flex-col items-center md:items-stretch gap-1 overflow-x-auto md:overflow-visible">
        <Link href="/admin" className="flex flex-col items-center gap-1 px-2 py-2 md:px-3 md:py-3 mb-0 md:mb-4 shrink-0">
          <BrandLogo variant="admin" />
          <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">内容后台</span>
        </Link>
        {ADMIN_SECTIONS.map((section) => {
          const Icon = ICONS[section.icon as keyof typeof ICONS] ?? LayoutDashboard;
          const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
          return (
            <Link
              key={section.id}
              href={section.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors shrink-0 md:shrink",
                active ? "bg-brand-gold/15 text-brand-gold" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="whitespace-nowrap">{section.title.zh}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.href = "/admin/login";
          }}
          className="md:hidden shrink-0 px-3 py-2 text-xs text-gray-500 hover:text-red-300 whitespace-nowrap"
        >
          退出
        </button>
        <Link
          href="/"
          className="md:hidden shrink-0 px-3 py-2 text-xs text-gray-500 hover:text-brand-gold whitespace-nowrap"
        >
          返回官网
        </Link>
        <div className="hidden md:block mt-auto pt-4 border-t border-white/10 space-y-1">
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
            className="block w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-red-300"
          >
            退出登录
          </button>
          <Link href="/" className="block px-3 py-2 text-xs text-gray-500 hover:text-brand-gold">
            ← 返回官网预览
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-xl sm:text-2xl font-medium break-words">{title}</h1>
          {subtitle ? <p className="text-gray-500 text-sm mt-2">{subtitle}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
