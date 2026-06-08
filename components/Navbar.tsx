"use client";

import { usePageTransition } from "@/components/PageTransitionProvider";
import type { CaseType, DownloadItem, ProductSeriesGroup } from "@/data/mock";
import { CASE_TYPES, getCaseMegaLinks } from "@/lib/cases";
import {
  DOWNLOAD_TABS,
  getDownloadMegaLinks,
  type DownloadTab,
} from "@/lib/downloads";
import { useSiteData } from "@/components/SiteDataProvider";
import {
  getSubSeriesForGroupFromConfig,
  getVisibleSeriesGroups,
  seriesEntryLabel,
} from "@/lib/series-config";
import { useSeriesConfig } from "@/components/SeriesConfigProvider";
import GlobalSearch from "@/components/GlobalSearch";
import LanguageSwitch from "./LanguageSwitch";
import { useI18n } from "./I18nProvider";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type MegaMenu = "products" | "cases" | "downloads" | null;

type MegaLinkItem = { key: string; href: string; label: string };

function splitIntoMegaColumns(
  items: MegaLinkItem[],
  firstColumnCount: number,
  restColumnSize = 3
): MegaLinkItem[][] {
  if (items.length <= firstColumnCount) return [items];
  const columns: MegaLinkItem[][] = [items.slice(0, firstColumnCount)];
  const rest = items.slice(firstColumnCount);
  for (let i = 0; i < rest.length; i += restColumnSize) {
    columns.push(rest.slice(i, i + restColumnSize));
  }
  return columns;
}

