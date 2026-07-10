import { formatStrapiMediaSize } from "@/lib/format-bytes";
import {
  pickDownloadServePath,
  resolveServerMediaUrl,
  unwrapStrapiMedia,
} from "@/lib/media-url";
import { getCmsUrl } from "@/lib/strapi-client";

type StrapiDownloadRecord = {
  sortOrder?: number;
  nameZh?: string | null;
  nameEn?: string | null;
  fileName?: string | null;
  size?: string | null;
  fileUrl?: string | null;
  file?: unknown;
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

function downloadTitle(doc: StrapiDownloadRecord): string {
  return doc.nameZh?.trim() || doc.nameEn?.trim() || `sortOrder:${doc.sortOrder ?? "?"}`;
}

/** 从 Strapi 公开 API 按 sortOrder（前台 id）解析下载文件 */
export async function resolveDownloadFile(
  sortOrderId: number
): Promise<ResolvedDownloadFile | null> {
  const cmsUrl = getCmsUrl();
  const query =
    `/downloads?filters[sortOrder][$eq]=${sortOrderId}` +
    "&populate[file]=true" +
    "&publicationState=live&pagination[pageSize]=5";

  let matches: StrapiDownloadRecord[] = [];
  try {
    const res = await fetch(`${cmsUrl}/api${query}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { data?: StrapiDownloadRecord[] };
      matches = Array.isArray(json.data) ? json.data : [];
    }
  } catch {
    matches = [];
  }

  if (!matches.length) {
    console.warn(`[download] id=${sortOrderId} not found`);
    return null;
  }

  if (matches.length > 1) {
    console.warn(
      `[download] id=${sortOrderId} ambiguous (${matches.length} records): ${matches
        .map((d) => downloadTitle(d))
        .join(", ")}`
    );
    return null;
  }

  const doc = matches[0];
  const filePath = pickDownloadServePath(doc);
  if (!filePath) {
    console.warn(`[download] id=${sortOrderId} title="${downloadTitle(doc)}" missing file`);
    return null;
  }

  const sourceUrl = resolveServerMediaUrl(filePath, cmsUrl);
  if (!sourceUrl || sourceUrl === "#") {
    console.warn(`[download] id=${sortOrderId} title="${downloadTitle(doc)}" invalid file url`);
    return null;
  }

  const fileMedia = unwrapStrapiMedia(doc.file);

  const fileName =
    doc.fileName?.trim() ||
    fileMedia?.name?.trim() ||
    basenameFromUrl(filePath);

  const sizeLabel =
    (typeof fileMedia?.size === "number" ? formatStrapiMediaSize(fileMedia.size) : null) ||
    doc.size?.trim() ||
    "—";

  return { sourceUrl, fileName, sizeLabel };
}
