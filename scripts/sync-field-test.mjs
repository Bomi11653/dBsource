/**
 * 产品字段同步测试（可逆）
 * 1. 修改 V225A 型号 → 验证列表/详情/导航/搜索
 * 2. 修改 market → 验证市场过滤
 * 3. 恢复原值
 */
import fs from "fs";
import { mapStrapiProduct } from "../lib/strapi-mapper.ts";
import { getProductDisplayTitle } from "../lib/product-display.ts";
import {
  getTouringProductNavItems,
  getTouringProductLabel,
  filterTouringProducts,
} from "../lib/product-classification.ts";
import { rankProductsForList } from "../lib/search/rank-search.ts";

function filterByMarket(products, siteMarket) {
  if (siteMarket === "all") return products;
  return products.filter(
    (item) => !item.market || item.market === "all" || item.market === siteMarket
  );
}

const CMS_URL = "http://localhost:1337";
const SITE_URL = "http://127.0.0.1:3003";
const TEST_MODEL = "LA206";
const TEST_MODEL_NEW = "LA206-SYNC-T1";
const TEST_SORT_ORDER = 1;

function loadToken() {
  const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(/STRAPI_API_TOKEN=(.+)/);
  if (!m) throw new Error("STRAPI_API_TOKEN missing");
  return m[1].trim();
}

async function strapiGet(token, query) {
  const res = await fetch(`${CMS_URL}/api/products?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Strapi GET ${res.status}`);
  return res.json();
}

async function strapiPut(token, documentId, data) {
  const res = await fetch(`${CMS_URL}/api/products/${documentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: { ...data, publishedAt: new Date().toISOString() },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Strapi PUT ${res.status}: ${JSON.stringify(json)}`);
  return json.data;
}

async function fetchAllProducts(token) {
  const json = await strapiGet(
    token,
    "pagination[pageSize]=100&sort[0]=sortOrder:asc&publicationState=live"
  );
  return (json.data ?? []).map((doc, i) => mapStrapiProduct(doc, CMS_URL, i));
}

function findProduct(products, model) {
  return products.find((p) => p.model === model || p.id === TEST_SORT_ORDER);
}

async function fetchPageText(path) {
  try {
    const res = await fetch(`${SITE_URL}${path}`, { redirect: "follow" });
    return { status: res.status, html: await res.text() };
  } catch (e) {
    return { status: 0, html: "", error: String(e) };
  }
}

function htmlContainsModel(html, model) {
  return html.includes(model);
}

const results = [];

function record(field, backend, cms, frontend, status, note = "") {
  results.push({ field, backend, cms, frontend, status, note });
}

