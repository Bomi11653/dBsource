import { revalidatePath } from "next/cache";
import type { AdminCollection } from "./strapi-admin";

export type RevalidateModule =
  | "products"
  | "cases"
  | "downloads"
  | "about"
  | "contact"
  | "home"
  | "footer"
  | "all";

export const REVALIDATE_MODULES: Exclude<RevalidateModule, "all">[] = [
  "home",
  "products",
  "cases",
  "downloads",
  "about",
  "contact",
  "footer",
];

/** 带页脚的主站页面（Logo / 二维码 / 社交链接变更时刷新） */
export const FOOTER_RELATED_PATHS = [
  "/",
  "/products",
  "/cases",
  "/downloads",
  "/about",
  "/contact",
  "/configurator",
] as const;

function trackRevalidate(revalidated: Set<string>, path: string, type?: "layout" | "page") {
  try {
    revalidatePath(path, type);
    revalidated.add(type ? `${path} (${type})` : path);
  } catch {
    // ignore invalid paths
  }
}

/** 按模块刷新官网静态/ISR 缓存（精准路径，避免无差别全站 layout 刷新） */
export function revalidateSiteModules(
  modules: RevalidateModule[],
  options?: { detailId?: string }
): { revalidated: string[] } {
  const revalidated = new Set<string>();
  const detailId = options?.detailId?.trim();
  const runAll = modules.includes("all");
  const targets = runAll
    ? REVALIDATE_MODULES
    : modules.filter((m): m is Exclude<RevalidateModule, "all"> => m !== "all");

  for (const siteModule of targets) {
    switch (siteModule) {
      case "home":
        trackRevalidate(revalidated, "/");
        break;
      case "products":
        trackRevalidate(revalidated, "/products");
        if (detailId) {
          trackRevalidate(revalidated, `/products/${detailId}`);
        }
        break;
      case "cases":
        trackRevalidate(revalidated, "/cases");
        if (detailId) {
          trackRevalidate(revalidated, `/cases/${detailId}`);
        }
        break;
      case "downloads":
        trackRevalidate(revalidated, "/downloads");
        break;
      case "about":
        trackRevalidate(revalidated, "/about");
        break;
      case "contact":
        trackRevalidate(revalidated, "/contact");
        break;
      case "footer":
        for (const path of FOOTER_RELATED_PATHS) {
          trackRevalidate(revalidated, path);
        }
        break;
    }
  }

  return { revalidated: Array.from(revalidated) };
}

export function modulesForAdminCollection(
  collection: AdminCollection | "contact-info" | "global-setting" | "social-links"
): RevalidateModule[] {
  const map: Record<string, RevalidateModule[]> = {
    products: ["products", "home"],
    cases: ["cases", "home"],
    downloads: ["downloads"],
    "about-sections": ["about"],
    scenes: ["home"],
    "product-series-configs": ["products", "home"],
    "contact-info": ["contact", "home"],
    "global-setting": ["home", "footer"],
    "qr-codes": ["footer"],
    "social-links": ["footer"],
    leads: [],
  };
  return map[collection] ?? ["home"];
}

export function extractDetailId(
  collection: AdminCollection,
  data?: Record<string, unknown>
): string | undefined {
  if (collection !== "products" && collection !== "cases") return undefined;
  const id =
    collection === "products"
      ? data?.sortOrder ?? data?.legacyId ?? data?.id
      : data?.legacyId ?? data?.id;
  if (id == null) return undefined;
  const text = String(id).trim();
  return text || undefined;
}

/** 后台保存 Strapi 内容后调用，与 /api/revalidate 使用相同逻辑 */
export function revalidateAfterAdminSave(
  collection: AdminCollection | "contact-info" | "global-setting" | "social-links",
  data?: Record<string, unknown>
): { revalidated: string[]; modules: RevalidateModule[] } {
  const modules = Array.from(new Set(modulesForAdminCollection(collection)));
  if (!modules.length) {
    return { revalidated: [], modules: [] };
  }
  const detailId =
    collection === "products" || collection === "cases"
      ? extractDetailId(collection, data)
      : undefined;
  const { revalidated } = revalidateSiteModules(modules, { detailId });
  return { revalidated, modules };
}

export function isRevalidateModule(value: string): value is RevalidateModule {
  return (
    value === "all" ||
    value === "products" ||
    value === "cases" ||
    value === "downloads" ||
    value === "about" ||
    value === "contact" ||
    value === "home" ||
    value === "footer"
  );
}

export function getRevalidateSecret(): string | null {
  return process.env.REVALIDATE_SECRET?.trim() || null;
}

export function matchesRevalidateSecret(provided: string | null | undefined): boolean {
  const secret = getRevalidateSecret();
  if (!secret || !provided) return false;
  return provided === secret;
}
