import type {
  CaseItem,
  CaseSceneSlug,
  CaseType,
  DownloadItem,
  Product,
  ProductCategory,
  ProductLineSlug,
  ProductSeriesGroup,
  QRItem,
  SceneItem,
} from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import type { AboutImages } from "@/data/about";
import { mapCaseMediaFields } from "@/lib/case-media";
import { formatStrapiMediaSize } from "@/lib/format-bytes";
import {
  pickCaseTitleEn,
  pickCaseTitleZh,
  pickDownloadFilePath,
  pickDownloadTitleEn,
  pickDownloadTitleZh,
  pickListMediaPath,
  pickMediaPath,
  pickProductNameEn,
  pickProductNameZh,
  resolveCmsAssetUrl,
  resolveDownloadFileUrl,
  resolveListMediaUrlFromSource,
  resolveMediaUrlFromSource,
  resolveStrapiMediaUrl,
  unwrapStrapiGallery,
  unwrapStrapiMedia,
  warnStrapiMapping,
  type StrapiMediaLike,
} from "@/lib/media-url";

type StrapiMedia = StrapiMediaLike;

type StrapiCaseDoc = {
  legacyId: number;
  sortOrder?: number;
  type: string;
  sceneSlug: string;
  titleZh?: string | null;
  titleEn?: string | null;
  title?: string | null;
  nameZh?: string | null;
  nameEn?: string | null;
  name?: string | null;
  descZh?: string | null;
  descEn?: string | null;
  detailZh?: unknown;
  detailEn?: unknown;
  sceneZh?: string | null;
  sceneEn?: string | null;
  products?: string | null;
  image?: StrapiMedia | null;
  cover?: StrapiMedia | null;
  thumbnail?: StrapiMedia | null;
  gallery?: unknown;
  highlightsZh?: string[] | null;
  highlightsEn?: string[] | null;
  market?: "cn" | "global" | "all" | null;
};

type StrapiQRDoc = {
  sortOrder?: number;
  labelZh?: string | null;
  labelEn?: string | null;
  image?: StrapiMedia | null;
};

type StrapiSceneDoc = {
  sortOrder?: number;
  nameZh?: string | null;
  nameEn?: string | null;
  descZh?: string | null;
  descEn?: string | null;
  image?: StrapiMedia | null;
};

type StrapiDownloadDoc = {
  sortOrder?: number;
  titleZh?: string | null;
  titleEn?: string | null;
  title?: string | null;
  nameZh?: string | null;
  nameEn?: string | null;
  name?: string | null;
  size?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  file?: StrapiMedia | null;
  attachment?: StrapiMedia | null;
  downloadFile?: StrapiMedia | null;
  image?: StrapiMedia | null;
  type: string;
  subCategory: string;
  cover?: StrapiMedia | null;
  thumbnail?: StrapiMedia | null;
  version?: string | null;
  osType?: string | null;
  releasedAt?: string | null;
  featured?: boolean | null;
  descZh?: string | null;
  descEn?: string | null;
  market?: "cn" | "global" | "all" | null;
};

type StrapiProductDoc = {
  sortOrder?: number;
  model?: string | null;
  nameZh?: string | null;
  nameEn?: string | null;
  name?: string | null;
  titleZh?: string | null;
  titleEn?: string | null;
  title?: string | null;
  descZh?: string | null;
  descEn?: string | null;
  detailZh?: string | null;
  detailEn?: string | null;
  specsZh?: string | null;
  specsEn?: string | null;
  seriesZh?: string | null;
  seriesEn?: string | null;
  productLine: string;
  seriesGroup: string;
  category: string;
  image?: StrapiMedia | null;
  cover?: StrapiMedia | null;
  thumbnail?: StrapiMedia | null;
  gallery?: StrapiMedia[] | null;
  market?: "cn" | "global" | "all" | null;
};

type StrapiAboutDoc = {
  sectionKey: string;
  sortOrder?: number;
  image?: StrapiMedia | null;
};

/** @deprecated 使用 resolveStrapiMediaUrl / resolveMediaUrlFromSource */
export function resolveMediaUrl(cmsUrl: string, media?: StrapiMedia | null): string {
  return resolveStrapiMediaUrl(media, cmsUrl);
}

