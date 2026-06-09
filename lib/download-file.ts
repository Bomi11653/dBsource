import { formatStrapiMediaSize } from "@/lib/format-bytes";
import { getCmsUrl } from "@/lib/strapi-client";

type StrapiFileMedia = {
  url?: string;
  name?: string;
  size?: number;
};

type StrapiDownloadRecord = {
  sortOrder?: number;
  fileName?: string | null;
  size?: string | null;
  fileUrl?: string | null;
  file?: StrapiFileMedia | null;
};

export type ResolvedDownloadFile = {
  sourceUrl: string;
  fileName: string;
  sizeLabel: string;
};

function cmsUploadUrl(cmsUrl: string, mediaUrl: string): string {
  if (mediaUrl.startsWith("http")) return mediaUrl;
  if (mediaUrl.startsWith("/")) return `${cmsUrl}${mediaUrl}`;
  return `${cmsUrl}/${mediaUrl}`;
}

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
    "&populate[file][fields][0]=url&populate[file][fields][1]=name&populate[file][fields][2]=size" +
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

  const file = doc.file;
  const fileUrl = file?.url ? cmsUploadUrl(cmsUrl, file.url) : "";
  const externalUrl =
    doc.fileUrl && doc.fileUrl !== "#" && doc.fileUrl.startsWith("http") ? doc.fileUrl : "";

  const sourceUrl = fileUrl || externalUrl;
  if (!sourceUrl) return null;

  const fileName =
    doc.fileName?.trim() ||
    file?.name?.trim() ||
    basenameFromUrl(sourceUrl);

  const sizeLabel =
    (typeof file?.size === "number" ? formatStrapiMediaSize(file.size) : null) ||
    doc.size?.trim() ||
    "—";

  return { sourceUrl, fileName, sizeLabel };
}
