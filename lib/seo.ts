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
    },
    alternates: { canonical: url },
  };
}
