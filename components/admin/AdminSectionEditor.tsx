"use client";

import ProductSpecsEditor from "@/components/admin/ProductSpecsEditor";
import {
  mergeProductSpecsForSave,
  resolveAdminProductSpecs,
} from "@/lib/admin-product-spec-seed";
import {
  AdminBanner,
  Field,
  ImageUploadField,
  GalleryUploadField,
  FileUploadField,
  PdfSpecImportField,
  ReadOnlyField,
  SaveButton,
  SelectField,
  inputClass,
} from "@/components/admin/AdminFields";
import {
  compareAdminProductRows,
  countAdminProductsByCatalogFilter,
  getAdminProductCatalogTabs,
  getAdminProductMajorCategory,
  getAdminProductRowMeta,
  getAdminProductSeriesPatch,
  getAdminProductSeriesSelectOptions,
  getAdminSeriesSelectValue,
  matchAdminProductCatalogFilter,
  resolveAdminSeriesSavePatch,
  resolveAdminSeriesSelection,
  type AdminProductCatalogFilter,
} from "@/lib/admin-product-categories";
import {
  buildProductSeriesConfig,
  DEFAULT_PRODUCT_SERIES_CONFIG,
  getAdminSeriesPatch,
  getDefaultVisibleProductSeriesKey,
  getManagedSeriesSeedPayload,
  getMissingManagedSeriesSlugs,
  isProductSeriesDisplayKey,
  MANAGED_PRODUCT_SERIES_SLUGS,
  type CmsProductSeriesRow,
  type ProductSeriesConfig,
  type ProductSeriesDisplayKey,
} from "@/lib/product-series-config";
import { serializeSalesContactPayload } from "@/lib/admin-sales-contact-payload";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { formatSaveToast, type AdminSaveResponse } from "@/lib/admin-save-toast";
import { resolveAdminPreviewUrl } from "@/lib/media-url";
import {
  DOWNLOAD_SUB_CATEGORIES,
  DOWNLOAD_SUB_CATEGORY_CUSTOM_PRESET,
  initDownloadSubCategoryDraftFields,
  resolveDownloadSubCategoryForSave,
} from "@/lib/downloads";
import {
  buildCaseAdminSavePayload,
  caseDraftText,
  normalizeCaseAdminDraft,
} from "@/lib/admin-case-payload";
import { formatStrapiMediaSize } from "@/lib/format-bytes";
import { sectionToCollection } from "@/lib/strapi-admin";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ExternalLink,
  Eye,
  Languages,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type StrapiMedia = { id?: number; url?: string; size?: number };
type StrapiRow = Record<string, unknown> & {
  documentId?: string;
  id?: number;
  image?: StrapiMedia | null;
  cover?: StrapiMedia | null;
  file?: StrapiMedia | null;
  gallery?: StrapiMedia[] | null;
};

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{children}</p>;
}

function createDefaultContactDraft(): StrapiRow {
  return {
    companyZh: "",
    companyEn: "",
    phones: "",
    email: "",
    addressZh: "",
    addressEn: "",
    mapQuery: "",
    mapEmbedUrl: "",
    mapNavUrl: "",
    mapDisplayAddressZh: "",
    mapDisplayAddressEn: "",
    footerIntroZh: "",
    footerIntroEn: "",
  };
}

function parseContactLoadError(error: unknown): string {
  const raw = typeof error === "string" ? error : "";
  if (!raw) return "无法读取联系信息，已显示空白表单。请检查 CMS 连接。";
  if (/mapEmbedUrl|mapNavUrl|mapDisplayAddress|Unknown attribute|Invalid key|populate/i.test(raw)) {
    return "Strapi 尚未加载地图字段。请重启 CMS 使 schema 生效后刷新本页。";
  }
  return raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
}

function parseSalesContactLoadError(error: unknown): string {
  const raw = typeof error === "string" ? error : "";
  if (!raw) return "无法读取销售顾问列表。请检查 CMS 连接。";
  if (
    /sales-contact|salesContact|nameZh|qrImage|Unknown attribute|Invalid key|populate/i.test(raw)
  ) {
    return "Strapi 尚未加载 sales-contact 字段。请重启 CMS 使 schema 生效后刷新本页。";
  }
  return raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
}

const LEAD_STATUS_OPTIONS = [
  { value: "new", label: "未处理" },
  { value: "contacted", label: "已联系" },
  { value: "quoted", label: "已报价" },
  { value: "won", label: "已成交" },
  { value: "invalid", label: "无效" },
];

const LEGACY_LEAD_STATUS: Record<string, string> = {
  read: "已联系",
  qualified: "已联系",
  lost: "无效",
  archived: "无效",
};

function leadStatusLabel(value: string): string {
  return (
    LEAD_STATUS_OPTIONS.find((item) => item.value === value)?.label ??
    LEGACY_LEAD_STATUS[value] ??
    value
  );
}

function docId(row: StrapiRow) {
  return String(row.documentId ?? row.id ?? "");
}

