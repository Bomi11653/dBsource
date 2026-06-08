import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dbsource.com";

export const siteConfig = {
  name: "dBsource Pro",
  title: "dBsource Pro | 专业音响品牌官网",
  description:
    "dBsource 专业音响系统 — WebGL 品牌官网、产品中心、工程案例、软件下载与工程服务。东莞新声电子科技有限公司。",
  url: siteUrl,
  locale: "zh_CN",
};

export function pageMetadata(
  title: string,
  description: string,
  path = ""
): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = `${siteConfig.url}/images/cases/cases-hero-bg.png`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "东莞新声电子科技有限公司",
    alternateName: "dBsource Pro",
    url: siteConfig.url,
    email: "939611016@qq.com",
    telephone: "+86-15362862396",
    address: {
      "@type": "PostalAddress",
      streetAddress: "莫屋新丰西三路1号",
      addressLocality: "东莞市",
      addressRegion: "广东省",
      addressCountry: "CN",
    },
  };
}
