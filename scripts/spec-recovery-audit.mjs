import fs from "fs";
import {
  resolveProductSpecDisplay,
  getProductSpecFallback,
  getCmsSpecDisplayRows,
} from "../lib/product-spec-display.ts";
import {
  adminHasCmsSpecContent,
} from "../lib/admin-product-spec-seed.ts";
import {
  isTableSerializedSpecs,
} from "../lib/admin-product-specs.ts";

function countFallback(fb) {
  if (!fb) return 0;
  if (Array.isArray(fb)) return fb.reduce((s, p) => s + p.rows.length, 0);
  return fb.rows.length;
}

function cmsSource(specs) {
  if (!specs) return { label: "无", count: 0 };
  const zh = specs.zh?.trim() ?? "";
  const en = specs.en?.trim() ?? "";
  if (!zh && !en) return { label: "无", count: 0 };
  const count = getCmsSpecDisplayRows({ specs })?.length ?? 0;
  if (isTableSerializedSpecs(zh, en)) return { label: `CMS表格(${count}行)`, count };
  if (adminHasCmsSpecContent(zh, en))
    return { label: `CMS摘要(${count}行)`, count };
  return { label: "无", count: 0 };
}

function staticSource(model, productLine) {
  const fb = getProductSpecFallback({ model, productLine });
  if (!fb) return { label: "无", count: 0 };
  const count = countFallback(fb);
  if (Array.isArray(fb)) return { label: `静态叠页(${count}行)`, count };
  return { label: `静态(${count}行,参考${fb.model})`, count };
}

function displayStatus(p) {
  const d = resolveProductSpecDisplay(p);
  if (!d) return { label: "不显示", count: 0, kind: "none" };
  if (d.kind === "cms")
    return { label: `CMS(${d.rows.length}行)`, count: d.rows.length, kind: "cms" };
  if (d.kind === "static-stacked") {
    const count = d.pages.reduce((s, x) => s + x.rows.length, 0);
    return { label: `静态叠页(${count}行)`, count, kind: "static-stacked" };
  }
  return {
    label: `静态(${d.sheet.rows.length}行,参考${d.sheet.model})`,
    count: d.sheet.rows.length,
    kind: "static-sheet",
  };
}

const cachePath = new URL("../.data/cms-cache/products.json", import.meta.url);
const cache = JSON.parse(fs.readFileSync(cachePath, "utf8")).payload;

const SERIES_CHECKS = [
  { key: "V225A", match: (r) => r.model === "V225A" },
  { key: "V415A", match: (r) => r.model === "V415A" },
  { key: "LA", match: (r) => r.productLine === "la" || r.model.startsWith("LA") },
  { key: "LW", match: (r) => r.productLine === "lw" || r.model.startsWith("LW") },
  { key: "SOL", match: (r) => r.productLine === "sol" || r.model.startsWith("SOL") },
  { key: "DO", match: (r) => r.productLine === "do" || r.model.startsWith("DO") },
  { key: "MI", match: (r) => r.productLine === "mi" || r.model.startsWith("MI") },
  { key: "RE", match: (r) => r.productLine === "re" || r.model.startsWith("RE") },
  { key: "K", match: (r) => r.productLine === "k" || /^K\d/.test(r.model) },
  { key: "V系列", match: (r) => r.productLine === "tour" || r.productLine === "electronics" || /^V/.test(r.model) },
];

const rows = cache.map((p) => {
  const cms = cmsSource(p.specs);
  const stat = staticSource(p.model, p.productLine);
  const final = displayStatus(p);
  return {
    id: p.id,
    model: p.model,
    name: p.name?.zh || p.model,
    productLine: p.productLine,
    url: `/products/${p.id}`,
    cms: cms.label,
    cmsCount: cms.count,
    static: stat.label,
    staticCount: stat.count,
    final: final.label,
    finalCount: final.count,
    finalKind: final.kind,
  };
});

const missing = rows.filter((r) => r.finalKind === "none");
const bySeries = Object.fromEntries(
  SERIES_CHECKS.map(({ key, match }) => [key, rows.filter(match)])
);

const outPath = new URL("../_spec-audit.json", import.meta.url);
fs.writeFileSync(
  outPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), total: rows.length, rows, missing, bySeries }, null, 2)
);

console.log(JSON.stringify({ total: rows.length, missing: missing.map((m) => m.model), out: outPath.pathname }));
