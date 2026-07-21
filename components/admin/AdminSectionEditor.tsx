"use client";

import ProductSpecsEditor from "@/components/admin/ProductSpecsEditor";
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
  ADMIN_CATALOG_CATEGORY_LABELS,
  ADMIN_PRODUCT_CATALOG_TABS,
  ADMIN_PRODUCT_LINE_LABELS,
  compareAdminProductRows,
  countAdminProductsByCatalogFilter,
  getAdminCatalogCategory,
  getAdminCatalogCategoryPatch,
  getAdminEngineeringSeriesSelectOptions,
  getAdminProductLineLabel,
  getAdminProductMajorCategory,
  getAdminProductRowMeta,
  getAdminSeriesGroupLabel,
  matchAdminProductCatalogFilter,
  type AdminCatalogCategory,
  type AdminProductCatalogFilter,
} from "@/lib/admin-product-categories";
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
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

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

/** 工程案例：存在待翻译中文且对应英文字段已有内容时需确认覆盖 */
function caseNeedsTranslateOverwriteConfirm(draft: StrapiRow): boolean {
  return getCaseTranslatePairs(draft).some((pair) => pair.zh.trim() && pair.en.trim());
}

function getCaseOverviewDisplay(row: StrapiRow, lang: "zh" | "en"): string {
  const detailKey = lang === "zh" ? "detailZh" : "detailEn";
  const descKey = lang === "zh" ? "descZh" : "descEn";
  return getDraftText(row, detailKey) || getText(row, descKey);
}

