"use client";

import type { CaseItem, DownloadItem, Product } from "@/data/mock";
import {
  DEFAULT_PRODUCT_SERIES_CONFIG,
  type ProductSeriesConfig,
} from "@/lib/product-series-config";
import { createContext, useContext } from "react";

type SiteData = {
  products: Product[];
  cases: CaseItem[];
  downloads: DownloadItem[];
  productSeriesConfig: ProductSeriesConfig;
};

const SiteDataContext = createContext<SiteData>({
  products: [],
  cases: [],
  downloads: [],
  productSeriesConfig: DEFAULT_PRODUCT_SERIES_CONFIG,
});

export function SiteDataProvider({
  products,
  cases,
  downloads,
  productSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG,
  children,
}: SiteData & { children: React.ReactNode }) {
  return (
    <SiteDataContext.Provider value={{ products, cases, downloads, productSeriesConfig }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
