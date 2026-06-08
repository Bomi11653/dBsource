"use client";

import type { CaseItem, DownloadItem, Product } from "@/data/mock";
import { createContext, useContext } from "react";

type SiteData = {
  products: Product[];
  cases: CaseItem[];
  downloads: DownloadItem[];
};

const SiteDataContext = createContext<SiteData>({
  products: [],
  cases: [],
  downloads: [],
});

export function SiteDataProvider({
  products,
  cases,
  downloads,
  children,
}: SiteData & { children: React.ReactNode }) {
  return (
    <SiteDataContext.Provider value={{ products, cases, downloads }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
