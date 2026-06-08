"use client";

import {
  AdminBanner,
  Field,
  ImageUploadField,
  SaveButton,
  inputClass,
} from "@/components/admin/AdminFields";
import { sectionToCollection } from "@/lib/strapi-admin";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type StrapiMedia = { id?: number; url?: string };
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
        init[docId(r)] = { ...r };
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
    if (payload.image && typeof payload.image === "object") {
      payload.image = (payload.image as StrapiMedia).id ?? payload.image;
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
      load();
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
    return <p className="text-sm text-gray-500">加载内容中…</p>;
  }

  return (
    <div className="space-y-4">
      {message ? (
        <AdminBanner variant={message.type === "ok" ? "ok" : "error"}>{message.text}</AdminBanner>
      ) : null}

      <AdminBanner variant="warn">
        在此修改并上传后点击「保存并发布」，网站约 1 分钟内自动更新（无需打开 Strapi 后台）。
      </AdminBanner>

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

      {section !== "contact" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={createRow}
            disabled={savingId === "new" || !["products", "series"].includes(section)}
            className="text-sm px-4 py-2 rounded-lg border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingId === "new" ? "创建中…" : "+ 新增条目"}
          </button>
        </div>
      ) : null}

      {section !== "contact"
        ? rows.map((row) => {
            const id = docId(row);
            const draft = drafts[id] ?? row;
            const isOpen = openId === id;
            const title =
              getText(draft, "titleZh") ||
              getText(draft, "nameZh") ||
              getText(draft, "model") ||
              getText(draft, "labelZh") ||
              getText(draft, "sectionKey") ||
              id;

            return (
              <div key={id} className="rounded-2xl border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="font-medium">{title}</span>
                  <ChevronDown
                    size={18}
                    className={cn("text-gray-500 transition-transform", isOpen && "rotate-180")}
                  />
                </button>

                {isOpen ? (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                    {renderFields(section, draft, (patch) =>
                      setDrafts((d) => setDraft(d, id, patch))
                    )}
                    <div className="flex flex-wrap gap-3">
                      <SaveButton saving={savingId === id} onClick={() => saveRow(id)} />
                      {["products", "series"].includes(section) ? (
                        <button
                          type="button"
                          onClick={() => deleteRow(id)}
                          className="text-sm px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
                        >
                          删除
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        : null}
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
      <Field key="productLine" label="产品系列 (productLine)">
        <input
          className={inputClass}
          value={getText(draft, "productLine")}
          onChange={(e) => onChange({ productLine: e.target.value })}
        />
      </Field>
    );
    fields.push(
      <Field key="seriesGroup" label="大类 (seriesGroup)">
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
    fields.push(
      <Field key="category" label="分类 (category)">
        <select
          className={inputClass}
          value={getText(draft, "category") || "speaker"}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {["speaker", "dsp", "software"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
    );
    fields.push(
      <Field key="sortOrder" label="排序 (sortOrder)">
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
      />
    );
    fields.push(
      <ImageUploadField
        key="gallery"
        label="产品图集（上传后追加一张，保存生效）"
        currentUrl={mediaUrl((draft.gallery as StrapiMedia[])?.slice(-1)[0])}
        onUploaded={(mediaId, url) => {
          const prev = (draft.gallery as StrapiMedia[]) ?? [];
          onChange({ gallery: [...prev, { id: mediaId, url }] });
        }}
      />
    );
  }

  if (section === "cases") {
    fields.push(textField("titleZh", "标题（中文）"));
    fields.push(textField("titleEn", "标题（英文）"));
    fields.push(textField("descZh", "摘要（中文）", true));
    fields.push(textField("products", "设备配置"));
    fields.push(
      <ImageUploadField
        key="image"
        label="封面图"
        currentUrl={mediaUrl(draft.image as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ image: { id: mediaId, url } })}
      />
    );
    fields.push(
      <ImageUploadField
        key="gallery"
        label="案例图集（上传追加）"
        currentUrl={mediaUrl((draft.gallery as StrapiMedia[])?.slice(-1)[0])}
        onUploaded={(mediaId, url) => {
          const prev = (draft.gallery as StrapiMedia[]) ?? [];
          onChange({ gallery: [...prev, { id: mediaId, url }] });
        }}
      />
    );
  }

  if (section === "downloads") {
    fields.push(textField("nameZh", "名称（中文）"));
    fields.push(textField("nameEn", "名称（英文）"));
    fields.push(textField("size", "文件大小"));
    fields.push(textField("fileUrl", "外链地址（可选，上传文件可留 #）"));
    fields.push(
      <ImageUploadField
        key="cover"
        label="封面图"
        currentUrl={mediaUrl(draft.cover as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ cover: { id: mediaId, url } })}
      />
    );
    fields.push(
      <ImageUploadField
        key="file"
        label="下载文件（PDF/ZIP/安装包）"
        currentUrl={mediaUrl(draft.file as StrapiMedia)}
        onUploaded={(mediaId, url) => onChange({ file: { id: mediaId, url }, fileUrl: url })}
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
      />
    );
  }

  return <div className="grid sm:grid-cols-2 gap-4">{fields}</div>;
}
