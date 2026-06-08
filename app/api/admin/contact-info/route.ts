import { assertAdminRequest } from "@/lib/admin-auth";
import { adminStrapiRequest } from "@/lib/strapi-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const denied = assertAdminRequest(req);
  if (denied) return denied;
  const result = await adminStrapiRequest("GET", "/contact-info?populate=*");
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function PUT(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;
  const body = await request.json();
  const result = await adminStrapiRequest("PUT", "/contact-info", {
    data: { ...body, publishedAt: new Date().toISOString() },
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
