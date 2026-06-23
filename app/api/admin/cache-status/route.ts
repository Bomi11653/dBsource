import { assertAdminRequest } from "@/lib/admin-auth";
import { listLkgCacheSummary } from "@/lib/cms-lkg-cache";
import { getRevalidationAudit } from "@/lib/revalidation-audit";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const audit = getRevalidationAudit();
  const cache = listLkgCacheSummary();

  return NextResponse.json({
    ok: true,
    revalidation: audit,
    lkgCache: cache,
  });
}
