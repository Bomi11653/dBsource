"use client";

import Image, { type ImageProps } from "next/image";

type SafeImageProps = Omit<ImageProps, "fill"> & {
  /** 容器固定高度（px），防止 fill 布局在 CSS 未加载时撑满视口 */
  frameHeight?: number;
  frameWidth?: string;
};

/**
 * 带尺寸兜底的图片容器，避免 fill 图片在样式失效时变成全屏巨图
 */
export default function SafeImage({
  frameHeight = 192,
  frameWidth = "100%",
  className = "",
  alt,
  src,
  sizes,
  unoptimized,
  ...rest
}: SafeImageProps) {
  return (
    <div
      className={`relative overflow-hidden bg-zinc-900 ${className}`}
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
        className="object-cover"
        style={{ objectFit: "cover" }}
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
      className={`relative overflow-hidden bg-white p-2 ${className}`}
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
        unoptimized
        className="object-contain"
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
