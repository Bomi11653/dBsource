"use client";

import { type RefObject, useEffect, useState } from "react";

/** 元素离开视口或标签页隐藏时返回 true（应暂停动画） */
export function useInViewPause(ref: RefObject<Element | null>): boolean {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const syncPaused = (intersecting: boolean) => {
      setPaused(document.hidden || !intersecting);
    };

    const observer = new IntersectionObserver(
      ([entry]) => syncPaused(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" }
    );
    observer.observe(node);

    const onVisibility = () => {
      if (document.hidden) {
        setPaused(true);
        return;
      }
      const rect = node.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      syncPaused(inView);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);

  return paused;
}
