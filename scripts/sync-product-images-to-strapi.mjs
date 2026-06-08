/**
 * 将 public/images/products/ 中的封面与图集上传到 Strapi 并更新对应产品。
 * 用法: npm run sync:product-images && npm run sync:product-images:strapi
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_PRODUCTS = path.join(ROOT, "public", "images", "products");
const ENV_PATH = path.join(ROOT, ".env.local");
const PRODUCTS_JSON = path.join(ROOT, "cms", "src", "seed", "products.json");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function scanLocalProductImages() {
  if (!fs.existsSync(PUBLIC_PRODUCTS)) return {};
  const map = {};
  for (const name of fs.readdirSync(PUBLIC_PRODUCTS)) {
    const dir = path.join(PUBLIC_PRODUCTS, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const model = name.replace(/-/g, " ");
    const cover = path.join(dir, "cover.jpg");
    const galleryDir = path.join(dir, "gallery");
    if (!fs.existsSync(cover)) continue;
    const gallery = [];
    if (fs.existsSync(galleryDir)) {
      for (const f of fs.readdirSync(galleryDir).sort()) {
        if (/\.(jpg|jpeg|png|webp)$/i.test(f)) {
          gallery.push(path.join(galleryDir, f));
        }
      }
    }
    map[model] = { cover, gallery };
  }
  return map;
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
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

  if (!res.ok) {
    throw new Error(`upload failed ${path.basename(filePath)}: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const file = Array.isArray(json) ? json[0] : json;
  if (!file?.id) throw new Error(`invalid upload response for ${filePath}`);
  return file.id;
}

async function fetchAllProducts(cmsUrl, token) {
  const items = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await fetch(
      `${cmsUrl}/api/products?pagination[page]=${page}&pagination[pageSize]=${pageSize}&fields[0]=model&fields[1]=documentId&fields[2]=sortOrder`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`list products: ${res.status} ${await res.text()}`);
    const json = await res.json();
    items.push(...(json.data ?? []));
    const total = json.meta?.pagination?.total ?? items.length;
    if (items.length >= total) break;
    page += 1;
  }
  return items;
}

async function updateProduct(cmsUrl, token, documentId, imageId, galleryIds) {
  const res = await fetch(`${cmsUrl}/api/products/${documentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        image: imageId,
        gallery: galleryIds,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`update ${documentId}: ${res.status} ${await res.text()}`);
  }
}

function updateProductsJson(localMap) {
  if (!fs.existsSync(PRODUCTS_JSON)) return;
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  let changed = 0;
  for (const item of products) {
    const set = localMap[item.model];
    if (!set) continue;
    const modelKey = item.model.replace(/ /g, "-");
    const coverUrl = `/images/products/${modelKey}/cover.jpg`;
    const galleryUrls = set.gallery.map((_, i) => {
      const ext = path.extname(set.gallery[i]).toLowerCase();
      const suffix = ext === ".jpeg" ? ".jpg" : ext;
      return `/images/products/${modelKey}/gallery/${String(i + 1).padStart(2, "0")}${suffix}`;
    });
    item.image = coverUrl;
    item.gallery = galleryUrls;
    changed += 1;
  }
  if (changed) {
    fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2) + "\n", "utf8");
    console.log(`Updated cms/src/seed/products.json for ${changed} models`);
  }
}

async function main() {
  const env = loadEnv();
  const cmsUrl = (env.CMS_URL || env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337").replace(
    /\/$/,
    ""
  );
  const token = env.STRAPI_API_TOKEN;
  if (!token) {
    console.error("缺少 STRAPI_API_TOKEN");
    process.exit(1);
  }

  const localMap = scanLocalProductImages();
  const models = Object.keys(localMap);
  if (!models.length) {
    console.error("未找到 public/images/products/ 下的产品图，请先运行: npm run sync:product-images");
    process.exit(1);
  }

  console.log(`本地产品图: ${models.length} 个型号`);

  const health = await fetch(`${cmsUrl}/api/products?pagination[pageSize]=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!health.ok) {
    console.error("Strapi 不可用，请先启动 Strapi (npm run develop)");
    process.exit(1);
  }

  const products = await fetchAllProducts(cmsUrl, token);
  const byModel = new Map(products.map((p) => [p.model, p]));

  let ok = 0;
  for (const model of models.sort()) {
    const product = byModel.get(model);
    if (!product?.documentId) {
      console.warn(`⚠ ${model}: Strapi 中无对应产品，跳过`);
      continue;
    }

    const { cover, gallery } = localMap[model];
    try {
      const coverId = await uploadFile(cmsUrl, token, cover);
      const galleryIds = [];
      for (const g of gallery) {
        galleryIds.push(await uploadFile(cmsUrl, token, g));
      }
      await updateProduct(cmsUrl, token, product.documentId, coverId, galleryIds);
      ok += 1;
      console.log(`✓ ${model} (cover + ${gallery.length} gallery)`);
    } catch (e) {
      console.error(`✗ ${model}:`, e.message);
    }
  }

  updateProductsJson(localMap);
  console.log(`\n完成：${ok}/${models.length} 个型号已同步到 Strapi`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
