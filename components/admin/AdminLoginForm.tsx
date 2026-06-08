"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/admin/AdminFields";

export default function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      router.replace(nextPath);
      router.refresh();
      return;
    }
    setError(data.error || "登录失败");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <label className="block text-sm text-gray-400">
        访问密码
        <input
          type="password"
          className={`${inputClass} mt-2`}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] rounded-xl bg-brand-gold/90 text-black font-medium hover:bg-brand-gold transition-colors disabled:opacity-60"
      >
        {loading ? "验证中…" : "进入后台"}
      </button>
    </form>
  );
}
