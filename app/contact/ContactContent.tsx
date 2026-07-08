"use client";

import type { ContactInfo } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import { useI18n } from "@/components/I18nProvider";
import BrowseGuide from "@/components/BrowseGuide";
import SalesContactCards from "@/components/SalesContactCards";
import { resolveMapEmbedSrc, resolveMapNavUrl } from "@/lib/amap-map";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";

function SectionHeading({
  eyebrow,
  title,
  description,
  compact,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-3 sm:mb-4" : "mb-5 sm:mb-6"}>
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-2">{eyebrow}</p>
      ) : null}
      <h2 className="text-lg sm:text-xl font-medium text-white">{title}</h2>
      {description ? (
        <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

function MapNavButton({ href, className = "" }: { href: string; className?: string }) {
  const { t } = useI18n();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 px-6 rounded-xl border border-brand-gold/40 bg-brand-gold/10 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-colors touch-active ${className}`}
    >
      <Navigation size={16} aria-hidden />
      {t.contact.openMapNav}
    </a>
  );
}

const MAP_HEIGHT_CLASS = "h-[260px] lg:h-[320px]";

export default function ContactContent({
  contact,
  salesContacts,
}: {
  contact: ContactInfo;
  salesContacts: SalesContactItem[];
}) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const productModel = searchParams.get("product") ?? "";
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState({
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    landingPage: "",
    referrer: "",
    language: locale === "zh" ? "zh-CN" : "en",
  });

  const mapDisplayAddress =
    contact.mapDisplayAddress[locale] || contact.address[locale];
  const mapEmbedSrc = useMemo(
    () => resolveMapEmbedSrc(contact.mapEmbedUrl),
    [contact.mapEmbedUrl]
  );
  const showMapEmbed = Boolean(mapEmbedSrc);
  const mapNavUrl = useMemo(
    () => resolveMapNavUrl(contact.mapNavUrl, contact.mapQuery, mapDisplayAddress),
    [contact.mapNavUrl, contact.mapQuery, mapDisplayAddress]
  );
  const showMapNavButton = Boolean(mapNavUrl);

  const defaultMessage = productModel
    ? locale === "zh"
      ? `我想咨询产品型号：${productModel}`
      : `I would like to inquire about model: ${productModel}`
    : "";

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setTracking({
      utmSource: query.get("utm_source") ?? "",
      utmMedium: query.get("utm_medium") ?? "",
      utmCampaign: query.get("utm_campaign") ?? "",
      utmTerm: query.get("utm_term") ?? "",
      utmContent: query.get("utm_content") ?? "",
      landingPage: window.location.href,
      referrer: document.referrer || "",
      language: navigator.language || (locale === "zh" ? "zh-CN" : "en"),
    });
  }, [locale]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);
    const fd = new FormData(e.currentTarget);

    const honeypot = String(fd.get("website") ?? "");
    if (honeypot) {
      setLoading(false);
      setSent(true);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          company: fd.get("company"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          product: fd.get("product") || undefined,
          utmSource: tracking.utmSource,
          utmMedium: tracking.utmMedium,
          utmCampaign: tracking.utmCampaign,
          utmTerm: tracking.utmTerm,
          utmContent: tracking.utmContent,
          landingPage: tracking.landingPage,
          referrer: tracking.referrer,
          language: tracking.language,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
      } else {
        setError(data.message || t.contact.submitError);
      }
    } catch {
      setError(t.contact.submitError);
    } finally {
      setLoading(false);
    }
  }

  const guideItems = [
    { label: t.guide.contactInfo, targetId: "contact-info" },
    ...(salesContacts.length
      ? [{ label: t.contact.salesTitle, targetId: "contact-sales" }]
      : []),
    { label: t.contact.mapSectionTitle, targetId: "contact-map" },
    { label: t.guide.contactForm, targetId: "contact-form" },
  ];

  const companyCard = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4 overflow-hidden min-w-0">
      <h3 className="text-base sm:text-lg font-medium break-words">{contact.company[locale]}</h3>

      <div className="flex gap-3 min-w-0">
        <MapPin size={18} className="text-brand-gold/80 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed break-words">
            {contact.address[locale]}
          </p>
          {showMapNavButton ? <MapNavButton href={mapNavUrl} /> : null}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t.contact.tel}</p>
          {contact.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-sm text-brand-gold hover:underline break-all touch-active"
            >
              <Phone size={15} className="shrink-0" aria-hidden />
              <span className="tabular-nums tracking-wide">{phone}</span>
            </a>
          ))}
        </div>
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t.contact.email}</p>
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white break-all touch-active"
          >
            <Mail size={15} className="shrink-0" aria-hidden />
            {contact.email}
          </a>
        </div>
      </div>
    </div>
  );

  const mapCard = (
    <div className="space-y-3 min-w-0">
      {showMapEmbed ? (
        <div
          className={`rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 ${MAP_HEIGHT_CLASS} w-full`}
        >
          <iframe
            title={contact.company[locale]}
            src={mapEmbedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className={`rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 text-center ${MAP_HEIGHT_CLASS} w-full`}
        >
          {mapDisplayAddress ? (
            <p className="text-sm text-gray-400 leading-relaxed max-w-md break-words">
              {mapDisplayAddress}
            </p>
          ) : null}
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
            {t.contact.mapNotConfigured}
          </p>
          {showMapNavButton ? <MapNavButton href={mapNavUrl} /> : null}
        </div>
      )}
      {showMapEmbed && showMapNavButton ? <MapNavButton href={mapNavUrl} /> : null}
    </div>
  );

  const contactForm = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 min-w-0">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        {productModel ? (
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t.contact.productLabel}</label>
            <input
              name="product"
              defaultValue={productModel}
              readOnly
              className="w-full rounded-xl border border-brand-gold/30 bg-brand-gold/5 px-4 py-3 text-sm text-brand-gold"
            />
          </div>
        ) : null}
        <div>
          <label className="block text-sm text-gray-400 mb-2">{t.contact.name}</label>
          <input
            name="name"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">{t.contact.company}</label>
          <input
            name="company"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-sm text-gray-400 mb-2">{t.contact.email}</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm text-gray-400 mb-2">{t.contact.phone}</label>
            <input
              name="phone"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">{t.contact.message}</label>
          <textarea
            name="message"
            required
            rows={5}
            defaultValue={defaultMessage}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm resize-y min-h-[120px]"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {sent ? (
          <p className="text-sm text-brand-gold">{t.contact.sent}</p>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-8 rounded-xl bg-brand-gold/90 text-black font-medium hover:bg-brand-gold transition-colors disabled:opacity-60 touch-active"
          >
            {loading ? t.contact.sending : t.contact.submit}
          </button>
        )}
      </form>
    </div>
  );

  return (
    <div className="bg-black text-white overflow-x-hidden">
      <section className="pt-24 sm:pt-28 pb-6 sm:pb-8 page-x text-center hero-fade-in">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-light leading-snug">{t.contact.title}</h1>
        <p className="text-gray-400 mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          {t.contact.subtitle}
        </p>
        <BrowseGuide
          title={t.guide.exploreTitle}
          items={guideItems}
          layout="stack"
          className="mt-6 sm:mt-8 items-center"
        />
      </section>

      <div className="page-x pb-8 md:pb-12">
        <div className="mx-auto max-w-6xl min-w-0">
          {/* 桌面端：左表单 + 右联系信息与地图 */}
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-8 lg:items-start">
            <section id="contact-form" className="scroll-mt-nav min-w-0">
              <SectionHeading
                title={t.contact.formTitle}
                description={t.contact.formSubtitle}
                compact
              />
              {contactForm}
            </section>

            <aside className="space-y-6 min-w-0">
              <section id="contact-info" className="scroll-mt-nav min-w-0">
                <SectionHeading title={t.contact.companySectionTitle} compact />
                {companyCard}
              </section>

              <section id="contact-map" className="scroll-mt-nav min-w-0">
                <SectionHeading
                  title={t.contact.mapSectionTitle}
                  description={mapDisplayAddress}
                  compact
                />
                {mapCard}
              </section>
            </aside>
          </div>

          {salesContacts.length > 0 ? (
            <section id="contact-sales" className="hidden lg:block mt-8 lg:mt-10 scroll-mt-nav min-w-0">
              <SalesContactCards contacts={salesContacts} />
            </section>
          ) : null}

          {/* 移动端：公司信息 → 销售顾问 → 地图 → 表单 */}
          <div className="grid gap-6 lg:hidden">
            <section id="contact-info" className="scroll-mt-nav min-w-0">
              <SectionHeading title={t.contact.companySectionTitle} compact />
              {companyCard}
            </section>

            {salesContacts.length > 0 ? (
              <section id="contact-sales" className="scroll-mt-nav min-w-0">
                <SalesContactCards contacts={salesContacts} />
              </section>
            ) : null}

            <section id="contact-map" className="scroll-mt-nav min-w-0">
              <SectionHeading
                title={t.contact.mapSectionTitle}
                description={mapDisplayAddress}
                compact
              />
              {mapCard}
            </section>

            <section id="contact-form" className="scroll-mt-nav min-w-0">
              <SectionHeading
                title={t.contact.formTitle}
                description={t.contact.formSubtitle}
                compact
              />
              {contactForm}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
