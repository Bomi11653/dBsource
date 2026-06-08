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
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <aside className="w-56 shrink-0 border-r border-white/10 bg-black/60 p-4 flex flex-col gap-1">
        <Link href="/admin" className="flex flex-col items-center gap-2 px-3 py-3 mb-4">
          <BrandLogo variant="admin" />
          <span className="text-xs text-gray-400">内容后台</span>
        </Link>
        {ADMIN_SECTIONS.map((section) => {
          const Icon = ICONS[section.icon as keyof typeof ICONS] ?? LayoutDashboard;
          const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
          return (
            <Link
              key={section.id}
              href={section.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-brand-gold/15 text-brand-gold" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={16} />
              {section.title.zh}
            </Link>
          );
        })}
        <div className="mt-auto pt-4 border-t border-white/10">
          <Link href="/" className="block px-3 py-2 text-xs text-gray-500 hover:text-brand-gold">
            ← 返回官网预览
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-medium">{title}</h1>
          {subtitle ? <p className="text-gray-500 text-sm mt-2">{subtitle}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
