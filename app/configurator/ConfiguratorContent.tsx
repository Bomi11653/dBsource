"use client";

import type { CaseItem, Product } from "@/data/mock";
import { SCENE_META, type ConfiguratorScene } from "@/data/configurator-templates";
import { useI18n } from "@/components/I18nProvider";
import Link from "next/link";
import { useCallback, useState } from "react";

type BomRow = {
  model: string;
  qty: number;
  role: { zh: string; en: string };
  note?: { zh: string; en: string };
  product?: Product;
};

type Result = {
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  caseIds: number[];
  contactQuery: string;
  needsConsult: boolean;
};

export default function ConfiguratorContent({
  products,
  cases,
}: {
  products: Product[];
  cases: CaseItem[];
}) {
  const { locale, t } = useI18n();
  const [scene, setScene] = useState<ConfiguratorScene>("livehouse");
  const [areaSqm, setAreaSqm] = useState(400);
  const [seats, setSeats] = useState(5000);
  const [hasBand, setHasBand] = useState(true);
  const [needsRecording, setNeedsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [bom, setBom] = useState<BomRow[]>([]);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/configurator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene,
          areaSqm: scene !== "stadium" ? areaSqm : undefined,
          seats: scene === "stadium" ? seats : undefined,
          hasBand: scene === "livehouse" ? hasBand : undefined,
          needsRecording: scene === "conference" ? needsRecording : undefined,
          budget: "standard",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data.result);
        setBom(data.bom);
      }
    } finally {
      setLoading(false);
    }
  }, [scene, areaSqm, seats, hasBand, needsRecording]);

  const relatedCases = cases.filter((c) => result?.caseIds.includes(c.id));

  return (
    <div className="max-w-4xl mx-auto page-x pb-page-safe">
      <header className="text-center mb-10 md:mb-14">
        <h1 className="text-3xl md:text-5xl font-light">{t.configurator.title}</h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">{t.configurator.subtitle}</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {(["livehouse", "stadium", "conference"] as const).map((key) => (
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

      <div className="rounded-2xl border border-white/10 p-5 md:p-8 space-y-5 mb-8">
        {scene === "livehouse" ? (
          <>
            <label className="block text-sm text-gray-400">
              {t.configurator.areaLabel}
              <input
                type="number"
                min={50}
                max={5000}
                value={areaSqm}
                onChange={(e) => setAreaSqm(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={hasBand} onChange={(e) => setHasBand(e.target.checked)} />
              {t.configurator.hasBand}
            </label>
          </>
        ) : null}

        {scene === "stadium" ? (
          <label className="block text-sm text-gray-400">
            {t.configurator.seatsLabel}
            <input
              type="number"
              min={500}
              max={80000}
              step={500}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            />
          </label>
        ) : null}

        {scene === "conference" ? (
          <>
            <label className="block text-sm text-gray-400">
              {t.configurator.areaLabel}
              <input
                type="number"
                min={50}
                max={3000}
                value={areaSqm}
                onChange={(e) => setAreaSqm(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={needsRecording}
                onChange={(e) => setNeedsRecording(e.target.checked)}
              />
              {t.configurator.needsRecording}
            </label>
          </>
        ) : null}

        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="w-full min-h-[48px] rounded-xl bg-brand-gold/90 text-black font-medium hover:bg-brand-gold disabled:opacity-60"
        >
          {loading ? t.configurator.generating : t.configurator.generate}
        </button>
      </div>

      {result ? (
        <div className="space-y-8 animate-page-in">
          <section className="rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-medium">{result.title[locale]}</h2>
            <p className="text-gray-400 mt-2">{result.summary[locale]}</p>
            {result.needsConsult ? (
              <p className="text-brand-gold text-sm mt-3">{t.configurator.consultHint}</p>
            ) : null}

            <table className="w-full mt-6 text-sm">
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

            <Link
              href={`/contact?product=${encodeURIComponent(result.contactQuery)}`}
              className="inline-flex mt-6 min-h-[44px] items-center px-6 rounded-xl bg-brand-gold/90 text-black text-sm font-medium hover:bg-brand-gold"
            >
              {t.configurator.getQuote} →
            </Link>
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
                    <p className="text-brand-gold text-xs">{c.scene[locale]}</p>
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
