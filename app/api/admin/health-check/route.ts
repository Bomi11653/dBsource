import { assertAdminRequest } from "@/lib/admin-auth";
import { runCmsHealthCheck, type HealthCheckResult } from "@/lib/cms-health-check";
import { runServiceHealthCheck, type ServiceHealthCheck } from "@/lib/service-health";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type AdminHealthCheckResponse = {
  service: ServiceHealthCheck;
  content?: HealthCheckResult;
};

/** GET：服务与环境健康检查 */
export async function GET(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const service = await runServiceHealthCheck();
  return NextResponse.json({ ok: service.ok, service }, { status: service.ok ? 200 : 503 });
}

/** POST：内容数据健康检查（案例/下载/产品） */
export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const includeService = request.nextUrl.searchParams.get("service") === "1";
  const [service, content] = await Promise.all([
    includeService ? runServiceHealthCheck() : Promise.resolve(null),
    runCmsHealthCheck(),
  ]);

  const body: AdminHealthCheckResponse & { ok: boolean } = {
    ok: content.ok && (service?.ok !== false),
    service: service ?? (await runServiceHealthCheck()),
    content,
  };

  const status = body.ok ? 200 : 503;
  return NextResponse.json(body, { status: content.error ? 503 : status });
}
