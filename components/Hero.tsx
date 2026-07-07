"use client";

import HeroOverlay from "@/components/HeroOverlay";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";
import dynamic from "next/dynamic";

const ShaderHero = dynamic(() => import("@/components/ShaderHero"), {
  ssr: false,
  loading: () => <div className="hero-wave-fallback h-full w-full" />,
});

export default function Hero() {
  const { resolvedMode } = usePerformanceMode();

  return (
    <section className="hero-viewport relative overflow-hidden">
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
