import { assertAdminRequest } from "@/lib/admin-auth";
import { isRevalidateModule, revalidateSiteModules, type RevalidateModule } from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RevalidateBody = {
  modules?: string[];
  detailId?: string | number;
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
  const { revalidated } = revalidateSiteModules(targetModules, { detailId });

  return NextResponse.json({
    ok: true,
    modules: targetModules,
    revalidated,
    revalidatedAt: new Date().toISOString(),
  });
}
