import { assertAdminRequest } from "@/lib/admin-auth";
import { extractProductSpecsFromPdfText } from "@/lib/ai/admin-content";
import { getAdminToken } from "@/lib/strapi-admin";
import { getCmsUrl } from "@/lib/strapi-client";
import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse") as {
  PDFParse: new (params: { data: Buffer }) => {
    getText: () => Promise<{ text: string }>;
    destroy: () => Promise<void>;
  };
};

function resolvePdfUrl(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const cms = getCmsUrl();
  return `${cms}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const body = (await request.json()) as { fileUrl?: string; modelHint?: string };
  const fileUrl = String(body.fileUrl ?? "").trim();
  const modelHint = String(body.modelHint ?? "").trim();
  if (!fileUrl) {
    return NextResponse.json({ ok: false, error: "缺少 PDF 文件地址" }, { status: 400 });
  }

  const targetUrl = resolvePdfUrl(fileUrl);
  if (!/\.pdf(\?.*)?$/i.test(targetUrl)) {
    return NextResponse.json({ ok: false, error: "请上传 PDF 文件后再识别" }, { status: 400 });
  }

  try {
    const token = getAdminToken();
    const upstream = await fetch(targetUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: `PDF 下载失败 (${upstream.status})` },
        { status: 502 }
      );
    }

    const arr = await upstream.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(arr) });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = parsed.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ ok: false, error: "PDF 未识别到可用文本" }, { status: 422 });
    }

    const extracted = await extractProductSpecsFromPdfText({ modelHint, text });
    if (!extracted) {
      return NextResponse.json({ ok: false, error: "参数识别失败，请换更清晰的 PDF" }, { status: 422 });
    }

    return NextResponse.json({ ok: true, data: extracted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF 参数识别失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
