import { refreshLkgForAdminCollection, type CacheRefreshResult } from "@/lib/cms-cache-refresh";
import {
  modulesForAdminCollection,
  revalidateSiteModules,
  extractDetailId,
  type RevalidateModule,
} from "@/lib/revalidate";
import { recordRevalidationAudit } from "@/lib/revalidation-audit";
import type { AdminCollection } from "@/lib/strapi-admin";
import type { AdminSaveResponse, RevalidationPayload } from "@/lib/admin-save-toast";

export type { AdminSaveResponse, RevalidationPayload } from "@/lib/admin-save-toast";
export { formatSaveToast } from "@/lib/admin-save-toast";

type SaveCollection = AdminCollection | "contact-info" | "global-setting" | "social-links";

function primaryModule(modules: RevalidateModule[]): string {
  if (modules.includes("all")) return "all";
  return modules[0] ?? "home";
}

export function runRevalidationForCollection(
  collection: SaveCollection,
  data?: Record<string, unknown>,
  trigger: "automatic" | "manual" | "test" = "automatic"
): RevalidationPayload {
  const modules = Array.from(
    new Set(
      collection === "global-setting"
        ? modulesForAdminCollection("global-setting")
        : modulesForAdminCollection(collection)
    )
  );

  if (!modules.length) {
    const empty: RevalidationPayload = {
      ok: true,
      module: collection,
      modules: [],
      paths: [],
      revalidatedAt: new Date().toISOString(),
    };
    recordRevalidationAudit(trigger, { ok: true, modules: [], paths: [] });
    return empty;
  }

  try {
    const detailId =
      collection !== "contact-info" &&
      collection !== "global-setting" &&
      collection !== "social-links"
        ? extractDetailId(collection, data)
        : undefined;
    const { revalidated } = revalidateSiteModules(modules, { detailId });
    const payload: RevalidationPayload = {
      ok: true,
      module: primaryModule(modules),
      modules,
      paths: revalidated,
      revalidatedAt: new Date().toISOString(),
    };
    recordRevalidationAudit(trigger, {
      ok: true,
      modules,
      paths: revalidated,
    });
    return payload;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "revalidate failed";
    const payload: RevalidationPayload = {
      ok: false,
      module: primaryModule(modules),
      modules,
      paths: [],
      revalidatedAt: new Date().toISOString(),
      errorMessage,
    };
    recordRevalidationAudit(trigger, {
      ok: false,
      modules,
      paths: [],
      errorMessage,
    });
    return payload;
  }
}

export async function buildAdminSaveResponse(
  collection: SaveCollection,
  strapiResult: { ok: boolean; error?: string },
  data?: Record<string, unknown>
): Promise<AdminSaveResponse> {
  if (!strapiResult.ok) {
    return { ok: false, saved: false, error: strapiResult.error ?? "保存失败" };
  }

  const revalidation = runRevalidationForCollection(collection, data, "automatic");
  const cacheRefresh = await refreshLkgForAdminCollection(collection);

  return {
    ok: true,
    saved: true,
    revalidation,
    cacheRefresh,
  };
}
