import CaseDetailContent from "./CaseDetailContent";
import SiteFooter from "@/components/SiteFooter";
import { getCaseById, getCases } from "@/lib/cms";
import { caseJsonLd, casePageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export async function generateStaticParams() {
  const list = await getCases();
  return list.map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: Props) {
  const id = Number(params.id);
  const caseItem = await getCaseById(id);
  if (!caseItem) return {};
  return casePageMetadata(caseItem);
}

export default async function CaseDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const caseItem = await getCaseById(id);
  if (!caseItem) notFound();

  const jsonLd = caseJsonLd(caseItem);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <CaseDetailContent caseItem={caseItem} />
        <SiteFooter />
      </main>
    </>
  );
}
