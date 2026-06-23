import { assertAdminRequest } from "@/lib/admin-auth";
import { runCmsHealthCheck } from "@/lib/cms-health-check";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const result = await runCmsHealthCheck();
  return NextResponse.json(result, { status: result.error ? 503 : 200 });
}
