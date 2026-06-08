import ProductsContent from "./ProductsContent";
import SiteFooter from "@/components/SiteFooter";
import { getProducts } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const metadata = pageMetadata(
  "产品中心",
  "线阵列、超低音、返听及分布式扩声系统产品目录",
  "/products"
);

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <main className="pt-24 sm:pt-28 min-h-screen">
      <Suspense fallback={<div className="min-h-[40vh]" />}>
        <ProductsContent products={products} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