function setDraft(drafts: Record<string, StrapiRow>, id: string, patch: Partial<StrapiRow>) {
  return { ...drafts, [id]: { ...drafts[id], ...patch } };
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

function rowSubtitle(section: string, draft: StrapiRow): string | null {
  if (section === "downloads") {
    const size = getText(draft, "size");
    const fileName = getText(draft, "fileName");
    return [size && size !== "—" ? size : null, fileName].filter(Boolean).join(" · ") || null;
  }
  if (section === "products") {
    const meta = getAdminProductRowMeta(draft);
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

function rowSearchText(section: string, draft: StrapiRow): string {
  const base = [
    rowTitle(draft),
    rowSubtitle(section, draft),
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
      getAdminProductRowMeta(draft).majorCategory.label
    );
  }

  return base.filter(Boolean).join(" ").toLowerCase();
}

const CREATABLE_SECTIONS = new Set(["products", "series", "cases", "downloads", "about", "qr"]);

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

  const previewHref = ADMIN_SECTIONS.find((s) => s.id === section)?.previewHref;

  const productCatalogTabCounts = useMemo(() => {
    if (section !== "products") return null;
    const draftsRows = rows.map((row) => drafts[docId(row)] ?? row);
    return countAdminProductsByCatalogFilter(draftsRows);
  }, [section, rows, drafts]);

  /** 全站产品按 sortOrder 升序（上移/下移邻居，不受系列 Tab 筛选影响） */
  const sortedAllProducts = useMemo(() => {
    if (section !== "products") return [];
    return [...rows].sort((a, b) => {
      const orderA = Number(a.sortOrder);
      const orderB = Number(b.sortOrder);
      const safeA = Number.isFinite(orderA) ? orderA : Number.MAX_SAFE_INTEGER;
      const safeB = Number.isFinite(orderB) ? orderB : Number.MAX_SAFE_INTEGER;
      if (safeA !== safeB) return safeA - safeB;
      return String(a.model ?? a.nameZh ?? "").localeCompare(String(b.model ?? b.nameZh ?? ""));
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
          return rowSearchText(section, draft).includes(q);
        })
      : rows;

    if (section === "products") {
      const seriesFiltered = searched.filter((row) => {
        const draft = drafts[docId(row)] ?? row;
        return matchAdminProductCatalogFilter(draft, productCatalogFilter);
      });
      return [...seriesFiltered].sort((a, b) => {
        const draftA = drafts[docId(a)] ?? a;
        const draftB = drafts[docId(b)] ?? b;
        return compareAdminProductRows(draftA, draftB);
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
    const defaults: Record<string, Record<string, unknown>> = {
      products: {
        model: "NEW-MODEL",
        nameZh: "新产品",
        nameEn: "New Product",
        descZh: "",
        descEn: "",
        productLine: "la",
        seriesGroup: "speaker",
        category: "speaker",
        market: "all",
        sortOrder: rows.length + 1,
      },
      "product-series-configs": {
        slug: `series-${Date.now()}`,
        seriesGroup: "speaker",
        nameZh: "新系列",
        nameEn: "New Series",
        modelPrefix: "XX",
        sortOrder: rows.length + 1,
        visible: true,
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
      const toast = formatSaveToast(json);
      setMessage({ type: toast.type, text: toast.text });
      const created = (json as { data?: { data?: StrapiRow } }).data?.data;
      const createdId = created ? docId(created) : null;
      load(createdId);
    } else {
      setMessage({ type: "error", text: json.error || "创建失败" });
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
    const draft = drafts[id];
    if (!draft) return;

    if (section === "cases" && caseNeedsTranslateOverwriteConfirm(draft)) {
      setTranslateConfirmId(id);
      return;
    }

    void executeTranslateBilingualRow(id);
  }

  async function executeTranslateBilingualRow(id: string) {
    if (section !== "cases" && section !== "products") return;
    const draft = drafts[id];
    if (!draft) return;

    const payloadPairs =
      section === "cases"
        ? getCaseTranslatePairs(draft)
        : (
            [
              { zhKey: "nameZh", enKey: "nameEn" },
              { zhKey: "descZh", enKey: "descEn" },
              { zhKey: "detailZh", enKey: "detailEn" },
              { zhKey: "specsZh", enKey: "specsEn" },
              { zhKey: "seriesZh", enKey: "seriesEn" },
            ] as const
          ).map((pair) => ({
            zhKey: pair.zhKey,
            enKey: pair.enKey,
            zh: getText(draft, pair.zhKey),
            en: getText(draft, pair.enKey),
          }));
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, pairs: payloadPairs }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: Record<string, string>;
      };
      if (!json.ok || !json.data) {
        setMessage({ type: "error", text: json.error || "翻译失败，请稍后重试。" });
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
      setMessage({ type: "error", text: msg });
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

      {section === "series" ? (
        <AdminBanner variant="warn">
          <p>
            导航栏与产品中心由各产品的 <code className="text-amber-100">productLine</code>{" "}
            控制（工程系列 / 流动演出）。本页「在导航显示」「推荐产品 ID」等字段
            <strong className="text-amber-100">暂不影响前台</strong>，仅作 CMS 数据保留。
          </p>
        </AdminBanner>
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

      {section === "products" && productCatalogTabCounts ? (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-500">
            筛选与前台一致：工程系列 / 流动演出由 productLine 决定；下方为工程子系列。
          </p>
          <div className="flex flex-wrap gap-2">
            {ADMIN_PRODUCT_CATALOG_TABS.map((tab) => {
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
              const title = rowTitle(draft);
              const subtitle = rowSubtitle(section, draft);
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
                    isOpen ? "border-brand-gold/25 bg-white/[0.02]" : "border-white/10"
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
                        {section === "products" ? (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                            {getAdminProductMajorCategory(draft).label}
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
                      }, {
                        onPersistSpecs: (patch) => saveRow(id, patch),
                        specsPersisting: savingId === id,
                      })}
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
            确认后将用翻译结果覆盖当前英文标题与项目概述，未保存前仍可手动修改。
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
  options?: {
    onPersistSpecs?: (patch: { specsZh: string; specsEn: string }) => void | Promise<void>;
    specsPersisting?: boolean;
  }
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
    const catalogCategory = getAdminCatalogCategory(draft);
    const isTouringCatalog = catalogCategory === "touring";
    const engineeringSeriesOptions = getAdminEngineeringSeriesSelectOptions();
    const seriesGroupRaw = getText(draft, "seriesGroup");
    const productLineRaw = getText(draft, "productLine");
    const seriesZhRaw = getText(draft, "seriesZh");
    const seriesEnRaw = getText(draft, "seriesEn");
    const sortOrderNum = Number(draft.sortOrder);
    const detailPath =
      Number.isInteger(sortOrderNum) && sortOrderNum > 0
        ? `/products/${sortOrderNum}`
        : null;

    const sectionCard = (title: string, children: React.ReactNode) => (
      <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <h4 className="text-sm font-medium text-gray-200">{title}</h4>
        <div className="grid sm:grid-cols-2 gap-4">{children}</div>
      </div>
    );

    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {sectionCard(
          "一、基础信息",
          <>
            <div className="sm:col-span-2 rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
              <p className="text-xs font-medium text-gray-300">分类预览（保存后同步前台）</p>
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-400">
                <p>
                  前台大类：
                  <span className="ml-1 text-white">
                    {ADMIN_CATALOG_CATEGORY_LABELS[catalogCategory]}
                  </span>
                </p>
                <p>
                  seriesGroup：
                  <span className="ml-1 font-mono text-white/80">
                    {seriesGroupRaw || "未设置"}
                  </span>
                  {seriesGroupRaw ? (
                    <span className="ml-1 text-white/45">
                      （{getAdminSeriesGroupLabel(seriesGroupRaw)}）
                    </span>
                  ) : null}
                </p>
                <p>
                  productLine：
                  <span className="ml-1 font-mono text-white/80">
                    {productLineRaw || "未设置"}
                  </span>
                  {productLineRaw ? (
                    <span className="ml-1 text-white/45">
                      （{getAdminProductLineLabel(productLineRaw)}）
                    </span>
                  ) : null}
                </p>
                <p>
                  系列中文名：
                  <span className="ml-1 text-white/80">{seriesZhRaw || "未设置"}</span>
                </p>
                <p>
                  系列英文名：
                  <span className="ml-1 text-white/80">{seriesEnRaw || "未设置"}</span>
                </p>
                <p>
                  sortOrder：
                  <span className="ml-1 font-mono text-white/80">
                    {draft.sortOrder != null ? String(draft.sortOrder) : "未设置"}
                  </span>
                </p>
                <p className="sm:col-span-2">
                  详情页链接：
                  {detailPath ? (
                    <a
                      href={detailPath}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 font-mono text-brand-gold hover:underline"
                    >
                      {detailPath}
                    </a>
                  ) : (
                    <span className="ml-1 text-white/45">未设置</span>
                  )}
                </p>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                请在下方选择「前台大类」与「产品系列」。保存后写入 productLine，并同步到导航栏与产品中心。
                流动演出固定 productLine = tour；工程系列请选择 LA / MI / DO 等具体系列。
              </p>
            </div>
            <SelectField
              key="catalogCategory"
              label="前台大类"
              value={catalogCategory === "touring" ? "touring" : "engineering"}
              onChange={(v) => {
                const next = v as AdminCatalogCategory;
                if (next === "other") return;
                onChange(getAdminCatalogCategoryPatch(next, draft));
              }}
              options={[
                { value: "engineering", label: ADMIN_CATALOG_CATEGORY_LABELS.engineering },
                { value: "touring", label: ADMIN_CATALOG_CATEGORY_LABELS.touring },
              ]}
            />
            {isTouringCatalog ? (
              <ReadOnlyField
                key="productLineTour"
                label="产品系列（productLine）"
                value="流动演出（tour）"
                hint="流动演出产品固定为 tour，请在系列中英文名填写具体型号展示名。"
              />
            ) : (
              <SelectField
                key="engineeringSeries"
                label="产品系列（productLine）"
                value={
                  engineeringSeriesOptions.some((o) => o.value === productLineRaw)
                    ? productLineRaw
                    : "la"
                }
                onChange={(v) => onChange({ productLine: v })}
                options={engineeringSeriesOptions}
              />
            )}
            {catalogCategory === "other" ? (
              <p className="sm:col-span-2 text-[11px] text-amber-200/80 leading-relaxed">
                当前 productLine 未归入工程 / 流动演出标准值。请选择「前台大类」与「产品系列」后保存并发布。
              </p>
            ) : null}
            {textField("model", "型号")}
            {textField("nameZh", "名称（中文）")}
            {textField("nameEn", "名称（英文）")}
            {textField("seriesZh", "系列中文名")}
            {textField("seriesEn", "系列英文名")}
            <Field key="sortOrder" label="排序号 / 详情页 ID（sortOrder）">
              <p className="text-sm text-white font-mono">
                #{String(draft.sortOrder ?? "—")}
                {detailPath ? (
                  <span className="ml-2 text-xs text-white/45 font-sans">{detailPath}</span>
                ) : null}
              </p>
              <p className="text-xs text-white/45 mt-1.5">
                请用卡片右侧「上移 / 下移 / 应用」立即保存并自动交换；勿依赖「保存并发布」改排序号。
              </p>
            </Field>
          </>
        )}

        {sectionCard(
          "二、内部字段（前台不展示）",
          <>
            <p className="sm:col-span-2 text-[11px] text-gray-500 leading-relaxed">
              以下字段保留在 CMS 中供数据统计或日后扩展；当前产品中心与导航栏不读取这些值。
            </p>
            <SelectField
              key="seriesGroup"
              label="大类 / 分组（seriesGroup）"
              value={getText(draft, "seriesGroup") || "speaker"}
              onChange={(v) => onChange({ seriesGroup: v })}
              options={[
                { value: "speaker", label: "音箱（speaker）" },
                { value: "dsp", label: "处理器（dsp）" },
                { value: "software", label: "软件（software）" },
                { value: "engineering", label: "工程（engineering）" },
              ]}
            />
            <SelectField
              key="category"
              label="数据分类（category）"
              value={getText(draft, "category") || "speaker"}
              onChange={(v) => onChange({ category: v })}
              options={[
                { value: "speaker", label: "音箱" },
                { value: "dsp", label: "处理器" },
                { value: "software", label: "软件" },
              ]}
            />
            <SelectField
              key="market"
              label="市场标签（market）"
              value={getText(draft, "market") || "all"}
              onChange={(v) => onChange({ market: v })}
              options={[
                { value: "all", label: "全部市场" },
                { value: "cn", label: "仅中国站" },
                { value: "global", label: "仅海外站" },
              ]}
            />
          </>
        )}

        {sectionCard(
          "三、产品介绍",
          <>
            {textField("descZh", "简介（中文）", true)}
            {textField("descEn", "简介（英文）", true)}
            {textField("detailZh", "详情 / 适用范围（中文）", true)}
            {textField("detailEn", "详情 / 适用范围（英文）", true)}
            <p className="sm:col-span-2 text-[11px] text-gray-500">
              适用范围暂无独立字段，请在「详情」中维护；简介用于列表与卡片摘要。
            </p>
          </>
        )}

        <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-200">四、技术规格</h4>
          <ProductSpecsEditor
            specsZh={getText(draft, "specsZh")}
            specsEn={getText(draft, "specsEn")}
            onChange={(patch) => onChange(patch)}
            onPersist={options?.onPersistSpecs}
            persisting={options?.specsPersisting}
          />
          <PdfSpecImportField
            modelHint={getText(draft, "model")}
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
          "五、产品图片",
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

  if (section === "series") {
    fields.push(textField("slug", "Slug（唯一标识，勿随意修改）"));
    fields.push(
      <Field key="seriesGroup" label="所属大类">
        <select
          className={inputClass}
          value={getText(draft, "seriesGroup") || "speaker"}
          onChange={(e) => onChange({ seriesGroup: e.target.value })}
        >
          {["speaker", "dsp", "software", "engineering"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
    );
    fields.push(textField("nameZh", "名称（中文）"));
    fields.push(textField("nameEn", "名称（英文）"));
    fields.push(textField("modelPrefix", "型号前缀"));
    fields.push(
      <Field key="sortOrder" label="排序">
        <input
          type="number"
          className={inputClass}
          value={String(draft.sortOrder ?? "")}
          onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })}
        />
      </Field>
    );
    fields.push(
      <ReadOnlyField
        key="visibleLegacy"
        label="在导航显示（遗留，暂不影响前台）"
        value={draft.visible === false ? "隐藏" : "显示"}
        hint="前台导航由产品 productLine 决定，此开关暂不生效。"
      />
    );
    fields.push(
      <ReadOnlyField
        key="featuredProductIdLegacy"
        label="推荐产品 ID（遗留，暂不影响前台）"
        value={draft.featuredProductId != null ? String(draft.featuredProductId) : "未设置"}
        hint="首页核心产品配置亦未启用；此字段暂不生效。"
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
