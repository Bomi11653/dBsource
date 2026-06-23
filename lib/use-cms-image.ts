"use client";

import { resolveBrowserMediaUrl } from "@/lib/media-url";
import { isWeChatWebView } from "@/lib/wechat-webview";
import { useCallback, useEffect, useMemo, useState } from "react";

export type CmsImageState = {
  displaySrc: string;
  imageKey: string;
  handleError: () => void;
  preferUnoptimized: boolean;
  preferEager: boolean;
};

/** 规范化 Strapi 图片 URL，并在微信里支持失败重试与缓存规避 */
export function useCmsImageState(rawSrc: string): CmsImageState {
  const normalized = useMemo(() => resolveBrowserMediaUrl(rawSrc), [rawSrc]);
  const [displaySrc, setDisplaySrc] = useState(normalized);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setDisplaySrc(normalized);
    setRetry(0);
  }, [normalized]);

  const imageKey = normalized ? `${normalized}::r${retry}` : "empty";

  const handleError = useCallback(() => {
    if (!normalized) return;
    console.error("[CMS image] load failed:", displaySrc);

    if (retry === 0) {
      const sep = normalized.includes("?") ? "&" : "?";
      setDisplaySrc(`${normalized}${sep}_wx=${Date.now()}`);
      setRetry(1);
      return;
    }

    if (retry === 1) {
      const again = resolveBrowserMediaUrl(rawSrc);
      if (again) {
        setDisplaySrc(again);
        setRetry(2);
      }
    }
  }, [displaySrc, normalized, rawSrc, retry]);

  const isWeChat = isWeChatWebView();
  const preferUnoptimized =
    isWeChat ||
    displaySrc.startsWith("/strapi-uploads/") ||
    displaySrc.startsWith("/uploads/") ||
    displaySrc.startsWith("data:");

  return {
    displaySrc: displaySrc || normalized,
    imageKey,
    handleError,
    preferUnoptimized,
    preferEager: isWeChat,
  };
}
