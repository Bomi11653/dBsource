import { assertAdminRequest } from "@/lib/admin-auth";
import { buildAdminSaveResponse } from "@/lib/admin-post-save";
import { adminStrapiRequest } from "@/lib/strapi-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;
  const result = await adminStrapiRequest(
    "GET",
    "/global-setting?populate[logo][fields][0]=url&populate[homeFeaturedCaseImage][fields][0]=url"
  );
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function PUT(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;
  const body = (await request.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = { ...body };
  const now = new Date().toISOString();
  const result = await adminStrapiRequest("PUT", "/global-setting", {
    data: { ...data, publishedAt: now },
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  const saveMeta = await buildAdminSaveResponse("global-setting", { ok: true }, data);
  return NextResponse.json({ ...result, saved: saveMeta.saved, revalidation: saveMeta.revalidation, cacheRefresh: saveMeta.cacheRefresh });
}
