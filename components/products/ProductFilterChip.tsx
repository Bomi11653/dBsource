"use client";

import type { ReactNode } from "react";

/** 产品中心筛选 Chip — 工程/流动大类与系列 Tab 共用样式 */
export default function ProductFilterChip({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-chip touch-active transition shrink-0 inline-flex items-center justify-center ${
        active ? "filter-chip-active" : "filter-chip-idle"
      } ${className}`}
    >
      {children}
    </button>
  );
}
