"use client";

import type { ContactInfo } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import { useI18n } from "@/components/I18nProvider";
import BrowseGuide from "@/components/BrowseGuide";
import ContactDetailsLayout from "@/components/contact/ContactDetailsLayout";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SectionHeading({
  title,
  description,
  compact,
}: {
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-3 sm:mb-4" : "mb-5 sm:mb-6"}>
      <h2 className="text-lg sm:text-xl font-medium text-white">{title}</h2>
      {description ? (
        <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

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
    <div className="contact-page bg-black text-white overflow-x-hidden">
      <section className="pt-24 sm:pt-28 pb-6 sm:pb-8 page-x text-center">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-light leading-snug">{t.contact.title}</h1>
        <p className="text-gray-400 mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          {t.contact.subtitle}
        </p>
        <BrowseGuide
          title={t.guide.exploreTitle}
          items={guideItems}
          align="center"
          className="mt-6 sm:mt-8"
        />
      </section>

      <div className="page-x pb-page-safe md:pb-12">
        <div className="mx-auto max-w-6xl min-w-0">
          <ContactDetailsLayout
            contact={contact}
            salesContacts={salesContacts}
            variant="contact"
            formSlot={
              <section id="contact-form" className="scroll-mt-nav min-w-0">
                <SectionHeading
                  title={t.contact.formTitle}
                  description={t.contact.formSubtitle}
                  compact
                />
                {contactForm}
              </section>
            }
          />
        </div>
      </div>
    </div>
  );
}
