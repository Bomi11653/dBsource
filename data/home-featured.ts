import type { CaseItem, Product } from "./mock";
import { PRODUCT_SPEC_SHEETS, type ProductSpecSheet } from "./product-specs";
import { getCaseCoverUrl } from "@/lib/case-media";

export type HomeFeaturedSpecPage = {
  model: string;
  sheet: ProductSpecSheet;
};

export type HomeFeaturedProduct = {
  id: string;
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  models: { zh: string; en: string };
  image: string;
  specPages: HomeFeaturedSpecPage[];
  detailHref: string;
};

export const HOME_FEATURED_PRODUCTS: HomeFeaturedProduct[] = [
  {
    id: "v212",
    name: { zh: "V212 线阵列", en: "V212 Line Array" },
    desc: {
      zh: "三频线阵列模块，搭配 V221S 超低音箱",
      en: "3-way line array module, paired with V221S subwoofers",
    },
    models: { zh: "V212 · V221S", en: "V212 · V221S" },
    image: "/images/products/home-v212.png",
    specPages: [
      { model: "V212", sheet: PRODUCT_SPEC_SHEETS.V212 },
      { model: "V221S", sheet: PRODUCT_SPEC_SHEETS.V221S },
    ],
    detailHref: "/products/44",
  },
  {
    id: "vit",
    name: { zh: "VIT 音响系统", en: "VIT Sound System" },
    desc: {
      zh: "V12 线阵列搭配 V18 超低，巡演级流动演出系统",
      en: "V12 line arrays with V18 subs — tour-grade mobile PA",
    },
    models: { zh: "V12 · V18 · V415A", en: "V12 · V18 · V415A" },
    image: "/images/products/home-vit.png",
    specPages: [
      { model: "VIT", sheet: PRODUCT_SPEC_SHEETS.VIT },
      { model: "V12", sheet: PRODUCT_SPEC_SHEETS.V12 },
      { model: "V18", sheet: PRODUCT_SPEC_SHEETS.V18 },
      { model: "V415A", sheet: PRODUCT_SPEC_SHEETS.V415A },
    ],
    detailHref: "/products/46",
  },
];

export function resolveProductHref(
  products: Product[],
  modelHint: string,
  fallbackId: number
): string {
  const hint = modelHint.toUpperCase();
  const match =
    products.find((p) => p.model.toUpperCase() === hint) ||
    products.find((p) => p.model.toUpperCase().startsWith(hint)) ||
    products.find(
      (p) => p.name.en.toUpperCase().includes(hint) || p.name.zh.includes(modelHint)
    );
  return match ? `/products/${match.id}` : `/products/${fallbackId}`;
}

export function buildHomeFeaturedProducts(products: Product[]): HomeFeaturedProduct[] {
  return HOME_FEATURED_PRODUCTS.map((item) => ({
    ...item,
    detailHref:
      item.id === "v212"
        ? resolveProductHref(products, "V212", 44)
        : resolveProductHref(products, "VIT", 46),
  }));
}

function buildFromProduct(product: Product): HomeFeaturedProduct {
  return {
    id: `product-${product.id}`,
    name: product.name,
    desc: product.desc,
    models: { zh: product.model, en: product.model },
    image: product.image,
    specPages: [],
    detailHref: `/products/${product.id}`,
  };
}

export function buildHomeFeaturedProductsByIds(
  products: Product[],
  preferredIds?: number[]
): HomeFeaturedProduct[] {
  const selected = (preferredIds ?? [])
    .map((id) => products.find((product) => product.id === id))
    .filter((item): item is Product => Boolean(item));
  const used = new Set(selected.map((item) => item.id));
  const fallback = products.filter((item) => !used.has(item.id)).slice(0, Math.max(0, 2 - selected.length));
  const merged = [...selected, ...fallback].slice(0, 2);
  if (!merged.length) {
    return buildHomeFeaturedProducts(products);
  }
  return merged.map(buildFromProduct);
}

export function getHomeFeaturedCase(cases: CaseItem[]): CaseItem | undefined {
  return cases.find((c) => c.id === 6) ?? cases[0];
}

function resolveFeaturedBaseCase(
  cases: CaseItem[],
  override?: {
    caseId?: number;
    title?: { zh: string; en: string };
  }
): CaseItem | null {
  if (override?.caseId != null) {
    const byId = cases.find((c) => c.id === override.caseId);
    if (byId) return byId;
  }
  const titleZh = override?.title?.zh?.trim();
  if (titleZh) {
    const byTitle = cases.find((c) => c.title.zh.trim() === titleZh);
    if (byTitle) return byTitle;
  }
  const titleEn = override?.title?.en?.trim();
  if (titleEn) {
    const byTitleEn = cases.find((c) => c.title.en.trim() === titleEn);
    if (byTitleEn) return byTitleEn;
  }
  const fallback = getHomeFeaturedCase(cases);
  if (!fallback) {
    return null;
  }
  return fallback;
}

export function getHomeFeaturedCaseWithImage(
  cases: CaseItem[],
  override?: {
    caseId?: number;
    title?: { zh: string; en: string };
    desc?: { zh: string; en: string };
    image?: string;
  }
): CaseItem | null {
  if (!cases.length && !override?.title?.zh && !override?.title?.en && !override?.image) {
    return null;
  }

  const base = resolveFeaturedBaseCase(cases, override);
  if (!base) {
    if (!override?.title?.zh && !override?.title?.en && !override?.image) {
      return null;
    }
    const cover = override?.image?.trim() || "";
    return {
      id: override?.caseId ?? 0,
      type: "engineering",
      sceneSlug: "corporate",
      title: {
        zh: override?.title?.zh?.trim() || "未命名案例",
        en: override?.title?.en?.trim() || "Untitled case",
      },
      desc: {
        zh: override?.desc?.zh?.trim() || "",
        en: override?.desc?.en?.trim() || "",
      },
      scene: { zh: "", en: "" },
      products: "",
      image: cover,
      imageUrl: cover,
      gallery: cover ? [cover] : [],
      highlights: { zh: [], en: [] },
    };
  }

  const cover = override?.image?.trim() || getCaseCoverUrl(base);

  return {
    ...base,
    title:
      override?.title?.zh || override?.title?.en
        ? {
            zh: override.title.zh?.trim() || base.title.zh,
            en: override.title.en?.trim() || base.title.en,
          }
        : base.title,
    desc:
      override?.desc?.zh || override?.desc?.en
        ? {
            zh: override.desc.zh?.trim() || base.desc.zh,
            en: override.desc.en?.trim() || base.desc.en,
          }
        : base.desc,
    image: cover,
    imageUrl: cover,
  };
}
