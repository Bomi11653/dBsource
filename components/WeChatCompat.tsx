"use client";

import { isWeChatWebView } from "@/lib/wechat-webview";
import { useEffect } from "react";

/** 为微信 WebView 设置 html[data-wechat] 以启用兼容样式 */
export default function WeChatCompat() {
  useEffect(() => {
    if (!isWeChatWebView()) return;
    document.documentElement.setAttribute("data-wechat", "true");
  }, []);

  return null;
}
