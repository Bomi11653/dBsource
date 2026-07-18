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
    description: { zh: "应用场景条目（当前首页仅 Hero，以下配置暂不在前台展示）", en: "Scene entries (homepage shows Hero only; blocks below not live yet)" },
    href: "/admin/home",
    previewHref: "/",
    strapiPath: "/content-manager/collection-types/api::scene.scene",
    countKey: "scenes",
    icon: "home",
  },
  {
    id: "series",
    title: { zh: "产品系列", en: "Series" },
    description: { zh: "CMS 系列数据（导航由产品 productLine 控制，此处暂不影响前台）", en: "CMS series records (nav uses product productLine; not wired to frontend nav)" },
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
    id: "status",
    title: { zh: "系统状态", en: "Status" },
    description: { zh: "CMS 连接、数据源与内容统计", en: "CMS health and data source" },
    href: "/admin/status",
    strapiPath: "",
    icon: "status",
  },
  {
    id: "leads",
    title: { zh: "线索管理", en: "Leads" },
    description: { zh: "询盘筛选、分配、状态流转", en: "Lead triage, assignment and pipeline" },
    href: "/admin/leads",
    strapiPath: "/content-manager/collection-types/api::lead.lead",
    countKey: "leads",
    icon: "target",
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

const PRODUCTION_CMS_URL = "https://cms.dbsource-pro.com";

export function strapiAdminUrl(path: string) {
  const fallback =
    process.env.NODE_ENV === "production" ? PRODUCTION_CMS_URL : "http://localhost:1337";
  const base = (process.env.NEXT_PUBLIC_CMS_URL || fallback).replace(/\/$/, "");
  return `${base}/admin${path}`;
}
