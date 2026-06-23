"use client";

import ShaderHero from "@/components/ShaderHero";
import HeroOverlay from "@/components/HeroOverlay";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";

export default function Hero() {
  const { resolvedMode } = usePerformanceMode();

  return (
    <section className="hero-viewport">
      <div className="absolute inset-0 z-0">
        {resolvedMode === "lite" ? (
          <div className="hero-wave-fallback h-full w-full" />
        ) : (
          <ShaderHero />
        )}
      </div>
      <HeroOverlay />
    </section>
  );
}
