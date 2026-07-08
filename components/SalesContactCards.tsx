"use client";

import { useI18n } from "@/components/I18nProvider";
import type { SalesContactItem } from "@/data/sales-contacts";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import Image from "next/image";
import { Check, Copy, Phone } from "lucide-react";
import { useState } from "react";

function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyTextToClipboard(value);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center justify-center gap-1 min-h-[36px] px-2.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-brand-gold hover:border-brand-gold/30 transition-colors touch-active shrink-0"
      title={label}
    >
      {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      <span className="sr-only">{copied ? copiedLabel : label}</span>
    </button>
  );
}

function PhoneRow({ phone }: { phone: string }) {
  const { t } = useI18n();
  const tel = phone.replace(/\s/g, "");

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <Phone size={14} className="text-brand-gold/80 shrink-0" aria-hidden />
      <a
        href={`tel:${tel}`}
        className="flex-1 min-w-0 text-sm text-brand-gold hover:underline tabular-nums tracking-wide break-all"
      >
        {phone}
      </a>
      <CopyButton value={phone} label={t.contact.copyPhone} copiedLabel={t.contact.copied} />
    </div>
  );
}

function WechatRow({ wechatId }: { wechatId: string }) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 w-full min-w-0 mt-2">
      <span className="flex-1 min-w-0 text-xs text-gray-400 break-all">
        <span className="text-gray-500">{t.contact.wechatId}: </span>
        {wechatId}
      </span>
      <CopyButton
        value={wechatId}
        label={t.contact.copyWechat}
        copiedLabel={t.contact.copied}
      />
    </div>
  );
}

export default function SalesContactCards({ contacts }: { contacts: SalesContactItem[] }) {
  const { locale, t } = useI18n();

  if (!contacts.length) {
    return null;
  }

  const columnClass =
    contacts.length === 1
      ? "grid-cols-1 max-w-sm"
      : contacts.length === 2
        ? "grid-cols-1 sm:grid-cols-2 max-w-2xl"
        : contacts.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 max-w-6xl";

  return (
    <section
      id="contact-sales"
      className="scroll-mt-nav rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-5 sm:p-8 md:p-10"
    >
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-2">
          {t.contact.salesLabel}
        </p>
        <h2 className="text-xl sm:text-2xl font-medium text-white">{t.contact.salesTitle}</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">
          {t.contact.salesHint}
        </p>
      </div>

      <ul className={`grid ${columnClass} gap-4 sm:gap-5 mx-auto`}>
        {contacts.map((person, index) => {
          const displayName = person.name[locale] || person.name.zh;
          const displayTitle = person.title?.[locale] || person.title?.zh;

          return (
            <li
              key={String(person.id)}
              className="flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 transition-colors hover:border-brand-gold/25 min-w-0"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-40 h-40 sm:w-44 sm:h-44 rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-2.5 shrink-0">
                  <Image
                    src={person.qrImage}
                    alt={`${displayName} ${t.contact.wechatQr}`}
                    width={168}
                    height={168}
                    className="w-full h-full object-contain"
                    sizes="160px"
                  />
                </div>
                <p className="mt-4 text-base font-medium text-white leading-snug break-words max-w-full">
                  {displayName}
                </p>
                {displayTitle ? (
                  <p className="mt-1 text-xs text-gray-500 leading-snug break-words max-w-full">
                    {displayTitle}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-2 w-full min-w-0">
                {person.phones.map((phone) => (
                  <PhoneRow key={phone} phone={phone} />
                ))}
                {person.wechatId ? <WechatRow wechatId={person.wechatId} /> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
