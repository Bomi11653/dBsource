"use client";

import type { ContactInfo } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import { useI18n } from "@/components/I18nProvider";
import BrowseGuide from "@/components/BrowseGuide";
import SalesContactCards from "@/components/SalesContactCards";
import { isAllowedAmapEmbedUrl, resolveMapNavUrl } from "@/lib/amap-map";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

  const mapEmbedUrl = contact.mapEmbedUrl?.trim() ?? "";
  const showMapEmbed = Boolean(mapEmbedUrl && isAllowedAmapEmbedUrl(mapEmbedUrl));
  const mapDisplayAddress =
    contact.mapDisplayAddress[locale] || contact.address[locale];
  const mapNavUrl = useMemo(
    () => resolveMapNavUrl(contact.mapNavUrl, contact.mapQuery),
    [contact.mapNavUrl, contact.mapQuery]
  );

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

  return (
    <div className="bg-black text-white">
      <section className="pt-24 sm:pt-28 pb-12 page-x text-center hero-fade-in">
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-light leading-snug">{t.contact.title}</h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">{t.contact.subtitle}</p>
        <BrowseGuide
          title={t.guide.exploreTitle}
          items={[
            { label: t.guide.contactForm, targetId: "contact-form" },
            { label: t.guide.contactInfo, targetId: "contact-info" },
            ...(salesContacts.length
              ? [{ label: t.contact.salesTitle, targetId: "contact-sales" }]
              : []),
            { label: t.guide.productsSpeaker, href: "/products" },
          ]}
          layout="stack"
          className="mt-8 items-center"
        />
      </section>

      <section id="contact-form" className="page-x pb-12 scroll-mt-nav">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="space-y-6 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-5">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
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
              <input name="name" required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t.contact.company}</label>
              <input name="company" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.contact.email}</label>
                <input name="email" type="email" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.contact.phone}</label>
                <input name="phone" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
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
                className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-brand-gold/90 text-black font-medium hover:bg-brand-gold transition-colors disabled:opacity-60 touch-active"
              >
                {loading ? t.contact.sending : t.contact.submit}
              </button>
            )}
            </form>
          </div>

          <div id="contact-info" className="space-y-6 scroll-mt-nav min-w-0">
            <div className="rounded-2xl border border-white/10 p-5 sm:p-8 space-y-4 overflow-hidden">
              <h2 className="text-xl font-medium break-words">{contact.company[locale]}</h2>
              <p className="text-gray-400 text-sm leading-relaxed break-words">{contact.address[locale]}</p>
              <div className="space-y-2 text-sm min-w-0">
                {contact.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="block text-brand-gold hover:underline break-all">
                    {phone}
                  </a>
                ))}
                <a href={`mailto:${contact.email}`} className="block text-gray-300 hover:text-white break-all">
                  {contact.email}
                </a>
              </div>
            </div>

            {showMapEmbed ? (
              <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[4/3] sm:aspect-[16/10] bg-black">
                <iframe
                  title={contact.company[locale]}
                  src={mapEmbedUrl}
                  className="w-full h-full min-h-[200px] sm:min-h-[240px] border-0 grayscale opacity-80"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[4/3] sm:aspect-[16/10] min-h-[200px] sm:min-h-[240px] bg-gradient-to-b from-white/[0.04] via-black to-black flex flex-col items-center justify-center gap-5 p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-md">
                  {mapDisplayAddress}
                </p>
                {mapNavUrl ? (
                  <a
                    href={mapNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center px-6 rounded-xl border border-brand-gold/40 bg-brand-gold/10 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-colors touch-active"
                  >
                    {t.contact.openMapNav}
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <SalesContactCards contacts={salesContacts} />
      </section>
    </div>
  );
}
