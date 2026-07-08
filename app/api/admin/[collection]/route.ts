import { assertAdminRequest } from "@/lib/admin-auth";
import { translateCaseZhToEn } from "@/lib/ai/admin-content";
import { buildAdminSaveResponse } from "@/lib/admin-post-save";
import { ADMIN_COLLECTIONS, adminStrapiRequest, type AdminCollection } from "@/lib/strapi-admin";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: { collection: string } };

function isCollection(value: string): value is AdminCollection {
  return value in ADMIN_COLLECTIONS;
}

export async function GET(req: NextRequest, { params }: Props) {
  const denied = assertAdminRequest(req);
  if (denied) return denied;
  if (!isCollection(params.collection)) {
    return NextResponse.json({ ok: false, error: "未知内容类型" }, { status: 404 });
  }

  const populateMap: Record<AdminCollection, string> = {
    products:
      "?populate[image]=true&populate[gallery]=true&sort[0]=sortOrder:asc&pagination[pageSize]=200",
    cases:
      "?populate[image]=true&populate[gallery]=true&sort[0]=sortOrder:asc&pagination[pageSize]=100",
    downloads:
      "?populate[cover]=true&populate[file][fields][0]=url&populate[file][fields][1]=name&populate[file][fields][2]=size&sort[0]=sortOrder:asc&pagination[pageSize]=100",
    scenes: "?populate[image]=true&sort[0]=sortOrder:asc&pagination[pageSize]=20",
    "about-sections": "?populate[image]=true&sort[0]=sortOrder:asc&pagination[pageSize]=20",
    "qr-codes": "?populate[image]=true&sort[0]=sortOrder:asc&pagination[pageSize]=20",
    "sales-contacts": "?populate[qrImage]=true&sort[0]=sortOrder:asc&pagination[pageSize]=50",
    leads: "?sort[0]=createdAt:desc&pagination[pageSize]=200",
    "product-series-configs": "?sort[0]=sortOrder:asc&pagination[pageSize]=50",
  };
  const populate = populateMap[params.collection];

  const result = await adminStrapiRequest("GET", `/${params.collection}${populate}`);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function POST(request: NextRequest, { params }: Props) {
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

  const publishQuery = params.collection === "sales-contacts" ? "?status=published" : "";
  const result = await adminStrapiRequest("POST", `/${params.collection}${publishQuery}`, {
    data: { ...data, publishedAt: new Date().toISOString() },
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  const saveMeta = await buildAdminSaveResponse(params.collection, { ok: true }, data);
  return NextResponse.json({ ...result, saved: saveMeta.saved, revalidation: saveMeta.revalidation, cacheRefresh: saveMeta.cacheRefresh });
}
