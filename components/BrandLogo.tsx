import { cn } from "@/lib/utils";
import Image from "next/image";

const LOGO_SRC = "/brand/logo.png";

const variants = {
  nav: {
    width: 72,
    height: 108,
    className: "h-9 md:h-10 w-auto object-contain",
  },
  hero: {
    width: 70,
    height: 105,
    className:
      "h-[2.25rem] sm:h-12 md:h-14 lg:h-16 w-auto object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.12)]",
  },
  transition: {
    width: 80,
    height: 120,
    className: "h-14 md:h-[4.5rem] w-auto object-contain",
  },
  admin: {
    width: 56,
    height: 84,
    className: "h-9 w-auto object-contain",
  },
} as const;

export type BrandLogoVariant = keyof typeof variants;

export default function BrandLogo({
  variant = "nav",
  className,
  priority,
}: {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const { width, height, className: variantClass } = variants[variant];

  return (
    <Image
      src={LOGO_SRC}
      alt="dBsource"
      width={width}
      height={height}
      className={cn(variantClass, className)}
      priority={priority}
    />
  );
}
