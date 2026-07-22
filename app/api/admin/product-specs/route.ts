import { assertAdminRequest } from "@/lib/admin-auth";
import { extractProductSpecsFromPdfText } from "@/lib/ai/admin-content";
import { getAdminToken } from "@/lib/strapi-admin";
import { getCmsUrl } from "@/lib/strapi-client";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolvePdfUrl(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const cms = getCmsUrl();
  return `${cms}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

type PDFParseClass = new (params: { data: Buffer }) => {
  getText: () => Promise<{ text: string }>;
  destroy: () => Promise<void>;
};

/**
 * Load CJS PDF helper from disk. webpackIgnore keeps this out of the app-route
 * bundle so production cannot rewrite require.resolve("pdf-parse") to a module id.
 */
async function loadPdfParseClass(): Promise<PDFParseClass> {
  const loaderAbs = path.join(process.cwd(), "lib", "pdf-parse-loader.cjs");
  if (!fs.existsSync(loaderAbs)) {
    throw new Error(`PDF loader 缺失：${loaderAbs}`);
  }
  const loaderUrl = pathToFileURL(loaderAbs).href;
  const loaded = await import(
    /* webpackIgnore: true */
    loaderUrl
  );
  const api = (loaded as { default?: { getPDFParseClass?: () => PDFParseClass } }).default ?? loaded;
  const getPDFParseClass = (api as { getPDFParseClass?: () => PDFParseClass }).getPDFParseClass;
  if (typeof getPDFParseClass !== "function") {
    throw new Error("PDF loader 无效：缺少 getPDFParseClass");
  }
  return getPDFParseClass();
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
    const PDFParse = await loadPdfParseClass();
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
    const raw = e instanceof Error ? e.message : "PDF 参数识别失败";
    const message = /pdf\.worker|fake worker|Cannot find module|require is not defined|74193/i.test(
      raw
    )
      ? `PDF 解析组件加载失败：${raw}。请确认生产环境已部署 pdf.worker.mjs 与 lib/pdf-parse-loader.cjs 并重启网站进程。`
      : raw;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
