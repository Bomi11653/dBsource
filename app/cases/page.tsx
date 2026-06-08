import CasesPageContent from "./CasesPageContent";
import SiteFooter from "@/components/SiteFooter";
import { getCases } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";

export const metadata = pageMetadata(
  "工程案例",
  "体育场、Live House、会展中心等专业音响工程案例",
  "/cases"
);

export default async function CasesPage() {
  const cases = await getCases();
  return (
    <main className="bg-black">
      <Suspense fallback={<div className="min-h-screen bg-black pt-28" />}>
        <CasesPageContent cases={cases} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
