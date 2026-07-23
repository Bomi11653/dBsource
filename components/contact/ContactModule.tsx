"use client";

import type { ContactInfo, QRItem, SocialLinkItem } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import ContactDetailsLayout, {
  type SalesPlacement,
} from "@/components/contact/ContactDetailsLayout";
import ContactForm from "@/components/contact/ContactForm";

/**
 * 联系页 / 关于页共用的联系方式模块。
 * 视觉与布局由 ContactDetailsLayout 统一，数据由页面传入（同源 CMS）。
 */
export default function ContactModule({
  contact,
  salesContacts,
  qrItems = [],
  socialLinks = [],
  productModel = "",
  formId = "contact-form",
  infoId = "contact-info",
  mapId = "contact-map",
  showForm = true,
  showSales = true,
  salesPlacement = "default",
}: {
  contact: ContactInfo;
  salesContacts: SalesContactItem[];
  qrItems?: QRItem[];
  socialLinks?: SocialLinkItem[];
  productModel?: string;
  formId?: string;
  infoId?: string;
  mapId?: string;
  /** 关于页等场景可关闭表单 */
  showForm?: boolean;
  showSales?: boolean;
  /** default=联系页顺序；after-map=关于页通栏（地图区域之后、占满两列） */
  salesPlacement?: SalesPlacement;
}) {
  return (
    <ContactDetailsLayout
      contact={contact}
      salesContacts={showSales ? salesContacts : []}
      qrItems={qrItems}
      socialLinks={socialLinks}
      infoId={infoId}
      mapId={mapId}
      salesPlacement={salesPlacement}
      formSlot={
        showForm ? (
          <ContactForm productModel={productModel} formId={formId} />
        ) : undefined
      }
    />
  );
}
