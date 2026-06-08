import type { CaseItem, DownloadItem, Product } from "@/data/mock";
import { searchProducts } from "@/lib/products";
import { expandSearchQuery, matchSceneTag, sceneTagConfig } from "@/lib/ai/synonyms";

export type SmartSearchHit = {
  type: "product" | "case" | "download" | "scene";
  id: number | string;
  title: string;
  subtitle?: string;
  href: string;
};

export function smartSearch(
  query: string,
  data: { products: Product[]; cases: CaseItem[]; downloads: DownloadItem[] },
  locale: "zh" | "en"
): SmartSearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const hits: SmartSearchHit[] = [];
  const terms = expandSearchQuery(q);
  const expandedQuery = terms.join(" ");

  searchProducts(data.products, expandedQuery || q)
    .slice(0, 6)
    .forEach((p) => {
      hits.push({
        type: "product",
        id: p.id,
        title: `${p.model} · ${p.name[locale]}`,
        subtitle: p.series?.[locale],
        href: `/products/${p.id}`,
      });
    });

  const qLower = q.toLowerCase();
  data.cases
    .filter((c) => {
      const hay = [c.title.zh, c.title.en, c.desc.zh, c.products, c.scene.zh]
        .join(" ")
        .toLowerCase();
      return terms.some((t) => hay.includes(t)) || hay.includes(qLower);
    })
    .slice(0, 4)
    .forEach((c) => {
      hits.push({
        type: "case",
        id: c.id,
        title: c.title[locale],
        subtitle: c.scene[locale],
        href: `/cases/${c.id}`,
      });
    });

  data.downloads
    .filter((d) => {
      const hay = [d.name.zh, d.name.en].join(" ").toLowerCase();
      return terms.some((t) => hay.includes(t)) || hay.includes(qLower);
    })
    .slice(0, 3)
    .forEach((d) => {
      hits.push({
        type: "download",
        id: d.id,
        title: d.name[locale],
        href: `/downloads?tab=${d.type}&file=${d.id}`,
      });
    });

  const scene = matchSceneTag(q);
  if (scene) {
    const cfg = sceneTagConfig(scene);
    if (cfg?.href) {
      hits.unshift({
        type: "scene",
        id: scene,
        title: locale === "zh" ? "智能选型" : "System configurator",
        subtitle: locale === "zh" ? "Live House / 体育馆 / 会议" : "Venue sizing tool",
        href: cfg.href,
      });
    }
  }

  return hits;
}
