"use client";

import type { CaseType } from "@/data/mock";
import type { Locale } from "@/lib/i18n";
import {
  NAV_MEGA_STYLES,
  getCasesMegaSubLinks,
  getCaseTypeLabels,
  getDownloadTabLabels,
  getDownloadsMegaSubLinks,
  getProductMegaSubLinks,
  PRODUCT_MEGA_CATEGORIES,
  splitIntoMegaColumns,
  type MegaLinkItem,
  type NavMegaCatalogLabels,
  type NavMegaSectionData,
} from "@/lib/nav-mega";
import { CASE_TYPES } from "@/lib/cases";
import { DOWNLOAD_TABS, type DownloadTab } from "@/lib/downloads";
import { getProductCategoryLabel, type ProductCategoryType } from "@/lib/product-classification";
import Link from "next/link";
import type { ReactNode } from "react";

type NavigateHandler = (e: React.MouseEvent, href: string) => void;

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
  onNavigate: NavigateHandler;
  children: ReactNode;
}) {
  return (
    <div className="min-w-[200px] flex flex-col self-stretch shrink-0">
      <div>
        <p className={NAV_MEGA_STYLES.exploreEyebrow}>{exploreLabel}</p>
        {children}
      </div>
      {viewAllHref && viewAllLabel ? (
        <Link
          href={viewAllHref}
          onClick={(e) => onNavigate(e, viewAllHref)}
          className={NAV_MEGA_STYLES.viewAll}
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
  linkClassName = NAV_MEGA_STYLES.subLink,
}: {
  title: string;
  links: MegaLinkItem[];
  firstColumnCount: number;
  restColumnSize?: number;
  onNavigate: NavigateHandler;
  linkClassName?: string;
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
            <p className={NAV_MEGA_STYLES.exploreEyebrow}>{title}</p>
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
                  className={linkClassName}
                  title={link.label}
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

export function ProductsMegaPanel({
  section,
  activeCategory,
  onCategoryHover,
  onNavigate,
  locale,
}: {
  section: NavMegaSectionData;
  activeCategory: ProductCategoryType;
  onCategoryHover: (category: ProductCategoryType) => void;
  onNavigate: NavigateHandler;
  locale: Locale;
}) {
  const subLinks = getProductMegaSubLinks(section, activeCategory);
  const subTitle = getProductCategoryLabel(activeCategory, locale);
  const firstColumnCount = activeCategory === "engineering" ? 5 : subLinks.length;

  return (
    <div className={NAV_MEGA_STYLES.panelRow}>
      <MegaMainColumn
        exploreLabel={section.exploreLabel}
        viewAllHref={section.viewAllHref}
        viewAllLabel={section.viewAllLabel}
        onNavigate={onNavigate}
      >
        <ul className="space-y-1">
          {PRODUCT_MEGA_CATEGORIES.map((category) => (
            <li key={category}>
              <button
                type="button"
                onMouseEnter={() => onCategoryHover(category)}
                onFocus={() => onCategoryHover(category)}
                className={
                  activeCategory === category
                    ? NAV_MEGA_STYLES.categoryActive
                    : NAV_MEGA_STYLES.categoryInactive
                }
              >
                {getProductCategoryLabel(category, locale)}
              </button>
            </li>
          ))}
        </ul>
      </MegaMainColumn>

      <MegaSubColumns
        title={subTitle}
        links={subLinks}
        firstColumnCount={firstColumnCount}
        restColumnSize={3}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function CasesMegaPanel({
  section,
  activeType,
  onTypeHover,
  onNavigate,
  labels,
}: {
  section: NavMegaSectionData;
  activeType: CaseType;
  onTypeHover: (type: CaseType) => void;
  onNavigate: NavigateHandler;
  labels: NavMegaCatalogLabels;
}) {
  const caseLabels = getCaseTypeLabels(labels);
  const subLinks = getCasesMegaSubLinks(section, activeType);
  const firstColumnCount = 3;
  const columns =
    subLinks.length > firstColumnCount
      ? splitIntoMegaColumns(subLinks, firstColumnCount, 2)
      : [subLinks];

  return (
    <div className={NAV_MEGA_STYLES.panelRow}>
      <MegaMainColumn
        exploreLabel={section.exploreLabel}
        viewAllHref={section.viewAllHref}
        viewAllLabel={section.viewAllLabel}
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
                className={
                  activeType === type
                    ? NAV_MEGA_STYLES.categoryLinkActive
                    : NAV_MEGA_STYLES.categoryLinkInactive
                }
              >
                {caseLabels[type]}
              </Link>
            </li>
          ))}
        </ul>
      </MegaMainColumn>

      <div className="flex gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-start flex-1 min-w-0">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="min-w-[180px] max-w-[240px]">
            {columnIndex === 0 ? (
              <p className={NAV_MEGA_STYLES.exploreEyebrow}>{caseLabels[activeType]}</p>
            ) : (
              <p className="text-[11px] mb-4 tracking-wide opacity-0 select-none" aria-hidden="true">
                {caseLabels[activeType]}
              </p>
            )}
            <ul className="space-y-1">
              {column.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    onClick={(e) => onNavigate(e, link.href)}
                    className={NAV_MEGA_STYLES.subLinkCases}
                    title={link.label}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DownloadsMegaPanel({
  section,
  activeTab,
  onTabHover,
  onNavigate,
  labels,
}: {
  section: NavMegaSectionData;
  activeTab: DownloadTab;
  onTabHover: (tab: DownloadTab) => void;
  onNavigate: NavigateHandler;
  labels: NavMegaCatalogLabels;
}) {
  const tabLabels = getDownloadTabLabels(labels);
  const subLinks = getDownloadsMegaSubLinks(section, activeTab);

  return (
    <div className={NAV_MEGA_STYLES.panelRow}>
      <MegaMainColumn
        exploreLabel={section.exploreLabel}
        viewAllHref={section.viewAllHref}
        viewAllLabel={section.viewAllLabel}
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
                className={
                  activeTab === tab
                    ? NAV_MEGA_STYLES.categoryLinkActive
                    : NAV_MEGA_STYLES.categoryLinkInactive
                }
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

/** 手机抽屉：视觉对齐 PC 大菜单（探索标签 + 大标题分类 + 子链接 + 查看全部） */
export function MobileMegaSectionLinks({
  section,
  onNavigate,
}: {
  section: NavMegaSectionData;
  onNavigate: NavigateHandler;
}) {
  return (
    <div className={NAV_MEGA_STYLES.mobileSubpanel}>
      <div className={NAV_MEGA_STYLES.mobileSubpanelInner}>
        <p className={NAV_MEGA_STYLES.exploreEyebrow}>{section.exploreLabel}</p>

        {section.categories.map((group, index) => (
          <div
            key={group.key}
            className={index > 0 ? "pt-4 border-t border-white/10" : undefined}
          >
            {group.href ? (
              <Link
                href={group.href}
                onClick={(e) => onNavigate(e, group.href!)}
                className={NAV_MEGA_STYLES.mobileCategoryLink}
              >
                {group.label}
              </Link>
            ) : (
              <p className={NAV_MEGA_STYLES.mobileCategoryHeading}>{group.label}</p>
            )}

            {group.links.length > 0 ? (
              <ul className={NAV_MEGA_STYLES.mobileSubLinkList}>
                {group.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      onClick={(e) => onNavigate(e, link.href)}
                      className={NAV_MEGA_STYLES.mobileSubLink}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        <Link
          href={section.viewAllHref}
          onClick={(e) => onNavigate(e, section.viewAllHref)}
          className={NAV_MEGA_STYLES.mobileViewAll}
        >
          {section.viewAllLabel}
        </Link>
      </div>
    </div>
  );
}
