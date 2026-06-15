"use client";

import ShaderHero from "@/components/ShaderHero";
import HeroOverlay from "@/components/HeroOverlay";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";

export default function Hero() {
  const { resolvedMode } = usePerformanceMode();

  return (
    <div className="relative h-screen-safe w-full">
      {resolvedMode === "lite" ? (
        <div className="hero-wave-fallback h-screen-safe w-full" />
      ) : (
        <ShaderHero />
      )}
      <HeroOverlay />
    </div>
  );
}
