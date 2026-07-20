"use client";

import type { ContactInfo } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import SalesContactCards from "@/components/SalesContactCards";
import { ContactCompanySection, ContactMapSection } from "@/components/contact/ContactInfoSection";
import type { ReactNode } from "react";

type ContactDetailsLayoutProps = {
  contact: ContactInfo;
  salesContacts?: SalesContactItem[];
  /** 联系页表单区域（关于页不传） */
  formSlot?: ReactNode;
  infoId?: string;
  mapId?: string;
  /** contact：表单左栏 + 信息侧栏；about：大屏公司/地图双列 */
  variant?: "contact" | "about";
};

/**
 * 联系信息 + 销售顾问 + 可选表单的统一响应式布局。
 * 手机：公司 → 销售 → 地图 → 表单；PC 联系页：表单 | 公司+地图，销售通栏。
 */
export default function ContactDetailsLayout({
  contact,
  salesContacts = [],
  formSlot,
  infoId = "contact-info",
  mapId = "contact-map",
  variant = "contact",
}: ContactDetailsLayoutProps) {
  const hasSales = salesContacts.length > 0;

  if (variant === "about") {
    return (
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-stretch min-w-0">
        <ContactCompanySection
          contact={contact}
          infoId={infoId}
          balanced
          className="order-1 min-w-0 scroll-mt-nav"
        />
        {hasSales ? (
          <div className="order-2 lg:order-3 lg:col-span-2 min-w-0">
            <SalesContactCards contacts={salesContacts} />
          </div>
        ) : null}
        <ContactMapSection
          contact={contact}
          mapId={mapId}
          balanced
          className="order-3 lg:order-2 min-w-0 scroll-mt-nav"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-8 lg:items-stretch min-w-0">
      {formSlot ? (
        <div className="order-4 lg:order-1 lg:col-start-1 lg:row-start-1 min-w-0">{formSlot}</div>
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
    </div>
  );
}
