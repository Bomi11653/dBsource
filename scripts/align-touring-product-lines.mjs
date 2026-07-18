/**
 * 将流动演出导航产品对齐为 productLine = tour（第 5 步数据修复）
 * 用法: node scripts/align-touring-product-lines.mjs
 * 可选: node scripts/align-touring-product-lines.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const PRODUCTS_JSON = path.join(ROOT, "cms", "src", "seed", "products.json");

/** 与 lib/product-classification.ts TOURING_PRODUCT_ORDER 一致 */
const TOURING_NAV_MODELS = [
  "Solo C",
  "206M",
  "15N",
  "V4",
  "VIT",
  "V212",
  "V415A",
  "V225A",
];

const TOURING_SERIES = {
  seriesZh: "流动演出系统",
  seriesEn: "Touring Systems",
};

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

async function fetchProduct(cmsUrl, token, model) {
  const q = encodeURIComponent(model);
  const res = await fetch(
    `${cmsUrl}/api/products?filters[model][$eq]=${q}&pagination[pageSize]=1&fields[0]=model&fields[1]=productLine&fields[2]=sortOrder&fields[3]=documentId&fields[4]=seriesZh&fields[5]=seriesEn`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`fetch ${model}: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data?.[0] ?? null;
}

async function updateProduct(cmsUrl, token, documentId, patch) {
  const res = await fetch(`${cmsUrl}/api/products/${documentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: patch }),
  });
  if (!res.ok) {
    throw new Error(`update ${documentId}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function updateProductsJson(models) {
  if (!fs.existsSync(PRODUCTS_JSON)) return 0;
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  let changed = 0;
  for (const item of products) {
    if (!models.includes(item.model)) continue;
    if (item.productLine !== "tour") {
      item.productLine = "tour";
      changed += 1;
    }
    if (item.seriesZh !== TOURING_SERIES.seriesZh) {
      item.seriesZh = TOURING_SERIES.seriesZh;
      changed += 1;
    }
    if (item.seriesEn !== TOURING_SERIES.seriesEn) {
      item.seriesEn = TOURING_SERIES.seriesEn;
      changed += 1;
    }
  }
  if (changed) {
    fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2) + "\n", "utf8");
  }
  return changed;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const env = loadEnv();
  const cmsUrl = (env.CMS_URL || env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337").replace(
    /\/$/,
    ""
  );
  const token = env.STRAPI_API_TOKEN;
  if (!token) {
    console.error("缺少 STRAPI_API_TOKEN（.env.local）");
    process.exit(1);
  }

  const report = [];
  const toFix = [];

  for (const model of TOURING_NAV_MODELS) {
    const row = await fetchProduct(cmsUrl, token, model);
    if (!row) {
      report.push({ model, status: "missing" });
      continue;
    }
    const needsLine = row.productLine !== "tour";
    const needsSeries =
      row.seriesZh !== TOURING_SERIES.seriesZh || row.seriesEn !== TOURING_SERIES.seriesEn;
    if (needsLine || needsSeries) {
      toFix.push({
        model,
        documentId: row.documentId,
        sortOrder: row.sortOrder,
        from: row.productLine,
        needsLine,
        needsSeries,
      });
      report.push({
        model,
        status: "will_update",
        sortOrder: row.sortOrder,
        productLine: `${row.productLine} → tour`,
      });
    } else {
      report.push({ model, status: "ok", sortOrder: row.sortOrder, productLine: row.productLine });
    }
  }

  console.log("流动演出导航产品检查：");
  for (const row of report) {
    if (row.status === "ok") {
      console.log(`  ✓ ${row.model} (#${row.sortOrder}) productLine=${row.productLine}`);
    } else if (row.status === "missing") {
      console.log(`  ✗ ${row.model} 未找到`);
    } else {
      console.log(`  → ${row.model} (#${row.sortOrder}) ${row.productLine}`);
    }
  }

  if (!toFix.length) {
    console.log("\n无需更新，8 个导航位均已 productLine=tour。");
    return;
  }

  if (dryRun) {
    console.log(`\n[dry-run] 将更新 ${toFix.length} 条产品，去掉 --dry-run 后执行。`);
    return;
  }

  for (const item of toFix) {
    const patch = {};
    if (item.needsLine) patch.productLine = "tour";
    if (item.needsSeries) {
      patch.seriesZh = TOURING_SERIES.seriesZh;
      patch.seriesEn = TOURING_SERIES.seriesEn;
    }
    await updateProduct(cmsUrl, token, item.documentId, patch);
    console.log(`已更新 ${item.model} (${item.documentId})`);
  }

  const seedChanges = updateProductsJson(TOURING_NAV_MODELS.map((m) => m));
  if (seedChanges) {
    console.log(`已同步 cms/src/seed/products.json（${seedChanges} 处字段）`);
  }

  console.log("\n完成。请刷新前台 /products?group=touring 与导航栏验证 8 个流动演出入口。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
