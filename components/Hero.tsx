import ShaderHero from "@/components/ShaderHero";
import HeroOverlay from "@/components/HeroOverlay";

export default function Hero() {
  return (
    <div className="relative h-screen-safe w-full">
      <ShaderHero />
      <HeroOverlay />
    </div>
  );
}
