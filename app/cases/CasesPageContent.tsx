"use client";

import CaseCard from "@/components/CaseCard";
import CasesScrollStory from "@/components/CasesScrollStory";
import BrowseGuide from "@/components/BrowseGuide";
import PageHeader from "@/components/PageHeader";
import type { CaseItem, CaseType } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import {
  filterCasesBySub,
  getCaseSubCategoryBySlug,
  getCasesForType,
  type CaseSubCategorySlug,
} from "@/lib/cases";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function CasesPageContent({ cases }: { cases: CaseItem[] }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as CaseType | null;
  const subParam = searchParams.get("sub") as CaseSubCategorySlug | null;
  const validSub = subParam && getCaseSubCategoryBySlug(subParam) ? subParam : null;

  const filtered = useMemo(() => {
    if (typeParam === "engineering" || typeParam === "performance") {
      if (validSub) {
        return filterCasesBySub(cases, typeParam, validSub);
      }
      return getCasesForType(typeParam, cases);
    }
    return cases;
  }, [cases, typeParam, validSub]);

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
    <div className="bg-black text-white pt-24 sm:pt-28 min-h-screen page-x pb-page-safe max-w-5xl mx-auto">
      <PageHeader
        compact
        title={title}
        subtitle={subtitle}
        guide={
          <div className="hidden md:block">
            <BrowseGuide
              layout="scroll"
              title={t.guide.exploreTitle}
            items={[
              { label: t.guide.casesEngineering, href: "/cases?type=engineering" },
              { label: t.guide.casesPerformance, href: "/cases?type=performance" },
              { label: t.guide.casesAll, href: "/cases" },
              { label: t.guide.productsSpeaker, href: "/products" },
            ]}
            className="mt-6"
            />
          </div>
        }
      />
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
