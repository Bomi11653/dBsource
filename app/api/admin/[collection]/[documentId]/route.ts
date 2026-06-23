import { assertAdminRequest } from "@/lib/admin-auth";
import { translateCaseZhToEn } from "@/lib/ai/admin-content";
import { buildAdminSaveResponse } from "@/lib/admin-post-save";
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
  const data: Record<string, unknown> = { ...(body as Record<string, unknown>) };

  if (params.collection === "cases") {
    const titleZh = String(data.titleZh ?? "").trim();
    const descZh = String(data.descZh ?? "").trim();
    const titleEn = String(data.titleEn ?? "").trim();
    const descEn = String(data.descEn ?? "").trim();
    if (titleZh && descZh && (!titleEn || !descEn)) {
      try {
        const translated = await translateCaseZhToEn({ titleZh, descZh });
        if (translated) {
          if (!titleEn) data.titleEn = translated.titleEn;
          if (!descEn) data.descEn = translated.descEn;
        }
      } catch {
        // Ignore AI errors and keep user-provided fields unchanged.
      }
    }
  }

  const result = await adminStrapiRequest(
    "PUT",
    `/${params.collection}/${params.documentId}`,
    { data: { ...data, publishedAt: new Date().toISOString() } }
  );
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  const saveMeta = await buildAdminSaveResponse(params.collection, { ok: true }, data);
  return NextResponse.json({ ...result, saved: saveMeta.saved, revalidation: saveMeta.revalidation, cacheRefresh: saveMeta.cacheRefresh });
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  if (!isCollection(params.collection)) {
    return NextResponse.json({ ok: false, error: "未知内容类型" }, { status: 404 });
  }

  const result = await adminStrapiRequest("DELETE", `/${params.collection}/${params.documentId}`);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  const saveMeta = await buildAdminSaveResponse(params.collection, { ok: true });
  return NextResponse.json({ ...result, saved: saveMeta.saved, revalidation: saveMeta.revalidation, cacheRefresh: saveMeta.cacheRefresh });
}
