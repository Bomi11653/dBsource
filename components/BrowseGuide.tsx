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
  layout?: "stack" | "scroll" | "auto";
  /** minimal：手机纯文字纵向；平板以上恢复胶囊按钮 */
  variant?: "chips" | "minimal" | "auto";
};

function GuideLink({
  item,
  onAnchor,
  minimal,
}: {
  item: BrowseGuideItem;
  onAnchor: (id: string) => void;
  minimal: boolean;
}) {
  const chipClass =
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 min-h-[44px] text-sm text-gray-300 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white touch-active w-full md:w-auto";

  const minimalClass =
    "inline-flex items-center justify-center gap-1 min-h-[44px] px-3 text-sm text-gray-400 transition-colors hover:text-white touch-active";

  const className = minimal ? minimalClass : chipClass;
  const arrow = item.href ? "→" : "↓";

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        <span>{item.label}</span>
        <span aria-hidden className={minimal ? "text-white/40" : "text-white/50"}>
          {arrow}
        </span>
      </Link>
    );
  }

  if (item.targetId) {
    return (
      <button type="button" onClick={() => onAnchor(item.targetId!)} className={className}>
        <span>{item.label}</span>
        <span aria-hidden className={minimal ? "text-white/40" : "text-white/50"}>
          {arrow}
        </span>
      </button>
    );
  }

  return null;
}

export default function BrowseGuide({
  title,
  items,
  className = "",
  layout = "auto",
  variant = "auto",
}: BrowseGuideProps) {
  if (!items.length) return null;

  const stacked = layout === "stack" || (layout === "auto" && items.length <= 3);
  const heroMinimal = variant === "minimal" && stacked;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (heroMinimal) {
    return (
      <nav
        aria-label={title}
        className={`pointer-events-auto ${className}`}
      >
        {/* 手机：纯文字纵向，间距均匀 */}
        <div className="flex flex-col items-center md:hidden">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500 text-center min-h-[44px] flex items-center">
            {title}
          </p>
          <ul className="flex flex-col items-center w-full">
            {items.map((item) => (
              <li key={`${item.label}-${item.href ?? item.targetId}`} className="flex justify-center w-full">
                <GuideLink item={item} onAnchor={scrollTo} minimal />
              </li>
            ))}
          </ul>
        </div>

        {/* 平板以上：胶囊按钮 */}
        <div className="hidden md:flex md:flex-col md:gap-3 md:items-center">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{title}</p>
          <div className="flex flex-row flex-wrap justify-center items-center gap-2.5">
            {items.map((item) => (
              <GuideLink
                key={`${item.label}-${item.href ?? item.targetId}-md`}
                item={item}
                onAnchor={scrollTo}
                minimal={false}
              />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label={title} className={`flex flex-col gap-3 ${className}`}>
      <p
        className={`text-xs uppercase tracking-[0.28em] text-gray-500 ${
          stacked ? "text-center md:text-inherit" : "text-left"
        }`}
      >
        {title}
      </p>
      <div
        className={
          stacked
            ? "flex flex-col items-stretch gap-2 w-full max-w-[260px] mx-auto md:max-w-none md:flex-row md:flex-wrap md:justify-center md:items-center md:gap-2.5"
            : "filter-scroll md:flex md:flex-wrap md:justify-start md:gap-2.5 md:overflow-visible"
        }
      >
        {items.map((item) => (
          <GuideLink
            key={`${item.label}-${item.href ?? item.targetId}`}
            item={item}
            onAnchor={scrollTo}
            minimal={false}
          />
        ))}
      </div>
    </nav>
  );
}
