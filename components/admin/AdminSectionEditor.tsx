"use client";

import {
  AdminBanner,
  Field,
  ImageUploadField,
  GalleryUploadField,
  FileUploadField,
  ReadOnlyField,
  SaveButton,
  SelectField,
  inputClass,
} from "@/components/admin/AdminFields";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { DOWNLOAD_SUB_CATEGORIES } from "@/lib/downloads";
import { formatStrapiMediaSize } from "@/lib/format-bytes";
import { sectionToCollection } from "@/lib/strapi-admin";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink, Eye, RefreshCw, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type StrapiMedia = { id?: number; url?: string; size?: number };
type StrapiRow = Record<string, unknown> & {
  documentId?: string;
  id?: number;
  image?: StrapiMedia | null;
  cover?: StrapiMedia | null;
  file?: StrapiMedia | null;
  gallery?: StrapiMedia[] | null;
};

function docId(row: StrapiRow) {
  return String(row.documentId ?? row.id ?? "");
}

function mediaUrl(m?: StrapiMedia | null) {
  if (!m?.url) return undefined;
  return m.url.startsWith("http") ? m.url : `${process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337"}${m.url}`;
}

function getText(row: StrapiRow, key: string) {
  const v = row[key];
  return typeof v === "string" ? v : "";
}

function setDraft(
  drafts: Record<string, StrapiRow>,
  id: string,
  patch: Partial<StrapiRow>
) {
  return { ...drafts, [id]: { ...drafts[id], ...patch } };
}

