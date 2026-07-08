"use client";

import CaseCard from "@/components/CaseCard";
import BrowseGuide from "@/components/BrowseGuide";
import PageHeader from "@/components/PageHeader";
import type { CaseItem, CaseType } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import dynamic from "next/dynamic";
import {
  filterCasesBySceneFilter,
  getCaseSceneFilterLabel,
  isCaseSceneFilterId,
  type CaseSceneFilterId,
} from "@/lib/case-scene-filters";
import {
  filterCasesBySub,
  getCaseSubCategoryBySlug,
  getCasesForType,
  type CaseSubCategorySlug,
} from "@/lib/cases";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const CasesScrollStory = dynamic(() => import("@/components/CasesScrollStory"), {
  loading: () => <div className="min-h-screen-safe bg-black" aria-hidden />,
});

export default function CasesPageContent({ cases }: { cases: CaseItem[] }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as CaseType | null;
  const subParam = searchParams.get("sub") as CaseSubCategorySlug | null;
  const sceneParam = searchParams.get("scene");
  const validSub = subParam && getCaseSubCategoryBySlug(subParam) ? subParam : null;
  const validScene: CaseSceneFilterId | null =
    sceneParam && isCaseSceneFilterId(sceneParam) ? sceneParam : null;

  const hasTypeFilter = typeParam === "engineering" || typeParam === "performance";
  const showListView = hasTypeFilter || Boolean(validScene);

  const filtered = useMemo(() => {
    if (hasTypeFilter && validSub) {
      return filterCasesBySub(cases, typeParam, validSub);
    }
    if (validScene) {
      return filterCasesBySceneFilter(cases, validScene);
    }
    if (hasTypeFilter) {
      return getCasesForType(typeParam, cases);
    }
    return cases;
  }, [cases, hasTypeFilter, typeParam, validSub, validScene]);

  if (!showListView) {
    return <CasesScrollStory cases={cases} />;
  }

  const title = validScene
    ? t.cases.title
    : typeParam === "engineering"
      ? t.cases.engineeringTitle
      : t.cases.performanceTitle;
  const subtitle = validScene
    ? t.cases.subtitle
    : typeParam === "engineering"
      ? t.cases.engineeringSubtitle
      : t.cases.performanceSubtitle;

  return (
    <div className="bg-black text-white pt-24 sm:pt-28 min-h-screen-safe page-x pb-page-safe max-w-5xl mx-auto">
      <PageHeader
        compact
        title={title}
        subtitle={subtitle}
        guide={
          <>
            <BrowseGuide
              layout="stack"
              title={t.guide.exploreTitle}
              items={[
                { label: t.guide.casesEngineering, href: "/cases?type=engineering" },
                { label: t.guide.casesPerformance, href: "/cases?type=performance" },
                { label: t.guide.casesAll, href: "/cases" },
                { label: t.guide.productsSpeaker, href: "/products" },
              ]}
              className="mt-6 md:hidden"
            />
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
          </>
        }
      />

      {validScene ? (
        <div className="flex flex-wrap items-center gap-3 mb-8 -mt-2">
          <p className="text-sm text-gray-400">
            {t.cases.filterActive.replace("{label}", getCaseSceneFilterLabel(validScene, locale))}
          </p>
          <Link
            href="/cases"
            className="text-sm min-h-[44px] inline-flex items-center px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:border-brand-gold/40 hover:text-brand-gold transition-colors touch-active"
          >
            {t.cases.clearFilter}
          </Link>
        </div>
      ) : null}

      <div className="space-y-8">
        {filtered.map((item, i) => (
          <CaseCard key={item.id} item={item} locale={locale} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-500">{t.cases.noSceneResults}</p>
            <Link
              href="/cases"
              className="inline-flex items-center min-h-[44px] px-5 py-2 rounded-lg border border-white/15 text-sm text-gray-300 hover:border-brand-gold/40 hover:text-brand-gold transition-colors touch-active"
            >
              {t.cases.clearFilter}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
