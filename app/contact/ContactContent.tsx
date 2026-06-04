"use client";

import { contactInfo } from "@/data/mock";
import { qrCodes } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { SafeImageContain } from "@/components/SafeImage";
import { FormEvent, useState } from "react";

export default function ContactContent() {
  const { locale, t } = useI18n();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(contactInfo.mapQuery)}&output=embed&z=15`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
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
        }),
      });
      const data = await res.json();
      if (data.ok) setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-black text-white">
      <section className="pt-32 pb-16 px-6 text-center hero-fade-in">
        <h1 className="text-4xl md:text-6xl font-light">{t.contact.title}</h1>
        <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">{t.contact.subtitle}</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-16 grid md:grid-cols-2 gap-10 md:gap-14">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white/5 border border-white/10 p-8 rounded-2xl reveal-on-scroll"
        >
          <h2 className="text-lg font-light mb-2">{t.contact.formTitle}</h2>
          <input
            name="name"
            required
            placeholder={t.contact.name}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 focus:border-brand-gold/50 outline-none"
          />
          <input
            name="phone"
            type="tel"
            placeholder={t.contact.tel}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 focus:border-brand-gold/50 outline-none"
          />
          <input
            name="email"
            type="email"
            placeholder={t.contact.email}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 focus:border-brand-gold/50 outline-none"
          />
          <input
            name="company"
            placeholder={t.contact.company}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 focus:border-brand-gold/50 outline-none"
          />
          <textarea
            name="message"
            required
            rows={4}
            placeholder={t.contact.message}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 focus:border-brand-gold/50 outline-none resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-gold/90 text-black font-medium tracking-wider hover:bg-brand-gold transition-colors disabled:opacity-50"
          >
            {loading ? "..." : t.contact.submit}
          </button>
          {sent && <p className="text-green-400 text-sm text-center">{t.contact.success}</p>}
        </form>

        <div className="space-y-6 reveal-on-scroll">
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-white/10">
            <iframe
              title="map"
              src={mapSrc}
              className="absolute inset-0 w-full h-full border-0 grayscale opacity-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-gray-300">
            <p className="text-white font-light text-lg">{contactInfo.company[locale]}</p>
            {contactInfo.phones.map((phone) => (
              <p key={phone}>
                <span className="text-gray-500">{t.contact.phone}：</span>
                <a href={`tel:${phone}`} className="hover:text-brand-gold ml-1">
                  {phone}
                </a>
              </p>
            ))}
            <p>
              <span className="text-gray-500">{t.contact.email}：</span>
              <a href={`mailto:${contactInfo.email}`} className="hover:text-brand-gold ml-1">
                {contactInfo.email}
              </a>
            </p>
            <p>
              <span className="text-gray-500">{t.contact.address}：</span>
              {contactInfo.address[locale]}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <p className="text-center text-xs text-gray-500 tracking-[0.3em] uppercase mb-8">
          {t.contact.qrTitle}
        </p>
        <div className="flex justify-center gap-6 overflow-x-auto pb-4">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="flex flex-col items-center gap-2 shrink-0 group">
              <SafeImageContain
                src={qr.image}
                alt={qr.label[locale]}
                size={112}
                className="rounded-xl border border-white/10 transition-transform group-hover:scale-105"
              />
              <span className="text-xs text-gray-500">{qr.label[locale]}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center px-6 pb-12">{t.contact.disclaimer}</p>
    </div>
  );
}
