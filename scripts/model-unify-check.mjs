import fs from "fs";
import { mapStrapiProduct } from "../lib/strapi-mapper.ts";
import { getProductDisplayTitle } from "../lib/product-display.ts";
import {
  getTouringProductNavItems,
  getTouringProductLabel,
} from "../lib/product-classification.ts";

const cache = JSON.parse(
  fs.readFileSync(new URL("../.data/cms-cache/products.json", import.meta.url), "utf8")
).payload;

const products = cache.map((p, i) => {
  const specs = p.specs;
  const name = p.name;
  const series = p.series;
  const desc = p.desc;
  const detail = p.detail;
  return mapStrapiProduct(
    {
      ...p,
      nameZh: name?.zh,
      nameEn: name?.en,
      specsZh: specs?.zh,
      specsEn: specs?.en,
      seriesZh: series?.zh,
      seriesEn: series?.en,
      descZh: desc?.zh,
      descEn: desc?.en,
      detailZh: detail?.zh,
      detailEn: detail?.en,
      sortOrder: p.id,
    },
    "",
    i
  );
});

let displayOk = 0;
for (const p of products) {
  const zh = getProductDisplayTitle(p, "zh");
  const en = getProductDisplayTitle(p, "en");
  if (zh.primary === p.model && en.primary === p.model) displayOk += 1;
}

const { items } = getTouringProductNavItems(products);
const navOk = items.filter((item) => getTouringProductLabel(item, "zh") === item.model).length;

console.log(`Display model match: ${displayOk}/${products.length}`);
console.log(`Nav label match: ${navOk}/${items.length}`);
for (const model of ["VIT", "V4", "V4SA", "LA206", "V415A"]) {
  const p = products.find((x) => x.model === model);
  if (!p) continue;
  console.log(`${model}: list=${getProductDisplayTitle(p, "zh").primary}`);
}
