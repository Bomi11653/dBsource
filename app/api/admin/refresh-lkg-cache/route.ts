import { assertAdminRequest } from "@/lib/admin-auth";
import { refreshAllLkgCaches } from "@/lib/cms-cache-refresh";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const result = await refreshAllLkgCaches();
  return NextResponse.json({
    ok: result.ok,
    sourceUrl: result.sourceUrl,
    results: result.results,
    refreshedAt: new Date().toISOString(),
  });
}
