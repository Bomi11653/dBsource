"use client";

import HeroOverlay from "@/components/HeroOverlay";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";
import { canLoadShaderHero } from "@/lib/client-performance";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShaderHero = dynamic(() => import("@/components/ShaderHero"), {
  ssr: false,
  loading: () => <div className="hero-wave-fallback h-full w-full" />,
});

export default function Hero() {
  const { resolvedMode } = usePerformanceMode();
  const [shaderEnabled, setShaderEnabled] = useState(false);

  useEffect(() => {
    setShaderEnabled(canLoadShaderHero(resolvedMode));
  }, [resolvedMode]);

  return (
    <section className="hero-viewport relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {shaderEnabled ? (
          <ShaderHero />
        ) : (
          <div className="hero-wave-fallback h-full w-full" />
        )}
      </div>
      <HeroOverlay />
    </section>
  );
}
