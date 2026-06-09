import { contentDispositionAttachment } from "@/lib/format-bytes";
import { resolveDownloadFile } from "@/lib/download-file";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

/** 公开下载：分享链接打开即下载，保留原始文件名 */
export async function GET(_request: NextRequest, { params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "无效的文件 ID" }, { status: 400 });
  }

  const meta = await resolveDownloadFile(id);
  if (!meta) {
    return NextResponse.json({ error: "文件不存在或尚未发布" }, { status: 404 });
  }

  try {
    const upstream = await fetch(meta.sourceUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "无法读取文件" }, { status: 502 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("content-type") || "application/octet-stream"
    );
    headers.set("Content-Disposition", contentDispositionAttachment(meta.fileName));

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "下载失败" }, { status: 502 });
  }
}