/** 下载资源前台 id = sortOrder，新建时取当前最大值 +1 避免与已有资源冲突 */
function nextDownloadSortOrder(rows: StrapiRow[]): number {
  const max = rows.reduce((acc, row) => {
    const n = Number(row.sortOrder);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return max + 1;
}

function LeadDeleteButton({
  deleting,
  disabled,
  onClick,
}: {
  deleting: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [en, setEn] = useState(false);

  useEffect(() => {
    setEn(navigator.language.toLowerCase().startsWith("en"));
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || deleting}
      className="text-sm w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
    >
      {deleting ? (en ? "Deleting…" : "删除中…") : en ? "Delete Lead" : "删除线索"}
    </button>
  );
}

function mediaUrl(m?: StrapiMedia | null) {
  if (!m) return undefined;
  return resolveAdminPreviewUrl(m);
}

function getText(row: StrapiRow, key: string) {
  const v = row[key];
  return typeof v === "string" ? v : "";
}

/** Admin 草稿字段转纯文本（兼容 Strapi richtext 块） */
function getDraftText(row: StrapiRow, key: string): string {
  return caseDraftText(row, key);
}

function normalizeCaseDraft(row: StrapiRow): StrapiRow {
  return normalizeCaseAdminDraft(row) as StrapiRow;
}

function getCaseTranslatePairs(draft: StrapiRow) {
  const detailZh = getDraftText(draft, "detailZh") || getText(draft, "descZh");
  const detailEn = getDraftText(draft, "detailEn") || getText(draft, "descEn");
  const descZh = getText(draft, "descZh") || detailZh;
  const descEn = getText(draft, "descEn") || detailEn;

  return [
    {
      zhKey: "titleZh",
      enKey: "titleEn",
      zh: getText(draft, "titleZh"),
      en: getText(draft, "titleEn"),
    },
    {
      zhKey: "detailZh",
      enKey: "detailEn",
      zh: detailZh,
      en: detailEn,
    },
    {
      zhKey: "descZh",
      enKey: "descEn",
      zh: descZh,
      en: descEn,
    },
  ];
}

/** 互译结果写入案例草稿：概述/detail/desc 与表单联动 */
function applyCaseTranslatePatch(patch: Record<string, string>): Record<string, string> {
  const next = { ...patch };

  const overviewEn = (next.detailEn ?? next.descEn ?? "").trim();
  if (overviewEn) {
    next.detailEn = overviewEn;
    next.descEn = overviewEn;
  }

  const overviewZh = (next.detailZh ?? next.descZh ?? "").trim();
  if (overviewZh) {
    next.detailZh = overviewZh;
    next.descZh = overviewZh;
  }

  return next;
}

/** 存在待翻译中文且对应英文字段已有内容时需确认覆盖 */
function needsTranslateOverwriteConfirm(
  section: "cases" | "products",
  draft: StrapiRow
): boolean {
  const pairs =
    section === "cases" ? getCaseTranslatePairs(draft) : getProductTranslatePairs(draft);
  return pairs.some((pair) => pair.zh.trim() && pair.en.trim());
}

function getProductTranslatePairs(draft: StrapiRow) {
  return (
    [
      { zhKey: "nameZh", enKey: "nameEn" },
      { zhKey: "descZh", enKey: "descEn" },
      { zhKey: "detailZh", enKey: "detailEn" },
      { zhKey: "specsZh", enKey: "specsEn" },
    ] as const
  ).map((pair) => ({
    zhKey: pair.zhKey,
    enKey: pair.enKey,
    zh: getText(draft, pair.zhKey),
    en: getText(draft, pair.enKey),
  }));
}

function getCaseOverviewDisplay(row: StrapiRow, lang: "zh" | "en"): string {
  const detailKey = lang === "zh" ? "detailZh" : "detailEn";
  const descKey = lang === "zh" ? "descZh" : "descEn";
  return getDraftText(row, detailKey) || getText(row, descKey);
}

function setDraft(drafts: Record<string, StrapiRow>, id: string, patch: Partial<StrapiRow>) {
  return { ...drafts, [id]: { ...drafts[id], ...patch } };
}

function productRowTitle(draft: StrapiRow): string {
  return getText(draft, "model") || docId(draft);
}

function rowTitle(draft: StrapiRow): string {
  return (
    getText(draft, "name") ||
    getText(draft, "titleZh") ||
    getText(draft, "nameZh") ||
    getText(draft, "model") ||
    getText(draft, "labelZh") ||
    getText(draft, "sectionKey") ||
    docId(draft)
  );
}

function rowSubtitle(
  section: string,
  draft: StrapiRow,
  productSeriesConfig: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): string | null {
  if (section === "downloads") {
    const size = getText(draft, "size");
    const fileName = getText(draft, "fileName");
    return [size && size !== "—" ? size : null, fileName].filter(Boolean).join(" · ") || null;
  }
  if (section === "products") {
    const meta = getAdminProductRowMeta(draft, productSeriesConfig);
    return meta.subtitle || null;
  }
  if (section === "cases") {
    const typeLabel = getText(draft, "type") === "performance" ? "演出案例" : "工程案例";
    const overview =
      getDraftText(draft, "detailZh") ||
      getText(draft, "descZh") ||
      getDraftText(draft, "detailEn") ||
      getText(draft, "descEn");
    const sortOrder = Number(draft.sortOrder) || 0;
    const overviewPreview =
      overview.length > 48 ? `${overview.slice(0, 48)}…` : overview || null;
    return [typeLabel, overviewPreview, sortOrder > 0 ? `排序 ${sortOrder}` : null]
      .filter(Boolean)
      .join(" · ");
  }
  if (section === "leads") {
    const status = leadStatusLabel(getText(draft, "status") || "new");
    const company = getText(draft, "company");
    const owner = getText(draft, "owner");
    const score = Number(draft.intentScore) || 0;
    return [status, company, owner, score > 0 ? `意向 ${score}` : null].filter(Boolean).join(" · ");
  }
  return null;
}

function compareCaseRows(a: StrapiRow, b: StrapiRow) {
  const orderA = Number(a.sortOrder) || 0;
  const orderB = Number(b.sortOrder) || 0;
  if (orderA !== orderB) return orderA - orderB;
  return rowTitle(a).localeCompare(rowTitle(b), "zh-Hans-CN");
}

function rowSearchText(
  section: string,
  draft: StrapiRow,
  productSeriesConfig: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
): string {
  const base = [
    rowTitle(draft),
    rowSubtitle(section, draft, productSeriesConfig),
    getText(draft, "nameEn"),
    getText(draft, "titleEn"),
    getText(draft, "model"),
    getText(draft, "slug"),
    getText(draft, "company"),
    getText(draft, "email"),
    getText(draft, "phone"),
    getText(draft, "status"),
    getText(draft, "owner"),
    getText(draft, "country"),
    getText(draft, "utmSource"),
  ];

  if (section === "products") {
    base.push(
      getText(draft, "productLine"),
      getText(draft, "seriesZh"),
      getText(draft, "seriesEn"),
      getText(draft, "descZh"),
      getText(draft, "descEn"),
      getText(draft, "category"),
      getText(draft, "seriesGroup"),
      getAdminProductRowMeta(draft, productSeriesConfig).majorCategory.label
    );
  }

  return base.filter(Boolean).join(" ").toLowerCase();
}

const CREATABLE_SECTIONS = new Set(["products", "cases", "downloads", "about", "qr"]);

type ManagedSeriesDraft = {
  documentId: string;
  slug: ProductSeriesDisplayKey;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  visible: boolean;
  modelPrefix: string;
  seriesGroup: string;
};

function toManagedSeriesDraft(row: Record<string, unknown>): ManagedSeriesDraft | null {
  const slug = String(row.slug ?? "").trim().toLowerCase();
  if (!isProductSeriesDisplayKey(slug)) return null;
  const documentId = String(row.documentId ?? "").trim();
  if (!documentId) return null;
  return {
    documentId,
    slug,
    nameZh: String(row.nameZh ?? ""),
    nameEn: String(row.nameEn ?? ""),
    sortOrder: Number(row.sortOrder) || 0,
    visible: row.visible !== false,
    modelPrefix: String(row.modelPrefix ?? slug.toUpperCase()),
    seriesGroup: String(row.seriesGroup ?? "speaker"),
  };
}

function applyManagedSeriesState(
  cmsRows: CmsProductSeriesRow[] | undefined,
  setConfig: (config: ProductSeriesConfig) => void,
  setRows: (rows: ManagedSeriesDraft[]) => void,
  setDrafts: (drafts: Record<string, ManagedSeriesDraft>) => void,
  setMissing: (slugs: ProductSeriesDisplayKey[]) => void
) {
  setConfig(buildProductSeriesConfig(cmsRows));
  const managed = MANAGED_PRODUCT_SERIES_SLUGS.map((slug) => {
    const hit = (cmsRows ?? []).find(
      (row) => String(row.slug ?? "").trim().toLowerCase() === slug
    );
    return hit ? toManagedSeriesDraft(hit as unknown as Record<string, unknown>) : null;
  }).filter((row): row is ManagedSeriesDraft => Boolean(row));
  setRows(managed);
  setDrafts(Object.fromEntries(managed.map((row) => [row.slug, { ...row }])));
  setMissing(getMissingManagedSeriesSlugs(cmsRows));
}

/** Unique draft model for each 「新增产品」 click (Strapi model is unique). */
function createDraftProductModel(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DRAFT-${stamp}-${suffix}`;
}

export default function AdminSectionEditor({
  section,
  tokenReady,
}: {
  section: string;
  tokenReady: boolean;
}) {
  const collection = sectionToCollection(section);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<StrapiRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, StrapiRow>>({});
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [contactDraft, setContactDraft] = useState<StrapiRow | null>(null);
  const [contactLoadError, setContactLoadError] = useState<string | null>(null);
  const [salesContactRows, setSalesContactRows] = useState<StrapiRow[]>([]);
  const [salesContactDrafts, setSalesContactDrafts] = useState<Record<string, StrapiRow>>({});
  const [salesContactOpenId, setSalesContactOpenId] = useState<string | null>(null);
  const [salesContactLoadError, setSalesContactLoadError] = useState<string | null>(null);
  const [leads, setLeads] = useState<StrapiRow[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(true);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [translateConfirmId, setTranslateConfirmId] = useState<string | null>(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [leadPriorityOnly, setLeadPriorityOnly] = useState(false);
  const [productCatalogFilter, setProductCatalogFilter] =
    useState<AdminProductCatalogFilter>("all");
  /** 产品排序输入草稿（与「保存并发布」解耦，由「应用排序」立即写入 CMS） */
  const [productSortDrafts, setProductSortDrafts] = useState<Record<string, string>>({});
  const [productSeriesConfig, setProductSeriesConfig] = useState<ProductSeriesConfig>(
    DEFAULT_PRODUCT_SERIES_CONFIG
  );
  const [managedSeriesRows, setManagedSeriesRows] = useState<ManagedSeriesDraft[]>([]);
  const [managedSeriesDrafts, setManagedSeriesDrafts] = useState<Record<string, ManagedSeriesDraft>>(
    {}
  );
  const [missingManagedSlugs, setMissingManagedSlugs] = useState<ProductSeriesDisplayKey[]>([]);
  const [savingSeriesSlug, setSavingSeriesSlug] = useState<string | null>(null);
  /** 产品系列管理：增加系列下拉是否展开 */
  const [showAddSeriesMenu, setShowAddSeriesMenu] = useState(false);
  /** 新增产品后短暂高亮定位 */
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const clearHighlightTimer = useCallback(() => {
    if (highlightTimerRef.current != null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }, []);

  const focusCreatedAdminRow = useCallback((createdId: string) => {
    const tryScroll = () => {
      const el = document.getElementById(`admin-row-${createdId}`);
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    };
    window.requestAnimationFrame(() => {
      if (tryScroll()) return;
      window.setTimeout(() => {
        if (!tryScroll()) window.setTimeout(tryScroll, 300);
      }, 200);
    });
  }, []);

  const highlightCreatedRow = useCallback(
    (createdId: string) => {
      clearHighlightTimer();
      setHighlightedRowId(createdId);
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedRowId((current) => (current === createdId ? null : current));
        highlightTimerRef.current = null;
      }, 2500);
    },
    [clearHighlightTimer]
  );

  useEffect(() => () => clearHighlightTimer(), [clearHighlightTimer]);

  const previewHref = ADMIN_SECTIONS.find((s) => s.id === section)?.previewHref;
  const adminProductCatalogTabs = useMemo(
    () => getAdminProductCatalogTabs(productSeriesConfig),
    [productSeriesConfig]
  );

  const productCatalogTabCounts = useMemo(() => {
    if (section !== "products") return null;
    const draftsRows = rows.map((row) => drafts[docId(row)] ?? row);
    return countAdminProductsByCatalogFilter(draftsRows, productSeriesConfig);
  }, [section, rows, drafts, productSeriesConfig]);

  /** 全站产品按 sortOrder 升序（上移/下移邻居，不受系列 Tab 筛选影响） */
  const sortedAllProducts = useMemo(() => {
    if (section !== "products") return [];
    return [...rows].sort((a, b) => {
      const orderA = Number(a.sortOrder);
      const orderB = Number(b.sortOrder);
      const safeA = Number.isFinite(orderA) ? orderA : Number.MAX_SAFE_INTEGER;
      const safeB = Number.isFinite(orderB) ? orderB : Number.MAX_SAFE_INTEGER;
      if (safeA !== safeB) return safeA - safeB;
      return String(a.model ?? "").localeCompare(String(b.model ?? ""), "zh-Hans-CN");
    });
  }, [section, rows]);

  const duplicateProductSortOrders = useMemo(() => {
    if (section !== "products") return [];
    const map = new Map<number, number>();
    for (const row of rows) {
      const sortOrder = Number(row.sortOrder);
      if (!Number.isInteger(sortOrder) || sortOrder <= 0) continue;
      map.set(sortOrder, (map.get(sortOrder) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .filter(([, count]) => count > 1)
      .map(([sortOrder, count]) => ({ sortOrder, count }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [section, rows]);

  useEffect(() => {
    if (localStorage.getItem("dbsource-admin-hint") === "hidden") setShowHint(false);
  }, []);

  useEffect(() => {
    const target = searchParams.get("doc")?.trim();
    if (!target || rows.length === 0) return;
    const exists = rows.some((row) => docId(row) === target);
    if (!exists) return;
    setOpenId(target);
    window.setTimeout(() => {
      document.getElementById(`admin-row-${target}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
  }, [searchParams, rows]);

  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const searched = q
      ? rows.filter((row) => {
          const draft = drafts[docId(row)] ?? row;
          return rowSearchText(section, draft, productSeriesConfig).includes(q);
        })
      : rows;

    if (section === "products") {
      const seriesFiltered = searched.filter((row) => {
        const draft = drafts[docId(row)] ?? row;
        return matchAdminProductCatalogFilter(draft, productCatalogFilter, productSeriesConfig);
      });
      return [...seriesFiltered].sort((a, b) => {
        const draftA = drafts[docId(a)] ?? a;
        const draftB = drafts[docId(b)] ?? b;
        return compareAdminProductRows(draftA, draftB, productSeriesConfig);
      });
    }

    if (section !== "leads") return searched;
    return searched.filter((row) => {
      const draft = drafts[docId(row)] ?? row;
      const matchesStatus =
        leadStatusFilter === "all" ? true : getText(draft, "status") === leadStatusFilter;
      const matchesPriority = leadPriorityOnly ? (Number(draft.intentScore) || 0) >= 70 : true;
      return matchesStatus && matchesPriority;
    });
  }, [
    rows,
    drafts,
    debouncedSearch,
    section,
    leadStatusFilter,
    leadPriorityOnly,
    productCatalogFilter,
    productSeriesConfig,
  ]);

  const load = useCallback(
    async (preferredOpenId?: string | null) => {
      if (!tokenReady) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setMessage(null);

      if (section === "contact") {
        const [cRes, lRes, sRes] = await Promise.all([
          fetch("/api/admin/contact-info"),
          fetch("/api/admin/leads"),
          fetch("/api/admin/sales-contacts"),
        ]);
        const cJson = await cRes.json();
        const lJson = await lRes.json();
        const sJson = (await sRes.json()) as {
          ok?: boolean;
          error?: string;
          data?: { data?: StrapiRow[] };
        };
        if (cJson.ok && cJson.data?.data) {
          setContactDraft(cJson.data.data as StrapiRow);
          setContactLoadError(null);
        } else {
          setContactDraft(createDefaultContactDraft());
          setContactLoadError(parseContactLoadError(cJson.error));
        }
        if (lJson.ok && lJson.data?.data) {
          setLeads(lJson.data.data as StrapiRow[]);
        }
        if (sJson.ok && sJson.data?.data) {
          const list = (sJson.data.data as StrapiRow[])
            .slice()
            .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
          setSalesContactRows(list);
          const init: Record<string, StrapiRow> = {};
          list.forEach((row) => {
            init[docId(row)] = { ...row };
          });
          setSalesContactDrafts(init);
          setSalesContactLoadError(null);
          setSalesContactOpenId((current) => {
            if (current && list.some((item) => docId(item) === current)) return current;
            return list[0] ? docId(list[0]) : null;
          });
        } else {
          setSalesContactRows([]);
          setSalesContactDrafts({});
          setSalesContactLoadError(parseSalesContactLoadError(sJson.error));
        }
        setLoading(false);
        return;
      }

      if (!collection || collection === "contact-info") {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/${collection}`);
      const json = await res.json();
      if (section === "products") {
        try {
          const seriesRes = await fetch("/api/admin/product-series-configs");
          const seriesJson = (await seriesRes.json()) as {
            ok?: boolean;
            data?: { data?: CmsProductSeriesRow[] };
          };
          const cmsRows = seriesJson.ok ? seriesJson.data?.data : undefined;
          applyManagedSeriesState(
            cmsRows,
            setProductSeriesConfig,
            setManagedSeriesRows,
            setManagedSeriesDrafts,
            setMissingManagedSlugs
          );
        } catch {
          setProductSeriesConfig(DEFAULT_PRODUCT_SERIES_CONFIG);
          setManagedSeriesRows([]);
          setManagedSeriesDrafts({});
          setMissingManagedSlugs([...MANAGED_PRODUCT_SERIES_SLUGS]);
        }
      }
      if (json.ok && json.data?.data) {
        const list = json.data.data as StrapiRow[];
        setRows(list);
        const init: Record<string, StrapiRow> = {};
        list.forEach((r) => {
          const row = { ...r };
          if (section === "downloads" && typeof (row.file as StrapiMedia)?.size === "number") {
            row.size = formatStrapiMediaSize((row.file as StrapiMedia).size!);
          }
          if (section === "downloads") {
            Object.assign(
              row,
              initDownloadSubCategoryDraftFields(String(row.subCategory ?? ""))
            );
          }
          if (section === "cases") {
            Object.assign(row, normalizeCaseDraft(row));
          }
          init[docId(r)] = row;
        });
        setDrafts(init);
        setOpenId((current) => {
          if (preferredOpenId && list.some((item) => docId(item) === preferredOpenId)) {
            return preferredOpenId;
          }
          if (current && list.some((item) => docId(item) === current)) {
            return current;
          }
          return list[0] ? docId(list[0]) : null;
        });
      } else {
        setMessage({ type: "error", text: json.error || "加载失败" });
      }
      setLoading(false);
    },
    [collection, section, tokenReady]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function saveRow(id: string, overlay?: Partial<StrapiRow>) {
    if (!collection || collection === "contact-info") return;
    const baseDraft = drafts[id];
    if (!baseDraft) return;

    const draft = overlay ? { ...baseDraft, ...overlay } : baseDraft;
    if (overlay) {
      setDrafts((d) => setDraft(d, id, overlay));
    }

    setSavingId(id);
    setMessage(null);

    let payload: Record<string, unknown>;
    if (collection === "cases") {
      payload = buildCaseAdminSavePayload(draft);
    } else {
      payload = { ...draft };
      delete payload.documentId;
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.publishedAt;
      delete payload.locale;
      delete payload.localizations;
      if (payload.image === null) {
        payload.image = null;
      } else if (payload.image && typeof payload.image === "object") {
        payload.image = (payload.image as StrapiMedia).id ?? payload.image;
      }
      if (payload.cover === null) {
        payload.cover = null;
      }
      if (payload.cover && typeof payload.cover === "object") {
        payload.cover = (payload.cover as StrapiMedia).id ?? payload.cover;
      }
      if (payload.file && typeof payload.file === "object") {
        payload.file = (payload.file as StrapiMedia).id ?? payload.file;
      }
      if (Array.isArray(payload.gallery)) {
        payload.gallery = (payload.gallery as StrapiMedia[]).map((g) => g.id ?? g);
      }
    }

    if (collection === "products") {
      const model = String(draft.model ?? "").trim();
      payload.model = model;
      payload.nameZh = String(draft.nameZh ?? model).trim() || model;
      payload.nameEn = String(draft.nameEn ?? model).trim() || model;
      const seriesPatch = resolveAdminSeriesSavePatch(productSeriesConfig, {
        productLine: String(draft.productLine ?? "").trim(),
        model,
        seriesZh: String(draft.seriesZh ?? "").trim(),
      });
      if (seriesPatch) {
        payload.productLine = seriesPatch.productLine;
        payload.seriesZh = seriesPatch.seriesZh;
        payload.seriesEn = seriesPatch.seriesEn;
        payload.seriesGroup = seriesPatch.seriesGroup;
        payload.category = seriesPatch.category;
      }
      const mergedSpecs = mergeProductSpecsForSave(draft as Record<string, unknown>);
      payload.specsZh = mergedSpecs.specsZh;
      payload.specsEn = mergedSpecs.specsEn;
    }

    if (collection === "downloads") {
      const customSub = String(payload.subCategoryCustom ?? "").trim();
      const presetSub = String(
        payload.subCategoryPreset ?? payload.subCategory ?? "v225a"
      ).trim();
      const existingSub = String(draft.subCategory ?? "").trim();
      payload.subCategory = resolveDownloadSubCategoryForSave(
        customSub,
        presetSub,
        existingSub
      );
      delete payload.subCategoryCustom;
      delete payload.subCategoryPreset;

      const sortOrder = Number(payload.sortOrder);
      if (!Number.isFinite(sortOrder) || sortOrder <= 0) {
        setSavingId(null);
        setMessage({ type: "error", text: "排序 ID 须为正整数（前台下载链接使用此数字）" });
        return;
      }
      const duplicate = rows.some(
        (r) => docId(r) !== id && Number(r.sortOrder) === sortOrder
      );
      if (duplicate) {
        setSavingId(null);
        setMessage({
          type: "error",
          text: `排序 ID ${sortOrder} 已被其他资源占用，请改用唯一数字（建议 ${nextDownloadSortOrder(rows)}）`,
        });
        return;
      }
      if (payload.file === undefined) {
        delete payload.file;
      }
      if (payload.file && payload.fileUrl === "#") {
        delete payload.fileUrl;
      }
    }

    const res = await fetch(`/api/admin/${collection}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
    setSavingId(null);
    if (json.ok) {
      const toast = formatSaveToast(json);
      setMessage({ type: toast.type, text: toast.text });
      const savedRow =
        collection === "cases"
          ? normalizeCaseDraft({
              ...draft,
              ...payload,
              documentId: draft.documentId,
            })
          : collection === "products"
            ? {
                ...draft,
                ...payload,
                specsZh: String(payload.specsZh ?? ""),
                specsEn: String(payload.specsEn ?? ""),
                documentId: draft.documentId,
              }
            : { ...draft, documentId: draft.documentId };
      setDrafts((d) => setDraft(d, id, savedRow));
      setRows((prev) =>
        prev.map((r) =>
          docId(r) === id
            ? { ...savedRow, documentId: r.documentId ?? draft.documentId }
            : r
        )
      );
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (collection === "products") {
        await load(id);
      }
    } else {
      setMessage({ type: "error", text: json.error || "保存失败" });
    }
  }

  async function deleteRow(id: string) {
    if (!collection || collection === "contact-info") return;
    if (!confirm("确定删除此条目？此操作不可撤销。")) return;
    setSavingId(id);
    const res = await fetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
    const json = await res.json();
    setSavingId(null);
    if (json.ok) {
      setMessage({ type: "ok", text: "已删除" });
      load();
    } else {
      setMessage({ type: "error", text: json.error || "删除失败" });
    }
  }

  async function deleteLeadRow(id: string) {
    if (!window.confirm("确定要删除这条线索吗？删除后不可恢复。")) return;
    setSavingId(`lead-delete-${id}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
      const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
      if (json.ok) {
        setRows((prev) => prev.filter((row) => docId(row) !== id));
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setDirtyIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setOpenId((current) => (current === id ? null : current));
        const toast = formatSaveToast(json);
        setMessage({ type: toast.type, text: toast.text || "线索已删除" });
        router.push("/admin/leads");
      } else {
        setMessage({ type: "error", text: json.error || "删除失败" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "删除失败";
      setMessage({ type: "error", text: msg });
    } finally {
      setSavingId(null);
    }
  }

  async function createRow() {
    if (!collection || collection === "contact-info") return;
    setSavingId("new");
    const maxLegacyId = rows.reduce((m, r) => Math.max(m, Number(r.legacyId) || 0), 0);
    const draftModel = createDraftProductModel();
    const defaultSeriesKey = getDefaultVisibleProductSeriesKey(productSeriesConfig);
    const defaults: Record<string, Record<string, unknown>> = {
      products: {
        model: draftModel,
        nameZh: draftModel,
        nameEn: draftModel,
        descZh: "",
        descEn: "",
        ...getAdminSeriesPatch(productSeriesConfig, "engineering", defaultSeriesKey, draftModel),
        market: "all",
        sortOrder: rows.length + 1,
      },
      cases: {
        legacyId: maxLegacyId + 1,
        type: "engineering",
        titleZh: "新案例",
        titleEn: "New Case",
        descZh: "案例简介",
        descEn: "Case summary",
        market: "all",
        sortOrder: rows.length + 1,
      },
      downloads: {
        nameZh: "新下载项",
        nameEn: "New Download",
        size: "",
        fileName: "",
        fileUrl: "#",
        type: "software",
        subCategory: "v225a",
        market: "all",
        sortOrder: nextDownloadSortOrder(rows),
      },
      "about-sections": {
        sectionKey: `section-${Date.now()}`,
        titleZh: "新区块",
        titleEn: "New Section",
        sortOrder: rows.length + 1,
      },
      "qr-codes": {
        labelZh: "新二维码",
        labelEn: "New QR",
        sortOrder: rows.length + 1,
      },
    };
    const res = await fetch(`/api/admin/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(defaults[collection] ?? {}),
    });
    const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
    setSavingId(null);
    if (json.ok) {
      const created = (json as { data?: { data?: StrapiRow } }).data?.data;
      const createdId = created ? docId(created) : null;

      // 产品：清搜索/切到全部，保证可见，再展开并滚动高亮（不改 sortOrder）
      if (section === "products" && createdId) {
        setSearch("");
        setProductCatalogFilter("all");
        await load(createdId);
        setMessage({ type: "ok", text: "已创建新产品，已定位到新建项。" });
        focusCreatedAdminRow(createdId);
        highlightCreatedRow(createdId);
        return;
      }

      const toast = formatSaveToast(json);
      setMessage({ type: toast.type, text: toast.text });
      load(createdId);
    } else {
      setMessage({ type: "error", text: json.error || "创建失败" });
    }
  }

  async function reloadManagedSeries() {
    try {
      const seriesRes = await fetch("/api/admin/product-series-configs");
      const seriesJson = (await seriesRes.json()) as {
        ok?: boolean;
        data?: { data?: CmsProductSeriesRow[] };
      };
      const cmsRows = seriesJson.ok ? seriesJson.data?.data : undefined;
      applyManagedSeriesState(
        cmsRows,
        setProductSeriesConfig,
        setManagedSeriesRows,
        setManagedSeriesDrafts,
        setMissingManagedSlugs
      );
    } catch {
      setMessage({ type: "error", text: "产品系列配置刷新失败" });
    }
  }

  async function saveManagedSeries(slug: ProductSeriesDisplayKey) {
    const draft = managedSeriesDrafts[slug];
    if (!draft?.documentId) return;
    setSavingSeriesSlug(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/product-series-configs/${draft.documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: draft.slug,
          nameZh: draft.nameZh.trim() || draft.slug,
          nameEn: draft.nameEn.trim() || draft.nameZh.trim() || draft.slug,
          sortOrder: Number(draft.sortOrder) || 0,
          visible: draft.visible,
          modelPrefix: draft.modelPrefix || draft.slug.toUpperCase(),
          seriesGroup: draft.seriesGroup || "speaker",
        }),
      });
      const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
      if (json.ok) {
        const toast = formatSaveToast(json);
        setMessage({
          type: toast.type,
          text: toast.text || `系列 ${slug} 已保存`,
        });
        await reloadManagedSeries();
      } else {
        setMessage({ type: "error", text: json.error || "系列保存失败" });
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "系列保存失败",
      });
    } finally {
      setSavingSeriesSlug(null);
    }
  }

  async function fillMissingManagedSeries(slug: ProductSeriesDisplayKey) {
    if (!missingManagedSlugs.includes(slug)) return;
    if (!isProductSeriesDisplayKey(slug)) return;
    setSavingSeriesSlug(slug);
    setShowAddSeriesMenu(false);
    setMessage(null);
    try {
      const seed = getManagedSeriesSeedPayload(slug);
      const res = await fetch("/api/admin/product-series-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seed),
      });
      const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
      if (json.ok) {
        setMessage({
          type: "ok",
          text: `已补齐 ${seed.nameZh || slug.toUpperCase()} 系列。`,
        });
        await reloadManagedSeries();
      } else {
        setMessage({ type: "error", text: json.error || "补齐系列失败" });
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "补齐系列失败",
      });
    } finally {
      setSavingSeriesSlug(null);
    }
  }

  function countProductsUsingSeries(slug: string): number {
    // rows 为后台加载的全量产品列表（筛选只作用于 filteredRows）
    return rows.reduce((count, row) => {
      const id = docId(row);
      const draft = drafts[id] ?? row;
      return String(draft.productLine ?? "").trim() === slug ? count + 1 : count;
    }, 0);
  }

  async function deleteManagedSeries(slug: string) {
    const draft = managedSeriesDrafts[slug] ?? managedSeriesRows.find((row) => row.slug === slug);
    if (!draft?.documentId) {
      window.alert("无法删除：未找到该系列的文档 ID。");
      return;
    }

    const usageCount = countProductsUsingSeries(slug);
    if (usageCount > 0) {
      window.alert(
        `该系列下仍有 ${usageCount} 个产品，不能删除。请先将产品移动到其他系列，或使用隐藏。`
      );
      return;
    }

    // 稳定版：核心七项禁止真删除，请用 visible=false
    if (isProductSeriesDisplayKey(slug)) {
      window.alert("该系列属于固定产品系列，不建议删除。请使用隐藏功能。");
      return;
    }

    const label = draft.nameZh?.trim() || slug;
    const ok = window.confirm(
      `确认删除系列「${label}」（${slug}）？\n删除后不可恢复，建议优先使用隐藏。`
    );
    if (!ok) return;

    setSavingSeriesSlug(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/product-series-configs/${draft.documentId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
      if (json.ok) {
        setMessage({ type: "ok", text: `系列「${label}」已删除。` });
        await reloadManagedSeries();
      } else {
        setMessage({ type: "error", text: json.error || "删除系列失败" });
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "删除系列失败",
      });
    } finally {
      setSavingSeriesSlug(null);
    }
  }

  async function saveContact() {
    if (!contactDraft) return;
    setSavingId("contact");
    setMessage(null);
    const payload: Record<string, unknown> = { ...contactDraft };
    ["documentId", "id", "createdAt", "updatedAt", "publishedAt"].forEach((k) => delete payload[k]);

    const res = await fetch("/api/admin/contact-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
    setSavingId(null);
    if (json.ok) {
      const toast = formatSaveToast(json);
      setMessage({ type: toast.type, text: toast.text });
      setContactLoadError(null);
      const reload = await fetch("/api/admin/contact-info");
      const reloadJson = (await reload.json()) as {
        ok?: boolean;
        error?: string;
        data?: { data?: StrapiRow };
      };
      if (reloadJson.ok && reloadJson.data?.data) {
        setContactDraft(reloadJson.data.data as StrapiRow);
      }
    } else {
      setMessage({
        type: "error",
        text: parseContactLoadError(json.error) || "保存失败",
      });
    }
  }

  async function saveSalesContactRow(id: string) {
    const draft = salesContactDrafts[id];
    if (!draft) return;
    setSavingId(`sales-${id}`);
    setMessage(null);

    const payload = serializeSalesContactPayload(draft);

    try {
      const res = await fetch(`/api/admin/sales-contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
      if (json.ok) {
        const toast = formatSaveToast(json);
        setMessage({ type: toast.type, text: toast.text });
        setSalesContactLoadError(null);
        const reload = await fetch("/api/admin/sales-contacts");
        const reloadJson = (await reload.json()) as {
          ok?: boolean;
          error?: string;
          data?: { data?: StrapiRow[] };
        };
        if (reloadJson.ok && reloadJson.data?.data) {
          const list = (reloadJson.data.data as StrapiRow[])
            .slice()
            .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
          setSalesContactRows(list);
          const init: Record<string, StrapiRow> = {};
          list.forEach((row) => {
            init[docId(row)] = { ...row };
          });
          setSalesContactDrafts(init);
        }
      } else {
        setMessage({
          type: "error",
          text: parseSalesContactLoadError(json.error) || "销售顾问保存失败",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "销售顾问保存失败";
      setMessage({ type: "error", text: msg });
    } finally {
      setSavingId(null);
    }
  }

  async function deleteSalesContactRow(id: string) {
    if (!window.confirm("确定删除该销售顾问？此操作不可撤销。")) return;
    setSavingId(`sales-delete-${id}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/sales-contacts/${id}`, { method: "DELETE" });
      const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
      if (json.ok) {
        const toast = formatSaveToast(json);
        setMessage({ type: toast.type, text: toast.text });
        setSalesContactRows((prev) => prev.filter((row) => docId(row) !== id));
        setSalesContactDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setSalesContactOpenId((current) => (current === id ? null : current));
      } else {
        setMessage({
          type: "error",
          text: parseSalesContactLoadError(json.error) || "删除失败",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "删除失败";
      setMessage({ type: "error", text: msg });
    } finally {
      setSavingId(null);
    }
  }

  async function addSalesContact() {
    setSavingId("sales-new");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sales-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameZh: "新销售顾问",
          nameEn: "",
          titleZh: "",
          titleEn: "",
          phone: "",
          wechatId: "",
          enabled: true,
          sortOrder: salesContactRows.length + 1,
        }),
      });
      const json = (await res.json()) as AdminSaveResponse & {
        ok?: boolean;
        error?: string;
        data?: { data?: StrapiRow };
      };
      if (json.ok) {
        const toast = formatSaveToast(json);
        setMessage({ type: toast.type, text: toast.text });
        setSalesContactLoadError(null);
        const created = json.data?.data;
        const createdId = created ? docId(created) : null;
        const reload = await fetch("/api/admin/sales-contacts");
        const reloadJson = (await reload.json()) as {
          ok?: boolean;
          data?: { data?: StrapiRow[] };
        };
        if (reloadJson.ok && reloadJson.data?.data) {
          const list = (reloadJson.data.data as StrapiRow[])
            .slice()
            .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
          setSalesContactRows(list);
          const init: Record<string, StrapiRow> = {};
          list.forEach((row) => {
            init[docId(row)] = { ...row };
          });
          setSalesContactDrafts(init);
          if (createdId) setSalesContactOpenId(createdId);
        }
      } else {
        setMessage({
          type: "error",
          text: parseSalesContactLoadError(json.error) || "新增销售顾问失败",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "新增销售顾问失败";
      setMessage({ type: "error", text: msg });
    } finally {
      setSavingId(null);
    }
  }

  function moveCaseRow(id: string, direction: "up" | "down") {
    if (section !== "cases") return;
    const current = drafts[id];
    if (!current) return;
    const caseType = getText(current, "type") || "engineering";
    const currentOrder = Number(current.sortOrder) || 0;
    const sameType = rows
      .map((row) => drafts[docId(row)] ?? row)
      .filter((item) => (getText(item, "type") || "engineering") === caseType)
      .sort(compareCaseRows);
    const index = sameType.findIndex((item) => docId(item) === id);
    if (index < 0) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sameType.length) return;
    const other = sameType[swapIndex];
    const otherId = docId(other);
    const otherOrder = Number(other.sortOrder) || 0;
    setDrafts((prev) => {
      const next = { ...prev };
      next[id] = { ...(next[id] ?? current), sortOrder: otherOrder };
      next[otherId] = { ...(next[otherId] ?? other), sortOrder: currentOrder };
      return next;
    });
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      next.add(otherId);
      return next;
    });
  }

  /** 全站相邻产品立即交换并保存到 CMS */
  async function moveProductRow(id: string, direction: "up" | "down") {
    if (section !== "products") return;
    const current = rows.find((row) => docId(row) === id);
    if (!current) {
      setMessage({ type: "error", text: "未找到当前产品" });
      return;
    }

    const index = sortedAllProducts.findIndex((item) => docId(item) === id);
    if (index < 0) {
      setMessage({ type: "error", text: "未在产品列表中找到当前产品" });
      return;
    }
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const neighbor = sortedAllProducts[swapIndex];
    if (!neighbor) return;

    const targetSortOrder = Number(neighbor.sortOrder);
    if (!Number.isInteger(targetSortOrder) || targetSortOrder <= 0) {
      setMessage({ type: "error", text: "目标产品排序号无效" });
      return;
    }

    await applyProductSortOrder(id, targetSortOrder);
  }

  async function applyProductSortOrder(id: string, targetOverride?: number) {
    if (section !== "products") return;
    const documentId = id.trim();
    if (!documentId) {
      setMessage({ type: "error", text: "当前产品缺少 documentId，无法排序" });
      return;
    }

    const draftValue =
      targetOverride != null
        ? String(targetOverride)
        : (productSortDrafts[documentId] ?? String(drafts[documentId]?.sortOrder ?? "")).trim();
    const targetSortOrder = Number(draftValue);
    if (!Number.isInteger(targetSortOrder) || targetSortOrder <= 0) {
      setMessage({ type: "error", text: "排序号必须是正整数" });
      return;
    }

    setSavingId(`product-sort-${documentId}`);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products/swap-sort-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDocumentId: documentId,
          targetSortOrder,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        changed?: boolean;
      };

      if (!res.ok || !json.ok) {
        setMessage({
          type: "error",
          text: json.error || json.message || "产品排序更新失败",
        });
        return;
      }

      setProductSortDrafts({});
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });

      await load(openId);
      setMessage({
        type: "ok",
        text: json.message || (json.changed === false ? "排序未变化" : "排序已更新"),
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "排序更新失败，请稍后重试",
      });
    } finally {
      setSavingId(null);
    }
  }

  function requestTranslateBilingualRow(id: string) {
    if (section !== "cases" && section !== "products") return;
    const draft = draftsRef.current[id];
    if (!draft) return;

    if (needsTranslateOverwriteConfirm(section, draft)) {
      setTranslateConfirmId(id);
      return;
    }

    void executeTranslateBilingualRow(id);
  }

  async function executeTranslateBilingualRow(id: string) {
    if (section !== "cases" && section !== "products") return;
    // 始终读取当前 drafts 中的最新表单值，不读 CMS 旧快照
    const draft = draftsRef.current[id];
    if (!draft) return;

    const payloadPairs =
      section === "cases" ? getCaseTranslatePairs(draft) : getProductTranslatePairs(draft);
    const hasAnySource = payloadPairs.some((pair) => pair.zh.trim() || pair.en.trim());
    if (!hasAnySource) {
      setMessage({ type: "error", text: "请先填写中文或英文内容，再执行中英互转。" });
      return;
    }

    setTranslatingId(id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, pairs: payloadPairs }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setMessage({
          type: "error",
          text:
            res.status === 401 || res.status === 403
              ? "未授权或登录已失效，请重新登录后台后再试。"
              : `翻译接口返回异常（HTTP ${res.status}），请确认线上已部署 /api/admin/translate。`,
        });
        return;
      }

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: Record<string, string>;
      };

      if (res.status === 401 || res.status === 403) {
        setMessage({
          type: "error",
          text: json.error || "未授权，请先登录管理后台后再试。",
        });
        return;
      }

      if (!json.ok || !json.data) {
        setMessage({
          type: "error",
          text: json.error || "翻译失败，请稍后重试。",
        });
        return;
      }

      const patch =
        section === "cases"
          ? applyCaseTranslatePatch(json.data ?? {})
          : (json.data ?? {});

      setDrafts((prev) => setDraft(prev, id, patch));
      setDirtyIds((prev) => new Set(prev).add(id));
      setMessage({ type: "ok", text: "中英内容已互转并填充，记得保存并发布。" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "翻译失败";
      setMessage({
        type: "error",
        text: /JSON|Unexpected token|Failed to fetch/i.test(msg)
          ? `翻译请求失败：${msg}。请检查是否已登录，以及生产环境 DEEPSEEK_API_KEY 是否已配置。`
          : msg,
      });
    } finally {
      setTranslatingId(null);
    }
  }

  if (!tokenReady) {
    return (
      <AdminBanner variant="warn">
        <p className="font-medium mb-2">需要配置 Strapi API Token 才能在此直接编辑</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-amber-200/80">
          <li>打开 Strapi → Settings → API Tokens → Create new API Token</li>
          <li>
            Token type 选 <strong>Full access</strong>
          </li>
          <li>
            复制 Token 到 <code className="text-brand-gold">.env.local</code>：<br />
            <code>STRAPI_API_TOKEN=你的token</code>
          </li>
          <li>重启网站预览（npm run preview:quick）</li>
        </ol>
      </AdminBanner>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw size={14} className="animate-spin" />
        加载内容中…
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {message ? (
        <AdminBanner variant={message.type === "ok" ? "ok" : "error"}>{message.text}</AdminBanner>
      ) : null}

      {showHint ? (
        <AdminBanner variant="warn">
          <div className="flex items-start justify-between gap-3">
            <p>修改后点击「保存并发布」即可同步官网，约 1 分钟内生效。</p>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("dbsource-admin-hint", "hidden");
                setShowHint(false);
              }}
              className="shrink-0 text-amber-200/60 hover:text-white"
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        </AdminBanner>
      ) : null}

      {section !== "contact" ? (
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className={cn(inputClass, "pl-9")}
              placeholder="搜索条目名称、型号…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {section === "leads" ? (
            <div className="flex items-center gap-2">
              <select
                className={cn(inputClass, "h-9 py-1 text-xs w-[130px]")}
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                {LEAD_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setLeadPriorityOnly((prev) => !prev)}
                className={cn(
                  "text-xs px-3 py-2 rounded-lg border transition-colors",
                  leadPriorityOnly
                    ? "border-brand-gold/50 text-brand-gold bg-brand-gold/10"
                    : "border-white/15 text-gray-400 hover:text-white"
                )}
              >
                仅看高意向
              </button>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {filteredRows.length}/{rows.length} 条
            </span>
            {previewHref ? (
              <Link
                href={previewHref}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
              >
                <Eye size={14} />
                预览页面
                <ExternalLink size={10} />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              刷新
            </button>
            {CREATABLE_SECTIONS.has(section) ? (
              <button
                type="button"
                onClick={createRow}
                disabled={savingId === "new"}
                className="text-sm px-4 py-2 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-40"
              >
                {savingId === "new" ? "创建中…" : "+ 新增"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {section === "products" && duplicateProductSortOrders.length > 0 ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200 space-y-1">
          <p>检测到产品排序号重复，请先修复，否则排序交换可能失败：</p>
          {duplicateProductSortOrders.map((item) => (
            <p key={item.sortOrder} className="font-mono text-xs">
              #{item.sortOrder} 被 {item.count} 个产品使用
            </p>
          ))}
        </div>
      ) : null}

      {section === "products" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-200">产品系列管理</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                用于控制产品页系列筛选、顶部产品下拉和后台产品编辑中的系列名称、排序与显示状态。
                仅管理固定七项（la / lw / mi / do / sol / k / re）；固定系列禁止真删除，请用「显示」开关隐藏。
              </p>
            </div>
            <div className="relative shrink-0">
              {missingManagedSlugs.length === 0 ? (
                <button
                  type="button"
                  disabled
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-600 cursor-not-allowed"
                  title="固定七项系列已存在，不允许新增陌生 slug"
                >
                  固定系列已完整
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={Boolean(savingSeriesSlug)}
                    onClick={() => setShowAddSeriesMenu((open) => !open)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-40"
                  >
                    {savingSeriesSlug ? "补齐中…" : "增加系列"}
                  </button>
                  {showAddSeriesMenu ? (
                    <div className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-white/15 bg-zinc-950/95 shadow-lg p-1">
                      <p className="px-2 py-1.5 text-[10px] text-gray-500">仅可补齐缺失的固定系列</p>
                      {missingManagedSlugs.map((slug) => {
                        const seed = getManagedSeriesSeedPayload(slug);
                        return (
                          <button
                            key={slug}
                            type="button"
                            disabled={savingSeriesSlug === slug}
                            onClick={() => fillMissingManagedSeries(slug)}
                            className="w-full text-left text-xs px-2.5 py-2 rounded-lg text-gray-200 hover:bg-white/10 disabled:opacity-40"
                          >
                            补齐 {seed.nameZh || slug.toUpperCase()}
                            <span className="ml-1 font-mono text-[10px] text-gray-500">({slug})</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="py-2 pr-2 font-medium">排序</th>
                  <th className="py-2 pr-2 font-medium">系列 key</th>
                  <th className="py-2 pr-2 font-medium">中文名称</th>
                  <th className="py-2 pr-2 font-medium">英文名称</th>
                  <th className="py-2 pr-2 font-medium">显示</th>
                  <th className="py-2 pr-2 font-medium">产品数</th>
                  <th className="py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {managedSeriesRows.map((row) => {
                  const draft = managedSeriesDrafts[row.slug] ?? row;
                  const usage = countProductsUsingSeries(row.slug);
                  return (
                    <tr key={row.slug} className="border-b border-white/5 align-top">
                      <td className="py-2 pr-2">
                        <input
                          className={cn(inputClass, "w-16")}
                          type="number"
                          value={draft.sortOrder}
                          onChange={(e) =>
                            setManagedSeriesDrafts((prev) => ({
                              ...prev,
                              [row.slug]: {
                                ...draft,
                                sortOrder: Number(e.target.value) || 0,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <code className="text-brand-gold/90">{row.slug}</code>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className={inputClass}
                          value={draft.nameZh}
                          onChange={(e) =>
                            setManagedSeriesDrafts((prev) => ({
                              ...prev,
                              [row.slug]: { ...draft, nameZh: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className={inputClass}
                          value={draft.nameEn}
                          onChange={(e) =>
                            setManagedSeriesDrafts((prev) => ({
                              ...prev,
                              [row.slug]: { ...draft, nameEn: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <label className="inline-flex items-center gap-2 text-gray-300">
                          <input
                            type="checkbox"
                            checked={draft.visible}
                            onChange={(e) =>
                              setManagedSeriesDrafts((prev) => ({
                                ...prev,
                                [row.slug]: { ...draft, visible: e.target.checked },
                              }))
                            }
                          />
                          {draft.visible ? "显示" : "隐藏"}
                        </label>
                      </td>
                      <td className="py-2 pr-2 font-mono text-gray-400">{usage}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            disabled={savingSeriesSlug === row.slug}
                            onClick={() => saveManagedSeries(row.slug)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-40"
                          >
                            {savingSeriesSlug === row.slug ? "保存中…" : "保存"}
                          </button>
                          <button
                            type="button"
                            disabled={savingSeriesSlug === row.slug}
                            onClick={() => deleteManagedSeries(row.slug)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-400/35 text-red-300/90 hover:bg-red-500/10 disabled:opacity-40"
                            title={
                              usage > 0
                                ? `仍有 ${usage} 个产品占用`
                                : isProductSeriesDisplayKey(row.slug)
                                  ? "固定系列，请优先隐藏"
                                  : "删除系列配置"
                            }
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {missingManagedSlugs.length === 0 ? (
            <p className="text-[11px] text-gray-600">当前固定系列已完整，不支持新增陌生 slug。</p>
          ) : (
            <p className="text-[11px] text-amber-200/70">
              检测到缺失 {missingManagedSlugs.length} 项固定系列，请使用右上角「增加系列」补齐。
            </p>
          )}
        </div>
      ) : null}

      {section === "products" && productCatalogTabCounts ? (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-500">
            筛选与前台一致：工程系列 / 流动演出由产品系列配置决定；下方为工程子系列 Tab。
          </p>
          <div className="flex flex-wrap gap-2">
            {adminProductCatalogTabs.map((tab) => {
              const active = productCatalogFilter === tab.id;
              const count = productCatalogTabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProductCatalogFilter(tab.id)}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg border transition-colors",
                    active
                      ? "border-brand-gold/50 text-brand-gold bg-brand-gold/10"
                      : "border-white/15 text-gray-400 hover:text-white hover:border-white/30"
                  )}
                >
                  {tab.label}
                  <span className="ml-1.5 font-mono text-[10px] opacity-80">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {section === "contact" && contactDraft ? (
        <div className="space-y-4 min-w-0 max-w-full overflow-hidden">
          {contactLoadError ? (
            <AdminBanner variant="warn">
              <p>{contactLoadError}</p>
            </AdminBanner>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4 min-w-0">
            <h3 className="font-medium">联系方式</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="公司名（中文）">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "companyZh")}
                  onChange={(e) => setContactDraft({ ...contactDraft, companyZh: e.target.value })}
                />
              </Field>
              <Field label="公司名（英文）">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "companyEn")}
                  onChange={(e) => setContactDraft({ ...contactDraft, companyEn: e.target.value })}
                />
              </Field>
              <Field label="电话（每行一个）">
                <textarea
                  className={cn(inputClass, "min-h-[80px]")}
                  value={getText(contactDraft, "phones")}
                  onChange={(e) => setContactDraft({ ...contactDraft, phones: e.target.value })}
                />
              </Field>
              <Field label="邮箱">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "email")}
                  onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })}
                />
              </Field>
              <Field label="地址（中文）">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "addressZh")}
                  onChange={(e) => setContactDraft({ ...contactDraft, addressZh: e.target.value })}
                />
              </Field>
              <Field label="地址（英文）">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "addressEn")}
                  onChange={(e) => setContactDraft({ ...contactDraft, addressEn: e.target.value })}
                />
              </Field>
              <Field label="页脚简介（中文）" className="sm:col-span-2">
                <textarea
                  className={cn(inputClass, "min-h-[80px]")}
                  value={getText(contactDraft, "footerIntroZh")}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, footerIntroZh: e.target.value })
                  }
                />
              </Field>
              <Field label="页脚简介（英文）" className="sm:col-span-2">
                <textarea
                  className={cn(inputClass, "min-h-[80px]")}
                  value={getText(contactDraft, "footerIntroEn")}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, footerIntroEn: e.target.value })
                  }
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4 min-w-0">
            <h3 className="font-medium">地图设置</h3>
            <p className="text-xs text-gray-500">
              配置联系页右侧地图区域。填写 iframe URL 时嵌入地图；未填写时在地图区显示地址与「打开地图导航」按钮（左侧公司卡片仅显示地址）。
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="地图展示地址（中文） mapDisplayAddressZh">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "mapDisplayAddressZh")}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, mapDisplayAddressZh: e.target.value })
                  }
                  placeholder="留空则使用地址（中文）"
                />
              </Field>
              <Field label="地图展示地址（英文） mapDisplayAddressEn">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "mapDisplayAddressEn")}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, mapDisplayAddressEn: e.target.value })
                  }
                  placeholder="留空则使用地址（英文）"
                />
              </Field>
              <Field label="地图定位关键词 mapQuery" className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={getText(contactDraft, "mapQuery")}
                  onChange={(e) => setContactDraft({ ...contactDraft, mapQuery: e.target.value })}
                  placeholder="东莞新声电子科技有限公司"
                />
                <FieldHint>
                  可填写经纬度：113.xxx,23.xxx，或公司地址，用于自动生成导航链接。
                </FieldHint>
              </Field>
              <Field label="高德 iframe URL mapEmbedUrl" className="sm:col-span-2">
                <textarea
                  className={cn(inputClass, "min-h-[88px] font-mono text-xs break-all")}
                  value={getText(contactDraft, "mapEmbedUrl")}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, mapEmbedUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
                <FieldHint>
                  请填写高德地图可嵌入链接；如果不填写，前台会显示地址和导航按钮。
                </FieldHint>
              </Field>
              <Field label="高德导航链接 mapNavUrl" className="sm:col-span-2">
                <input
                  className={cn(inputClass, "break-all")}
                  value={getText(contactDraft, "mapNavUrl")}
                  onChange={(e) => setContactDraft({ ...contactDraft, mapNavUrl: e.target.value })}
                  placeholder="https://uri.amap.com/..."
                />
                <FieldHint>
                  建议填写高德 URI API 导航链接，例如
                  https://uri.amap.com/navigation?...；不要直接填写高德网页版地址，否则可能出现登录或验证。
                </FieldHint>
              </Field>
            </div>
          </div>

          <SaveButton
            saving={savingId === "contact"}
            onClick={saveContact}
            label="保存联系与地图设置"
          />

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">销售顾问二维码</h3>
                <p className="text-xs text-gray-500 mt-1">
                  管理联系页底部销售顾问微信码。与页脚「关注我们」社交二维码（/admin/qr）分开维护。
                </p>
              </div>
              <button
                type="button"
                onClick={addSalesContact}
                disabled={savingId === "sales-new"}
                className="text-xs px-3 py-2 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50"
              >
                {savingId === "sales-new" ? "新增中…" : "新增销售顾问"}
              </button>
            </div>

            {salesContactLoadError ? (
              <AdminBanner variant="warn">
                <p>{salesContactLoadError}</p>
              </AdminBanner>
            ) : null}

            {salesContactRows.length === 0 ? (
              <p className="text-sm text-gray-500">暂无销售顾问。点击「新增销售顾问」开始配置。</p>
            ) : (
              <div className="space-y-3">
                {salesContactRows.map((row) => {
                  const id = docId(row);
                  const draft = salesContactDrafts[id] ?? row;
                  const isOpen = salesContactOpenId === id;
                  const enabled = draft.enabled !== false;
                  const title = getText(draft, "nameZh") || "未命名销售顾问";

                  return (
                    <div
                      key={id}
                      className={cn(
                        "rounded-xl border overflow-hidden",
                        isOpen ? "border-brand-gold/25 bg-white/[0.02]" : "border-white/10"
                      )}
                    >
                      <div className="w-full flex items-center gap-2 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSalesContactOpenId(isOpen ? null : id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{title}</span>
                            <span
                              className={cn(
                                "shrink-0 text-[10px] px-1.5 py-0.5 rounded",
                                enabled
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-gray-500/20 text-gray-400"
                              )}
                            >
                              {enabled ? "启用" : "禁用"}
                            </span>
                            <span className="shrink-0 text-[10px] text-gray-500 font-mono">
                              #{String(draft.sortOrder ?? "")}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {getText(draft, "phone") || "未填写手机号"}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSalesContactOpenId(isOpen ? null : id)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                          aria-label={isOpen ? "收起" : "展开"}
                        >
                          <ChevronDown
                            size={18}
                            className={cn("transition-transform", isOpen && "rotate-180")}
                          />
                        </button>
                      </div>

                      {isOpen ? (
                        <div className="px-4 pb-4 space-y-4 border-t border-white/10">
                          <div className="grid sm:grid-cols-2 gap-4 pt-4">
                            <Field label="中文姓名 nameZh">
                              <input
                                className={inputClass}
                                value={getText(draft, "nameZh")}
                                onChange={(e) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, nameZh: e.target.value },
                                  }))
                                }
                              />
                            </Field>
                            <Field label="英文姓名 nameEn">
                              <input
                                className={inputClass}
                                value={getText(draft, "nameEn")}
                                onChange={(e) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, nameEn: e.target.value },
                                  }))
                                }
                              />
                            </Field>
                            <Field label="中文职位 titleZh">
                              <input
                                className={inputClass}
                                value={getText(draft, "titleZh")}
                                onChange={(e) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, titleZh: e.target.value },
                                  }))
                                }
                              />
                            </Field>
                            <Field label="英文职位 titleEn">
                              <input
                                className={inputClass}
                                value={getText(draft, "titleEn")}
                                onChange={(e) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, titleEn: e.target.value },
                                  }))
                                }
                              />
                            </Field>
                            <Field label="手机号 phone" className="sm:col-span-2">
                              <textarea
                                className={cn(inputClass, "min-h-[72px]")}
                                value={getText(draft, "phone")}
                                onChange={(e) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, phone: e.target.value },
                                  }))
                                }
                                placeholder="每行一个，或用逗号、分号分隔"
                              />
                            </Field>
                            <Field label="微信号 wechatId">
                              <input
                                className={inputClass}
                                value={getText(draft, "wechatId")}
                                onChange={(e) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, wechatId: e.target.value },
                                  }))
                                }
                              />
                            </Field>
                            <Field label="排序 sortOrder">
                              <input
                                type="number"
                                className={inputClass}
                                value={String(draft.sortOrder ?? "")}
                                onChange={(e) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: {
                                      ...draft,
                                      sortOrder: Number(e.target.value) || 0,
                                    },
                                  }))
                                }
                              />
                            </Field>
                            <SelectField
                              label="是否启用 enabled"
                              value={enabled ? "true" : "false"}
                              onChange={(v) =>
                                setSalesContactDrafts((prev) => ({
                                  ...prev,
                                  [id]: { ...draft, enabled: v === "true" },
                                }))
                              }
                              options={[
                                { value: "true", label: "启用（前台显示）" },
                                { value: "false", label: "禁用（前台隐藏）" },
                              ]}
                            />
                            <div className="sm:col-span-2">
                              <ImageUploadField
                                label="二维码图片 qrImage"
                                currentUrl={mediaUrl(draft.qrImage as StrapiMedia)}
                                currentMedia={draft.qrImage as StrapiMedia}
                                onUploaded={(mediaId, url) =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, qrImage: { id: mediaId, url } },
                                  }))
                                }
                                onRemoved={() =>
                                  setSalesContactDrafts((prev) => ({
                                    ...prev,
                                    [id]: { ...draft, qrImage: null },
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                            <SaveButton
                              saving={savingId === `sales-${id}`}
                              onClick={() => saveSalesContactRow(id)}
                              label="保存销售顾问"
                            />
                            <button
                              type="button"
                              onClick={() => deleteSalesContactRow(id)}
                              disabled={savingId === `sales-delete-${id}`}
                              className="w-full sm:w-auto min-h-[44px] text-xs px-4 py-2 rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              {savingId === `sales-delete-${id}` ? "删除中…" : "删除"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {leads.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 pt-6">
              <h3 className="font-medium mb-3">最近询盘（只读）</h3>
              <div className="space-y-2 text-sm text-gray-400">
                {leads.slice(0, 10).map((l) => (
                  <div key={docId(l)} className="rounded-lg border border-white/5 px-3 py-2">
                    <span className="text-white">{getText(l, "name")}</span>
                    {" · "}
                    {getText(l, "phone") || getText(l, "email")}
                    <p className="text-xs mt-1 line-clamp-2">{getText(l, "message")}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {section !== "contact"
        ? (() => {
            const renderRow = (row: StrapiRow, _rowIndex?: number) => {
              const id = docId(row);
              const draft = drafts[id] ?? row;
              const isOpen = openId === id;
              const title = section === "products" ? productRowTitle(draft) : rowTitle(draft);
              const subtitle = rowSubtitle(section, draft, productSeriesConfig);
              const isDirty = dirtyIds.has(id);
              const savedSortOrder = Number(row.sortOrder);
              const productSortLabel =
                section === "products" && Number.isInteger(savedSortOrder) && savedSortOrder > 0
                  ? `#${savedSortOrder}`
                  : null;
              const globalIndex =
                section === "products"
                  ? sortedAllProducts.findIndex((item) => docId(item) === id)
                  : -1;
              const canMoveUp = section === "products" ? globalIndex > 0 : true;
              const canMoveDown =
                section === "products"
                  ? globalIndex >= 0 && globalIndex < sortedAllProducts.length - 1
                  : true;
              const productSortSaving = savingId === `product-sort-${id}`;
              const isHighlighted = highlightedRowId === id;
              const sortDraftValue =
                productSortDrafts[id] ??
                String(
                  Number.isInteger(savedSortOrder) && savedSortOrder > 0
                    ? savedSortOrder
                    : draft.sortOrder ?? ""
                );

              return (
                <div
                  key={id}
                  id={`admin-row-${id}`}
                  className={cn(
                    "rounded-2xl border overflow-hidden transition-colors",
                    isHighlighted
                      ? "border-brand-gold/60 bg-brand-gold/[0.08] ring-1 ring-brand-gold/25"
                      : isOpen
                        ? "border-brand-gold/25 bg-white/[0.02]"
                        : "border-white/10"
                  )}
                >
                  <div className="w-full flex items-center gap-2 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{title}</span>
                        {isHighlighted ? (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold">
                            刚刚创建
                          </span>
                        ) : null}
                        {section === "products" ? (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                            {getAdminProductMajorCategory(draft, productSeriesConfig).label}
                          </span>
                        ) : null}
                        {productSortLabel ? (
                          <span className="shrink-0 text-[10px] text-gray-500 font-mono">
                            {productSortLabel}
                          </span>
                        ) : null}
                        {isDirty ? (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            未保存
                          </span>
                        ) : null}
                      </div>
                      {subtitle ? (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
                      ) : null}
                      {section === "products" && productSortLabel ? (
                        <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                          前台链接 /products/{savedSortOrder}
                        </p>
                      ) : null}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      {section === "cases" ? (
                        <>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                            onClick={() => moveCaseRow(id, "up")}
                            title="上移"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                            onClick={() => moveCaseRow(id, "down")}
                            title="下移"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </>
                      ) : null}
                      {section === "products" ? (
                        <>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:pointer-events-none"
                            onClick={() => moveProductRow(id, "up")}
                            disabled={!canMoveUp || productSortSaving}
                            title="上移（全站相邻交换并立即保存）"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:pointer-events-none"
                            onClick={() => moveProductRow(id, "down")}
                            disabled={!canMoveDown || productSortSaving}
                            title="下移（全站相邻交换并立即保存）"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            className="w-16 h-7 rounded border border-white/10 bg-black/40 px-1.5 text-xs text-white font-mono"
                            value={sortDraftValue}
                            disabled={productSortSaving}
                            onChange={(e) =>
                              setProductSortDrafts((prev) => ({
                                ...prev,
                                [id]: e.target.value,
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            title="目标排序号"
                          />
                          <button
                            type="button"
                            className="h-7 px-2 inline-flex items-center justify-center rounded border border-white/15 text-[11px] text-white/80 hover:text-white hover:border-white/30 disabled:opacity-40"
                            onClick={() => applyProductSortOrder(id)}
                            disabled={productSortSaving}
                            title="应用排序并立即保存到 CMS"
                          >
                            {productSortSaving ? "…" : "应用"}
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : id)}
                        className="h-7 w-7 inline-flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                        aria-label={isOpen ? "收起" : "展开"}
                      >
                        <ChevronDown
                          size={18}
                          className={cn(
                            "text-gray-500 shrink-0 transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                      {renderFields(section, draft, (patch) => {
                        setDrafts((d) => setDraft(d, id, patch));
                        setDirtyIds((prev) => new Set(prev).add(id));
                      }, productSeriesConfig)}
                      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 pt-2 pb-1 bg-zinc-950/90 backdrop-blur-sm border-t border-white/5 -mx-5 px-5">
                        {section === "cases" || section === "products" ? (
                          <button
                            type="button"
                            onClick={() => requestTranslateBilingualRow(id)}
                            disabled={translatingId === id || savingId === id}
                            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-brand-gold/35 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-40"
                          >
                            {translatingId === id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Languages size={14} />
                            )}
                            中英互转填充（可覆盖）
                          </button>
                        ) : null}
                        <SaveButton
                          saving={
                            savingId === id ||
                            (section === "leads" && savingId === `lead-delete-${id}`)
                          }
                          onClick={() => saveRow(id)}
                          label="保存并发布"
                        />
                        {section === "leads" ? (
                          <LeadDeleteButton
                            deleting={savingId === `lead-delete-${id}`}
                            disabled={savingId === id}
                            onClick={() => deleteLeadRow(id)}
                          />
                        ) : null}
                        {CREATABLE_SECTIONS.has(section) ? (
                          <button
                            type="button"
                            onClick={() => deleteRow(id)}
                            className="text-sm px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
                          >
                            删除
                          </button>
                        ) : null}
                        {previewHref && section === "downloads" ? (
                          <Link
                            href={`${previewHref}?file=${draft.sortOrder ?? ""}`}
                            target="_blank"
                            className="text-xs text-gray-500 hover:text-brand-gold ml-auto"
                          >
                            在官网查看此条目 →
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            };

            if (section !== "cases") {
              return filteredRows.map(renderRow);
            }

            const engineeringRows = filteredRows
              .filter((row) => {
                const draft = drafts[docId(row)] ?? row;
                return (getText(draft, "type") || "engineering") === "engineering";
              })
              .sort((a, b) => compareCaseRows(drafts[docId(a)] ?? a, drafts[docId(b)] ?? b));
            const performanceRows = filteredRows
              .filter((row) => {
                const draft = drafts[docId(row)] ?? row;
                return getText(draft, "type") === "performance";
              })
              .sort((a, b) => compareCaseRows(drafts[docId(a)] ?? a, drafts[docId(b)] ?? b));

            return (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">工程案例</p>
                  <div className="space-y-3">{engineeringRows.map(renderRow)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">演出案例</p>
                  <div className="space-y-3">{performanceRows.map(renderRow)}</div>
                </div>
              </div>
            );
          })()
        : null}

      {section !== "contact" && rows.length > 0 && filteredRows.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">没有匹配的条目，请换个关键词</p>
      ) : null}
    </div>

    {translateConfirmId ? (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="translate-overwrite-title"
      >
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <h3 id="translate-overwrite-title" className="text-base font-medium text-white">
            已有英文内容，是否覆盖？
          </h3>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            确认后将用翻译结果覆盖当前英文字段；取消则保留原英文。未保存前仍可手动修改，保存并发布后才会写入
            CMS。
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setTranslateConfirmId(null)}
              className="text-sm px-4 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-white/30"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                const id = translateConfirmId;
                setTranslateConfirmId(null);
                if (id) void executeTranslateBilingualRow(id);
              }}
              className="text-sm px-4 py-2 rounded-lg border border-brand-gold/35 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20"
            >
              确认覆盖
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}

function renderFields(
  section: string,
  draft: StrapiRow,
  onChange: (patch: Partial<StrapiRow>) => void,
  productSeriesConfig: ProductSeriesConfig = DEFAULT_PRODUCT_SERIES_CONFIG
) {
  const fields: React.ReactNode[] = [];

  const textField = (key: string, label: string, multiline = false) => (
    <Field key={key} label={label}>
      {multiline ? (
        <textarea
          className={cn(inputClass, "min-h-[72px]")}
          value={getText(draft, key)}
          onChange={(e) => onChange({ [key]: e.target.value })}
        />
      ) : (
        <input
          className={inputClass}
          value={getText(draft, key)}
          onChange={(e) => onChange({ [key]: e.target.value })}
        />
      )}
    </Field>
  );

  if (section === "products") {
    const seriesSelection = resolveAdminSeriesSelection(draft, productSeriesConfig);
    const seriesOptions = getAdminProductSeriesSelectOptions(productSeriesConfig);
    const seriesSelectValue = getAdminSeriesSelectValue(draft, productSeriesConfig);
    const seriesBadgeZh = getText(draft, "seriesZh");
    const seriesBadgeEn = getText(draft, "seriesEn");
    const productLineRaw = getText(draft, "productLine");
    const seriesInStandardList = seriesOptions.some((o) => o.value === productLineRaw);
    const seriesSelectOptions = seriesInStandardList
      ? seriesOptions.map(({ value, label }) => ({ value, label }))
      : [
          {
            value: productLineRaw || "__unknown",
            label: `未知系列（${productLineRaw || "空"}）`,
          },
          ...seriesOptions.map(({ value, label }) => ({ value, label })),
        ];

    const sectionCard = (title: string, children: React.ReactNode) => (
      <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <h4 className="text-sm font-medium text-gray-200">{title}</h4>
        <div className="grid sm:grid-cols-2 gap-4">{children}</div>
      </div>
    );

    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {sectionCard(
          "基础信息",
          <>
            <Field key="model" label="产品型号">
              <input
                className={inputClass}
                value={getText(draft, "model")}
                onChange={(e) => onChange({ model: e.target.value })}
              />
              <FieldHint>前台列表、详情与导航标题均显示此型号。</FieldHint>
            </Field>
            {textField("nameZh", "产品名称（中文）")}
            {textField("nameEn", "产品名称（英文）")}
            <p className="sm:col-span-2 text-[11px] text-white/40 -mt-2">
              名称为 CMS 存档字段（唯一编辑入口）；保存时若为空则自动沿用型号。
            </p>
            <div className="sm:col-span-2">
              <SelectField
                key="productSeries"
                label="产品系列"
                value={seriesInStandardList ? seriesSelectValue : productLineRaw || "__unknown"}
                options={seriesSelectOptions}
                onChange={(v) => {
                  if (!isProductSeriesDisplayKey(v)) return;
                  onChange(getAdminProductSeriesPatch(v, productSeriesConfig));
                }}
              />
              <FieldHint>
                唯一系列编辑入口：选择后自动写入 productLine / seriesZh / seriesEn（不可手填）
                {seriesBadgeZh || seriesBadgeEn
                  ? `；当前：${[seriesBadgeZh, seriesBadgeEn].filter(Boolean).join(" / ")}`
                  : ""}
                。
              </FieldHint>
              {!seriesInStandardList || seriesSelection.category === "other" ? (
                <p className="mt-2 text-[11px] text-amber-200/80 leading-relaxed">
                  当前 productLine（{productLineRaw || "空"}）不在标准七项内。请重新选择「产品系列」后保存并发布。
                </p>
              ) : null}
            </div>
            <SelectField
              key="market"
              label="市场标签"
              value={getText(draft, "market") || "all"}
              onChange={(v) => onChange({ market: v })}
              options={[
                { value: "all", label: "全部市场" },
                { value: "cn", label: "仅中国站" },
                { value: "global", label: "仅海外站" },
              ]}
            />
            <p className="sm:col-span-2 text-[11px] text-white/40 leading-relaxed">
              所有内容变更请统一点击底部「保存并发布」。列表右侧「应用」仅用于调整排序号。
            </p>
          </>
        )}

        {sectionCard(
          "产品介绍",
          <>
            {textField("descZh", "简介（中文）", true)}
            {textField("descEn", "简介（英文）", true)}
            {textField("detailZh", "详情 / 适用范围（中文）", true)}
            {textField("detailEn", "详情 / 适用范围（英文）", true)}
            <p className="sm:col-span-2 text-[11px] text-gray-500">
              简介用于列表与卡片摘要；详情用于产品页正文。
            </p>
          </>
        )}

        <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-200">技术规格</h4>
          {(() => {
            const resolvedSpecs = resolveAdminProductSpecs({
              specsZh: getText(draft, "specsZh"),
              specsEn: getText(draft, "specsEn"),
              model: getText(draft, "model"),
              productLine: getText(draft, "productLine"),
            });
            return (
              <ProductSpecsEditor
                specsZh={resolvedSpecs.specsZh}
                specsEn={resolvedSpecs.specsEn}
                source={resolvedSpecs.source}
                onChange={(patch) => onChange(patch)}
              />
            );
          })()}
          <PdfSpecImportField
            modelHint={getText(draft, "model")}
            currentSpecsZh={getText(draft, "specsZh")}
            currentSpecsEn={getText(draft, "specsEn")}
            onExtract={(data) =>
              onChange({
                specsZh: data.specsZh,
                specsEn: data.specsEn,
                descZh: data.descZh ?? getText(draft, "descZh"),
                descEn: data.descEn ?? getText(draft, "descEn"),
              })
            }
          />
        </div>

        {sectionCard(
          "产品图片",
          <>
            <ImageUploadField
              key="image"
              label="封面图"
              currentUrl={mediaUrl(draft.image as StrapiMedia)}
              onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
              onRemoved={() => onChange({ image: null })}
            />
            <div className="sm:col-span-2">
              <GalleryUploadField
                label="产品图集"
                items={(draft.gallery as StrapiMedia[]) ?? []}
                onChange={(gallery) => onChange({ gallery })}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  if (section === "cases") {
    const legacyId = Number(draft.legacyId);
    const detailPath =
      Number.isInteger(legacyId) && legacyId > 0 ? `/cases/${legacyId}` : null;

    const sectionCard = (title: string, children: React.ReactNode) => (
      <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <h4 className="text-sm font-medium text-gray-200">{title}</h4>
        <div className="grid sm:grid-cols-2 gap-4">{children}</div>
      </div>
    );

    const overviewField = (lang: "zh" | "en") => {
      const detailKey = lang === "zh" ? "detailZh" : "detailEn";
      const descKey = lang === "zh" ? "descZh" : "descEn";
      const value = getCaseOverviewDisplay(draft, lang);

      return (
        <Field key={detailKey} label={`项目概述（${lang === "zh" ? "中文" : "英文"}）`}>
          <textarea
            className={cn(inputClass, "min-h-[140px]")}
            value={value}
            onChange={(e) => {
              const next = e.target.value;
              onChange({ [detailKey]: next, [descKey]: next });
            }}
            placeholder={lang === "zh" ? "案例项目概述，同步至前台「项目概述」区块" : "Project overview (EN)"}
          />
        </Field>
      );
    };

    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {sectionCard(
          "基础信息",
          <>
            {textField("titleZh", "标题（中文）")}
            {textField("titleEn", "标题（英文）")}
            <SelectField
              key="type"
              label="案例类型"
              value={getText(draft, "type") || "engineering"}
              onChange={(v) => onChange({ type: v })}
              options={[
                { value: "engineering", label: "工程案例" },
                { value: "performance", label: "演出案例" },
              ]}
            />
            <SelectField
              key="market"
              label="市场标签"
              value={getText(draft, "market") || "all"}
              onChange={(v) => onChange({ market: v })}
              options={[
                { value: "all", label: "全部市场" },
                { value: "cn", label: "仅中国站" },
                { value: "global", label: "仅海外站" },
              ]}
            />
            <Field key="sortOrder" label="排序（同类型内数字越小越靠前）">
              <input
                type="number"
                className={inputClass}
                value={String(draft.sortOrder ?? "")}
                onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })}
              />
            </Field>
            <ReadOnlyField
              key="legacyId"
              label="案例 ID（前台 URL，不可修改）"
              value={Number.isInteger(legacyId) && legacyId > 0 ? String(legacyId) : "—"}
              hint={detailPath ? `前台链接 ${detailPath}` : undefined}
            />
          </>
        )}

        {sectionCard(
          "项目概述",
          <>
            {overviewField("zh")}
            {overviewField("en")}
            <p className="sm:col-span-2 text-[11px] text-gray-500 leading-relaxed">
              保存并发布后将同步至案例详情页「项目概述」与列表摘要；原有场景/设备字段保留在 CMS，不在此编辑。
            </p>
          </>
        )}

        {sectionCard(
          "案例图片",
          <>
            <ImageUploadField
              key="image"
              label="封面图"
              currentUrl={mediaUrl(draft.image as StrapiMedia)}
              onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
              onRemoved={() => onChange({ image: null })}
            />
            <div className="sm:col-span-2">
              <GalleryUploadField
                label="案例图集"
                items={(draft.gallery as StrapiMedia[]) ?? []}
                onChange={(gallery) => onChange({ gallery })}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  if (section === "leads") {
    fields.push(<ReadOnlyField key="name" label="联系人" value={getText(draft, "name")} />);
    fields.push(<ReadOnlyField key="company" label="公司" value={getText(draft, "company")} />);
    fields.push(
      <ReadOnlyField
        key="contact"
        label="联系方式"
        value={[getText(draft, "phone"), getText(draft, "email")].filter(Boolean).join(" / ")}
      />
    );
    fields.push(
      <SelectField
        key="status"
        label="跟进状态"
        value={getText(draft, "status") || "new"}
        onChange={(v) => onChange({ status: v })}
        options={LEAD_STATUS_OPTIONS}
      />
    );
    fields.push(
      <Field key="owner" label="负责人">
        <input
          className={inputClass}
          value={getText(draft, "owner")}
          onChange={(e) => onChange({ owner: e.target.value })}
          placeholder="例如：华南销售-张三"
        />
      </Field>
    );
    fields.push(
      <Field key="nextFollowUpAt" label="下次跟进时间">
        <input
          type="datetime-local"
          className={inputClass}
          value={getText(draft, "nextFollowUpAt")}
          onChange={(e) => onChange({ nextFollowUpAt: e.target.value || null })}
        />
      </Field>
    );
    fields.push(
      <Field key="lastContactedAt" label="最近联系时间">
        <input
          type="datetime-local"
          className={inputClass}
          value={getText(draft, "lastContactedAt")}
          onChange={(e) => onChange({ lastContactedAt: e.target.value || null })}
        />
      </Field>
    );
    fields.push(
      <Field key="lostReason" label="丢单原因">
        <textarea
          className={cn(inputClass, "min-h-[72px]")}
          value={getText(draft, "lostReason")}
          onChange={(e) => onChange({ lostReason: e.target.value })}
          placeholder="仅当状态为已丢单时填写"
        />
      </Field>
    );
    fields.push(
      <Field key="notes" label="跟进备注">
        <textarea
          className={cn(inputClass, "min-h-[72px]")}
          value={getText(draft, "notes")}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Field>
    );
    fields.push(
      <ReadOnlyField key="intentTag" label="AI 意向标签" value={getText(draft, "intentTag")} />
    );
    fields.push(
      <ReadOnlyField
        key="intentScore"
        label="AI 意向分"
        value={String(Number(draft.intentScore) || 0)}
      />
    );
    fields.push(
      <ReadOnlyField key="country" label="国家 / 地区" value={getText(draft, "country")} />
    );
    fields.push(
      <ReadOnlyField
        key="source"
        label="来源"
        value={[
          getText(draft, "utmSource"),
          getText(draft, "utmMedium"),
          getText(draft, "utmCampaign"),
        ]
          .filter(Boolean)
          .join(" / ")}
      />
    );
    fields.push(
      <Field key="message" label="询盘内容" className="sm:col-span-2">
        <textarea
          className={cn(inputClass, "min-h-[120px]")}
          value={getText(draft, "message")}
          onChange={(e) => onChange({ message: e.target.value })}
        />
      </Field>
    );
  }

  if (section === "downloads") {
    fields.push(textField("nameZh", "前台显示名称（中文）"));
    fields.push(textField("nameEn", "前台显示名称（英文）"));
    fields.push(
      <SelectField
        key="type"
        label="所属 Tab"
        value={getText(draft, "type") || "software"}
        onChange={(v) => onChange({ type: v })}
        options={[
          { value: "software", label: "软件下载" },
          { value: "catalog", label: "产品画册" },
        ]}
      />
    );
    fields.push(
      <SelectField
        key="subCategoryPreset"
        label="子分类（导航筛选）"
        value={getText(draft, "subCategoryPreset") || "v225a"}
        onChange={(v) =>
          onChange({
            subCategoryPreset: v,
            ...(v !== DOWNLOAD_SUB_CATEGORY_CUSTOM_PRESET ? { subCategoryCustom: "" } : {}),
          })
        }
        options={[
          ...DOWNLOAD_SUB_CATEGORIES.map((s) => ({
            value: s.slug,
            label: `${s.label.zh} · ${s.tab === "software" ? "软件" : "画册"}`,
          })),
          { value: DOWNLOAD_SUB_CATEGORY_CUSTOM_PRESET, label: "自定义（见下方输入框）" },
        ]}
      />
    );
    fields.push(
      <Field key="subCategoryCustom" label="自定义子分类" className="sm:col-span-2">
        <input
          className={inputClass}
          value={getText(draft, "subCategoryCustom")}
          onChange={(e) =>
            onChange({
              subCategoryCustom: e.target.value,
              subCategoryPreset: DOWNLOAD_SUB_CATEGORY_CUSTOM_PRESET,
            })
          }
          placeholder="例如：SourceLink · 软件"
        />
        <p className="text-xs text-white/45 mt-1.5">
          填写后将优先使用自定义子分类；留空则使用上方选择项。
        </p>
      </Field>
    );
    fields.push(
      <SelectField
        key="market"
        label="市场标签"
        value={getText(draft, "market") || "all"}
        onChange={(v) => onChange({ market: v })}
        options={[
          { value: "all", label: "全部市场" },
          { value: "cn", label: "仅中国站" },
          { value: "global", label: "仅海外站" },
        ]}
      />
    );
    fields.push(
      <Field key="sortOrder" label="排序 ID（分享/下载链接用此数字）">
        <input
          type="number"
          className={inputClass}
          value={String(draft.sortOrder ?? "")}
          onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })}
        />
      </Field>
    );
    fields.push(
      <div key="file-upload" className="sm:col-span-2">
        <FileUploadField
          label="下载文件（PDF / ZIP / 安装包）"
          currentUrl={mediaUrl(draft.file as StrapiMedia)}
          onUploaded={(mediaId, url, meta) =>
            onChange({
              file: { id: mediaId, url },
              fileUrl: url,
              size: meta.sizeLabel,
              fileName: meta.fileName,
            })
          }
        />
      </div>
    );
    fields.push(
      <ReadOnlyField
        key="size"
        label="文件大小"
        value={getText(draft, "size")}
        hint="上传后自动识别"
      />
    );
    fields.push(
      <ReadOnlyField
        key="fileName"
        label="用户下载时的文件名"
        value={getText(draft, "fileName")}
        hint="与上传时一致，无需手改"
      />
    );
    fields.push(textField("version", "版本号（如 2.1.0，可留空）"));
    fields.push(
      <SelectField
        key="osType"
        label="适用系统"
        value={getText(draft, "osType")}
        onChange={(v) => onChange({ osType: v || null })}
        options={[
          { value: "", label: "不显示" },
          { value: "windows", label: "Windows" },
          { value: "mac", label: "Mac" },
          { value: "cross-platform", label: "全平台" },
        ]}
      />
    );
    fields.push(
      <Field key="releasedAt" label="更新日期（可留空）">
        <input
          type="date"
          className={inputClass}
          value={getText(draft, "releasedAt")}
          onChange={(e) => onChange({ releasedAt: e.target.value || null })}
        />
      </Field>
    );
    fields.push(
      <SelectField
        key="featured"
        label="推荐下载（首屏推荐位）"
        value={draft.featured === true ? "true" : "false"}
        onChange={(v) => onChange({ featured: v === "true" })}
        options={[
          { value: "false", label: "否" },
          { value: "true", label: "是（推荐位最多展示 3 个）" },
        ]}
      />
    );
    fields.push(textField("descZh", "简介（中文，可留空用默认文案）", true));
    fields.push(textField("descEn", "简介（英文，可留空用默认文案）", true));
    fields.push(
      <ImageUploadField
        key="cover"
        label="列表封面图"
        currentUrl={mediaUrl(draft.cover as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ cover: { id: mediaId, url } })}
        onRemoved={() => onChange({ cover: null })}
      />
    );
  }

  if (section === "about") {
    fields.push(textField("sectionKey", "区块 Key（勿改）"));
    fields.push(textField("titleZh", "标题（中文）"));
    fields.push(textField("titleEn", "标题（英文）"));
    fields.push(
      <ImageUploadField
        key="image"
        label="配图"
        currentUrl={mediaUrl(draft.image as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
        onRemoved={() => onChange({ image: null })}
      />
    );
  }

  if (section === "qr") {
    fields.push(textField("labelZh", "标签（中文）"));
    fields.push(textField("labelEn", "标签（英文）"));
    fields.push(
      <ImageUploadField
        key="image"
        label="二维码图片"
        currentUrl={mediaUrl(draft.image as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
        onRemoved={() => onChange({ image: null })}
      />
    );
  }

  return <div className="grid sm:grid-cols-2 gap-4">{fields}</div>;
}
