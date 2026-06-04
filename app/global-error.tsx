"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#000", color: "#fff", fontFamily: "system-ui" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <h1 style={{ fontWeight: 300 }}>网站运行异常</h1>
          <p style={{ color: "#888", marginTop: 16 }}>{error.message}</p>
          <p style={{ color: "#666", marginTop: 12, fontSize: 14, maxWidth: 420, textAlign: "center" }}>
            若提示 Loading chunk failed：请关闭所有 dev 窗口，双击「修复预览崩溃.bat」，浏览器按 Ctrl+Shift+R 强刷。
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: "12px 24px", background: "#2eb896", border: "none", cursor: "pointer" }}
          >
            刷新页面
          </button>
        </div>
      </body>
    </html>
  );
}
