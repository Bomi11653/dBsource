"use client";

import { usePageTransition } from "@/components/PageTransitionProvider";
import type { CaseType, ProductSeriesGroup } from "@/data/mock";
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

const CASE_TYPES: CaseType[] = ["engineering", "performance"];

const DOWNLOAD_TABS = ["software", "catalog"] as const;

function MegaTextColumn({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: { href: string; label: string; large?: boolean }[];
  onNavigate: (e: React.MouseEvent, href: string) => void;
}) {
  return (
    <div className="min-w-[180px]">
      <p className="text-[11px] text-gray-500 mb-4 tracking-wide">{title}</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              onClick={(e) => onNavigate(e, link.href)}
              className={`block py-1 transition-colors text-gray-300 hover:text-white ${
                link.large
                  ? "text-xl md:text-2xl font-semibold tracking-tight"
                  : "text-sm"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
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

  return (
    <div className="flex flex-wrap gap-12 md:gap-20 lg:gap-28">
      <div className="min-w-[200px]">
        <p className="text-[11px] text-gray-500 mb-4 tracking-wide">{t.nav.megaExplore}</p>
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
          <li className="pt-2">
            <Link
              href="/products"
              onClick={(e) => onNavigate(e, "/products")}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              {t.nav.megaViewAll}
            </Link>
          </li>
        </ul>
      </div>

      <div className="min-w-[220px]">
        <p className="text-[11px] text-gray-500 mb-4 tracking-wide">
          {seriesLabels[activeSeries]}
        </p>
        <ul className="space-y-1">
          {subItems.map((sub) => (
            <li key={sub.slug}>
              <Link
                href={`/products?series=${sub.seriesGroup}&sub=${sub.slug}`}
                onClick={(e) =>
                  onNavigate(e, `/products?series=${sub.seriesGroup}&sub=${sub.slug}`)
                }
                className="block py-1.5 text-base md:text-lg text-gray-300 hover:text-white transition-colors"
              >
                {subSeriesLabel(sub, locale)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const { navigateWithTransition } = usePageTransition();
  const [megaOpen, setMegaOpen] = useState<MegaMenu>(null);
  const [activeProductSeries, setActiveProductSeries] = useState<ProductSeriesGroup>("speaker");
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
                <div className="flex flex-wrap gap-12 md:gap-20">
                  <MegaTextColumn
                    title={t.nav.megaExplore}
                    onNavigate={handleNavClick}
                    links={[
                      ...CASE_TYPES.map((c) => ({
                        href: `/cases?type=${c}`,
                        label: caseLabels[c],
                        large: true,
                      })),
                      {
                        href: "/cases",
                        label: t.nav.megaViewAllCases,
                        large: false,
                      },
                    ]}
                  />
                </div>
              )}

              {megaOpen === "downloads" && (
                <div className="flex flex-wrap gap-12 md:gap-20">
                  <MegaTextColumn
                    title={t.nav.megaExplore}
                    onNavigate={handleNavClick}
                    links={DOWNLOAD_TABS.map((tab) => ({
                      href: `/downloads?tab=${tab}`,
                      label:
                        tab === "software"
                          ? t.downloads.software
                          : t.downloads.catalog,
                      large: true,
                    }))}
                  />
                </div>
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
                  <Link
                    key={c}
                    href={`/cases?type=${c}`}
                    onClick={(e) => handleNavClick(e, `/cases?type=${c}`)}
                    className="block py-2 pl-3 text-gray-400"
                  >
                    {caseLabels[c]}
                  </Link>
                ))}
              </div>
              <div>
                <Link href="/downloads" onClick={(e) => handleNavClick(e, "/downloads")} className="block py-2 font-medium">
                  {t.nav.downloads}
                </Link>
                {DOWNLOAD_TABS.map((tab) => (
                  <Link
                    key={tab}
                    href={`/downloads?tab=${tab}`}
                    onClick={(e) => handleNavClick(e, `/downloads?tab=${tab}`)}
                    className="block py-2 pl-3 text-gray-400"
                  >
                    {tab === "software" ? t.downloads.software : t.downloads.catalog}
                  </Link>
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
