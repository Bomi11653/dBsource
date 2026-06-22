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
import type { AboutImages } from "@/data/about";
import { formatStrapiMediaSize } from "@/lib/format-bytes";
import {
  resolveCaseGalleryUrls,
  resolveCaseImageUrl,
  toPublicMediaUrl,
  unwrapStrapiMedia,
  type StrapiMediaLike,
} from "@/lib/media-url";

type StrapiMedia = StrapiMediaLike & {
  name?: string;
  size?: number;
};

type StrapiCaseDoc = {
  legacyId: number;
  sortOrder?: number;
  type: string;
  sceneSlug: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  detailZh?: unknown;
  detailEn?: unknown;
  sceneZh: string;
  sceneEn: string;
  products: string;
  image?: StrapiMedia | null;
  cover?: StrapiMedia | null;
  thumbnail?: StrapiMedia | null;
  gallery?: StrapiMedia[] | null;
  highlightsZh?: string[] | null;
  highlightsEn?: string[] | null;
  market?: "cn" | "global" | "all" | null;
};

type StrapiQRDoc = {
  sortOrder?: number;
  labelZh: string;
  labelEn: string;
  image?: StrapiMedia | null;
};

type StrapiSceneDoc = {
  sortOrder?: number;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  image?: StrapiMedia | null;
};

type StrapiDownloadDoc = {
  sortOrder?: number;
  nameZh: string;
  nameEn: string;
  size?: string | null;
  fileName?: string | null;
  fileUrl: string;
  file?: StrapiMedia | null;
  type: string;
  subCategory: string;
  cover?: StrapiMedia | null;
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
  model: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
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
  gallery?: StrapiMedia[] | null;
  market?: "cn" | "global" | "all" | null;
};

type StrapiAboutDoc = {
  sectionKey: string;
  sortOrder?: number;
  image?: StrapiMedia | null;
};

export function resolveMediaUrl(
  cmsUrl: string,
  media?: StrapiMedia | null
): string {
  const unwrapped = unwrapStrapiMedia(media);
  if (!unwrapped?.url && !unwrapped?.formats) return "";
  const raw =
    unwrapped.formats?.large?.url ||
    unwrapped.formats?.medium?.url ||
    unwrapped.formats?.small?.url ||
    unwrapped.url ||
    "";
  if (!raw) return "";
  const absolute = raw.startsWith("http")
    ? raw
    : `${cmsUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
  return toPublicMediaUrl(cmsUrl, absolute);
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

export function mapStrapiCase(doc: StrapiCaseDoc, _cmsUrl: string): CaseItem {
  const detailZh = richtextToPlain(doc.detailZh);
  const detailEn = richtextToPlain(doc.detailEn);
  const image = resolveCaseImageUrl(doc);
  const gallery = resolveCaseGalleryUrls(doc.gallery);
  const coverImage = image || resolveCaseImageUrl({ cover: doc.cover, thumbnail: doc.thumbnail });

  return {
    id: doc.legacyId,
    sortOrder: typeof doc.sortOrder === "number" ? doc.sortOrder : undefined,
    type: doc.type as CaseType,
    sceneSlug: doc.sceneSlug as CaseSceneSlug,
    title: { zh: doc.titleZh, en: doc.titleEn },
    desc: { zh: doc.descZh, en: doc.descEn },
    detail:
      detailZh || detailEn
        ? { zh: detailZh ?? "", en: detailEn ?? "" }
        : undefined,
    scene: { zh: doc.sceneZh, en: doc.sceneEn },
    products: doc.products,
    image: coverImage,
    gallery: gallery.length > 0 ? gallery : coverImage ? [coverImage] : [],
    highlights: {
      zh: doc.highlightsZh ?? [],
      en: doc.highlightsEn ?? [],
    },
    market: doc.market ?? "all",
  };
}

export function mapStrapiQR(
  doc: StrapiQRDoc,
  cmsUrl: string,
  index: number
): QRItem {
  return {
    id: doc.sortOrder ?? index + 1,
    label: { zh: doc.labelZh, en: doc.labelEn },
    image: resolveMediaUrl(cmsUrl, doc.image),
  };
}

export function mapStrapiScene(
  doc: StrapiSceneDoc,
  cmsUrl: string,
  index: number
): SceneItem {
  return {
    id: doc.sortOrder ?? index + 1,
    name: { zh: doc.nameZh, en: doc.nameEn },
    desc: { zh: doc.descZh, en: doc.descEn },
    image: resolveMediaUrl(cmsUrl, doc.image),
  };
}

export function mapStrapiDownload(
  doc: StrapiDownloadDoc,
  cmsUrl: string,
  index: number
): DownloadItem {
  const fileFromMedia = doc.file ? resolveMediaUrl(cmsUrl, doc.file) : "";
  const fileName =
    doc.fileName?.trim() ||
    doc.file?.name?.trim() ||
    undefined;
  return {
    id: doc.sortOrder ?? index + 1,
    name: { zh: doc.nameZh, en: doc.nameEn },
    size:
      typeof doc.file?.size === "number"
        ? formatStrapiMediaSize(doc.file.size)
        : doc.size?.trim() || "—",
    fileName,
    url: fileFromMedia || doc.fileUrl || "#",
    type: doc.type as DownloadItem["type"],
    subCategory: doc.subCategory as DownloadItem["subCategory"],
    cover: resolveMediaUrl(cmsUrl, doc.cover),
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

export function mapStrapiProduct(
  doc: StrapiProductDoc,
  cmsUrl: string,
  index: number
): Product {
  const image = resolveMediaUrl(cmsUrl, doc.image);
  return {
    id: doc.sortOrder ?? index + 1,
    model: doc.model,
    name: { zh: doc.nameZh, en: doc.nameEn },
    desc: { zh: doc.descZh, en: doc.descEn },
    detail: doc.detailZh || doc.detailEn
      ? { zh: doc.detailZh ?? "", en: doc.detailEn ?? "" }
      : undefined,
    specs: doc.specsZh || doc.specsEn
      ? { zh: doc.specsZh ?? "", en: doc.specsEn ?? "" }
      : undefined,
    image,
    gallery: (doc.gallery ?? [])
      .map((item) => resolveMediaUrl(cmsUrl, item))
      .filter(Boolean),
    series:
      doc.seriesZh || doc.seriesEn
        ? { zh: doc.seriesZh ?? "", en: doc.seriesEn ?? "" }
        : undefined,
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
    const url = doc ? resolveMediaUrl(cmsUrl, doc.image) : "";
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
      image: resolveMediaUrl(cmsUrl, doc.homeFeaturedCaseImage) || fallback.homeFeaturedCase?.image,
    },
  };
}
