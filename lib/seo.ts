import type { Metadata } from "next";
import type { CaseItem, Product } from "@/data/mock";
import { formatProductHeading } from "@/lib/product-display";
import { getCaseCoverUrl } from "@/lib/case-media";
import { getCaseOverviewExcerpt, getCaseProjectOverview } from "@/lib/case-project-overview";
import { resolveBrowserMediaUrl } from "@/lib/media-url";

/** 生产环境默认正式域名（env 未配置时的 fallback） */
export const PRODUCTION_SITE_URL = "https://www.dbsource-pro.com";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL;

const DEFAULT_OG_IMAGE = "/images/cases/cases-hero-bg.png";

export const siteConfig = {
  name: "dBsource",
  title: "dBsource | 专业音响品牌官网",
  titleEn: "dBsource | Professional Audio Systems",
  description:
    "dBsource 专业音响系统 — 产品中心、工程案例、软件下载与工程服务。东莞新声电子科技有限公司。",
  descriptionEn:
    "dBsource professional audio — products, engineering case studies, software downloads and integration services. Dongguan Xinsheng Electronics.",
  url: siteUrl.replace(/\/$/, ""),
  locale: "zh_CN",
  localeAlternate: "en_US",
};

export type LocaleSeo = { title: string; description: string };
export type BilingualSeo = { zh: LocaleSeo; en: LocaleSeo };

/** 静态页面中英文 SEO 文案 */
export const PAGE_SEO = {
  home: {
    zh: {
      title: "dBsource | 专业音响品牌官网",
      description:
        "dBsource 专业音响系统 — 线阵列音箱、工程案例、调音软件下载与系统集成服务。东莞新声电子科技有限公司。",
    },
    en: {
      title: "dBsource | Professional Audio Brand",
      description:
        "dBsource professional audio systems — line arrays, case studies, software downloads and system integration. Dongguan Xinsheng Electronics.",
    },
  },
  products: {
    zh: {
      title: "产品中心",
      description:
        "dBsource 专业音响产品目录 — 线阵列、超低音、返听、音柱及电子周边与软件。",
    },
    en: {
      title: "Products",
      description:
        "dBsource product catalog — line arrays, subwoofers, monitors, columns, electronics and software.",
    },
  },
  cases: {
    zh: {
      title: "工程案例",
      description:
        "体育场、演艺空间、会展中心等专业音响工程案例与系统解决方案。",
    },
    en: {
      title: "Case Studies",
      description:
        "Professional audio installations for stadiums, venues, convention centers and touring applications.",
    },
  },
  downloads: {
    zh: {
      title: "下载中心",
      description:
        "dBsource 调音软件、系统配置工具、产品画册与技术资料下载。",
    },
    en: {
      title: "Downloads",
      description:
        "Download dBsource tuning software, system tools, product catalogs and technical resources.",
    },
  },
  contact: {
    zh: {
      title: "联系我们",
      description:
        "联系 dBsource — 产品咨询、工程合作与技术支持。东莞新声电子科技有限公司。",
    },
    en: {
      title: "Contact",
      description:
        "Contact dBsource for product inquiries, project collaboration and technical support.",
    },
  },
  about: {
    zh: {
      title: "关于我们",
      description:
        "dBsource 品牌起源、系统解决方案、Focus 声学软件与 unit48 DSP 硬件平台。",
    },
    en: {
      title: "About Us",
      description:
        "dBsource brand story, system solutions, Focus acoustic software and unit48 DSP hardware.",
    },
  },
  configurator: {
    zh: {
      title: "智能选型",
      description: "Live House、体育馆、会议礼堂等专业扩声系统免费选型工具。",
    },
    en: {
      title: "System Configurator",
      description:
        "Free sound system configurator for live venues, stadiums and conference halls.",
    },
  },
} as const satisfies Record<string, BilingualSeo>;

/** 分享图必须为绝对 URL（微信 / Twitter / OG 爬虫） */
export function resolveOgImageUrl(imageUrl?: string): string {
  const fallback = `${siteConfig.url}${DEFAULT_OG_IMAGE}`;
  if (!imageUrl?.trim()) return fallback;

  const resolved = resolveBrowserMediaUrl(imageUrl.trim());
  if (!resolved) return fallback;

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }

  if (resolved.startsWith("/")) {
    return `${siteConfig.url}${resolved}`;
  }

  return `${siteConfig.url}/${resolved}`;
}

type PageMetadataOptions = {
  /** 首页等已含品牌名的标题，避免与 layout template 重复 */
  absoluteTitle?: boolean;
};

export function pageMetadata(
  copy: BilingualSeo,
  path = "",
  imageUrl?: string,
  options?: PageMetadataOptions
): Metadata {
  const { zh, en } = copy;
  const url = `${siteConfig.url}${path}`;
  const ogImage = resolveOgImageUrl(imageUrl);

  const title: Metadata["title"] = options?.absoluteTitle
    ? { absolute: zh.title }
    : zh.title;

  return {
    title,
    description: zh.description,
    keywords: [
      "专业音响",
      "线阵列",
      "dBsource",
      "音响工程",
      "东莞新声电子",
      "professional audio",
      "line array",
    ],
    openGraph: {
      title: zh.title,
      description: zh.description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      alternateLocale: [siteConfig.localeAlternate],
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: zh.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: zh.title,
      description: zh.description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": url,
        en: url,
      },
    },
    other: {
      "og:title:en": en.title,
      "og:description:en": en.description,
      "title-en": en.title,
      "description-en": en.description,
    },
  };
}

export function productPageMetadata(product: Product): Metadata {
  return pageMetadata(
    {
      zh: {
        title: formatProductHeading(product, "zh"),
        description: product.desc.zh,
      },
      en: {
        title: formatProductHeading(product, "en"),
        description: product.desc.en,
      },
    },
    `/products/${product.id}`,
    product.image
  );
}

export function casePageMetadata(caseItem: CaseItem): Metadata {
  return pageMetadata(
    {
      zh: {
        title: caseItem.title.zh,
        description: getCaseOverviewExcerpt(caseItem, "zh", 160),
      },
      en: {
        title: caseItem.title.en,
        description: getCaseOverviewExcerpt(caseItem, "en", 160),
      },
    },
    `/cases/${caseItem.id}`,
    getCaseCoverUrl(caseItem)
  );
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
  const image = resolveOgImageUrl(product.image);

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
    image: [image],
    url: `${siteConfig.url}/products/${product.id}`,
  };
}

export function caseJsonLd(caseItem: CaseItem, locale: "zh" | "en" = "zh") {
  const image = resolveOgImageUrl(getCaseCoverUrl(caseItem));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: caseItem.title[locale],
    description: getCaseProjectOverview(caseItem, locale),
    image: [image],
    url: `${siteConfig.url}/cases/${caseItem.id}`,
    author: {
      "@type": "Organization",
      name: "dBsource",
    },
    publisher: {
      "@type": "Organization",
      name: "东莞新声电子科技有限公司",
      alternateName: "dBsource",
    },
  };
}
