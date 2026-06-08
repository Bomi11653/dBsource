"use client";

import type { ContactInfo } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import BrowseGuide from "@/components/BrowseGuide";
import SalesContactCards from "@/components/SalesContactCards";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ContactContent({ contact }: { contact: ContactInfo }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const productModel = searchParams.get("product") ?? "";
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mapSrc =`https://www.google.com/maps?q=${encodeURIComponent(contact.mapQuery)}&output=embed&z=15`;
  const defaultMessage = productModel
    ? locale === "zh"
      ? `我想咨询产品型号：${productModel}`
      : `I would like to inquire about model: ${productModel}`
    : "";

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
            { label: t.contact.salesTitle, targetId: "contact-sales" },
            { label: t.guide.productsSpeaker, href: "/products" },
          ]}
          className="mt-8 justify-center"
        />
      </section>

      <section id="contact-form" className="page-x pb-16 scroll-mt-nav">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-8">
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
                className="min-h-[48px] px-8 rounded-xl bg-brand-gold/90 text-black font-medium hover:bg-brand-gold transition-colors disabled:opacity-60 touch-active"
              >
                {loading ? t.contact.sending : t.contact.submit}
              </button>
            )}
            </form>
          </div>

          <div id="contact-info" className="space-y-8 scroll-mt-nav">
            <div className="rounded-2xl border border-white/10 p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-medium">{contact.company[locale]}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{contact.address[locale]}</p>
              <div className="space-y-2 text-sm">
                {contact.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="block text-brand-gold hover:underline">
                    {phone}
                  </a>
                ))}
                <a href={`mailto:${contact.email}`} className="block text-gray-300 hover:text-white">
                  {contact.email}
                </a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[16/10]">
              <iframe
                title={contact.company[locale]}
                src={mapSrc}
                className="w-full h-full min-h-[240px] border-0 grayscale opacity-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <SalesContactCards />
      </section>
    </div>
  );
}
