"use client";

import type { ContactInfo, QRItem, SocialLinkItem } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import QRCarousel from "@/components/QRCarousel";
import SalesContactCards from "@/components/SalesContactCards";
import { ContactCompanySection, ContactMapSection } from "@/components/contact/ContactInfoSection";
import type { ReactNode } from "react";

export type SalesPlacement = "default" | "after-map";

type ContactDetailsLayoutProps = {
  contact: ContactInfo;
  salesContacts?: SalesContactItem[];
  qrItems?: QRItem[];
  socialLinks?: SocialLinkItem[];
  formSlot?: ReactNode;
  infoId?: string;
  mapId?: string;
  /**
   * default: 联系页现有顺序（手机：公司 → 销售 → 地图）
   * after-map: 关于页 — 销售顾问在公司/地图之后、整行通栏（lg:col-span-2）
   */
  salesPlacement?: SalesPlacement;
};

/**
 * 联系信息 + 销售顾问 + 可选表单的统一响应式布局。
 */
export default function ContactDetailsLayout({
  contact,
  salesContacts = [],
  qrItems = [],
  socialLinks = [],
  formSlot,
  infoId = "contact-info",
  mapId = "contact-map",
  salesPlacement = "default",
}: ContactDetailsLayoutProps) {
  const hasSales = salesContacts.length > 0;
  const hasQr = qrItems.length > 0;

  // 关于页：右栏仅公司+地图；销售顾问作为主 grid 第二行通栏（不被右栏宽度限制）
  if (salesPlacement === "after-map") {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-8 lg:items-start min-w-0">
        <div className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1 flex flex-col gap-6 min-w-0">
          <ContactCompanySection
            contact={contact}
            infoId={infoId}
            className="min-w-0 scroll-mt-nav"
          />
          <ContactMapSection
            contact={contact}
            mapId={mapId}
            className="min-w-0 scroll-mt-nav"
          />
        </div>

        {hasSales ? (
          <div className="order-3 lg:col-span-2 min-w-0 scroll-mt-nav">
            <SalesContactCards contacts={salesContacts} />
          </div>
        ) : null}

        {formSlot ? (
          <div className="order-4 lg:order-1 lg:col-start-1 lg:row-start-1 min-w-0">
            {formSlot}
          </div>
        ) : null}

        {hasQr ? (
          <div
            className="order-5 lg:col-span-2 min-w-0 scroll-mt-nav"
            id="contact-social"
          >
            <QRCarousel items={qrItems} socialLinks={socialLinks} embedded />
          </div>
        ) : null}
      </div>
    );
  }

  // 联系页默认：保持原布局与顺序
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-8 lg:items-stretch min-w-0">
      {formSlot ? (
        <div className="order-4 lg:order-1 lg:col-start-1 lg:row-start-1 min-w-0">
          {formSlot}
        </div>
      ) : null}

      <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-start-2 lg:row-start-1 min-w-0">
        <ContactCompanySection
          contact={contact}
          infoId={infoId}
          className="order-1 min-w-0 scroll-mt-nav"
        />
        <ContactMapSection
          contact={contact}
          mapId={mapId}
          className="order-3 min-w-0 scroll-mt-nav"
        />
      </div>

      {hasSales ? (
        <div className="order-2 lg:order-3 lg:col-span-2 min-w-0">
          <SalesContactCards contacts={salesContacts} />
        </div>
      ) : null}

      {hasQr ? (
        <div
          className="order-5 lg:order-4 lg:col-span-2 min-w-0 scroll-mt-nav"
          id="contact-social"
        >
          <QRCarousel items={qrItems} socialLinks={socialLinks} embedded />
        </div>
      ) : null}
    </div>
  );
}
