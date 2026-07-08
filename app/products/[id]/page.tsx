import ProductDetailContent from "./ProductDetailContent";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getProductById, getProducts } from "@/lib/cms";
import { getRecommendedProducts, getRelatedCases } from "@/lib/products";
import { productPageMetadata, productJsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export async function generateStaticParams() {
  const list = await getProducts();
  return list.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }: Props) {
  const id = Number(params.id);
  const product = await getProductById(id);
  if (!product) return {};
  return productPageMetadata(product);
}

export default async function ProductDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [product, allCases, allProducts] = await Promise.all([
    getProductById(id),
    getCases(),
    getProducts(),
  ]);
  if (!product) notFound();

  const relatedCases = getRelatedCases(product, allCases);
  const recommendedProducts = getRecommendedProducts(product, allProducts);
  const jsonLd = productJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <ProductDetailContent
          product={product}
          relatedCases={relatedCases}
          recommendedProducts={recommendedProducts}
        />
        <SiteFooter />
      </main>
    </>
  );
}