function MegaMainColumn({
  exploreLabel,
  viewAllHref,
  viewAllLabel,
  onNavigate,
  children,
}: {
  exploreLabel: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  onNavigate: (e: React.MouseEvent, href: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[200px] flex flex-col self-stretch shrink-0">
      <div>
        <p className="text-[11px] text-gray-500 mb-4 tracking-wide">{exploreLabel}</p>
        {children}
      </div>
      {viewAllHref && viewAllLabel ? (
        <Link
          href={viewAllHref}
          onClick={(e) => onNavigate(e, viewAllHref)}
          className="mt-auto pt-10 text-sm text-gray-500 hover:text-white transition-colors"
        >
          {viewAllLabel}
        </Link>
      ) : null}
    </div>
  );
}

function MegaSubColumns({
  title,
  links,
  firstColumnCount,
  restColumnSize = 3,
  onNavigate,
}: {
  title: string;
  links: MegaLinkItem[];
  firstColumnCount: number;
  restColumnSize?: number;
  onNavigate: (e: React.MouseEvent, href: string) => void;
}) {
  const columns =
    links.length > firstColumnCount
      ? splitIntoMegaColumns(links, firstColumnCount, restColumnSize)
      : [links];

  return (
    <div className="flex gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-start flex-1 min-w-0">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="min-w-[160px] shrink-0">
          {columnIndex === 0 ? (
            <p className="text-[11px] text-gray-500 mb-4 tracking-wide">{title}</p>
          ) : (
            <p className="text-[11px] mb-4 tracking-wide opacity-0 select-none" aria-hidden="true">
              {title}
            </p>
          )}
          <ul className="space-y-1">
            {column.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  onClick={(e) => onNavigate(e, link.href)}
                  className="block py-1.5 text-base md:text-lg text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ProductsMegaPanel({
  activeSeries,
  onSeriesHover,
  onNavigate,
  seriesLabels,
  locale,
  t,
  seriesConfig,
  visibleGroups,
}: {
  activeSeries: ProductSeriesGroup;
  onSeriesHover: (series: ProductSeriesGroup) => void;
  onNavigate: (e: React.MouseEvent, href: string) => void;
  seriesLabels: Record<ProductSeriesGroup, string>;
  locale: "zh" | "en";
  t: ReturnType<typeof useI18n>["t"];
  seriesConfig: ReturnType<typeof useSeriesConfig>;
  visibleGroups: ProductSeriesGroup[];
}) {
  const subItems = getSubSeriesForGroupFromConfig(activeSeries, seriesConfig);
  const subLinks: MegaLinkItem[] = subItems.map((sub) => ({
    key: sub.slug,
    href: `/products?series=${sub.seriesGroup}&sub=${sub.slug}`,
    label: seriesEntryLabel(sub, locale),
  }));
  const firstColumnCount = activeSeries === "speaker" ? 5 : subLinks.length;

  return (
    <div className="flex gap-12 md:gap-16 lg:gap-20 items-stretch w-full">
      <MegaMainColumn
        exploreLabel={t.nav.megaExplore}
        viewAllHref="/products"
        viewAllLabel={t.nav.megaViewAll}
        onNavigate={onNavigate}
      >
        <ul className="space-y-1">
          {visibleGroups.map((series) => (
            <li key={series}>
              <Link
                href={`/products?series=${series}`}
                onMouseEnter={() => onSeriesHover(series)}
                onFocus={() => onSeriesHover(series)}
                onClick={(e) => onNavigate(e, `/products?series=${series}`)}
                className={`block py-1 text-xl md:text-2xl font-semibold tracking-tight transition-colors ${
                  activeSeries === series
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {seriesLabels[series]}
              </Link>
            </li>
          ))}
        </ul>
      </MegaMainColumn>

      <MegaSubColumns
        title={seriesLabels[activeSeries]}
        links={subLinks}
        firstColumnCount={firstColumnCount}
        restColumnSize={3}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function CasesMegaPanel({
  activeType,
  onTypeHover,
  onNavigate,
  caseLabels,
  locale,
  t,
}: {
  activeType: CaseType;
  onTypeHover: (type: CaseType) => void;
  onNavigate: (e: React.MouseEvent, href: string) => void;
  caseLabels: Record<CaseType, string>;
  locale: "zh" | "en";
  t: ReturnType<typeof useI18n>["t"];
}) {
  const subLinks: MegaLinkItem[] = getCaseMegaLinks(activeType, locale);
  const firstColumnCount = 3;

  return (
    <div className="flex gap-12 md:gap-16 lg:gap-20 items-stretch w-full">
      <MegaMainColumn
        exploreLabel={t.nav.megaExplore}
        viewAllHref="/cases"
        viewAllLabel={t.nav.megaViewAllCases}
        onNavigate={onNavigate}
      >
        <ul className="space-y-1">
          {CASE_TYPES.map((type) => (
            <li key={type}>
              <Link
                href={`/cases?type=${type}`}
                onMouseEnter={() => onTypeHover(type)}
                onFocus={() => onTypeHover(type)}
                onClick={(e) => onNavigate(e, `/cases?type=${type}`)}
                className={`block py-1 text-xl md:text-2xl font-semibold tracking-tight transition-colors ${
                  activeType === type ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {caseLabels[type]}
              </Link>
            </li>
          ))}
        </ul>
      </MegaMainColumn>

      <MegaSubColumns
        title={caseLabels[activeType]}
        links={subLinks}
        firstColumnCount={firstColumnCount}
        restColumnSize={2}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function DownloadsMegaPanel({
  activeTab,
  onTabHover,
  onNavigate,
  locale,
  t,
  downloads,
}: {
  activeTab: DownloadTab;
  onTabHover: (tab: DownloadTab) => void;
  onNavigate: (e: React.MouseEvent, href: string) => void;
  locale: "zh" | "en";
  t: ReturnType<typeof useI18n>["t"];
  downloads: DownloadItem[];
}) {
  const tabLabels: Record<DownloadTab, string> = {
    software: t.downloads.software,
    catalog: t.downloads.catalog,
  };
  const subLinks: MegaLinkItem[] = getDownloadMegaLinks(activeTab, locale, downloads);

  return (
    <div className="flex gap-12 md:gap-16 lg:gap-20 items-stretch w-full">
      <MegaMainColumn
        exploreLabel={t.nav.megaExplore}
        viewAllHref="/downloads"
        viewAllLabel={t.nav.megaViewAllDownloads}
        onNavigate={onNavigate}
      >
        <ul className="space-y-1">
          {DOWNLOAD_TABS.map((tab) => (
            <li key={tab}>
              <Link
                href={`/downloads?tab=${tab}`}
                onMouseEnter={() => onTabHover(tab)}
                onFocus={() => onTabHover(tab)}
                onClick={(e) => onNavigate(e, `/downloads?tab=${tab}`)}
                className={`block py-1 text-xl md:text-2xl font-semibold tracking-tight transition-colors ${
                  activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {tabLabels[tab]}
              </Link>
            </li>
          ))}
        </ul>
      </MegaMainColumn>

      <MegaSubColumns
        title={tabLabels[activeTab]}
        links={subLinks}
        firstColumnCount={subLinks.length || 1}
        restColumnSize={3}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default function Navbar() {
  const { locale, t } = useI18n();
  const { downloads } = useSiteData();
  const seriesConfig = useSeriesConfig();
  const visibleGroups = getVisibleSeriesGroups(seriesConfig);
  const pathname = usePathname();
  const { navigateWithTransition } = usePageTransition();
  const [megaOpen, setMegaOpen] = useState<MegaMenu>(null);
  const [activeProductSeries, setActiveProductSeries] = useState<ProductSeriesGroup>("speaker");
  const [activeCaseType, setActiveCaseType] = useState<CaseType>("engineering");
  const [activeDownloadTab, setActiveDownloadTab] = useState<DownloadTab>("software");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MegaMenu>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seriesLabels: Record<ProductSeriesGroup, string> = {
    speaker: t.products.seriesSpeaker,
    dsp: t.products.seriesDsp,
    software: t.products.seriesSoftware,
    engineering: t.products.seriesEngineering,
  };

  const caseLabels: Record<CaseType, string> = {
    engineering: t.nav.casesEngineering,
    performance: t.nav.casesPerformance,
  };

  const openMega = useCallback((menu: MegaMenu) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(menu);
    if (menu === "products") setActiveProductSeries("speaker");
    if (menu === "cases") setActiveCaseType("engineering");
    if (menu === "downloads") setActiveDownloadTab("software");
  }, []);

  const scheduleCloseMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(null), 140);
  }, []);

  useEffect(() => {
    setMegaOpen(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMobileSection(null);
      }
    }
    window.addEventListener("keydown", onKey);
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
    };
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    return () => {
      window.removeEventListener("keydown", onKey);
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function handleNavClick(e: React.MouseEvent, href: string) {
    const base = href.split("?")[0];
    if (pathname === base && !href.includes("?")) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setMegaOpen(null);
    setMobileOpen(false);
    navigateWithTransition(href);
  }

  function isActive(href: string) {
    const base = href.split("?")[0];
    return pathname === base || (base !== "/" && pathname.startsWith(`${base}/`));
  }

  const navLinkClass = (href: string, open?: boolean) =>
    `px-3 py-2 text-sm rounded-lg transition-colors inline-flex items-center gap-1 ${
      isActive(href) || open
        ? "text-white bg-white/10"
        : "text-gray-300 hover:text-white hover:bg-white/5"
    }`;

  const megaItems: { key: MegaMenu; href: string; label: string }[] = [
    { key: "products", href: "/products", label: t.nav.products },
    { key: "cases", href: "/cases", label: t.nav.cases },
    { key: "downloads", href: "/downloads", label: t.nav.downloads },
  ];

  const simpleLinks = [
    { href: "/", key: "home" as const },
    { href: "/about", key: "about" as const },
    { href: "/contact", key: "contact" as const },
  ];

  return (
    <header
      className="fixed top-0 w-full z-50 bg-black/45 backdrop-blur-xl border-b border-white/10 safe-top safe-x"
      onMouseLeave={scheduleCloseMega}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 md:px-10 h-[4.25rem]">
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, "/")}
          className="flex items-center shrink-0 hover:opacity-90 transition-opacity"
        >
          <Image
            src="/brand/logo.png"
            alt="dBsource"
            width={120}
            height={40}
            className="h-8 md:h-9 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "/")}
            className={navLinkClass("/")}
          >
            {t.nav.home}
          </Link>

          {megaItems.map((item) => (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => openMega(item.key)}
            >
              <Link
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={navLinkClass(item.href, megaOpen === item.key)}
              >
                {item.label}
                <span className="text-[10px] opacity-50">▾</span>
              </Link>
            </div>
          ))}

          {simpleLinks.slice(1, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={navLinkClass(link.href)}
            >
              {t.nav[link.key]}
            </Link>
          ))}

          {simpleLinks.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={navLinkClass(link.href)}
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <GlobalSearch />
          <LanguageSwitch />
          <button
            type="button"
            className="lg:hidden touch-target touch-active flex items-center justify-center rounded-lg border border-white/20 text-white"
            onClick={() => {
              setMobileOpen((v) => !v);
              if (mobileOpen) setMobileSection(null);
            }}
            aria-label={mobileOpen ? t.nav.menuClose : t.nav.menuOpen}
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              {mobileOpen ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {megaOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block absolute left-0 right-0 top-full border-t border-white/10 bg-[#1d1d1f]/95 backdrop-blur-2xl"
            onMouseEnter={() => openMega(megaOpen)}
          >
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
              {megaOpen === "products" && (
                <ProductsMegaPanel
                  activeSeries={activeProductSeries}
                  onSeriesHover={setActiveProductSeries}
                  onNavigate={handleNavClick}
                  seriesLabels={seriesLabels}
                  locale={locale}
                  t={t}
                  seriesConfig={seriesConfig}
                  visibleGroups={visibleGroups}
                />
              )}

              {megaOpen === "cases" && (
                <CasesMegaPanel
                  activeType={activeCaseType}
                  onTypeHover={setActiveCaseType}
                  onNavigate={handleNavClick}
                  caseLabels={caseLabels}
                  locale={locale}
                  t={t}
                />
              )}

              {megaOpen === "downloads" && (
                <DownloadsMegaPanel
                  activeTab={activeDownloadTab}
                  onTabHover={setActiveDownloadTab}
                  onNavigate={handleNavClick}
                  locale={locale}
                  t={t}
                  downloads={downloads}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
              aria-label={t.nav.menuClose}
              onClick={() => {
                setMobileOpen(false);
                setMobileSection(null);
              }}
            />
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden relative z-50 overflow-hidden border-t border-white/10 bg-black/95"
          >
            <div className="mobile-nav-scroll px-4 sm:px-6 py-3 safe-bottom text-sm">
              <Link
                href="/"
                onClick={(e) => handleNavClick(e, "/")}
                className="flex items-center min-h-[44px] py-2 text-base touch-active"
              >
                {t.nav.home}
              </Link>
              <Link
                href="/about"
                onClick={(e) => handleNavClick(e, "/about")}
                className="flex items-center min-h-[44px] py-2 text-base touch-active"
              >
                {t.nav.about}
              </Link>

              {(
                [
                  { key: "products" as const, href: "/products", label: t.nav.products },
                  { key: "cases" as const, href: "/cases", label: t.nav.cases },
                  { key: "downloads" as const, href: "/downloads", label: t.nav.downloads },
                ] as const
              ).map((section) => (
                <div key={section.key} className="border-t border-white/10">
                  <div className="flex items-center">
                    <Link
                      href={section.href}
                      onClick={(e) => handleNavClick(e, section.href)}
                      className="flex-1 flex items-center min-h-[44px] py-2 text-base font-medium touch-active"
                    >
                      {section.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileSection((prev) =>
                          prev === section.key ? null : section.key
                        )
                      }
                      aria-expanded={mobileSection === section.key}
                      aria-label={`${section.label} submenu`}
                      className="touch-target touch-active flex items-center justify-center text-gray-400"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                        className={`transition-transform duration-200 ${
                          mobileSection === section.key ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M4 6l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  {mobileSection === section.key && (
                    <div className="pb-3 pl-3 space-y-0.5">
                      {section.key === "products" &&
                        visibleGroups.map((s) => (
                          <div key={s}>
                            <Link
                              href={`/products?series=${s}`}
                              onClick={(e) => handleNavClick(e, `/products?series=${s}`)}
                              className="flex items-center min-h-[40px] py-2 text-gray-300 font-medium touch-active"
                            >
                              {seriesLabels[s]}
                            </Link>
                            {getSubSeriesForGroupFromConfig(s, seriesConfig).map((sub) => (
                              <Link
                                key={sub.slug}
                                href={`/products?series=${sub.seriesGroup}&sub=${sub.slug}`}
                                onClick={(e) =>
                                  handleNavClick(
                                    e,
                                    `/products?series=${sub.seriesGroup}&sub=${sub.slug}`
                                  )
                                }
                                className="flex items-center min-h-[44px] py-2 pl-4 text-gray-400 text-sm touch-active"
                              >
                                {seriesEntryLabel(sub, locale)}
                              </Link>
                            ))}
                          </div>
                        ))}
                      {section.key === "cases" &&
                        CASE_TYPES.map((c) => (
                          <div key={c}>
                            <Link
                              href={`/cases?type=${c}`}
                              onClick={(e) => handleNavClick(e, `/cases?type=${c}`)}
                              className="flex items-center min-h-[40px] py-2 text-gray-300 font-medium touch-active"
                            >
                              {caseLabels[c]}
                            </Link>
                            {getCaseMegaLinks(c, locale).map((sub) => (
                              <Link
                                key={sub.key}
                                href={sub.href}
                                onClick={(e) => handleNavClick(e, sub.href)}
                                className="flex items-center min-h-[44px] py-2 pl-4 text-gray-400 text-sm touch-active"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      {section.key === "downloads" &&
                        DOWNLOAD_TABS.map((tab) => (
                          <div key={tab}>
                            <Link
                              href={`/downloads?tab=${tab}`}
                              onClick={(e) => handleNavClick(e, `/downloads?tab=${tab}`)}
                              className="flex items-center min-h-[40px] py-2 text-gray-300 font-medium touch-active"
                            >
                              {tab === "software" ? t.downloads.software : t.downloads.catalog}
                            </Link>
                            {getDownloadMegaLinks(tab, locale, downloads).map((sub) => (
                              <Link
                                key={sub.key}
                                href={sub.href}
                                onClick={(e) => handleNavClick(e, sub.href)}
                                className="flex items-center min-h-[44px] py-2 pl-4 text-gray-400 text-sm touch-active"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}

              <Link
                href="/contact"
                onClick={(e) => handleNavClick(e, "/contact")}
                className="flex items-center min-h-[44px] py-2 text-base border-t border-white/10 touch-active"
              >
                {t.nav.contact}
              </Link>
            </div>
          </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
