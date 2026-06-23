import {
  isRevalidateModule,
  matchesRevalidateSecret,
  revalidateSiteModules,
  type RevalidateModule,
} from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RevalidateBody = {
  secret?: string;
  modules?: string[];
  detailId?: string | number;
};

function extractSecret(request: NextRequest, body?: RevalidateBody): string | null {
  return (
    request.headers.get("x-revalidate-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    body?.secret ||
    request.nextUrl.searchParams.get("secret")
  );
}

function parseModules(raw: string[] | undefined): RevalidateModule[] {
  if (!raw?.length) return ["all"];
  const modules = raw.filter(isRevalidateModule);
  return modules.length ? modules : ["all"];
}

export async function POST(request: NextRequest) {
  if (!process.env.REVALIDATE_SECRET?.trim()) {
    return NextResponse.json({ ok: false, error: "REVALIDATE_SECRET 未配置" }, { status: 503 });
  }

  let body: RevalidateBody = {};
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    // allow secret via header/query only
  }

  const provided = extractSecret(request, body);
  if (!matchesRevalidateSecret(provided)) {
    return NextResponse.json({ ok: false, error: "无效密钥" }, { status: 401 });
  }

  const modules = parseModules(body.modules);
  const detailId = body.detailId != null ? String(body.detailId) : undefined;
  const { revalidated } = revalidateSiteModules(modules, { detailId });

  return NextResponse.json({
    ok: true,
    modules,
    revalidated,
    revalidatedAt: new Date().toISOString(),
  });
}
