 "use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

const LOGO_SRC = "/brand/logo.png";
const CMS_BASE = (process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337").replace(/\/$/, "");

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
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);

  useEffect(() => {
    let mounted = true;
    fetch(`${CMS_BASE}/api/global-setting?populate[logo][fields][0]=url`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!mounted || !json?.data) return;
        const raw = json.data.logo?.url as string | undefined;
        if (!raw) return;
        const next = raw.startsWith("http")
          ? raw
          : `${CMS_BASE}${raw.startsWith("/") ? "" : "/"}${raw}`;
        setLogoSrc(next || LOGO_SRC);
      })
      .catch(() => {
        /* fallback to local logo */
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Image
      src={logoSrc}
      alt="dBsource"
      width={width}
      height={height}
      className={cn(variantClass, className)}
      priority={priority}
    />
  );
}
