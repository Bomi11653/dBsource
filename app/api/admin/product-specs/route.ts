import { assertAdminRequest } from "@/lib/admin-auth";
import { extractProductSpecsFromPdfText } from "@/lib/ai/admin-content";
import { getAdminToken } from "@/lib/strapi-admin";
import { getCmsUrl } from "@/lib/strapi-client";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextRequest, NextResponse } from "next/server";

/** PDF text extraction must run in Node (not Edge). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolvePdfUrl(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const cms = getCmsUrl();
  return `${cms}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

type PdfLoaderApi = {
  extractPdfText: (data: Buffer | Uint8Array) => Promise<string>;
};

function listLoaderCandidates(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, "lib", "pdf-parse-loader.cjs"),
    path.join(cwd, "..", "lib", "pdf-parse-loader.cjs"),
  ];
}

/**
 * Load the CommonJS PDF extractor from disk at runtime.
 * Prefer Node createRequire (avoids webpack rewriting pdf-parse).
 * Fallback: dynamic import of absolute file URL.
 */
async function loadPdfExtractor(): Promise<PdfLoaderApi> {
  const candidates = listLoaderCandidates().filter((p) => fs.existsSync(p));
  if (!candidates.length) {
    throw new Error(
      `PDF 服务端加载器缺失。已尝试：${listLoaderCandidates().join(" | ")}。请确认部署包含 lib/pdf-parse-loader.cjs，且 PM2 cwd 为站点根或 .next/standalone。`
    );
  }

  const errors: string[] = [];
  for (const loaderAbs of candidates) {
    try {
      const { createRequire } = await import("node:module");
      const pkgJson = path.join(path.dirname(path.dirname(loaderAbs)), "package.json");
      const req = createRequire(fs.existsSync(pkgJson) ? pkgJson : loaderAbs);
      const api = req(loaderAbs) as PdfLoaderApi;
      if (typeof api.extractPdfText === "function") return api;
      errors.push(`${loaderAbs}: missing extractPdfText`);
    } catch (e) {
      errors.push(
        `${loaderAbs} createRequire: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    try {
      const loaded = await import(/* webpackIgnore: true */ pathToFileURL(loaderAbs).href);
      const api = ((loaded as { default?: PdfLoaderApi }).default ?? loaded) as PdfLoaderApi;
      if (typeof api.extractPdfText === "function") return api;
      errors.push(`${loaderAbs}: dynamic import missing extractPdfText`);
    } catch (e) {
      errors.push(
        `${loaderAbs} import: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  throw new Error(`PDF 服务端加载器无效：${errors.join(" | ")}`);
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
    const { extractPdfText } = await loadPdfExtractor();
    const text = await extractPdfText(Buffer.from(arr));
    if (!text) {
      return NextResponse.json({ ok: false, error: "PDF 未识别到可用文本" }, { status: 422 });
    }

    const extracted = await extractProductSpecsFromPdfText({ modelHint, text });
    if (!extracted || !Array.isArray(extracted.rows) || extracted.rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "参数识别失败：未得到结构化参数行（rows）。请换更清晰的规格表 PDF，或确认 PDF 含技术参数表。",
        },
        { status: 422 }
      );
    }

    // Strict response contract: rows is required; each row one parameter with stable id.
    const rows = extracted.rows.map((row, index) => ({
      id: String(row.id || `spec-${index}`),
      zhName: String(row.zhName || "").trim(),
      zhValue: String(row.zhValue || "/").trim() || "/",
      enName: String(row.enName || "").trim(),
      enValue: String(row.enValue || row.zhValue || "/").trim() || "/",
    }));

    const invalid = rows.some((row) => !row.zhName && !row.enName);
    if (invalid) {
      return NextResponse.json(
        { ok: false, error: "参数识别结果无效：存在缺少参数名的行" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        rows,
        rowCount: rows.length,
        // Convenience for CMS text fields / older clients
        specsZh: extracted.specsZh,
        specsEn: extracted.specsEn,
        descZh: extracted.descZh,
        descEn: extracted.descEn,
      },
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "PDF 参数识别失败";
    const message = /pdf\.worker|fake worker|Cannot find module|getData|加载器/i.test(raw)
      ? `PDF 服务端解析失败：${raw}。请确认已部署最新 lib/pdf-parse-loader.cjs（embedded getData worker）并重启 dbsource-web。`
      : raw;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
