import type { CaseItem, DownloadItem, Product } from "@/data/mock";
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
  locale: "zh" | "en"
): AiLink[] {
  const links: AiLink[] = [];
  const seen = new Set<string>();

  for (const p of products.slice(0, 4)) {
    const key = `p-${p.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      type: "product",
      label: p.model,
      href: `/products/${p.id}`,
    });

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

  for (const c of cases.slice(0, 3)) {
    const key = `c-${c.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      type: "case",
      label: c.title[locale],
      href: `/cases/${c.id}`,
    });
  }

  for (const d of downloads.slice(0, 2)) {
    const key = `d-${d.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      type: "download",
      label: d.name[locale],
      href: `/downloads?tab=${d.type}&file=${d.id}`,
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
