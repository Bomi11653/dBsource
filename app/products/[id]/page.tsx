import ProductDetailContent from "./ProductDetailContent";
import SiteFooter from "@/components/SiteFooter";
import { getCases, getProductById, getProducts } from "@/lib/cms";
import { getRelatedCases } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";
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
  return pageMetadata(
    product.name.zh,
    product.desc.zh,
    `/products/${id}`
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [product, allCases] = await Promise.all([
    getProductById(id),
    getCases(),
  ]);
  if (!product) notFound();

  const relatedCases = getRelatedCases(product, allCases);

  return (
    <main>
      <ProductDetailContent product={product} relatedCases={relatedCases} />
      <SiteFooter />
    </main>
  );
}
