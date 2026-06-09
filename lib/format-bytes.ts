/** Strapi 媒体库 file.size 单位为 KB，不是字节 */
export function strapiMediaSizeToBytes(sizeKb: number): number {
  return sizeKb * 1024;
}

function formatBytesValue(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  if (unitIndex === 0) return `${Math.round(value)} ${units[unitIndex]}`;
  const digits = value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

/** 浏览器 File.size（字节）→ 可读大小 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  return formatBytesValue(bytes);
}

/** Strapi 媒体库 size（KB）→ 可读大小 */
export function formatStrapiMediaSize(sizeKb: number): string {
  if (!Number.isFinite(sizeKb) || sizeKb <= 0) return "—";
  return formatBytesValue(strapiMediaSizeToBytes(sizeKb));
}
/** RFC 5987 Content-Disposition，支持中文等非 ASCII 文件名 */
export function contentDispositionAttachment(fileName: string): string {
  const safe = fileName.replace(/[\r\n"]/g, "_").trim() || "download";
  const asciiFallback = safe.replace(/[^\x20-\x7E]/g, "_") || "download";
  const encoded = encodeURIComponent(safe);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
