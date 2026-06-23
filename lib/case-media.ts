import type { CaseItem } from "@/data/mock";
import {
  pickMediaPath,
  resolveCaseGalleryUrls,
  resolveCmsAssetUrl,
  unwrapStrapiGallery,
  type MediaSource,
} from "@/lib/media-url";
import { getCmsUrl } from "@/lib/strapi-client";

/** Strapi 案例文档 → 封面媒体源（列表/详情/首页共用） */
export function caseDocToMediaSource(doc: {
  image?: unknown;
  cover?: unknown;
  thumbnail?: unknown;
  gallery?: unknown;
}): MediaSource {
  return {
    image: doc.image,
    cover: doc.cover,
    thumbnail: doc.thumbnail,
    gallery: unwrapStrapiGallery(doc.gallery),
  };
}

/** 从 Strapi 媒体字段解析封面 URL（含 gallery[0] 兜底） */
export function resolveCaseCoverFromSource(
  source: MediaSource,
  cmsUrl = getCmsUrl()
): string {
  const raw = pickMediaPath(source);
  return raw ? resolveCmsAssetUrl(raw, cmsUrl) : "";
}

/** 映射后的案例封面（全站统一读取此字段） */
export function getCaseCoverUrl(item: Pick<CaseItem, "imageUrl" | "image">): string {
  return (item.imageUrl || item.image || "").trim();
}

/** 案例图集：封面 + gallery，去重 */
export function getCaseGalleryUrls(item: CaseItem): string[] {
  const cover = getCaseCoverUrl(item);
  const gallery = (item.gallery ?? []).filter(Boolean);
  if (!gallery.length) {
    return cover ? [cover] : [];
  }
  if (cover && !gallery.includes(cover)) {
    return [cover, ...gallery];
  }
  return gallery;
}

export function mapCaseMediaFields(
  doc: {
    image?: unknown;
    cover?: unknown;
    thumbnail?: unknown;
    gallery?: unknown;
  },
  cmsUrl = getCmsUrl()
): { imageUrl: string; gallery: string[] } {
  const source = caseDocToMediaSource(doc);
  const imageUrl = resolveCaseCoverFromSource(source, cmsUrl);
  const gallery = resolveCaseGalleryUrls(unwrapStrapiGallery(doc.gallery), cmsUrl);
  const mergedGallery =
    gallery.length > 0 ? gallery : imageUrl ? [imageUrl] : [];
  return { imageUrl, gallery: mergedGallery };
}

export function hasCaseCover(item: Pick<CaseItem, "imageUrl" | "image">): boolean {
  return Boolean(getCaseCoverUrl(item));
}
