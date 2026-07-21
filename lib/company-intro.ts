import type { ContactInfo, Locale } from "@/data/mock";

/** 品牌/公司介绍 — 唯一来源：CMS contact-info.footerIntroZh/En（Mock 见 contactInfo） */
export function getCompanyIntro(contact: ContactInfo, locale: Locale): string {
  return (
    contact.footerIntro[locale]?.trim() ||
    contact.footerIntro[locale === "zh" ? "en" : "zh"]?.trim() ||
    ""
  );
}
