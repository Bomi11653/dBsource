import { formatStrapiMediaSize } from "@/lib/format-bytes";
import {
  pickDownloadFilePath,
  resolveDownloadFileUrl,
  unwrapStrapiMedia,
} from "@/lib/media-url";
import { getCmsUrl } from "@/lib/strapi-client";

type StrapiDownloadRecord = {
  sortOrder?: number;
  fileName?: string | null;
  size?: string | null;
  fileUrl?: string | null;
  file?: unknown;
  attachment?: unknown;
  downloadFile?: unknown;
};

export type ResolvedDownloadFile = {
  sourceUrl: string;
  fileName: string;
  sizeLabel: string;
};

function basenameFromUrl(url: string): string {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url;
    const name = path.split("/").pop();
    return name && name !== "#" ? decodeURIComponent(name) : "download";
  } catch {
    return "download";
  }
}

/** 从 Strapi 公开 API 按 sortOrder（前台 id）解析下载文件 */
export async function resolveDownloadFile(sortOrderId: number): Promise<ResolvedDownloadFile | null> {
  const cmsUrl = getCmsUrl();
  const query =
    `/downloads?filters[sortOrder][$eq]=${sortOrderId}` +
    "&populate[file]=true" +
    "&publicationState=live&pagination[pageSize]=1";

  let doc: StrapiDownloadRecord | null = null;
  try {
    const res = await fetch(`${cmsUrl}/api${query}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { data?: StrapiDownloadRecord[] };
      doc = json.data?.[0] ?? null;
    }
  } catch {
    doc = null;
  }

  if (!doc) return null;

  const sourceUrl = resolveDownloadFileUrl(doc, cmsUrl);
  if (!sourceUrl || sourceUrl === "#") return null;

  const fileMedia =
    unwrapStrapiMedia(doc.file) ||
    unwrapStrapiMedia(doc.attachment) ||
    unwrapStrapiMedia(doc.downloadFile);

  const fileName =
    doc.fileName?.trim() ||
    fileMedia?.name?.trim() ||
    basenameFromUrl(pickDownloadFilePath(doc) || sourceUrl);

  const sizeLabel =
    (typeof fileMedia?.size === "number" ? formatStrapiMediaSize(fileMedia.size) : null) ||
    doc.size?.trim() ||
    "—";

  return { sourceUrl, fileName, sizeLabel };
}
