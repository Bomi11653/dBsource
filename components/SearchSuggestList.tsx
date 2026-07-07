"use client";

import type { SmartSearchHit } from "@/lib/search/rank-search";
import Link from "next/link";

type SearchSuggestListProps = {
  hits: SmartSearchHit[];
  labels: {
    configurator: string;
    products: string;
    cases: string;
    downloads: string;
    scene: string;
  };
  onNavigate?: () => void;
  variant?: "hero" | "global";
  className?: string;
  itemClassName?: string;
};

const VARIANT_LIST_CLASS: Record<NonNullable<SearchSuggestListProps["variant"]>, string> = {
  hero: "max-h-[200px] sm:max-h-[240px] overflow-y-auto overscroll-contain py-1",
  global: "max-h-72 overflow-y-auto py-1.5",
};

function typeLabel(hit: SmartSearchHit, labels: SearchSuggestListProps["labels"]) {
  if (hit.type === "scene") {
    const sub = hit.subtitle?.toLowerCase() ?? "";
    if (sub.includes("系列") || sub.includes("series") || sub.includes("product series")) {
      return labels.scene;
    }
    return labels.configurator;
  }
  if (hit.type === "product") return labels.products;
  if (hit.type === "case") return labels.cases;
  return labels.downloads;
}

export default function SearchSuggestList({
  hits,
  labels,
  onNavigate,
  variant = "global",
  className = "",
  itemClassName = "block px-4 py-2.5 hover:bg-white/5 transition-colors",
}: SearchSuggestListProps) {
  return (
    <ul className={`${VARIANT_LIST_CLASS[variant]} ${className}`.trim()}>
      {hits.map((hit) => (
        <li key={`${hit.type}-${hit.id}`}>
          <Link href={hit.href} onClick={onNavigate} className={itemClassName}>
            <span className="text-[10px] text-gray-600 uppercase mr-2">
              {typeLabel(hit, labels)}
            </span>
            <span className="text-sm text-white">{hit.title}</span>
            {hit.subtitle ? (
              <span className="block text-xs text-gray-500 mt-0.5 line-clamp-1">{hit.subtitle}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
