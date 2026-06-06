"use client";

import { usePageTransition } from "@/components/PageTransitionProvider";
import type { CaseType, ProductSeriesGroup } from "@/data/mock";
import { CASE_TYPES, getCaseMegaLinks } from "@/lib/cases";
import {
  DOWNLOAD_TABS,
  downloadSubCategoryLabel,
  getDownloadSubCategoriesForTab,
  type DownloadTab,
} from "@/lib/downloads";
import {
  getSubSeriesForGroup,
  PRODUCT_SERIES_GROUPS,
  subSeriesLabel,
} from "@/lib/products";
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
}: {
  activeSeries: ProductSeriesGroup;
  onSeriesHover: (series: ProductSeriesGroup) => void;
  onNavigate: (e: React.MouseEvent, href: string) => void;
  seriesLabels: Record<ProductSeriesGroup, string>;
  locale: "zh" | "en";
  t: ReturnType<typeof useI18n>["t"];
}) {
  const subItems = getSubSeriesForGroup(activeSeries);
  const subLinks: MegaLinkItem[] = subItems.map((sub) => ({
    key: sub.slug,
    href: `/products?series=${sub.seriesGroup}&sub=${sub.slug}`,
    label: subSeriesLabel(sub, locale),
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
          {PRODUCT_SERIES_GROUPS.map((series) => (
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
}: {
  activeTab: DownloadTab;
  onTabHover: (tab: DownloadTab) => void;
  onNavigate: (e: React.MouseEvent, href: string) => void;
  locale: "zh" | "en";
  t: ReturnType<typeof useI18n>["t"];
}) {
  const subItems = getDownloadSubCategoriesForTab(activeTab);
  const tabLabels: Record<DownloadTab, string> = {
    software: t.downloads.software,
    catalog: t.downloads.catalog,
  };
  const subLinks: MegaLinkItem[] = subItems.map((sub) => ({
    key: sub.slug,
    href: `/downloads?tab=${sub.tab}&sub=${sub.slug}`,
    label: downloadSubCategoryLabel(sub, locale),
  }));

  return (
    <div className="flex gap-12 md:gap-16 lg:gap-20 items-stretch w-full">
      <MegaMainColumn exploreLabel={t.nav.megaExplore} onNavigate={onNavigate}>
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
        firstColumnCount={2}
        restColumnSize={2}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default function Navbar() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const { navigateWithTransition } = usePageTransition();
  const [megaOpen, setMegaOpen] = useState<MegaMenu>(null);
  const [activeProductSeries, setActiveProductSeries] = useState<ProductSeriesGroup>("speaker");
  const [activeCaseType, setActiveCaseType] = useState<CaseType>("engineering");
  const [activeDownloadTab, setActiveDownloadTab] = useState<DownloadTab>("software");
  const [mobileOpen, setMobileOpen] = useState(false);
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
  }, [pathname]);

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
      className="fixed top-0 w-full z-50 bg-black/45 backdrop-blur-xl border-b border-white/10"
      onMouseLeave={scheduleCloseMega}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-10 h-[4.25rem]">
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
          <LanguageSwitch />
          <button
            type="button"
            className="lg:hidden text-xs border border-white/20 px-3 py-1.5 rounded"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? "✕" : "☰"}
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
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-white/10 bg-black/95"
          >
            <div className="px-6 py-4 space-y-4 text-sm">
              <Link href="/" onClick={(e) => handleNavClick(e, "/")} className="block py-2">
                {t.nav.home}
              </Link>
              <Link href="/about" onClick={(e) => handleNavClick(e, "/about")} className="block py-2">
                {t.nav.about}
              </Link>
              <div>
                <Link href="/products" onClick={(e) => handleNavClick(e, "/products")} className="block py-2 font-medium">
                  {t.nav.products}
                </Link>
                {PRODUCT_SERIES_GROUPS.map((s) => (
                  <div key={s}>
                    <Link
                      href={`/products?series=${s}`}
                      onClick={(e) => handleNavClick(e, `/products?series=${s}`)}
                      className="block py-2 pl-3 text-gray-300 font-medium"
                    >
                      {seriesLabels[s]}
                    </Link>
                    {getSubSeriesForGroup(s).map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/products?series=${sub.seriesGroup}&sub=${sub.slug}`}
                        onClick={(e) =>
                          handleNavClick(
                            e,
                            `/products?series=${sub.seriesGroup}&sub=${sub.slug}`
                          )
                        }
                        className="block py-1.5 pl-6 text-gray-500 text-xs"
                      >
                        {subSeriesLabel(sub, locale)}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <div>
                <Link href="/cases" onClick={(e) => handleNavClick(e, "/cases")} className="block py-2 font-medium">
                  {t.nav.cases}
                </Link>
                {CASE_TYPES.map((c) => (
                  <div key={c}>
                    <Link
                      href={`/cases?type=${c}`}
                      onClick={(e) => handleNavClick(e, `/cases?type=${c}`)}
                      className="block py-2 pl-3 text-gray-300 font-medium"
                    >
                      {caseLabels[c]}
                    </Link>
                    {getCaseMegaLinks(c, locale).map((sub) => (
                      <Link
                        key={sub.key}
                        href={sub.href}
                        onClick={(e) => handleNavClick(e, sub.href)}
                        className="block py-1.5 pl-6 text-gray-500 text-xs"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <div>
                <Link href="/downloads" onClick={(e) => handleNavClick(e, "/downloads")} className="block py-2 font-medium">
                  {t.nav.downloads}
                </Link>
                {DOWNLOAD_TABS.map((tab) => (
                  <div key={tab}>
                    <Link
                      href={`/downloads?tab=${tab}`}
                      onClick={(e) => handleNavClick(e, `/downloads?tab=${tab}`)}
                      className="block py-2 pl-3 text-gray-300 font-medium"
                    >
                      {tab === "software" ? t.downloads.software : t.downloads.catalog}
                    </Link>
                    {getDownloadSubCategoriesForTab(tab).map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/downloads?tab=${sub.tab}&sub=${sub.slug}`}
                        onClick={(e) =>
                          handleNavClick(e, `/downloads?tab=${sub.tab}&sub=${sub.slug}`)
                        }
                        className="block py-1.5 pl-6 text-gray-500 text-xs"
                      >
                        {downloadSubCategoryLabel(sub, locale)}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <Link href="/contact" onClick={(e) => handleNavClick(e, "/contact")} className="block py-2">
                {t.nav.contact}
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
