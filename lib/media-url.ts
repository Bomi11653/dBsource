/**
 * Strapi 媒体 URL → 本站同源路径，手机预览时不再依赖 localhost:1337
 */
export function toPublicMediaUrl(cmsUrl: string, mediaUrl: string): string {
  if (!mediaUrl) return "";
  if (mediaUrl.startsWith("/strapi-uploads/")) return mediaUrl;

  try {
    const parsed = new URL(mediaUrl, cmsUrl);
    const uploadPath = parsed.pathname.match(/\/uploads\/.+/)?.[0];
    if (uploadPath) {
      return `/strapi-uploads${uploadPath.replace(/^\/uploads/, "")}`;
    }
  } catch {
    /* ignore */
  }

  if (mediaUrl.startsWith("/uploads/")) {
    return `/strapi-uploads${mediaUrl.replace(/^\/uploads/, "")}`;
  }

  if (mediaUrl.startsWith("http")) return mediaUrl;
  if (mediaUrl.startsWith("/")) return mediaUrl;
  return `${cmsUrl}${mediaUrl}`;
}
