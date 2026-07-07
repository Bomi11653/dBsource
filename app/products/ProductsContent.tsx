"use client";

import BrowseGuide from "@/components/BrowseGuide";
import PageHeader from "@/components/PageHeader";
import ProductGridCard from "@/components/ProductGridCard";
import ProductPagination from "@/components/ProductPagination";
import ProductSearchBar from "@/components/ProductSearchBar";
import ProductSeriesBar from "@/components/ProductSeriesBar";
import type { Product } from "@/data/mock";
import { PRODUCTS_PAGE_SIZE } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { searchProducts } from "@/lib/products";
import {
  filterProductsBySeriesTab,
  getProductSeriesTabLabel,
  parseProductSeriesTabFromParams,
  type ProductSeriesTabFilter,
} from "@/lib/product-series-tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export default function ProductsContent({ products }: { products: Product[] }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const [seriesFilter, setSeriesFilter] = useState<ProductSeriesTabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

  const syncUrl = useCallback(
    (next: { series: ProductSeriesTabFilter; q: string; page: number }) => {
      const params = new URLSearchParams();
      if (next.series !== "all") params.set("series", next.series);
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.page > 1) params.set("page", String(next.page));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const series = searchParams.get("series");
    const sub = searchParams.get("sub");
    const category = searchParams.get("category");
    const q = searchParams.get("q") ?? "";
    const page = Number(searchParams.get("page") ?? "1");

    setSeriesFilter(parseProductSeriesTabFromParams(series, sub, category));
    setSearchQuery(q);
    setCurrentPage(Number.isFinite(page) && page > 0 ? page : 1);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const bySeries = filterProductsBySeriesTab(products, seriesFilter);
    return searchProducts(bySeries, debouncedSearchQuery, locale);
  }, [products, seriesFilter, debouncedSearchQuery, locale]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PAGE_SIZE));

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
      syncUrl({ series: seriesFilter, q: value, page: 1 });
    },
    [seriesFilter, syncUrl]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const next = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(next);
      syncUrl({ series: seriesFilter, q: searchQuery, page: next });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchQuery, seriesFilter, syncUrl, totalPages]
  );

  const handleSeriesChange = useCallback(
    (tab: ProductSeriesTabFilter) => {
      setSeriesFilter(tab);
      setCurrentPage(1);
      syncUrl({ series: tab, q: searchQuery, page: 1 });
    },
    [searchQuery, syncUrl]
  );

  const currentProducts = useMemo(() => {
    if (!filtered.length) return [];
    const start = (currentPage - 1) * PRODUCTS_PAGE_SIZE;
    return filtered.slice(start, start + PRODUCTS_PAGE_SIZE);
  }, [filtered, currentPage]);

  return (
    <div className="max-w-[1600px] mx-auto page-x pb-page-safe">
      <PageHeader
        compact
        title={t.products.title}
        subtitle={t.products.subtitle}
        guide={
          <BrowseGuide
            title={t.guide.exploreTitle}
            layout="scroll"
            items={[
              { label: getProductSeriesTabLabel("la"), href: "/products?series=la" },
              { label: getProductSeriesTabLabel("sol"), href: "/products?series=sol" },
              { label: getProductSeriesTabLabel("mi"), href: "/products?series=mi" },
            ]}
            className="mt-6"
          />
        }
      />

      <ProductSeriesBar
        seriesFilter={seriesFilter}
        onSeriesChange={handleSeriesChange}
        resultCount={filtered.length}
        search={
          <ProductSearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            resultCount={filtered.length}
          />
        }
      />

      {currentProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-20">{t.products.noResults}</p>
      ) : (
        <div
          key={`${seriesFilter}-${searchQuery}-${currentPage}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 animate-page-in"
        >
          {currentProducts.map((p, i) => (
            <ProductGridCard key={p.id} product={p} locale={locale} index={i} />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PRODUCTS_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
