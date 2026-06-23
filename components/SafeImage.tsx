"use client";

import Image, { type ImageProps } from "next/image";

type FitMode = "cover" | "contain";

type SafeImageProps = Omit<ImageProps, "fill"> & {
  /** 容器固定高度（px），防止 fill 布局在 CSS 未加载时撑满视口 */
  frameHeight?: number;
  frameWidth?: string;
  /** 移动端与桌面端 object-fit（默认 cover） */
  fit?: FitMode;
  desktopFit?: FitMode;
  frameClassName?: string;
  /** 仅作用于 Image 元素 */
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

/**
 * 带尺寸兜底的图片容器，避免 fill 图片在样式失效时变成全屏巨图
 */
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
  ...rest
}: SafeImageProps) {
  const objectFitClass = `${fitClasses(fit, desktopFit)} object-center`;

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
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={unoptimized}
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
}: {
  size?: number;
  alt: string;
  src: string;
  className?: string;
}) {
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
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-contain object-center"
      />
    </div>
  );
}

/** 响应式宽高比图片框（推荐用于产品/案例卡片） */
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
  ...rest
}: Omit<SafeImageProps, "frameHeight" | "frameWidth"> & {
  aspectClassName?: string;
  minHeightClassName?: string;
}) {
  const objectFitClass = `${fitClasses(fit, desktopFit)} object-center`;

  return (
    <div
      className={`relative w-full overflow-hidden ${aspectClassName} ${minHeightClassName} ${frameClassName} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={unoptimized}
        className={`${objectFitClass} ${imageClassName}`.trim()}
        {...rest}
      />
    </div>
  );
}
