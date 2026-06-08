"use client";

import { useI18n } from "@/components/I18nProvider";
import { useSiteData } from "@/components/SiteDataProvider";
import { smartSearch } from "@/lib/ai/smart-search";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

export default function GlobalSearch() {
  const { locale, t } = useI18n();
  const { products, cases, downloads } = useSiteData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const hits = useMemo(
    () => smartSearch(query, { products, cases, downloads }, locale),
    [query, products, cases, downloads, locale]
  );

  const hasQuery = query.trim().length > 0;
  const hasResults = hits.length > 0;

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex items-center gap-2 min-h-[36px] px-3 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        aria-label={t.nav.search}
      >
        <Search size={14} />
        <span>{t.nav.search}</span>
        <kbd className="text-[10px] text-gray-600 border border-white/10 rounded px-1">⌘K</kbd>
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
              className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden"
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
                  placeholder={t.search.placeholder}
                  className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-gray-600"
                />
                <button type="button" onClick={close} className="p-2 text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
                {!hasQuery ? (
                  <p className="text-xs text-gray-600 px-2 py-4">{t.search.placeholder}</p>
                ) : !hasResults ? (
                  <p className="text-sm text-gray-500 px-2 py-4">{t.search.noResults}</p>
                ) : (
                  <ul className="space-y-1">
                    {hits.map((hit) => (
                      <li key={`${hit.type}-${hit.id}`}>
                        <Link
                          href={hit.href}
                          onClick={close}
                          className="block px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
                        >
                          <span className="text-[10px] text-gray-600 uppercase mr-2">
                            {hit.type === "scene"
                              ? t.search.configurator
                              : hit.type === "product"
                                ? t.search.products
                                : hit.type === "case"
                                  ? t.search.cases
                                  : t.search.downloads}
                          </span>
                          {hit.title}
                          {hit.subtitle ? (
                            <span className="block text-xs text-gray-500 mt-0.5">{hit.subtitle}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
