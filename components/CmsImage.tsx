"use client";

import { useCmsImageState } from "@/lib/use-cms-image";
import Image, { type ImageProps } from "next/image";

type CmsImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** Strapi 媒体图：规范化 /strapi-uploads 路径，微信内 unoptimized + 失败重试 */
export default function CmsImage({
  src,
  alt,
  onError,
  loading,
  unoptimized,
  priority,
  ...props
}: CmsImageProps) {
  const { displaySrc, imageKey, handleError, preferUnoptimized } =
    useCmsImageState(src);

  if (!displaySrc) {
    return null;
  }

  return (
    <Image
      key={imageKey}
      {...props}
      alt={alt}
      src={displaySrc}
      unoptimized={unoptimized ?? preferUnoptimized}
      loading={loading ?? (priority ? "eager" : "lazy")}
      priority={priority}
      onError={(event) => {
        handleError();
        onError?.(event);
      }}
    />
  );
}
