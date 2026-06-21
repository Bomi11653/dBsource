"use client";

import type { MaintenanceContacts } from "@/lib/maintenance";
import { whatsAppUrl } from "@/lib/sales-routing";
import { Mail, MessageCircle, Phone, RefreshCw } from "lucide-react";
import Image from "next/image";

type Props = {
  message: string;
  contacts: MaintenanceContacts;
};

export default function MaintenanceScreen({ message, contacts }: Props) {
  const whatsAppHref = whatsAppUrl(
    contacts.whatsAppPhone,
    "Hello dBsource, I noticed the website is under maintenance."
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(100, 140, 180, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(80, 90, 110, 0.12), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <Image
              src="/brand/logo.png"
              alt="dBsource"
              width={80}
              height={120}
              className="h-14 w-auto object-contain opacity-95"
              priority
            />
            <p className="mt-4 text-[10px] uppercase tracking-[0.45em] text-slate-400">
              dBsource · SOLO-C
            </p>
          </div>

          <div className="rounded-sm border border-white/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-sm">
            <div className="mb-6 h-px w-12 bg-gradient-to-r from-slate-500/80 to-transparent" />

            <h1 className="font-serif text-2xl md:text-3xl font-light tracking-heading text-white">
              Website Under Maintenance
            </h1>
            <p className="mt-2 text-sm tracking-[0.2em] text-slate-400 uppercase">
              网站升级维护中
            </p>

            <p className="mt-8 text-sm md:text-base leading-relaxed text-slate-300/90">
              {message}
            </p>

            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-slate-500">
                Contact
              </p>
              <ul className="space-y-4 text-sm">
                <ContactRow
                  icon={Mail}
                  label="Email"
                  href={`mailto:${contacts.email}`}
                  value={contacts.email}
                />
                <ContactRow
                  icon={Phone}
                  label="Phone"
                  href={`tel:${contacts.phone.replace(/\s/g, "")}`}
                  value={contacts.phone}
                />
                <ContactRow
                  icon={MessageCircle}
                  label="WhatsApp"
                  href={whatsAppHref}
                  value={contacts.whatsAppPhone.replace(/^86/, "+86 ")}
                  external
                />
                <ContactRow
                  icon={MessageCircle}
                  label={contacts.weChatLabel}
                  value={contacts.weChatValue}
                />
              </ul>
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-10 inline-flex w-full items-center justify-center gap-2 border border-white/15 bg-white/[0.03] px-5 py-3 text-xs uppercase tracking-[0.25em] text-slate-200 transition hover:border-slate-400/40 hover:bg-white/[0.06]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh Page
            </button>
          </div>

          <p className="mt-8 text-center text-[10px] tracking-[0.2em] text-slate-600 uppercase">
            Professional Audio Systems · dBsource
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-slate-200">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="flex gap-3 rounded-sm transition hover:text-white"
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li className="flex gap-3">
      {content}
    </li>
  );
}
