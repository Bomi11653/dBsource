"use client";

import type { ContactInfo, QRItem, SocialLinkItem } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import ContactDetailsLayout from "@/components/contact/ContactDetailsLayout";
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
}: {
  contact: ContactInfo;
  salesContacts: SalesContactItem[];
  qrItems?: QRItem[];
  socialLinks?: SocialLinkItem[];
  productModel?: string;
  formId?: string;
  infoId?: string;
  mapId?: string;
  /** 关于页等场景仅展示联系信息与二维码 */
  showForm?: boolean;
  showSales?: boolean;
}) {
  return (
    <ContactDetailsLayout
      contact={contact}
      salesContacts={showSales ? salesContacts : []}
      qrItems={qrItems}
      socialLinks={socialLinks}
      infoId={infoId}
      mapId={mapId}
      formSlot={
        showForm ? (
          <ContactForm productModel={productModel} formId={formId} />
        ) : undefined
      }
    />
  );
}
