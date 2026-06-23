"use client";

import { resolveBrowserMediaUrl } from "@/lib/media-url";
import Image, { type ImageProps } from "next/image";
import { useMemo } from "react";

type CmsImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** 将 Strapi 媒体 URL 规范为浏览器可访问的同源路径，并记录加载失败 */
export default function CmsImage({ src, alt, onError, ...props }: CmsImageProps) {
  const normalized = useMemo(() => resolveBrowserMediaUrl(src), [src]);

  if (!normalized) {
    return null;
  }

  return (
    <Image
      {...props}
      alt={alt}
      src={normalized}
      onError={(event) => {
        console.error("[CmsImage] failed to load:", normalized);
        onError?.(event);
      }}
    />
  );
}
