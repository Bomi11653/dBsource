import type { CaseItem, DownloadItem, Product } from "@/data/mock";
import { matchProductsByModelCodes } from "@/lib/ai/synonyms";
import { PRODUCT_SUB_SERIES } from "@/lib/products";

export type AiLink = {
  type: "product" | "case" | "series" | "download" | "contact" | "configurator";
  label: string;
  href: string;
};

export function buildAiLinks(
  products: Product[],
  cases: CaseItem[],
  downloads: DownloadItem[],
  locale: "zh" | "en",
  focusModels?: string[]
): AiLink[] {
  const links: AiLink[] = [];
  const seen = new Set<string>();

  let productPool = products;
  if (focusModels?.length) {
    const matched = matchProductsByModelCodes(products, focusModels);
    if (matched.length) productPool = matched;
  }

  const productLimit = focusModels?.length === 1 ? 1 : 4;
  for (const p of productPool.slice(0, productLimit)) {
    const key = `p-${p.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      type: "product",
      label: p.model,
      href: `/products/${p.id}`,
    });

    if (!focusModels?.length) {
      const sub = PRODUCT_SUB_SERIES.find((s) => s.slug === p.productLine);
      if (sub) {
        const seriesKey = `s-${sub.slug}`;
        if (!seen.has(seriesKey)) {
          seen.add(seriesKey);
          links.push({
            type: "series",
            label: sub.label[locale],
            href: `/products?series=${sub.seriesGroup}&sub=${sub.slug}`,
          });
        }
      }
    }
  }

  let casePool = cases;
  if (focusModels?.length) {
    const matchedCases = cases.filter((c) =>
      focusModels.some((code) => c.products.toUpperCase().includes(code))
    );
    if (matchedCases.length) casePool = matchedCases;
  }

  for (const c of casePool.slice(0, 3)) {
    const key = `c-${c.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      type: "case",
      label: c.title[locale],
      href: `/cases/${c.id}`,
    });
  }

  const downloadLimit = focusModels?.length ? 0 : 2;
  for (const d of downloads.slice(0, downloadLimit)) {
    const key = `d-${d.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      type: "download",
      label: d.name[locale],
      href: `/api/downloads/${d.id}/file`,
    });
  }

  links.push({
    type: "contact",
    label: locale === "zh" ? "联系报价" : "Get a quote",
    href: "/contact",
  });
  links.push({
    type: "configurator",
    label: locale === "zh" ? "智能选型" : "Configurator",
    href: "/configurator",
  });

  return links;
}

export function splitAiLinks(links: AiLink[]) {
  const related = links.filter((l) => l.type !== "contact" && l.type !== "configurator");
  const actions = links.filter((l) => l.type === "contact" || l.type === "configurator");
  return { related, actions };
}