function richtextToPlain(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;

  return value
    .map((block) => {
      if (
        block &&
        typeof block === "object" &&
        "children" in block &&
        Array.isArray((block as { children: unknown[] }).children)
      ) {
        return (block as { children: { text?: string }[] }).children
          .map((child) => child.text ?? "")
          .join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export function mapStrapiCase(doc: StrapiCaseDoc, cmsUrl: string): CaseItem {
  const detailZh = richtextToPlain(doc.detailZh);
  const detailEn = richtextToPlain(doc.detailEn);
  const mediaSource = {
    image: doc.image,
    cover: doc.cover,
    thumbnail: doc.thumbnail,
    gallery: unwrapStrapiGallery(doc.gallery),
  };
  const { imageUrl, gallery } = mapCaseMediaFields(doc, cmsUrl);
  const titleZh = pickCaseTitleZh(doc);
  const titleEn = pickCaseTitleEn(doc);

  const missing: string[] = [];
  if (!doc.titleZh?.trim() && !doc.title?.trim() && !doc.nameZh?.trim() && !doc.name?.trim()) {
    missing.push("titleZh/title/nameZh/name");
  }
  if (!pickMediaPath(mediaSource)) missing.push("image/cover/thumbnail/gallery");
  if (!doc.descZh?.trim()) missing.push("descZh");
  warnStrapiMapping("case", doc.legacyId, missing);

  return {
    id: doc.legacyId,
    sortOrder: typeof doc.sortOrder === "number" ? doc.sortOrder : undefined,
    type: doc.type as CaseType,
    sceneSlug: doc.sceneSlug as CaseSceneSlug,
    title: { zh: titleZh, en: titleEn },
    desc: { zh: doc.descZh?.trim() || "", en: doc.descEn?.trim() || "" },
    detail: detailZh || detailEn ? { zh: detailZh ?? "", en: detailEn ?? "" } : undefined,
    scene: { zh: doc.sceneZh?.trim() || "", en: doc.sceneEn?.trim() || "" },
    products: doc.products?.trim() || "",
    image: imageUrl,
    imageUrl,
    gallery,
    highlights: {
      zh: doc.highlightsZh ?? [],
      en: doc.highlightsEn ?? [],
    },
    market: doc.market ?? "all",
  };
}

export function mapStrapiQR(doc: StrapiQRDoc, cmsUrl: string, index: number): QRItem {
  const image = resolveListMediaUrlFromSource({ image: doc.image }, cmsUrl);
  if (!image) {
    warnStrapiMapping("qr-code", doc.sortOrder ?? index + 1, ["image"]);
  }
  return {
    id: doc.sortOrder ?? index + 1,
    label: { zh: doc.labelZh?.trim() || "二维码", en: doc.labelEn?.trim() || "QR Code" },
    image,
  };
}

function parseSalesPhones(phone?: string | null): string[] {
  return (phone ?? "")
    .split(/[\n,，;；]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type StrapiSalesContactDoc = {
  documentId?: string;
  sortOrder?: number | null;
  nameZh?: string | null;
  nameEn?: string | null;
  titleZh?: string | null;
  titleEn?: string | null;
  phone?: string | null;
  wechatId?: string | null;
  qrImage?: StrapiMedia | null;
  enabled?: boolean | null;
};

export function mapStrapiSalesContact(
  doc: StrapiSalesContactDoc,
  cmsUrl: string,
  index: number
): SalesContactItem {
  const nameZh = doc.nameZh?.trim() || "";
  const nameEn = doc.nameEn?.trim() || nameZh;
  const titleZh = doc.titleZh?.trim() || "";
  const titleEn = doc.titleEn?.trim() || "";
  const qrImage = resolveStrapiMediaUrl(doc.qrImage, cmsUrl) || "";
  if (!qrImage) {
    warnStrapiMapping("sales-contact", doc.sortOrder ?? index + 1, ["qrImage"]);
  }

  return {
    id: doc.documentId ?? doc.sortOrder ?? index + 1,
    name: { zh: nameZh, en: nameEn },
    title:
      titleZh || titleEn
        ? {
            zh: titleZh,
            en: titleEn || titleZh,
          }
        : undefined,
    phones: parseSalesPhones(doc.phone),
    wechatId: doc.wechatId?.trim() || undefined,
    qrImage,
    sortOrder: doc.sortOrder ?? index + 1,
  };
}

export function mapStrapiScene(doc: StrapiSceneDoc, cmsUrl: string, index: number): SceneItem {
  const image = resolveListMediaUrlFromSource({ image: doc.image }, cmsUrl);
  if (!image) {
    warnStrapiMapping("scene", doc.sortOrder ?? index + 1, ["image"]);
  }
  return {
    id: doc.sortOrder ?? index + 1,
    sortOrder: doc.sortOrder ?? index + 1,
    name: { zh: doc.nameZh?.trim() || "", en: doc.nameEn?.trim() || "" },
    desc: { zh: doc.descZh?.trim() || "", en: doc.descEn?.trim() || "" },
    image,
  };
}

export function mapStrapiDownload(
  doc: StrapiDownloadDoc,
  cmsUrl: string,
  index: number
): DownloadItem {
  const id = doc.sortOrder ?? index + 1;
  const mediaSource = {
    image: doc.image,
    cover: doc.cover,
    thumbnail: doc.thumbnail,
  };
  const coverPath = pickListMediaPath(mediaSource);
  const cover = coverPath ? resolveCmsAssetUrl(coverPath, cmsUrl) : undefined;
  const fileMedia =
    unwrapStrapiMedia(doc.file) ||
    unwrapStrapiMedia(doc.attachment) ||
    unwrapStrapiMedia(doc.downloadFile);
  const fileUrl = resolveDownloadFileUrl(doc, cmsUrl);
  const fileName = doc.fileName?.trim() || fileMedia?.name?.trim() || undefined;

  const missing: string[] = [];
  if (!doc.titleZh?.trim() && !doc.title?.trim() && !doc.nameZh?.trim() && !doc.name?.trim()) {
    missing.push("titleZh/title/nameZh/name");
  }
  if (!coverPath) missing.push("image/cover/thumbnail");
  if (!pickDownloadFilePath(doc)) missing.push("file/attachment/downloadFile/fileUrl");
  warnStrapiMapping("download", id, missing);

  return {
    id,
    name: {
      zh: pickDownloadTitleZh(doc),
      en: pickDownloadTitleEn(doc),
    },
    size:
      typeof fileMedia?.size === "number"
        ? formatStrapiMediaSize(fileMedia.size)
        : doc.size?.trim() || "—",
    fileName,
    url: fileUrl || "#",
    type: doc.type as DownloadItem["type"],
    subCategory: doc.subCategory as DownloadItem["subCategory"],
    cover,
    version: doc.version?.trim() || undefined,
    osType: (doc.osType as DownloadItem["osType"]) || undefined,
    releasedAt: doc.releasedAt || undefined,
    featured: doc.featured === true,
    desc:
      doc.descZh?.trim() || doc.descEn?.trim()
        ? { zh: doc.descZh?.trim() || "", en: doc.descEn?.trim() || "" }
        : undefined,
    market: doc.market ?? "all",
  };
}

export function mapStrapiProduct(doc: StrapiProductDoc, cmsUrl: string, index: number): Product {
  const id = doc.sortOrder ?? index + 1;
  const mediaSource = {
    image: doc.image,
    cover: doc.cover,
    thumbnail: doc.thumbnail,
  };
  const image = resolveListMediaUrlFromSource(mediaSource, cmsUrl);
  const nameZh = pickProductNameZh(doc);
  const nameEn = pickProductNameEn(doc);

  const missing: string[] = [];
  if (!doc.nameZh?.trim() && !doc.name?.trim() && !doc.titleZh?.trim()) {
    missing.push("nameZh/name/titleZh");
  }
  if (!pickMediaPath(mediaSource)) missing.push("image/cover/thumbnail");
  warnStrapiMapping("product", id, missing);

  return {
    id,
    model: doc.model?.trim() || "",
    name: { zh: nameZh, en: nameEn },
    desc: { zh: doc.descZh?.trim() || "", en: doc.descEn?.trim() || "" },
    detail:
      doc.detailZh || doc.detailEn ? { zh: doc.detailZh ?? "", en: doc.detailEn ?? "" } : undefined,
    specs:
      doc.specsZh || doc.specsEn ? { zh: doc.specsZh ?? "", en: doc.specsEn ?? "" } : undefined,
    image,
    gallery: (doc.gallery ?? []).map((item) => resolveStrapiMediaUrl(item, cmsUrl)).filter(Boolean),
    series:
      doc.seriesZh || doc.seriesEn ? { zh: doc.seriesZh ?? "", en: doc.seriesEn ?? "" } : undefined,
    productLine: doc.productLine as ProductLineSlug,
    seriesGroup: doc.seriesGroup as ProductSeriesGroup,
    category: doc.category as ProductCategory,
    market: doc.market ?? "all",
  };
}

export function mapStrapiAboutSections(
  docs: StrapiAboutDoc[],
  cmsUrl: string,
  fallback: AboutImages
): AboutImages {
  const byKey = new Map(docs.map((doc) => [doc.sectionKey, doc]));

  const get = (key: string, fb: string) => {
    const doc = byKey.get(key);
    const url = doc ? resolveStrapiMediaUrl(doc.image, cmsUrl) : "";
    return url || fb;
  };

  return {
    brandIntro: get("brandIntro", fallback.brandIntro),
    origin: get("origin", fallback.origin),
    system: [
      get("dbcoverHome", fallback.system[0]),
      get("dbcoverEq", fallback.system[1]),
      get("dbcoverSpl", fallback.system[2]),
    ],
    focus: get("focus", fallback.focus),
    dsp: [
      get("unit48Hardware", fallback.dsp[0]),
      get("unit48Layout", fallback.dsp[1]),
      get("unit48Eq", fallback.dsp[2]),
    ],
  };
}

export type ContactInfoData = {
  company: { zh: string; en: string };
  phones: string[];
  email: string;
  address: { zh: string; en: string };
  mapQuery: string;
  mapEmbedUrl?: string;
  mapNavUrl?: string;
  mapDisplayAddress: { zh: string; en: string };
  footerIntro: { zh: string; en: string };
  homeFeaturedCase?: {
    caseId?: number;
    title?: { zh: string; en: string };
    desc?: { zh: string; en: string };
    image?: string;
  };
};

type StrapiContactDoc = {
  companyZh: string;
  companyEn: string;
  phones: string;
  email: string;
  addressZh: string;
  addressEn: string;
  mapQuery: string;
  mapEmbedUrl?: string | null;
  mapNavUrl?: string | null;
  mapDisplayAddressZh?: string | null;
  mapDisplayAddressEn?: string | null;
  footerIntroZh?: string | null;
  footerIntroEn?: string | null;
  homeFeaturedCaseId?: number | null;
  homeFeaturedCaseTitleZh?: string | null;
  homeFeaturedCaseTitleEn?: string | null;
  homeFeaturedCaseDescZh?: string | null;
  homeFeaturedCaseDescEn?: string | null;
  homeFeaturedCaseImage?: StrapiMedia | null;
};

export function mapStrapiContactInfo(
  doc: StrapiContactDoc,
  fallback: ContactInfoData,
  cmsUrl: string
): ContactInfoData {
  const phones = doc.phones
    .split(/[\n,，;；]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    company: { zh: doc.companyZh, en: doc.companyEn },
    phones: phones.length ? phones : fallback.phones,
    email: doc.email || fallback.email,
    address: { zh: doc.addressZh, en: doc.addressEn },
    mapQuery: doc.mapQuery || fallback.mapQuery,
    mapEmbedUrl: doc.mapEmbedUrl?.trim() || fallback.mapEmbedUrl,
    mapNavUrl: doc.mapNavUrl?.trim() || fallback.mapNavUrl,
    mapDisplayAddress: {
      zh:
        doc.mapDisplayAddressZh?.trim() ||
        doc.addressZh ||
        fallback.mapDisplayAddress.zh ||
        fallback.address.zh,
      en:
        doc.mapDisplayAddressEn?.trim() ||
        doc.addressEn ||
        fallback.mapDisplayAddress.en ||
        fallback.address.en,
    },
    footerIntro: {
      zh: doc.footerIntroZh || fallback.footerIntro.zh,
      en: doc.footerIntroEn || fallback.footerIntro.en,
    },
    homeFeaturedCase: {
      caseId: doc.homeFeaturedCaseId ?? fallback.homeFeaturedCase?.caseId ?? 6,
      title:
        doc.homeFeaturedCaseTitleZh || doc.homeFeaturedCaseTitleEn
          ? {
              zh: doc.homeFeaturedCaseTitleZh ?? "",
              en: doc.homeFeaturedCaseTitleEn ?? "",
            }
          : fallback.homeFeaturedCase?.title,
      desc:
        doc.homeFeaturedCaseDescZh || doc.homeFeaturedCaseDescEn
          ? {
              zh: doc.homeFeaturedCaseDescZh ?? "",
              en: doc.homeFeaturedCaseDescEn ?? "",
            }
          : fallback.homeFeaturedCase?.desc,
      image:
        resolveStrapiMediaUrl(doc.homeFeaturedCaseImage, cmsUrl) ||
        fallback.homeFeaturedCase?.image,
    },
  };
}
