import { revalidatePath } from "next/cache";
import type { AdminCollection } from "./strapi-admin";

export type RevalidateModule =
  | "products"
  | "cases"
  | "downloads"
  | "about"
  | "contact"
  | "home"
  | "all";

export const REVALIDATE_MODULES: Exclude<RevalidateModule, "all">[] = [
  "home",
  "products",
  "cases",
  "downloads",
  "about",
  "contact",
];

export function isRevalidateModule(value: string): value is RevalidateModule {
  return (
    value === "all" ||
    value === "products" ||
    value === "cases" ||
    value === "downloads" ||
    value === "about" ||
    value === "contact" ||
    value === "home"
  );
}

function trackRevalidate(revalidated: Set<string>, path: string, type?: "layout" | "page") {
  try {
    revalidatePath(path, type);
    revalidated.add(type ? `${path} (${type})` : path);
  } catch {
    // ignore invalid paths
  }
}

/** 按模块刷新官网静态/ISR 缓存 */
export function revalidateSiteModules(
  modules: RevalidateModule[],
  options?: { detailId?: string }
): { revalidated: string[] } {
  const revalidated = new Set<string>();
  const detailId = options?.detailId?.trim();
  const runAll = modules.includes("all");
  const targets = runAll ? REVALIDATE_MODULES : modules.filter((m): m is Exclude<RevalidateModule, "all"> => m !== "all");

  for (const siteModule of targets) {
    switch (siteModule) {
      case "home":
        trackRevalidate(revalidated, "/");
        break;
      case "products":
        trackRevalidate(revalidated, "/");
        trackRevalidate(revalidated, "/products");
        if (detailId) {
          trackRevalidate(revalidated, `/products/${detailId}`);
        } else {
          trackRevalidate(revalidated, "/products", "layout");
        }
        break;
      case "cases":
        trackRevalidate(revalidated, "/");
        trackRevalidate(revalidated, "/cases");
        if (detailId) {
          trackRevalidate(revalidated, `/cases/${detailId}`);
        } else {
          trackRevalidate(revalidated, "/cases", "layout");
        }
        break;
      case "downloads":
        trackRevalidate(revalidated, "/");
        trackRevalidate(revalidated, "/downloads");
        break;
      case "about":
        trackRevalidate(revalidated, "/");
        trackRevalidate(revalidated, "/about");
        break;
      case "contact":
        trackRevalidate(revalidated, "/");
        trackRevalidate(revalidated, "/contact");
        break;
    }
  }

  return { revalidated: Array.from(revalidated) };
}

export function modulesForAdminCollection(
  collection: AdminCollection | "contact-info"
): RevalidateModule[] {
  const map: Record<string, RevalidateModule[]> = {
    products: ["products", "home"],
    cases: ["cases", "home"],
    downloads: ["downloads", "home"],
    "about-sections": ["about", "home"],
    "qr-codes": ["contact", "home"],
    scenes: ["home"],
    "product-series-configs": ["home", "products"],
    "contact-info": ["home", "contact"],
    leads: [],
  };
  return map[collection] ?? ["home"];
}

export function extractDetailId(
  collection: AdminCollection,
  data?: Record<string, unknown>
): string | undefined {
  if (collection !== "products" && collection !== "cases") return undefined;
  const id = data?.legacyId ?? data?.id;
  if (id == null) return undefined;
  const text = String(id).trim();
  return text || undefined;
}

/** 后台保存 Strapi 内容后调用，与 /api/revalidate 使用相同逻辑 */
export function revalidateAfterAdminSave(
  collection: AdminCollection | "contact-info",
  data?: Record<string, unknown>
): { revalidated: string[]; modules: RevalidateModule[] } {
  const modules = Array.from(new Set(modulesForAdminCollection(collection)));
  if (!modules.length) {
    return { revalidated: [], modules: [] };
  }
  const detailId =
    collection !== "contact-info" ? extractDetailId(collection, data) : undefined;
  const { revalidated } = revalidateSiteModules(modules, { detailId });
  return { revalidated, modules };
}

export function getRevalidateSecret(): string | null {
  return process.env.REVALIDATE_SECRET?.trim() || null;
}

export function matchesRevalidateSecret(provided: string | null | undefined): boolean {
  const secret = getRevalidateSecret();
  if (!secret || !provided) return false;
  return provided === secret;
}
