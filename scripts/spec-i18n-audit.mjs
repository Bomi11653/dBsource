import fs from "fs";
import {
  resolveProductSpecDisplay,
  getCmsSpecDisplayRows,
} from "../lib/product-spec-display.ts";

function displayRows(source, locale) {
  if (!source) return [];
  if (source.kind === "cms") {
    return source.rows
      .filter((r) => r.label[locale].trim() || r.value[locale].trim())
      .map((r) => ({
        label: r.label[locale],
        value: r.value[locale],
      }));
  }
  if (source.kind === "static-stacked") {
    return source.pages.flatMap((page) =>
      page.rows.map((r) => ({
        label: r.label[locale],
        value: r.value[locale],
      }))
    );
  }
  return source.sheet.rows.map((r) => ({
    label: r.label[locale],
    value: r.value[locale],
  }));
}

function sourceLabel(source) {
  if (!source) return "无";
  if (source.kind === "cms") return `CMS(${source.rows.length}行)`;
  if (source.kind === "static-stacked") {
    const n = source.pages.reduce((s, p) => s + p.rows.length, 0);
    return `静态叠页(${n}行)`;
  }
  return `静态(${source.sheet.rows.length}行)`;
}

const cachePath = new URL("../.data/cms-cache/products.json", import.meta.url);
const cache = JSON.parse(fs.readFileSync(cachePath, "utf8")).payload;

const issues = [];
const rows = [];

for (const p of cache) {
  const zhRaw = p.specs?.zh?.trim() ?? "";
  const enRaw = p.specs?.en?.trim() ?? "";
  const zhDisplay = resolveProductSpecDisplay(p, "zh");
  const enDisplay = resolveProductSpecDisplay(p, "en");
  const zhRows = displayRows(zhDisplay, "zh");
  const enRows = displayRows(enDisplay, "en");
  const cmsRows = getCmsSpecDisplayRows(p);

  const rowCountMatch = zhRows.length === enRows.length;
  const zhSource = sourceLabel(zhDisplay);
  const enSource = sourceLabel(enDisplay);
  const sourceMatch = zhSource === enSource;

  if (!zhRaw && enRaw) {
    issues.push({ model: p.model, type: "仅英文CMS", id: p.id });
  }
  if (zhRaw && !enRaw) {
    issues.push({ model: p.model, type: "仅中文CMS(英文应走静态)", id: p.id });
  }
  if (!rowCountMatch) {
    issues.push({
      model: p.model,
      type: "切换语言行数不一致",
      id: p.id,
      zh: zhRows.length,
      en: enRows.length,
    });
  }
  if (!sourceMatch && zhRaw && enRaw) {
    issues.push({
      model: p.model,
      type: "中英文来源不同",
      id: p.id,
      zhSource,
      enSource,
    });
  }

  rows.push({
    id: p.id,
    model: p.model,
    cmsZh: zhRaw ? `${cmsRows?.length ?? 0}行` : "空",
    cmsEn: enRaw ? `${cmsRows?.length ?? 0}行` : "空",
    zhSource,
    enSource,
    zhRows: zhRows.length,
    enRows: enRows.length,
    sync: rowCountMatch ? "一致" : "不一致",
  });
}

console.log("=== 产品参数中英文同步检查 ===");
console.log(`产品总数: ${rows.length}`);
console.log(`行数一致: ${rows.filter((r) => r.sync === "一致").length}`);
console.log(`行数不一致: ${rows.filter((r) => r.sync === "不一致").length}`);
console.log(`异常项: ${issues.length}`);
console.log("");

if (issues.length) {
  console.log("--- 异常 ---");
  for (const i of issues) console.log(JSON.stringify(i));
  console.log("");
}

const samples = ["V225A", "V415A", "LA206", "LA115S", "SOL403", "MI12", "RE8", "K10"];
console.log("--- 抽样 ---");
for (const model of samples) {
  const r = rows.find((x) => x.model === model);
  if (r) {
    console.log(
      `${r.model} | CMS zh:${r.cmsZh} en:${r.cmsEn} | 中文:${r.zhSource}(${r.zhRows}行) | 英文:${r.enSource}(${r.enRows}行) | ${r.sync}`
    );
  }
}
