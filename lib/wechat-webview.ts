/** 是否在微信内置浏览器（MicroMessenger WebView） */
export function isWeChatWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}
