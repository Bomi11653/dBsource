"use client";

import CmsImage from "@/components/CmsImage";
import type { ReactNode } from "react";

type AboutZoomableImageProps = {
  src: string;
  alt: string;
  onOpen: () => void;
  sizes: string;
  containerClassName?: string;
  imageClassName?: string;
  overlay?: ReactNode;
};

export default function AboutZoomableImage({
  src,
  alt,
  onOpen,
  sizes,
  containerClassName = "",
  imageClassName = "object-cover object-center",
  overlay,
}: AboutZoomableImageProps) {
  return (
    <div
      className={`group relative overflow-hidden border border-white/5 ${containerClassName}`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-[2] cursor-zoom-in touch-active"
        aria-label={alt}
      />
      <CmsImage
        src={src}
        alt={alt}
        fill
        className={`${imageClassName} pointer-events-none transition-transform duration-500 md:group-hover:scale-105`}
        sizes={sizes}
      />
      {overlay}
      <span className="pointer-events-none absolute bottom-3 right-3 z-[1] rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] tracking-wider text-white/70 opacity-0 transition-opacity md:group-hover:opacity-100">
        +
      </span>
    </div>
  );
}
