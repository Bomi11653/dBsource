"use client";

import { usePageTransition } from "@/components/PageTransitionProvider";
import { usePerformanceMode } from "@/components/PerformanceModeProvider";
import type { CaseType } from "@/data/mock";
import {
  CasesMegaPanel,
  DownloadsMegaPanel,
  MobileMegaSectionLinks,
  ProductsMegaPanel,
} from "@/components/nav/MegaMenuPanels";
import { useSiteData } from "@/components/SiteDataProvider";
import type { ProductCategoryType } from "@/lib/product-classification";
import {
  buildNavMegaSections,
  getNavMegaCatalogLabels,
  NAV_MEGA_STYLES,
  type NavMegaMenuKey,
} from "@/lib/nav-mega";
import BrandLogo from "@/components/BrandLogo";
import GlobalSearch from "@/components/GlobalSearch";
import LanguageSwitch from "./LanguageSwitch";
import { useI18n } from "./I18nProvider";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DownloadTab } from "@/lib/downloads";

export default function Navbar() {
  const { locale, t } = useI18n();
  const { resolvedMode } = usePerformanceMode();
  const { products, downloads, cases, productSeriesConfig } = useSiteData();
  const pathname = usePathname();
  const { navigateWithTransition } = usePageTransition();
  const [megaOpen, setMegaOpen] = useState<NavMegaMenuKey | null>(null);
  const [activeProductCategory, setActiveProductCategory] =
    useState<ProductCategoryType>("engineering");
  const [activeCaseType, setActiveCaseType] = useState<CaseType>("engineering");
  const [activeDownloadTab, setActiveDownloadTab] = useState<DownloadTab>("software");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<NavMegaMenuKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const catalogLabels = useMemo(() => getNavMegaCatalogLabels(t), [t]);

  const megaSections = useMemo(
    () =>
      buildNavMegaSections({
        locale,
        labels: catalogLabels,
        products,
        cases,
        downloads,
        productSeriesConfig,
      }),
    [locale, catalogLabels, products, cases, downloads, productSeriesConfig]
  );

  const megaItems = useMemo(
    () =>
      (["products", "cases", "downloads"] as const).map((key) => ({
        key,
        href: megaSections[key].href,
        label: megaSections[key].label,
      })),
    [megaSections]
  );

  const openMega = useCallback((menu: NavMegaMenuKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(menu);
    if (menu === "products") setActiveProductCategory("engineering");
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

  const shouldAnimate = resolvedMode === "high";

  return (
    <header
      className="fixed top-0 w-full z-50 bg-black/45 backdrop-blur-xl border-b border-white/10 safe-top safe-x"
      onMouseLeave={scheduleCloseMega}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 md:px-10 h-[4.25rem]">
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, "/")}
          className="flex items-center shrink-0 justify-self-start hover:opacity-90 transition-opacity"
        >
          <BrandLogo variant="nav" priority />
        </Link>

        <nav className="hidden lg:flex items-center justify-center gap-1 justify-self-center">
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "/")}
            className={navLinkClass("/")}
          >
            {catalogLabels.home}
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

          <Link
            href="/about"
            onClick={(e) => handleNavClick(e, "/about")}
            className={navLinkClass("/about")}
          >
            {catalogLabels.about}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink justify-self-end">
          <GlobalSearch
            onOpen={() => {
              setMobileOpen(false);
              setMobileSection(null);
            }}
          />
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
            initial={shouldAnimate ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldAnimate ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
            transition={{ duration: shouldAnimate ? 0.2 : 0 }}
            className={NAV_MEGA_STYLES.panelShell}
            onMouseEnter={() => openMega(megaOpen)}
          >
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
              {megaOpen === "products" && (
                <ProductsMegaPanel
                  section={megaSections.products}
                  activeCategory={activeProductCategory}
                  onCategoryHover={setActiveProductCategory}
                  onNavigate={handleNavClick}
                  locale={locale}
                />
              )}

              {megaOpen === "cases" && (
                <CasesMegaPanel
                  section={megaSections.cases}
                  activeType={activeCaseType}
                  onTypeHover={setActiveCaseType}
                  onNavigate={handleNavClick}
                  labels={catalogLabels}
                />
              )}

              {megaOpen === "downloads" && (
                <DownloadsMegaPanel
                  section={megaSections.downloads}
                  activeTab={activeDownloadTab}
                  onTabHover={setActiveDownloadTab}
                  onNavigate={handleNavClick}
                  labels={catalogLabels}
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
              initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
              aria-label={t.nav.menuClose}
              onClick={() => {
                setMobileOpen(false);
                setMobileSection(null);
              }}
            />
            <motion.nav
              initial={shouldAnimate ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={shouldAnimate ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
              transition={{ duration: shouldAnimate ? 0.22 : 0, ease: [0.22, 1, 0.36, 1] }}
              className={NAV_MEGA_STYLES.mobileDrawer}
            >
              <div className="mobile-nav-scroll px-4 sm:px-6 py-3 safe-bottom">
                <Link
                  href="/"
                  onClick={(e) => handleNavClick(e, "/")}
                  className={NAV_MEGA_STYLES.mobileNavTopLink}
                >
                  {catalogLabels.home}
                </Link>

                {megaItems.map((item) => {
                  const isExpanded = mobileSection === item.key;
                  return (
                    <div key={item.key} className="border-t border-white/10">
                      <div className="flex items-center gap-1">
                        <Link
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href)}
                          className={`${NAV_MEGA_STYLES.mobileNavSectionTrigger} flex-1 ${
                            isExpanded ? "text-brand-gold" : ""
                          }`}
                        >
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setMobileSection((prev) => (prev === item.key ? null : item.key))
                          }
                          aria-expanded={isExpanded}
                          aria-label={`${item.label} submenu`}
                          className={`touch-target touch-active flex items-center justify-center rounded-lg border transition-colors ${
                            isExpanded
                              ? "border-brand-gold/40 text-brand-gold bg-brand-gold/10"
                              : "border-white/15 text-gray-400"
                          }`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
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
                      {isExpanded ? (
                        <MobileMegaSectionLinks
                          section={megaSections[item.key]}
                          onNavigate={handleNavClick}
                        />
                      ) : null}
                    </div>
                  );
                })}

                <Link
                  href="/about"
                  onClick={(e) => handleNavClick(e, "/about")}
                  className={`${NAV_MEGA_STYLES.mobileNavTopLink} border-t border-white/10`}
                >
                  {catalogLabels.about}
                </Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
