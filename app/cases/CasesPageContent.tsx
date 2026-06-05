"use client";

import CaseCard from "@/components/CaseCard";
import CasesScrollStory from "@/components/CasesScrollStory";
import PageHeader from "@/components/PageHeader";
import type { CaseItem, CaseType } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function CasesPageContent({ cases }: { cases: CaseItem[] }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as CaseType | null;

  const filtered = useMemo(() => {
    if (typeParam === "engineering" || typeParam === "performance") {
      return cases.filter((c) => c.type === typeParam);
    }
    return cases;
  }, [cases, typeParam]);

  if (!typeParam) {
    return <CasesScrollStory cases={cases} />;
  }

  const title =
    typeParam === "engineering"
      ? t.cases.engineeringTitle
      : t.cases.performanceTitle;
  const subtitle =
    typeParam === "engineering"
      ? t.cases.engineeringSubtitle
      : t.cases.performanceSubtitle;

  return (
    <div className="bg-black text-white pt-28 min-h-screen px-6 md:px-10 pb-20 max-w-5xl mx-auto">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="space-y-8">
        {filtered.map((item) => (
          <CaseCard key={item.id} item={item} locale={locale} />
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-16">{t.products.noResults}</p>
        )}
      </div>
    </div>
  );
}
