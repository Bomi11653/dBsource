"use client";

import { useI18n } from "@/components/I18nProvider";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";

export default function PerformanceModeSwitcher() {
  const { locale } = useI18n();
  const { mode, resolvedMode, setMode } = usePerformanceMode();
  const autoLabel = locale === "zh" ? "自动" : "Auto";

  return (
    <div
      data-perf-chrome="true"
      className="fixed bottom-4 left-4 z-[70] hidden md:flex items-center gap-1 rounded-full border border-white/20 bg-black/80 px-2 py-1.5"
    >
      <span className="px-2 text-[11px] text-gray-400">
        {mode === "auto"
          ? `${autoLabel}:${resolvedMode === "lite" ? "Lite" : "High"}`
          : mode === "lite"
            ? "Lite"
            : "High"}
      </span>
      <button
        type="button"
        onClick={() => setMode("auto")}
        className={`min-h-[32px] rounded-full px-2.5 text-xs transition-colors ${
          mode === "auto" ? "bg-white text-black" : "text-gray-300 hover:text-white hover:bg-white/10"
        }`}
      >
        {autoLabel}
      </button>
      <button
        type="button"
        onClick={() => setMode("high")}
        className={`min-h-[32px] rounded-full px-2.5 text-xs transition-colors ${
          mode === "high" ? "bg-white text-black" : "text-gray-300 hover:text-white hover:bg-white/10"
        }`}
      >
        High
      </button>
      <button
        type="button"
        onClick={() => setMode("lite")}
        className={`min-h-[32px] rounded-full px-2.5 text-xs transition-colors ${
          mode === "lite" ? "bg-white text-black" : "text-gray-300 hover:text-white hover:bg-white/10"
        }`}
      >
        Lite
      </button>
    </div>
  );
}

