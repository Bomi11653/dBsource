"use client";

import { useI18n } from "@/components/I18nProvider";
import SearchSuggestList from "@/components/SearchSuggestList";
import { useSiteData } from "@/components/SiteDataProvider";
import { rankSearch } from "@/lib/search/rank-search";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const HERO_DISPLAY_LIMIT_DESKTOP = 5;
const HERO_DISPLAY_LIMIT_MOBILE = 4;

const COPY = {
  zh: {
    placeholder: "搜索产品、应用方案、案例或技术资料...",
    noResults: "未找到相关内容，去产品中心看看",
    submit: "搜索",
    scene: "应用场景",
  },
  en: {
    placeholder: "Search products, solutions, cases or resources...",
    noResults: "No matches — browse the product center",
    submit: "Search",
    scene: "Scenes",
  },
} as const;

/** 首页 Hero 长条搜索框：内联智能搜索，回车跳转首个结果 */
export default function HeroSearchBar() {
  const { locale, t } = useI18n();
  const copy = COPY[locale];
  const { products, cases, downloads } = useSiteData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [focused, setFocused] = useState(false);
  const [mobile, setMobile] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const displayLimit = mobile ? HERO_DISPLAY_LIMIT_MOBILE : HERO_DISPLAY_LIMIT_DESKTOP;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const hits = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return [];
    return rankSearch(q, { products, cases, downloads }, locale, 10);
  }, [debouncedQuery, products, cases, downloads, locale]);

  const displayHits = useMemo(() => hits.slice(0, displayLimit), [hits, displayLimit]);

  const hasQuery = query.trim().length > 0;
  const showDropdown = focused && hasQuery;

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function submit() {
    const q = query.trim();
    if (!q) return;
    const submitHits = rankSearch(q, { products, cases, downloads }, locale, 10);
    const first = submitHits[0];
    if (first) {
      router.push(first.href);
    } else {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
    setFocused(false);
  }

  const searchLabels = {
    configurator: t.search.configurator,
    products: t.search.products,
    cases: t.search.cases,
    downloads: t.search.downloads,
    scene: copy.scene,
  };

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto relative z-[60] w-full max-w-2xl mx-auto mt-6 sm:mt-8 overflow-visible"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={`flex items-center gap-3 rounded-full border bg-black/55 backdrop-blur-xl pl-5 pr-2 py-2 transition-colors duration-300 ${
          focused ? "border-white/40" : "border-white/15 hover:border-white/30"
        }`}
      >
        <Search size={17} className="text-gray-400 shrink-0" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={copy.placeholder}
          aria-label={copy.submit}
          className="flex-1 min-w-0 appearance-none border-0 bg-transparent p-0 min-h-[44px] text-sm text-white placeholder:text-gray-500 outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none"
        />
        <button
          type="submit"
          aria-label={copy.submit}
          className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-gray-300 hover:bg-white hover:text-black hover:border-white transition-colors touch-active"
        >
          <ArrowRight size={16} />
        </button>
      </form>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[25] w-full max-h-[220px] sm:max-h-[260px] rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden text-left">
          {displayHits.length === 0 ? (
            <Link
              href={`/products?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setFocused(false)}
              className="block px-4 py-3.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {copy.noResults} →
            </Link>
          ) : (
            <SearchSuggestList
              hits={displayHits}
              labels={searchLabels}
              variant="hero"
              onNavigate={() => setFocused(false)}
              itemClassName="block px-4 py-2 hover:bg-white/5 transition-colors"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
