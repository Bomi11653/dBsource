import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export default function CaseNotFound() {
  return (
    <main className="min-h-screen bg-black text-white pt-32 px-6 text-center">
      <h1 className="text-3xl font-medium mb-4">案例未找到</h1>
      <Link href="/cases" className="text-brand-gold hover:underline">
        返回工程案例
      </Link>
      <SiteFooter />
    </main>
  );
}
