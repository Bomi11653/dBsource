import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export default function ProductNotFound() {
  return (
    <main className="min-h-screen bg-black text-white pt-32 px-6 text-center">
      <h1 className="text-3xl font-light mb-4">产品未找到</h1>
      <Link href="/products" className="text-brand-gold hover:underline">
        返回产品中心
      </Link>
      <SiteFooter />
    </main>
  );
}
