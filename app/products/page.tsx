import ProductsContent from "./ProductsContent";
import SiteFooter from "@/components/SiteFooter";
import { getProducts, getProductSeriesConfig } from "@/lib/cms";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const metadata = pageMetadata(PAGE_SEO.products, "/products");

export default async function ProductsPage() {
  const [products, productSeriesConfig] = await Promise.all([
    getProducts(),
    getProductSeriesConfig(),
  ]);
  return (
    <main className="pt-24 sm:pt-28 min-h-screen-safe">
      <Suspense fallback={<div className="min-h-[40vh]" />}>
        <ProductsContent products={products} productSeriesConfig={productSeriesConfig} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
