"use client";

import {
  AdminBanner,
  Field,
  ImageUploadField,
  SaveButton,
  inputClass,
} from "@/components/admin/AdminFields";
import { formatSaveToast, type AdminSaveResponse } from "@/lib/admin-save-toast";
import { ADMIN_HERO_COPY, ADMIN_HOME_SEO } from "@/lib/admin-home-display";
import { resolveAdminPreviewUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { Eye, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type StrapiMedia = { id?: number; url?: string };

type GlobalSettingDraft = {
  logo?: StrapiMedia | null;
  footerCopyrightZh?: string;
  footerCopyrightEn?: string;
  homeFeaturedProductAId?: number | null;
  homeFeaturedProductBId?: number | null;
  homeFeaturedCaseId?: number | null;
  homeFeaturedCaseTitleZh?: string;
  homeFeaturedCaseTitleEn?: string;
  homeFeaturedCaseDescZh?: string;
  homeFeaturedCaseDescEn?: string;
  homeFeaturedCaseImage?: StrapiMedia | null;
};

function mediaUrl(media?: StrapiMedia | null) {
  if (!media?.url) return "";
  return resolveAdminPreviewUrl(media.url);
}

function getText(row: GlobalSettingDraft, key: keyof GlobalSettingDraft) {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function buildGlobalSettingPayload(draft: GlobalSettingDraft): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    footerCopyrightZh: getText(draft, "footerCopyrightZh"),
    footerCopyrightEn: getText(draft, "footerCopyrightEn"),
    homeFeaturedProductAId: draft.homeFeaturedProductAId ?? null,
    homeFeaturedProductBId: draft.homeFeaturedProductBId ?? null,
    homeFeaturedCaseId: draft.homeFeaturedCaseId ?? null,
    homeFeaturedCaseTitleZh: getText(draft, "homeFeaturedCaseTitleZh"),
    homeFeaturedCaseTitleEn: getText(draft, "homeFeaturedCaseTitleEn"),
    homeFeaturedCaseDescZh: getText(draft, "homeFeaturedCaseDescZh"),
    homeFeaturedCaseDescEn: getText(draft, "homeFeaturedCaseDescEn"),
  };

  if (draft.logo === null) {
    payload.logo = null;
  } else if (draft.logo && typeof draft.logo === "object") {
    payload.logo = draft.logo.id ?? draft.logo;
  }

  if (draft.homeFeaturedCaseImage === null) {
    payload.homeFeaturedCaseImage = null;
  } else if (draft.homeFeaturedCaseImage && typeof draft.homeFeaturedCaseImage === "object") {
    payload.homeFeaturedCaseImage =
      draft.homeFeaturedCaseImage.id ?? draft.homeFeaturedCaseImage;
  }

  return payload;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        {description ? <p className="text-xs text-gray-500 mt-1">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function HomeAdminEditor({ tokenReady }: { tokenReady: boolean }) {
  const [draft, setDraft] = useState<GlobalSettingDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!tokenReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/global-setting");
      const json = await res.json();
      if (json.ok && json.data?.data) {
        setDraft(json.data.data as GlobalSettingDraft);
      } else {
        setDraft({});
        setMessage({ type: "error", text: json.error || "加载首页设置失败" });
      }
    } catch (e) {
      setDraft({});
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "加载首页设置失败",
      });
    } finally {
      setLoading(false);
    }
  }, [tokenReady]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveGlobalSetting(saveKey: string) {
    if (!draft) return;
    setSavingKey(saveKey);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/global-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildGlobalSettingPayload(draft)),
      });
      const json = (await res.json()) as AdminSaveResponse & { ok?: boolean; error?: string };
      if (!json.ok) {
        setMessage({ type: "error", text: json.error || "保存失败" });
      } else {
        const toast = formatSaveToast(json);
        setMessage({ type: toast.type, text: toast.text });
        await load();
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "保存失败",
      });
    } finally {
      setSavingKey(null);
    }
  }

  if (!tokenReady) {
    return (
      <AdminBanner variant="warn">
        未配置 STRAPI_API_TOKEN，请在 .env.local 添加后重启预览。
      </AdminBanner>
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500">加载首页设置…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <p className="text-sm text-gray-400">
          当前官网首页仅展示 Hero 首屏动画与页脚；以下设置会同步到前台。
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
          >
            <Eye size={14} />
            预览首页
            <ExternalLink size={10} />
          </Link>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
      </div>

      {message ? (
        <AdminBanner variant={message.type === "ok" ? "ok" : "error"}>{message.text}</AdminBanner>
      ) : null}

      <SectionCard
        title="Hero 管理"
        description="首屏 Logo 与标语；动画效果由前端代码控制。"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Hero Logo"
              currentUrl={mediaUrl(draft?.logo)}
              onUploaded={(mediaId, url) =>
                setDraft((prev) => ({ ...(prev ?? {}), logo: { id: mediaId, url } }))
              }
              onRemoved={() => setDraft((prev) => ({ ...(prev ?? {}), logo: null }))}
            />
            <p className="text-[11px] text-gray-500 mt-2">
              保存后同步至首页 Hero 与全站导航 Logo（约 1 分钟内生效）。
            </p>
          </div>
          <Field label="标语（中文 · 只读）">
            <input className={cn(inputClass, "opacity-70")} readOnly value={ADMIN_HERO_COPY.slogan.zh} />
          </Field>
          <Field label="标语（英文 · 只读）">
            <input className={cn(inputClass, "opacity-70")} readOnly value={ADMIN_HERO_COPY.slogan.en} />
          </Field>
          <p className="sm:col-span-2 text-[11px] text-gray-500">
            {ADMIN_HERO_COPY.animationNote} 标语文案在代码 i18n 中维护，如需修改请联系开发。
          </p>
        </div>
        <SaveButton
          saving={savingKey === "hero"}
          onClick={() => saveGlobalSetting("hero")}
          label="保存 Hero 设置"
        />
      </SectionCard>

      <SectionCard
        title="首页基础设置"
        description="全站 Logo 与页脚版权等基础信息（global-setting）。"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="页脚版权（中文）">
            <input
              className={inputClass}
              value={getText(draft ?? {}, "footerCopyrightZh")}
              onChange={(e) =>
                setDraft((prev) => ({ ...(prev ?? {}), footerCopyrightZh: e.target.value }))
              }
              placeholder="例如：© 2026 东莞新声电子科技有限公司"
            />
          </Field>
          <Field label="页脚版权（英文）">
            <input
              className={inputClass}
              value={getText(draft ?? {}, "footerCopyrightEn")}
              onChange={(e) =>
                setDraft((prev) => ({ ...(prev ?? {}), footerCopyrightEn: e.target.value }))
              }
              placeholder="e.g. © 2026 Dongguan Xinsheng Electronics"
            />
          </Field>
          <p className="sm:col-span-2 text-[11px] text-gray-500">
            页脚版权字段已写入 CMS；若前台尚未接入显示，数据仍会保留供后续启用。
          </p>
        </div>
        <SaveButton
          saving={savingKey === "basic"}
          onClick={() => saveGlobalSetting("basic")}
          label="保存基础设置"
        />
      </SectionCard>

      <SectionCard
        title="SEO 设置"
        description="首页搜索引擎标题与描述（当前由 lib/seo.ts 提供，只读参考）。"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title（中文）">
            <input className={cn(inputClass, "opacity-70")} readOnly value={ADMIN_HOME_SEO.zh.title} />
          </Field>
          <Field label="Title（英文）">
            <input className={cn(inputClass, "opacity-70")} readOnly value={ADMIN_HOME_SEO.en.title} />
          </Field>
          <Field label="Description（中文）">
            <textarea
              className={cn(inputClass, "min-h-[88px] opacity-70")}
              readOnly
              value={ADMIN_HOME_SEO.zh.description}
            />
          </Field>
          <Field label="Description（英文）">
            <textarea
              className={cn(inputClass, "min-h-[88px] opacity-70")}
              readOnly
              value={ADMIN_HOME_SEO.en.description}
            />
          </Field>
          <p className="sm:col-span-2 text-[11px] text-gray-500">
            修改 SEO 需更新代码中的 PAGE_SEO.home 并重新部署；CMS 暂无对应字段，数据不会丢失。
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