function rowTitle(draft: StrapiRow): string {
  return (
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
  if (section === "products") return getText(draft, "model") || null;
  if (section === "cases") return getText(draft, "products") || null;
  return null;
}

function rowSearchText(section: string, draft: StrapiRow): string {
  return [
    rowTitle(draft),
    rowSubtitle(section, draft),
    getText(draft, "nameEn"),
    getText(draft, "titleEn"),
    getText(draft, "model"),
    getText(draft, "slug"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const CREATABLE_SECTIONS = new Set([
  "products",
  "series",
  "cases",
  "downloads",
  "about",
  "qr",
]);

export default function AdminSectionEditor({
  section,
  tokenReady,
}: {
  section: string;
  tokenReady: boolean;
}) {
  const collection = sectionToCollection(section);
  const [rows, setRows] = useState<StrapiRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, StrapiRow>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [contactDraft, setContactDraft] = useState<StrapiRow | null>(null);
  const [leads, setLeads] = useState<StrapiRow[]>([]);
  const [search, setSearch] = useState("");
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(true);

  const previewHref = ADMIN_SECTIONS.find((s) => s.id === section)?.previewHref;

  useEffect(() => {
    if (localStorage.getItem("dbsource-admin-hint") === "hidden") setShowHint(false);
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const draft = drafts[docId(row)] ?? row;
      return rowSearchText(section, draft).includes(q);
    });
  }, [rows, drafts, search, section]);

  const load = useCallback(async () => {
    if (!tokenReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage(null);

    if (section === "contact") {
      const [cRes, lRes] = await Promise.all([
        fetch("/api/admin/contact-info"),
        fetch("/api/admin/leads"),
      ]);
      const cJson = await cRes.json();
      const lJson = await lRes.json();
      if (cJson.ok && cJson.data?.data) {
        setContactDraft(cJson.data.data as StrapiRow);
      }
      if (lJson.ok && lJson.data?.data) {
        setLeads(lJson.data.data as StrapiRow[]);
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
        init[docId(r)] = row;
      });
      setDrafts(init);
      if (list[0]) setOpenId(docId(list[0]));
    } else {
      setMessage({ type: "error", text: json.error || "加载失败" });
    }
    setLoading(false);
  }, [collection, section, tokenReady]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveRow(id: string) {
    if (!collection || collection === "contact-info") return;
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setMessage(null);

    const payload: Record<string, unknown> = { ...draft };
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

    const res = await fetch(`/api/admin/${collection}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSavingId(null);
    if (json.ok) {
      setMessage({ type: "ok", text: "已保存并发布到网站" });
      setRows((prev) =>
        prev.map((r) => (docId(r) === id ? { ...draft, documentId: r.documentId ?? draft.documentId } : r))
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
        sceneSlug: "stadium",
        titleZh: "新案例",
        titleEn: "New Case",
        descZh: "案例简介",
        descEn: "Case summary",
        sceneZh: "体育场馆",
        sceneEn: "Stadium",
        products: "",
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
        sortOrder: rows.length + 1,
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
    const json = await res.json();
    setSavingId(null);
    if (json.ok) {
      setMessage({ type: "ok", text: "已创建，请展开编辑" });
      load();
    } else {
      setMessage({ type: "error", text: json.error || "创建失败" });
    }
  }

  async function saveContact() {
    if (!contactDraft) return;
    setSavingId("contact");
    const payload: Record<string, unknown> = { ...contactDraft };
    ["documentId", "id", "createdAt", "updatedAt", "publishedAt"].forEach((k) => delete payload[k]);

    const res = await fetch("/api/admin/contact-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSavingId(null);
    if (json.ok) {
      setMessage({ type: "ok", text: "联系方式已更新" });
    } else {
      setMessage({ type: "error", text: json.error || "保存失败" });
    }
  }

  if (!tokenReady) {
    return (
      <AdminBanner variant="warn">
        <p className="font-medium mb-2">需要配置 Strapi API Token 才能在此直接编辑</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-amber-200/80">
          <li>打开 Strapi → Settings → API Tokens → Create new API Token</li>
          <li>Token type 选 <strong>Full access</strong></li>
          <li>复制 Token 到 <code className="text-brand-gold">.env.local</code>：<br />
            <code>STRAPI_API_TOKEN=你的token</code></li>
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
              onClick={load}
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

      {section === "contact" && contactDraft ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
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
                onChange={(e) => setContactDraft({ ...contactDraft, footerIntroZh: e.target.value })}
              />
            </Field>
          </div>
          <SaveButton saving={savingId === "contact"} onClick={saveContact} />

          {leads.length > 0 ? (
            <div className="pt-6 border-t border-white/10">
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
        ? filteredRows.map((row) => {
            const id = docId(row);
            const draft = drafts[id] ?? row;
            const isOpen = openId === id;
            const title = rowTitle(draft);
            const subtitle = rowSubtitle(section, draft);
            const isDirty = dirtyIds.has(id);

            return (
              <div
                key={id}
                className={cn(
                  "rounded-2xl border overflow-hidden transition-colors",
                  isOpen ? "border-brand-gold/25 bg-white/[0.02]" : "border-white/10"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{title}</span>
                      {isDirty ? (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          未保存
                        </span>
                      ) : null}
                    </div>
                    {subtitle ? (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
                    ) : null}
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn("text-gray-500 shrink-0 transition-transform", isOpen && "rotate-180")}
                  />
                </button>

                {isOpen ? (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                    {renderFields(section, draft, (patch) => {
                      setDrafts((d) => setDraft(d, id, patch));
                      setDirtyIds((prev) => new Set(prev).add(id));
                    })}
                    <div className="sticky bottom-0 flex flex-wrap items-center gap-3 pt-2 pb-1 bg-zinc-950/90 backdrop-blur-sm border-t border-white/5 -mx-5 px-5">
                      <SaveButton
                        saving={savingId === id}
                        onClick={() => saveRow(id)}
                        label={isDirty ? "保存并发布" : "保存并发布"}
                      />
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
          })
        : null}

      {section !== "contact" && rows.length > 0 && filteredRows.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">没有匹配的条目，请换个关键词</p>
      ) : null}
    </div>
  );
}

function renderFields(
  section: string,
  draft: StrapiRow,
  onChange: (patch: Partial<StrapiRow>) => void
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

  if (section === "home") {
    fields.push(textField("nameZh", "场景名（中文）"));
    fields.push(textField("nameEn", "场景名（英文）"));
    fields.push(textField("descZh", "描述（中文）", true));
    fields.push(textField("descEn", "描述（英文）", true));
    fields.push(
      <ImageUploadField
        key="image"
        label="场景图片"
        currentUrl={mediaUrl(draft.image as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
        onRemoved={() => onChange({ image: null })}
      />
    );
  }

  if (section === "products") {
    fields.push(textField("model", "型号"));
    fields.push(textField("nameZh", "名称（中文）"));
    fields.push(textField("nameEn", "名称（英文）"));
    fields.push(textField("descZh", "简介（中文）", true));
    fields.push(textField("descEn", "简介（英文）", true));
    fields.push(textField("seriesZh", "系列（中文）"));
    fields.push(textField("seriesEn", "系列（英文）"));
    fields.push(textField("specsZh", "规格（中文）", true));
    fields.push(textField("specsEn", "规格（英文）", true));
    fields.push(
      <SelectField
        key="seriesGroup"
        label="产品大类"
        value={getText(draft, "seriesGroup") || "speaker"}
        onChange={(v) => onChange({ seriesGroup: v })}
        options={[
          { value: "speaker", label: "音箱" },
          { value: "dsp", label: "处理器" },
          { value: "software", label: "软件" },
          { value: "engineering", label: "工程" },
        ]}
      />
    );
    fields.push(
      <SelectField
        key="category"
        label="前台分类"
        value={getText(draft, "category") || "speaker"}
        onChange={(v) => onChange({ category: v })}
        options={[
          { value: "speaker", label: "音箱" },
          { value: "dsp", label: "处理器" },
          { value: "software", label: "软件" },
        ]}
      />
    );
    fields.push(
      <Field key="productLine" label="系列标识（如 la、sol、unit）">
        <input
          className={inputClass}
          value={getText(draft, "productLine")}
          onChange={(e) => onChange({ productLine: e.target.value })}
        />
      </Field>
    );
    fields.push(
      <Field key="sortOrder" label="排序（数字越小越靠前）">
        <input
          type="number"
          className={inputClass}
          value={String(draft.sortOrder ?? "")}
          onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })}
        />
      </Field>
    );
    fields.push(
      <ImageUploadField
        key="image"
        label="封面图"
        currentUrl={mediaUrl(draft.image as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
        onRemoved={() => onChange({ image: null })}
      />
    );
    fields.push(
      <div key="gallery" className="sm:col-span-2">
        <GalleryUploadField
          label="产品图集"
          items={(draft.gallery as StrapiMedia[]) ?? []}
          onChange={(gallery) => onChange({ gallery })}
        />
      </div>
    );
  }

  if (section === "cases") {
    fields.push(textField("titleZh", "标题（中文）"));
    fields.push(textField("titleEn", "标题（英文）"));
    fields.push(textField("descZh", "摘要（中文）", true));
    fields.push(textField("descEn", "摘要（英文）", true));
    fields.push(
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
    );
    fields.push(textField("products", "设备配置（型号列表）"));
    fields.push(
      <ImageUploadField
        key="image"
        label="封面图"
        currentUrl={mediaUrl(draft.image as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
        onRemoved={() => onChange({ image: null })}
      />
    );
    fields.push(
      <div key="gallery" className="sm:col-span-2">
        <GalleryUploadField
          label="案例图集"
          items={(draft.gallery as StrapiMedia[]) ?? []}
          onChange={(gallery) => onChange({ gallery })}
        />
      </div>
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
        key="subCategory"
        label="子分类（导航筛选）"
        value={getText(draft, "subCategory") || "v225a"}
        onChange={(v) => onChange({ subCategory: v })}
        options={DOWNLOAD_SUB_CATEGORIES.map((s) => ({
          value: s.slug,
          label: `${s.label.zh} · ${s.tab === "software" ? "软件" : "画册"}`,
        }))}
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
      <Field key="visible" label="在导航显示">
        <select
          className={inputClass}
          value={draft.visible === false ? "false" : "true"}
          onChange={(e) => onChange({ visible: e.target.value === "true" })}
        >
          <option value="true">显示</option>
          <option value="false">隐藏</option>
        </select>
      </Field>
    );
    fields.push(
      <Field key="featuredProductId" label="推荐产品 ID">
        <input
          type="number"
          className={inputClass}
          value={String(draft.featuredProductId ?? "")}
          onChange={(e) => onChange({ featuredProductId: Number(e.target.value) || null })}
        />
      </Field>
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
