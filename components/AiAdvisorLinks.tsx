"use client";

import type { AiLink } from "@/lib/ai/links";
import { splitAiLinks } from "@/lib/ai/links";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";

const TYPE_LABEL: Record<AiLink["type"], { zh: string; en: string }> = {
  product: { zh: "产品", en: "Product" },
  case: { zh: "案例", en: "Case" },
  series: { zh: "系列", en: "Series" },
  download: { zh: "下载", en: "Download" },
  contact: { zh: "联系", en: "Contact" },
  configurator: { zh: "选型", en: "Sizing" },
};

export default function AiAdvisorLinks({
  links,
  onNavigate,
  prominent,
}: {
  links: AiLink[];
  onNavigate?: () => void;
  prominent?: boolean;
}) {
  const { locale, t } = useI18n();
  const { related, actions } = splitAiLinks(links);
  if (!related.length && !actions.length) return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2">
      {related.length > 0 ? (
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5">{t.ai.relatedLinks}</p>
          <div className="flex flex-wrap gap-1.5">
            {related.map((link) => (
              <Link
                key={`${link.type}-${link.href}-${link.label}`}
                href={link.href}
                onClick={onNavigate}
                className={`inline-flex items-center gap-1 max-w-full text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  prominent
                    ? "border-brand-gold/40 bg-brand-gold/10 text-white hover:bg-brand-gold/20"
                    : "border-white/10 bg-white/5 text-gray-200 hover:border-brand-gold/30 hover:text-white"
                }`}
              >
                <span className="text-[9px] uppercase opacity-60 shrink-0">
                  {TYPE_LABEL[link.type][locale]}
                </span>
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {actions.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="inline-flex items-center text-[11px] px-3 py-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 transition-colors font-medium"
            >
              {link.label} →
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FallbackActions({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <Link
        href="/contact"
        onClick={onNavigate}
        className="text-[11px] px-3 py-1.5 rounded-full border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10"
      >
        {t.ai.contactFallback} →
      </Link>
      <Link
        href="/configurator"
        onClick={onNavigate}
        className="text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white"
      >
        {t.ai.configuratorLink} →
      </Link>
    </div>
  );
}

export { FallbackActions };
