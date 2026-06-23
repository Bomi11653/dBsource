import { assertAdminRequest } from "@/lib/admin-auth";
import { clearAllLkgCaches } from "@/lib/cms-lkg-cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  clearAllLkgCaches();
  return NextResponse.json({
    ok: true,
    clearedAt: new Date().toISOString(),
  });
}
