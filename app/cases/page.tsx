import CasesPageContent from "./CasesPageContent";
import SiteFooter from "@/components/SiteFooter";
import { getCases } from "@/lib/cms";
import { PAGE_SEO, pageMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const metadata = pageMetadata(PAGE_SEO.cases, "/cases");

export const revalidate = 60;

export default async function CasesPage() {
  const cases = await getCases();
  return (
    <main className="bg-black">
      <Suspense fallback={<div className="min-h-screen-safe bg-black pt-28" />}>
        <CasesPageContent cases={cases} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
