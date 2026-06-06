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
};

function GuideChip({
  item,
  onAnchor,
}: {
  item: BrowseGuideItem;
  onAnchor: (id: string) => void;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white";

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        <span>{item.label}</span>
        <span aria-hidden className="text-white/50">
          →
        </span>
      </Link>
    );
  }

  if (item.targetId) {
    return (
      <button
        type="button"
        onClick={() => onAnchor(item.targetId!)}
        className={className}
      >
        <span>{item.label}</span>
        <span aria-hidden className="text-white/50">
          ↓
        </span>
      </button>
    );
  }

  return null;
}

export default function BrowseGuide({ title, items, className = "" }: BrowseGuideProps) {
  if (!items.length) return null;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label={title}
      className={`flex flex-col gap-3 ${className}`}
    >
      <p className="text-[11px] uppercase tracking-[0.32em] text-gray-500">{title}</p>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => (
          <GuideChip
            key={`${item.label}-${item.href ?? item.targetId}`}
            item={item}
            onAnchor={scrollTo}
          />
        ))}
      </div>
    </nav>
  );
}
