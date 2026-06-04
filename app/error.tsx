"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 text-center">
      <h1 className="text-2xl font-light mb-4">页面加载出错</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-md">
        {error.message || "请刷新页面或返回首页重试"}
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-2 border border-white/20 hover:border-brand-gold/50 text-sm"
        >
          重试
        </button>
        <a
          href="/"
          className="px-6 py-2 bg-brand-gold/90 text-black text-sm hover:bg-brand-gold"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
