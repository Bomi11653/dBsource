"use client";

import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { salesContactAnchor, whatsAppUrl } from "@/lib/sales-routing";

export default function AiSalesShortcuts({
  onNavigate,
  whatsAppText,
  compact,
}: {
  onNavigate?: () => void;
  whatsAppText?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div
      className={`flex flex-wrap gap-1.5 ${compact ? "" : "mt-2 pt-2 border-t border-white/5"}`}
    >
      <Link
        href={salesContactAnchor()}
        onClick={onNavigate}
        className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <MessageCircle size={12} />
        {t.ai.wechatSales}
      </Link>
      <a
        href={whatsAppUrl(undefined, whatsAppText)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        WhatsApp
      </a>
    </div>
  );
}
