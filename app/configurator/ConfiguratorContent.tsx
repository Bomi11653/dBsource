"use client";

import type { CaseItem, Product, SmartSelectionPageData } from "@/data/mock";
import {
  SCENE_META,
  type BudgetTier,
  type ConfiguratorAiAnalysis,
  type ConfiguratorInput,
  type ConfiguratorResult,
  type ConfiguratorScene,
  type InstallMethod,
  type LowFrequencyNeed,
  type UsageType,
} from "@/data/configurator-templates";
import { useI18n } from "@/components/I18nProvider";
import { getCaseOverviewExcerpt } from "@/lib/case-project-overview";
import Link from "next/link";
import { useCallback, useState } from "react";

type BomRow = {
  model: string;
  qty: number;
  role: { zh: string; en: string };
  note?: { zh: string; en: string };
  product?: Product;
};

type ConfiguratorApiResponse = {
  ok: boolean;
  result?: ConfiguratorResult;
  bom?: BomRow[];
  ai?: ConfiguratorAiAnalysis | null;
  fallbackOnly?: boolean;
  message?: string;
};

export default function ConfiguratorContent({
  products,
  cases,
  cmsCopy,
}: {
  products: Product[];
  cases: CaseItem[];
  cmsCopy?: SmartSelectionPageData;
}) {
  const { locale, t } = useI18n();
  const [scene, setScene] = useState<ConfiguratorScene>("livehouse");
  const [areaSqm, setAreaSqm] = useState(400);
  const [ceilingHeightM, setCeilingHeightM] = useState(6);
  const [seats, setSeats] = useState(500);
  const [usages, setUsages] = useState<UsageType[]>(["performance"]);
  const [budget, setBudget] = useState<BudgetTier>("standard");
  const [installMethod, setInstallMethod] = useState<InstallMethod>("fixed");
  const [lowFrequency, setLowFrequency] = useState<LowFrequencyNeed>("standard");
  const [hasBand, setHasBand] = useState(true);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConfiguratorResult | null>(null);
  const [bom, setBom] = useState<BomRow[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<ConfiguratorAiAnalysis | null>(null);
  const [fallbackOnly, setFallbackOnly] = useState(false);

  const run = useCallback(async (force = false) => {
    if (loading && !force) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/configurator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene,
          areaSqm,
          ceilingHeightM,
          seats,
          usages,
          budget,
          installMethod,
          lowFrequency,
          hasBand,
          needsExpansion,
          locale,
        }),
      });
      const data = (await res.json()) as ConfiguratorApiResponse;
      if (data.ok && data.result && data.bom) {
        setResult(data.result);
        setBom(data.bom);
        setAiAnalysis(data.ai ?? null);
        setFallbackOnly(Boolean(data.fallbackOnly));
      } else {
        setError(data.message || t.configurator.errorState);
      }
    } catch {
      setError(t.configurator.errorState);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    scene,
    areaSqm,
    ceilingHeightM,
    seats,
    usages,
    budget,
    installMethod,
    lowFrequency,
    hasBand,
    needsExpansion,
    locale,
    t.configurator.errorState,
  ]);

  const relatedCases = cases.filter((c) => result?.caseIds.includes(c.id));
  const hasResult = Boolean(result);
  const pageTitle = cmsCopy?.title?.[locale] || t.configurator.title;
  const pageSubtitle = cmsCopy?.subtitle?.[locale] || t.configurator.subtitle;
  const generateLabel = cmsCopy?.buttons?.generate?.[locale] || t.configurator.generate;
  const regenerateLabel = cmsCopy?.buttons?.regenerate?.[locale] || t.configurator.regenerate;
  const copyLabel = cmsCopy?.buttons?.copy?.[locale] || t.configurator.copyPlan;
  const contactLabel = cmsCopy?.buttons?.contact?.[locale] || t.configurator.contactEngineer;

  function toggleUsage(type: UsageType) {
    setUsages((prev) => {
      if (prev.includes(type)) {
        return prev.length === 1 ? prev : prev.filter((x) => x !== type);
      }
      return [...prev, type];
    });
  }

  async function copyPlan() {
    if (!result) return;
    const lines = bom
      .filter((row) => row.qty > 0)
      .map((row) => `${row.model} x${row.qty} - ${row.role[locale]}`)
      .join("\n");
    const analysis = aiAnalysis
      ? [
          aiAnalysis.summary,
          aiAnalysis.professionalReason,
          aiAnalysis.acousticDesign,
          aiAnalysis.installationNotes.join(" / "),
          aiAnalysis.riskWarnings.join(" / "),
        ]
          .filter(Boolean)
          .join("\n")
      : "";
    const text = [
      result.title[locale],
      `${t.configurator.matchScore}: ${result.matchScore}%`,
      `${t.configurator.systemComplexity}: ${result.complexity[locale]}`,
      `${t.configurator.applicableArea}: ${result.applicableArea[locale]}`,
      "",
      t.configurator.configList,
      lines,
      analysis ? `\n${t.configurator.aiAnalysisTitle}\n${analysis}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="max-w-5xl mx-auto page-x pb-page-safe">
      <header className="text-center mb-10 md:mb-14">
        <h1 className="text-3xl md:text-5xl font-light">{pageTitle}</h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">{pageSubtitle}</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {(
          ["livehouse", "stadium", "conference", "club", "multipurpose", "outdoor"] as const
        ).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setScene(key)}
            className={`rounded-xl border p-4 text-left transition-colors touch-active ${
              scene === key
                ? "border-brand-gold/50 bg-brand-gold/10"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <p className="font-medium">{SCENE_META[key].title[locale]}</p>
            <p className="text-xs text-gray-500 mt-2">{SCENE_META[key].desc[locale]}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 p-5 md:p-8 space-y-5 mb-8 bg-white/[0.02]">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm text-gray-400">
            {t.configurator.areaLabel}
            <input
              type="number"
              min={50}
              max={120000}
              value={areaSqm}
              onChange={(e) => setAreaSqm(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            />
          </label>
          <label className="block text-sm text-gray-400">
            {t.configurator.heightLabel}
            <input
              type="number"
              min={2}
              max={40}
              step={0.1}
              value={ceilingHeightM}
              onChange={(e) => setCeilingHeightM(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            />
          </label>
          <label className="block text-sm text-gray-400">
            {t.configurator.seatsLabel}
            <input
              type="number"
              min={30}
              max={100000}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            />
          </label>
          <label className="block text-sm text-gray-400">
            {t.configurator.budgetLabel}
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value as BudgetTier)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <option value="economy">{t.configurator.budgetEconomy}</option>
              <option value="standard">{t.configurator.budgetStandard}</option>
              <option value="pro">{t.configurator.budgetPro}</option>
              <option value="flagship">{t.configurator.budgetFlagship}</option>
            </select>
          </label>
          <label className="block text-sm text-gray-400">
            {t.configurator.installMethodLabel}
            <select
              value={installMethod}
              onChange={(e) => setInstallMethod(e.target.value as InstallMethod)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <option value="fixed">{t.configurator.installFixed}</option>
              <option value="touring">{t.configurator.installTouring}</option>
              <option value="flown">{t.configurator.installFlown}</option>
              <option value="ground">{t.configurator.installGround}</option>
            </select>
          </label>
          <label className="block text-sm text-gray-400 sm:col-span-2">
            {t.configurator.lowFrequencyLabel}
            <select
              value={lowFrequency}
              onChange={(e) => setLowFrequency(e.target.value as LowFrequencyNeed)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <option value="light">{t.configurator.lowFrequencyLight}</option>
              <option value="standard">{t.configurator.lowFrequencyStandard}</option>
              <option value="strong">{t.configurator.lowFrequencyStrong}</option>
              <option value="extreme">{t.configurator.lowFrequencyExtreme}</option>
            </select>
          </label>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">{t.configurator.usageLabel}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["performance", t.configurator.usagePerformance],
                ["meeting", t.configurator.usageMeeting],
                ["music-playback", t.configurator.usageMusicPlayback],
                ["sports", t.configurator.usageSports],
                ["government", t.configurator.usageGovernment],
              ] as Array<[UsageType, string]>
            ).map(([value, label]) => {
              const active = usages.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleUsage(value)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                    active
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/15 text-gray-300 hover:border-white/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 text-sm rounded-xl border border-white/10 px-4 py-3">
            <input type="checkbox" checked={hasBand} onChange={(e) => setHasBand(e.target.checked)} />
            {t.configurator.hasBand}
          </label>
          <label className="flex items-center gap-3 text-sm rounded-xl border border-white/10 px-4 py-3">
            <input
              type="checkbox"
              checked={needsExpansion}
              onChange={(e) => setNeedsExpansion(e.target.checked)}
            />
            {t.configurator.needsExpansion}
          </label>
        </div>

        <button
          type="button"
          onClick={() => run()}
          disabled={loading}
          className="w-full min-h-[48px] rounded-xl bg-brand-gold/90 text-black font-medium hover:bg-brand-gold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? t.configurator.generating : generateLabel}
        </button>

        {error ? (
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3">
            {error}
          </p>
        ) : null}
      </div>

      {!hasResult ? (
        <section className="rounded-2xl border border-white/10 p-6 text-sm text-gray-400">
          {t.configurator.emptyState}
        </section>
      ) : null}

      {result ? (
        <div className="space-y-8 animate-page-in">
          <section className="rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-medium">{result.title[locale]}</h2>
            <p className="text-gray-400 mt-2">{result.summary[locale]}</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-gray-500">{t.configurator.matchScore}</p>
                <p className="text-lg">{result.matchScore}%</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-gray-500">{t.configurator.systemComplexity}</p>
                <p className="text-sm">{result.complexity[locale]}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-gray-500">{t.configurator.applicableArea}</p>
                <p className="text-sm">{result.applicableArea[locale]}</p>
              </div>
            </div>

            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 px-3 py-2">
                {t.configurator.mainSpeakers}: {result.mainsCount}
              </div>
              <div className="rounded-xl border border-white/10 px-3 py-2">
                {t.configurator.subwoofers}: {result.subCount}
              </div>
              <div className="rounded-xl border border-white/10 px-3 py-2">
                {t.configurator.fillSpeakers}: {result.fillCount}
              </div>
              <div className="rounded-xl border border-white/10 px-3 py-2">
                {t.configurator.monitorSpeakers}: {result.monitorCount}
              </div>
              <div className="rounded-xl border border-white/10 px-3 py-2 sm:col-span-2 lg:col-span-1">
                {t.configurator.dspSuggestion}: {result.dspSuggestion[locale]}
              </div>
              <div className="rounded-xl border border-white/10 px-3 py-2 sm:col-span-2 lg:col-span-2">
                {t.configurator.ampSuggestion}: {result.ampSuggestion[locale]}
              </div>
            </div>

            {result.needsConsult ? (
              <p className="text-brand-gold text-sm mt-3">{t.configurator.consultHint}</p>
            ) : null}

            <div className="overflow-x-auto mt-6">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-white/10">
                    <th className="py-2">{t.configurator.colModel}</th>
                    <th className="py-2">{t.configurator.colQty}</th>
                    <th className="py-2">{t.configurator.colRole}</th>
                  </tr>
                </thead>
                <tbody>
                  {bom
                    .filter((row) => row.qty > 0)
                    .map((row) => (
                      <tr key={row.model + row.role.zh} className="border-b border-white/5">
                        <td className="py-3 font-mono text-brand-gold">
                          {row.product ? (
                            <Link href={`/products/${row.product.id}`} className="hover:underline">
                              {row.model}
                            </Link>
                          ) : (
                            row.model
                          )}
                        </td>
                        <td className="py-3">{row.qty}</td>
                        <td className="py-3 text-gray-400">
                          {row.role[locale]}
                          {row.note ? ` · ${row.note[locale]}` : ""}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-medium">{t.configurator.aiAnalysisTitle}</h3>
            {fallbackOnly || !aiAnalysis ? (
              <p className="text-sm text-gray-400 mt-3">{t.configurator.aiFallbackHint}</p>
            ) : (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-gray-200">{aiAnalysis.summary}</p>
                <p className="text-sm text-gray-400">{aiAnalysis.professionalReason}</p>
                <p className="text-sm text-gray-400">{aiAnalysis.acousticDesign}</p>
                <div>
                  <p className="text-sm font-medium mb-2">{t.configurator.installationNotes}</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {aiAnalysis.installationNotes.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{t.configurator.riskWarnings}</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {aiAnalysis.riskWarnings.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-gray-300">
                  {t.configurator.salesFollowUp}: {aiAnalysis.salesFollowUp}
                </p>
                {aiAnalysis.engineerReviewRequired ? (
                  <p className="text-sm text-amber-300">{t.configurator.engineerReviewRequired}</p>
                ) : null}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href={`/contact?product=${encodeURIComponent(result.contactQuery)}`}
                className="inline-flex min-h-[44px] items-center px-6 rounded-xl bg-brand-gold/90 text-black text-sm font-medium hover:bg-brand-gold"
              >
                {contactLabel}
              </Link>
              <button
                type="button"
                onClick={copyPlan}
                className="inline-flex min-h-[44px] items-center px-6 rounded-xl border border-white/20 text-sm hover:border-white/40"
              >
                {copyLabel}
              </button>
              <button
                type="button"
                onClick={() => run(true)}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center px-6 rounded-xl border border-white/20 text-sm hover:border-white/40 disabled:opacity-50"
              >
                {regenerateLabel}
              </button>
            </div>
          </section>

          {relatedCases.length > 0 ? (
            <section>
              <h3 className="text-lg font-medium mb-4">{t.configurator.relatedCases}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {relatedCases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="rounded-xl border border-white/10 p-4 hover:border-brand-gold/30 transition-colors"
                  >
                    <p className="text-brand-gold text-xs line-clamp-2">
                      {getCaseOverviewExcerpt(c, locale, 80)}
                    </p>
                    <p className="mt-1 font-medium">{c.title[locale]}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
