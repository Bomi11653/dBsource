"use client";

import { useI18n } from "@/components/I18nProvider";
import SearchSuggestList from "@/components/SearchSuggestList";
import { useSiteData } from "@/components/SiteDataProvider";
import { rankSearch } from "@/lib/search/rank-search";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function GlobalSearch({
  onOpen,
}: {
  /** 打开搜索时回调（如关闭手机抽屉） */
  onOpen?: () => void;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { products, cases, downloads } = useSiteData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) onOpen?.();
          return next;
        });
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const hits = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return [];
    return rankSearch(q, { products, cases, downloads }, locale, 10);
  }, [debouncedQuery, products, cases, downloads, locale]);

  const hasQuery = query.trim().length > 0;
  const isPending = query.trim() !== debouncedQuery.trim();
  const hasResults = hits.length > 0;

  const close = useCallback(() => setOpen(false), []);

  const openSearch = useCallback(() => {
    onOpen?.();
    setOpen(true);
  }, [onOpen]);

  const searchLabels = {
    configurator: t.search.configurator,
    products: t.search.products,
    cases: t.search.cases,
    downloads: t.search.downloads,
    scene: locale === "zh" ? "应用场景" : "Scenes",
  };

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="hidden lg:inline-flex items-center gap-2 min-h-[36px] px-3 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        aria-label={t.nav.search}
      >
        <Search size={14} />
        <span>{t.nav.search}</span>
        <kbd className="text-[10px] text-gray-600 border border-white/10 rounded px-1">⌘K</kbd>
      </button>

      <button
        type="button"
        onClick={openSearch}
        className="lg:hidden touch-target touch-active flex items-center justify-center rounded-lg border border-white/20 text-white"
        aria-label={t.nav.search}
      >
        <Search size={20} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-label={t.cases.galleryClose}
              onClick={close}
            />
            <motion.div
              className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden safe-x"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
            >
              <div className="flex items-center gap-3 px-4 border-b border-white/10">
                <Search size={18} className="text-gray-500 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && hits.length > 0) {
                      e.preventDefault();
                      const href = hits[0].href;
                      close();
                      router.push(href);
                    }
                  }}
                  placeholder={t.search.placeholder}
                  className="flex-1 bg-transparent py-4 text-base sm:text-sm outline-none placeholder:text-gray-600"
                />
                <button type="button" onClick={close} className="p-2 text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[min(60vh,calc(100dvh-8rem))] overflow-y-auto p-3 space-y-4 safe-bottom">
                {!hasQuery ? (
                  <p className="text-xs text-gray-600 px-2 py-4">{t.search.placeholder}</p>
                ) : isPending ? (
                  <p className="text-xs text-gray-600 px-2 py-4">…</p>
                ) : !hasResults ? (
                  <p className="text-sm text-gray-500 px-2 py-4">{t.search.noResults}</p>
                ) : (
                  <SearchSuggestList
                    hits={hits}
                    labels={searchLabels}
                    onNavigate={close}
                    className="py-0"
                    itemClassName="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
