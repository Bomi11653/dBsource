"use client";

import Link from "next/link";

export type BrowseGuideItem = {
  label: string;
  href?: string;
  targetId?: string;
};

type BrowseGuideProps = {
  title: string;
  items: BrowseGuideItem[];
  className?: string;
  /** 联系页等居中标题区用 center；详情页默认 start */
  align?: "center" | "start";
};

const CHIP_CLASS =
  "filter-chip touch-active transition shrink-0 inline-flex items-center justify-center gap-1.5 filter-chip-idle";

function GuideChip({
  item,
  onAnchor,
}: {
  item: BrowseGuideItem;
  onAnchor: (id: string) => void;
}) {
  const arrow = item.href ? "→" : "↓";

  if (item.href) {
    return (
      <Link href={item.href} className={CHIP_CLASS}>
        <span>{item.label}</span>
        <span aria-hidden className="text-white/50">
          {arrow}
        </span>
      </Link>
    );
  }

  if (item.targetId) {
    return (
      <button type="button" onClick={() => onAnchor(item.targetId!)} className={CHIP_CLASS}>
        <span>{item.label}</span>
        <span aria-hidden className="text-white/50">
          {arrow}
        </span>
      </button>
    );
  }

  return null;
}

/**
 * 全站「推荐浏览」— 手机横滑 Chip，电脑横排换行，样式与产品筛选条一致。
 */
export default function BrowseGuide({
  title,
  items,
  className = "",
  align = "start",
}: BrowseGuideProps) {
  if (!items.length) return null;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const titleClass =
    align === "center" ? "type-section-label text-center" : "type-section-label";

  const desktopAlign = align === "center" ? "md:items-center" : "";

  const chips = items.map((item) => (
    <GuideChip
      key={`${item.label}-${item.href ?? item.targetId}`}
      item={item}
      onAnchor={scrollTo}
    />
  ));

  return (
    <nav aria-label={title} className={className}>
      <div className={`flex flex-col gap-3 md:hidden ${align === "center" ? "items-stretch" : ""}`}>
        <p className={titleClass}>{title}</p>
        <div className="filter-scroll -mx-1 px-1 pb-1">{chips}</div>
      </div>

      <div className={`hidden md:flex md:flex-col md:gap-3 ${desktopAlign}`}>
        <p className={titleClass}>{title}</p>
        <div className="filter-scroll md:flex md:flex-wrap md:gap-2.5 md:overflow-visible">
          {chips}
        </div>
      </div>
    </nav>
  );
}
