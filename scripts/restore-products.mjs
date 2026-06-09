/**
 * 恢复被误删的产品到 Strapi
 * 用法: node scripts/restore-products.mjs V212 "Solo C"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const PRODUCTS_JSON = path.join(ROOT, "cms", "src", "seed", "products.json");
const PUBLIC_PRODUCTS = path.join(ROOT, "public", "images", "products");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function uploadFile(cmsUrl, token, filePath) {
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: mimeFor(filePath) });
  const form = new FormData();
  form.append("files", blob, path.basename(filePath));
  const res = await fetch(`${cmsUrl}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`upload ${path.basename(filePath)}: ${res.status}`);
  const json = await res.json();
  const file = Array.isArray(json) ? json[0] : json;
  if (!file?.id) throw new Error(`invalid upload ${filePath}`);
  return file.id;
}

function localImages(model) {
  const dirName = model.replace(/ /g, "-");
  const dir = path.join(PUBLIC_PRODUCTS, dirName);
  if (!fs.existsSync(dir)) return null;
  const cover = path.join(dir, "cover.jpg");
  if (!fs.existsSync(cover)) return null;
  const galleryDir = path.join(dir, "gallery");
  const gallery = [];
  if (fs.existsSync(galleryDir)) {
    for (const f of fs.readdirSync(galleryDir).sort()) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(f)) gallery.push(path.join(galleryDir, f));
    }
  }
  return { cover, gallery };
}

async function findProduct(cmsUrl, token, model) {
  const q = encodeURIComponent(model);
  const res = await fetch(
    `${cmsUrl}/api/products?filters[model][$eq]=${q}&pagination[pageSize]=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`find ${model}: ${res.status}`);
  const json = await res.json();
  return json.data?.[0] ?? null;
}

async function createProduct(cmsUrl, token, item, imageId, galleryIds) {
  const payload = {
    model: item.model,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    descZh: item.descZh,
    descEn: item.descEn,
    detailZh: item.detailZh ?? item.descZh,
    detailEn: item.detailEn ?? item.descEn,
    specsZh: item.specsZh ?? "",
    specsEn: item.specsEn ?? "",
    seriesZh: item.seriesZh ?? "",
    seriesEn: item.seriesEn ?? "",
    productLine: item.productLine,
    seriesGroup: item.seriesGroup,
    category: item.category,
    sortOrder: item.sortOrder,
    publishedAt: new Date().toISOString(),
  };
  if (imageId) payload.image = imageId;
  if (galleryIds?.length) payload.gallery = galleryIds;

  const res = await fetch(`${cmsUrl}/api/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error(`create ${item.model}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const models = process.argv.slice(2);
  if (!models.length) {
    console.error('用法: node scripts/restore-products.mjs V212 "Solo C"');
    process.exit(1);
  }

  const env = loadEnv();
  const cmsUrl = (env.CMS_URL || "http://localhost:1337").replace(/\/$/, "");
  const token = env.STRAPI_API_TOKEN;
  if (!token) {
    console.error("缺少 STRAPI_API_TOKEN");
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  const placeholder = path.join(ROOT, "public", "images", "product-1.svg");

  for (const model of models) {
    const item = catalog.find((p) => p.model === model);
    if (!item) {
      console.warn(`⚠ 种子数据中未找到 ${model}`);
      continue;
    }

    const existing = await findProduct(cmsUrl, token, model);
    if (existing) {
      console.log(`· ${model} 已存在，跳过`);
      continue;
    }

    let imageId = null;
    let galleryIds = [];
    const local = localImages(model);
    if (local) {
      console.log(`↑ ${model} 上传封面 + ${local.gallery.length} 张图集…`);
      imageId = await uploadFile(cmsUrl, token, local.cover);
      for (const g of local.gallery) {
        galleryIds.push(await uploadFile(cmsUrl, token, g));
      }
    } else if (fs.existsSync(placeholder)) {
      console.log(`↑ ${model} 无本地图，使用占位图…`);
      imageId = await uploadFile(cmsUrl, token, placeholder);
      galleryIds = [imageId];
    }

    await createProduct(cmsUrl, token, item, imageId, galleryIds);
    console.log(`✓ ${model} 已恢复 (sortOrder ${item.sortOrder})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
