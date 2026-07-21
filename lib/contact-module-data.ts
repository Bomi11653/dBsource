import type { ContactInfo, QRItem, SocialLinkItem } from "@/data/mock";
import type { SalesContactItem } from "@/data/sales-contacts";
import {
  getContactInfo,
  getQRCodes,
  getSalesContacts,
  getSocialLinks,
} from "@/lib/fetchCMS";

/** 联系模块统一数据源（contact-info + sales-contacts + qr-codes + social-links） */
export async function getContactModuleData(): Promise<{
  contact: ContactInfo;
  salesContacts: SalesContactItem[];
  qrItems: QRItem[];
  socialLinks: SocialLinkItem[];
}> {
  const [contact, salesContacts, qrItems, socialLinks] = await Promise.all([
    getContactInfo(),
    getSalesContacts(),
    getQRCodes(),
    getSocialLinks(),
  ]);
  return { contact, salesContacts, qrItems, socialLinks };
}
