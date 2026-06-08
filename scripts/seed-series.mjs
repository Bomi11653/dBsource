/**
 * 通过 Strapi Admin API 导入产品系列（Strapi 已运行且 product-series 已注册时使用）
 * 用法: node scripts/seed-series.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const SERIES = [
  { sortOrder: 1, slug: "la", seriesGroup: "speaker", nameZh: "LA 线阵列音箱", nameEn: "LA Line Array", modelPrefix: "LA", featuredProductId: 1, visible: true },
  { sortOrder: 2, slug: "lw", seriesGroup: "speaker", nameZh: "LW 中远程防水音箱", nameEn: "LW Medium-Throw IP", modelPrefix: "LW", featuredProductId: 10, visible: true },
  { sortOrder: 3, slug: "mi", seriesGroup: "speaker", nameZh: "MI 返送音箱", nameEn: "MI Stage Monitor", modelPrefix: "MI", featuredProductId: 19, visible: true },
  { sortOrder: 4, slug: "do", seriesGroup: "speaker", nameZh: "DO 多功能全频音箱", nameEn: "DO Full-Range", modelPrefix: "DO", featuredProductId: 21, visible: true },
  { sortOrder: 5, slug: "sol", seriesGroup: "speaker", nameZh: "SOL 多功能防水音柱", nameEn: "SOL IP Column", modelPrefix: "SOL", featuredProductId: 31, visible: true },
  { sortOrder: 6, slug: "k", seriesGroup: "speaker", nameZh: "K 系列娱乐音箱", nameEn: "K Entertainment", modelPrefix: "K", featuredProductId: 34, visible: true },
  { sortOrder: 7, slug: "re", seriesGroup: "speaker", nameZh: "RE 全频音箱", nameEn: "RE Full-Range", modelPrefix: "RE", featuredProductId: 38, visible: true },
  { sortOrder: 8, slug: "tour", seriesGroup: "speaker", nameZh: "流动演出系统", nameEn: "Touring Systems", modelPrefix: "V", featuredProductId: 42, visible: true },
  { sortOrder: 9, slug: "electronics", seriesGroup: "speaker", nameZh: "电子产品", nameEn: "Electronics", modelPrefix: "EL", featuredProductId: 52, visible: true },
  { sortOrder: 10, slug: "unit48", seriesGroup: "dsp", nameZh: "unit48 系列", nameEn: "unit48 Series", modelPrefix: "Unit48", featuredProductId: 54, visible: true },
  { sortOrder: 11, slug: "suite", seriesGroup: "software", nameZh: "dBcover 软件", nameEn: "dBcover Software", modelPrefix: "dBcover", featuredProductId: 55, visible: true },
  { sortOrder: 12, slug: "turnkey", seriesGroup: "engineering", nameZh: "工程方案", nameEn: "Engineering", modelPrefix: "SI", featuredProductId: 14, visible: true },
  { sortOrder: 13, slug: "p", seriesGroup: "speaker", nameZh: "P 系列塑胶音箱", nameEn: "P Plastic Enclosure", modelPrefix: "P", featuredProductId: 8, visible: false },
  { sortOrder: 14, slug: "driver", seriesGroup: "speaker", nameZh: "喇叭单元", nameEn: "Drivers", modelPrefix: "DU", featuredProductId: 9, visible: false },
  { sortOrder: 15, slug: "accessory", seriesGroup: "speaker", nameZh: "配件", nameEn: "Accessories", modelPrefix: "AC", featuredProductId: 11, visible: false },
];

const env = loadEnv();
const cmsUrl = (env.CMS_URL || env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337").replace(/\/$/, "");
const token = env.STRAPI_API_TOKEN;

if (!token) {
  console.error("缺少 STRAPI_API_TOKEN，请在 .env.local 配置");
  process.exit(1);
}

async function main() {
  const listRes = await fetch(`${cmsUrl}/api/product-series-configs?pagination[pageSize]=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) {
    console.error("无法访问 product-series API:", listRes.status, await listRes.text());
    console.error("请先重启 Strapi 以注册 ProductSeries 内容类型");
    process.exit(1);
  }
  const listJson = await listRes.json();
  const total = listJson.meta?.pagination?.total ?? 0;
  if (total > 0) {
    console.log(`已有 ${total} 条系列，跳过导入`);
    return;
  }

  let ok = 0;
  for (const item of SERIES) {
    const res = await fetch(`${cmsUrl}/api/product-series-configs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: { ...item, publishedAt: new Date().toISOString() },
      }),
    });
    if (res.ok) {
      ok++;
      console.log(`✓ ${item.slug}`);
    } else {
      console.error(`✗ ${item.slug}:`, await res.text());
    }
  }
  console.log(`\n完成：${ok}/${SERIES.length} 条系列已导入`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
