import type { Metadata } from "next";
import type { CaseItem, Product } from "@/data/mock";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.dbsourceaudio.com";

export const siteConfig = {
  name: "dBsource",
  title: "dBsource | 专业音响品牌官网",
  description:
    "dBsource 专业音响系统 — WebGL 品牌官网、产品中心、工程案例、软件下载与工程服务。东莞新声电子科技有限公司。",
  url: siteUrl.replace(/\/$/, ""),
  locale: "zh_CN",
};

export function pageMetadata(
  title: string,
  description: string,
  path = "",
  imageUrl?: string
): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = imageUrl || `${siteConfig.url}/images/cases/cases-hero-bg.png`;
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
    alternateName: "dBsource",
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

export function productJsonLd(product: Product, locale: "zh" | "en" = "zh") {
  const image = product.image?.startsWith("http")
    ? product.image
    : product.image
      ? `${siteConfig.url}${product.image.startsWith("/") ? "" : "/"}${product.image}`
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description: product.desc[locale],
    sku: product.model,
    brand: {
      "@type": "Brand",
      name: "dBsource",
    },
    ...(image ? { image: [image] } : {}),
    url: `${siteConfig.url}/products/${product.id}`,
  };
}

export function caseJsonLd(caseItem: CaseItem, locale: "zh" | "en" = "zh") {
  const image = caseItem.image?.startsWith("http")
    ? caseItem.image
    : caseItem.image
      ? `${siteConfig.url}${caseItem.image.startsWith("/") ? "" : "/"}${caseItem.image}`
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: caseItem.title[locale],
    description: caseItem.desc[locale],
    ...(image ? { image: [image] } : {}),
    url: `${siteConfig.url}/cases/${caseItem.id}`,
    author: {
      "@type": "Organization",
      name: "dBsource",
    },
  };
}
