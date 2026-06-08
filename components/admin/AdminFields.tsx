"use client";

import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

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

export function ImageUploadField({
  label,
  currentUrl,
  onUploaded,
}: {
  label: string;
  currentUrl?: string;
  onUploaded: (mediaId: number, url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "上传失败");
        return;
      }
      setPreview(json.url.startsWith("http") ? json.url : `${process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337"}${json.url}`);
      onUploaded(json.id, json.url);
    } catch {
      setError("上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label}>
      <div className="flex flex-wrap items-start gap-4">
        {preview ? (
          <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-white/10 bg-zinc-900">
            <Image src={preview} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,.zip,.exe,.dmg"
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
            {uploading ? "上传中…" : "选择文件上传"}
          </button>
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
