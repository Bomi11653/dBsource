"use client";

import PageHeader from "@/components/PageHeader";
import ProductCategoryGuide from "@/components/products/ProductCategoryGuide";
import ProductGridCard from "@/components/ProductGridCard";
import ProductPagination from "@/components/ProductPagination";
import ProductSearchBar from "@/components/ProductSearchBar";
import ProductSeriesBar from "@/components/ProductSeriesBar";
import type { Product } from "@/data/mock";
import { PRODUCTS_PAGE_SIZE } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { searchProducts } from "@/lib/products";
import {
  filterEngineeringProducts,
  filterTouringProducts,
  getTouringProductLabel,
  getTouringProductNavItems,
  isTouringProductKey,
  matchEngineeringProductLine,
  sortEngineeringProducts,
  sortTouringNavProducts,
  type ProductCategoryType,
} from "@/lib/product-classification";
import {
  DEFAULT_PRODUCT_SERIES_CONFIG,
  getProductPageSeriesFilterTabs,
  type ProductSeriesConfig,
} from "@/lib/product-series-config";
import {
  getProductSeriesTabLabel,
  parseProductSeriesTabFromParams,
  type ProductSeriesTabFilter,
} from "@/lib/product-series-tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";

function parseProductCategory(
  group: string | null,
  product: string | null,
  config: ProductSeriesConfig
): ProductCategoryType {
  if (group === "touring" || (product && isTouringProductKey(product, config))) {
    return "touring";
  }
  return "engineering";
}

