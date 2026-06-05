"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface ImageLightboxProps {
  images: string[];
  altPrefix: string;
  openIndex: number | null;
  onClose: () => void;
  labels?: {
    close: string;
    prev: string;
    next: string;
  };
}

export default function ImageLightbox({
  images,
  altPrefix,
  openIndex,
  onClose,
  labels = { close: "关闭", prev: "上一张", next: "下一张" },
}: ImageLightboxProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (openIndex !== null) setIndex(openIndex);
  }, [openIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openIndex, onClose, goPrev, goNext]);

  return (
    <AnimatePresence>
      {openIndex !== null && images[index] && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={altPrefix}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 px-4 md:px-16"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors text-2xl leading-none"
            aria-label={labels.close}
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 md:left-8 z-10 w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-white/80 hover:text-white hover:border-brand-gold/50 transition-colors text-2xl"
                aria-label={labels.prev}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 md:right-8 z-10 w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-white/80 hover:text-white hover:border-brand-gold/50 transition-colors text-2xl"
                aria-label={labels.next}
              >
                ›
              </button>
            </>
          )}

          <motion.div
            key={images[index]}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-6xl aspect-[4/3] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[index]}
              alt={`${altPrefix} ${index + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </motion.div>

          {images.length > 1 && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-400 tracking-wider">
              {index + 1} / {images.length}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
