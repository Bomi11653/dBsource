import { assertAdminRequest } from "@/lib/admin-auth";
import { translateBilingualPairs, type BilingualPairInput } from "@/lib/ai/admin-content";
import { NextRequest, NextResponse } from "next/server";

type TranslateBody = {
  section?: "cases" | "products";
  pairs?: BilingualPairInput[];
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const body = (await request.json()) as TranslateBody;
  const section = body.section;
  const pairs = body.pairs;
  if (!section || (section !== "cases" && section !== "products")) {
    return NextResponse.json({ ok: false, error: "不支持的翻译类型" }, { status: 400 });
  }
  if (!Array.isArray(pairs) || !pairs.length) {
    return NextResponse.json({ ok: false, error: "缺少翻译字段" }, { status: 400 });
  }

  try {
    const patch = await translateBilingualPairs(section, pairs);
    if (!patch) {
      return NextResponse.json({ ok: false, error: "翻译失败，请稍后重试" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, data: patch });
  } catch (e) {
    const message = e instanceof Error ? e.message : "翻译失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
