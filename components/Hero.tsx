"use client";

import ShaderHero from "@/components/ShaderHero";
import HeroOverlay from "@/components/HeroOverlay";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";
import { useInViewPause } from "@/lib/use-in-view-pause";
import { useRef } from "react";

export default function Hero() {
  const { resolvedMode } = usePerformanceMode();
  const heroRef = useRef<HTMLDivElement>(null);
  const paused = useInViewPause(heroRef);

  return (
    <section ref={heroRef} className="hero-viewport">
      <div className="absolute inset-0 z-0">
        {resolvedMode === "lite" ? (
          <div
            className={`hero-wave-fallback h-full w-full${paused ? " hero-wave-paused" : ""}`}
          />
        ) : (
          <ShaderHero paused={paused} />
        )}
      </div>
      <HeroOverlay />
    </section>
  );
}
