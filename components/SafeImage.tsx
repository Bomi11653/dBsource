"use client";

import { useCmsImageState } from "@/lib/use-cms-image";
import Image, { type ImageProps } from "next/image";

type FitMode = "cover" | "contain";

type SafeImageProps = Omit<ImageProps, "fill"> & {
  frameHeight?: number;
  frameWidth?: string;
  fit?: FitMode;
  desktopFit?: FitMode;
  frameClassName?: string;
  imageClassName?: string;
};

function fitClasses(mobile: FitMode, desktop?: FitMode): string {
  const d = desktop ?? mobile;
  if (mobile === d) {
    return mobile === "contain" ? "object-contain" : "object-cover";
  }
  const mobileClass = mobile === "contain" ? "object-contain" : "object-cover";
  const desktopClass = d === "contain" ? "md:object-contain" : "md:object-cover";
  return `${mobileClass} ${desktopClass}`;
}

function CmsFillImage({
  alt,
  sizes,
  className,
  rawSrc,
  unoptimized,
  loading,
  priority,
  ...rest
}: Omit<ImageProps, "src" | "fill"> & { rawSrc: string }) {
  const { displaySrc, imageKey, handleError, preferUnoptimized, preferEager } =
    useCmsImageState(rawSrc);

  if (!displaySrc) return null;

  return (
    <Image
      key={imageKey}
      src={displaySrc}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={unoptimized ?? preferUnoptimized}
      loading={loading ?? (preferEager || priority ? "eager" : undefined)}
      priority={priority}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}

export default function SafeImage({
  frameHeight = 192,
  frameWidth = "100%",
  fit = "cover",
  desktopFit,
  frameClassName = "bg-zinc-900",
  imageClassName = "",
  className = "",
  alt,
  src,
  sizes,
  unoptimized,
  loading,
  priority,
  ...rest
}: SafeImageProps) {
  const objectFitClass = `${fitClasses(fit, desktopFit)} object-center`;
  const rawSrc = typeof src === "string" ? src : "";

  if (!rawSrc) return null;

  return (
    <div
      className={`relative overflow-hidden ${frameClassName} ${className}`}
      style={{
        position: "relative",
        width: frameWidth,
        height: frameHeight,
        minHeight: frameHeight,
        overflow: "hidden",
      }}
    >
      <CmsFillImage
        rawSrc={rawSrc}
        alt={alt}
        sizes={sizes}
        unoptimized={unoptimized}
        loading={loading}
        priority={priority}
        className={`${objectFitClass} ${imageClassName}`.trim()}
        {...rest}
      />
    </div>
  );
}

export function SafeImageContain({
  size = 96,
  alt,
  src,
  className = "",
  priority,
}: {
  size?: number;
  alt: string;
  src: string;
  className?: string;
  priority?: boolean;
}) {
  const rawSrc = typeof src === "string" ? src : "";
  if (!rawSrc) return null;

  return (
    <div
      className={`relative overflow-hidden bg-zinc-900 p-1 ${className}`}
      style={{
        position: "relative",
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        overflow: "hidden",
      }}
    >
      <CmsFillImage
        rawSrc={rawSrc}
        alt={alt}
        sizes={`${size}px`}
        priority={priority}
        className="object-contain object-center"
      />
    </div>
  );
}

export function SafeImageAspect({
  aspectClassName = "aspect-[4/3]",
  minHeightClassName = "min-h-[220px] md:min-h-0",
  fit = "contain" as FitMode,
  desktopFit,
  frameClassName = "bg-zinc-900",
  imageClassName = "",
  className = "",
  alt,
  src,
  sizes,
  unoptimized,
  loading,
  priority,
  ...rest
}: Omit<SafeImageProps, "frameHeight" | "frameWidth"> & {
  aspectClassName?: string;
  minHeightClassName?: string;
}) {
  const objectFitClass = `${fitClasses(fit, desktopFit)} object-center`;
  const rawSrc = typeof src === "string" ? src : "";
  if (!rawSrc) return null;

  return (
    <div
      className={`relative w-full overflow-hidden ${aspectClassName} ${minHeightClassName} ${frameClassName} ${className}`}
    >
      <CmsFillImage
        rawSrc={rawSrc}
        alt={alt}
        sizes={sizes}
        unoptimized={unoptimized}
        loading={loading}
        priority={priority}
        className={`${objectFitClass} ${imageClassName}`.trim()}
        {...rest}
      />
    </div>
  );
}
