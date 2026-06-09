"use client";

import { formatFileSize } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";
import { FileArchive, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type UploadResult = { id: number; url: string; name?: string; size?: number };

function parseStrapiUploadResponse(text: string, status: number): UploadResult {
  const json = JSON.parse(text) as
    | UploadResult[]
    | { ok?: boolean; id?: number; url?: string; name?: string; size?: number; error?: string }
    | { error?: { message?: string } };

  if (Array.isArray(json)) {
    const uploaded = json[0];
    if (uploaded?.id && uploaded.url) return uploaded;
  }

  if (!Array.isArray(json) && "ok" in json && json.ok && json.id && json.url) {
    return { id: json.id, url: json.url, name: json.name, size: json.size };
  }

  const message =
    (!Array.isArray(json) && "error" in json && typeof json.error === "string" && json.error) ||
    (!Array.isArray(json) &&
      json.error &&
      typeof json.error === "object" &&
      "message" in json.error &&
      json.error.message) ||
    `上传失败 (${status})`;
  throw new Error(String(message));
}

function xhrUpload(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
  headers?: Record<string, string>
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 5 * 60 * 1000;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(parseStrapiUploadResponse(xhr.responseText, xhr.status));
          return;
        }
        parseStrapiUploadResponse(xhr.responseText, xhr.status);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(`上传失败 (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("网络错误，上传中断"));
    xhr.ontimeout = () => reject(new Error("上传超时（超过 5 分钟），请检查文件大小或网络"));

    const form = new FormData();
    form.append("files", file);
    xhr.send(form);
  });
}

/** 优先直传 Strapi（少一跳），失败时回退 Next 代理 */
async function uploadToAdmin(
  file: File,
  onProgress: (pct: number) => void
): Promise<UploadResult> {
  try {
    const credRes = await fetch("/api/admin/upload-credentials", { credentials: "include" });
    const credJson = (await credRes.json()) as {
      ok?: boolean;
      cmsUrl?: string;
      token?: string;
      error?: string;
    };
    if (credRes.ok && credJson.ok && credJson.cmsUrl && credJson.token) {
      return await xhrUpload(
        `${credJson.cmsUrl.replace(/\/$/, "")}/api/upload`,
        file,
        onProgress,
        { Authorization: `Bearer ${credJson.token}` }
      );
    }
  } catch {
    /* 直传失败，走代理 */
  }

  return xhrUpload("/api/admin/upload", file, onProgress);
}

export function AdminBanner({
  variant,
  children,
}: {
  variant: "warn" | "ok" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    ok: "border-brand-gold/30 bg-brand-gold/10 text-brand-gold",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[variant])}>{children}</div>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-gold/50";

const readOnlyClass =
  "w-full rounded-lg border border-white/5 bg-zinc-900/40 px-3 py-2.5 text-sm text-gray-400 cursor-default";

export function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Field label={label}>
      <div className={readOnlyClass}>{value || "—"}</div>
      {hint ? <p className="text-[10px] text-gray-600">{hint}</p> : null}
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export type GalleryItem = { id?: number; url?: string };

function resolveMediaPreview(url?: string): string | undefined {
  if (!url) return undefined;
  const cmsBase = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";
  return url.startsWith("http") ? url : `${cmsBase}${url}`;
}

export function ImageUploadField({
  label,
  currentUrl,
  onUploaded,
  onRemoved,
}: {
  label: string;
  currentUrl?: string;
  onUploaded: (mediaId: number, url: string) => void;
  /** 传入后显示右上角删除按钮 */
  onRemoved?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      const result = await uploadToAdmin(file, setProgress);
      const cmsBase = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337";
      setPreview(result.url.startsWith("http") ? result.url : `${cmsBase}${result.url}`);
      onUploaded(result.id, result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <Field label={label}>
      <div className="flex flex-wrap items-start gap-4">
        {preview ? (
          <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 group">
            <Image src={preview} alt="" fill className="object-cover" unoptimized />
            {onRemoved ? (
              <button
                type="button"
                title="删除图片"
                onClick={() => {
                  setPreview(undefined);
                  onRemoved();
                }}
                className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-white opacity-90 hover:bg-red-600 hover:opacity-100 transition-colors"
              >
                <X size={12} />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="min-w-[200px]">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-gray-300 hover:border-brand-gold/40 hover:text-white transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? `上传中 ${progress}%` : "选择图片上传"}
          </button>
          {uploading ? (
            <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-brand-gold transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
        </div>
      </div>
    </Field>
  );
}

/** 多图图集：展示已上传缩略图，右上角可删，避免误操作 */
export function GalleryUploadField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      const result = await uploadToAdmin(file, setProgress);
      onChange([...items, { id: result.id, url: result.url }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <Field label={label}>
      <div className="space-y-3">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => {
              const src = resolveMediaPreview(item.url);
              if (!src) return null;
              return (
                <div
                  key={`${item.id ?? item.url}-${index}`}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shrink-0"
                >
                  <Image src={src} alt="" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    title="删除此图"
                    onClick={() => removeAt(index)}
                    className="absolute top-0.5 right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={10} />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center text-gray-300 py-0.5">
                    {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-600">暂无图片，点击下方按钮上传</p>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-gray-300 hover:border-brand-gold/40 hover:text-white transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? `上传中 ${progress}%` : `追加图片（已有 ${items.length} 张）`}
          </button>
          {uploading ? (
            <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-brand-gold transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
        </div>
      </div>
    </Field>
  );
}

/** 下载文件（ZIP/PDF/安装包），带进度条，不做图片预览 */
export type FileUploadMeta = {
  fileName: string;
  sizeLabel: string;
};

export function FileUploadField({
  label,
  currentUrl,
  onUploaded,
}: {
  label: string;
  currentUrl?: string;
  onUploaded: (mediaId: number, url: string, meta: FileUploadMeta) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(
    currentUrl ? currentUrl.split("/").pop() ?? "已上传文件" : ""
  );
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    setProgress(0);
    setFileName(file.name);
    try {
      const result = await uploadToAdmin(file, setProgress);
      // 以浏览器 File.size（字节）为准，Strapi 返回的 size 单位为 KB
      const sizeLabel = formatFileSize(file.size);
      onUploaded(result.id, result.url, {
        fileName: result.name || file.name,
        sizeLabel,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <Field label={label}>
      <div className="space-y-2">
        {fileName ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-gray-300">
            <FileArchive size={14} className="text-brand-gold shrink-0" />
            <span className="truncate max-w-[280px]">{fileName}</span>
          </div>
        ) : null}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.zip,.rar,.7z,.exe,.dmg,.msi,application/pdf,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-gray-300 hover:border-brand-gold/40 hover:text-white transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? `上传中 ${progress}%` : "选择文件上传"}
          </button>
          {uploading ? (
            <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-brand-gold transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          <p className="text-[10px] text-gray-600 mt-1.5">支持 PDF / ZIP / 安装包，单文件最大 512MB</p>
          {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
        </div>
      </div>
    </Field>
  );
}

export function SaveButton({
  saving,
  onClick,
  label = "保存并发布",
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : null}
      {saving ? "保存中…" : label}
    </button>
  );
}
