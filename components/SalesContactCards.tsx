"use client";

import { useI18n } from "@/components/I18nProvider";
import type { SalesContactItem } from "@/data/sales-contacts";
import Image from "next/image";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

function CopyPhone({ phone }: { phone: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* tel link fallback */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2 rounded-lg text-brand-gold hover:bg-white/5 transition-colors touch-active group w-full"
      title={t.contact.copyPhone}
    >
      <a
        href={`tel:${phone}`}
        onClick={(e) => e.stopPropagation()}
        className="hover:underline tabular-nums tracking-wide"
      >
        {phone}
      </a>
      {copied ? (
        <Check size={13} className="text-white shrink-0" aria-hidden />
      ) : (
        <Copy size={13} className="text-gray-500 group-hover:text-brand-gold shrink-0" aria-hidden />
      )}
      <span className="sr-only">{copied ? t.contact.copied : t.contact.copyPhone}</span>
    </button>
  );
}

export default function SalesContactCards({ contacts }: { contacts: SalesContactItem[] }) {
  const { locale, t } = useI18n();

  if (!contacts.length) {
    return null;
  }

  return (
    <section id="contact-sales" className="scroll-mt-nav pt-10 border-t border-white/10">
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-2">
          {t.contact.salesLabel}
        </p>
        <h3 className="text-lg sm:text-xl font-medium text-white">{t.contact.salesTitle}</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-md mx-auto">{t.contact.salesHint}</p>
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-3xl mx-auto">
        {contacts.map((person, index) => {
          const displayName = person.name[locale] || person.name.zh;
          const displayTitle = person.title?.[locale] || person.title?.zh;

          return (
            <li
              key={String(person.id)}
              className="flex flex-col items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-3 sm:p-4 transition-colors hover:border-brand-gold/25"
            >
              <div className="flex items-center justify-center w-[132px] h-[132px] sm:w-[148px] sm:h-[148px] rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-2 sm:p-2.5">
                <Image
                  src={person.qrImage}
                  alt={`${displayName} ${t.contact.wechatQr}`}
                  width={140}
                  height={140}
                  className="w-full h-full object-contain"
                  priority={index === 0}
                />
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-[15px] font-medium text-white text-center leading-snug">
                {displayName}
              </p>
              {displayTitle ? (
                <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 text-center leading-snug">
                  {displayTitle}
                </p>
              ) : null}
              {person.wechatId ? (
                <p className="mt-1 text-[11px] text-gray-500 text-center">
                  {t.contact.wechatId}: {person.wechatId}
                </p>
              ) : null}
              <div className="mt-1 w-full flex flex-col items-stretch gap-0.5">
                {person.phones.map((phone) => (
                  <CopyPhone key={phone} phone={phone} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
