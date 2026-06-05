"use client";

import PageHeader from "@/components/PageHeader";
import ProductGridCard from "@/components/ProductGridCard";
import ProductPagination from "@/components/ProductPagination";
import ProductSeriesBar from "@/components/ProductSeriesBar";
import type { Product } from "@/data/mock";
import { PRODUCTS_PAGE_SIZE } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import {
  filterProducts,
  getSubSeriesBySlug,
  type CategoryFilter,
  type ProductSubSeriesSlug,
  type SeriesTab,
} from "@/lib/products";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const VALID_SERIES: SeriesTab[] = ["all", "speaker", "dsp", "software", "engineering"];

export default function ProductsContent({ products }: { products: Product[] }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [seriesTab, setSeriesTab] = useState<SeriesTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [subSeries, setSubSeries] = useState<ProductSubSeriesSlug | "all">("all");

  useEffect(() => {
    const series = searchParams.get("series") as SeriesTab | null;
    const sub = searchParams.get("sub");
    if (series && VALID_SERIES.includes(series) && series !== "all") {
      setSeriesTab(series);
      setCurrentPage(1);
    }
    if (sub && getSubSeriesBySlug(sub)) {
      setSubSeries(sub as ProductSubSeriesSlug);
      setCurrentPage(1);
    } else if (!sub) {
      setSubSeries("all");
    }
  }, [searchParams]);

  const filtered = useMemo(
    () => filterProducts(products, seriesTab, categoryFilter, subSeries),
    [products, seriesTab, categoryFilter, subSeries]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PAGE_SIZE));

  const handlePageChange = useCallback(
    (page: number) => {
      const next = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages]
  );

  const handleSeriesChange = useCallback((tab: SeriesTab) => {
    setSeriesTab(tab);
    setSubSeries("all");
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((cat: CategoryFilter) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  }, []);

  const handleSubSeriesChange = useCallback((sub: ProductSubSeriesSlug | "all") => {
    setSubSeries(sub);
    setCurrentPage(1);
  }, []);

  const currentProducts = useMemo(() => {
    if (!filtered.length) return [];
    const start = (currentPage - 1) * PRODUCTS_PAGE_SIZE;
    return filtered.slice(start, start + PRODUCTS_PAGE_SIZE);
  }, [filtered, currentPage]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 md:px-10 pb-24">
      <PageHeader title={t.products.title} subtitle={t.products.subtitle} />

      <ProductSeriesBar
        seriesTab={seriesTab}
        categoryFilter={categoryFilter}
        subSeries={subSeries}
        onSeriesChange={handleSeriesChange}
        onCategoryChange={handleCategoryChange}
        onSubSeriesChange={handleSubSeriesChange}
        resultCount={filtered.length}
      />

      {currentProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-20">{t.products.noResults}</p>
      ) : (
        <div
          key={`${seriesTab}-${categoryFilter}-${subSeries}-${currentPage}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 animate-page-in"
        >
          {currentProducts.map((p) => (
            <ProductGridCard key={p.id} product={p} locale={locale} />
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
