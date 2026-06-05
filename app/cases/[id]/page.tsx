import CaseDetailContent from "./CaseDetailContent";
import SiteFooter from "@/components/SiteFooter";
import { getCaseById, getCases } from "@/lib/cms";
import { getRelatedCases } from "@/lib/cases";
import { pageMetadata } from "@/lib/seo";
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
  return pageMetadata(caseItem.title.zh, caseItem.desc.zh, `/cases/${id}`);
}

export default async function CaseDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [caseItem, allCases] = await Promise.all([getCaseById(id), getCases()]);
  if (!caseItem) notFound();

  const relatedCases = getRelatedCases(id, allCases);

  return (
    <main>
      <CaseDetailContent caseItem={caseItem} relatedCases={relatedCases} />
      <SiteFooter />
    </main>
  );
}