export default function ProductsContent({
  products,
  productSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG,
}: {
  products: Product[];
  productSeriesConfig?: ProductSeriesConfig;
}) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const [productCategory, setProductCategory] = useState<ProductCategoryType>("engineering");
  const [seriesFilter, setSeriesFilter] = useState<ProductSeriesTabFilter>("all");
  const [touringFilter, setTouringFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

  /** 前台筛选：与导航/后台同一套 PRODUCT_SERIES_DISPLAY */
  const engineeringFilterTabs = useMemo(
    () => getProductPageSeriesFilterTabs(locale),
    [locale]
  );

  const engineeringSeriesKeys = useMemo(
    () =>
      new Set<ProductSeriesTabFilter>([
        "all",
        ...engineeringFilterTabs.map((entry) => entry.id as ProductSeriesTabFilter),
      ]),
    [engineeringFilterTabs]
  );

  const touringNav = useMemo(
    () => getTouringProductNavItems(products, productSeriesConfig),
    [products, productSeriesConfig]
  );

  const syncUrl = useCallback(
    (next: {
      category: ProductCategoryType;
      series: ProductSeriesTabFilter;
      touringProduct: string;
      q: string;
      page: number;
    }) => {
      const params = new URLSearchParams();
      if (next.category === "touring") params.set("group", "touring");
      if (next.category === "engineering" && next.series !== "all") {
        params.set("series", next.series);
      }
      if (next.category === "touring" && next.touringProduct !== "all") {
        params.set("product", next.touringProduct);
      }
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.page > 1) params.set("page", String(next.page));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const group = searchParams.get("group");
    const product = searchParams.get("product");
    const series = searchParams.get("series");
    const sub = searchParams.get("sub");
    const categoryParam = searchParams.get("category");
    const q = searchParams.get("q") ?? "";
    const page = Number(searchParams.get("page") ?? "1");

    const category = parseProductCategory(group, product, productSeriesConfig);
    setProductCategory(category);

    if (category === "touring") {
      setTouringFilter(
        product && isTouringProductKey(product, productSeriesConfig) ? product : "all"
      );
      setSeriesFilter("all");
    } else {
      const parsed = parseProductSeriesTabFromParams(
        series,
        sub,
        categoryParam,
        productSeriesConfig
      );
      setSeriesFilter(engineeringSeriesKeys.has(parsed) ? parsed : "all");
      setTouringFilter("all");
    }

    setSearchQuery(q);
    setCurrentPage(Number.isFinite(page) && page > 0 ? page : 1);
  }, [searchParams, productSeriesConfig, engineeringSeriesKeys]);

  const categoryLabels = useMemo(
    () => ({
      engineering: t.products.categoryEngineering,
      touring: t.products.categoryTouring,
    }),
    [t.products.categoryEngineering, t.products.categoryTouring]
  );

  const filterTabs = useMemo(() => {
    const allTab = {
      id: "all",
      label: getProductSeriesTabLabel("all", productSeriesConfig),
    };
    if (productCategory === "engineering") {
      return [allTab, ...engineeringFilterTabs];
    }
    return [
      allTab,
      ...touringNav.items.map((item) => ({
        id: item.key,
        label: getTouringProductLabel(item, locale),
      })),
    ];
  }, [engineeringFilterTabs, locale, productCategory, productSeriesConfig, touringNav.items]);

  const activeFilterId =
    productCategory === "engineering" ? seriesFilter : touringFilter;

  const categoryProducts = useMemo(() => {
    if (productCategory === "engineering") {
      return filterEngineeringProducts(products);
    }
    return filterTouringProducts(products);
  }, [productCategory, products]);

  const filtered = useMemo(() => {
    let list = categoryProducts;
    if (productCategory === "engineering") {
      list =
        seriesFilter === "all"
          ? sortEngineeringProducts(list)
          : list.filter((product) => matchEngineeringProductLine(product, seriesFilter));
    } else {
      if (touringFilter !== "all") {
        const selected = touringNav.items.find((item) => item.key === touringFilter);
        if (selected) {
          list = list.filter((product) => product.id === selected.sortOrder);
        }
      }
      list = sortTouringNavProducts(list, touringNav.items);
    }
    return searchProducts(list, debouncedSearchQuery, locale);
  }, [
    categoryProducts,
    debouncedSearchQuery,
    locale,
    productCategory,
    seriesFilter,
    touringFilter,
    touringNav.items,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PAGE_SIZE));

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
      syncUrl({
        category: productCategory,
        series: seriesFilter,
        touringProduct: touringFilter,
        q: value,
        page: 1,
      });
    },
    [productCategory, seriesFilter, touringFilter, syncUrl]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const next = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(next);
      syncUrl({
        category: productCategory,
        series: seriesFilter,
        touringProduct: touringFilter,
        q: searchQuery,
        page: next,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchQuery, productCategory, seriesFilter, touringFilter, syncUrl, totalPages]
  );

  const handleFilterChange = useCallback(
    (id: string) => {
      setCurrentPage(1);
      if (productCategory === "engineering") {
        const nextSeries = id as ProductSeriesTabFilter;
        setSeriesFilter(nextSeries);
        syncUrl({
          category: productCategory,
          series: nextSeries,
          touringProduct: "all",
          q: searchQuery,
          page: 1,
        });
        return;
      }
      setTouringFilter(id);
      syncUrl({
        category: productCategory,
        series: "all",
        touringProduct: id,
        q: searchQuery,
        page: 1,
      });
    },
    [productCategory, searchQuery, syncUrl]
  );

  const handleCategoryChange = useCallback(
    (category: ProductCategoryType) => {
      setProductCategory(category);
      setSeriesFilter("all");
      setTouringFilter("all");
      setCurrentPage(1);
      syncUrl({
        category,
        series: "all",
        touringProduct: "all",
        q: searchQuery,
        page: 1,
      });
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
          <ProductCategoryGuide
            title={t.guide.exploreTitle}
            active={productCategory}
            labels={categoryLabels}
            onChange={handleCategoryChange}
            className="mt-6"
          />
        }
      />

      <ProductSeriesBar
        tabs={filterTabs}
        activeId={activeFilterId}
        onChange={handleFilterChange}
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
        <p className="text-center text-gray-500 py-16 px-4 break-words">{t.products.noResults}</p>
      ) : (
        <div
          key={`${productCategory}-${activeFilterId}-${searchQuery}-${currentPage}`}
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
