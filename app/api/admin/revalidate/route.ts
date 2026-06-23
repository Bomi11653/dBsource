import { assertAdminRequest } from "@/lib/admin-auth";
import { isRevalidateModule, revalidateSiteModules, type RevalidateModule } from "@/lib/revalidate";
import { recordRevalidationAudit } from "@/lib/revalidation-audit";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RevalidateBody = {
  modules?: string[];
  detailId?: string | number;
  test?: boolean;
};

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  let body: RevalidateBody = {};
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    // default to full refresh
  }

  const modules: RevalidateModule[] = Array.isArray(body.modules)
    ? body.modules.filter(isRevalidateModule)
    : ["all"];
  const targetModules = modules.length ? modules : (["all"] as RevalidateModule[]);
  const detailId = body.detailId != null ? String(body.detailId) : undefined;
  const trigger = body.test === true ? "test" : "manual";

  try {
    const { revalidated } = revalidateSiteModules(targetModules, { detailId });
    const record = recordRevalidationAudit(trigger, {
      ok: true,
      modules: targetModules,
      paths: revalidated,
    });

    return NextResponse.json({
      ok: true,
      modules: targetModules,
      module: targetModules.includes("all") ? "all" : (targetModules[0] ?? "all"),
      paths: revalidated,
      revalidated,
      revalidatedAt: record.revalidatedAt,
      pathCount: record.pathCount,
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "revalidate failed";
    const record = recordRevalidationAudit(trigger, {
      ok: false,
      modules: targetModules,
      paths: [],
      errorMessage,
    });

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        modules: targetModules,
        paths: [],
        revalidatedAt: record.revalidatedAt,
        pathCount: 0,
      },
      { status: 500 }
    );
  }
}