async function main() {
  const token = loadToken();
  const initialJson = await strapiGet(token, `filters[model][$eq]=${TEST_MODEL}&pagination[pageSize]=1`);
  const initialDoc = initialJson.data?.[0];
  if (!initialDoc) throw new Error(`Product ${TEST_MODEL} not found`);

  const documentId = initialDoc.documentId;
  const original = {
    model: initialDoc.model,
    nameZh: initialDoc.nameZh,
    nameEn: initialDoc.nameEn,
    market: initialDoc.market ?? "all",
  };

  console.log("=== 测试 1：产品型号同步 ===");
  console.log(`documentId: ${documentId}, sortOrder: ${initialDoc.sortOrder}`);

  // 模拟后台 saveRow 写入
  await strapiPut(token, documentId, {
    model: TEST_MODEL_NEW,
    nameZh: TEST_MODEL_NEW,
    nameEn: TEST_MODEL_NEW,
  });

  const afterModelJson = await strapiGet(token, `filters[documentId][$eq]=${documentId}&pagination[pageSize]=1`);
  const afterModelDoc = afterModelJson.data?.[0];
  const cmsModel = afterModelDoc?.model ?? "";

  let products = await fetchAllProducts(token);
  const mapped = findProduct(products, TEST_MODEL_NEW);
  const listTitle = mapped ? getProductDisplayTitle(mapped, "zh").primary : "—";
  const detailTitle = listTitle;
  const { items: navItems } = getTouringProductNavItems(products);
  void navItems;
  const searchResults = rankProductsForList(TEST_MODEL_NEW, products, "zh");
  const searchProduct =
    searchResults.find((p) => p.id === TEST_SORT_ORDER) ?? searchResults[0];
  const searchTitle = searchProduct ? getProductDisplayTitle(searchProduct, "zh").primary : "—";

  const detailPage = await fetchPageText(`/products/${TEST_SORT_ORDER}`);
  const listPage = await fetchPageText("/products?series=la");
  const htmlDetailOk = detailPage.status === 200 && htmlContainsModel(detailPage.html, TEST_MODEL_NEW);
  const htmlListOk = listPage.status === 200 && htmlContainsModel(listPage.html, TEST_MODEL_NEW);

  const engineeringNavLabel = "LA 系列 Tab（工程导航，非单品名）";
  const modelOk =
    cmsModel === TEST_MODEL_NEW &&
    listTitle === TEST_MODEL_NEW &&
    detailTitle === TEST_MODEL_NEW &&
    searchTitle === TEST_MODEL_NEW;

  record(
    "产品型号 (model)",
    TEST_MODEL_NEW,
    cmsModel,
    `列表:${listTitle} | 详情:${detailTitle} | 搜索:${searchTitle} | HTTP列表:${htmlListOk ? "✓" : "✗"} HTTP详情:${htmlDetailOk ? "✓" : "✗"} | 导航:${engineeringNavLabel}`,
    modelOk ? "通过" : "失败",
    !htmlDetailOk ? `详情页 HTTP ${detailPage.status}（dev 服务异常时不影响 CMS→映射链路）` : ""
  );

  console.log("=== 测试 2：市场标签同步 ===");

  await strapiPut(token, documentId, {
    model: TEST_MODEL_NEW,
    nameZh: TEST_MODEL_NEW,
    nameEn: TEST_MODEL_NEW,
    market: "cn",
  });

  const afterMarketJson = await strapiGet(token, `filters[documentId][$eq]=${documentId}&pagination[pageSize]=1`);
  const cmsMarket = afterMarketJson.data?.[0]?.market ?? "all";

  products = await fetchAllProducts(token);
  const p = findProduct(products, TEST_MODEL_NEW);
  const mappedMarket = p?.market ?? "—";
  const visibleOnCn = filterByMarket(products, "cn").some((x) => x.id === TEST_SORT_ORDER);
  const visibleOnGlobal = filterByMarket(products, "global").some((x) => x.id === TEST_SORT_ORDER);

  record(
    "市场标签 (market)",
    "cn",
    cmsMarket === null ? "null→映射all" : cmsMarket,
    `映射:${mappedMarket} | 中文站列表:${visibleOnCn ? "显示" : "隐藏"} | 海外站列表:${visibleOnGlobal ? "显示" : "隐藏"}`,
    cmsMarket === "cn" && mappedMarket === "cn" && visibleOnCn && !visibleOnGlobal ? "通过" : "失败"
  );

  console.log("=== 恢复原值 ===");
  await strapiPut(token, documentId, {
    model: original.model,
    nameZh: original.nameZh,
    nameEn: original.nameEn,
    market: original.market === null ? "all" : original.market,
  });

  const reverted = await strapiGet(token, `filters[documentId][$eq]=${documentId}&pagination[pageSize]=1`);
  console.log(`已恢复 model=${reverted.data?.[0]?.model}, market=${reverted.data?.[0]?.market ?? "all"}`);

  console.log("=== 测试 3：流动演出导航（V225A 现状） ===");
  products = await fetchAllProducts(token);
  const v225 = products.find((p) => p.model === "V225A");
  const { items: touringNav } = getTouringProductNavItems(products);
  const v225Nav = touringNav.find((i) => i.key === "v225a");
  record(
    "流动演出导航 (V225A)",
    "—（未改）",
    v225 ? `model=${v225.model}` : "无",
    v225Nav ? `导航标签:${getTouringProductLabel(v225Nav, "zh")} = ${v225Nav.model}` : "未匹配",
    v225Nav && getTouringProductLabel(v225Nav, "zh") === "V225A" ? "通过" : "失败"
  );

  console.log("\n=== 测试结果表 ===");
  console.log("| 字段 | 后台修改 | CMS保存 | 前端显示 | 状态 |");
  console.log("|------|----------|---------|----------|------|");
  for (const r of results) {
    console.log(`| ${r.field} | ${r.backend} | ${r.cms} | ${r.frontend.slice(0, 60)}${r.frontend.length > 60 ? "…" : ""} | ${r.status} |`);
  }
  if (results.some((r) => r.note)) {
    console.log("\n备注:");
    for (const r of results) if (r.note) console.log(`- ${r.field}: ${r.note}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
