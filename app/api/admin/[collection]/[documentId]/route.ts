import { assertAdminRequest } from "@/lib/admin-auth";
import { ADMIN_COLLECTIONS, adminStrapiRequest, type AdminCollection } from "@/lib/strapi-admin";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: { collection: string; documentId: string } };

function isCollection(value: string): value is AdminCollection {
  return value in ADMIN_COLLECTIONS;
}

export async function PUT(request: NextRequest, { params }: Props) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  if (!isCollection(params.collection)) {
    return NextResponse.json({ ok: false, error: "未知内容类型" }, { status: 404 });
  }

  const body = await request.json();
  const result = await adminStrapiRequest(
    "PUT",
    `/${params.collection}/${params.documentId}`,
    { data: { ...body, publishedAt: new Date().toISOString() } }
  );
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  if (!isCollection(params.collection)) {
    return NextResponse.json({ ok: false, error: "未知内容类型" }, { status: 404 });
  }

  const result = await adminStrapiRequest("DELETE", `/${params.collection}/${params.documentId}`);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
