import type { CaseItem } from "./mock";
import { PRODUCT_SPEC_SHEETS, type ProductSpecSheet } from "./product-specs";

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

export function getHomeFeaturedCase(cases: CaseItem[]): CaseItem | undefined {
  return cases.find((c) => c.id === 6) ?? cases[0];
}

export function getHomeFeaturedCaseWithImage(cases: CaseItem[]): CaseItem {
  const item = getHomeFeaturedCase(cases);
  if (!item) {
    throw new Error("No cases available for home preview");
  }
  return item;
}
