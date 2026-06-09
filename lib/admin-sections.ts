export type AdminSection = {
  id: string;
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  href: string;
  strapiPath: string;
  previewHref?: string;
  countKey?: keyof AdminStats;
  icon: string;
};

export type AdminStats = {
  products: number;
  cases: number;
  downloads: number;
  scenes: number;
  qrCodes: number;
  aboutSections: number;
  leads: number;
  productSeries: number;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "home",
    title: { zh: "首页", en: "Home" },
    description: { zh: "应用场景、核心产品、精选案例", en: "Scenes, featured products & cases" },
    href: "/admin/home",
    previewHref: "/",
    strapiPath: "/content-manager/collection-types/api::scene.scene",
    countKey: "scenes",
    icon: "home",
  },
  {
    id: "series",
    title: { zh: "产品系列", en: "Series" },
    description: { zh: "导航系列增删、排序与显示", en: "Manage nav series visibility & order" },
    href: "/admin/series",
    previewHref: "/products",
    strapiPath: "/content-manager/collection-types/api::product-series.product-series",
    countKey: "productSeries",
    icon: "layers",
  },
  {
    id: "products",
    title: { zh: "产品中心", en: "Products" },
    description: { zh: "55+ 产品型号与图集", en: "Product catalog & galleries" },
    href: "/admin/products",
    previewHref: "/products",
    strapiPath: "/content-manager/collection-types/api::product.product",
    countKey: "products",
    icon: "package",
  },
  {
    id: "cases",
    title: { zh: "工程案例", en: "Cases" },
    description: { zh: "案例封面与现场图集", en: "Case studies & galleries" },
    href: "/admin/cases",
    previewHref: "/cases",
    strapiPath: "/content-manager/collection-types/api::case.case",
    countKey: "cases",
    icon: "briefcase",
  },
  {
    id: "downloads",
    title: { zh: "下载中心", en: "Downloads" },
    description: { zh: "软件与画册文件", en: "Software & catalog files" },
    href: "/admin/downloads",
    previewHref: "/downloads",
    strapiPath: "/content-manager/collection-types/api::download.download",
    countKey: "downloads",
    icon: "download",
  },
  {
    id: "about",
    title: { zh: "关于我们", en: "About" },
    description: { zh: "品牌故事与配图", en: "Brand story images" },
    href: "/admin/about",
    previewHref: "/about",
    strapiPath: "/content-manager/collection-types/api::about-section.about-section",
    countKey: "aboutSections",
    icon: "info",
  },
  {
    id: "contact",
    title: { zh: "联系我们", en: "Contact" },
    description: { zh: "联系方式与询盘", en: "Contact info & leads" },
    href: "/admin/contact",
    previewHref: "/contact",
    strapiPath: "/content-manager/single-types/api::contact-info.contact-info",
    countKey: "leads",
    icon: "mail",
  },
  {
    id: "qr",
    title: { zh: "二维码", en: "QR Codes" },
    description: { zh: "页脚与联系页社交码", en: "Footer & contact QR codes" },
    href: "/admin/qr",
    previewHref: "/contact",
    strapiPath: "/content-manager/collection-types/api::qr-code.qr-code",
    countKey: "qrCodes",
    icon: "qr",
  },
];

export function strapiAdminUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337").replace(/\/$/, "");
  return `${base}/admin${path}`;
}
