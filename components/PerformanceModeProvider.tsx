"use client";

import { isWeChatWebView } from "@/lib/wechat-webview";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type PerformanceMode = "auto" | "high" | "lite";
type ResolvedPerformanceMode = "high" | "lite";

type PerformanceModeState = {
  mode: PerformanceMode;
  resolvedMode: ResolvedPerformanceMode;
  setMode: (mode: PerformanceMode) => void;
};

const MODE_KEY = "dbsource-performance-mode";
const AUTO_CACHE_KEY = "dbsource-performance-auto-cache";
const AUTO_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RUNTIME_SAMPLE_MS = 1800;

const PerformanceModeContext = createContext<PerformanceModeState>({
  mode: "auto",
  resolvedMode: "lite",
  setMode: () => {},
});

function getStoredMode(): PerformanceMode {
  if (typeof window === "undefined") return "auto";
  const value = window.localStorage.getItem(MODE_KEY);
  return value === "high" || value === "lite" || value === "auto" ? value : "auto";
}

function getCachedAutoDecision(): ResolvedPerformanceMode | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTO_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { mode?: ResolvedPerformanceMode; at?: number };
    if (!parsed.mode || !parsed.at) return null;
    if (Date.now() - parsed.at > AUTO_CACHE_TTL_MS) return null;
    return parsed.mode;
  } catch {
    return null;
  }
}

function cacheAutoDecision(mode: ResolvedPerformanceMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    AUTO_CACHE_KEY,
    JSON.stringify({
      mode,
      at: Date.now(),
    })
  );
}

/** 同步快判：明显低配 / 移动端 / 微信 → 直接 lite，跳过长采样 */
function detectSyncLite(): boolean {
  if (typeof window === "undefined") return true;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  if (isWeChatWebView()) return true;
  if (window.matchMedia("(max-width: 768px)").matches) return true;
  if (window.matchMedia("(pointer: coarse)").matches) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (nav.connection?.saveData) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;

  return false;
}

async function detectRuntimePerformance(): Promise<ResolvedPerformanceMode> {
  const sampleDurationMs = RUNTIME_SAMPLE_MS;
  const frameBudgetMs = 1000 / 35;
  let frameCount = 0;
  let slowFrameCount = 0;
  let longTaskTotal = 0;
  let longTaskCount = 0;
  let done = false;

  const observer =
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes?.includes("longtask")
      ? new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTaskTotal += entry.duration;
            longTaskCount += 1;
          }
        })
      : null;

  observer?.observe({ entryTypes: ["longtask"] });

  await new Promise<void>((resolve) => {
    const start = performance.now();
    let last = start;

    function step(now: number) {
      if (done) return;
      const delta = now - last;
      last = now;
      frameCount += 1;
      if (delta > frameBudgetMs) slowFrameCount += 1;

      if (now - start >= sampleDurationMs) {
        done = true;
        resolve();
        return;
      }
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });

  observer?.disconnect();

  const slowFrameRatio = frameCount > 0 ? slowFrameCount / frameCount : 0;
  if (slowFrameRatio >= 0.35) return "lite";
  if (longTaskTotal >= 120 || longTaskCount >= 4) return "lite";
  return "high";
}

export function PerformanceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<PerformanceMode>("auto");
  const [resolvedMode, setResolvedMode] = useState<ResolvedPerformanceMode>("lite");

  useEffect(() => {
    const storedMode = getStoredMode();
    setModeState(storedMode);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveMode() {
      if (mode === "high" || mode === "lite") {
        setResolvedMode(mode);
        return;
      }

      const cached = getCachedAutoDecision();
      if (cached) {
        setResolvedMode(cached);
        return;
      }

      if (detectSyncLite()) {
        setResolvedMode("lite");
        cacheAutoDecision("lite");
        return;
      }

      setResolvedMode("lite");

      const detected = await detectRuntimePerformance();
      if (cancelled) return;
      setResolvedMode(detected);
      cacheAutoDecision(detected);
    }

    resolveMode();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.performanceMode = resolvedMode;
    document.body.dataset.performanceMode = resolvedMode;
  }, [resolvedMode]);

  const setMode = (nextMode: PerformanceMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(MODE_KEY, nextMode);
  };

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      setMode,
    }),
    [mode, resolvedMode]
  );

  return (
    <PerformanceModeContext.Provider value={value}>{children}</PerformanceModeContext.Provider>
  );
}

export function usePerformanceMode() {
  return useContext(PerformanceModeContext);
}
