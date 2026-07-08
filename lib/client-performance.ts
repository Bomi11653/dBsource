/** 客户端判断是否应禁用重型动效（Shader / Canvas 抠图等） */
export function shouldBlockHeavyClientEffects(): boolean {
  if (typeof window === "undefined") return true;

  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 桌面高性能模式 + 非移动端 → 可加载 Shader */
export function canLoadShaderHero(resolvedMode: "high" | "lite"): boolean {
  if (resolvedMode !== "high") return false;
  return !shouldBlockHeavyClientEffects();
}
